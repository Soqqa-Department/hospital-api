import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { UserSchema } from './schemas/userSchema.js';
import { PatientSchema } from './schemas/patientSchema.js';
import { PatientMedicalRecordSchema } from './schemas/patientMedicalRecordSchema.js';
import { ServiceSchema } from './schemas/serviceSchema.js';
import { PaymentSchema } from './schemas/paymentSchema.js';
import { BonusCardSchema } from './schemas/bonusCardSchema.js';
import { MedPackageSchema } from './schemas/medPackageSchema.js';
import { NoteSchema } from './schemas/noteSchema.js';

/** Cache: tenantId → { User, Patient, ... } */
const modelCache = new Map();

/**
 * Returns the collection name for a given model name and tenant.
 * The 'default' tenant maps to the original (un-prefixed) collection names
 * so existing data requires zero migration.
 */
const collectionName = (tenantId, name) =>
    tenantId === 'default' ? name : `${tenantId}_${name}`;

/**
 * Builds the User schema pre-save hooks and methods on a clone.
 * We must do this per-tenant because mongoose Schema objects are shared.
 */
const buildUserSchema = () => {
    const schema = UserSchema.clone();

    schema.pre('save', async function () {
        if (!this.isModified('password')) return;
        const salt = await bcrypt.genSalt();
        this.password = await bcrypt.hash(this.password, salt);
    });

    schema.methods.ValidatePassword = async function (password) {
        return bcrypt.compare(password, this.password);
    };

    return schema;
};

/**
 * Returns tenant-scoped Mongoose models.
 * Models are compiled once per tenant and cached for subsequent calls.
 *
 * @param {string} tenantId
 * @returns {{ User, Patient, PatientMedicalRecord, Service, Payment, BonusCard, MedPackage, Note }}
 */
const getModels = (tenantId) => {
    if (modelCache.has(tenantId)) {
        return modelCache.get(tenantId);
    }

    const models = {
        User: mongoose.model(
            `${tenantId}_User`,
            buildUserSchema(),
            collectionName(tenantId, 'users')
        ),
        Patient: mongoose.model(
            `${tenantId}_Patient`,
            PatientSchema.clone(),
            collectionName(tenantId, 'patients')
        ),
        PatientMedicalRecord: mongoose.model(
            `${tenantId}_PatientMedicalRecord`,
            PatientMedicalRecordSchema.clone(),
            collectionName(tenantId, 'PatientsMedicalRecords')
        ),
        Service: mongoose.model(
            `${tenantId}_Service`,
            ServiceSchema.clone(),
            collectionName(tenantId, 'Services')
        ),
        Payment: mongoose.model(
            `${tenantId}_Payment`,
            PaymentSchema.clone(),
            collectionName(tenantId, 'payments')
        ),
        BonusCard: mongoose.model(
            `${tenantId}_BonusCard`,
            BonusCardSchema.clone(),
            collectionName(tenantId, 'bonusCard')
        ),
        MedPackage: mongoose.model(
            `${tenantId}_MedPackage`,
            MedPackageSchema.clone(),
            collectionName(tenantId, 'MedPackages')
        ),
        Note: mongoose.model(
            `${tenantId}_Note`,
            NoteSchema.clone(),
            collectionName(tenantId, 'notes')
        ),
    };

    modelCache.set(tenantId, models);
    return models;
};

export default getModels;
