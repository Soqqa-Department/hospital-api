/**
 * Socket.IO event name constants.
 * Import these in both emitters (controllers) and handlers to keep names consistent.
 */

// Queue namespace events
export const QUEUE_NEW_RECORD = 'queue:new_record';
export const QUEUE_RECORD_UPDATED = 'queue:record_updated';

// Calls namespace events — client → server
export const CALL_INITIATE = 'call:initiate';
export const CALL_CANCEL = 'call:cancel';
export const CALL_ACCEPT = 'call:accept';
export const CALL_REJECT = 'call:reject';
export const CALL_END = 'call:end';
export const CALL_OFFER = 'call:offer';
export const CALL_ANSWER = 'call:answer';
export const CALL_ICE_CANDIDATE = 'call:ice-candidate';
export const CALL_TOGGLE_AVAILABILITY = 'call:toggle-availability';

// Calls namespace events — server → client
export const PRESENCE_SNAPSHOT = 'presence:snapshot';
export const PRESENCE_USER_JOINED = 'presence:user-joined';
export const PRESENCE_USER_LEFT = 'presence:user-left';
export const PRESENCE_USER_UPDATED = 'presence:user-updated';
export const CALL_INCOMING = 'call:incoming';
export const CALL_CANCELLED = 'call:cancelled';
export const CALL_ACCEPTED = 'call:accepted';
export const CALL_REJECTED = 'call:rejected';
export const CALL_ENDED = 'call:ended';
export const CALL_BUSY = 'call:busy';
export const CALL_UNAVAILABLE = 'call:unavailable';
export const CALL_TIMEOUT = 'call:timeout';
export const CALL_ERROR = 'call:error';
