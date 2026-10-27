const crypto = require('crypto');
const nodemailer = require('nodemailer');

const getEmailConfig = () => {
    const user = String(process.env.EMAIL_USER || '').trim();
    const pass = String(process.env.EMAIL_PASS || '').replace(/\s+/g, '');
    const isPlaceholder = (value) => !value || ['sample', 'changeme', 'your_email', 'your_password'].includes(value.toLowerCase());
    if (isPlaceholder(user) || isPlaceholder(pass)) return null;

    if (process.env.SMTP_HOST) {
        const port = Number(process.env.SMTP_PORT || 587);
        return {
            transport: {
                host: process.env.SMTP_HOST,
                port,
                secure: String(process.env.SMTP_SECURE || (port === 465)).toLowerCase() === 'true',
                auth: { user, pass }
            },
            from: process.env.EMAIL_FROM || user
        };
    }

    return {
        transport: {
            host: 'smtp.gmail.com',
            port: 465,
            secure: true,
            auth: { user, pass },
            tls: { rejectUnauthorized: false }
        },
        from: process.env.EMAIL_FROM || user
    };
};

const generateOtp = () => crypto.randomInt(100000, 1000000).toString();

const sendOtpEmail = async ({ to, otp, name = 'Student' }) => {
    const config = getEmailConfig();
    const developmentFallback = process.env.NODE_ENV !== 'production';
    if (!config) {
        if (developmentFallback) {
            console.warn(`[Email Service] SMTP is not configured. Development OTP for ${to}: ${otp}`);
            return { delivered: false, devOtp: otp };
        }
        throw new Error('Email delivery is not configured. Set EMAIL_USER and EMAIL_PASS (and SMTP_HOST for non-Gmail providers).');
    }

    try {
        const transporter = nodemailer.createTransport(config.transport);
        const safeName = String(name).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
        const info = await transporter.sendMail({
            from: `"Skill-Nexus" <${config.from}>`,
            to,
            subject: `Skill-Nexus Verification Code: ${otp}`,
            html: `
                <div style="font-family:Arial,sans-serif;background:#0f1416;color:#e1e3e5;padding:32px;border-radius:12px;max-width:520px;margin:auto">
                    <h1 style="color:#6ee7b7">Skill-Nexus</h1>
                    <h2>Verify your email</h2>
                    <p>Hello <strong>${safeName}</strong>, enter this 6-digit code to activate your account:</p>
                    <p style="font-family:monospace;font-size:32px;letter-spacing:8px;color:#4ade80"><strong>${otp}</strong></p>
                    <p>This code expires in 10 minutes. If you did not request it, ignore this email.</p>
                </div>
            `
        });
        console.log(`[Email Service] Verification code dispatched to ${to} (Message ID: ${info.messageId})`);
        return { delivered: true };
    } catch (error) {
        console.error('[Email Service] SMTP delivery failed:', error);
        if (developmentFallback) {
            console.warn(`[Email Service] Development OTP for ${to}: ${otp}`);
            return { delivered: false, devOtp: otp };
        }
        throw error;
    }
};

module.exports = { generateOtp, sendOtpEmail };
