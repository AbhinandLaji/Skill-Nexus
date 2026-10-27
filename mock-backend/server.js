
const express = require('express');
const http = require('http');
const path = require('path');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { Server } = require('socket.io');
// Load environment variables
require('dotenv').config();

const authRoutes = require('./routes/auth');
const skillsRoutes = require('./routes/skills');
const usersRoutes = require('./routes/users');
const teamsRoutes = require('./routes/teams');
const opportunitiesRoutes = require('./routes/opportunities');
const mentorsRoutes = require('./routes/mentors');
const mentorshipRoutes = require('./routes/mentorship');
const channelsRoutes = require('./routes/channels');
const notificationsRoutes = require('./routes/notifications');
const uploadRoutes = require('./routes/upload');
const conversationsRoutes = require('./routes/conversations');
const forumRoutes = require('./routes/forum');
const eventsRoutes = require('./routes/events');
const searchRoutes = require('./routes/search');
const feedRoutes = require('./routes/feed');
const User = require('./models/User');
const Channel = require('./models/Channel');
const Conversation = require('./models/Conversation');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: true, methods: ['GET', 'POST'] }
});
app.set('io', io);
const activeDmCalls = new Map();

io.use(async (socket, next) => {
    try {
        const token = socket.handshake.auth?.token;
        if (!token) return next(new Error('Not authorized, no token provided'));

        let user;
        if (process.env.NODE_ENV !== 'production' && token === 'mock-jwt-token') {
            user = await User.findOne().select('-password');
        } else {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret');
            user = await User.findById(decoded.id).select('-password');
        }

        if (!user) return next(new Error('Not authorized, user not found'));
        socket.user = user;
        socket.data.user = user;
        next();
    } catch (error) {
        next(new Error('Not authorized, token failed'));
    }
});

