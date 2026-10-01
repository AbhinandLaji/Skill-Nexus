const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
    {
        channelId: {
            type: String,
            required: true,
            index: true
        },
        authorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        authorName: {
            type: String,
            default: 'Anonymous'
        },
        authorAvatar: {
            type: String,
            default: null
        },
        text: {
            type: String,
            required: true
        },
        codeSnippet: {
            language: { type: String, default: null },
            code: { type: String, default: null }
        },
        attachment: {
            fileName: { type: String, default: null },
            fileSize: { type: String, default: null },
            fileType: { type: String, default: null }
        },
        threadCount: {
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
                ret.timestamp = new Date(ret.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                delete ret.__v;
                return ret;
            }
        }
    }
);

module.exports = mongoose.model('Message', messageSchema);
