import { StatusCodes } from "http-status-codes";
import { NotFound } from "../../../customErrors/Errors.js";
const getSingleService = async (req, res, next) => {
    const { Service } = req.models;

    try{
        const { id } = req.params;
        const service = await Service.findById(id); 
        if(!service) throw new NotFound(`Service with ID ${id} not found`);
        return res.status(StatusCodes.OK).json({success: true, service});
    }catch(err){
        return next(err); 
    }
}
export default getSingleService;