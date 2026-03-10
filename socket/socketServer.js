import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { registerQueueHandlers } from './queueHandlers.js';

let io;

/**
 * Initialises the Socket.io server and attaches it to the given http.Server.
 * Call this once from app.js after creating the http server.
 *
 * @param {import('http').Server} httpServer
 * @returns {import('socket.io').Server}
 */
export const initSocketServer = (httpServer) => {
    io = new Server(httpServer, {
        cors: {
            origin: '*',
            methods: ['GET', 'POST'],
        },
    });

    // Authenticate every socket connection via JWT
    io.use((socket, next) => {
        const token = socket.handshake.auth?.token;
        if (!token) return next(new Error('Authentication token required'));
        jwt.verify(token, process.env.JWT_ACCESS_KEY, (err, decoded) => {
            if (err) return next(new Error('Invalid or expired token'));
            socket.userId = decoded.userId;
            socket.tenantId = decoded.tenantId;
            next();
        });
    });

    io.on('connection', (socket) => {
        console.log(`[socket] connected: userId=${socket.userId} tenant=${socket.tenantId}`);
        registerQueueHandlers(io, socket);
        socket.on('disconnect', () => {
            console.log(`[socket] disconnected: userId=${socket.userId}`);
        });
    });

    return io;
};

/**
 * Returns the initialised io instance.
 * Throws if initSocketServer() has not been called yet.
 */
export const getIo = () => {
    if (!io) throw new Error('Socket.io server has not been initialised. Call initSocketServer(httpServer) first.');
    return io;
};
