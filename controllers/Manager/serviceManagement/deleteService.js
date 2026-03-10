import { StatusCodes } from "http-status-codes";
import { NotFound } from "../../../customErrors/Errors.js";

const deleteService = async (req, res, next) => {
    const { Service, PatientMedicalRecord } = req.models;
    try {
        const { id } = req.params;
        const service = await Service.findOneAndDelete({ _id: id });
        if (!service) throw new NotFound("Service not found");

        for (const recordId of service.currentQueue) {
            await PatientMedicalRecord.findByIdAndUpdate(recordId, { $set: { status: 'toRefund' } });
        }

        return res.status(StatusCodes.OK).json({ success: true, service, msg: "Service has been deleted successfully" });
    } catch (err) {
        return next(err);
    }
};

export default deleteService;