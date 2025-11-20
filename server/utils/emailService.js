// server/utils/emailService.js
import dotenv from "dotenv";
dotenv.config();

let Resend;
let resend;

(async () => {
  try {
    Resend = (await import('resend')).Resend;
    if (process.env.RESEND_API_KEY) {
      resend = new Resend(process.env.RESEND_API_KEY);
    } else {
      console.warn('⚠️ RESEND_API_KEY is not set. Email functions will not actually send emails.');
    }
  } catch (err) {
    console.warn('⚠️ Resend package not found. Email functions will not actually send emails.');
  }
})();

// Verify Resend configuration on startup
const verifyEmailConfig = () => {
  if (!process.env.RESEND_API_KEY) {
    console.warn('⚠️ RESEND_API_KEY is not set in environment variables');
    return false;
  }

  if (!process.env.RESEND_FROM_EMAIL) {
    console.warn('⚠️ RESEND_FROM_EMAIL is not set in environment variables');
    return false;
  }

  return true;
};

// Verify configuration when module loads
verifyEmailConfig();

// Generate 6-digit verification code
export const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send verification email
export const sendVerificationEmail = async (email, code, name) => {
  if (!resend) return true; // skip sending if Resend is not configured

  try {
    const { data, error } = await resend.emails.send({
      from: `HealthHub <${process.env.RESEND_FROM_EMAIL}>`,
      to: email,
      subject: 'Email Verification - HealthHub',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #667eea; color: white; padding: 30px; border-radius: 10px; text-align: center;">
            <h1 style="margin: 0;">🏥 HealthHub</h1>
            <h2 style="margin: 10px 0 0 0;">Email Verification</h2>
          </div>
          <div style="background: white; padding: 30px; border: 1px solid #ddd; border-radius: 10px; margin-top: 20px;">
            <p>Hi ${name || 'there'}!</p>
            <p>Thank you for registering with HealthHub. Please use the verification code below:</p>
            <div style="font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 8px; padding: 20px; background: #f7f7f7; border-radius: 8px; text-align: center; margin: 20px 0;">
              ${code}
            </div>
            <p><strong>This code will expire in 10 minutes.</strong></p>
            <p style="color: #666; font-size: 12px; margin-top: 30px;">If you didn't request this, please ignore this email.</p>
          </div>
        </div>
      `,
    });

    if (error) throw new Error(`Resend API error: ${error.message || JSON.stringify(error)}`);
    return true;
  } catch (error) {
    console.error('❌ sendVerificationEmail error:', error);
    return false;
  }
};

// Send password reset code
export const sendPasswordResetEmail = async (email, code, name) => {
  if (!resend) return true;

  try {
    const { data, error } = await resend.emails.send({
      from: `HealthHub CPAG <${process.env.RESEND_FROM_EMAIL}>`,
      to: email,
      subject: 'Password Reset Code - HealthHub',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 30px; border-radius: 10px; text-align: center;">
            <div style="color: white; font-size: 28px; font-weight: bold; margin-bottom: 10px;">🏥 HealthHub CPAG</div>
            <div style="background: white; padding: 30px; border-radius: 8px; margin-top: 20px;">
              <h2>Password Reset Request</h2>
              <p>Hi ${name || 'there'}!</p>
              <p>We received a request to reset your password. Use the code below:</p>
              <div style="font-size: 32px; font-weight: bold; color: #f5576c; letter-spacing: 8px; padding: 20px; background: #f7f7f7; border-radius: 8px; margin: 20px 0;">
                ${code}
              </div>
              <p><strong>This code will expire in 10 minutes.</strong></p>
              <div style="background: #fff3cd; padding: 15px; border-radius: 5px; margin: 15px 0; color: #856404;">
                <strong>⚠️ Security Notice:</strong><br>
                If you didn't request this password reset, please ignore this email and ensure your account is secure.
              </div>
              <div style="margin-top: 20px; font-size: 12px; color: #666;">
                © 2025 HealthHub - CPAG | Cavite Positive Action Group<br>
                This is an automated message, please do not reply.
              </div>
            </div>
          </div>
        </div>
      `
    });

    if (error) throw new Error(`Resend API error: ${error.message}`);
    return true;
  } catch (error) {
    console.error('❌ sendPasswordResetEmail error:', error);
    return false;
  }
};

// Send welcome email
export const sendWelcomeEmail = async (email, name) => {
  if (!resend) return true;

  try {
    const { data, error } = await resend.emails.send({
      from: `HealthHub CPAG <${process.env.RESEND_FROM_EMAIL}>`,
      to: email,
      subject: 'Welcome to HealthHub! 🏥',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center;">
            <div style="color: white; font-size: 28px; font-weight: bold; margin-bottom: 10px;">🏥 HealthHub CPAG</div>
            <div style="background: white; padding: 30px; border-radius: 8px; margin-top: 20px;">
              <h2>Welcome to HealthHub!</h2>
              <p>Hi ${name}!</p>
              <p>Thank you for verifying your email and joining our community. We're excited to have you here!</p>
              <p>HealthHub is your safe space for:</p>
              <ul style="text-align: left; display: inline-block;">
                <li>Anonymous community discussions</li>
                <li>Booking appointments with CPAG</li>
                <li>Accessing HIV resources</li>
                <li>Finding nearby clinics</li>
              </ul>
              <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/user/home" style="display:inline-block; padding:12px 30px; background:#667eea; color:white; text-decoration:none; border-radius:5px; margin:20px 0;">Get Started</a>
              <div style="margin-top:20px; font-size:12px; color:#666;">
                © 2025 HealthHub - CPAG | Cavite Positive Action Group<br>
                Breaking stigma, spreading truth about HIV.
              </div>
            </div>
          </div>
        </div>
      `
    });

    if (error) return false;
    return true;
  } catch (error) {
    return false;
  }
};



