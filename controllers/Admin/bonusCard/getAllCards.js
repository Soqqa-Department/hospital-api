import { StatusCodes } from "http-status-codes";

const getAllCards = async(req, res, next) => {
    const { BonusCard } = req.models;

    try{
        const bonusCards = await BonusCard.find(); 
        const response = {
            success: true,
            bonusCards
        }; 
        return res.status(StatusCodes.OK).json(response);
    }catch(err){
        return next(err); 
    }
}

export default getAllCards; 