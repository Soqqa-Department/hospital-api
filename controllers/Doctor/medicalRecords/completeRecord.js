import PatientMedicalRecord from "../../../db/models/PatientMedicalRecords.js";
import { StatusCodes } from "http-status-codes";
import Service from "../../../db/models/Service.js";
import Payment from "../../../db/models/Payments.js";
import { BadRequest, NotFound, ServerError } from "../../../customErrors/Errors.js";
import BonusCard from "../../../db/models/BonusCard.js";
import mongoose from "mongoose";
import { getIO } from "../../../socket/index.js";
import { QUEUE_RECORD_UPDATED } from "../../../socket/events.js";
const bonusPercentage = Number(process.env.BONUS_PERCENTAGE);


const completeRecord = async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    let isTransactionFailed = false;
    try {
        if (isNaN(bonusPercentage)) throw new ServerError("ENV variable failed at completeRecord.js");
        const { id } = req.params;
        const recordProj = {
            patientFirstName: 0,
            patientLastName: 0,
            patientId: 0
        }

        const medRecord = await PatientMedicalRecord.findOneAndUpdate(
            { _id: id, status: 'queue' },  // ← only matches if status is 'queue'
            { $set: { status: "completed" } },
            { new: false, projection: recordProj }
        );

        if (!medRecord) {
            // Now distinguish between "not found" and "wrong status"
            const exists = await PatientMedicalRecord.findById(id, { _id: 1, status: 1 });
            if (!exists) throw new NotFound("Medical Record Not Found");
            else throw new BadRequest("This record cannot be completed");
        }


        // remove the record from the currentQueue of the service 
        const service = await Service.findOneAndUpdate({ _id: medRecord.serviceId },
            { $pull: { currentQueue: id } },
            { new: true }
        );

        // if record is about to be closed, deposit the bonus 
        const paymentId = medRecord.paymentRecord;
        if (!medRecord.isInpatient) {
            const payment = await Payment.findById(paymentId);
            if (!payment) throw new NotFound("Payment Record not found");
            const cardId = payment['bonusCardId'];
            const bonusCard = await BonusCard.findOne({ cardId: cardId }, {}, { session });
            if (bonusCard) {
                const adjustment = (service.price - payment.bonusDeduction) * bonusPercentage;
                await BonusCard.findOneAndUpdate({ cardId: cardId },
                    { $inc: { balance: adjustment } },
                    { session }
                );
            }
        }
        // 

        const response = {
            success: true,
            medRecord: medRecord,
            service: service,
            msg: "Med record has been completed"
        };

        await session.commitTransaction();

        // Notify all connected clients that a record status changed (WebSocket)
        try {
            getIO().of('/queue').to('queue').emit(QUEUE_RECORD_UPDATED, {
                id: id,
                status: 'completed',
            });
        } catch (_) { /* socket may not be used in test env */ }

        return res.status(StatusCodes.OK).json(response);
    } catch (err) {
        isTransactionFailed = true;
        return next(err);
    } finally {
        if (isTransactionFailed) {
            await session.abortTransaction();
        }
        await session.endSession();
    }
}

export default completeRecord; 