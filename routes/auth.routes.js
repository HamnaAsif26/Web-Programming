const express = require("express")
const router = express.Router()
const authController = require("../controllers/auth.controller")

// Register a new user
router.post("/register", authController.register)

// Login user
router.post("/login", authController.login)

// Forgot password
router.post("/forgot-password", authController.forgotPassword)

// Reset password
router.post("/reset-password", authController.resetPassword)

// Get current user (protected route)
router.get("/me", authController.verifyToken, authController.getCurrentUser)

// Verify token
router.get("/verify-token", authController.verifyToken, (req, res) => {
  res.status(200).json({
    success: true,
    message: "Token is valid",
    user: {
      id: req.user._id,
      firstName: req.user.firstName,
      lastName: req.user.lastName,
      email: req.user.email,
      isAdmin: req.user.isAdmin || false,
    },
  })
})

module.exports = router
