import mongoose from 'mongoose';
import { phonePattern } from '../../utils/constants.js';

export const PatientSchema = new mongoose.Schema(
    {
        firstName: { type: String, required: true },
        lastName: { type: String, required: true },
        gender: { type: String, enum: ['Male', 'Female'] },
        phoneNumber: { type: String, required: true, match: phonePattern },
        dateOfBirth: { type: Number },
        uniqueId: { type: String, unique: true, required: true },
        expiresAt: { type: Number, default: 0 },
        packages: { type: [mongoose.Types.ObjectId], default: [] },
        PCP: { type: mongoose.Types.ObjectId, default: null },
        startedAt: { type: Number, default: 0 },
        lastSeen: { type: Number, required: true },
        mainDiagnosis: { type: String },
        complaints: { type: String },
        epidemicHistory: { type: String },
        currentCondition: { type: String },
        neuroCondition: { type: String },
        medicalHistory: { type: String },
        statusLocalis: { type: String },
    },
    { timestamps: true }
);
