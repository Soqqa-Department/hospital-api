import jwt from 'jsonwebtoken';
import { Unauthorized } from "../customErrors/Errors.js";
import ErrorHandler from '../errorHandlers/ErrorHandler.js';
import { StatusCodes } from 'http-status-codes';
const AuthAdmin = (req, res, next) => {
    const headers = req.headers.authorization;
    try {
        if (!headers || !headers.startsWith("Bearer")) throw new Unauthorized("Not authorized to perform this action");
        const token = headers.split(' ')[1];
        if (!token) throw new Unauthorized("Not authorized to access this route");
        jwt.verify(token, process.env.JWT_ACCESS_KEY, async (err, decoded) => {
            if (err) return res.status(StatusCodes.UNAUTHORIZED).json({ success: false, msg: "Not authorized to perform this action" });
            req.userId = decoded['userId'];
            req.isAdmin = decoded['isAdmin'] ? decoded['isAdmin'] : null;
            req.tenantId = decoded['tenantId'];
            if (!req.isAdmin) return res.status(StatusCodes.UNAUTHORIZED).json({ success: false, msg: 'Not authorized to perform this action' });
            next();
        })
    } catch (err) {
        ErrorHandler(err, req, res);
    }
}
export default AuthAdmin; 