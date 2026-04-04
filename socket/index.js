import { Server } from 'socket.io';
import socketAuth from './socketAuth.js';
import queueHandler from './handlers/queueHandler.js';
import callHandler from './handlers/callHandler.js';

let io = null;

export const initSocketServer = (httpServer) => {
    io = new Server(httpServer, {
        cors: {
            origin: '*',
            methods: ['GET', 'POST'],
        },
    });

    // ── /queue namespace ──────────────────────────────────────────────────────
    const queueNs = io.of('/queue');
    queueNs.use(socketAuth);
    queueNs.on('connection', queueHandler);

    // ── /calls namespace ──────────────────────────────────────────────────────
    if (process.env.CALLS_ENABLED === 'true') {
        const callsNs = io.of('/calls');
        callsNs.use(socketAuth);
        callsNs.on('connection', callHandler);
        console.log('[Socket] /calls namespace enabled');
    }

    console.log('[Socket] Socket.IO server initialized');
    return io;
};

export const getIO = () => {
    if (!io) {
        throw new Error('[Socket] Socket.IO server not initialized. Call initSocketServer first.');
    }
    return io;
};
