const User = require("../models/User")
const Order = require("../models/Order")
const Artwork = require("../models/Artwork")
const ExhibitionTicket = require("../models/ExhibitionTicket")
const fs = require("fs")
const path = require("path")
const { v4: uuidv4 } = require("uuid")

// Get user profile
exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password")

    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" })
    }

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        address: user.address,
        newsletter: user.newsletter,
        isAdmin: user.isAdmin,
        createdAt: user.createdAt,
        avatar: user.avatar,
      },
    })
  } catch (error) {
    console.error("Error getting user profile:", error)
    res.status(500).json({ success: false, error: "Server error" })
  }
}

// Update user profile
exports.updateUserProfile = async (req, res) => {
  try {
    const { firstName, lastName, phone, address, newsletter } = req.body

    const user = await User.findById(req.user._id)

    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" })
    }

    // Update fields
    if (firstName) user.firstName = firstName
    if (lastName) user.lastName = lastName
    if (phone !== undefined) user.phone = phone
    if (address !== undefined) user.address = address
    if (newsletter !== undefined) user.newsletter = newsletter

    await user.save()

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        address: user.address,
        newsletter: user.newsletter,
        isAdmin: user.isAdmin,
        createdAt: user.createdAt,
      },
    })
  } catch (error) {
    console.error("Error updating user profile:", error)
    res.status(500).json({ success: false, error: "Server error" })
  }
}

// Change password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, error: "Please provide current and new password" })
    }

    const user = await User.findById(req.user._id)

    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" })
    }

    // Check if current password is correct
    const isMatch = await user.comparePassword(currentPassword)
    if (!isMatch) {
      return res.status(400).json({ success: false, error: "Current password is incorrect" })
    }

    // Update password
    user.password = newPassword
    await user.save()

    res.status(200).json({ success: true, message: "Password updated successfully" })
  } catch (error) {
    console.error("Error changing password:", error)
    res.status(500).json({ success: false, error: "Server error" })
  }
}

// Delete account
exports.deleteAccount = async (req, res) => {
  try {
    const { password } = req.body

    if (!password) {
      return res.status(400).json({ success: false, error: "Please provide your password" })
    }

    const user = await User.findById(req.user._id)

    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" })
    }

    // Check if password is correct
    const isMatch = await user.comparePassword(password)
    if (!isMatch) {
      return res.status(400).json({ success: false, error: "Password is incorrect" })
    }

    // Delete user
    await User.findByIdAndDelete(req.user._id)

    res.status(200).json({ success: true, message: "Account deleted successfully" })
  } catch (error) {
    console.error("Error deleting account:", error)
    res.status(500).json({ success: false, error: "Server error" })
  }
}

// Get user orders
exports.getUserOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 })

    res.status(200).json({ success: true, orders })
  } catch (error) {
    console.error("Error getting user orders:", error)
    res.status(500).json({ success: false, error: "Server error" })
  }
}

// Get order details
exports.getOrderDetails = async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      user: req.user._id,
    }).populate("items.product")

    if (!order) {
      return res.status(404).json({ success: false, error: "Order not found" })
    }

    res.status(200).json({ success: true, order })
  } catch (error) {
    console.error("Error getting order details:", error)
    res.status(500).json({ success: false, error: "Server error" })
  }
}

// Get saved artworks
exports.getSavedArtworks = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate("savedArtworks")

    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" })
    }

    res.status(200).json({ success: true, artworks: user.savedArtworks })
  } catch (error) {
    console.error("Error getting saved artworks:", error)
    res.status(500).json({ success: false, error: "Server error" })
  }
}

// Save artwork
exports.saveArtwork = async (req, res) => {
  try {
    const { artworkId } = req.params

    // Check if artwork exists
    const artwork = await Artwork.findById(artworkId)
    if (!artwork) {
      return res.status(404).json({ success: false, error: "Artwork not found" })
    }

    const user = await User.findById(req.user._id)

    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" })
    }

    // Check if artwork is already saved
    if (user.savedArtworks.includes(artworkId)) {
      return res.status(400).json({ success: false, error: "Artwork already saved" })
    }

    // Add artwork to saved artworks
    user.savedArtworks.push(artworkId)
    await user.save()

    res.status(200).json({ success: true, message: "Artwork saved successfully" })
  } catch (error) {
    console.error("Error saving artwork:", error)
    res.status(500).json({ success: false, error: "Server error" })
  }
}

