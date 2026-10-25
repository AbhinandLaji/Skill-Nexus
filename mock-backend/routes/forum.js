const express = require('express');
const Channel = require('../models/Channel');
const ForumPost = require('../models/ForumPost');
const { protect } = require('../middleware/auth');

const router = express.Router();
const member = (channel, userId) => String(channel.admin) === String(userId) || channel.members.some((id) => String(id) === String(userId));
const serialize = (post) => ({
    id: post._id.toString(), channelId: post.channelId.toString(), authorId: post.authorId.toString(),
    authorName: post.authorName, title: post.title, body: post.body, createdAt: post.createdAt,
    replies: post.replies.map((reply) => ({ id: reply._id.toString(), authorId: reply.authorId.toString(), authorName: reply.authorName, text: reply.text, createdAt: reply.createdAt }))
});

router.get('/:channelId/forum', protect, async (req, res) => {
    try {
        const channel = await Channel.findById(req.params.channelId);
        if (!channel) return res.status(404).json({ message: 'Channel not found.' });
        if (!member(channel, req.user._id)) return res.status(403).json({ message: 'Join this forum to view posts.' });
        if (channel.channelType !== 'forum') return res.status(400).json({ message: 'This is not a forum channel.' });
        const posts = await ForumPost.find({ channelId: channel._id }).sort({ updatedAt: -1 }).limit(100);
        return res.json(posts.map(serialize));
    } catch (error) { return res.status(400).json({ message: 'Unable to load forum posts.' }); }
});

router.post('/:channelId/forum', protect, async (req, res) => {
    try {
        const channel = await Channel.findById(req.params.channelId);
        if (!channel) return res.status(404).json({ message: 'Channel not found.' });
        if (!member(channel, req.user._id)) return res.status(403).json({ message: 'Join this forum to post.' });
        if (channel.channelType !== 'forum') return res.status(400).json({ message: 'This is not a forum channel.' });
        const title = String(req.body.title || '').trim();
        const body = String(req.body.body || '').trim();
        if (!title || title.length > 160 || !body || body.length > 12000) return res.status(400).json({ message: 'Add a title and body within the length limits.' });
        const post = await ForumPost.create({ channelId: channel._id, authorId: req.user._id, authorName: req.user.name || 'Community member', title, body });
        return res.status(201).json(serialize(post));
    } catch (error) { return res.status(500).json({ message: 'Unable to create forum post.' }); }
});

router.post('/:channelId/forum/:postId/replies', protect, async (req, res) => {
    try {
        const channel = await Channel.findById(req.params.channelId);
        if (!channel) return res.status(404).json({ message: 'Channel not found.' });
        if (!member(channel, req.user._id)) return res.status(403).json({ message: 'Join this forum to reply.' });
        if (channel.channelType !== 'forum') return res.status(400).json({ message: 'This is not a forum channel.' });
        const text = String(req.body.text || '').trim();
        if (!text || text.length > 4000) return res.status(400).json({ message: 'Reply must contain 1 to 4000 characters.' });
        const post = await ForumPost.findOne({ _id: req.params.postId, channelId: channel._id });
        if (!post) return res.status(404).json({ message: 'Forum post not found.' });
        post.replies.push({ authorId: req.user._id, authorName: req.user.name || 'Community member', text });
        await post.save();
        return res.status(201).json(serialize(post));
    } catch (error) { return res.status(400).json({ message: 'Unable to add reply.' }); }
});

module.exports = router;
