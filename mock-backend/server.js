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

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
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
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/skillnexus';

mongoose.set('bufferCommands', false);

mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 3000 })
    .then(() => {
        console.log('MongoDB connected successfully');
    })
    .catch((error) => {
        console.error('MongoDB connection failed:', error.message);
    });

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Skill-Nexus server running on port ${PORT}`);
});