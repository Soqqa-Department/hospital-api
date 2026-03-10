import { StatusCodes } from "http-status-codes";
import joi from "joi";
import validateData from "../../../utils/validateData.js";

const dataSchema = joi.object({
    firstName: joi.string().min(2).max(20).required(),
    lastName: joi.string().min(2).max(20).required(),
    password: joi.string().min(6).required(),
    username: joi.string().min(6).required(),
    phoneNumber: joi.string().pattern(/^\+\d{5}-\d{3}-\d{2}-\d{2}$/).required(),
});

const createAdmin = async (req, res, next) => {
    const { User } = req.models;
    try {
        const data = await validateData(dataSchema, req.body);
        const admin = await User.create({ isAdmin: true, ...data, role: 'Admin', tenantId: req.tenantId });
        return res.status(StatusCodes.CREATED).json({ success: true, admin });
    } catch (err) {
        return next(err);
    }
};

export default createAdmin;