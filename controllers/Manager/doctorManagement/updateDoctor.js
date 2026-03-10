import { StatusCodes } from "http-status-codes";
import joi from "joi";
import validateData from "../../../utils/validateData.js";
import { BadRequest, NotFound } from "../../../customErrors/Errors.js";
import { mongoIdLength, phonePattern } from "../../../utils/constants.js";

const joiSchema = joi.object({
    firstName: joi.string().optional(),
    lastName: joi.string().optional(),
    phoneNumber: joi.string().pattern(phonePattern).optional(),
    username: joi.string().optional(),
    specialty: joi.array().items(joi.string()),
    doctorId: joi.string().min(mongoIdLength).required(),
});

const updateDoctor = async (req, res, next) => {
    const { User } = req.models;
    try {
        const data = await validateData(joiSchema, req.body);
        if (data['username']) {
            const isTaken = await User.findOne({ username: data['username'] });
            if (isTaken) throw new BadRequest(`Username ${data['username']} is already taken`);
        }
        const doctorId = data['doctorId'];
        delete data['doctorId'];
        const updatedDoctor = await User.findOneAndUpdate({ _id: doctorId, role: 'Doctor' }, data);
        if (!updatedDoctor) throw new NotFound(`Doctor with ID ${doctorId} not found`);
        return res.status(StatusCodes.OK).json({ success: true, msg: 'Doctor has been updated', updatedDoctor });
    } catch (err) {
        return next(err);
    }
};

export default updateDoctor;