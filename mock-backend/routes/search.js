const express = require('express');
const Channel = require('../models/Channel');
const Skill = require('../models/Skill');
const Team = require('../models/Team');

const router = express.Router();

const idOf = (value) => String(value?._id || value?.id || value || '');

// GET /api/search?q=... - Global search across channels/communities, skills, and teams/projects
router.get('/', async (req, res) => {
    try {
        const queryStr = String(req.query.q || req.query.query || req.query.search || '').trim();
        if (!queryStr) {
            return res.json({
                channels: [],
                communities: [],
                skills: [],
                teams: [],
                projects: [],
                total: 0
            });
        }

        const regex = new RegExp(queryStr, 'i');

        // Extract user id from token if present in header
        let currentUserId = null;
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
            try {
                const token = req.headers.authorization.split(' ')[1];
                const jwt = require('jsonwebtoken');
                const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret');
                currentUserId = String(decoded.id);
            } catch {
                // Ignore token error for public search
            }
        }

        // Query Channel / Community MongoDB collection using $regex text match on channel name and description
        const channels = await Channel.find({
            isPrivate: { $ne: true },
            $or: [
                { name: regex },
                { description: regex }
            ]
        }).populate('members', 'name email avatar').limit(20);

        // Query Skills
        const skills = await Skill.find({
            name: regex
        }).limit(10);

        // Query Teams & Projects
        const teams = await Team.find({
            $or: [
                { title: regex },
                { description: regex },
                { projectType: regex },
                { 'requiredSkills.name': regex }
            ]
        }).limit(10);

        const formattedChannels = channels.map(channel => ({
            id: channel._id.toString(),
            _id: channel._id.toString(),
            name: channel.name,
            description: channel.description || '',
            category: channel.category || 'General',
            channelType: channel.channelType || 'text',
            memberCount: channel.members?.length || channel.memberCount || 1,
            isPrivate: Boolean(channel.isPrivate),
            isMember: currentUserId ? (
                idOf(channel.admin) === currentUserId ||
                (channel.members || []).some(m => idOf(m) === currentUserId)
            ) : false
        }));

        const formattedSkills = skills.map(s => ({
            id: s._id.toString(),
            _id: s._id.toString(),
            name: s.name,
            colorAccent: s.colorAccent
        }));

        const formattedTeams = teams.map(t => ({
            id: t._id.toString(),
            _id: t._id.toString(),
            title: t.title,
            description: t.description,
            projectType: t.projectType
        }));

        return res.json({
            channels: formattedChannels,
            communities: formattedChannels,
            skills: formattedSkills,
            teams: formattedTeams,
            projects: formattedTeams,
            total: formattedChannels.length + formattedSkills.length + formattedTeams.length
        });
    } catch (error) {
        console.error('Search error:', error);
        return res.status(500).json({ message: 'Search failed', error: error.message });
    }
});

module.exports = router;
