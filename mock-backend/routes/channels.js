const express = require('express');
const path = require('path');
const Channel = require('../models/Channel');
const Message = require('../models/Message');
const Skill = require('../models/Skill');
const User = require('../models/User');
const Activity = require('../models/Activity');
const Feed = require('../models/Feed');
const { protect } = require('../middleware/auth');

const router = express.Router();

const idOf = (value) => String(value?._id || value?.id || value);
const findChannelQuery = (idParam) => {
    if (!idParam) return { _id: null };
    const raw = String(idParam).trim();
    if (raw.match(/^[0-9a-fA-F]{24}$/)) {
        return { _id: raw };
    }
    const cleanSlug = raw.startsWith('#') ? raw.slice(1) : raw;
    return {
        $or: [
            { name: raw },
            { name: `#${cleanSlug}` },
            { name: cleanSlug }
        ]
    };
};
const isMember = (channel, userId) =>
    idOf(channel.admin) === idOf(userId) || (channel.members || []).some((member) => idOf(member) === idOf(userId));
const formatMessage = (message, userId) => {
    const attachment = message.attachment?.fileName ? message.attachment : null;
    const codeSnippet = message.codeSnippet?.code ? message.codeSnippet : null;
    return {
        id: message._id.toString(), _id: message._id.toString(), channelId: message.channelId,
        parentMessageId: message.parentMessageId ? idOf(message.parentMessageId) : null,
        type: attachment ? 'file' : codeSnippet ? 'code' : 'text', authorId: idOf(message.authorId),
        authorName: message.authorName, authorAvatar: message.authorAvatar, text: message.text,
        payload: attachment || codeSnippet, attachment, codeSnippet,
        timestamp: new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        createdAt: message.createdAt, threadCount: message.threadCount || 0,
        isPinned: Boolean(message.isPinned),
        reactions: (message.reactions || []).map((reaction) => ({
            emoji: reaction.emoji, count: reaction.users.length,
            userIds: reaction.users.map(idOf),
            reactedByMe: reaction.users.some((user) => idOf(user) === idOf(userId))
        })).filter((reaction) => reaction.count > 0)
    };
};

const formatChannel = (channel, userId) => ({
    id: channel._id.toString(),
    _id: channel._id.toString(),
    name: channel.name,
    skillId: channel.skillId,
    channelType: channel.channelType || 'text',
    category: channel.category || 'General',
    admin: idOf(channel.admin),
    description: channel.description || '',
    memberCount: channel.members?.length || 1,
    unreadCount: channel.unreadCount || 0,
    members: (channel.members || []).map((member) => ({
        id: idOf(member),
        _id: idOf(member),
        name: member.name || 'Community member',
        avatar: member.avatar || null
    })),
    teamId: channel.teamId ? idOf(channel.teamId) : null,
    isPrivate: Boolean(channel.isPrivate),
    isMember: isMember(channel, userId),
    isAdmin: idOf(channel.admin) === idOf(userId),
    pendingInvitations: idOf(channel.admin) === idOf(userId)
        ? (channel.invitations || []).filter((invite) => invite.status === 'pending').map((invite) => invite.email)
        : undefined
});

const DEFAULT_CHANNELS = [
    { name: '#python-help', skillName: 'Python', memberCount: 124, unreadCount: 0 },
    { name: '#mern-stack', skillName: 'MERN Stack', memberCount: 98, unreadCount: 2 },
    { name: '#ai-ml-discussions', skillName: 'AI/ML', memberCount: 160, unreadCount: 1 },
    { name: '#dsa-prep', skillName: 'DSA', memberCount: 210, unreadCount: 0 },
    { name: '#ui-ux-critique', skillName: 'UI/UX', memberCount: 85, unreadCount: 0 },
    { name: '#cybersec-ops', skillName: 'Cybersecurity', memberCount: 64, unreadCount: 0 }
];

