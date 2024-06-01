import { StatusCodes } from "http-status-codes";
import PatientMedicalRecord from "../../../db/models/PatientMedicalRecords.js";
import { BadRequest, NotFound } from "../../../customErrors/Errors.js";
import Service from "../../../db/models/Service.js";
import mongoose from "mongoose";

const redirectForRefund = async (req,res, next) => {

    const session = await mongoose.startSession();
    session.startTransaction(); 
    let isTransactionFailed = false; 
    try{
        const { id } = req.params; 
        const recordProj = {
            patientFirstName: 0, 
            patientId: 0,
            patientLastName: 0, 
            paymentRecord: 0,
            createdAt: 0
        };
        const medRecord = await PatientMedicalRecord.findByIdAndUpdate(id, 
            { $set: { status: "toRefund" } }, 
            { new: false, projection: recordProj, session }
        ); 
        
        if(!medRecord) throw new NotFound("Medical Record not found"); 
        else if(medRecord.status === 'completed') throw new BadRequest("This record has already been completed");
        else if(medRecord.status === 'refunded') throw new BadRequest("The refund has already been made"); 
        else if(medRecord.status === 'toRefund') throw new BadRequest("This record is waiting for the refund");


        const updatedService = await Service.findByIdAndUpdate(updatedRecord.serviceId, 
            {
                $pull: { currentQueue: id } 
            }, 
            {
                new: true,
                projection: {
                    price: 0, 
                    providedBy: 0
                }
            }
        );

        const response = {
            success: true, 
            medicalRecord: medRecord, 
            service: updatedService
        };

        await session.commitTransaction(); 
        return res.status(StatusCodes.OK).json(response);
    }catch(err){
        isTransactionFailed = true;
        return next(err); 
    }finally{
        if(isTransactionFailed){
            await session.abortTransaction(); 
        }
        await session.endSession();
    }
}
export default redirectForRefund;