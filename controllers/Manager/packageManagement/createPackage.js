import { StatusCodes } from "http-status-codes";
import joi from "joi"; 
import validateData from "../../../utils/validateData.js";
const joiSchema = joi.object({
    title: joi.string().required(), 
    price: joi.number().positive().required(),
    servicesAllowed: joi.array().items(joi.string().min(20)).min(1).required()
})

const createMedPackage = async (req, res, next) => {
    const { MedPackage } = req.models;

    try{
        const data = await validateData(joiSchema, req.body); 
        const newPackage = await MedPackage.create(data); 
        return res.status(StatusCodes.CREATED).json({success: true, newPackage}); 
    }catch(err){
        return next(err); 
    }
}

export default createMedPackage; 
