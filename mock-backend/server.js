const dns = require('dns');
try {
    dns.setServers(['8.8.8.8', '8.8.4.4']);
} catch (e) {
    // Ignore if not supported
}

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
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

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/skills', skillsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/teams', teamsRoutes);
app.use('/api/opportunities', opportunitiesRoutes);
app.use('/api/mentors', mentorsRoutes);
app.use('/api/mentorship', mentorshipRoutes);
app.use('/api/channels', channelsRoutes);
app.use('/api/notifications', notificationsRoutes);

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
    } catch (error) {
        console.error('MongoDB connection failed:', error.message);
        setTimeout(connectDB, 5000);
    }
};

connectDB();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Skill-Nexus server running on port ${PORT}`);
});