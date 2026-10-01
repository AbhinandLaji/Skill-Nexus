const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },
        password: {
            type: String,
            required: true
        },
        skills: {
            type: [String],
            default: []
        },
        bio: {
            type: String,
            default: ''
        },
        batch: {
            type: String,
            default: ''
        },
        isMentor: {
            type: Boolean,
            default: false
        },
        avatar: {
            type: String,
            default: null
        },
        stats: {
            queriesResolved: { type: Number, default: 0 },
            teamsAdvised: { type: Number, default: 0 },
            sessionsLed: { type: Number, default: 0 }
        },
        projects: [
            {
                title: String,
                description: String,
                link: String
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

module.exports = mongoose.model('User', userSchema);