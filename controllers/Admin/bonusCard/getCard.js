import { StatusCodes } from "http-status-codes";
import { NotFound } from "../../../customErrors/Errors.js";


const getCard = async(req, res, next) => {
    const { BonusCard } = req.models;

    try{
        const {id} = req.params; 
        const card = await BonusCard.findOne({cardId: id}); 
        if(!card) throw new NotFound(`Bonus card with ID ${id} not found`);
        return res.status(StatusCodes.OK).json({success: true, bonusCard: card}); 
    }catch(err){
        return next(err);
    }
}

export default getCard; 