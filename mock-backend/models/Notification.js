const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
    {
        recipient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true
        },
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null
        },
        type: {
            type: String,
            enum: ['match_request', 'team_invite', 'announcement', 'system', 'mention', 'team_join_request', 'channel_invite'],
            required: true,
            default: 'match_request'
        },
        title: {
            type: String,
            required: true
        },
        message: {
            type: String,
            required: true
        },
        link: {
            type: String,
            default: null
        },
        read: {
            type: Boolean,
            default: false
        },
        senderName: {
            type: String,
            default: null
        },
        senderAvatar: {
            type: String,
            default: null
        },
        targetType: {
            type: String,
            default: 'team'
        },
        targetId: {
            type: String,
            default: null
        },
        targetTitle: {
            type: String,
            default: null
        },
        status: {
            type: String,
            enum: ['pending', 'accepted', 'declined', 'read'],
            default: 'pending'
        }
    },
    {
        timestamps: true,
        toJSON: {
            virtuals: true,
            transform: (doc, ret) => {
                ret.id = doc._id ? doc._id.toString() : doc.id;
                delete ret.__v;
                return ret;
            }
        }
    }
);

module.exports = mongoose.model('Notification', notificationSchema);
