const mongoose = require('mongoose');

const channelSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },
        skillId: {
            type: String,
            default: 'squad'
        },
        channelType: {
            type: String,
            enum: ['text', 'voice', 'forum'],
            default: 'text'
        },
        category: { type: String, trim: true, maxlength: 50, default: 'General' },
        description: {
            type: String,
            default: ''
        },
        admin: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'User',
            required: true 
        },
        members: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            }
        ],
        invitations: [{
            email: { type: String, required: true, lowercase: true, trim: true },
            invitedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
            status: { type: String, enum: ['pending', 'accepted', 'declined'], default: 'pending' },
            createdAt: { type: Date, default: Date.now }
        }],
        teamId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Team',
            default: null
        },
        isPrivate: {
            type: Boolean,
            default: false
        },
        memberCount: {
            type: Number,
            default: 1
        },
        unreadCount: {
            type: Number,
            default: 0
        }
    },
    {
        timestamps: true,
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

module.exports = mongoose.model('Channel', channelSchema);
