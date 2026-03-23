/**
 * Queue namespace handler.
 * Registers per-connection listeners for the /queue namespace.
 *
 * Add future client→server event listeners here, e.g.:
 *   socket.on('queue:request_refresh', handler)
 */
const queueHandler = (socket) => {
    console.log(`[Socket] Client connected to /queue — userId: ${socket.data.userId}`);

    socket.join('queue'); // join the shared "queue" room so all clients receive broadcasts

    socket.on('disconnect', (reason) => {
        console.log(`[Socket] Client disconnected from /queue — userId: ${socket.data.userId}, reason: ${reason}`);
    });
};

export default queueHandler;
