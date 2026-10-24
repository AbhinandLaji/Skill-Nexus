const express = require('express');
const Notification = require('../models/Notification');
const Team = require('../models/Team');
const Channel = require('../models/Channel');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Helper to format notification for client consumption
const formatNotification = (n) => ({
    id: n._id ? n._id.toString() : (n.id || String(n._id)),
    _id: n._id ? n._id.toString() : (n.id || String(n._id)),
    recipient: n.recipient ? (n.recipient._id ? n.recipient._id.toString() : n.recipient.toString()) : null,
    sender: n.sender ? (n.sender._id ? n.sender._id.toString() : n.sender.toString()) : null,
    senderName: (n.sender && n.sender.name) ? n.sender.name : (n.senderName || 'Skill Nexus'),
    senderAvatar: (n.sender && n.sender.avatar) ? n.sender.avatar : (n.senderAvatar || null),
    type: n.type,
    title: n.title,
    message: n.message,
    link: n.link || (n.targetType === 'channel' && n.targetId ? `/dashboard/channels/${n.targetId}` : (n.targetType === 'team' ? '/dashboard/matchmaking' : null)),
    read: Boolean(n.read),
    status: n.status || (n.read ? 'read' : 'pending'),
    targetType: n.targetType,
    targetId: n.targetId,
    targetTitle: n.targetTitle,
    createdAt: n.createdAt,
    updatedAt: n.updatedAt
});

// GET /api/notifications - Fetch all notifications for the logged-in user, newest first
router.get('/', protect, async (req, res) => {
    try {
        const userId = req.user._id || req.user.id;
        const notifications = await Notification.find({
            $or: [
                { recipient: userId },
                { recipient: userId.toString() }
            ]
        })
            .populate('sender', 'name avatar email')
            .sort({ createdAt: -1 });

        return res.json((notifications || []).map(formatNotification));
    } catch (error) {
        console.error('Error fetching notifications:', error);
        return res.status(500).json({ message: 'Failed to fetch notifications', error: error.message });
    }
});

// POST /api/notifications/mark-all-read - Mark all unread notifications for the user as read
router.post('/mark-all-read', protect, async (req, res) => {
    try {
        const userId = req.user._id || req.user.id;
        await Notification.updateMany(
            {
                $or: [
                    { recipient: userId },
                    { recipient: userId.toString() }
                ]
            },
            { $set: { read: true, status: 'read' } }
        );
        return res.json({ success: true, message: 'All notifications marked as read' });
    } catch (error) {
        console.error('Error marking notifications as read:', error);
        return res.status(500).json({ message: 'Failed to mark notifications as read', error: error.message });
    }
});

// POST /api/notifications/:id/respond - Handle actions on specific notifications (accept/decline)
router.post('/:id/respond', protect, async (req, res) => {
    try {
        const { id } = req.params;
        const { action } = req.body; // 'accept' | 'decline' | 'reject'

        if (!action || !['accept', 'decline', 'reject'].includes(action)) {
            return res.status(400).json({ message: 'Action must be accept, decline, or reject' });
        }

        const isAccept = action === 'accept';
        const newStatus = isAccept ? 'accepted' : 'declined';

        let notification = await Notification.findById(id).populate('sender', 'name avatar email');

        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        // Check that the recipient matches the logged-in user
        const currentUserId = (req.user._id || req.user.id).toString();
        if (notification.recipient && notification.recipient.toString() !== currentUserId) {
            return res.status(403).json({ message: 'Not authorized to respond to this notification' });
        }

        notification.status = newStatus;
        notification.read = true;
        await notification.save();

        // If it's a team/match request, update team and linked channel
        const isTeamRequest = notification.targetType === 'team' ||
            ['match_request', 'team_invite', 'team_join_request'].includes(notification.type);

        if (isTeamRequest && notification.targetId) {
            try {
                const team = await Team.findById(notification.targetId);
                if (team) {
                    // Identify target user to accept/decline
                    let targetUserId = notification.sender ? (notification.sender._id ? notification.sender._id.toString() : notification.sender.toString()) : null;

                    let reqObj = null;
                    if (targetUserId) {
                        reqObj = team.joinRequests.find(r => r.user && r.user.toString() === targetUserId && r.status === 'pending');
                    }
                    if (!reqObj) {
                        reqObj = team.joinRequests.find(r => r.status === 'pending');
                        if (reqObj && reqObj.user) {
                            targetUserId = reqObj.user.toString();
                        }
                    }

                    if (reqObj) {
                        reqObj.status = newStatus;
                    }

                    if (isAccept && targetUserId) {
                        const currentMembers = (team.members || []).map(m => m.toString());
                        if (!currentMembers.includes(targetUserId)) {
                            team.members.push(targetUserId);
                        }

                        // Check capacity
                        const max = team.maxMembers || 4;
                        if (team.members.length >= max) {
                            team.status = 'filled';
                        }
                        await team.save();

                        // Add to linked Channel
                        if (team.channelId) {
                            const channel = await Channel.findById(team.channelId);
                            if (channel) {
                                const chanMembers = (channel.members || []).map(m => m.toString());
                                if (!chanMembers.includes(targetUserId)) {
                                    channel.members.push(targetUserId);
                                    channel.memberCount = channel.members.length;
                                    await channel.save();
                                }
                            }
                        }

                        // Notify requesting user that request was accepted
                        await Notification.create({
                            recipient: targetUserId,
                            sender: req.user._id,
                            senderName: req.user.name || 'Team Lead',
                            senderAvatar: req.user.avatar || null,
                            type: 'match_request',
                            title: 'Join Request Accepted!',
                            message: `${req.user.name || 'The team lead'} accepted your request to join "${team.title}". You have been added to the channel!`,
                            link: team.channelId ? `/dashboard/channels/${team.channelId}` : '/dashboard/matchmaking',
                            targetType: 'channel',
                            targetId: team.channelId ? team.channelId.toString() : null,
                            targetTitle: team.title,
                            status: 'read',
                            read: false
                        });
                    } else if (!isAccept && targetUserId) {
                        await team.save();

                        // Notify requesting user that request was declined
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
                    }
                }
            } catch (err) {
                console.error('Could not update team and channel request status:', err.message);
            }
        }

        return res.json({
            success: true,
            notification: formatNotification(notification)
        });
    } catch (error) {
        console.error('Error responding to notification:', error);
        return res.status(500).json({ message: 'Failed to update notification', error: error.message });
    }
});

module.exports = router;
