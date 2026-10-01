const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

// Helper to generate JWT token
const generateToken = (user) => {
    return jwt.sign(
        {
            id: user._id,
            email: user.email
        },
        process.env.JWT_SECRET || 'default_secret',
        { expiresIn: '7d' }
    );
};

// Helper to format user response
const formatUser = (user) => ({
    id: user._id.toString(),
    _id: user._id.toString(),
    name: user.name,
    email: user.email,
    skills: user.skills || [],
    bio: user.bio || '',
    batch: user.batch || '',
    isMentor: user.isMentor || false,
    avatar: user.avatar || null,
    stats: user.stats || { queriesResolved: 0, teamsAdvised: 0, sessionsLed: 0 },
    projects: user.projects || []
});

// REGISTER: POST /api/auth/register
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, batch, skills } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Name, email, and password are required' });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const existingUser = await User.findOne({ email: normalizedEmail });

        if (existingUser) {
            return res.status(409).json({
                message: 'Email already registered',
                error: 'Email already registered'
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            name,
            email: normalizedEmail,
            password: hashedPassword,
            batch: batch || '',
            skills: skills || [],
            bio: '',
            isMentor: false,
            avatar: null
        });

        const token = generateToken(user);

        return res.status(201).json({
            message: 'Registration successful',
            token,
            user: formatUser(user)
        });

    } catch (error) {
        console.error('Registration error:', error);
        return res.status(500).json({
            message: 'Registration failed',
            error: error.message
        });
    }
});

// LOGIN: POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const user = await User.findOne({ email: normalizedEmail });

        if (!user) {
            return res.status(401).json({
                message: 'Invalid email or password',
                error: 'Invalid email or password'
            });
        }

        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
            return res.status(401).json({
                message: 'Invalid email or password',
                error: 'Invalid email or password'
            });
        }

        const token = generateToken(user);

        return res.json({
            message: 'Login successful',
            token,
            user: formatUser(user)
        });

    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({
            message: 'Login failed',
            error: error.message
        });
    }
});

// VERIFY EMAIL: POST /api/auth/verify-email
router.post('/verify-email', async (req, res) => {
    try {
        const { token } = req.body;
        // Mock email token verification
        return res.json({
            verified: true,
            message: 'Email verified successfully'
        });
    } catch (error) {
        return res.status(500).json({ message: 'Email verification failed' });
    }
});

module.exports = router;