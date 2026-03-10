import { StatusCodes } from "http-status-codes";
import joi from "joi";
import validateData from "../../../utils/validateData.js";
const joiSchema = joi.object({
    price: joi.number().positive().optional(),
    size: joi.number().min(0).allow(-1).required()
})
const getMedPackages = async(req, res, next) => {
    const { MedPackage } = req.models;

    try{
        const query = await validateData(joiSchema, req.query); 
        const searchQuery = {...query}; 
        delete searchQuery['size']; 
        let packages;
        if(query['size'] === -1){
            packages = await MedPackage.find(searchQuery); 
        }else{
            packages = await MedPackage.find(searchQuery).limit(query['size']);
        }
        return res.status(StatusCodes.OK).json({success: true, packages}); 
    }catch(err){
        return next(err);
    }
}

export default getMedPackages; 