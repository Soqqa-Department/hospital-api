import { StatusCodes } from "http-status-codes";
import joi from "joi"; 
import validateData from "../../../utils/validateData.js";
import getInterval from "../../../utils/getUnixTodayInterval.js";

const joiSchema = joi.object({
    size: joi.string().regex(/^\d+$/),
    sortOrder: joi.string().valid('1','-1').regex(/^\d+$/),
    sortBy: joi.string().valid('date','price'),
    status: joi.string().valid('completed', 'toRefund', 'refunded', 'queue'),
    skip: joi.string().regex(/^\d+$/),
    isAdmin: joi.boolean().optional(),
    from: joi.number().optional(), // Unix time in ms
    to: joi.number().optional(),   // Unix time in ms
    firstName: joi.string().optional(),
    lastName: joi.string().optional(),
    serviceTitle: joi.string().optional()
});

const getMedicalRecords = async(req, res, next) => {
    const { PatientMedicalRecord, Payment } = req.models;

    try {
        const query = await validateData(joiSchema, req.query); 
        const querySize = Number(query['size']) > 0 ? Number(query['size']) : 10; 
        const sortBy = (query['sortBy'] == 'date' ? 'createdAt' : 'totalPrice'); 
        const skip = Number(query['skip']) > 0 ? Number(query['skip']) : 0; 
        const sortOrder = Number(query['sortOrder']) ? Number(query['sortOrder']) : -1; 
        const filter = {};
        let projection;

        // Фильтр по статусу
        if (query['status']) {
            filter['status'] = query['status'];
        }

        // Фильтр по дате для администратора (если указано)
        if (query['isAdmin']) {
            projection = { mainDiagnosis: 0 };
            const today = getInterval();
            filter['createdAt'] = { $gte: today.start, $lte: today.end };
        }

        // Фильтр по времени (from, to)
        if (query['from'] && query['to']) {
            filter['createdAt'] = {
                $gte: new Date(Number(query['from'])),
                $lte: new Date(Number(query['to']))
            };
        } else if (query['from']) {
            filter['createdAt'] = { $gte: new Date(Number(query['from'])) };
        } else if (query['to']) {
            filter['createdAt'] = { $lte: new Date(Number(query['to'])) };
        }

        // Поиск по имени и фамилии (firstName, lastName)
        if (query['firstName']) {
            filter['patientFirstName'] = { $regex: query['firstName'], $options: 'i' };
        }

        if (query['lastName']) {
            filter['patientLastName'] = { $regex: query['lastName'],  $options: 'i' };
        }

        // Поиск по названию услуги (serviceTitle)
        if (query['serviceTitle']) {
            filter['serviceTitle'] = { $regex: query['serviceTitle'],  $options: 'i' };
        }

        // Считаем общее количество записей по фильтрам
        const total = await PatientMedicalRecord.countDocuments(filter);

        // Получаем записи с фильтрами, сортировкой и пагинацией
        const medicalRecords = await PatientMedicalRecord.find(filter, projection)
            .skip(skip)
            .limit(querySize)
            .sort({ [sortBy]: sortOrder });

        // Обрабатываем записи для добавления информации о платежах
        for (let i = 0; i < medicalRecords.length; i++) {
            medicalRecords[i] = medicalRecords[i].toObject(); 
            if (!medicalRecords[i].isInpatient) {
                const paymentId = medicalRecords[i].paymentRecord; 
                const paymentRecord = await Payment.findById(paymentId); 
                medicalRecords[i]['price'] = paymentRecord.amountFinal; 
            }
        }

        // Возвращаем записи и общую информацию
        return res.status(StatusCodes.OK).json({
            success: true,
            medicalRecords,
            count: medicalRecords.length,
            total
        });
    } catch (err) {
        return next(err); 
    }
};

export default getMedicalRecords;
