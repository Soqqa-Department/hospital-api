import { StatusCodes } from "http-status-codes";
import joi from "joi";
import validateData from "../../../utils/validateData.js";
import { NotFound } from "../../../customErrors/Errors.js";

const createNote = async (req, res, next) => {
    const { Note, Patient, User } = req.models;

    const joiSchema = joi.object({
        text: joi.string().required().min(5).max(2000),
        patientId: joi.string().required(),
    });

    try {
        const docId = req.userId;
        const data = await validateData(joiSchema, req.body);
        const { patientId, text } = data;

        const doctor = await User.findById(docId, { firstName: 1, lastName: 1, specialty: 1 });
        const patient = await Patient.findById(patientId, { uniqueId: 1 });
        if (!patient) throw new NotFound(`Patient with ID ${patientId} not found`);

        const note = await Note.create({
            patientId,
            text,
            docsFirstName: doctor.firstName,
            docsLastName: doctor.lastName,
            docsSpecialty: doctor.specialty,
            createdAt: new Date().getTime(),
            writtenBy: doctor._id,
        });

        return res.status(StatusCodes.OK).json({ success: true, note });
    } catch (err) {
        return next(err);
    }
};

export default createNote;