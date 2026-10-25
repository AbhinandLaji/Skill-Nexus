const mongoose = require('mongoose');

const replySchema = new mongoose.Schema({
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    authorName: { type: String, default: 'Community member' },
    text: { type: String, required: true, maxlength: 4000 }
}, { timestamps: true });

const forumPostSchema = new mongoose.Schema({
    channelId: { type: mongoose.Schema.Types.ObjectId, ref: 'Channel', required: true, index: true },
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    authorName: { type: String, default: 'Community member' },
    title: { type: String, required: true, trim: true, maxlength: 160 },
    body: { type: String, required: true, trim: true, maxlength: 12000 },
    replies: [replySchema]
}, { timestamps: true });

forumPostSchema.index({ channelId: 1, updatedAt: -1 });
module.exports = mongoose.model('ForumPost', forumPostSchema);