io.on('connection', (socket) => {
    socket.on('channel:join', async (channelId, acknowledge) => {
        try {
            if (!channelId) return;
            let channel = null;
            if (mongoose.isValidObjectId(channelId)) {
                channel = await Channel.findById(channelId).select('_id admin members isPrivate');
            } else {
                channel = await Channel.findOne({ name: channelId }).select('_id admin members isPrivate');
            }
            if (!channel) return;
            const currentUserId = (socket.data?.user?._id || socket.user?._id || '').toString();
            const isMember = (channel.admin && channel.admin.toString() === currentUserId) ||
                (channel.members && channel.members.some((memberId) => memberId.toString() === currentUserId));
            if (!isMember) return; // Ignore silently if not a member

            await socket.join(`channel:${channelId}`);
            if (channel._id.toString() !== String(channelId)) {
                await socket.join(`channel:${channel._id}`);
            }
            if (typeof acknowledge === 'function') acknowledge({ ok: true });
        } catch (error) {
            // Ignore silently if not a member or invalid
        }
    });

    socket.on('channel:leave', (channelId) => {
        if (channelId) socket.leave(`channel:${channelId}`);
    });

    socket.data.voiceRooms = new Set();
    socket.data.dmCallRooms = new Set();

    socket.on('voice:join', async (channelId, acknowledge = () => {}) => {
        try {
            const channel = await Channel.findById(channelId).select('_id admin members channelType');
            if (!channel) return acknowledge({ ok: false, error: 'Voice channel not found' });
            if (channel.channelType !== 'voice') return acknowledge({ ok: false, error: 'This is not a voice channel.' });
            const isMember = channel.admin?.toString() === socket.user._id.toString() ||
                channel.members.some((memberId) => memberId.toString() === socket.user._id.toString());
            if (!isMember) return acknowledge({ ok: false, error: 'Join this channel before entering voice.' });

            const room = `voice:${channel._id}`;
            const existingSockets = await io.in(room).fetchSockets();
            const participants = existingSockets
                .filter((participant) => participant.id !== socket.id)
                .map((participant) => ({
                    id: participant.id,
                    name: participant.data?.user?.name || 'Community member',
                    avatar: participant.data?.user?.avatar || null
                }));

            await socket.join(room);
            socket.data.voiceRooms.add(channel._id.toString());
            const participant = {
                id: socket.id,
                name: socket.user.name || 'Community member',
                avatar: socket.user.avatar || null
            };
            socket.to(room).emit('voice:participant-joined', participant);
            acknowledge({ ok: true, participants });
        } catch (error) {
            acknowledge({ ok: false, error: 'Unable to join voice channel' });
        }
    });

    socket.on('voice:leave', (channelId) => {
        if (typeof channelId !== 'string') return;
        const room = `voice:${channelId}`;
        socket.leave(room);
        socket.data.voiceRooms.delete(channelId);
        socket.to(room).emit('voice:participant-left', socket.id);
    });

    socket.on('voice:signal', ({ channelId, to, signal } = {}) => {
        if (typeof channelId !== 'string' || typeof to !== 'string' || !signal) return;
        const room = `voice:${channelId}`;
        if (!socket.data.voiceRooms.has(channelId)) return;
        const recipient = io.sockets.sockets.get(to);
        if (!recipient?.rooms.has(room)) return;
        recipient.emit('voice:signal', { from: socket.id, signal });
    });

    socket.on('disconnect', () => {
        for (const channelId of socket.data.voiceRooms) {
            socket.to(`voice:${channelId}`).emit('voice:participant-left', socket.id);
        }
        for (const conversationId of socket.data.dmCallRooms) {
            const room = `dmcall:${conversationId}`;
            socket.to(room).emit('dmcall:participant-left', socket.id);
            setTimeout(async () => {
                const remaining = await io.in(room).fetchSockets();
                if (remaining.length === 0) {
                    activeDmCalls.delete(conversationId);
                    io.to(`dm:${conversationId}`).emit('dmcall:ended', conversationId);
                }
            }, 0);
        }
    });

    socket.on('dm:join', async (conversationId, acknowledge = () => {}) => {
        try {
            const conversation = await Conversation.findById(conversationId).select('_id members');
            if (!conversation) return acknowledge({ ok: false, error: 'Conversation not found' });
            const isMember = conversation.members.some((memberId) => memberId.toString() === socket.user._id.toString());
            if (!isMember) return acknowledge({ ok: false, error: 'You are not a member of this conversation.' });
            await socket.join(`dm:${conversation._id}`);
            acknowledge({ ok: true, activeCall: activeDmCalls.get(conversation._id.toString()) || null });
        } catch (error) {
            acknowledge({ ok: false, error: 'Unable to join conversation' });
        }
    });

    socket.on('dm:leave', (conversationId) => {
        if (typeof conversationId === 'string') socket.leave(`dm:${conversationId}`);
    });

    socket.on('dmcall:join', async ({ conversationId, mode } = {}, acknowledge = () => {}) => {
        try {
            if (!['audio', 'video'].includes(mode)) return acknowledge({ ok: false, error: 'Choose audio or video for this call.' });
            const conversation = await Conversation.findById(conversationId).select('_id members');
            if (!conversation) return acknowledge({ ok: false, error: 'Conversation not found' });
            const isMember = conversation.members.some((memberId) => memberId.toString() === socket.user._id.toString());
            if (!isMember) return acknowledge({ ok: false, error: 'You are not a member of this conversation.' });

            const id = conversation._id.toString();
            const currentMode = activeDmCalls.get(id);
            if (currentMode && currentMode !== mode) return acknowledge({ ok: false, error: `An ${currentMode} call is already active.` });
            const callRoom = `dmcall:${id}`;
            const existingSockets = await io.in(callRoom).fetchSockets();
            if (existingSockets.length >= 8 && !existingSockets.some((participant) => participant.id === socket.id)) {
                return acknowledge({ ok: false, error: 'This call has reached its 8 participant limit.' });
            }

            const isNewCall = !currentMode;
            activeDmCalls.set(id, mode);
            await socket.join(callRoom);
            socket.data.dmCallRooms.add(id);
            if (isNewCall) {
                socket.to(`dm:${id}`).emit('dmcall:started', {
                    conversationId: id,
                    mode,
                    starter: { id: socket.id, name: socket.user.name || 'Community member' }
                });
            }
            const participants = existingSockets
                .filter((participant) => participant.id !== socket.id)
                .map((participant) => ({
                    id: participant.id,
                    name: participant.data?.user?.name || 'Community member',
                    avatar: participant.data?.user?.avatar || null
                }));
            socket.to(callRoom).emit('dmcall:participant-joined', {
                id: socket.id,
                name: socket.user.name || 'Community member',
                avatar: socket.user.avatar || null
            });
            acknowledge({ ok: true, mode, participants });
        } catch (error) {
            acknowledge({ ok: false, error: 'Unable to join this call' });
        }
    });

    socket.on('dmcall:signal', ({ conversationId, to, signal } = {}) => {
        if (typeof conversationId !== 'string' || typeof to !== 'string' || !signal) return;
        const id = conversationId;
        const callRoom = `dmcall:${id}`;
        if (!socket.data.dmCallRooms.has(id)) return;
        const recipient = io.sockets.sockets.get(to);
        if (!recipient?.rooms.has(callRoom)) return;
        recipient.emit('dmcall:signal', { from: socket.id, signal });
    });

    socket.on('dmcall:leave', (conversationId) => {
        if (typeof conversationId !== 'string') return;
        const callRoom = `dmcall:${conversationId}`;
        socket.leave(callRoom);
        socket.data.dmCallRooms.delete(conversationId);
        socket.to(callRoom).emit('dmcall:participant-left', socket.id);
        io.in(callRoom).fetchSockets().then((remaining) => {
            if (remaining.length === 0) {
                activeDmCalls.delete(conversationId);
                io.to(`dm:${conversationId}`).emit('dmcall:ended', conversationId);
            }
        }).catch((error) => console.error('Could not clean up DM call:', error));
    });
});

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true
}));
app.use(express.json());
// Avatars are public profile images. Chat attachments are served through a
// channel-authorized download route in routes/channels.js.
app.use('/uploads/avatars', express.static(path.join(__dirname, 'uploads', 'avatars')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/skills', skillsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/teams', teamsRoutes);
app.use('/api/opportunities', opportunitiesRoutes);
app.use('/api/mentors', mentorsRoutes);
app.use('/api/mentorship', mentorshipRoutes);
app.use('/api/channels', forumRoutes);
app.use('/api/channels', eventsRoutes);
app.use('/api/channels', channelsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/conversations', conversationsRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/feed', feedRoutes);
app.use('/api/activities', feedRoutes);

// Health check
app.get('/api/health', (req, res) => {
    const isConnected = mongoose.connection.readyState === 1;
    res.json({
        status: isConnected ? 'ok' : 'connecting',
        dbConnected: isConnected,
        database: mongoose.connection.name || 'disconnected',
        readyState: mongoose.connection.readyState,
        timestamp: new Date().toISOString()
    });
});

app.get('/', (req, res) => {
    res.send('Skill-Nexus Backend Server is running');
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('Unhandled server error:', err.stack);
    res.status(500).json({
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'production' ? null : err.message
    });
});

// Database Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/test';

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(MONGODB_URI, {
            serverSelectionTimeoutMS: 15000
        });
        console.log(`MongoDB connected successfully to database: "${conn.connection.name}"`);
        return conn;
    } catch (error) {
        console.error('MongoDB connection failed:', error.message);
        throw error;
    }
};

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        await connectDB();
        server.listen(PORT, () => {
            console.log(`Skill-Nexus server running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Could not start server due to database connection error, retrying in 5 seconds...', error.message);
        setTimeout(startServer, 5000);
    }
};

startServer();
