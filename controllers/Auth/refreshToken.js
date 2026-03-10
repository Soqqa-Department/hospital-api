import StatusCodes from "http-status-codes";
import joi from "joi";
import validateData from "../../utils/validateData.js";
import verifyRefreshToken from "../../utils/verifyRefreshToken.js";
import { BadRequest } from "../../customErrors/Errors.js";
import getAccessToken from "../../utils/getAccessToken.js";
import getRefreshToken from "../../utils/getRefreshToken.js";

const joiSchema = joi.object({
    refreshToken: joi.string().min(15).required()
})

const refreshToken = async (req, res, next) => {
    try {
        const data = await validateData(joiSchema, req.body);
        const refToken = data['refreshToken'];
        const load = verifyRefreshToken(refToken);

        if (!load['userId']) throw new BadRequest("Invalid token");
        const accessToken = getAccessToken({
            userId: load['userId'],
            isAdmin: load['isAdmin'],
            isManager: load['isManager'],
            tenantId: load['tenantId'],
        });
        const newRefToken = getRefreshToken({
            userId: load['userId'],
            isAdmin: load['isAdmin'],
            isManager: load['isManager'],
            tenantId: load['tenantId'],
        });

        return res.status(StatusCodes.OK).json({ success: true, accessToken, refreshToken: newRefToken });
    } catch (err) {
        return next(err);
    }
}

export default refreshToken; 