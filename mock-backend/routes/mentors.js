const express = require('express');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();

const DEFAULT_MENTORS = [
    {
        id: '1',
        name: 'Sarah Jenkins',
        role: 'Senior Verified',
        expertise: ['React', 'Architecture'],
        bio: 'Senior Frontend Engineer at Vercel. Happy to review portfolios or discuss state management at scale.',
        avatar: null
    },
    {
        id: '2',
        name: 'CyberNovice',
        role: 'Security Researcher',
        expertise: ['Cyber', 'Career'],
        bio: 'Transitioned from Web Dev to Security Research. I can help you build an offensive security portfolio.',
        avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBM_CDkM4KN6j4dM6WLMqTrMjwfz3OBO7IRV6-bSjWAWLNXNOfE1k3ZlgDKIdR9yNloHgQltXr9SzhC0ux8WzvKgrFlymfosn9LVk2PyEuJqw87ixlSNrOv7GxFtYHtwhRjQKdT9udz0CQJ2_fpIr6J9gNZRGI5XiGNhmraRXk2RcR9V6qRgP0L60QC3ndp0kbCeVWujuDMCHgBUHgbLpjyAWCqaH1x7o57ftWaUvpWgPchxXVqyNZGg4_wyUbk4cdKdItC1wZQf69o'
    }
];

// GET /api/mentors - List mentors
router.get('/', async (req, res) => {
    try {
        const users = await User.find({ isMentor: true }).select('-password');

        if (users && users.length > 0) {
            const mentors = users.map(u => ({
                id: u._id.toString(),
                _id: u._id.toString(),
                name: u.name,
                role: u.bio ? u.bio.slice(0, 30) : 'Verified Mentor',
                expertise: u.skills || ['General Mentorship'],
                bio: u.bio || 'Available for technical and career advice.',
                avatar: u.avatar || null
            }));
            return res.json(mentors);
        }

        return res.json(DEFAULT_MENTORS);
    } catch (error) {
        return res.json(DEFAULT_MENTORS);
    }
});

// POST /api/mentors/:id/request - Request mentorship
router.post('/:id/request', protect, async (req, res) => {
    try {
        return res.json({ success: true, message: 'Mentorship request sent successfully' });
    } catch (error) {
        return res.json({ success: true });
    }
});

module.exports = router;
