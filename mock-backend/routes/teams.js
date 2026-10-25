const express = require('express');
const Team = require('../models/Team');
const User = require('../models/User');
const Channel = require('../models/Channel');
const Message = require('../models/Message');
const Notification = require('../models/Notification');
const { protect } = require('../middleware/auth');

const router = express.Router();

const formatTeam = (team) => {
    const maxMembers = team.maxMembers || (team.lookingForCount ? team.lookingForCount + 1 : 4);
    const membersList = (team.members || []).map(m => (m._id ? m._id.toString() : m.toString()));
    const memberCount = membersList.length > 0 ? membersList.length : 1;
    const isFilled = team.status === 'filled' || memberCount >= maxMembers;

    return {
        id: team._id ? team._id.toString() : team.id,
        _id: team._id ? team._id.toString() : team.id,
        title: team.title,
        description: team.description,
        projectType: team.projectType || 'Hackathon',
        requiredSkills: (team.requiredSkills || []).map(s => (typeof s === 'string' ? { name: s, match: false } : s)),
        authorId: team.authorId ? team.authorId.toString() : null,
        authorName: team.authorName || 'Anonymous',
        authorAvatar: team.authorAvatar || null,
        maxMembers,
        members: membersList,
        memberCount,
        status: isFilled ? 'filled' : (team.status || 'open'),
        channelId: team.channelId ? team.channelId.toString() : null,
        lookingForCount: Math.max(0, maxMembers - memberCount),
        deadline: team.deadline || null,
        joinRequests: (team.joinRequests || []).map(r => ({
            id: r._id ? r._id.toString() : r.id,
            user: r.user ? (r.user._id ? r.user._id.toString() : r.user.toString()) : null,
            requestedAt: r.requestedAt,
            status: r.status
        }))
    };
};

const slugifyChannelName = (title) => {
    const slug = (title || 'squad')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 24);
    return `#${slug || 'squad'}`;
};

// GET /api/teams/recommendations - Rank open teams by overlap with the caller's skills
router.get('/recommendations', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('skills');
        const userSkills = (user?.skills || []).map(skill => String(skill).trim().toLowerCase()).filter(Boolean);
        const teams = await Team.find({ status: { $ne: 'filled' } }).sort({ createdAt: -1 });

        const recommendations = teams
            .filter(team => {
                const max = team.maxMembers || (team.lookingForCount ? team.lookingForCount + 1 : 4);
                const memberIds = (team.members || []).map(member => String(member));
                const isOwner = team.authorId && String(team.authorId) === String(req.user._id);
                return !isOwner && !memberIds.includes(String(req.user._id)) && memberIds.length < max;
            })
            .map(team => {
                const requiredSkills = (team.requiredSkills || []).map(skill =>
                    String(typeof skill === 'string' ? skill : skill.name || '').trim()
                ).filter(Boolean);
                const matchedSkills = requiredSkills.filter(skill => userSkills.includes(skill.toLowerCase()));
                const score = requiredSkills.length ? Math.round((matchedSkills.length / requiredSkills.length) * 100) : 0;
                return { ...formatTeam(team), matchScore: score, matchedSkills };
            })
            .sort((a, b) => b.matchScore - a.matchScore || new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
            .slice(0, 5);

        return res.json(recommendations);
    } catch (error) {
        console.error('Error fetching team recommendations:', error);
        return res.status(500).json({ message: 'Failed to fetch team recommendations' });
    }
});

