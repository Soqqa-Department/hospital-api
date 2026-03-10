import joi from "joi"; 
import validateData from "../../../utils/validateData.js"; 
import { StatusCodes } from "http-status-codes";
import { BadRequest } from "../../../customErrors/Errors.js";
const joiSchema = joi.object({
    firstName: joi.string().required(),
    lastName: joi.string().required(),
    cardId: joi.string().required(), 
    balance: joi.number().positive().allow(0).required() 
})

const createCard = async (req, res, next) => {
    const { BonusCard } = req.models;

    try{
        const data = await validateData(joiSchema,req.body); 
        const bonusCard = await BonusCard.create(data); 
        if(!bonusCard) throw new BadRequest("Failed to create a bonus card");  
        return res.status(StatusCodes.OK).json({success: true, bonusCard}); 
    }catch(err){
        return next(err); 
    }
}
export default createCard; 