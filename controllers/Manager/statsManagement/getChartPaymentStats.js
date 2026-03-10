import { StatusCodes } from "http-status-codes";
import joi from "joi";
import validateData from "../../../utils/validateData.js";
import { BadRequest } from "../../../customErrors/Errors.js";

// Joi схема для валидации даты
const joiSchema = joi.object({
    startDate: joi.number().required(), // Unix timestamp
    periodType: joi.string().required()
});

// Функция для форматирования даты
const formatDate = (date, periodType) => {
    const options = { day: '2-digit', month: 'short', hour: '2-digit' };
    if (periodType === 'year') {
        return date.toLocaleDateString('ru-RU', { month: 'short' }); // Для года выводим только месяц
    } else if (periodType === 'today') {
        return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString('ru-RU', options); // Пример: "01 янв."
};

// Функция для инициализации массива данных
const initializeDataArray = (length) => Array(length).fill(0);

const getLineChartData = async (req, res, next) => {
    const { Payment } = req.models;

    try {
        // Валидация входных данных
        const { startDate, periodType } = await validateData(joiSchema, req.query);
        const start = new Date(startDate); 

        let intervals = [];
        let labels = [];

        switch (periodType) {
            case "today":
                for(let i = 0; i < 24; i++){
                    const hour = i * 1000 * 60 * 60;
                    const localStart = new Date(startDate + hour);
                    const end = new Date(localStart.getTime() + hour);

                    intervals.push({
                        start: localStart,
                        end: end
                    });
            
                    labels.push(formatDate(localStart, 'today'));
                }
                break;
            case "week":
                // 7 дней
                for (let i = 0; i < 7; i++) {
                    const date = new Date(start.getTime() + i * 24 * 60 * 60 * 1000); // Добавляем дни
                    intervals.push({
                        start: date,
                        end: new Date(date.getTime() + 24 * 60 * 60 * 1000)
                    });
                    labels.push(formatDate(date, 'week'));
                }
                break;
            case "month":
                // 4 недели
                for (let i = 0; i < 4; i++) {
                    const startOfWeek = new Date(start.getTime() + i * 7 * 24 * 60 * 60 * 1000); // Начало недели
                    const endOfWeek = new Date(startOfWeek.getTime() + 7 * 24 * 60 * 60 * 1000); // Конец недели
                    
                    intervals.push({
                        start: startOfWeek,
                        end: endOfWeek
                    });
                    labels.push(`Неделя ${i + 1}`);
                }
                break;
            case "year":
                // 12 месяцев
                for (let i = 0; i < 12; i++) {
                    const newDate = new Date(start);
                    newDate.setMonth(start.getMonth() + i); // Добавляем месяцы
                    const startOfMonth = new Date(newDate.getFullYear(), newDate.getMonth(), 1); // Начало месяца
                    const endOfMonth = new Date(newDate.getFullYear(), newDate.getMonth() + 1, 0); // Конец месяца
                    intervals.push({
                        start: startOfMonth,
                        end: endOfMonth
                    });
                    labels.push(formatDate(newDate, 'year'));
                }
                break;
            default:
                throw new BadRequest('Invalid period type');
        }

        // Инициализация массивов для данных
        const nonRefundData = initializeDataArray(intervals.length);
        const refundData = initializeDataArray(intervals.length);
        

        // Агрегация по интервалам времени
        const results = await Payment.aggregate([
            {
                $match: {
                    createdAt: { $gte: start.getTime() } // Указываем фильтр по дате начала
                }
            },
            {
                $group: {
                    _id: "$createdAt",
                    nonRefundAmount: {
                        $sum: {
                            $cond: { if: { $eq: ["$isRefunded", false] }, then: "$amountFinal", else: 0 }
                        }
                    },
                    refundAmount: {
                        $sum: {
                            $cond: { if: { $eq: ["$isRefunded", true] }, then: "$amountFinal", else: 0 }
                        }
                    }
                }
            },
            {
                $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1, "_id.hour": 1 }
            }
        ]);


        // Маппинг данных из результата в интервалы
        results.forEach(result => {
            const date = new Date(result._id);
            const intervalIndex = intervals.findIndex(interval => date >= interval.start && date < interval.end);

            if (intervalIndex !== -1) {
                nonRefundData[intervalIndex] += result.nonRefundAmount; // Добавляем к текущему значению
                refundData[intervalIndex] += result.refundAmount; // Добавляем к текущему значению
            }
        });

        // Подготовка данных для графика
        const chartData = {
            labels, // Метки дат
            datasets: [
                {
                    label: 'Non-Refund Payments',
                    data: nonRefundData, // Платежи без возврата
                },
                {
                    label: 'Refund Payments',
                    data: refundData, // Платежи с возвратом
                }
            ]
        };

        return res.status(StatusCodes.OK).json({ success: true, chartData });

    } catch (err) {
        return next(err);
    }
};

export default getLineChartData;
