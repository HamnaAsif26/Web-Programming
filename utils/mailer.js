const nodemailer = require("nodemailer")

// Create transporter
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
})

// Send email
exports.sendMail = async (options) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: options.to,
    subject: options.subject,
    html: options.html,
  }

  await transporter.sendMail(mailOptions)
}

// Send contact confirmation email
exports.sendContactConfirmation = async (email, name) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: "Thank you for contacting Arte Gallery",
    html: `
      <h2>Thank you for contacting Arte Gallery</h2>
      <p>Dear ${name},</p>
      <p>We have received your message and will get back to you as soon as possible.</p>
      <p>Best regards,</p>
      <p>The Arte Gallery Team</p>
    `,
  }

  await transporter.sendMail(mailOptions)
}

// Send contact notification to admin
exports.sendContactNotification = async (name, email, subject, message) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: process.env.ADMIN_EMAIL,
    subject: `New Contact Form Submission: ${subject}`,
    html: `
      <h2>New Contact Form Submission</h2>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Subject:</strong> ${subject}</p>
      <p><strong>Message:</strong> ${message}</p>
    `,
  }

  await transporter.sendMail(mailOptions)
}

// Send artwork inquiry notification
exports.sendArtworkInquiryNotification = async (name, email, artworkTitle, artistName, message) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: process.env.ADMIN_EMAIL,
    subject: `New Artwork Inquiry: ${artworkTitle}`,
    html: `
      <h2>New Artwork Inquiry</h2>
      <p><strong>Artwork:</strong> ${artworkTitle}</p>
      <p><strong>Artist:</strong> ${artistName}</p>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Message:</strong> ${message}</p>
    `,
  }

  await transporter.sendMail(mailOptions)
}

// Send password reset email
exports.sendPasswordResetEmail = async (email, resetToken) => {
  const resetUrl = `${process.env.BASE_URL}/reset-password.html?token=${resetToken}`

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: "Password Reset Request",
    html: `
      <h2>Password Reset Request</h2>
      <p>You requested a password reset. Please click the link below to reset your password:</p>
      <p><a href="${resetUrl}" style="padding: 10px 15px; background-color: #000; color: #fff; text-decoration: none; border-radius: 4px;">Reset Password</a></p>
      <p>If you did not request this, please ignore this email.</p>
      <p>This link will expire in 1 hour.</p>
    `,
  }

  await transporter.sendMail(mailOptions)
}

// Send welcome email
exports.sendWelcomeEmail = async (email, name) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: "Welcome to Arte Gallery",
    html: `
      <h2>Welcome to Arte Gallery</h2>
      <p>Dear ${name},</p>
      <p>Thank you for joining Arte Gallery. We're excited to have you as a member of our community.</p>
      <p>You can now:</p>
      <ul>
        <li>Save your favorite artworks</li>
        <li>Get updates on new exhibitions</li>
        <li>Receive exclusive invitations to events</li>
        <li>And much more!</li>
      </ul>
      <p>Best regards,</p>
      <p>The Arte Gallery Team</p>
    `,
  }

  await transporter.sendMail(mailOptions)
}
