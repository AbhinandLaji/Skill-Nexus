const mongoose = require('mongoose');

const directMessageSchema = new mongoose.Schema({
    conversationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Conversation',
        required: true,
        index: true
    },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    authorName: { type: String, default: 'Community member' },
    authorAvatar: { type: String, default: null },
    text: { type: String, required: true, maxlength: 4000 }
}, { timestamps: true });

module.exports = mongoose.model('DirectMessage', directMessageSchema);
