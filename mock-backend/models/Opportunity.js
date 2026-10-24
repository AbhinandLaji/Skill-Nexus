const mongoose = require('mongoose');

const opportunitySchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true
        },
        organization: {
            type: String,
            required: true,
            trim: true
        },
        company: {
            type: String,
            default: function () {
                return this.organization || '';
            }
        },
        category: {
            type: String,
            enum: ['internship', 'hackathon', 'workshop', 'open_source'],
            default: 'internship'
        },
        type: {
            type: String,
            default: function () {
                return (this.category || 'internship').toUpperCase();
            }
        },
        deadline: {
            type: String,
            default: '2 weeks left'
        },
        tags: [
            {
                type: String,
                trim: true
            }
        ],
        link: {
            type: String,
            default: ''
        },
        description: {
            type: String,
            default: ''
        },
        typeColor: {
            type: String,
            default: 'primary'
        },
        icon: {
            type: String,
            default: 'work'
        },
        postedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null
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
                ret.id = doc._id ? doc._id.toString() : doc.id;
                delete ret.__v;
                return ret;
            }
        }
    }
);

module.exports = mongoose.model('Opportunity', opportunitySchema);