// Check if artwork is saved
exports.checkSavedArtwork = async (req, res) => {
  try {
    const { artworkId } = req.params

    const user = await User.findById(req.user._id)

    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" })
    }

    const isSaved = user.savedArtworks.includes(artworkId)

    res.status(200).json({ success: true, isSaved })
  } catch (error) {
    console.error("Error checking saved artwork:", error)
    res.status(500).json({ success: false, error: "Server error" })
  }
}

// Remove saved artwork
exports.removeSavedArtwork = async (req, res) => {
  try {
    const { artworkId } = req.params

    const user = await User.findById(req.user._id)

    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" })
    }

    // Remove artwork from saved artworks
    user.savedArtworks = user.savedArtworks.filter((id) => id.toString() !== artworkId)
    await user.save()

    res.status(200).json({ success: true, message: "Artwork removed successfully" })
  } catch (error) {
    console.error("Error removing saved artwork:", error)
    res.status(500).json({ success: false, error: "Server error" })
  }
}

// Get exhibition tickets
exports.getExhibitionTickets = async (req, res) => {
  try {
    const tickets = await ExhibitionTicket.find({ user: req.user._id }).sort({ date: 1 })

    res.status(200).json({ success: true, tickets })
  } catch (error) {
    console.error("Error getting exhibition tickets:", error)
    res.status(500).json({ success: false, error: "Server error" })
  }
}

// Cancel exhibition ticket
exports.cancelExhibitionTicket = async (req, res) => {
  try {
    const { ticketId } = req.params

    const ticket = await ExhibitionTicket.findOne({
      _id: ticketId,
      user: req.user._id,
    })

    if (!ticket) {
      return res.status(404).json({ success: false, error: "Ticket not found" })
    }

    // Check if exhibition date has passed
    if (new Date(ticket.date) < new Date()) {
      return res.status(400).json({ success: false, error: "Cannot cancel past exhibition tickets" })
    }

    // Update ticket status
    ticket.status = "Cancelled"
    await ticket.save()

    res.status(200).json({ success: true, message: "Ticket cancelled successfully" })
  } catch (error) {
    console.error("Error cancelling exhibition ticket:", error)
    res.status(500).json({ success: false, error: "Server error" })
  }
}

// Upload avatar
exports.uploadAvatar = async (req, res) => {
  try {
    // Check if request has a file
    if (!req.files || !req.files.avatar) {
      return res.status(400).json({ success: false, error: "No file uploaded" })
    }

    const avatarFile = req.files.avatar
    const user = await User.findById(req.user._id)

    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" })
    }

    // Check file type
    const allowedTypes = ["image/jpeg", "image/png", "image/gif"]
    if (!allowedTypes.includes(avatarFile.mimetype)) {
      return res.status(400).json({ success: false, error: "Invalid file type. Only JPEG, PNG, and GIF are allowed" })
    }

    // Check file size (max 2MB)
    if (avatarFile.size > 2 * 1024 * 1024) {
      return res.status(400).json({ success: false, error: "File too large. Maximum size is 2MB" })
    }

    // Create uploads directory if it doesn't exist
    const uploadDir = path.join(__dirname, "..", "public", "uploads", "avatars")
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }

    // Generate unique filename
    const filename = `${uuidv4()}-${avatarFile.name}`
    const filepath = path.join(uploadDir, filename)

    // Save file
    await avatarFile.mv(filepath)

    // Delete old avatar if exists
    if (user.avatar && user.avatar !== "default-avatar.png") {
      const oldAvatarPath = path.join(__dirname, "..", "public", user.avatar)
      if (fs.existsSync(oldAvatarPath)) {
        fs.unlinkSync(oldAvatarPath)
      }
    }

    // Update user avatar
    user.avatar = `/uploads/avatars/${filename}`
    await user.save()

    res.status(200).json({
      success: true,
      message: "Avatar uploaded successfully",
      avatar: user.avatar,
    })
  } catch (error) {
    console.error("Error uploading avatar:", error)
    res.status(500).json({ success: false, error: "Server error" })
  }
}
