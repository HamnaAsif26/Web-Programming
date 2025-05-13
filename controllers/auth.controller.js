const User = require("../models/User")
const crypto = require("crypto")
const mailer = require("../utils/mailer")
const jwt = require("jsonwebtoken")

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || "arte-gallery-jwt-secret", {
    expiresIn: "30d",
  })
}

// Register a new user
exports.register = async (req, res) => {
  try {
    console.log("Registration request received:", req.body)
    const { firstName, lastName, email, password, newsletter } = req.body

    // Check if all required fields are provided
    if (!firstName || !lastName || !email || !password) {
      console.log("Missing required fields")
      return res.status(400).json({
        success: false,
        error: "Please provide all required fields (firstName, lastName, email, password)",
      })
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      console.log("Email already registered:", email)
      return res.status(400).json({ success: false, error: "Email already registered" })
    }

    // Create new user with error handling
    try {
      const user = new User({
        firstName,
        lastName,
        email,
        password,
        newsletter: newsletter || false,
      })

      await user.save()
      console.log("User registered successfully:", email)

      // Generate token
      const token = generateToken(user._id)

      // Send welcome email (don't wait for it to complete)
      mailer
        .sendWelcomeEmail(user.email, user.firstName)
        .catch((err) => console.error("Error sending welcome email:", err))

      // If user opted for newsletter, add them to newsletter list
      if (user.newsletter) {
        // This could be handled by a separate newsletter service
        console.log(`User ${user.email} subscribed to newsletter`)
      }

      return res.status(201).json({
        success: true,
        message: "Registration successful",
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
        },
        token,
      })
    } catch (saveError) {
      console.error("Error saving user:", saveError)

      // Check for validation errors
      if (saveError.name === "ValidationError") {
        const validationErrors = Object.values(saveError.errors).map((err) => err.message)
        return res.status(400).json({
          success: false,
          error: "Validation error",
          details: validationErrors.join(", "),
        })
      }

      // Check for duplicate key error
      if (saveError.code === 11000) {
        return res.status(400).json({
          success: false,
          error: "Email already registered",
        })
      }

      throw saveError // Re-throw for the outer catch block
    }
  } catch (error) {
    console.error("Registration error:", error)
    return res.status(500).json({
      success: false,
      error: "Server error during registration",
      details: error.message,
    })
  }
}

// Login user
exports.login = async (req, res) => {
  try {
    console.log("Login request received:", req.body.email)
    const { email, password, rememberMe } = req.body

    // Check if email and password are provided
    if (!email || !password) {
      return res.status(400).json({ success: false, error: "Please provide email and password" })
    }

    // Find user by email
    const user = await User.findOne({ email })
    if (!user) {
      console.log("User not found:", email)
      return res.status(400).json({ success: false, error: "Invalid email or password" })
    }

    // Check password
    const isMatch = await user.comparePassword(password)
    if (!isMatch) {
      console.log("Invalid password for:", email)
      return res.status(400).json({ success: false, error: "Invalid email or password" })
    }

    console.log("User logged in successfully:", email)

    // Generate token with longer expiry if rememberMe is true
    const tokenExpiry = rememberMe ? "90d" : "30d"
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || "arte-gallery-jwt-secret", {
      expiresIn: tokenExpiry,
    })

    // User authenticated successfully
    return res.status(200).json({
      success: true,
      message: "Login successful",
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        isAdmin: user.isAdmin || false,
      },
      token,
    })
  } catch (error) {
    console.error("Login error:", error)
    return res.status(500).json({ success: false, error: "Server error during login" })
  }
}

// Forgot password
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body

    if (!email) {
      return res.status(400).json({ success: false, error: "Please provide an email address" })
    }

    // Find user by email
    const user = await User.findOne({ email })
    if (!user) {
      return res.status(400).json({ success: false, error: "User not found" })
    }

    // Generate reset token
    const token = crypto.randomBytes(20).toString("hex")

    // Set token and expiration
    user.resetPasswordToken = token
    user.resetPasswordExpires = Date.now() + 3600000 // 1 hour

    await user.save()

    // Send password reset email
    const resetUrl = `http://${req.headers.host}/reset-password.html?token=${token}`
    await mailer.sendPasswordResetEmail(user.email, resetUrl)

    return res.status(200).json({ success: true, message: "Password reset email sent" })
  } catch (error) {
    console.error("Forgot password error:", error)
    return res.status(500).json({ success: false, error: "Server error during password reset request" })
  }
}

// Reset password
exports.resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body

    if (!token || !password) {
      return res.status(400).json({ success: false, error: "Please provide token and new password" })
    }

    // Find user by token
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    })

    if (!user) {
      return res.status(400).json({ success: false, error: "Invalid or expired token" })
    }

    // Update password
    user.password = password
    user.resetPasswordToken = undefined
    user.resetPasswordExpires = undefined

    await user.save()

    // Send confirmation email
    await mailer.sendPasswordChangedEmail(user.email)

    return res.status(200).json({ success: true, message: "Password reset successful" })
  } catch (error) {
    console.error("Reset password error:", error)
    return res.status(500).json({ success: false, error: "Server error during password reset" })
  }
}

// Get current user (protected route)
exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password")

    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" })
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        isAdmin: user.isAdmin || false,
        newsletter: user.newsletter || false,
        createdAt: user.createdAt,
      },
    })
  } catch (error) {
    console.error("Get current user error:", error)
    res.status(500).json({ success: false, error: "Server error" })
  }
}

// Verify token middleware
exports.verifyToken = async (req, res, next) => {
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
      return res.status(401).json({ success: false, error: "Invalid token, user not found" })
    }

    // Set user in request
    req.user = user
    next()
  } catch (error) {
    console.error("Token verification error:", error)

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ success: false, error: "Token expired" })
    }

    res.status(401).json({ success: false, error: "Invalid token" })
  }
}

// Admin middleware
exports.isAdmin = (req, res, next) => {
  if (req.user && req.user.isAdmin) {
    next()
  } else {
    res.status(403).json({ success: false, error: "Access denied, admin privileges required" })
  }
}
