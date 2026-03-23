import Patient from "../../../db/models/Patient.js"; 
import { StatusCodes } from "http-status-codes";
import joi from "joi"; 
import validateData from "../../../utils/validateData.js"; 
import MedPackage from "../../../db/models/MedPackage.js"; 
import PatientMedicalRecord from "../../../db/models/PatientMedicalRecords.js";
import Service from "../../../db/models/Service.js";
import { BadRequest, NotFound } from "../../../customErrors/Errors.js"; 
import { mongoIdLength } from "../../../utils/constants.js";
import mongoose from "mongoose";
import { getIO } from "../../../socket/index.js";
import { QUEUE_NEW_RECORD } from "../../../socket/events.js";

const joiSchema = joi.object({
    serviceId: joi.string().min(mongoIdLength).required(),
    patientId: joi.string().min(mongoIdLength).required() 
}); 

const directToService = async(req, res, next) => {
    let isTransactionFailed = false; 
    const session = await mongoose.startSession();
    session.startTransaction(); 
    try{
        const docId = req.userId; 
        const data = await validateData(joiSchema, req.body); 
        const { serviceId, patientId } = data; 
        const currentTime = new Date().getTime();

        const patient = await Patient.findByIdAndUpdate(patientId, { $set: { lastSeen: currentTime } });
        
        if(!patient) throw new NotFound(`Patient with ID ${patientId} not found`); 
        else if(patient.packages.length < 1) throw new BadRequest("Patient does not have any active packages");
        
        if(patient.expiresAt - currentTime <= 0){ // check expiresAt UNIX time
            await Patient.findByIdAndUpdate(patientId, { $set: { packages: [], expiresAt: 0 } });
            throw new BadRequest("Patient's time as a static patient has expired");
        }else if(!patient.PCP){ // check if PCP is specified
            throw new BadRequest("Primary doctor is not specified. Please refer to admins."); 
        }else if(patient.PCP != docId){ // check if the doctor is indeed PCP
            throw new BadRequest(`Only doctor with ID ${patient.PCP} is allowed to manage this patient`);  
        }

        // check if the serviceId is allowed by the packages 
        const patientPackages = patient.packages; 
        let isAllowed = false; 
        
        for(let i = 0; i < patientPackages.length; i++){
            const pkgId = patientPackages[i]; 
            const pkg = await MedPackage.findById(pkgId); 

            if(pkg.servicesAllowed.includes(serviceId)){
                isAllowed = true; 
                break; 
            }
        }
        if(!isAllowed) throw new BadRequest("Patient is not allowed to use this service since it is not specified in packages!");
        //---

        // -- DANGER ZONE--
        // check if service even exists 
        const service = await Service.findById(
            serviceId, 
            {createdAt: 0, updatedAt: 0, currentQueue: 0, providedBy: 0, price: 0}
        ); 
        if(!service) throw new BadRequest(`Service with ID ${serviceId} not found`); 
        //---

        // create medical record 
        const medRecordData = {
            isInpatient: true,
            serviceId: service._id, 
            serviceTitle: service.title,
            patientId: patient._id, 
            patientFirstName: patient.firstName, 
            patientLastName: patient.lastName,
            status: 'queue',
            createdAt: currentTime,
            queueNum: 1
        }

        const medRecord = await PatientMedicalRecord.create(medRecordData);
        if(!medRecord) throw new BadRequest("Med record hasn't been created. Consult Tech Support.");
        //---

        // add medRecord to the currentQueue 
        const updatedService = await Service.findByIdAndUpdate(
            serviceId, 
            { $push: { currentQueue: medRecord._id } }, 
            { session, projection: {createdAt: 0, providedBy: 0, title: 0, price: 0 }}
        );

        if(updatedService.currentQueue.length === 0){
            medRecord.set({queueNum: 1}); 
        }else{
            const lastRecordId = updatedService.currentQueue[updatedService.currentQueue.length - 1]; 
            const lastRecord = await PatientMedicalRecord.findById(lastRecordId);
            medRecord.set({queueNum: lastRecord.queueNum + 1 });
        }
        
        await medRecord.save({session});
        await session.commitTransaction();

        // Notify all connected clients about the new queue record (WebSocket)
        try {
            getIO().of('/queue').to('queue').emit(QUEUE_NEW_RECORD, {
                medicalRecord: medRecord,
            });
        } catch (_) { /* socket may not be used in test env */ }
        //---

        const response = { 
            success: true,
            msg: 'Patient has been added to the queue', 
            medicalRecord: medRecord
        }; 
        return res.status(StatusCodes.OK).json(response); 
    }catch(err){
        isTransactionFailed = true;
        return next(err); 
    } finally{
        if(isTransactionFailed){
            await session.abortTransaction(); 
        }
        await session.endSession();
    }
}
export default directToService; 