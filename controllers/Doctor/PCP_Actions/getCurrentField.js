import { StatusCodes } from "http-status-codes";
import joi from "joi"; 
import validateData from "../../../utils/validateData.js";
import { mongoIdLength } from "../../../utils/constants.js";

const joiSchema = joi.object({
    field: joi.string().max(30).required(),
    patientId: joi.string().min(mongoIdLength).required()
});

const getCurrentCondition = async (req, res, next) => {
    const { Patient } = req.models;

    try {
        const { field, patientId } = await validateData(joiSchema, req.params); 
        const patient = await Patient.findById(patientId);

        if (!patient) {
            return res.status(StatusCodes.NOT_FOUND).json({ success: false, message: "Patient not found" });
        }

        if (!patient[field]){
            return res.status(StatusCodes.NOT_FOUND).json({ success: false, message: "Field not found" });
        }

        // send success true and current condition if exisits
        const answer = {success: true};
        answer[field] = patient[field];

        return res.status(StatusCodes.OK).json(answer);
    } catch (err) {
        return next(err);
    }
};


export default getCurrentCondition;
