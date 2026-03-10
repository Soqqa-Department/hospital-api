import { StatusCodes } from "http-status-codes";
import joi from "joi";
import { BadRequest, NotFound } from "../../../customErrors/Errors.js";
import validateData from "../../../utils/validateData.js";
import mongoose from "mongoose";
import unixTimeToDays from "../../../utils/unixTimeToDays.js";
import { mongoIdLength } from "../../../utils/constants.js";

const joiSchema = joi.object({
    packages: joi.array().items(joi.string().min(mongoIdLength)).min(1).required(),
    expiresAt: joi.number().positive().required(),
    startedAt: joi.number().positive().required(),
    patientId: joi.string().min(mongoIdLength).required(),
    paymentMethod: joi.string().valid('Cash', 'Card').required(),
    PCP: joi.string().min(mongoIdLength).required(),
    dateOfBirth: joi.number().required(),
    gender: joi.string().valid('Male', 'Female').required()
});

const activateInpatient = async (req, res, next) => {
    const { Patient, MedPackage, Payment, User } = req.models;

    const session = await mongoose.startSession();
    session.startTransaction();
    let isTransactionFailed = false;
    try {
        const data = await validateData(joiSchema, req.body);
        const { patientId, paymentMethod, packages, expiresAt, startedAt, PCP } = data;

        const currentUnix = new Date().getTime();
        if (expiresAt - startedAt < 0) throw new BadRequest("Expiration date cannot be in the past");

        const treatmentDurationDays = unixTimeToDays(expiresAt - startedAt);

        const patient = await Patient.findById(patientId);
        if (!patient) throw new NotFound(`Patient with ID ${patientId} not found`);
        else if (!patient.dateOfBirth && !data.dateOfBirth) throw new BadRequest("Please provide date of birth");
        else if (!patient.gender && !data.gender) throw new BadRequest("Please provide a gender");
        else if (patient.expiresAt >= currentUnix) throw new BadRequest("You can have only one static activation at a time");

        const doc = await User.findById(PCP);
        if (!doc || doc.role !== 'Doctor') throw new NotFound(`Primary care physician (PCP) with ID ${PCP} is not found`);
        patient.set({ PCP });

        if (!patient.dateOfBirth && data.dateOfBirth) patient.set({ dateOfBirth: data.dateOfBirth });
        if (!patient.gender && data.gender) patient.set({ gender: data.gender });

        patient.set({ packages, startedAt, expiresAt });
        await patient.save({ session });

        let netPrice = 0;
        for (let i = 0; i < packages.length; i++) {
            const id = packages[i];
            const medPackage = await MedPackage.findById(id);
            if (!medPackage) throw new NotFound(`Package with ID ${id} not found`);
            netPrice += medPackage.price * treatmentDurationDays;
        }

        const paymentData = {
            paymentMethod,
            patientId,
            amountBeforeDeduction: netPrice,
            amountFinal: netPrice,
            packagesPaid: packages,
            createdAt: currentUnix,
        };

        const payment = await Payment.create([paymentData], { session, new: true });
        if (!payment) throw new BadRequest("Payment was unsuccessful");

        await session.commitTransaction();
        return res.status(StatusCodes.OK).json({ success: true, patient });
    } catch (err) {
        isTransactionFailed = true;
        return next(err);
    } finally {
        if (isTransactionFailed) await session.abortTransaction();
        await session.endSession();
    }
};

export default activateInpatient;