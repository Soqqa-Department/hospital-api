import mongoose from 'mongoose';

export const MedPackageSchema = new mongoose.Schema({
    title: { type: String, required: true, unique: true },
    price: { type: Number, required: true },
    servicesAllowed: { type: [mongoose.Types.ObjectId], required: true },
});
