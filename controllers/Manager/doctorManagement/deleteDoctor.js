import { StatusCodes } from "http-status-codes";
import { NotFound } from "../../../customErrors/Errors.js";

const deleteDoctor = async (req, res, next) => {
    const { User, Service, Patient, PatientMedicalRecord } = req.models;
    try {
        const { id } = req.params;
        const deletedDoctor = await User.findOneAndDelete({ role: 'Doctor', _id: id });
        if (!deletedDoctor) throw new NotFound("Doctor not found");

        const servicesToDelete = await Service.find({ providedBy: id });
        if (servicesToDelete.length > 0) {
            await Service.deleteMany({ providedBy: id });
        }

        for (const service of servicesToDelete) {
            for (const recordId of service.currentQueue) {
                await PatientMedicalRecord.findByIdAndUpdate(recordId, { $set: { status: 'toRefund' } });
            }
        }

        await Patient.updateMany({ PCP: id }, { $set: { PCP: null } });

        return res.status(StatusCodes.OK).json({
            success: true,
            msg: "Doctor has been deleted successfully",
            deletedDoctor,
        });
    } catch (err) {
        return next(err);
    }
};

export default deleteDoctor;