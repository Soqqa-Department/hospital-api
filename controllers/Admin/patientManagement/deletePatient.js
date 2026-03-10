import { StatusCodes } from "http-status-codes";
import { BadRequest, NotFound } from "../../../customErrors/Errors.js";

const deletePatient = async(req, res, next) => {
    const { Patient, PatientMedicalRecord, Note } = req.models;

    try{
        const { id } = req.params;
        // find pending medical records of that patient 
        const pendingRecords = await PatientMedicalRecord.find(
            {
                patientId: id, 
                $or:  [ {status: 'queue'}, {status: 'toRefund'} ]
            }
        );
        if(pendingRecords.length > 0) throw new BadRequest("Patient cannot be deleted since they have pending records");
        const removedPatient = await Patient.findOneAndDelete({ _id: id });
        if(!removedPatient) throw new NotFound("Patient not found");


        // removed all the notes linked to that patient 
        const deletedNotes = await Note.deleteMany({ patientId: removedPatient._id });

        const response = {
            success: true, 
            msg: "Patient has been deleted", 
            deletedPatient: removedPatient
        }
        return res.status(StatusCodes.OK).json(response)
    }catch(err){
        return next(err); 
    }
}
export default deletePatient;