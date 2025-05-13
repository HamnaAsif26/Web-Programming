const multer = require("multer")
const path = require("path")
const fs = require("fs")

// Ensure upload directories exist
const uploadDir = path.join(__dirname, "../public/uploads")
const artworkDir = path.join(uploadDir, "artworks")
const zoomDir = path.join(uploadDir, "zoom")

// Create directories if they don't exist
;[uploadDir, artworkDir, zoomDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
})

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Check if the upload is for zoom images
    if (req.path.includes("/zoom")) {
      cb(null, zoomDir)
    } else {
      cb(null, artworkDir)
    }
  },
  filename: (req, file, cb) => {
    // Create unique filename with timestamp and original extension
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9)
    const ext = path.extname(file.originalname)
    cb(null, file.fieldname + "-" + uniqueSuffix + ext)
  },
})

// File filter to only allow image files
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true)
  } else {
    cb(new Error("Only image files are allowed!"), false)
  }
}

// Configure multer with storage and file size limits
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  },
  fileFilter: fileFilter,
})

module.exports = upload