// GET /api/teams - List all teams with MongoDB search & filter query processing
router.get('/', async (req, res) => {
    try {
        const { showAll, authorId, skill, type, search } = req.query;
        let query = {};

        // If authorId is given or showAll === 'true', allow viewing all status
        if (showAll !== 'true' && !authorId) {
            query.status = { $ne: 'filled' };
        }
        if (authorId) {
            query.authorId = authorId;
        }

        // 1. Filter by required skill using MongoDB array regex matching
        if (skill && skill !== 'All') {
            const cleanSkill = skill.split('/')[0].split('(')[0].trim();
            query['requiredSkills.name'] = new RegExp(cleanSkill, 'i');
        }

        // 2. Filter by project type (Hackathon, Long-term, Study Group)
        if (type && type !== 'All') {
            query.projectType = new RegExp(type, 'i');
        }

        // 3. Search across title & description
        if (search && search.trim()) {
            const searchRegex = new RegExp(search.trim(), 'i');
            query.$or = [
                { title: searchRegex },
                { description: searchRegex }
            ];
        }

        const teams = await Team.find(query).sort({ createdAt: -1 });

        // Filter out teams that have reached maximum capacity unless specifically requesting author listings or showAll
        const filtered = teams.filter(team => {
            if (showAll === 'true' || authorId) return true;
            if (team.status === 'filled') return false;
            const max = team.maxMembers || (team.lookingForCount ? team.lookingForCount + 1 : 4);
            const count = (team.members && team.members.length > 0) ? team.members.length : 1;
            return count < max;
        });

        return res.json(filtered.map(formatTeam));
    } catch (error) {
        console.error('Error fetching teams:', error);
        return res.json([]);
    }
});

// POST /api/teams - Create a team post and automatically provision a community channel
router.post('/', protect, async (req, res) => {
    try {
        const { title, description, requiredSkills, projectType, type, deadline, maxMembers, lookingForCount } = req.body;

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

        const parsedMax = Number(maxMembers) || (Number(lookingForCount) ? Number(lookingForCount) + 1 : 4);

        // 1. Generate unique channel name from team title
        let baseSlug = slugifyChannelName(title);
        let channelName = baseSlug;
        const existingChan = await Channel.findOne({ name: channelName });
        if (existingChan) {
            channelName = `${baseSlug}-${Math.floor(100 + Math.random() * 900)}`;
        }

        // 2. Automatically create the community Channel document
        const channel = await Channel.create({
            name: channelName,
            skillId: (normalizedSkills[0]?.name) || 'squad',
            admin: req.user._id,
            members: [req.user._id],
            memberCount: 1,
            isPrivate: false
        });

        // 3. Create the Team document linking to the new channel and initializing members with creator
        const team = await Team.create({
            title,
            description,
            projectType: projectType || type || 'Hackathon',
            requiredSkills: normalizedSkills,
            authorId: req.user._id,
            authorName: req.user.name || 'Anonymous',
            authorAvatar: req.user.avatar || null,
            maxMembers: parsedMax,
            members: [req.user._id],
            status: 'open',
            channelId: channel._id,
            deadline: deadline || null,
            lookingForCount: Math.max(1, parsedMax - 1)
        });

        // 4. Link teamId on Channel
        channel.teamId = team._id;
        await channel.save();

        // 5. Post welcoming seed message to the channel
        try {
            await Message.create({
                channelId: channel._id.toString(),
                authorId: req.user._id,
                authorName: 'Skill Nexus Bot',
                authorAvatar: null,
                text: `🚀 Welcome to ${channel.name}! This community channel was automatically created for team "${team.title}". Coordinate, share code, and build your project here!`,
                threadCount: 0
            });
        } catch (msgErr) {
            console.error('Seed message error:', msgErr.message);
        }

        const formatted = formatTeam(team);
        return res.status(201).json({
            success: true,
            team: formatted,
            channel: {
                id: channel._id.toString(),
                name: channel.name
            },
            ...formatted
        });
    } catch (error) {
        console.error('Error creating team:', error);
        return res.status(500).json({ message: 'Failed to create team', error: error.message });
    }
});

