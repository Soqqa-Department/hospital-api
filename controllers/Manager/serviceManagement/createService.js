import { StatusCodes } from "http-status-codes";
import joi from "joi";
import validateData from "../../../utils/validateData.js";
import { NotFound } from "../../../customErrors/Errors.js";

const schema = joi.object({
    title: joi.string().required(),
    price: joi.number().positive().required(),
    description: joi.string().optional(),
    providedBy: joi.string().required(),
});

const createService = async (req, res, next) => {
    const { Service, User } = req.models;
    try {
        const data = await validateData(schema, req.body);
        const staff = await User.findOne({ _id: data['providedBy'] });
        if (!staff) throw new NotFound("Unable to find who is responsible for the service");
        const service = await Service.create(data);
        return res.status(StatusCodes.OK).json({ success: true, service, msg: "Service has been created" });
    } catch (err) {
        return next(err);
    }
};

export default createService;