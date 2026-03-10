import { StatusCodes } from "http-status-codes";
import { NotFound } from "../../../customErrors/Errors.js";


const deleteCard = async(req, res, next) => {
    const { BonusCard } = req.models;

    try{
        const { id } = req.params;
        const bonusCard = await BonusCard.findOneAndDelete({cardId: id}); 
        if(!bonusCard) throw new NotFound(`Bonus card with ID ${id} not found`);  
        return res.status(StatusCodes.OK).json({success: true, msg: 'Bonus card has been deleted'})
    }catch(err){
        return next(err); 
    }
}
export default deleteCard; 