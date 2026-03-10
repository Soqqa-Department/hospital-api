import { StatusCodes } from "http-status-codes";
import { BadRequest, NotFound, ServerError } from "../../../customErrors/Errors.js";
import mongoose from "mongoose";
const bonusPercentage = Number(process.env.BONUS_PERCENTAGE);


const completeRecord = async (req, res, next) => {
    const { PatientMedicalRecord, Service, Payment, BonusCard } = req.models;

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

        const medRecord = await PatientMedicalRecord.findByIdAndUpdate(id,
            { $set: { status: "completed" } },
            { new: false, projection: recordProj }
        );
        if (!medRecord) throw new NotFound("Medical Record Not Found");
        else if (medRecord.status !== 'queue') throw new BadRequest("This record cannot be completed");

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