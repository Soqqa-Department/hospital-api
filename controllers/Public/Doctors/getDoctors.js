import joi from "joi";
import validateData from "../../../utils/validateData.js";
import { StatusCodes } from "http-status-codes";

const querySchema = joi.object({
    firstName: joi.string().optional(),
    lastName: joi.string().optional(),
    username: joi.string().optional(),
    specialty: joi.string().optional(),
    size: joi.string().regex(/^\d+$/).optional(),
    skip: joi.string().regex(/^\d+$/).optional(),
});

const getDoctors = async (req, res, next) => {
    const { User } = req.models;
    try {
        const query = await validateData(querySchema, req.query);
        const queryArray = [];
        Object.entries(query).forEach(([key, value]) => {
            if (value !== null && key !== 'size' && key !== 'skip') {
                queryArray.push({ [`${key}`]: { $regex: new RegExp(value, 'i') } });
            }
        });
        const skip = query['skip']?.length > 0 ? Number(query['skip']) : 0;
        const size = query['size']?.length > 0 ? Number(query['size']) : null;
        const filter = queryArray.length < 1
            ? { role: 'Doctor' }
            : { role: 'Doctor', $or: queryArray };
        const doctors = await User.find(filter).skip(skip).limit(size);
        return res.status(StatusCodes.OK).json({ success: true, doctors });
    } catch (err) {
        return next(err);
    }
};

export default getDoctors;