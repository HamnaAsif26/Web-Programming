const express = require("express")
const router = express.Router()
const userController = require("../controllers/user.controller")
const authController = require("../controllers/auth.controller")

// Protect all routes
router.use(authController.verifyToken)

// Get current user profile
router.get("/profile", userController.getUserProfile)

// Update user profile
router.put("/profile", userController.updateUserProfile)

// Change password
router.put("/change-password", userController.changePassword)

// Delete account
router.delete("/delete-account", userController.deleteAccount)

// Get user orders
router.get("/orders", userController.getUserOrders)

// Get order details
router.get("/orders/:id", userController.getOrderDetails)

// Get saved artworks
router.get("/saved-artworks", userController.getSavedArtworks)

// Save artwork
router.post("/saved-artworks/:artworkId", userController.saveArtwork)

// Check if artwork is saved
router.get("/saved-artworks/check/:artworkId", userController.checkSavedArtwork)

// Remove saved artwork
router.delete("/saved-artworks/:artworkId", userController.removeSavedArtwork)

// Get exhibition tickets
router.get("/exhibition-tickets", userController.getExhibitionTickets)

// Cancel exhibition ticket
router.put("/exhibition-tickets/:ticketId/cancel", userController.cancelExhibitionTicket)

// Upload avatar
router.post("/avatar", userController.uploadAvatar)

module.exports = router
