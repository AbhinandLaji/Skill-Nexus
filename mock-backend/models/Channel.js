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
            required: true
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
