const express = require('express');
const Activity = require('../models/Activity');
const Feed = require('../models/Feed');

const router = express.Router();

// GET /api/feed or /api/activities - Retrieve live feed / activity items
router.get('/', async (req, res) => {
    try {
        let activities = await Activity.find()
            .sort({ createdAt: -1 })
            .limit(50)
            .populate('user', 'name avatar')
            .populate('channel', 'name description memberCount isPrivate');

        if (!activities || activities.length === 0) {
            activities = await Feed.find()
                .sort({ createdAt: -1 })
                .limit(50)
                .populate('user', 'name avatar')
                .populate('channel', 'name description memberCount isPrivate');
        }

        const formatted = activities.map(item => ({
            id: item._id.toString(),
            _id: item._id.toString(),
            type: item.type || 'COMMUNITY_CREATED',
            user: item.user,
            userId: item.user?._id ? item.user._id.toString() : (item.user ? item.user.toString() : null),
            authorName: item.userName || item.user?.name || 'Community Member',
            authorAvatar: item.userAvatar || item.user?.avatar || null,
            channel: item.channel,
            channelId: item.channelId ? item.channelId.toString() : (item.channel?._id ? item.channel._id.toString() : null),
            channelName: item.channelName || item.channel?.name || '',
            channelDescription: item.channelDescription || item.channel?.description || '',
            text: item.text || `${item.userName || item.user?.name || 'User'} created a new community: ${item.channelName || item.channel?.name || ''}`,
            createdAt: item.createdAt,
            timeAgo: 'Recently'
        }));

        return res.json(formatted);
    } catch (error) {
        console.error('Error loading feed:', error);
        return res.status(500).json({ message: 'Failed to load feed', error: error.message });
    }
});

module.exports = router;
