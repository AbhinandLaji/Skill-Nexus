const express = require('express');
const Mentor = require('../models/Mentor');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { protect } = require('../middleware/auth');

const router = express.Router();

const SEED_MENTORS = [
    {
        name: 'Sarah Jenkins',
        role: 'Staff Frontend Engineer @ Vercel',
        expertise: ['React', 'Next.js', 'System Design', 'Frontend Architecture'],
        bio: 'Senior engineer focused on state management, compiler toolchains, and distributed React apps. Happy to review resumes, portfolios, or deep-dive into web performance.',
        achievements: 'Staff Engineer @ Vercel • Ex-Meta • Top 1% React Contributor',
        availabilityStatus: 'available',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=256&q=80'
    },
    {
        name: 'Alex Chen',
        role: 'Senior Machine Learning Researcher @ OpenAI',
        expertise: ['AI/ML', 'Python', 'PyTorch', 'LLMs', 'Agentic Systems'],
        bio: 'Researcher working on multimodal alignment and agentic planning algorithms. Available to assist students with AI project design, paper discussions, and research career pathways.',
        achievements: 'NeurIPS & ICML Author • Ex-Stanford AI Lab • 10k+ GitHub Stars',
        availabilityStatus: 'available',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80'
    },
    {
        name: 'Arjun Nair',
        role: 'Lead Systems Architect @ Cloudflare',
        expertise: ['Go', 'Rust', 'Distributed Systems', 'Kubernetes', 'Backend'],
        bio: 'Specialist in low-latency distributed networks and edge computing. I mentor college students aiming for tier-1 backend engineering and infra roles.',
        achievements: 'Smart India Hackathon Judge • CNCF Contributor • AWS Certified SA',
        availabilityStatus: 'busy',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&q=80'
    },
    {
        name: 'Priya Sharma',
        role: 'Mobile Tech Lead @ Uber',
        expertise: ['Mobile Dev', 'React Native', 'Flutter', 'iOS/Android'],
        bio: 'Passionate about offline-first architectures, mobile animation engines, and scalable mobile pipelines. Book a session to review your mobile app architecture.',
        achievements: 'Tech Lead @ Uber • GSoC Mentor 2023 & 2024 • Speaker at Droidcon',
        availabilityStatus: 'available',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80'
    }
];

const formatMentor = (m) => ({
    id: m._id ? m._id.toString() : m.id,
    _id: m._id ? m._id.toString() : m.id,
    name: m.name,
    role: m.role || 'Verified Mentor',
    expertise: Array.isArray(m.expertise) ? m.expertise : ['General Mentorship'],
    bio: m.bio || 'Available for technical and career advice.',
    achievements: m.achievements || '',
    availabilityStatus: m.availabilityStatus || 'available',
    avatar: m.avatar || null,
    user: m.user ? (m.user._id ? m.user._id.toString() : m.user.toString()) : null,
    createdAt: m.createdAt
});

// GET /api/mentors - List all mentors
router.get('/', async (req, res) => {
    try {
        let mentors = await Mentor.find().populate('user', 'name avatar email');

        // Auto-seed if database collection is empty so UI is immediately populated
        if (!mentors || mentors.length === 0) {
            try {
                await Mentor.insertMany(SEED_MENTORS);
                mentors = await Mentor.find().populate('user', 'name avatar email');
            } catch (seedErr) {
                console.error('Mentor seed error:', seedErr.message);
            }
        }

        return res.json((mentors || []).map(formatMentor));
    } catch (error) {
        console.error('Error fetching mentors:', error);
        return res.json([]);
    }
});

// POST /api/mentors/:id/request - Request mentorship session
router.post('/:id/request', protect, async (req, res) => {
    try {
        const { id } = req.params;
        const { topic, question, message } = req.body || {};

        let mentor = await Mentor.findById(id).populate('user');
        let recipientId = null;

        if (mentor) {
            recipientId = mentor.user ? (mentor.user._id || mentor.user) : mentor._id;
        } else {
            // Check if id is a User directly
            const mentorUser = await User.findById(id);
            if (mentorUser) {
                recipientId = mentorUser._id;
            }
        }

        const requestTopic = topic || question || message || 'Technical Guidance Session';

        if (recipientId) {
            try {
                await Notification.create({
                    recipient: recipientId,
                    sender: req.user._id,
                    senderName: req.user.name || 'Student Mentee',
                    senderAvatar: req.user.avatar || null,
                    type: 'system',
                    title: 'Mentorship Session Request',
                    message: `${req.user.name || 'A student'} requested a session: "${requestTopic.slice(0, 100)}"`,
                    link: '/dashboard/mentorship',
                    targetType: 'mentor',
                    targetId: id,
                    status: 'pending',
                    read: false
                });
            } catch (notifErr) {
                console.error('Failed to create mentorship request notification:', notifErr.message);
            }
        }

        return res.json({
            success: true,
            message: 'Mentorship request sent successfully! The mentor has been notified.',
            topic: requestTopic
        });
    } catch (error) {
        console.error('Error requesting mentorship:', error);
        return res.status(500).json({ message: 'Failed to request mentorship', error: error.message });
    }
});

module.exports = router;
