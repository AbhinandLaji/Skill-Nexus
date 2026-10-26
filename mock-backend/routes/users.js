const express = require('express');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { uploadAvatar } = require('../middleware/upload');

const router = express.Router();

// Helper to format user response
const formatUser = (user) => ({
    id: user._id.toString(),
    _id: user._id.toString(),
    name: user.name,
    email: user.email,
    skills: user.skills || [],
    bio: user.bio || '',
    batch: user.batch || '',
    isMentor: user.isMentor || false,
    avatar: user.avatar || null,
    stats: user.stats || { queriesResolved: 0, teamsAdvised: 0, sessionsLed: 0 },
    projects: user.projects || []
});

// GET /api/users/me - Get current logged-in user
router.get('/me', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        return res.json(formatUser(user));
    } catch (error) {
        return res.status(500).json({ message: 'Failed to fetch user', error: error.message });
    }
});

// PATCH /api/users/me - Update current user profile or skills
router.patch('/me', protect, async (req, res) => {
    try {
        const allowedUpdates = ['name', 'skills', 'bio', 'batch', 'avatar', 'isMentor', 'stats', 'projects'];
        const updates = {};

        for (const key of allowedUpdates) {
            if (req.body[key] !== undefined) {
                updates[key] = req.body[key];
            }
        }

        const user = await User.findByIdAndUpdate(
            req.user._id,
            { $set: updates },
            { new: true, runValidators: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (req.body.skills && Array.isArray(req.body.skills)) {
            const Channel = require('../models/Channel');
            // Find all channels associated with the selected skills
            const matchedChannels = await Channel.find({ skillId: { $in: req.body.skills } });

            // Add the user to each matched channel's members array
            for (const channel of matchedChannels) {
                const isMember = (channel.members || []).some(m => String(m) === String(req.user._id));
                if (!isMember) {
                    // Use findByIdAndUpdate to bypass strict schema validation on legacy documents
                    await Channel.findByIdAndUpdate(
                        channel._id,
                        { $addToSet: { members: req.user._id }, $inc: { memberCount: 1 } },
                        { new: true, runValidators: false }
                    );
                }
            }
        }

        const formatted = formatUser(user);
        // Returning formatted object with user property for compatibility with both handlers
        return res.json({
            user: formatted,
            ...formatted
        });
    } catch (error) {
        return res.status(500).json({ message: 'Failed to update user', error: error.message });
    }
});

// POST /api/users/me/avatar - Upload profile avatar image
router.post('/me/avatar', protect, (req, res) => {
    uploadAvatar.single('avatar')(req, res, async (err) => {
        if (err) {
            return res.status(400).json({ message: err.message });
        }
        if (!req.file) {
            return res.status(400).json({ message: 'No avatar image file was uploaded' });
        }

        try {
            const avatarUrl = `/uploads/avatars/${req.file.filename}`;
            const user = await User.findByIdAndUpdate(
                req.user._id,
                { $set: { avatar: avatarUrl } },
                { new: true }
            ).select('-password');

            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            const formatted = formatUser(user);
            return res.status(200).json({
                message: 'Avatar uploaded successfully',
                avatarUrl,
                user: formatted,
                ...formatted
            });
        } catch (dbErr) {
            return res.status(500).json({ message: 'Failed to update user avatar in database', error: dbErr.message });
        }
    });
});


// GET /api/users/:id - Get public profile of a user
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        let user;
        if (id === 'me') {
            user = await User.findOne().select('-password');
        } else if (id.match(/^[0-9a-fA-F]{24}$/)) {
            user = await User.findById(id).select('-password');
        } else {
            user = await User.findOne().select('-password');
        }

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        return res.json(formatUser(user));
    } catch (error) {
        return res.status(500).json({ message: 'Failed to fetch user profile', error: error.message });
    }
});

module.exports = router;