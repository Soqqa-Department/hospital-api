import { Server } from 'socket.io';
import socketAuth from './socketAuth.js';
import queueHandler from './handlers/queueHandler.js';

let io = null;

/**
 * Initialize the Socket.IO server and attach it to the given http.Server.
 * Call this once in app.js before httpServer.listen().
 *
 * @param {import('http').Server} httpServer
 * @returns {import('socket.io').Server} io instance
 */
export const initSocketServer = (httpServer) => {
    io = new Server(httpServer, {
        cors: {
            origin: '*',
            methods: ['GET', 'POST'],
        },
    });

    // ── /queue namespace ──────────────────────────────────────────────────────
    // Handles all queue-related real-time events.
    // To add a new feature (e.g. notifications), create a new namespace here:
    //   const notifNs = io.of('/notifications');
    //   notifNs.use(socketAuth);
    //   notifNs.on('connection', notificationHandler);
    // ─────────────────────────────────────────────────────────────────────────
    const queueNs = io.of('/queue');
    queueNs.use(socketAuth);
    queueNs.on('connection', queueHandler);

    console.log('[Socket] Socket.IO server initialized');
    return io;
};

/**
 * Returns the Socket.IO server instance.
 * Use this in controllers to emit events:
 *   getIO().of('/queue').to('queue').emit(QUEUE_NEW_RECORD, payload);
 *
 * @returns {import('socket.io').Server}
 */
export const getIO = () => {
    if (!io) {
        throw new Error('[Socket] Socket.IO server not initialized. Call initSocketServer first.');
    }
    return io;
};
