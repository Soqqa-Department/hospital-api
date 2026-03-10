import { StatusCodes } from "http-status-codes";
import { NotFound } from "../../../customErrors/Errors.js";
const deletePackage = async(req, res, next) => {
    const { MedPackage, Patient } = req.models;

    try{
        const { id } = req.params; 
        const removedPackage = await MedPackage.findByIdAndDelete(id); 
        if(!removedPackage) throw new NotFound("Package to delete wasn't found");
        // if package is deleted, remove it from static patients' docs

        const patients = await Patient.updateMany({ packages: [id] }, { $pull: { packages: id } });
        const response = {
            success: true,
            removedPackage
        }
        return res.status(StatusCodes.OK).json(response);
    }catch(err){
        return next(err); 
    }
}

export default deletePackage; 