import cron from 'node-cron';
import getModels from '../db/modelFactory.js';
import { tenants } from '../tenants.config.js';
import mongoose from 'mongoose';

const bonusPercentage = Number(process.env.BONUS_PERCENTAGE);
const instruction = '0 2 * * *';

cron.schedule(instruction, async () => {
    console.log("Starting midnight job to complete queued medical records...");

    for (const tenantId of tenants) {
        console.log(`[cron] Processing tenant: ${tenantId}`);
        const { PatientMedicalRecord, Service, Payment, BonusCard } = getModels(tenantId);

        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            if (isNaN(bonusPercentage)) throw new Error("Invalid bonus percentage in ENV");

            const records = await PatientMedicalRecord.find({ status: 'queue' });
            console.log(`[cron] tenant=${tenantId} queued records=${records.length}`);

            for (const medRecord of records) {
                await PatientMedicalRecord.findByIdAndUpdate(
                    medRecord._id,
                    { $set: { status: 'completed' } },
                    { session }
                );

                const service = await Service.findOneAndUpdate(
                    { _id: medRecord.serviceId },
                    { $pull: { currentQueue: medRecord._id } },
                    { session }
                );

                if (!medRecord.isInpatient) {
                    const payment = await Payment.findById(medRecord.paymentRecord);
                    if (payment) {
                        const bonusCard = await BonusCard.findOne(
                            { cardId: payment.bonusCardId },
                            {},
                            { session }
                        );
                        if (bonusCard && service) {
                            const adjustment = (service.price - payment.bonusDeduction) * bonusPercentage;
                            await BonusCard.findOneAndUpdate(
                                { cardId: payment.bonusCardId },
                                { $inc: { balance: adjustment } },
                                { session }
                            );
                        }
                    }
                }
            }

            await session.commitTransaction();
            console.log(`[cron] tenant=${tenantId} completed successfully.`);
        } catch (error) {
            console.error(`[cron] tenant=${tenantId} failed:`, error);
            await session.abortTransaction();
        } finally {
            session.endSession();
        }
    }

    console.log("Midnight job finished for all tenants.");
}, {
    timezone: process.env.TZ,
});
