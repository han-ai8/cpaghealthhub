const nodemailer = require("nodemailer");

const sendVerificationEmail = async (userEmail, token) => {
  let transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    },
  });

  const url = `${process.env.CLIENT_URL}/verify-email?token=${token}`;

  let info = await transporter.sendMail({
    from: `"HealthHub" <${process.env.SMTP_USER}>`,
    to: userEmail,
    subject: "Verify your HealthHub account",
    html: `
      <p>Please click the following link to verify your account:</p>
      <a href="${url}">Verify Account</a>
    `,
  });
  console.log("Verification email sent: %s", info.messageId);
};

module.exports = sendVerificationEmail;