import { StatusCodes } from "http-status-codes";
import joi from "joi";
import validateData from "../../../utils/validateData.js";
import { mongoIdLength } from "../../../utils/constants.js";

const joiSchema = joi.object({
    size: joi.string().regex(/^\d+$/).optional(),
    patientId: joi.string().min(mongoIdLength).optional(),
    gte: joi.string().regex(/^\d+$/).optional(),
    lte: joi.string().regex(/^\d*\.?\d+/).optional(),
    skip: joi.string().regex(/^\d+$/).optional(),
    startDate: joi.string().optional(),
    endDate: joi.string().optional(),
    paymentMethod: joi.string().valid('Cash', 'Card').optional(),
});

const getPayments = async (req, res, next) => {
    const { Payment } = req.models;
    try {
        const data = await validateData(joiSchema, req.query);
        const currentTime = new Date().getTime();
        const TIME_INTERVAL = 1000 * 60 * 60 * 24 * 30 * 6;

        const size = data['size'] ? Number(data['size']) : 50;
        const skip = data['skip'] ? Number(data['skip']) : null;

        Object.entries(data).forEach(([key, value]) => {
            if (!isNaN(value)) data[key] = Number(value);
        });

        if (!data['startDate'] && !data['endDate']) {
            data['startDate'] = currentTime - TIME_INTERVAL;
            data['endDate'] = currentTime;
        } else if (!data['startDate'] && data['endDate']) {
            data['startDate'] = data['endDate'] - TIME_INTERVAL;
        } else if (data['startDate'] && !data['endDate']) {
            data['endDate'] = currentTime;
        } else if (data['endDate'] - data['startDate'] < 0) {
            data['startDate'] = currentTime - TIME_INTERVAL;
            data['endDate'] = currentTime;
        }

        let gte = 0;
        let lte = Infinity;
        if (data['gte'] >= 0) gte = data['gte'];
        if (data['lte'] >= 0) lte = data['lte'];
        if (data['lte'] <= data['gte']) lte = Infinity;

        const filter = {};
        if (data['paymentMethod']) filter.paymentMethod = data['paymentMethod'];
        if (data['patientId']) filter.patientId = data['patientId'];

        const payments = await Payment.find({
            createdAt: { $gte: data['startDate'], $lte: data['endDate'] },
            amountFinal: { $gte: gte, $lte: lte },
            ...filter,
        }).limit(size).skip(skip);

        return res.status(StatusCodes.OK).json({ success: true, payments });
    } catch (err) {
        return next(err);
    }
};

export default getPayments;