// GET /api/channels - List all channels
router.get('/', protect, async (req, res) => {
    try {
        const search = String(req.query.search || req.query.q || '').trim();
        let filter = { $or: [
            { isPrivate: { $ne: true } }, { admin: req.user._id }, { members: req.user._id },
            { invitations: { $elemMatch: { email: String(req.user.email || '').toLowerCase(), status: 'pending' } } }
        ] };

        if (search) {
            const searchRegex = new RegExp(search, 'i');
            filter = {
                $and: [
                    filter,
                    {
                        $or: [
                            { name: searchRegex },
                            { description: searchRegex }
                        ]
                    }
                ]
            };
        }

        const channels = await Channel.find(filter)
            .populate('members', 'name email avatar');
        const response = channels.map((channel) => {
            const invitedOnly = channel.isPrivate && !isMember(channel, req.user._id);
            if (!invitedOnly) return formatChannel(channel, req.user._id);
            return {
                id: channel._id.toString(), _id: channel._id.toString(), name: channel.name,
                skillId: channel.skillId, channelType: channel.channelType || 'text', category: channel.category || 'General', isPrivate: true, isMember: false, isAdmin: false,
                invitationPending: true, members: [], memberCount: 0
            };
        });
        return res.json(response);
    } catch (error) {
        return res.status(500).json({ message: 'Failed to load channels' });
    }
});

// GET /api/channels/suggested - List public channels user is not currently a member of
router.get('/suggested', protect, async (req, res) => {
    try {
        const currentUserId = req.user._id;
        const suggested = await Channel.find({
            isPrivate: { $ne: true },
            admin: { $ne: currentUserId },
            members: { $ne: currentUserId }
        }).populate('members', 'name email avatar');

        return res.json(suggested.map((channel) => formatChannel(channel, currentUserId)));
    } catch (error) {
        console.error('Error loading suggested channels:', error);
        return res.status(500).json({ message: 'Failed to load suggested channels' });
    }
});

// Private channel details are visible only to members and the owner.
router.get('/:id', protect, async (req, res) => {
    try {
        const channel = await Channel.findOne(findChannelQuery(req.params.id)).populate('members', 'name email avatar');
        if (!channel) return res.status(404).json({ message: 'Channel not found' });
        if (channel.isPrivate && !isMember(channel, req.user._id)) {
            return res.status(403).json({ message: 'This private channel requires an invitation.' });
        }
        return res.json(formatChannel(channel, req.user._id));
    } catch (error) {
        return res.status(400).json({ message: 'Invalid channel ID' });
    }
});

// POST /api/channels - Create a new community/channel
router.post('/', protect, async (req, res) => {
    try {
        const { name, skillId, isPrivate, description, channelType, category } = req.body;
        if (!name || !skillId) {
            return res.status(400).json({ message: 'Channel name and associated skill are required' });
        }

        const userId = req.user.id || req.user._id;

        const newChannel = await Channel.create({
            name: name.toLowerCase().replace(/\s+/g, '-'), // enforce slug format
            skillId,
            channelType: ['text', 'voice', 'forum'].includes(channelType) ? channelType : 'text',
            category: String(category || 'General').trim().slice(0, 50) || 'General',
            admin: userId,
            members: [userId],
            isPrivate: isPrivate || false,
            description: description || '',
            memberCount: 1
        });

        await newChannel.populate('members', 'name email avatar');

        // Create document in Feed / Activity collection with type COMMUNITY_CREATED
        const activityDoc = {
            type: 'COMMUNITY_CREATED',
            user: userId,
            channel: newChannel._id,
            channelId: newChannel._id,
            userName: req.user.name || 'User',
            userAvatar: req.user.avatar || null,
            channelName: newChannel.name,
            channelDescription: newChannel.description || '',
            text: `${req.user.name || 'User'} created a new community: ${newChannel.name}`
        };

        try {
            await Promise.all([
                Activity.create(activityDoc),
                Feed.create(activityDoc)
            ]);
        } catch (actErr) {
            console.error('Failed to create community activity record:', actErr);
        }

        const io = req.app.get('io');
        io?.emit('activity:created', {
            ...activityDoc,
            id: newChannel._id.toString(),
            createdAt: new Date().toISOString()
        });
        io?.emit('feed:new', {
            ...activityDoc,
            id: newChannel._id.toString(),
            createdAt: new Date().toISOString()
        });

        res.status(201).json(formatChannel(newChannel, userId));
    } catch (error) {
        console.error('Error creating channel:', error);
        res.status(500).json({ message: 'Server error creating channel' });
    }
});

