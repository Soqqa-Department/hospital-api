import mongoose from 'mongoose';

export const PaymentSchema = new mongoose.Schema(
    {
        patientId: { type: mongoose.Types.ObjectId, required: true },
        paymentMethod: { type: String, required: true, enum: ['Cash', 'Card'] },
        amountBeforeDeduction: { type: Number, min: 0, required: true },
        bonusDeduction: { type: Number, min: 0, default: 0 },
        amountFinal: { type: Number, min: 0, required: true },
        packagesPaid: { type: [mongoose.Types.ObjectId] },
        servicePaid: { type: mongoose.Types.ObjectId },
        isRefunded: { type: Boolean, default: false },
        bonusCardId: { type: String }, // NOT a MongoDB ObjectId
        createdAt: { type: Number, required: true },
    },
    { timestamps: true }
);
