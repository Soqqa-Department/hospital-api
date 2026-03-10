import joi from "joi";
import validateData from "../../../utils/validateData.js";
import { StatusCodes } from "http-status-codes";

const valSchema = joi.object({
    username: joi.string().required().min(5),
    password: joi.string().required().min(6),
    firstName: joi.string().required().min(2),
    lastName: joi.string().required().min(2),
    specialty: joi.array().items(joi.string()).required(),
    phoneNumber: joi.string().pattern(/^\+\d{5}-\d{3}-\d{2}-\d{2}$/).required(),
});

const createDoctor = async (req, res, next) => {
    const { User } = req.models;
    try {
        const data = await validateData(valSchema, req.body);
        const doctor = await User.create({ ...data, role: 'Doctor', tenantId: req.tenantId });
        return res.status(StatusCodes.CREATED).json({ success: true, doctor });
    } catch (err) {
        return next(err);
    }
};

export default createDoctor;