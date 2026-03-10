import { StatusCodes } from "http-status-codes";
import joi from "joi";
import validateData from "../../../utils/validateData.js";

const joiSchema = joi.object({
  startDate: joi.number().required()
});

// main controller 
const getCardStats = async (req, res, next) => {
    const { Payment, PatientMedicalRecord, Patient } = req.models;

    try {
        // Валидация периода
        const { startDate } = await validateData(joiSchema, req.query);

        // Функции для получения данных
        const getMedRecordsCount = async () => {
            return await PatientMedicalRecord.countDocuments({
                createdAt: { $gte: startDate }
            });
        };

        const getRevenue = async () => {
            const result = await Payment.aggregate([
                { $match: { createdAt: { $gte: startDate }, isRefunded: false } },
                { $group: { _id: null, totalRevenue: { $sum: "$amountFinal" } } }
            ]);
            return result.length > 0 ? result[0].totalRevenue : 0;
        };

        const getInpatientCount = async () => {
            return await Patient.countDocuments({
                createdAt: { $gte: startDate },
                expiresAt: { $ne: 0 },
                startedAt: { $ne: 0 }
            });
        };

        const getPatientsCount = async () => {
            return await Patient.countDocuments({
              createdAt: { $gte: startDate }
          });
        };

        // Получение всех данных параллельно
        const [medRecordsCount, revenue, inpatientCount, patientsCount] = await Promise.all([
            getMedRecordsCount(),
            getRevenue(),
            getInpatientCount(),
            getPatientsCount()
        ]);

        return res.status(StatusCodes.OK).json({
            success: true,
            stats: {
                medRecordsCount,
                revenue,
                inpatientCount,
                patientsCount
            }
        });

    } catch (err) {
        return next(err);
    }
};

export default getCardStats;
