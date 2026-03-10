import { StatusCodes } from "http-status-codes";
import { NotFound, BadRequest } from "../../../customErrors/Errors.js";
import unixTimeToDays from "../../../utils/unixTimeToDays.js";

const makeInpatientRefund = async(req, res, next) => {
    const { Patient, Payment } = req.models;

    try{
        const {id} = req.params;
        const now = (new Date()).getTime();

        const projection = {
          _id: 1,
          firstName: 1,
          lastName: 1,
          startedAt: 1,
          expiresAt: 1,
          packages: 1
        };

        // get patient and it's packages
        const patient = (await Patient.find({_id: id}, projection)
          .populate({
            path: 'packages', 
            model: 'MedPackages', 
            select: '_id price'
          }))[0];
        
        // if user not exists and validate
        if(!patient) throw new NotFound(`Patient with ID ${id} not found`);
        else if(!patient.expiresAt || !patient.startedAt){
          throw new BadRequest(`Your user has no active inpatient period!`);
        }
        else if(!patient.packages || patient.packages.length < 1){
          throw new BadRequest(`No active packages for that user, cannot refund.`);
        }

        // calculate values
        let priceSum = 0;
        for (let i = 0; i<patient.packages.length; i++){
          priceSum += patient.packages[i].price;
        }

        const daysLeft = unixTimeToDays(patient.expiresAt - now);
        const totalDays = unixTimeToDays(patient.expiresAt - patient.startedAt);

        const refundMoney = priceSum * daysLeft;
        const totalMoney = priceSum * totalDays;

        // find payment record and update
        const payment = await Payment.findOneAndUpdate({
          patientId: id,
          packagesPaid: { $in: patient.packages.map(x=>x._id) },
          isRefunded: false,
          createdAt: {$gte: patient.startedAt},
          amountFinal: totalMoney
        }, 
            { $set: { 
              amountFinal: totalMoney - refundMoney,
              amountBeforeDeduction: totalMoney - refundMoney
             } 
            },
            { new: false }
        );

        // clear up
        await Patient.findByIdAndUpdate(id, {        
          expiresAt: now                         
        });

        const response = {
            success: true, 
            msg: "Refund has been made",
            refundMoney,
            payment
        }
        return res.status(StatusCodes.OK).json(response); 
    }catch(err){
        return next(err);
    }
}

export default makeInpatientRefund; 