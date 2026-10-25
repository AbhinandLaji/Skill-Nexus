const mongoose = require('mongoose');

const communityEventSchema = new mongoose.Schema({
    channelId: { type: mongoose.Schema.Types.ObjectId, ref: 'Channel', required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, trim: true, maxlength: 2000, default: '' },
    startsAt: { type: Date, required: true, index: true },
    location: { type: String, trim: true, maxlength: 200, default: '' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    attendees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true });

communityEventSchema.index({ channelId: 1, startsAt: 1 });
module.exports = mongoose.model('CommunityEvent', communityEventSchema);
