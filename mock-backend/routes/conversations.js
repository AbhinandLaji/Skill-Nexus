const express = require('express');
const Conversation = require('../models/Conversation');
const DirectMessage = require('../models/DirectMessage');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();
const idOf = (value) => String(value?._id || value?.id || value);
const isMember = (conversation, userId) => conversation.members.some((member) => idOf(member) === idOf(userId));

const formatMessage = (message) => ({
    id: message._id.toString(),
    conversationId: idOf(message.conversationId),
    authorId: idOf(message.author),
    authorName: message.authorName,
    authorAvatar: message.authorAvatar,
    text: message.text,
    createdAt: message.createdAt
});

const formatConversation = (conversation) => ({
    id: conversation._id.toString(),
    type: conversation.type,
    name: conversation.name || '',
    members: (conversation.members || []).map((member) => ({
        id: idOf(member),
        name: member.name || 'Community member',
        email: member.email || '',
        avatar: member.avatar || null
    })),
    lastMessageText: conversation.lastMessageText || '',
    lastMessageAt: conversation.lastMessageAt
});

router.get('/', protect, async (req, res) => {
    try {
        const conversations = await Conversation.find({ members: req.user._id })
            .populate('members', 'name email avatar')
            .sort({ lastMessageAt: -1, createdAt: -1 });
        return res.json(conversations.map(formatConversation));
    } catch (error) {
        return res.status(500).json({ message: 'Failed to load conversations' });
    }
});

router.post('/', protect, async (req, res) => {
    try {
        const emailValues = Array.isArray(req.body.emails) ? req.body.emails : [req.body.email];
        const emails = [...new Set(emailValues
            .map((email) => String(email || '').trim().toLowerCase())
            .filter(Boolean))];
        if (emails.length < 1 || emails.length > 7 || emails.some((email) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) {
            return res.status(400).json({ message: 'Enter between 1 and 7 valid member email addresses.' });
        }

        const users = await User.find({ email: { $in: emails } }).select('_id name email avatar');
        if (users.length !== emails.length) {
            return res.status(404).json({ message: 'One or more email addresses do not match a registered account.' });
        }

        const members = new Map([[idOf(req.user._id), req.user._id]]);
        users.forEach((user) => members.set(idOf(user._id), user._id));
        const memberIds = [...members.values()];
        if (memberIds.length < 2) return res.status(400).json({ message: 'Choose at least one person other than yourself.' });
        const type = memberIds.length === 2 ? 'direct' : 'group';

        if (type === 'direct') {
            const directKey = memberIds.map(idOf).sort().join(':');
            let conversation = await Conversation.findOne({ directKey });
            if (!conversation) {
                try {
                    conversation = await Conversation.create({
                        type,
                        directKey,
                        members: memberIds,
                        createdBy: req.user._id
                    });
                } catch (error) {
                    if (error.code !== 11000) throw error;
                    conversation = await Conversation.findOne({ directKey });
                }
            }
            await conversation.populate('members', 'name email avatar');
            return res.status(200).json(formatConversation(conversation));
        }

        const name = String(req.body.name || '').trim().slice(0, 80);
        const conversation = await Conversation.create({
            type,
            name,
            members: memberIds,
            createdBy: req.user._id
        });
        await conversation.populate('members', 'name email avatar');
        return res.status(201).json(formatConversation(conversation));
    } catch (error) {
        console.error('Conversation creation failed:', error);
        return res.status(500).json({ message: 'Failed to create conversation' });
    }
});

router.get('/:id/messages', protect, async (req, res) => {
    try {
        const conversation = await Conversation.findById(req.params.id);
        if (!conversation) return res.status(404).json({ message: 'Conversation not found' });
        if (!isMember(conversation, req.user._id)) return res.status(403).json({ message: 'You are not a member of this conversation.' });

        const messages = await DirectMessage.find({ conversationId: conversation._id })
            .sort({ createdAt: -1 })
            .limit(100);
        return res.json(messages.reverse().map(formatMessage));
    } catch (error) {
        return res.status(400).json({ message: 'Unable to load conversation messages' });
    }
});

router.post('/:id/messages', protect, async (req, res) => {
    try {
        const conversation = await Conversation.findById(req.params.id);
        if (!conversation) return res.status(404).json({ message: 'Conversation not found' });
        if (!isMember(conversation, req.user._id)) return res.status(403).json({ message: 'You are not a member of this conversation.' });

        const text = String(req.body.text || '').trim();
        if (!text || text.length > 4000) return res.status(400).json({ message: 'Message must contain 1 to 4000 characters.' });

        const message = await DirectMessage.create({
            conversationId: conversation._id,
            author: req.user._id,
            authorName: req.user.name || 'Community member',
            authorAvatar: req.user.avatar || null,
            text
        });
        conversation.lastMessageText = text;
        conversation.lastMessageAt = message.createdAt;
        await conversation.save();

        const formatted = formatMessage(message);
        req.app.get('io')?.to(`dm:${conversation._id}`).emit('dm:message', formatted);
        return res.status(201).json(formatted);
    } catch (error) {
        return res.status(500).json({ message: 'Failed to send direct message' });
    }
});

module.exports = router;
