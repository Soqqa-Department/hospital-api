import { NotFound } from "../../../customErrors/Errors.js";
import { StatusCodes } from "http-status-codes";

const getSinglePayment = async(req, res, next) => {
    const { Payment } = req.models;

    try{
        const { id } = req.params; 
        const payment = await Payment.findById(id);
        if(!payment) throw new NotFound(`Payment with ID ${id} not found`);
        return res.status(StatusCodes.OK).json({ success: true, payment });
    }catch(err){
        return next(err); 
    }
}

export default getSinglePayment; 