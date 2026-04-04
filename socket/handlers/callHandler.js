import User from '../../db/models/User.js';
import CallLog from '../../db/models/CallLog.js';
import {
    CALL_INITIATE, CALL_CANCEL, CALL_ACCEPT, CALL_REJECT, CALL_END,
    CALL_OFFER, CALL_ANSWER, CALL_ICE_CANDIDATE, CALL_TOGGLE_AVAILABILITY,
    PRESENCE_SNAPSHOT, PRESENCE_USER_JOINED, PRESENCE_USER_LEFT,
    PRESENCE_USER_UPDATED, CALL_INCOMING, CALL_CANCELLED, CALL_ACCEPTED,
    CALL_REJECTED, CALL_ENDED, CALL_BUSY, CALL_UNAVAILABLE, CALL_TIMEOUT,
    CALL_ERROR
} from '../events.js';

// ── In-memory state ─────────────────────────────────────────────────────────
// Map<userId, { socketId, fullname, role, callsAvailable, inCall }>
const onlineUsers = new Map();
// Map<callerId, { calleeId, logId, timeoutId }>  — pending (ringing) calls
const pendingCalls = new Map();
// Map<userId, partnerId>  — bidirectional: both entries exist for active calls
const activeCalls = new Map();
// ─────────────────────────────────────────────────────────────────────────────

const RING_TIMEOUT_MS = 30000; // 30 seconds

// Helper: get socket id for a userId
const getSocketId = (userId) => onlineUsers.get(userId)?.socketId;

// Helper: broadcast presence update to everyone in /calls
const broadcastUserUpdate = (ns, userId, patch) => {
    const user = onlineUsers.get(userId);
    if (!user) return;
    Object.assign(user, patch);
    ns.emit(PRESENCE_USER_UPDATED, { userId, ...patch });
};

