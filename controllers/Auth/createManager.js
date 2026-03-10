import { StatusCodes } from 'http-status-codes';
import User from '../../db/models/User.js';
import joi from 'joi';
import { Unauthorized } from '../../customErrors/Errors.js';
import validateData from '../../utils/validateData.js';

const schema = joi.object({
    firstName: joi.string().required(),
    lastName: joi.string().required(),
    username: joi.string().required(),
    password: joi.string().required(),
    phoneNumber: joi
        .string()
        .pattern(/^\+\d{5}-\d{3}-\d{2}-\d{2}$/)
        .required(),
    key: joi.string().required(),
    tenantId: joi.string().required(),
});

const createManager = async (req, res, next) => {
    try {
        const data = await validateData(schema, req.body);
        if (data.key !== process.env.MONGO_MANAGER_KEY)
            throw new Unauthorized('Invalid key provided');

        delete data.key;
        data['role'] = 'Manager';
        data['isManager'] = true;

        const manager = await User.create({ ...data });
        return res.status(StatusCodes.CREATED).json({ success: true, manager });
    } catch (err) {
        return next(err);
    }
};

export default createManager;