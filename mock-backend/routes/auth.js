const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { generateOtp, sendOtpEmail } = require('../services/emailService');

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
    isVerified: user.isVerified || false,
    skills: user.skills || [],
    bio: user.bio || '',
    batch: user.batch || '',
    isMentor: user.isMentor || false,
    avatar: user.avatar || null,
    stats: user.stats || { queriesResolved: 0, teamsAdvised: 0, sessionsLed: 0 },
    projects: user.projects || []
});
const otpDeliveryMessage = (delivery, sentMessage) => delivery.devOtp
    ? `Email is not configured for this development server. Use this development-only code: ${delivery.devOtp}`
    : sentMessage;

// REGISTER: POST /api/auth/register
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, batch, skills } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Name, email, and password are required' });
        }

        const normalizedEmail = email.toLowerCase().trim();
        if (!normalizedEmail.endsWith('@tkmce.ac.in')) {
            return res.status(400).json({
                message: 'Registration is restricted to valid @tkmce.ac.in college email addresses.',
                error: 'Invalid email domain'
            });
        }
        const existingUser = await User.findOne({ email: normalizedEmail });

        if (existingUser) {
            if (existingUser.isVerified) {
                return res.status(409).json({
                    message: 'Email already registered',
                    error: 'Email already registered'
                });
            }

            // User registered previously but never verified email - send fresh OTP
            const otp = generateOtp();
            const hashedPassword = await bcrypt.hash(password, 10);
            existingUser.name = name;
            existingUser.password = hashedPassword;
            existingUser.verificationOtp = otp;
            existingUser.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
            if (skills) existingUser.skills = skills;
            if (batch) existingUser.batch = batch;
            await existingUser.save();

            let delivery;
            try {
                delivery = await sendOtpEmail({ to: normalizedEmail, otp, name: existingUser.name });
            } catch (mailError) {
                return res.status(503).json({ message: mailError.message, requireOtp: true, email: normalizedEmail });
            }

            return res.status(200).json({
                message: otpDeliveryMessage(delivery, 'Account pending verification. A fresh verification code has been sent to your email.'),
                requireOtp: true,
                email: normalizedEmail
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const otp = generateOtp();

        const user = await User.create({
            name,
            email: normalizedEmail,
            password: hashedPassword,
            batch: batch || '',
            skills: skills || [],
            bio: '',
            isMentor: false,
            avatar: null,
            isVerified: false,
            verificationOtp: otp,
            otpExpiresAt: new Date(Date.now() + 10 * 60 * 1000)
        });

        let delivery;
        try {
            delivery = await sendOtpEmail({ to: normalizedEmail, otp, name: user.name });
        } catch (mailError) {
            return res.status(503).json({ message: mailError.message, requireOtp: true, email: normalizedEmail });
        }

        return res.status(201).json({
            message: otpDeliveryMessage(delivery, 'Registration initiated. Please enter the 6-digit verification code sent to your email.'),
            requireOtp: true,
            email: normalizedEmail
        });

    } catch (error) {
        console.error('Registration error:', error);
        return res.status(500).json({
            message: 'Registration failed',
            error: error.message
        });
    }
});

// VERIFY OTP: POST /api/auth/verify-otp
router.post('/verify-otp', async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({ message: 'Email and verification code are required' });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const user = await User.findOne({ email: normalizedEmail });

        if (!user) {
            return res.status(404).json({ message: 'User account not found' });
        }

        if (user.isVerified) {
            const token = generateToken(user);
            return res.json({
                message: 'Account is already verified',
                token,
                user: formatUser(user)
            });
        }

        if (!user.verificationOtp || user.verificationOtp !== otp.trim()) {
            return res.status(400).json({ message: 'Invalid verification code. Please check your email.' });
        }

        if (!user.otpExpiresAt || new Date(user.otpExpiresAt) < new Date()) {
            return res.status(400).json({ message: 'Verification code has expired. Please request a new one.' });
        }

        // Successfully verified!
        user.isVerified = true;
        user.verificationOtp = null;
        user.otpExpiresAt = null;
        await user.save();

        const token = generateToken(user);

        return res.json({
            message: 'Email successfully verified!',
            token,
            user: formatUser(user)
        });

    } catch (error) {
        console.error('Verify OTP error:', error);
        return res.status(500).json({
            message: 'Verification failed',
            error: error.message
        });
    }
});

// RESEND OTP: POST /api/auth/resend-otp
router.post('/resend-otp', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const user = await User.findOne({ email: normalizedEmail });

        if (!user) {
            return res.status(404).json({ message: 'User account not found' });
        }

        if (user.isVerified) {
            return res.status(400).json({ message: 'Account is already verified' });
        }

        const newOtp = generateOtp();
        user.verificationOtp = newOtp;
        user.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
        await user.save();

        const delivery = await sendOtpEmail({ to: normalizedEmail, otp: newOtp, name: user.name });

        return res.json({
            message: otpDeliveryMessage(delivery, 'A fresh verification code has been sent to your email.')
        });

    } catch (error) {
        console.error('Resend OTP error:', error);
        return res.status(503).json({
            message: error.message || 'Failed to resend verification code',
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
        if (!normalizedEmail.endsWith('@tkmce.ac.in')) {
            return res.status(400).json({
                message: 'Access is restricted to valid @tkmce.ac.in college email addresses.',
                error: 'Invalid email domain'
            });
        }
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

        // If user is not yet verified, prompt OTP verification
        if (!user.isVerified) {
            const newOtp = generateOtp();
            user.verificationOtp = newOtp;
            user.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
            await user.save();

            let delivery;
            try {
                delivery = await sendOtpEmail({ to: normalizedEmail, otp: newOtp, name: user.name });
            } catch (mailError) {
                return res.status(503).json({ message: mailError.message, requireOtp: true, email: normalizedEmail });
            }

            return res.status(403).json({
                message: `Please verify your email before logging in. ${otpDeliveryMessage(delivery, 'A new verification code has been sent to your email.')}`,
                requireOtp: true,
                email: normalizedEmail
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

// VERIFY EMAIL LEGACY: POST /api/auth/verify-email
router.post('/verify-email', async (req, res) => {
    try {
        return res.json({
            verified: true,
            message: 'Email verified successfully'
        });
    } catch (error) {
        return res.status(500).json({ message: 'Email verification failed' });
    }
});

module.exports = router;