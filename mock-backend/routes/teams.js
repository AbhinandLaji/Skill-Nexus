const express = require('express');
const Team = require('../models/Team');
const { protect } = require('../middleware/auth');

const router = express.Router();

const DEFAULT_TEAMS = [
    {
        projectType: 'Hackathon',
        title: 'AI Agent Swarm Platform',
        description: 'Building a multi-agent framework for automated code reviews. Need backend devs familiar with LangChain.',
        requiredSkills: [{ name: 'Python', match: true }, { name: 'AI/ML', match: true }, { name: 'FastAPI', match: false }],
        authorName: 'Alex C.',
        authorAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBsHJDZxJ1hjDac3CtSnYZ3I5eO5RRiXZ53a0fZDb3Tl4Q92HrghG4uHZMmgtlTMavs46ZXaDIdFGxaotuiudngTwPO9bcLe4qNb_5GO8wABlyN6S18hkqKJHLTb7YKZx1Bak6U-T3he4xOrQqCI583cgDyMqUdDhOanRjsQivenLuqJaEBfajmB3LrxUvW2hlw-yMHiWsGVX5SN7Mxy52l7D87Kt4yuGlC6tPIZGQGPe559tchpdYPiiYKIuFanmdloXwNkJ6lmf3L',
        lookingForCount: 2
    },
    {
        projectType: 'Long-term',
        title: 'Zero-Knowledge Voting App',
        description: 'Creating a decentralized, mathematically provable voting system for campus organizations. Need Rust expertise.',
        requiredSkills: [{ name: 'Rust', match: true }, { name: 'Cryptography', match: true }, { name: 'Next.js', match: false }],
        authorName: 'Sarah K.',
        authorAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCqnH5D6CS5QgUEZjpR_9dzHLDd1OPK30LYBOUeswyshA8YnoKKvwQMHsjLBJGOxAXcx6zpeFDWmyhUW6MNCVbirlzwzWkVyI_ICL6DlkVoZOl29cL2gR6Sf54bxCN4e0sLji-jZXR4zYIQxIyZsGD99RbAOmF2tjVzY2dpH8GJcZnlD38URlDpbnT1MtBhi6WB7dBq4_2QUxcM6kKYH7MVrTnVaBKuLU6dCH1ZdKfU544D9Crrgy5eadkp11gMmR_PTC2JCZI7ZJVV',
        lookingForCount: 1
    },
    {
        projectType: 'Study Group',
        title: 'LeetCode Grind Squad',
        description: 'Meeting twice a week to tackle Hard problems. Preparing for FAANG interviews this upcoming cycle.',
        requiredSkills: [{ name: 'Algorithms', match: false }, { name: 'Data Structures', match: false }],
        authorName: 'James T.',
        authorAvatar: null,
        lookingForCount: 3
    }
];

const formatTeam = (team) => ({
    id: team._id ? team._id.toString() : team.id,
    _id: team._id ? team._id.toString() : team.id,
    title: team.title,
    description: team.description,
    projectType: team.projectType || 'Hackathon',
    requiredSkills: (team.requiredSkills || []).map(s => (typeof s === 'string' ? { name: s, match: false } : s)),
    authorName: team.authorName || 'Anonymous',
    authorAvatar: team.authorAvatar || null,
    lookingForCount: team.lookingForCount || 1,
    deadline: team.deadline || null
});

// GET /api/teams - List all teams
router.get('/', async (req, res) => {
    try {
        let teams = await Team.find().sort({ createdAt: -1 });

        if (!teams || teams.length === 0) {
            teams = await Team.insertMany(DEFAULT_TEAMS);
        }

        return res.json(teams.map(formatTeam));
    } catch (error) {
        return res.json(DEFAULT_TEAMS.map((t, idx) => ({ ...t, id: (idx + 1).toString() })));
    }
});

// POST /api/teams - Create a team post
router.post('/', protect, async (req, res) => {
    try {
        const { title, description, requiredSkills, projectType, type, deadline, lookingForCount } = req.body;

        if (!title || !description) {
            return res.status(400).json({ message: 'Title and description are required' });
        }

        // Normalize skills input
        let normalizedSkills = [];
        if (Array.isArray(requiredSkills)) {
            normalizedSkills = requiredSkills.map(s => {
                if (typeof s === 'string') {
                    return { name: s.trim(), match: false };
                }
                return s;
            });
        }

        const team = await Team.create({
            title,
            description,
            projectType: projectType || type || 'Hackathon',
            requiredSkills: normalizedSkills,
            authorId: req.user._id,
            authorName: req.user.name || 'Anonymous',
            authorAvatar: req.user.avatar || null,
            deadline: deadline || null,
            lookingForCount: lookingForCount || 2
        });

        const formatted = formatTeam(team);
        return res.status(201).json({
            success: true,
            team: formatted,
            ...formatted
        });
    } catch (error) {
        console.error('Error creating team:', error);
        return res.status(500).json({ message: 'Failed to create team', error: error.message });
    }
});

// POST /api/teams/:id/join or /api/teams/:id/join-request - Request to join a team
const handleJoinRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const team = await Team.findById(id);

        if (team) {
            const alreadyRequested = team.joinRequests.some(
                r => r.user && r.user.toString() === req.user._id.toString()
            );

            if (!alreadyRequested) {
                team.joinRequests.push({ user: req.user._id });
                await team.save();
            }
        }

        return res.json({ success: true, status: 'requested' });
    } catch (error) {
        return res.json({ success: true, status: 'requested' });
    }
};

router.post('/:id/join', protect, handleJoinRequest);
router.post('/:id/join-request', protect, handleJoinRequest);

module.exports = router;
