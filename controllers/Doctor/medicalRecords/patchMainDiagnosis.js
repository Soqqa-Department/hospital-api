import { StatusCodes } from "http-status-codes";
import joi from "joi";
import validateData from "../../../utils/validateData.js";

const joiSchema = joi.object({
  mainDiagnosis: joi.string().max(200).required(),  // Validate max 200 characters
  recordId: joi.string().required()  // Ensure the record ID is provided
});

const updateRecordDiagnosis = async (req, res, next) => {
    const { PatientMedicalRecord } = req.models;

  try {
    // Validate request data using joi
    const { mainDiagnosis, recordId } = await validateData(joiSchema, req.body);

    // Update the medical record
    const updatedRecord = await PatientMedicalRecord.findByIdAndUpdate(
      recordId,
      { mainDiagnosis: mainDiagnosis },
      { new: true }  // Return the updated record
    );

    if (!updatedRecord) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "Medical record not found"
      });
    }

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Main diagnosis updated successfully"
    });

  } catch (err) {
    return next(err);
  }
};

export default updateRecordDiagnosis;
