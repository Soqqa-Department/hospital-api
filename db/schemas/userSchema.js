import mongoose from 'mongoose';
import { phonePattern } from '../../utils/constants.js';

export const UserSchema = new mongoose.Schema({
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