const callHandler = async (socket) => {
    const ns = socket.nsp; // the /calls namespace
    const userId = socket.data.userId;

    // ── On connection: fetch user info from DB ───────────────────────────────
    let userDoc;
    try {
        userDoc = await User.findById(userId).select('firstName lastName role isAdmin isManager callsAvailable username').lean();
        if (!userDoc) {
            socket.emit(CALL_ERROR, { message: 'User not found' });
            socket.disconnect();
            return;
        }
    } catch (err) {
        socket.emit(CALL_ERROR, { message: 'Server error on connect' });
        socket.disconnect();
        return;
    }

    // Derive fullname
    const fullname = (userDoc.firstName && userDoc.lastName)
        ? `${userDoc.firstName} ${userDoc.lastName}`
        : userDoc.username;

    // Derive role string
    const role = userDoc.role; // 'Admin' | 'Doctor' | 'Manager'

    // Register in online users map
    onlineUsers.set(userId, {
        socketId: socket.id,
        fullname,
        role,
        callsAvailable: userDoc.callsAvailable ?? true,
        inCall: false
    });

    console.log(`[Calls] User connected: ${fullname} (${userId})`);

    // Send current online users snapshot to the newly connected user
    const snapshot = [];
    onlineUsers.forEach((data, uid) => {
        if (uid !== userId) {
            snapshot.push({ userId: uid, ...data, socketId: undefined });
        }
    });
    socket.emit(PRESENCE_SNAPSHOT, snapshot);

    // Announce this user to everyone else
    socket.broadcast.emit(PRESENCE_USER_JOINED, {
        userId,
        fullname,
        role,
        callsAvailable: onlineUsers.get(userId).callsAvailable,
        inCall: false
    });

    // ── CALL:INITIATE ────────────────────────────────────────────────────────
    socket.on(CALL_INITIATE, async ({ calleeId }) => {
        if (!calleeId || calleeId === userId) {
            socket.emit(CALL_ERROR, { message: 'Invalid callee' });
            return;
        }

        const caller = onlineUsers.get(userId);
        const callee = onlineUsers.get(calleeId);

        if (!callee || !caller) {
            socket.emit(CALL_UNAVAILABLE, {});
            return;
        }
        if (!callee.callsAvailable) {
            socket.emit(CALL_UNAVAILABLE, {});
            return;
        }
        if (callee.inCall) {
            socket.emit(CALL_BUSY, {});
            return;
        }
        if (caller.inCall) {
            socket.emit(CALL_ERROR, { message: 'You are already in a call' });
            return;
        }
        if (pendingCalls.has(userId)) {
            socket.emit(CALL_ERROR, { message: 'You already have an outgoing call' });
            return;
        }

        // Mark both as engaged
        broadcastUserUpdate(ns, userId, { inCall: 'calling' });
        broadcastUserUpdate(ns, calleeId, { inCall: 'ringing' });

        // Ring timeout
        const timeoutId = setTimeout(async () => {
            if (!pendingCalls.has(userId)) return;
            pendingCalls.delete(userId);
            broadcastUserUpdate(ns, userId, { inCall: false });
            broadcastUserUpdate(ns, calleeId, { inCall: false });

            socket.emit(CALL_TIMEOUT, {});
            const calleeSocketId = getSocketId(calleeId);
            if (calleeSocketId) ns.to(calleeSocketId).emit(CALL_TIMEOUT, {});

            // Log as missed
            try {
                await CallLog.create({
                    callerId: userId,
                    calleeId,
                    status: 'missed',
                    startedAt: new Date(),
                    endedAt: new Date(),
                    duration: 0
                });
            } catch (e) { /* non-critical */ }
        }, RING_TIMEOUT_MS);

        pendingCalls.set(userId, { calleeId, logId: null, timeoutId });

        // Notify callee
        const calleeSocketId = getSocketId(calleeId);
        if (calleeSocketId) {
            ns.to(calleeSocketId).emit(CALL_INCOMING, {
                callerId: userId,
                callerName: caller.fullname,
                callerRole: caller.role
            });
        }
    });

    // ── CALL:CANCEL (caller cancels before answer) ───────────────────────────
    socket.on(CALL_CANCEL, () => {
        const pending = pendingCalls.get(userId);
        if (!pending) return;

        clearTimeout(pending.timeoutId);
        const { calleeId } = pending;
        pendingCalls.delete(userId);

        broadcastUserUpdate(ns, userId, { inCall: false });
        broadcastUserUpdate(ns, calleeId, { inCall: false });

        const calleeSocketId = getSocketId(calleeId);
        if (calleeSocketId) ns.to(calleeSocketId).emit(CALL_CANCELLED, { callerId: userId });
    });

    // ── CALL:ACCEPT ──────────────────────────────────────────────────────────
    socket.on(CALL_ACCEPT, async ({ callerId }) => {
        const pending = pendingCalls.get(callerId);
        if (!pending || pending.calleeId !== userId) {
            socket.emit(CALL_ERROR, { message: 'No pending call from this user' });
            return;
        }

        clearTimeout(pending.timeoutId);
        pendingCalls.delete(callerId);

        // Register active call (bidirectional)
        activeCalls.set(userId, callerId);
        activeCalls.set(callerId, userId);

        broadcastUserUpdate(ns, userId, { inCall: true });
        broadcastUserUpdate(ns, callerId, { inCall: true });

        // Log call start
        let logDoc;
        try {
            logDoc = await CallLog.create({
                callerId,
                calleeId: userId,
                status: 'completed',
                startedAt: new Date()
            });
        } catch (e) { /* non-critical */ }

        // Store log id on activeCalls for later update
        if (logDoc) {
            activeCalls.set(`log_${userId}`, logDoc._id.toString());
        }

        const callerSocketId = getSocketId(callerId);
        const callee = onlineUsers.get(userId);
        if (callerSocketId) {
            ns.to(callerSocketId).emit(CALL_ACCEPTED, {
                calleeId: userId,
                calleeName: callee?.fullname
            });
        }
    });

    // ── CALL:REJECT ──────────────────────────────────────────────────────────
    socket.on(CALL_REJECT, async ({ callerId }) => {
        const pending = pendingCalls.get(callerId);
        if (!pending || pending.calleeId !== userId) return;

        clearTimeout(pending.timeoutId);
        pendingCalls.delete(callerId);

        broadcastUserUpdate(ns, userId, { inCall: false });
        broadcastUserUpdate(ns, callerId, { inCall: false });

        const callerSocketId = getSocketId(callerId);
        if (callerSocketId) ns.to(callerSocketId).emit(CALL_REJECTED, { calleeId: userId });

        try {
            await CallLog.create({
                callerId,
                calleeId: userId,
                status: 'rejected',
                startedAt: new Date(),
                endedAt: new Date(),
                duration: 0
            });
        } catch (e) { /* non-critical */ }
    });

    // ── CALL:END ─────────────────────────────────────────────────────────────
    socket.on(CALL_END, async () => {
        const partnerId = activeCalls.get(userId);
        if (!partnerId) return;

        const endedAt = new Date();
        const logId = activeCalls.get(`log_${userId}`) || activeCalls.get(`log_${partnerId}`);

        activeCalls.delete(userId);
        activeCalls.delete(partnerId);
        activeCalls.delete(`log_${userId}`);
        activeCalls.delete(`log_${partnerId}`);

        broadcastUserUpdate(ns, userId, { inCall: false });
        broadcastUserUpdate(ns, partnerId, { inCall: false });

        const partnerSocketId = getSocketId(partnerId);
        if (partnerSocketId) ns.to(partnerSocketId).emit(CALL_ENDED, {});

        if (logId) {
            try {
                const log = await CallLog.findById(logId);
                if (log) {
                    log.endedAt = endedAt;
                    log.duration = Math.round((endedAt - log.startedAt) / 1000);
                    log.status = 'completed';
                    await log.save();
                }
            } catch (e) { /* non-critical */ }
        }
    });

    // ── WebRTC Signaling relay ───────────────────────────────────────────────
    socket.on(CALL_OFFER, ({ to, sdp }) => {
        const targetSocketId = getSocketId(to);
        if (targetSocketId) ns.to(targetSocketId).emit(CALL_OFFER, { from: userId, sdp });
    });

    socket.on(CALL_ANSWER, ({ to, sdp }) => {
        const targetSocketId = getSocketId(to);
        if (targetSocketId) ns.to(targetSocketId).emit(CALL_ANSWER, { from: userId, sdp });
    });

    socket.on(CALL_ICE_CANDIDATE, ({ to, candidate }) => {
        const targetSocketId = getSocketId(to);
        if (targetSocketId) ns.to(targetSocketId).emit(CALL_ICE_CANDIDATE, { from: userId, candidate });
    });

    // ── CALL:TOGGLE-AVAILABILITY ─────────────────────────────────────────────
    socket.on(CALL_TOGGLE_AVAILABILITY, async ({ available }) => {
        broadcastUserUpdate(ns, userId, { callsAvailable: Boolean(available) });
        try {
            await User.findByIdAndUpdate(userId, { callsAvailable: Boolean(available) });
        } catch (e) { /* non-critical */ }
    });

    // ── DISCONNECT ───────────────────────────────────────────────────────────
    socket.on('disconnect', async (reason) => {
        console.log(`[Calls] User disconnected: ${fullname} (${userId}), reason: ${reason}`);

        // Handle active call
        const partnerId = activeCalls.get(userId);
        if (partnerId) {
            const endedAt = new Date();
            const logId = activeCalls.get(`log_${userId}`) || activeCalls.get(`log_${partnerId}`);

            activeCalls.delete(userId);
            activeCalls.delete(partnerId);
            activeCalls.delete(`log_${userId}`);
            activeCalls.delete(`log_${partnerId}`);

            broadcastUserUpdate(ns, partnerId, { inCall: false });
            const partnerSocketId = getSocketId(partnerId);
            if (partnerSocketId) ns.to(partnerSocketId).emit(CALL_ENDED, {});

            if (logId) {
                try {
                    const log = await CallLog.findById(logId);
                    if (log) {
                        log.endedAt = endedAt;
                        log.duration = Math.round((endedAt - log.startedAt) / 1000);
                        log.status = 'completed';
                        await log.save();
                    }
                } catch (e) { /* non-critical */ }
            }
        }

        // Handle pending call (as caller)
        const pending = pendingCalls.get(userId);
        if (pending) {
            clearTimeout(pending.timeoutId);
            pendingCalls.delete(userId);
            broadcastUserUpdate(ns, pending.calleeId, { inCall: false });
            const calleeSocketId = getSocketId(pending.calleeId);
            if (calleeSocketId) ns.to(calleeSocketId).emit(CALL_CANCELLED, { callerId: userId });
        }

        // Remove from online users and notify others
        onlineUsers.delete(userId);
        ns.emit(PRESENCE_USER_LEFT, { userId });
    });
};

export default callHandler;
