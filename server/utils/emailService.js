// server/utils/emailService.js
import nodemailer from 'nodemailer';

// Verify email configuration on startup
const verifyEmailConfig = async () => {
  try {
    await transporter.verify();
    console.log('✅ Email service ready');
  } catch (error) {
    console.error('❌ Email configuration error:', error.message);
    console.error('Please check your EMAIL_USER and EMAIL_PASSWORD in .env');
  }
};

// Create transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Verify configuration when module loads
verifyEmailConfig();

// Generate 6-digit verification code
export const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send verification email
export const sendVerificationEmail = async (email, code, name) => {
  const mailOptions = {
    from: `"HealthHub CPAG" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Email Verification - HealthHub',
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
          .code {
            font-size: 32px;
            font-weight: bold;
            color: #667eea;
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
            <h2>Email Verification</h2>
            <p>Hi ${name || 'there'}!</p>
            <p>Thank you for registering with HealthHub. Please use the verification code below to verify your email address:</p>
            
            <div class="code">${code}</div>
            
            <p><strong>This code will expire in 10 minutes.</strong></p>
            
            <p>If you didn't request this verification, please ignore this email.</p>
            
            <div class="footer">
              <p>© 2025 HealthHub - CPAG | Cavite Positive Action Group</p>
              <p>This is an automated message, please do not reply.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('✅ Verification email sent to:', email);
    return true;
  } catch (error) {
    console.error('❌ Error sending verification email:', error);
    throw new Error('Failed to send verification email');
  }
};

// Send password reset code
export const sendPasswordResetEmail = async (email, code, name) => {
  const mailOptions = {
    from: `"HealthHub CPAG" <${process.env.EMAIL_USER}>`,
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
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('✅ Password reset email sent to:', email);
    return true;
  } catch (error) {
    console.error('❌ Error sending password reset email:', error);
    throw new Error('Failed to send password reset email');
  }
};

export default transporter;