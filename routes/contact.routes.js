const express = require("express")
const router = express.Router()
const contactController = require("../controllers/contact.controller")
const { isAuthenticated, isAdmin } = require("../middleware/auth")

// Public routes
router.post("/submit", contactController.submitContactForm)

// Artwork inquiry route
router.post("/artwork-inquiry", contactController.submitArtworkInquiry)

// Admin routes
router.get("/", isAuthenticated, isAdmin, contactController.getAllContacts)
router.get("/:id", isAuthenticated, isAdmin, contactController.getContactById)
router.patch("/:id/read", isAuthenticated, isAdmin, contactController.markContactAsRead)
router.delete("/:id", isAuthenticated, isAdmin, contactController.deleteContact)

module.exports = router
