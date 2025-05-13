require('dotenv').config();
const express = require("express")
const path = require("path")
const bodyParser = require("body-parser")
const session = require("express-session")
const flash = require("connect-flash")
const connectDB = require("./config/db")
const cors = require("cors")
const helmet = require("helmet")
const morgan = require("morgan")
const mongoose = require("mongoose") // Import mongoose

// Connect to database
connectDB().catch((err) => {
  console.error("Failed to connect to MongoDB:", err.message)
})

// Import routes
const authRoutes = require("./routes/auth.routes")
const contactRoutes = require("./routes/contact.routes")
const newsletterRoutes = require("./routes/newsletter.routes")
const artworkRoutes = require("./routes/artwork.routes")
const artistRoutes = require("./routes/artist.routes")
const exhibitionRoutes = require("./routes/exhibition.routes")
const shopRoutes = require("./routes/shop.routes")
const adminRoutes = require("./routes/admin.routes")
const userRoutes = require("./routes/user.routes")

const app = express()
const PORT = process.env.PORT || 3000

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: false, // Disabled for development, enable in production
  }),
)

// Middleware
app.use(cors())
app.use(morgan("dev"))

// Increase JSON payload size limit
app.use(bodyParser.json({ limit: "10mb" }))
app.use(bodyParser.urlencoded({ extended: true, limit: "10mb" }))

app.use(express.static(path.join(__dirname, "public")))

// Create uploads directory if it doesn't exist
const fs = require("fs")
const uploadDir = path.join(__dirname, "public", "uploads")
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

// Session configuration
app.use(
  session({
    secret: process.env.SESSION_SECRET || "arte-gallery-secret",
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 60 * 60 * 1000 }, // 1 hour
  }),
)

// Flash messages
app.use(flash())

// Global variables
app.use((req, res, next) => {
  res.locals.success_msg = req.flash("success_msg")
  res.locals.error_msg = req.flash("error_msg")
  res.locals.error = req.flash("error")
  next()
})

// Request logging middleware
app.use((req, res, next) => {
  if (req.method === "POST" && req.path.includes("/auth/register")) {
    console.log(`${req.method} ${req.path} - Registration request received`)
    // Don't log the full body for security, just log that we received it
  } else {
    console.log(`${req.method} ${req.path}`)
  }
  next()
})

// API Routes
app.use("/api/auth", authRoutes)
app.use("/api/contact", contactRoutes)
app.use("/api/newsletter", newsletterRoutes)
app.use("/api/artworks", artworkRoutes)
app.use("/api/artists", artistRoutes)
app.use("/api/exhibitions", exhibitionRoutes)
app.use("/api/shop", shopRoutes)
app.use("/api/admin", adminRoutes)
app.use("/api/users", userRoutes)

// Fix for direct auth routes (without /api prefix)
app.use(
  "/auth",
  (req, res, next) => {
    console.log(`Auth route accessed: ${req.method} ${req.path}`)
    // Rewrite the URL to use the /api prefix
    req.url = `/api${req.url}`
    next()
  },
  authRoutes,
)

// Serve placeholder.svg
app.get("/placeholder.svg", (req, res) => {
  const width = req.query.width || 300
  const height = req.query.height || 200

  const svg = `
  <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="#f0f0f0"/>
    <text x="50%" y="50%" font-family="Arial" font-size="20" text-anchor="middle" dominant-baseline="middle" fill="#888">
      ${width} × ${height}
    </text>
  </svg>
  `

  res.setHeader("Content-Type", "image/svg+xml")
  res.send(svg)
})

// Serve static HTML files
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"))
})

app.get("/:page", (req, res) => {
  const page = req.params.page
  const validPages = [
    "artists",
    "artworks",
    "blog",
    "exhibitions",
    "shop",
    "login",
    "signup",
    "forgot-password",
    "profile",
    "admin",
    "dashboard",
    "cart",
    "checkout",
  ]

  if (validPages.includes(page) || page.endsWith(".html")) {
    const pageName = page.endsWith(".html") ? page : `${page}.html`
    res.sendFile(path.join(__dirname, "public", pageName), (err) => {
      if (err) {
        res.status(404).sendFile(path.join(__dirname, "public", "404.html"))
      }
    })
  } else {
    res.status(404).sendFile(path.join(__dirname, "public", "404.html"))
  }
})

// Test email route (remove in production)
if (process.env.NODE_ENV !== "production") {
  app.get("/test-email", async (req, res) => {
    try {
      const mailer = require("./utils/mailer")
      const result = await mailer.sendWelcomeEmail("test@example.com", "Test User")
      res.json({
        success: true,
        message: "Test email sent successfully",
        details: result,
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to send test email",
        error: error.message,
      })
    }
  })
}

// Test database connection
app.get("/test-db", async (req, res) => {
  try {
    // Check if mongoose is connected
    if (mongoose.connection.readyState !== 1) {
      return res.status(500).json({
        success: false,
        message: "Database not connected",
        readyState: mongoose.connection.readyState,
      })
    }

    // Try to ping the database
    await mongoose.connection.db.admin().ping()

    res.json({
      success: true,
      message: "Database connection successful",
      host: mongoose.connection.host,
      name: mongoose.connection.name,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Database connection test failed",
      error: error.message,
    })
  }
})

// 404 handler
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, "public", "404.html"))
})

// Error handler
app.use((err, req, res, next) => {
  console.error("Server error:", err.stack)
  res.status(500).json({
    success: false,
    error: "Server error",
    message: err.message,
    stack: process.env.NODE_ENV === "production" ? "🥞" : err.stack,
  })
})

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
