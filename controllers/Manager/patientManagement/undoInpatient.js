import validateData from "../../../utils/validateData.js";
import { mongoIdLength } from "../../../utils/constants.js";
import joi from "joi"; 

const joiSchema = joi.object({
  patientId: joi.string().min(mongoIdLength).required(),
  startedAt: joi.number().required(),
  packages: joi.array().items(joi.string().min(mongoIdLength)).required(),
})

const undoInpatient = async (req, res, next) => {
    const { Payments, Patient } = req.models;

  try{
    const {patientId, packages, startedAt} = await validateData(joiSchema, req.body);

    // clear Patient stationary info
    await Patient.findByIdAndUpdate(patientId, {
      PCP: null,              
      expiresAt: 0,           
      startedAt: 0,          
      packages: []         
    });

    // get all the payments of inpatient
    const payments = await Payments.find({ 
        patientId: patientId,
        packagesPaid: { $in: packages },
        isRefunded: false,
        createdAt: {$gte: startedAt}
    }).select('_id');

    // set all payments of patient to refunded
    await Payments.updateMany(
      {_id: {$in: payments}},
      {isRefunded: true}
    )
    
    res.status(200).json({
      success: true,
      message: "Inpatient service was cancelled successfully.",
      refundedPayments: payments
    });
  } catch(err){
    return next(err);
  }
}

export default undoInpatient;