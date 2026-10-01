const express = require('express');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

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