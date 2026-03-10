import { StatusCodes } from "http-status-codes";
import _ from "lodash";
import getInterval from "../../../utils/getUnixTodayInterval.js";

const getPatientsQueue = async (req, res, next) => {
    const { Service, PatientMedicalRecord } = req.models;
    try {
        const doctorId = req.userId;

        const services = await Service.find({ providedBy: doctorId, isAvailable: true }).select('title currentQueue');
        const allQueueIds = services.flatMap((s) => s.currentQueue).filter(Boolean);
        if (allQueueIds.length === 0) {
            return res.status(StatusCodes.OK).json({ success: true, queue: [] });
        }

        const today = getInterval();
        const patientRecords = await PatientMedicalRecord.find(
            {
                _id: { $in: allQueueIds },
                createdAt: { $gte: today.start, $lte: today.end },
            },
            { paymentRecord: 0, updatedAt: 0, __v: 0, mainDiagnosis: 0 }
        );

        const serviceTitleMap = services.reduce((map, service) => {
            service.currentQueue.forEach((queueId) => { map[queueId] = service.title; });
            return map;
        }, {});

        const netQueue = patientRecords.map((record) => {
            const obj = record.toObject();
            obj['serviceTitle'] = serviceTitleMap[record._id.toString()];
            return obj;
        });

        return res.status(StatusCodes.OK).json({ success: true, queue: _.sortBy(netQueue, 'createdAt') });
    } catch (err) {
        return next(err);
    }
};

export default getPatientsQueue;