// Anyone signed in may join a public channel. Private channels require an invite.
router.post('/:id/join', protect, async (req, res) => {
    try {
        const channel = await Channel.findOne(findChannelQuery(req.params.id));
        if (!channel) return res.status(404).json({ message: 'Channel not found' });
        if (isMember(channel, req.user._id)) return res.json({ message: 'Already a member' });
        if (channel.isPrivate) {
            const email = String(req.user.email || '').toLowerCase();
            const invite = (channel.invitations || []).find((item) => item.email === email && item.status === 'pending');
            if (!invite) return res.status(403).json({ message: 'You need an invitation to join this private channel.' });
            invite.status = 'accepted';
            await Channel.updateOne(
                { _id: channel._id, 'invitations.email': email },
                { $set: { 'invitations.$.status': 'accepted' } }
            );
        }

        const updatedChannel = await Channel.findByIdAndUpdate(
            channel._id,
            { $addToSet: { members: req.user._id }, $inc: { memberCount: 1 } },
            { new: true, runValidators: false } // runValidators: false prevents the missing admin crash
        ).populate('members', 'name email avatar');

        return res.json({ message: 'Joined channel', channel: formatChannel(updatedChannel, req.user._id) });
    } catch (error) {
        return res.status(400).json({ message: 'Unable to join channel', error: error.message });
    }
});

router.delete('/:id/membership', protect, async (req, res) => {
    try {
        const channel = await Channel.findById(req.params.id);
        if (!channel) return res.status(404).json({ message: 'Channel not found' });
        if (idOf(channel.admin) === idOf(req.user._id)) {
            return res.status(400).json({ message: 'The channel owner cannot leave their own channel.' });
        }
        channel.members.pull(req.user._id);
        await channel.save();
        const room = `channel:${channel._id}`;
        const io = req.app.get('io');
        const sockets = await io?.in(room).fetchSockets();
        await Promise.all((sockets || [])
            .filter(socket => idOf(socket.data?.user?.id || socket.user?._id) === idOf(req.user._id))
            .map(socket => socket.leave(room)));
        const voiceRoom = `voice:${channel._id}`;
        const voiceSockets = await io?.in(voiceRoom).fetchSockets();
        const leavingVoiceSockets = (voiceSockets || [])
            .filter(socket => idOf(socket.data?.user?.id || socket.user?._id) === idOf(req.user._id));
        for (const socket of leavingVoiceSockets) {
            io?.to(voiceRoom).emit('voice:participant-left', socket.id);
            socket.data.voiceRooms?.delete(channel._id.toString());
            await socket.leave(voiceRoom);
        }
        return res.json({ message: 'Left channel' });
    } catch (error) {
        return res.status(400).json({ message: 'Unable to leave channel' });
    }
});

// DELETE /api/channels/:id - Delete a channel created by the user
router.delete('/:id', protect, async (req, res) => {
    try {
        const channel = await Channel.findOne(findChannelQuery(req.params.id));
        if (!channel) return res.status(404).json({ message: 'Channel not found' });
        if (idOf(channel.admin) !== idOf(req.user._id)) {
            return res.status(403).json({ message: 'Only the channel creator/admin can delete this channel.' });
        }

        const channelIdStr = channel._id.toString();

        // 1. Delete associated messages
        await Message.deleteMany({
            $or: [
                { channelId: channel._id },
                { channelId: channelIdStr },
                { channelId: channel.name }
            ]
        });

        // 2. Delete associated activities and feeds
        await Promise.all([
            Activity.deleteMany({
                $or: [
                    { channel: channel._id },
                    { channelId: channel._id },
                    { channelId: channelIdStr }
                ]
            }),
            Feed.deleteMany({
                $or: [
                    { channel: channel._id },
                    { channelId: channel._id },
                    { channelId: channelIdStr }
                ]
            })
        ]);

        // 3. Delete forum posts & community events if any
        try {
            const ForumPost = require('../models/ForumPost');
            await ForumPost.deleteMany({ channelId: channel._id });
        } catch {
            // ignore if model not present
        }

        try {
            const CommunityEvent = require('../models/CommunityEvent');
            await CommunityEvent.deleteMany({ channelId: channel._id });
        } catch {
            // ignore if model not present
        }

        try {
            const Notification = require('../models/Notification');
            await Notification.deleteMany({ targetId: channelIdStr });
        } catch {
            // ignore if model not present
        }

        // 4. Delete the channel itself
        await Channel.deleteOne({ _id: channel._id });

        // 5. Notify via Socket.IO
        const io = req.app.get('io');
        const room = `channel:${channelIdStr}`;
        io?.to(room).emit('channel:deleted', { channelId: channelIdStr });
        io?.emit('channel:removed', { channelId: channelIdStr });

        // Disconnect sockets from the room
        const sockets = await io?.in(room).fetchSockets();
        if (sockets && sockets.length) {
            for (const socket of sockets) {
                await socket.leave(room);
            }
        }

        const voiceRoom = `voice:${channelIdStr}`;
        const voiceSockets = await io?.in(voiceRoom).fetchSockets();
        if (voiceSockets && voiceSockets.length) {
            for (const socket of voiceSockets) {
                io?.to(voiceRoom).emit('voice:participant-left', socket.id);
                socket.data.voiceRooms?.delete(channelIdStr);
                await socket.leave(voiceRoom);
            }
        }

        return res.json({ message: 'Channel deleted successfully', channelId: channelIdStr });
    } catch (error) {
        console.error('Error deleting channel:', error);
        return res.status(500).json({ message: 'Failed to delete channel', error: error.message });
    }
});

