import mongoose from 'mongoose';

export const BonusCardSchema = new mongoose.Schema({
    balance: { type: Number, required: true, default: 0 },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    cardId: { type: String, required: true, unique: true },
});
