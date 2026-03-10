import { StatusCodes } from "http-status-codes";
import joi from "joi"; 
import validateData from "../../../utils/validateData.js"; 
import { NotFound } from "../../../customErrors/Errors.js";
import { mongoIdLength } from "../../../utils/constants.js";
const joiSchema = joi.object({
    title: joi.string().optional(),
    price: joi.number().positive().allow(0).optional(),
    packageId: joi.string().min(mongoIdLength).required()
});

const updatePackage = async (req, res, next) => {
    const { MedPackage } = req.models;

    try{
        const data = await validateData(joiSchema, req.body);
        const id = data['packageId']; 
        delete data['packageId'];  
        const updatedPackage = await MedPackage.findByIdAndUpdate(id,data); 
        if(!updatedPackage) throw new NotFound(`Package with ID ${id} not found`);  
        return res.status(StatusCodes.OK).json(
            {
                success: true, 
                msg: 'package has been updated', 
                updatedPackage
            }
        ); 
    }catch(err){
        return next(err); 
    }
}

export default updatePackage; 