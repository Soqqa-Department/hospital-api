import { StatusCodes } from 'http-status-codes';
import joi from 'joi'; 
import getPatientId from '../../../utils/getPatientId.js';
import validateData from "../../../utils/validateData.js"; 

const schema = joi.object({
    firstName: joi.string().required(),
    lastName: joi.string().required(),
    phoneNumber: joi.string().pattern(/^\+\d{5}-\d{3}-\d{2}-\d{2}$/).required(),
    dateOfBirth: joi.date().optional(),
    gender: joi.string().valid('Male','Female').optional()
})

const createPatient = async (req, res, next) => {
    const { Patient } = req.models;

    try{
        const data = await validateData(schema, req.body);  
        const seed = {
            firstName: data['firstName'],
            lastName: data['lastName'],
            phoneNumber: data['phoneNumber']
        };
        const patientID = getPatientId(seed);
        data['uniqueId'] = patientID;
        data['lastSeen'] = new Date().getTime(); 
        const patient = await Patient.create(data);
        return res.status(StatusCodes.CREATED).json({success: true, patient})
    }catch(err){
        return next(err); 
    }
}
export default createPatient; 