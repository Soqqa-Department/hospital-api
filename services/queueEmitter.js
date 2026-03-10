import { getIo } from '../socket/socketServer.js';

/**
 * Emits a real-time queue update to all sockets in the given doctor's queue room.
 *
 * Called by controllers after any queue mutation:
 *   - createMedicalRecord (patient added to queue)
 *   - completeRecord      (record marked complete, removed from queue view)
 *   - redirectForRefund   (record sent for refund, removed from queue)
 *
 * @param {string} tenantId   - Tenant identifier from req.tenantId
 * @param {string} doctorId   - The doctor whose queue was mutated
 * @param {Array}  queue      - Updated queue array to push to clients
 */
export const emitQueueUpdate = (tenantId, doctorId, queue) => {
    try {
        const io = getIo();
        io.to(`queue:${tenantId}:${doctorId}`).emit('queue:update', { queue });
    } catch {
        // socket.io not yet initialised (e.g. during unit tests) — silently skip
    }
};
