import { StatusCodes } from "http-status-codes";
import { NotFound } from "../../../customErrors/Errors.js";

const getSingleDoctor = async (req, res, next) => {
    const { User } = req.models;
    try {
        const { id } = req.params;
        const doctor = await User.findOne({ _id: id, role: 'Doctor' });
        if (!doctor) throw new NotFound(`Doctor with ID ${id} not found`);
        return res.status(StatusCodes.OK).json({ success: true, doctor });
    } catch (err) {
        return next(err);
    }
};

export default getSingleDoctor;