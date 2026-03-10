import joi from "joi";
import validateData from "../../../utils/validateData.js";
import { StatusCodes } from "http-status-codes";
import { BadRequest, NotFound } from "../../../customErrors/Errors.js";
import getPatientId from "../../../utils/getPatientId.js";
import { mongoIdLength, phonePattern } from "../../../utils/constants.js";

const joiSchema = joi.object({
    phoneNumber: joi.string().pattern(phonePattern).optional(),
    dateOfBirth: joi.date().optional(),
    PCP: joi.string().min(mongoIdLength).optional(),
    firstName: joi.string().optional(),
    lastName: joi.string().optional(),
    gender: joi.string().valid('Male', 'Female').optional(),
    patientId: joi.string().min(mongoIdLength).required(),
});

const updatePatient = async (req, res, next) => {
    const { Patient, User } = req.models;

    try {
        const data = await validateData(joiSchema, req.body);
        const patientId = data['patientId'];
        delete data['patientId'];
        const { PCP, phoneNumber, firstName, lastName } = data;

        const patient = await Patient.findById(patientId);
        if (!patient) throw new NotFound(`Patient with ID ${patientId} not found`);

        if (PCP) {
            const doc = await User.findById(PCP);
            if (!doc || doc.role !== 'Doctor') throw new BadRequest(`Doctor with ID ${PCP} not found`);
        }

        if (phoneNumber || firstName || lastName) {
            const seed = {
                firstName: firstName ?? patient.firstName,
                lastName: lastName ?? patient.lastName,
                phoneNumber: phoneNumber ?? patient.phoneNumber,
            };
            data['uniqueId'] = getPatientId(seed);
        }

        const updatedPatient = await Patient.findByIdAndUpdate(patientId, data);
        if (!updatedPatient) throw new BadRequest("Failed to update the patient");

        return res.status(StatusCodes.OK).json({
            success: true,
            msg: "Patient has been updated",
            updatedPatient,
        });
    } catch (err) {
        return next(err);
    }
};

export default updatePatient;