// POST /api/teams/:id/accept - Accept a join request and automatically add user to channel
router.post('/:id/accept', protect, async (req, res) => {
    try {
        const { id } = req.params;
        const { userId, requestId } = req.body;

        const team = await Team.findById(id);
        if (!team) {
            return res.status(404).json({ message: 'Team listing not found' });
        }

        // Verify that the caller is the team author
        if (!team.authorId || String(req.user._id) !== String(team.authorId)) {
            return res.status(403).json({ message: 'Only the team creator can accept join requests' });
        }

        // Determine user to accept
        let targetUserId = userId;
        let targetRequest = null;

        if (requestId) {
            targetRequest = team.joinRequests.id(requestId);
            if (targetRequest && targetRequest.user) {
                targetUserId = targetRequest.user.toString();
            }
        } else if (targetUserId) {
            targetRequest = team.joinRequests.find(
                r => r.user && r.user.toString() === targetUserId.toString() && r.status === 'pending'
            );
        } else {
            // Pick first pending request
            targetRequest = team.joinRequests.find(r => r.status === 'pending');
            if (targetRequest && targetRequest.user) {
                targetUserId = targetRequest.user.toString();
            }
        }

        if (!targetUserId) {
            return res.status(400).json({ message: 'No valid user or pending request found to accept' });
        }

        // Mark request as accepted
        if (targetRequest) {
            targetRequest.status = 'accepted';
        }

        // Add user to team members if not already present
        const currentMemberStrings = (team.members || []).map(m => m.toString());
        if (!currentMemberStrings.includes(targetUserId.toString())) {
            team.members.push(targetUserId);
        }

        // Check if team is now filled
        const max = team.maxMembers || 4;
        if (team.members.length >= max) {
            team.status = 'filled';
        }
        await team.save();

        // Automatically add user to the linked community Channel
        let linkedChannel = null;
        if (team.channelId) {
            linkedChannel = await Channel.findById(team.channelId);
            if (linkedChannel) {
                const chanMemberStrings = (linkedChannel.members || []).map(m => m.toString());
                if (!chanMemberStrings.includes(targetUserId.toString())) {
                    linkedChannel.members.push(targetUserId);
                    linkedChannel.memberCount = linkedChannel.members.length;
                    await linkedChannel.save();
                }

                // Post announcement message into channel
                try {
                    await Message.create({
                        channelId: linkedChannel._id.toString(),
                        authorName: 'Skill Nexus Bot',
                        text: `🎉 A new member has joined the team and community channel!`,
                        threadCount: 0
                    });
                } catch (msgErr) {
                    // non-critical
                }
            }
        }

        // Notify accepted user
        try {
            await Notification.create({
                recipient: targetUserId,
                sender: req.user._id,
                senderName: req.user.name || 'Team Lead',
                senderAvatar: req.user.avatar || null,
                type: 'match_request',
                title: 'Join Request Accepted!',
                message: `${req.user.name || 'The team lead'} accepted your request to join "${team.title}". You have been added to ${linkedChannel ? linkedChannel.name : 'the squad channel'}!`,
                link: team.channelId ? `/dashboard/channels/${team.channelId}` : '/dashboard/matchmaking',
                targetType: 'channel',
                targetId: team.channelId ? team.channelId.toString() : null,
                targetTitle: team.title,
                status: 'read',
                read: false
            });
        } catch (notifErr) {
            console.error('Failed to notify accepted user:', notifErr.message);
        }

        return res.json({
            success: true,
            message: 'User accepted and automatically added to community channel',
            team: formatTeam(team),
            channelId: team.channelId ? team.channelId.toString() : null
        });

    } catch (error) {
        console.error('Error accepting join request:', error);
        return res.status(500).json({ message: 'Failed to accept join request', error: error.message });
    }
});

// POST /api/teams/:id/reject - Reject a join request and notify requesting user
router.post('/:id/reject', protect, async (req, res) => {
    try {
        const { id } = req.params;
        const { userId, requestId } = req.body;

        const team = await Team.findById(id);
        if (!team) {
            return res.status(404).json({ message: 'Team listing not found' });
        }

        // Verify caller is team author
        if (!team.authorId || String(req.user._id) !== String(team.authorId)) {
            return res.status(403).json({ message: 'Only the team creator can reject join requests' });
        }

        let targetUserId = userId;
        let targetRequest = null;

        if (requestId) {
            targetRequest = team.joinRequests.id(requestId);
            if (targetRequest && targetRequest.user) {
                targetUserId = targetRequest.user.toString();
            }
        } else if (targetUserId) {
            targetRequest = team.joinRequests.find(
                r => r.user && r.user.toString() === targetUserId.toString() && r.status === 'pending'
            );
        } else {
            targetRequest = team.joinRequests.find(r => r.status === 'pending');
            if (targetRequest && targetRequest.user) {
                targetUserId = targetRequest.user.toString();
            }
        }

        if (targetRequest) {
            targetRequest.status = 'declined';
        }
        await team.save();

        if (targetUserId) {
            try {
                await Notification.create({
                    recipient: targetUserId,
                    sender: req.user._id,
                    senderName: req.user.name || 'Team Lead',
                    senderAvatar: req.user.avatar || null,
                    type: 'match_request',
                    title: 'Join Request Declined',
                    message: `${req.user.name || 'The team lead'} declined your request to join "${team.title}".`,
                    link: '/dashboard/matchmaking',
                    targetType: 'team',
                    targetId: team._id.toString(),
                    targetTitle: team.title,
                    status: 'read',
                    read: false
                });
            } catch (notifErr) {
                console.error('Failed to notify rejected user:', notifErr.message);
            }
        }

        return res.json({
            success: true,
            message: 'Join request declined',
            team: formatTeam(team)
        });
    } catch (error) {
        console.error('Error rejecting join request:', error);
        return res.status(500).json({ message: 'Failed to reject join request', error: error.message });
    }
});

