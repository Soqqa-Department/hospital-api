import { StatusCodes } from "http-status-codes";

const getAllAdmins = async (req, res, next) => {
    const { User } = req.models;
    try {
        const admins = await User.find({ isAdmin: true });
        return res.status(StatusCodes.OK).json({ success: true, admins });
    } catch (err) {
        return next(err);
    }
};

export default getAllAdmins;