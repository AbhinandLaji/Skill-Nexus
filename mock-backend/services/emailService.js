const nodemailer = require('nodemailer');

// 1. Configure the Gmail transporter using environment variables
const createTransporter = () => {
    const user = process.env.EMAIL_USER ? process.env.EMAIL_USER.trim() : '';
    const pass = process.env.EMAIL_PASS ? process.env.EMAIL_PASS.replace(/\s+/g, '') : '';

    if (!user || !pass) {
        console.warn('⚠️ [Email Service] EMAIL_USER or EMAIL_PASS not set in .env. Real emails will fail until configured.');
    }

    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user,
            pass
        }
    });
};

// 2. Generate a secure 6-digit numeric OTP
const generateOtp = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// 3. Send OTP verification email
const sendOtpEmail = async ({ to, otp, name = 'Student' }) => {
    const transporter = createTransporter();

    const mailOptions = {
        from: `"Skill-Nexus" <${process.env.EMAIL_USER || 'no-reply@skillnexus.com'}>`,
        to,
        subject: `Skill-Nexus Verification Code: ${otp}`,
        html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0f1416; color: #e1e3e5; padding: 40px 20px; border-radius: 12px; max-width: 520px; margin: 0 auto; border: 1px solid #293033;">
                <div style="text-align: center; margin-bottom: 24px;">
                    <h1 style="color: #6ee7b7; font-size: 26px; margin: 0; font-weight: 700; letter-spacing: -0.5px;">Skill-Nexus</h1>
                    <p style="color: #90a4ae; font-size: 14px; margin-top: 6px;">Campus Academic & Collaboration Platform</p>
                </div>
                
                <div style="background-color: #171f22; padding: 28px; border-radius: 10px; border: 1px solid #37474f;">
                    <h2 style="color: #ffffff; font-size: 18px; margin-top: 0; margin-bottom: 12px;">Verify Your Email Address</h2>
                    <p style="color: #cfd8dc; font-size: 14px; line-height: 1.6; margin-bottom: 24px;">
                        Hello <strong>${name}</strong>,<br/>
                        Welcome to Skill-Nexus! Enter the 6-digit verification code below to activate your account and access campus communities.
                    </p>

                    <div style="text-align: center; margin: 28px 0;">
                        <span style="display: inline-block; background-color: #0d2818; color: #4ade80; border: 1px solid #16a34a; font-size: 32px; font-weight: bold; letter-spacing: 8px; padding: 14px 28px; border-radius: 8px; font-family: monospace;">
                            ${otp}
                        </span>
                    </div>

                    <p style="color: #90a4ae; font-size: 13px; line-height: 1.5; margin-bottom: 0; text-align: center;">
                        ⏱️ This verification code expires in <strong>10 minutes</strong>.<br/>
                        If you did not request this email, you can safely ignore it.
                    </p>
                </div>

                <div style="text-align: center; margin-top: 24px; color: #546e7a; font-size: 12px;">
                    <p style="margin: 0;">© ${new Date().getFullYear()} Skill-Nexus. Built for Academic Web Technologies.</p>
                </div>
            </div>
        `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✉️ [Email Service] OTP successfully dispatched to ${to} (Message ID: ${info.messageId})`);
    return info;
};

module.exports = {
    generateOtp,
    sendOtpEmail
};
