import { StatusCodes } from "http-status-codes";
import joi from "joi"; 
import validateData from "../../../utils/validateData.js";
const joiSchema = joi.object({
    price: joi.number().min(0).allow(0).optional(),
    title: joi.string().optional(),
    size: joi.number().min(0).allow(-1).required(), 
})
const getServices = async(req, res, next) => {
    const { Service } = req.models;

    try{
        const query = await validateData(joiSchema,req.query);  
        const newQuery = {...query}; 
        delete newQuery['size']; 
        newQuery['isAvailable'] = true;
        let services = []
        if(query['size'] === -1){
            services = await Service.find(newQuery, {createdAt: 0, updatedAt: 0, description: 0}); 
        }else{
            services = await Service.find(newQuery, {createdAt: 0, updatedAt: 0, description: 0})
                .limit(query['size']);
        }
        services = services.map(item => {
            const temp = item.toObject();
            temp['currentQueue'] = item['currentQueue'].length;
            return temp; 
        })
        return res.status(StatusCodes.OK).json({success: true,services})
    }catch(err){
        return next(err); 
    }
}

export default getServices;