// Alias decline to reject
router.post('/:id/decline', protect, async (req, res, next) => {
    req.url = `/${req.params.id}/reject`;
    router.handle(req, res, next);
});

// DELETE /api/teams/:id - Delete a team listing
router.delete('/:id', protect, async (req, res) => {
    try {
        const { id } = req.params;
        const team = await Team.findById(id);

        if (!team) {
            return res.status(404).json({ message: 'Team listing not found' });
        }

        const userId = req.user ? req.user._id.toString() : null;
        if (team.authorId && userId && team.authorId.toString() !== userId) {
            return res.status(403).json({ message: 'Not authorized to delete this team' });
        }

        await Team.findByIdAndDelete(id);
        return res.json({ success: true, message: 'Team listing deleted successfully' });
    } catch (error) {
        console.error('Error deleting team:', error);
        return res.status(500).json({ message: 'Failed to delete team', error: error.message });
    }
});

// POST /api/teams/:id/join or /api/teams/:id/join-request - Request to join a team
const handleJoinRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const team = await Team.findById(id);

        if (!team) {
            return res.status(404).json({ message: 'Team not found' });
        }

        const userId = req.user ? req.user._id.toString() : null;

        // Prevent author from requesting to join their own team
        if (team.authorId && userId && team.authorId.toString() === userId) {
            return res.status(400).json({ message: 'You cannot request to join your own team' });
        }

        // Check if team is already full or filled
        const max = team.maxMembers || 4;
        if (team.status === 'filled' || (team.members && team.members.length >= max)) {
            return res.status(400).json({ message: 'This team is already at maximum capacity' });
        }

        // Check if already a member
        if (userId && team.members && team.members.some(m => m.toString() === userId)) {
            return res.status(400).json({ message: 'You are already a member of this team' });
        }

        const alreadyRequested = userId && team.joinRequests.some(
            r => r.user && r.user.toString() === userId && r.status === 'pending'
        );

        if (!alreadyRequested) {
            if (userId) {
                team.joinRequests.push({ user: req.user._id });
            }
            await team.save();

            // Create a notification for the team owner
            try {
                if (team.authorId) {
                    await Notification.create({
                        recipient: team.authorId,
                        sender: req.user._id,
                        senderName: (req.user && req.user.name) ? req.user.name : 'Student Collaborator',
                        senderAvatar: (req.user && req.user.avatar) ? req.user.avatar : null,
                        type: 'match_request',
                        title: 'Team Join Request',
                        message: `${req.user.name || 'A student'} requested to join your team "${team.title}"`,
                        link: '/dashboard/matchmaking',
                        targetType: 'team',
                        targetId: team._id.toString(),
                        targetTitle: team.title,
                        status: 'pending',
                        read: false
                    });
                }
            } catch (notifErr) {
                console.error('Failed to create join request notification:', notifErr.message);
            }
        }

        return res.json({ success: true, status: 'requested' });
    } catch (error) {
        return res.status(500).json({ message: 'Failed to submit join request', error: error.message });
    }
};

router.post('/:id/join', protect, handleJoinRequest);
router.post('/:id/join-request', protect, handleJoinRequest);

module.exports = router;
