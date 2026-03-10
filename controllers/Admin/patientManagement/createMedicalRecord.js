import { StatusCodes } from "http-status-codes";
import { BadRequest, NotFound, ServerError } from "../../../customErrors/Errors.js";
import joi from "joi";
import validateData from "../../../utils/validateData.js";
import mongoose from "mongoose";
import { mongoIdLength, bonusPercentage } from "../../../utils/constants.js";
import { emitQueueUpdate } from "../../../services/queueEmitter.js";
import _ from "lodash";

const joiSchema = joi.object({
    cardId: joi.string().optional(),
    paymentMethod: joi.string().valid('Cash', 'Card').required(),
    servicePrice: joi.number().min(0).required(),
    serviceTitle: joi.string().required(),
    patientId: joi.string().min(mongoIdLength).required(),
    serviceId: joi.string().min(mongoIdLength).required(),
    bonusDeduction: joi.number().min(0).allow(0).required(),
});

const createMedicalRecord = async (req, res, next) => {
    const { Patient, BonusCard, Payment, PatientMedicalRecord, Service } = req.models;

    if (isNaN(bonusPercentage)) throw new ServerError('BONUS_PERCENTAGE is not a number');
    const session = await mongoose.startSession();
    session.startTransaction();
    let isTransactionFailed = false;
    try {
        const data = await validateData(joiSchema, req.body);
        const { serviceId, patientId, paymentMethod, cardId, bonusDeduction, servicePrice, serviceTitle } = data;

        if (servicePrice - bonusDeduction < 0) throw new BadRequest('Bonus deduction cannot exceed the price of the service');

        const currentUnix = new Date().getTime();
        const patient = await Patient.findByIdAndUpdate(patientId, { $set: { lastSeen: currentUnix } });
        if (!patient) throw new NotFound("Patient not found, create the patient");

        const bonusCard = await BonusCard.findOneAndUpdate(
            { cardId },
            { $inc: { balance: -bonusDeduction } },
            { session, new: false }
        );
        if (bonusCard && bonusCard.balance < bonusDeduction)
            throw new BadRequest("Bonus deduction cannot exceed the balance on the card");

        const payment = new Payment({
            patientId,
            amountBeforeDeduction: servicePrice,
            bonusDeduction,
            amountFinal: servicePrice - bonusDeduction,
            servicePaid: serviceId,
            paymentMethod,
            bonusCardId: cardId ?? null,
            createdAt: currentUnix,
        });
        if (!payment) throw new BadRequest('Payment was unsuccessful');
        await payment.save({ session });

        const medRecord = new PatientMedicalRecord({
            isInpatient: false,
            serviceTitle,
            patientId,
            patientFirstName: patient.firstName,
            patientLastName: patient.lastName,
            paymentRecord: payment['_id'],
            status: 'queue',
            serviceId,
            createdAt: currentUnix,
            queueNum: 1,
        });
        if (!medRecord) throw new BadRequest("Medical record hasn't been created");

        const service = await Service.findOneAndUpdate(
            { _id: serviceId },
            { $push: { currentQueue: medRecord['_id'] } },
            { session, new: false, projection: { createdAt: 0, updatedAt: 0, description: 0 } }
        );
        if (!service) throw new BadRequest("Failed to update the service");
        if (service.price !== servicePrice || service.title !== serviceTitle)
            throw new BadRequest("Incorrect data for service is provided");

        if (service.currentQueue.length === 0) {
            medRecord.set({ queueNum: 1 });
        } else {
            const lastRecord = await PatientMedicalRecord.findById(
                service.currentQueue[service.currentQueue.length - 1]
            );
            medRecord.set({ queueNum: lastRecord.queueNum + 1 });
        }
        await medRecord.save({ session });
        await session.commitTransaction();

        // Emit real-time queue update to connected clients
        const updatedQueue = await Service.findById(serviceId).then(async (svc) => {
            if (!svc) return [];
            const records = await PatientMedicalRecord.find(
                { _id: { $in: svc.currentQueue } },
                { paymentRecord: 0, updatedAt: 0, __v: 0, mainDiagnosis: 0 }
            );
            return _.sortBy(records.map((r) => r.toObject()), 'createdAt');
        });
        emitQueueUpdate(req.tenantId, String(service.providedBy), updatedQueue);

        return res.status(StatusCodes.OK).json({ success: true, medicalRecord: medRecord, payment });
    } catch (err) {
        isTransactionFailed = true;
        return next(err);
    } finally {
        if (isTransactionFailed) await session.abortTransaction();
        await session.endSession();
    }
};

export default createMedicalRecord;