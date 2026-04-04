import CallLog from '../../db/models/CallLog.js';

const getAllCallLogs = async (req, res, next) => {
    try {
        const logs = await CallLog.find({})
        .sort({ startedAt: -1 })
        .limit(100)
        .populate('callerId', 'firstName lastName username role')
        .populate('calleeId', 'firstName lastName username role')
        .lean();
        return res.status(200).json({ logs });
    } catch (err) {
        next(err);
    }
};

export default getAllCallLogs;
