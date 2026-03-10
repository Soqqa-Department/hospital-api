import mongoose from 'mongoose';

export const NoteSchema = new mongoose.Schema({
    text: { type: String, required: true },
    patientId: { type: mongoose.Types.ObjectId, required: true },
    docsFirstName: { type: String, required: true },
    docsLastName: { type: String, required: true },
    writtenBy: { type: mongoose.Types.ObjectId, required: true },
    docsSpecialty: { type: Array, required: true },
    createdAt: { type: Number, required: true },
});
