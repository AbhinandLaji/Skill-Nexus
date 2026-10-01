const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema(
    {
        text: {
            type: String,
            required: true
        },
        answeredById: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        answeredByName: {
            type: String,
            default: 'Community Member'
        },
        isMentor: {
            type: Boolean,
            default: false
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

const questionSchema = new mongoose.Schema(
    {
        question: {
            type: String,
            required: true,
            trim: true
        },
        askedById: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        askedByName: {
            type: String,
            default: 'Community Member'
        },
        skillTags: {
            type: [String],
            default: []
        },
        answerCount: {
            type: Number,
            default: 0
        },
        answers: [answerSchema]
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

module.exports = mongoose.model('Question', questionSchema);
