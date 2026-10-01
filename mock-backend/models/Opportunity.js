const mongoose = require('mongoose');

const opportunitySchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true
        },
        type: {
            type: String,
            enum: ['INTERNSHIP', 'HACKATHON', 'EVENT'],
            default: 'INTERNSHIP'
        },
        typeColor: {
            type: String,
            default: 'primary'
        },
        company: {
            type: String,
            default: ''
        },
        deadline: {
            type: String,
            default: 'Ends in 3 days'
        },
        icon: {
            type: String,
            default: 'schedule'
        },
        description: {
            type: String,
            default: ''
        },
        applicants: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
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

module.exports = mongoose.model('Opportunity', opportunitySchema);
