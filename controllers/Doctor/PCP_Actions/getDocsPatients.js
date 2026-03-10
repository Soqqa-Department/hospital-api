import { NotFound } from "../../../customErrors/Errors.js";
import { StatusCodes } from "http-status-codes";

const getDocsPatients = async (req, res, next) => {
    const { Patient, User } = req.models;
    try {
        const docId = req.userId;
        const doctor = await User.findById(docId);
        const currentUnix = new Date().getTime();
        if (!doctor || doctor.role !== 'Doctor')
            throw new NotFound(`Doctor account with ID ${docId} not found`);

        const patients = await Patient.find(
            { PCP: doctor._id, expiresAt: { $gte: currentUnix }, packages: { $exists: true, $ne: [] } },
            { firstName: 1, lastName: 1 }
        );

        return res.status(StatusCodes.OK).json({ success: true, patients });
    } catch (err) {
        return next(err);
    }
};

export default getDocsPatients;