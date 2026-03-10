import joi from "joi";
import { StatusCodes } from "http-status-codes";
import validateData from "../../../utils/validateData.js";
import { NotFound } from "../../../customErrors/Errors.js";
import { mongoIdLength } from "../../../utils/constants.js";

const joiSchema = joi.object({
    packageId: joi.string().min(mongoIdLength).required(),
    serviceId: joi.string().min(mongoIdLength).required()
})

const removePkgService = async(req, res, next) =>{
    const { MedPackage } = req.models;

    try{
        const { serviceId, packageId } = await validateData(joiSchema, req.body); 
        const updatedPackage = await MedPackage.findByIdAndUpdate(packageId, 
            { $pull: { servicesAllowed: serviceId } }
        ); 
        if(!updatedPackage) throw new NotFound(`Package with ID ${packageId} not found`); 
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

export default removePkgService; 