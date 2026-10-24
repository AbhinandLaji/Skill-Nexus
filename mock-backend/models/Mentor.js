const mongoose = require('mongoose');

const mentorSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },
        expertise: [
            {
                type: String,
                trim: true
            }
        ],
        bio: {
            type: String,
            default: ''
        },
        achievements: {
            type: String,
            default: ''
        },
        availabilityStatus: {
            type: String,
            enum: ['available', 'busy', 'away'],
            default: 'available'
        },
        avatar: {
            type: String,
            default: null
        },
        role: {
            type: String,
            default: 'Verified Mentor'
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null
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

module.exports = mongoose.model('Mentor', mentorSchema);
