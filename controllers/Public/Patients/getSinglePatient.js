import { StatusCodes } from "http-status-codes";
import { NotFound } from "../../../customErrors/Errors.js";
const getSinglePatient = async (req, res, next) =>{
    const { Patient } = req.models;

    try{
        const { id } = req.params;
        const patient = await Patient.findById(id);
        if(!patient) throw new NotFound(`Patient with ID of ${id} not found`); 
        return res.status(StatusCodes.OK).json({success: true, patient});
    }catch(err){
        return next(err); 
    }
}
export default getSinglePatient;