import { StatusCodes } from "http-status-codes";
import joi from "joi"; 
import validateData from "../../../utils/validateData.js";
import { mongoIdLength } from "../../../utils/constants.js";

const joiSchema = joi.object({
    patientId: joi.string().min(mongoIdLength).required(),
    newText: joi.string().max(200).required()
});

const updateMainDiagnosis = async (req, res, next) => {
    const { Patient } = req.models;

    try{
        const { patientId, newText } = await validateData(joiSchema, req.body); 
        await Patient.findByIdAndUpdate(patientId, {$set: { mainDiagnosis: newText }});
        return res.status(StatusCodes.OK).json({success: true, current: newText}); 
    }catch(err){
        return next(err); 
    }
}

export default updateMainDiagnosis;