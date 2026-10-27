const mongoose = require('mongoose');

const feedSchema = new mongoose.Schema(
    {
        type: {
            type: String,
            required: true,
            default: 'COMMUNITY_CREATED'
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        channel: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Channel',
            default: null
        },
        channelId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Channel',
            default: null
        },
        userName: {
            type: String,
            default: ''
        },
        userAvatar: {
            type: String,
            default: null
        },
        channelName: {
            type: String,
            default: ''
        },
        channelDescription: {
            type: String,
            default: ''
        },
        text: {
            type: String,
            default: ''
        },
        metadata: {
            type: mongoose.Schema.Types.Mixed,
            default: {}
        }
    },
    {
        timestamps: true,
        collection: 'feeds',
        toJSON: {
            virtuals: true,
            transform: (doc, ret) => {
                ret.id = ret._id.toString();
                delete ret.__v;
                return ret;
            }
        }
    }
);

module.exports = mongoose.models.Feed || mongoose.model('Feed', feedSchema);
