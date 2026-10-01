const express = require('express');
const Channel = require('../models/Channel');
const Message = require('../models/Message');
const Skill = require('../models/Skill');
const { protect } = require('../middleware/auth');

const router = express.Router();

const DEFAULT_CHANNELS = [
    { name: '#python-help', skillName: 'Python', memberCount: 124, unreadCount: 0 },
    { name: '#mern-stack', skillName: 'MERN Stack', memberCount: 98, unreadCount: 2 },
    { name: '#ai-ml-discussions', skillName: 'AI/ML', memberCount: 160, unreadCount: 1 },
    { name: '#dsa-prep', skillName: 'DSA', memberCount: 210, unreadCount: 0 },
    { name: '#ui-ux-critique', skillName: 'UI/UX', memberCount: 85, unreadCount: 0 },
    { name: '#cybersec-ops', skillName: 'Cybersecurity', memberCount: 64, unreadCount: 0 }
];

const DEFAULT_MESSAGES = [
    {
        authorName: 'alex_dev',
        authorAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC0Jii_4uF4eT0LTY9NdOf_Ixhu2wKTjPgjYJiG-NJBchyDKJuYBKY5i-TpT8rc1ItuFvipuiSK0VWA6ILUzKiPYfSPxByHp3NuXTkwNphykJzoHzWtRed3IPYxrsCTvHxdA1PuVo65JxnnDeXi2By76mHYmNUnJSns7l206BH6vQ4JgFlrRf3MBHAY-cMCgpdNbg7eTYggFcfQCTAKJSS9U4mZB6M1M5KUbwusR1_PnDm99i_L9-merHOz9Nj2pbIv0SQhjR8APT7s',
        text: "Hey everyone, I'm trying to optimize a pandas DataFrame merge operation. Currently it's taking about 45 seconds for 2M rows. Any tips on speeding this up?",
        threadCount: 0
    },
    {
        authorName: 'sarah_data',
        authorAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuARKDV41ZBf-aTsGxRenhhA_ieAU5UFwkQfnUdSkZeeI80IaM8AjiNw3hwPC9jjUs2sH_ABbZwtVxU9qKQPxAZ0Gv7602DF8mMty5vXlPxQISLFuHQNjdWLnv-DzbJeFiLaG6y_wv9Aesz5h7NDJk6aav2Faq5OEH4vpdJnS-D8GemCd_GLp3hmFTOHEZrk7ECW6ClbCp4iv_grzRsHHKp3ulrlc_lgx-iWldQdEqy_4lWNByO2xb3u2kzf8sSt8vUIUoYF7uhxEWx5',
        text: "Are you merging on an index or columns? Also, check if your datatypes are optimized before the merge. Downcasting float64 to float32 helps a lot!",
        codeSnippet: {
            language: 'python',
            code: 'def optimize_df(df):\n    for col in df.select_dtypes(include=["float64"]).columns:\n        df[col] = df[col].astype("float32")\n    return df'
        },
        threadCount: 0
    }
];

// GET /api/channels - List all channels
router.get('/', async (req, res) => {
    try {
        let channels = await Channel.find();

        if (!channels || channels.length === 0) {
            // Find existing skills to bind skillIds
            const skills = await Skill.find();
            const channelsToInsert = DEFAULT_CHANNELS.map((ch, idx) => {
                const matchedSkill = skills.find(s => s.name === ch.skillName);
                return {
                    name: ch.name,
                    skillId: matchedSkill ? matchedSkill._id.toString() : (idx + 1).toString(),
                    memberCount: ch.memberCount,
                    unreadCount: ch.unreadCount
                };
            });
            channels = await Channel.insertMany(channelsToInsert);
        }

        const formatted = channels.map(c => ({
            id: c._id.toString(),
            _id: c._id.toString(),
            name: c.name,
            skillId: c.skillId,
            memberCount: c.memberCount,
            unreadCount: c.unreadCount
        }));

        return res.json(formatted);
    } catch (error) {
        return res.json(
            DEFAULT_CHANNELS.map((ch, idx) => ({
                id: (idx + 1).toString(),
                name: ch.name,
                skillId: (idx + 1).toString(),
                memberCount: ch.memberCount,
                unreadCount: ch.unreadCount
            }))
        );
    }
});

// GET /api/channels/:id/messages - List messages for channel
router.get('/:id/messages', async (req, res) => {
    try {
        const { id } = req.params;
        let messages = await Message.find({ channelId: id }).sort({ createdAt: 1 });

        if (!messages || messages.length === 0) {
            // Provide default messages for initial demo feel
            const sampleMessages = DEFAULT_MESSAGES.map(m => ({
                id: Math.random().toString(36).substring(7),
                channelId: id,
                type: m.codeSnippet ? 'code' : 'text',
                authorName: m.authorName,
                authorAvatar: m.authorAvatar,
                text: m.text,
                payload: m.codeSnippet,
                timestamp: '09:45 AM',
                threadCount: m.threadCount
            }));
            return res.json(sampleMessages);
        }

        const formatted = messages.map(m => ({
            id: m._id.toString(),
            _id: m._id.toString(),
            type: m.codeSnippet && m.codeSnippet.code ? 'code' : 'text',
            authorName: m.authorName,
            authorAvatar: m.authorAvatar,
            text: m.text,
            payload: m.codeSnippet && m.codeSnippet.code ? m.codeSnippet : null,
            attachment: m.attachment && m.attachment.fileName ? m.attachment : null,
            timestamp: new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            threadCount: m.threadCount
        }));

        return res.json(formatted);
    } catch (error) {
        return res.json([]);
    }
});

// POST /api/channels/:id/messages - Post message to channel
router.post('/:id/messages', protect, async (req, res) => {
    try {
        const { id } = req.params;
        const { content, text, codeSnippet, attachment } = req.body;

        const messageText = content || text;
        if (!messageText) {
            return res.status(400).json({ message: 'Message text is required' });
        }

        const message = await Message.create({
            channelId: id,
            authorId: req.user._id,
            authorName: req.user.name || 'Anonymous',
            authorAvatar: req.user.avatar || null,
            text: messageText,
            codeSnippet: codeSnippet || null,
            attachment: attachment || null,
            threadCount: 0
        });

        const formatted = {
            id: message._id.toString(),
            _id: message._id.toString(),
            type: codeSnippet ? 'code' : 'text',
            authorName: message.authorName,
            authorAvatar: message.authorAvatar,
            text: message.text,
            timestamp: new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            threadCount: 0
        };

        return res.status(201).json({
            message: formatted,
            ...formatted
        });
    } catch (error) {
        return res.status(500).json({ message: 'Failed to send message', error: error.message });
    }
});

module.exports = router;
