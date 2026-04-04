import mongoose from 'mongoose';

const CallLogSchema = new mongoose.Schema({
    callerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: true
    },
    calleeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: true
    },
    status: {
        type: String,
        enum: ['completed', 'missed', 'rejected', 'failed'],
        required: true
    },
    startedAt: {
        type: Date,
        default: Date.now
    },
    endedAt: {
        type: Date
    },
    duration: {
        type: Number,
        default: 0  // seconds
    }
});

const CallLog = mongoose.model('calllogs', CallLogSchema);
export default CallLog;