router.post('/:id/invitations', protect, async (req, res) => {
    try {
        const channel = await Channel.findById(req.params.id);
        if (!channel) return res.status(404).json({ message: 'Channel not found' });
        if (idOf(channel.admin) !== idOf(req.user._id)) return res.status(403).json({ message: 'Only the channel owner can invite members.' });
        if (!channel.isPrivate) return res.status(400).json({ message: 'Invitations are for private channels only.' });
        const email = String(req.body.email || '').trim().toLowerCase();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ message: 'Enter a valid email address.' });
        const invitedUser = await User.findOne({ email });
        if (!invitedUser) return res.status(404).json({ message: 'No registered user has that email address.' });
        if (isMember(channel, invitedUser._id)) return res.status(409).json({ message: 'That user is already a member.' });
        if ((channel.invitations || []).some((item) => item.email === email && item.status === 'pending')) {
            return res.status(409).json({ message: 'An invitation is already pending.' });
        }
        channel.invitations.push({ email, invitedBy: req.user._id, status: 'pending' });
        await channel.save();
        const Notification = require('../models/Notification');
        await Notification.create({
            recipient: invitedUser._id,
            sender: req.user._id,
            senderName: req.user.name || 'Channel owner',
            senderAvatar: req.user.avatar || null,
            type: 'channel_invite',
            title: 'Private channel invitation',
            message: `${req.user.name || 'A channel owner'} invited you to join ${channel.name}.`,
            link: `/dashboard/channels/${channel._id}`,
            targetType: 'channel',
            targetId: channel._id.toString(),
            targetTitle: channel.name,
            status: 'pending',
            read: false
        });
        return res.status(201).json({ message: `Invitation created for ${email}. They can join after signing in.` });
    } catch (error) {
        return res.status(500).json({ message: 'Unable to invite user' });
    }
});

// Attachment downloads require channel membership, just like reading messages.
router.get('/:id/files/:filename', protect, async (req, res) => {
    try {
        const { id, filename } = req.params;
        if (path.basename(filename) !== filename || !/^[a-zA-Z0-9_.-]+$/.test(filename)) {
            return res.status(400).json({ message: 'Invalid file name' });
        }
        const channel = await Channel.findById(id);
        if (!channel) return res.status(404).json({ message: 'Channel not found' });
        if (!isMember(channel, req.user._id)) return res.status(403).json({ message: 'Join this channel to download its files.' });
        const legacyUrl = `/uploads/attachments/${filename}`;
        const fullUrl = `http://localhost:${process.env.PORT || 5000}${legacyUrl}`;
        const attached = await Message.exists({ channelId: id, 'attachment.fileUrl': { $in: [legacyUrl, fullUrl] } });
        if (!attached) return res.status(404).json({ message: 'File not found in this channel' });
        return res.sendFile(filename, { root: path.join(__dirname, '..', 'uploads', 'attachments') });
    } catch (error) {
        return res.status(400).json({ message: 'Unable to download file' });
    }
});

