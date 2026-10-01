const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true
        },
        description: {
            type: String,
            required: true
        },
        projectType: {
            type: String,
            enum: ['Hackathon', 'Long-term', 'Study Group', 'project'],
            default: 'Hackathon'
        },
        requiredSkills: [
            {
                name: { type: String, required: true },
                match: { type: Boolean, default: false }
            }
        ],
        authorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        authorName: {
            type: String,
            default: 'Anonymous Builder'
        },
        authorAvatar: {
            type: String,
            default: null
        },
        lookingForCount: {
            type: Number,
            default: 2
        },
        deadline: {
            type: String,
            default: null
        },
        joinRequests: [
            {
                user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
                requestedAt: { type: Date, default: Date.now },
                status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' }
            }
        ]
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

module.exports = mongoose.model('Team', teamSchema);
