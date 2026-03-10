import { NotFound } from "../../../customErrors/Errors.js";
import { StatusCodes } from "http-status-codes";


const getSingleRecord = async(req, res, next) => {
    const { PatientMedicalRecord } = req.models;

    try{
        const { id } = req.params;
        const record = await PatientMedicalRecord.findById(id); 
        if(!record) throw new NotFound(`Medical Record with ID ${id} not found`);
        return res.status(StatusCodes.OK).json({success: true, medicalRecord: record});
    }catch(err){
        return next(err);
    }
}

export default getSingleRecord;