import mongoose from "mongoose"; 
import { StatusCodes } from "http-status-codes";
import { NotFound, BadRequest } from "../../../customErrors/Errors.js";

const makeRefund = async(req, res, next) => {
    const { BonusCard, PatientMedicalRecord, Payment } = req.models;

    const session = await mongoose.startSession(); 
    session.startTransaction(); 
    let isTransactionFailed = false; 
    try{
        const medRecordId = req.params.id;
        const medRecord = await PatientMedicalRecord.findByIdAndUpdate(medRecordId, 
            { $set: { status: "refunded" } },
            { new: false, session }
        ); 
        // if status of the medRecord wasn't toRefund, throw an error 
        if(!medRecord) throw new NotFound(`Med Record with ID ${medRecordId} not found`);
        else if(medRecord.status !== 'toRefund' && medRecord.status !== 'queue') throw new BadRequest("Record is not eligible for refund");
        else if(medRecord.isInpatient) throw new BadRequest("Inpatients are not elligible for the refund");

        // find payment record 
        const paymentId = medRecord.paymentRecord; 
        const payment = await Payment.findByIdAndUpdate(paymentId, 
            { $set: { isRefunded: true } },
            { new: false, session }
        );

        // if payment was made with BonusCard, deposit the refund onto the BonusCard
        if(payment['bonusCardId']){
            const refundedBonus = payment.bonusDeduction; 
            if(refundedBonus > 0){
                const updatedBonus = await BonusCard.findOneAndUpdate({cardId: payment['bonusCardId']}, 
                    { $inc: { balance: refundedBonus } }, 
                    { session }
                ); 
                if(!updatedBonus) throw new NotFound("Invalid BonusCard ID"); // if bonus card DNE refund can't be made???
            }
        }

        await session.commitTransaction(); 
        const response = {
            success: true, 
            msg: "Refund has been made",
            medRecord
        }
        return res.status(StatusCodes.OK).json(response); 
    }catch(err){
        return next(err);
    }finally{
        if(isTransactionFailed){
            session.abortTransaction(); 
        }
        await session.endSession();
    }
}
export default makeRefund; 