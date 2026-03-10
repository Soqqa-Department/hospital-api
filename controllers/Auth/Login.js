import { StatusCodes } from 'http-status-codes';
import joi from 'joi';
import { NotFound, BadRequest } from '../../customErrors/Errors.js';
import getAccessToken from '../../utils/getAccessToken.js';
import getRefreshToken from '../../utils/getRefreshToken.js';
import User from '../../db/models/User.js';
import ipRecords from '../../access-records/ipRecords.js';

const validateData = async (data) => {
    const schema = joi.object({
        username: joi.string().required(),
        password: joi.string().required(),
    });
    const { error, value } = schema.validate(data);
    if (error) throw error;
    return value;
};

const login = async (req, res, next) => {
    const requestNumber = ipRecords.get(req.ip);
    try {
        if (requestNumber > 10)
            throw new BadRequest('You have made too many attempts to log in! Try again later.');

        const { username, password } = await validateData(req.body);
        const user = await User.findOne({ username });
        if (!user) throw new NotFound('User not found');

        const isPassMatch = await user.ValidatePassword(password);
        if (!isPassMatch) throw new BadRequest('Invalid username or password');

        const tokenPayload = {
            userId: user._id,
            isAdmin: user.isAdmin,
            isManager: user.role === 'Manager',
            tenantId: user.tenantId,
        };

        const accessToken = getAccessToken(tokenPayload);
        const refreshToken = getRefreshToken(tokenPayload);

        return res.status(StatusCodes.OK).json({
            success: true,
            accessToken,
            refreshToken,
            username,
            role: user.role,
            fullname: `${user.firstName} ${user.lastName}`,
        });
    } catch (err) {
        if (requestNumber > 0) {
            ipRecords.set(req.ip, requestNumber + 1);
        } else {
            ipRecords.set(req.ip, 1);
        }
        return next(err);
    }
};

export default login;