// GET /api/channels/:id/messages - List messages for channel
router.get('/:id/messages', protect, async (req, res) => {
    try {
        const { id } = req.params;
        const channel = await Channel.findById(id);
        if (!channel) return res.status(404).json({ message: 'Channel not found' });
        if (channel.isPrivate && !isMember(channel, req.user._id)) return res.status(403).json({ message: 'You cannot read this private channel.' });
        const messages = await Message.find({ channelId: id, parentMessageId: null }).sort({ createdAt: 1 });

        if (!messages || messages.length === 0) return res.json([]);

        const formatted = messages.map((message) => formatMessage(message, req.user._id));

        return res.json(formatted);
    } catch (error) {
        return res.json([]);
    }
});

router.get('/:id/pins', protect, async (req, res) => {
    try {
        const channel = await Channel.findById(req.params.id);
        if (!channel) return res.status(404).json({ message: 'Channel not found' });
        if (!isMember(channel, req.user._id)) return res.status(403).json({ message: 'Join this channel to view pinned messages.' });
        const pins = await Message.find({ channelId: req.params.id, isPinned: true, parentMessageId: null }).sort({ pinnedAt: -1 });
        return res.json(pins.map((message) => formatMessage(message, req.user._id)));
    } catch (error) { return res.status(400).json({ message: 'Unable to load pinned messages.' }); }
});

router.get('/:id/messages/:messageId/replies', protect, async (req, res) => {
    try {
        const channel = await Channel.findById(req.params.id);
        if (!channel) return res.status(404).json({ message: 'Channel not found' });
        if (!isMember(channel, req.user._id)) return res.status(403).json({ message: 'Join this channel to view replies.' });
        const parent = await Message.findOne({ _id: req.params.messageId, channelId: req.params.id, parentMessageId: null });
        if (!parent) return res.status(404).json({ message: 'Message thread not found.' });
        const replies = await Message.find({ channelId: req.params.id, parentMessageId: parent._id }).sort({ createdAt: 1 });
        return res.json(replies.map((reply) => formatMessage(reply, req.user._id)));
    } catch (error) { return res.status(400).json({ message: 'Unable to load thread replies.' }); }
});

router.post('/:id/messages/:messageId/replies', protect, async (req, res) => {
    try {
        const channel = await Channel.findById(req.params.id);
        if (!channel) return res.status(404).json({ message: 'Channel not found' });
        if (!isMember(channel, req.user._id)) return res.status(403).json({ message: 'Join this channel to reply.' });
        const parent = await Message.findOne({ _id: req.params.messageId, channelId: req.params.id, parentMessageId: null });
        if (!parent) return res.status(404).json({ message: 'Message thread not found.' });
        const text = String(req.body.text || '').trim();
        if (!text || text.length > 4000) return res.status(400).json({ message: 'Reply must contain 1 to 4000 characters.' });
        const reply = await Message.create({ channelId: req.params.id, parentMessageId: parent._id, authorId: req.user._id, authorName: req.user.name || 'Anonymous', authorAvatar: req.user.avatar || null, text });
        parent.threadCount = await Message.countDocuments({ channelId: req.params.id, parentMessageId: parent._id });
        await parent.save();
        const formatted = formatMessage(reply, req.user._id);
        const io = req.app.get('io');
        io?.to(`channel:${req.params.id}`).emit('channel:thread-reply', { parentMessageId: parent._id.toString(), message: formatted, threadCount: parent.threadCount });
        return res.status(201).json({ message: formatted, threadCount: parent.threadCount });
    } catch (error) { return res.status(500).json({ message: 'Unable to send thread reply.' }); }
});

router.post('/:id/messages/:messageId/reactions', protect, async (req, res) => {
    try {
        const channel = await Channel.findById(req.params.id);
        if (!channel) return res.status(404).json({ message: 'Channel not found' });
        if (!isMember(channel, req.user._id)) return res.status(403).json({ message: 'Join this channel to react.' });
        const emoji = String(req.body.emoji || '');
        if (!['👍', '❤️', '😂', '😮', '🎉', '✅', '🔥'].includes(emoji)) return res.status(400).json({ message: 'Choose a supported reaction.' });
        const message = await Message.findOne({ _id: req.params.messageId, channelId: req.params.id, parentMessageId: null });
        if (!message) return res.status(404).json({ message: 'Message not found.' });
        let reaction = message.reactions.find((item) => item.emoji === emoji);
        if (!reaction) { message.reactions.push({ emoji, users: [req.user._id] }); }
        else if (reaction.users.some((user) => idOf(user) === idOf(req.user._id))) reaction.users.pull(req.user._id);
        else reaction.users.addToSet(req.user._id);
        message.reactions = message.reactions.filter((item) => item.users.length > 0);
        await message.save();
        const formatted = formatMessage(message, req.user._id);
        req.app.get('io')?.to(`channel:${req.params.id}`).emit('channel:message-updated', formatted);
        return res.json(formatted);
    } catch (error) { return res.status(500).json({ message: 'Unable to update reaction.' }); }
});

