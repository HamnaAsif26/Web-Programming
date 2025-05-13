const jwt = require("jsonwebtoken")
const User = require("../models/User")

// Middleware to check if user is authenticated
exports.isAuthenticated = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header("Authorization")?.replace("Bearer ", "")

    if (!token) {
      return res.status(401).json({ success: false, error: "No token, authorization denied" })
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "arte-gallery-jwt-secret")

    // Find user by id
    const user = await User.findById(decoded.id).select("-password")

    if (!user) {
      return res.status(401).json({ success: false, error: "User not found" })
    }

    // Set user in request
    req.user = user
    next()
  } catch (error) {
    console.error("Authentication error:", error)
    res.status(401).json({ success: false, error: "Token is not valid" })
  }
}

// Middleware to check if user is admin
exports.isAdmin = (req, res, next) => {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({ success: false, error: "Access denied. Admin role required." })
  }
  next()
}

// Optional authentication middleware
exports.optionalAuth = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header("Authorization")?.replace("Bearer ", "")

    if (!token) {
      // No token, continue without authentication
      return next()
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "arte-gallery-jwt-secret")

    // Find user by id
    const user = await User.findById(decoded.id).select("-password")

    if (user) {
      // Set user in request
      req.user = user
    }

    next()
  } catch (error) {
    // Invalid token, continue without authentication
    console.error("Optional authentication error:", error)
    next()
  }
}
