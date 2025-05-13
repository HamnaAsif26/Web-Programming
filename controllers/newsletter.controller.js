const Newsletter = require("../models/Newsletter")
const mailer = require("../utils/mailer")

// Subscribe to newsletter
exports.subscribe = async (req, res) => {
  try {
    const { email } = req.body

    // Check if email already subscribed
    const existingSubscription = await Newsletter.findOne({ email })
    if (existingSubscription) {
      return res.status(400).json({ error: "Email already subscribed to newsletter" })
    }

    // Create new subscription
    const subscription = new Newsletter({
      email,
    })

    await subscription.save()

    // Send confirmation email
    await mailer.sendNewsletterConfirmation(email)

    return res.status(201).json({ message: "Successfully subscribed to newsletter" })
  } catch (error) {
    console.error("Newsletter subscription error:", error)
    return res.status(500).json({ error: "Server error during newsletter subscription" })
  }
}

// Unsubscribe from newsletter
exports.unsubscribe = async (req, res) => {
  try {
    const { email } = req.body

    // Find and remove subscription
    const result = await Newsletter.findOneAndDelete({ email })

    if (!result) {
      return res.status(404).json({ error: "Email not found in newsletter list" })
    }

    // Send unsubscribe confirmation
    await mailer.sendNewsletterUnsubscribe(email)

    return res.status(200).json({ message: "Successfully unsubscribed from newsletter" })
  } catch (error) {
    console.error("Newsletter unsubscribe error:", error)
    return res.status(500).json({ error: "Server error during newsletter unsubscription" })
  }
}
