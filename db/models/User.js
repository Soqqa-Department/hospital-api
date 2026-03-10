import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { phonePattern } from '../../utils/constants.js';

/**
 * Global (non-tenant-scoped) User model.
 * Used only for authentication (login, create-manager, refresh-token).
 * Clinical data is accessed via tenant-scoped models from the model factory.
 */
const UserSchema = new mongoose.Schema({
    tenantId: {
        type: String,
        required: true,
    },
    isAdmin: {
        type: Boolean,
        required: function () {
            return this.role === 'Admin';
        },
    },
    role: {
        type: String,
        required: true,
        enum: ['Admin', 'Doctor', 'Manager'],
    },
    username: {
        type: String,
        unique: true,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
    specialty: {
        type: [String],
        required: function () {
            if (this.role === 'Manager' || this.role === 'Admin') return false;
            return true;
        },
    },
    firstName: {
        type: String,
        required: function () {
            return !this.isAdmin;
        },
    },
    lastName: {
        type: String,
        required: function () {
            return !this.isAdmin;
        },
    },
    phoneNumber: {
        type: String,
        required: true,
        match: phonePattern,
    },
    isActive: {
        type: Boolean,
        required: function () {
            return this.role === 'Doctor';
        },
        default: true,
    },
    isManager: {
        type: Boolean,
        required: function () {
            return this.role === 'Manager';
        },
    },
});

UserSchema.pre('save', async function () {
    if (!this.isModified('password')) return;
    const salt = await bcrypt.genSalt();
    this.password = await bcrypt.hash(this.password, salt);
});

UserSchema.methods.ValidatePassword = async function (password) {
    return bcrypt.compare(password, this.password);
};

const User = mongoose.model('users', UserSchema);

export default User;