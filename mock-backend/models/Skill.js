const mongoose = require('mongoose');

const skillSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },
        colorAccent: {
            type: String,
            default: '#48ffd5'
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

module.exports = mongoose.model('Skill', skillSchema);
