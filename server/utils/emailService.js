// server/utils/emailService.js
import dotenv from "dotenv";
dotenv.config();
import { Resend } from 'resend';

// Initialize Resend with API key
const resend = new Resend(process.env.RESEND_API_KEY);

// Verify Resend configuration on startup
const verifyEmailConfig = () => {
  if (!process.env.RESEND_API_KEY) {
    console.error('⚠️ RESEND_API_KEY is not set in environment variables');
    return false;
  }
  
  if (!process.env.RESEND_FROM_EMAIL) {
    console.error('⚠️ RESEND_FROM_EMAIL is not set in environment variables');
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

    if (error) {
      throw new Error(`Resend API error: ${error.message || JSON.stringify(error)}`);
    }

    return true;
  } catch (error) {
    throw error; // Re-throw to be caught by registration handler
  }
};

// Send password reset code
export const sendPasswordResetEmail = async (email, code, name) => {
  try {
    const { data, error } = await resend.emails.send({
      from: `HealthHub CPAG <${process.env.RESEND_FROM_EMAIL}>`,
      to: email,
      subject: 'Password Reset Code - HealthHub',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .container {
              background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
              padding: 30px;
              border-radius: 10px;
              text-align: center;
            }
            .content {
              background: white;
              padding: 30px;
              border-radius: 8px;
              margin-top: 20px;
            }
            .code {
              font-size: 32px;
              font-weight: bold;
              color: #f5576c;
              letter-spacing: 8px;
              padding: 20px;
              background: #f7f7f7;
              border-radius: 8px;
              margin: 20px 0;
            }
            .logo {
              color: white;
              font-size: 28px;
              font-weight: bold;
              margin-bottom: 10px;
            }
            .warning {
              background: #fff3cd;
              padding: 15px;
              border-radius: 5px;
              margin: 15px 0;
              color: #856404;
            }
            .footer {
              margin-top: 20px;
              font-size: 12px;
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo">🏥 HealthHub CPAG</div>
            <div class="content">
              <h2>Password Reset Request</h2>
              <p>Hi ${name || 'there'}!</p>
              <p>We received a request to reset your password. Use the code below to proceed:</p>
              
              <div class="code">${code}</div>
              
              <p><strong>This code will expire in 10 minutes.</strong></p>
              
              <div class="warning">
                <strong>⚠️ Security Notice:</strong><br>
                If you didn't request this password reset, please ignore this email and ensure your account is secure.
              </div>
              
              <div class="footer">
                <p>© 2025 HealthHub - CPAG | Cavite Positive Action Group</p>
                <p>This is an automated message, please do not reply.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error('❌ Resend error:', error);
      throw new Error(`Failed to send password reset email: ${error.message}`);
    }

    return true;
  } catch (error) {
    console.error('❌ Send password reset email error:', error);
    throw new Error('Failed to send password reset email');
  }
};

// Send welcome email (optional - bonus feature)
export const sendWelcomeEmail = async (email, name) => {
  try {
    const { data, error } = await resend.emails.send({
      from: `HealthHub CPAG <${process.env.RESEND_FROM_EMAIL}>`,
      to: email,
      subject: 'Welcome to HealthHub! 🏥',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .container {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              padding: 30px;
              border-radius: 10px;
              text-align: center;
            }
            .content {
              background: white;
              padding: 30px;
              border-radius: 8px;
              margin-top: 20px;
            }
            .logo {
              color: white;
              font-size: 28px;
              font-weight: bold;
              margin-bottom: 10px;
            }
            .button {
              display: inline-block;
              padding: 12px 30px;
              background: #667eea;
              color: white;
              text-decoration: none;
              border-radius: 5px;
              margin: 20px 0;
            }
            .footer {
              margin-top: 20px;
              font-size: 12px;
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo">🏥 HealthHub CPAG</div>
            <div class="content">
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
              
              <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/user/home" class="button">
                Get Started
              </a>
              
              <div class="footer">
                <p>© 2025 HealthHub - CPAG | Cavite Positive Action Group</p>
                <p>Breaking stigma, spreading truth about HIV.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      // Don't throw - welcome email is optional
      return false;
    }
    return true;
  } catch (error) {
    // Don't throw - welcome email is optional
    return false;
  }
};

export {
  generateVerificationCode,
  sendVerificationEmail,
};
