/**
 * Registers queue-related Socket.io event handlers for a connected socket.
 *
 * Room naming convention: queue:{tenantId}:{doctorId}
 *
 * Client usage:
 *   // Join your own queue room (doctors) or any doctor's queue room (admins)
 *   socket.emit('queue:join', { doctorId: '<optional, defaults to own userId>' });
 *
 *   // Listen for real-time queue updates
 *   socket.on('queue:update', ({ queue }) => { ... });
 *
 *   // Leave the room when navigating away
 *   socket.emit('queue:leave', { doctorId: '<optional>' });
 */
export const registerQueueHandlers = (io, socket) => {
    const resolveRoom = (doctorId) =>
        `queue:${socket.tenantId}:${doctorId ?? socket.userId}`;

    socket.on('queue:join', ({ doctorId } = {}) => {
        const room = resolveRoom(doctorId);
        socket.join(room);
        console.log(`[socket] ${socket.userId} joined room ${room}`);
    });

    socket.on('queue:leave', ({ doctorId } = {}) => {
        const room = resolveRoom(doctorId);
        socket.leave(room);
        console.log(`[socket] ${socket.userId} left room ${room}`);
    });
};
