import { StatusCodes } from "http-status-codes";

const searchAdmin = async (req, res, next) => {
    const { User } = req.models;
    try {
        const query = req.query;
        const myQuery = new RegExp(query, 'i');
        const admins = await User.find({
            isAdmin: true, $or: [
                { firstName: { $regex: myQuery } },
                { lastName: { $regex: myQuery } },
                { phoneNumber: { $regex: myQuery } },
            ]
        });
        return res.status(StatusCodes.OK).json({ success: true, admins });
    } catch (err) {
        return next(err);
    }
};

export default searchAdmin;