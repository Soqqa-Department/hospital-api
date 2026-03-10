import { StatusCodes } from "http-status-codes";

const getRecordDiagnosis = async (req, res, next) => {
    const { PatientMedicalRecord } = req.models;

  try {
    // Validate query data using joi
    const { id } = req.params;

    // Fetch the medical record by ID
    const data = await PatientMedicalRecord.findById(id, {mainDiagnosis: 1});

    if (!data) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "Diagnosis for this record not found"
      });
    }

    return res.status(StatusCodes.OK).json({
      success: true,
      data
    });

  } catch (err) {
    return next(err);
  }
};

export default getRecordDiagnosis;