router.post('/:id/messages/:messageId/pin', protect, async (req, res) => {
    try {
        const channel = await Channel.findById(req.params.id);
        if (!channel) return res.status(404).json({ message: 'Channel not found' });
        if (idOf(channel.admin) !== idOf(req.user._id)) return res.status(403).json({ message: 'Only the channel owner can pin messages.' });
        const message = await Message.findOne({ _id: req.params.messageId, channelId: req.params.id, parentMessageId: null });
        if (!message) return res.status(404).json({ message: 'Message not found.' });
        message.isPinned = !message.isPinned;
        message.pinnedAt = message.isPinned ? new Date() : null;
        await message.save();
        const formatted = formatMessage(message, req.user._id);
        req.app.get('io')?.to(`channel:${req.params.id}`).emit('channel:message-updated', formatted);
        return res.json(formatted);
    } catch (error) { return res.status(500).json({ message: 'Unable to update pin.' }); }
});

// POST /api/channels/:id/messages - Post message to channel
router.post('/:id/messages', protect, async (req, res) => {
    try {
        const { id } = req.params;
        const channel = await Channel.findById(id);
        if (!channel) return res.status(404).json({ message: 'Channel not found' });
        if (!isMember(channel, req.user._id)) return res.status(403).json({ message: 'Join this channel before sending messages.' });
        const { content, text, codeSnippet, attachment } = req.body;

        const messageText = content || text || '';
        if (!messageText && !codeSnippet?.code && !attachment?.fileName) {
            return res.status(400).json({ message: 'Message text is required' });
        }

        const message = await Message.create({
            channelId: id,
            authorId: req.user._id,
            authorName: req.user.name || 'Anonymous',
            authorAvatar: req.user.avatar || null,
            text: messageText || (codeSnippet?.code ? 'Shared a code snippet' : `Shared a file: ${attachment.fileName}`),
            codeSnippet: codeSnippet || null,
            attachment: attachment || null,
            threadCount: 0
        });

        // Trigger notifications for any @mentioned users
        try {
            const User = require('../models/User');
            const Notification = require('../models/Notification');
            const mentionMatches = messageText.match(/@([a-zA-Z0-9_]+)/g);
            if (mentionMatches && mentionMatches.length > 0) {
                for (const rawMention of mentionMatches) {
                    const mentionName = rawMention.substring(1);
                    const mentionedUser = await User.findOne({
                        $or: [
                            { name: new RegExp(`^${mentionName}`, 'i') },
                            { email: new RegExp(`^${mentionName}@`, 'i') }
                        ]
                    });
                    if (mentionedUser && mentionedUser._id.toString() !== req.user._id.toString()) {
                        await Notification.create({
                            recipient: mentionedUser._id,
                            sender: req.user._id,
                            senderName: req.user.name || 'Student',
                            senderAvatar: req.user.avatar || null,
                            type: 'mention',
                            title: 'New Mention',
                            message: `${req.user.name || 'Someone'} mentioned you: "${messageText.slice(0, 60)}"`,
                            link: `/dashboard/channels/${id}`,
                            targetType: 'channel',
                            targetId: id,
                            status: 'read',
                            read: false
                        });
                    }
                }
            }
        } catch (notifErr) {
            // non-fatal
        }

        const formatted = formatMessage(message, req.user._id);

        // Emit message:new with the saved message object to the channel room
        const io = req.app.get('io');
        if (io) {
            io.to(`channel:${id}`).emit('message:new', formatted);
            if (channel._id && channel._id.toString() !== id) {
                io.to(`channel:${channel._id}`).emit('message:new', formatted);
            }
            io.to(`channel:${id}`).emit('channel:message', formatted);
        }

        return res.status(201).json({
            message: formatted,
            ...formatted
        });
    } catch (error) {
        return res.status(500).json({ message: 'Failed to send message', error: error.message });
    }
});

module.exports = router;
