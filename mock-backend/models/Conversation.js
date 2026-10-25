const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
    type: { type: String, enum: ['direct', 'group'], required: true },
    name: { type: String, trim: true, default: '' },
    directKey: { type: String, unique: true, sparse: true, index: true },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    lastMessageText: { type: String, default: '' },
    lastMessageAt: { type: Date, default: Date.now, index: true }
}, { timestamps: true });

conversationSchema.index({ members: 1, lastMessageAt: -1 });

module.exports = mongoose.model('Conversation', conversationSchema);
