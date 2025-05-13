const Contact = require("../models/Contact")
const mailer = require("../utils/mailer")

// Create a manual validation function
const validateContactForm = (req) => {
  const errors = []
  const { name, email, subject, message } = req.body

  if (!name || name.trim() === "") {
    errors.push({ param: "name", msg: "Name is required" })
  }

  if (!email || email.trim() === "") {
    errors.push({ param: "email", msg: "Email is required" })
  } else if (!/^\S+@\S+\.\S+$/.test(email)) {
    errors.push({ param: "email", msg: "Please enter a valid email address" })
  }

  if (!subject || subject.trim() === "") {
    errors.push({ param: "subject", msg: "Subject is required" })
  }

  if (!message || message.trim() === "") {
    errors.push({ param: "message", msg: "Message is required" })
  }

  return {
    isEmpty: () => errors.length === 0,
    array: () => errors,
    mapped: () => {
      const mapped = {}
      errors.forEach((error) => {
        mapped[error.param] = { msg: error.msg }
      })
      return mapped
    },
  }
}

// Submit contact form
exports.submitContactForm = async (req, res) => {
  try {
    // Use our custom validation instead of express-validator
    const errors = validateContactForm(req)

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.mapped() })
    }

    const { name, email, subject, message, artworkId } = req.body

    // Create new contact entry
    const contact = new Contact({
      name,
      email,
      subject,
      message,
      artworkId,
    })

    await contact.save()

    // Send email notification
    const mailOptions = {
      to: process.env.ADMIN_EMAIL || "admin@artegallery.com",
      subject: `New Contact Form Submission: ${subject}`,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Message:</strong> ${message}</p>
        ${artworkId ? `<p><strong>Related Artwork ID:</strong> ${artworkId}</p>` : ""}
      `,
    }

    await mailer.sendMail(mailOptions)

    res.status(201).json({
      success: true,
      message: "Your message has been sent successfully. We will get back to you soon.",
    })
  } catch (error) {
    console.error("Contact form submission error:", error)
    res.status(500).json({
      success: false,
      message: "There was an error sending your message. Please try again later.",
    })
  }
}

// Get all contact submissions (admin only)
exports.getAllContacts = async (req, res) => {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 })
    res.status(200).json({ success: true, data: contacts })
  } catch (error) {
    console.error("Error fetching contacts:", error)
    res.status(500).json({
      success: false,
      message: "Error fetching contact submissions",
    })
  }
}

// Get contact by ID (admin only)
exports.getContactById = async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id)

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: "Contact submission not found",
      })
    }

    res.status(200).json({ success: true, data: contact })
  } catch (error) {
    console.error("Error fetching contact:", error)
    res.status(500).json({
      success: false,
      message: "Error fetching contact submission",
    })
  }
}

// Mark contact as read (admin only)
exports.markContactAsRead = async (req, res) => {
  try {
    const contact = await Contact.findByIdAndUpdate(req.params.id, { isRead: true }, { new: true })

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: "Contact submission not found",
      })
    }

    res.status(200).json({
      success: true,
      message: "Contact marked as read",
      data: contact,
    })
  } catch (error) {
    console.error("Error marking contact as read:", error)
    res.status(500).json({
      success: false,
      message: "Error updating contact submission",
    })
  }
}

// Delete contact (admin only)
exports.deleteContact = async (req, res) => {
  try {
    const contact = await Contact.findByIdAndDelete(req.params.id)

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: "Contact submission not found",
      })
    }

    res.status(200).json({
      success: true,
      message: "Contact submission deleted successfully",
    })
  } catch (error) {
    console.error("Error deleting contact:", error)
    res.status(500).json({
      success: false,
      message: "Error deleting contact submission",
    })
  }
}

// Submit artwork inquiry
exports.submitArtworkInquiry = async (req, res) => {
  try {
    // Use our custom validation
    const { name, email, message, artworkId, artworkTitle, artistName } = req.body

    if (!name || !email || !message || !artworkId) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields",
      })
    }

    // Create new contact entry with artwork info
    const contact = new Contact({
      name,
      email,
      subject: `Inquiry about artwork: ${artworkTitle || artworkId}`,
      message,
      artworkId,
      isArtworkInquiry: true,
    })

    await contact.save()

    // Send email notification
    const mailOptions = {
      to: process.env.ADMIN_EMAIL || "admin@artegallery.com",
      subject: `New Artwork Inquiry: ${artworkTitle || artworkId}`,
      html: `
        <h2>New Artwork Inquiry</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Artwork:</strong> ${artworkTitle || artworkId}</p>
        <p><strong>Artist:</strong> ${artistName || "Not specified"}</p>
        <p><strong>Message:</strong> ${message}</p>
        <p><a href="${process.env.BASE_URL || "http://localhost:3000"}/admin/dashboard.html?section=contacts&id=${contact._id}">View in Admin Dashboard</a></p>
      `,
    }

    await mailer.sendMail(mailOptions)

    res.status(201).json({
      success: true,
      message: "Your inquiry has been sent successfully. We will get back to you soon.",
    })
  } catch (error) {
    console.error("Artwork inquiry submission error:", error)
    res.status(500).json({
      success: false,
      message: "There was an error sending your inquiry. Please try again later.",
    })
  }
}
