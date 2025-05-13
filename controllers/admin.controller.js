const User = require("../models/User")
const Artwork = require("../models/Artwork")
const Artist = require("../models/Artist")
const Exhibition = require("../models/Exhibition")
const Product = require("../models/Product")
const Order = require("../models/Order")
const BlogPost = require("../models/BlogPost")
const fs = require("fs")
const path = require("path")
const { v4: uuidv4 } = require("uuid")

// Dashboard stats
exports.getDashboardStats = async (req, res) => {
  try {
    // Get counts
    const userCount = await User.countDocuments()
    const artworkCount = await Artwork.countDocuments()
    const artistCount = await Artist.countDocuments()
    const exhibitionCount = await Exhibition.countDocuments()
    const productCount = await Product.countDocuments()
    const orderCount = await Order.countDocuments()

    // Get recent orders
    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("user", "firstName lastName email")

    // Get sales data
    const totalSales = await Order.aggregate([
      { $match: { status: { $ne: "Cancelled" } } },
      { $group: { _id: null, total: { $sum: "$total" } } },
    ])

    // Get monthly sales data for chart
    const currentYear = new Date().getFullYear()
    const monthlySales = await Order.aggregate([
      {
        $match: {
          status: { $ne: "Cancelled" },
          createdAt: {
            $gte: new Date(`${currentYear}-01-01`),
            $lte: new Date(`${currentYear}-12-31`),
          },
        },
      },
      {
        $group: {
          _id: { $month: "$createdAt" },
          total: { $sum: "$total" },
        },
      },
      { $sort: { _id: 1 } },
    ])

    // Format monthly sales data
    const monthlyData = Array(12).fill(0)
    monthlySales.forEach((item) => {
      monthlyData[item._id - 1] = item.total
    })

    res.status(200).json({
      success: true,
      stats: {
        userCount,
        artworkCount,
        artistCount,
        exhibitionCount,
        productCount,
        orderCount,
        totalSales: totalSales.length > 0 ? totalSales[0].total : 0,
        monthlySales: monthlyData,
        recentOrders,
      },
    })
  } catch (error) {
    console.error("Error getting dashboard stats:", error)
    res.status(500).json({ success: false, error: "Server error" })
  }
}

// User management
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 })
    res.status(200).json({ success: true, users })
  } catch (error) {
    console.error("Error getting all users:", error)
    res.status(500).json({ success: false, error: "Server error" })
  }
}

exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password")

    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" })
    }

    res.status(200).json({ success: true, user })
  } catch (error) {
    console.error("Error getting user by ID:", error)
    res.status(500).json({ success: false, error: "Server error" })
  }
}

exports.updateUser = async (req, res) => {
  try {
    const { firstName, lastName, email, phone, address, isAdmin, newsletter } = req.body

    // Check if email is already taken
    if (email) {
      const existingUser = await User.findOne({ email, _id: { $ne: req.params.id } })
      if (existingUser) {
        return res.status(400).json({ success: false, error: "Email already in use" })
      }
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      {
        firstName,
        lastName,
        email,
        phone,
        address,
        isAdmin,
        newsletter,
      },
      { new: true, runValidators: true },
    ).select("-password")

    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" })
    }

    res.status(200).json({ success: true, user })
  } catch (error) {
    console.error("Error updating user:", error)
    res.status(500).json({ success: false, error: "Server error" })
  }
}

exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id)

    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" })
    }

    res.status(200).json({ success: true, message: "User deleted successfully" })
  } catch (error) {
    console.error("Error deleting user:", error)
    res.status(500).json({ success: false, error: "Server error" })
  }
}

// Artwork management
exports.getAllArtworks = async (req, res) => {
  try {
    const artworks = await Artwork.find().populate("artist", "name").sort({ createdAt: -1 })
    res.status(200).json({ success: true, artworks })
  } catch (error) {
    console.error("Error getting all artworks:", error)
    res.status(500).json({ success: false, error: "Server error" })
  }
}

exports.createArtwork = async (req, res) => {
  try {
    const { title, artist, description, period, medium, dimensions, year, price, forSale, category, tags, featured } =
      req.body

    // Check if artist exists
    const artistExists = await Artist.findById(artist)
    if (!artistExists) {
      return res.status(404).json({ success: false, error: "Artist not found" })
    }

    // Handle image upload
    let imageUrl = ""
    if (req.files && req.files.image) {
      const image = req.files.image

      // Check file type
      const allowedTypes = ["image/jpeg", "image/png", "image/gif"]
      if (!allowedTypes.includes(image.mimetype)) {
        return res.status(400).json({ success: false, error: "Invalid file type. Only JPEG, PNG, and GIF are allowed" })
      }

      // Check file size (max 5MB)
      if (image.size > 5 * 1024 * 1024) {
        return res.status(400).json({ success: false, error: "File too large. Maximum size is 5MB" })
      }

      // Create uploads directory if it doesn't exist
      const uploadDir = path.join(__dirname, "..", "public", "uploads", "artworks")
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true })
      }

      // Generate unique filename
      const filename = `${uuidv4()}-${image.name}`
      const filepath = path.join(uploadDir, filename)

      // Save file
      await image.mv(filepath)

      imageUrl = `/uploads/artworks/${filename}`
    } else if (req.body.imageUrl) {
      imageUrl = req.body.imageUrl
    } else {
      return res.status(400).json({ success: false, error: "Image is required" })
    }

    // Handle additional images
    const additionalImages = []
    if (req.files && req.files.additionalImages) {
      const images = Array.isArray(req.files.additionalImages)
        ? req.files.additionalImages
        : [req.files.additionalImages]

      // Create uploads directory if it doesn't exist
      const uploadDir = path.join(__dirname, "..", "public", "uploads", "artworks")
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true })
      }

      for (const image of images) {
        // Check file type
        const allowedTypes = ["image/jpeg", "image/png", "image/gif"]
        if (!allowedTypes.includes(image.mimetype)) {
          continue
        }

        // Check file size (max 5MB)
        if (image.size > 5 * 1024 * 1024) {
          continue
        }

        // Generate unique filename
        const filename = `${uuidv4()}-${image.name}`
        const filepath = path.join(uploadDir, filename)

        // Save file
        await image.mv(filepath)

        additionalImages.push(`/uploads/artworks/${filename}`)
      }
    } else if (req.body.additionalImages) {
      // Handle additionalImages from request body (array or string)
      if (Array.isArray(req.body.additionalImages)) {
        additionalImages.push(...req.body.additionalImages)
      } else {
        additionalImages.push(req.body.additionalImages)
      }
    }

    // Create artwork
    const artwork = await Artwork.create({
      title,
      artist,
      description,
      period,
      medium,
      dimensions,
      year,
      imageUrl,
      additionalImages,
      price,
      forSale,
      category,
      tags: tags ? (Array.isArray(tags) ? tags : tags.split(",").map((tag) => tag.trim())) : [],
      featured,
    })

    res.status(201).json({ success: true, artwork })
  } catch (error) {
    console.error("Error creating artwork:", error)
    res.status(500).json({ success: false, error: "Server error" })
  }
}

exports.getArtworkById = async (req, res) => {
  try {
    const artwork = await Artwork.findById(req.params.id).populate("artist", "name")

    if (!artwork) {
      return res.status(404).json({ success: false, error: "Artwork not found" })
    }

    res.status(200).json({ success: true, artwork })
  } catch (error) {
    console.error("Error getting artwork by ID:", error)
    res.status(500).json({ success: false, error: "Server error" })
  }
}

exports.updateArtwork = async (req, res) => {
  try {
    const { title, artist, description, period, medium, dimensions, year, price, forSale, category, tags, featured } =
      req.body

    // Check if artist exists
    if (artist) {
      const artistExists = await Artist.findById(artist)
      if (!artistExists) {
        return res.status(404).json({ success: false, error: "Artist not found" })
      }
    }

    // Get existing artwork
    const existingArtwork = await Artwork.findById(req.params.id)
    if (!existingArtwork) {
      return res.status(404).json({ success: false, error: "Artwork not found" })
    }

    // Handle image upload
    let imageUrl = existingArtwork.imageUrl
    if (req.files && req.files.image) {
      const image = req.files.image

      // Check file type
      const allowedTypes = ["image/jpeg", "image/png", "image/gif"]
      if (!allowedTypes.includes(image.mimetype)) {
        return res.status(400).json({ success: false, error: "Invalid file type. Only JPEG, PNG, and GIF are allowed" })
      }

      // Check file size (max 5MB)
      if (image.size > 5 * 1024 * 1024) {
        return res.status(400).json({ success: false, error: "File too large. Maximum size is 5MB" })
      }

      // Create uploads directory if it doesn't exist
      const uploadDir = path.join(__dirname, "..", "public", "uploads", "artworks")
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true })
      }

      // Generate unique filename
      const filename = `${uuidv4()}-${image.name}`
      const filepath = path.join(uploadDir, filename)

      // Save file
      await image.mv(filepath)

      // Delete old image if it exists and is not a default image
      if (existingArtwork.imageUrl && !existingArtwork.imageUrl.includes("placeholder")) {
        const oldImagePath = path.join(__dirname, "..", "public", existingArtwork.imageUrl)
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath)
        }
      }

      imageUrl = `/uploads/artworks/${filename}`
    } else if (req.body.imageUrl && req.body.imageUrl !== existingArtwork.imageUrl) {
      imageUrl = req.body.imageUrl
    }

    // Handle additional images
    let additionalImages = [...existingArtwork.additionalImages]
    if (req.files && req.files.additionalImages) {
      const images = Array.isArray(req.files.additionalImages)
        ? req.files.additionalImages
        : [req.files.additionalImages]

      // Create uploads directory if it doesn't exist
      const uploadDir = path.join(__dirname, "..", "public", "uploads", "artworks")
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true })
      }

      for (const image of images) {
        // Check file type
        const allowedTypes = ["image/jpeg", "image/png", "image/gif"]
        if (!allowedTypes.includes(image.mimetype)) {
          continue
        }

        // Check file size (max 5MB)
        if (image.size > 5 * 1024 * 1024) {
          continue
        }

        // Generate unique filename
        const filename = `${uuidv4()}-${image.name}`
        const filepath = path.join(uploadDir, filename)

        // Save file
        await image.mv(filepath)

        additionalImages.push(`/uploads/artworks/${filename}`)
      }
    } else if (req.body.additionalImages) {
      // Replace existing additional images
      if (Array.isArray(req.body.additionalImages)) {
        additionalImages = req.body.additionalImages
      } else if (typeof req.body.additionalImages === "string") {
        additionalImages = req.body.additionalImages.split(",").map((img) => img.trim())
      }
    }

    // Update artwork
    const artwork = await Artwork.findByIdAndUpdate(
      req.params.id,
      {
        title,
        artist,
        description,
        period,
        medium,
        dimensions,
        year,
        imageUrl,
        additionalImages,
        price,
        forSale,
        category,
        tags: tags ? (Array.isArray(tags) ? tags : tags.split(",").map((tag) => tag.trim())) : existingArtwork.tags,
        featured,
      },
      { new: true, runValidators: true },
    ).populate("artist", "name")

    res.status(200).json({ success: true, artwork })
  } catch (error) {
    console.error("Error updating artwork:", error)
    res.status(500).json({ success: false, error: "Server error" })
  }
}

exports.deleteArtwork = async (req, res) => {
  try {
    const artwork = await Artwork.findById(req.params.id)

    if (!artwork) {
      return res.status(404).json({ success: false, error: "Artwork not found" })
    }

    // Delete artwork images
    if (artwork.imageUrl && !artwork.imageUrl.includes("placeholder")) {
      const imagePath = path.join(__dirname, "..", "public", artwork.imageUrl)
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath)
      }
    }

    // Delete additional images
    artwork.additionalImages.forEach((image) => {
      if (!image.includes("placeholder")) {
        const imagePath = path.join(__dirname, "..", "public", image)
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath)
        }
      }
    })

    // Delete artwork from database
    await Artwork.findByIdAndDelete(req.params.id)

    res.status(200).json({ success: true, message: "Artwork deleted successfully" })
  } catch (error) {
    console.error("Error deleting artwork:", error)
    res.status(500).json({ success: false, error: "Server error" })
  }
}

// Artist management
exports.getAllArtists = async (req, res) => {
  try {
    const artists = await Artist.find().sort({ name: 1 })
    res.status(200).json({ success: true, artists })
  } catch (error) {
    console.error("Error getting all artists:", error)
    res.status(500).json({ success: false, error: "Server error" })
  }
}

exports.createArtist = async (req, res) => {
  try {
    const { name, biography, birthDate, deathDate, nationality, artMovements, featured } = req.body

    // Handle image upload
    let imageUrl = ""
    if (req.files && req.files.image) {
      const image = req.files.image

      // Check file type
      const allowedTypes = ["image/jpeg", "image/png", "image/gif"]
      if (!allowedTypes.includes(image.mimetype)) {
        return res.status(400).json({ success: false, error: "Invalid file type. Only JPEG, PNG, and GIF are allowed" })
      }

      // Check file size (max 5MB)
      if (image.size > 5 * 1024 * 1024) {
        return res.status(400).json({ success: false, error: "File too large. Maximum size is 5MB" })
      }

      // Create uploads directory if it doesn't exist
      const uploadDir = path.join(__dirname, "..", "public", "uploads", "artists")
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true })
      }

      // Generate unique filename
      const filename = `${uuidv4()}-${image.name}`
      const filepath = path.join(uploadDir, filename)

      // Save file
      await image.mv(filepath)

      imageUrl = `/uploads/artists/${filename}`
    } else if (req.body.imageUrl) {
      imageUrl = req.body.imageUrl
    }

    // Create artist
    const artist = await Artist.create({
      name,
      biography,
      birthDate,
      deathDate,
      nationality,
      imageUrl,
      artMovements: artMovements
        ? Array.isArray(artMovements)
          ? artMovements
          : artMovements.split(",").map((movement) => movement.trim())
        : [],
      featured,
    })

    res.status(201).json({ success: true, artist })
  } catch (error) {
    console.error("Error creating artist:", error)
    res.status(500).json({ success: false, error: "Server error" })
  }
}

exports.getArtistById = async (req, res) => {
  try {
    const artist = await Artist.findById(req.params.id)

    if (!artist) {
      return res.status(404).json({ success: false, error: "Artist not found" })
    }

    // Get artist's artworks
    const artworks = await Artwork.find({ artist: req.params.id }).select("title imageUrl year medium")

    res.status(200).json({ success: true, artist, artworks })
  } catch (error) {
    console.error("Error getting artist by ID:", error)
    res.status(500).json({ success: false, error: "Server error" })
  }
}

exports.updateArtist = async (req, res) => {
  try {
    const { name, biography, birthDate, deathDate, nationality, artMovements, featured } = req.body

    // Get existing artist
    const existingArtist = await Artist.findById(req.params.id)
    if (!existingArtist) {
      return res.status(404).json({ success: false, error: "Artist not found" })
    }

    // Handle image upload
    let imageUrl = existingArtist.imageUrl
    if (req.files && req.files.image) {
      const image = req.files.image

      // Check file type
      const allowedTypes = ["image/jpeg", "image/png", "image/gif"]
      if (!allowedTypes.includes(image.mimetype)) {
        return res.status(400).json({ success: false, error: "Invalid file type. Only JPEG, PNG, and GIF are allowed" })
      }

      // Check file size (max 5MB)
      if (image.size > 5 * 1024 * 1024) {
        return res.status(400).json({ success: false, error: "File too large. Maximum size is 5MB" })
      }

      // Create uploads directory if it doesn't exist
      const uploadDir = path.join(__dirname, "..", "public", "uploads", "artists")
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true })
      }

      // Generate unique filename
      const filename = `${uuidv4()}-${image.name}`
      const filepath = path.join(uploadDir, filename)

      // Save file
      await image.mv(filepath)

      // Delete old image if it exists and is not a default image
      if (existingArtist.imageUrl && !existingArtist.imageUrl.includes("placeholder")) {
        const oldImagePath = path.join(__dirname, "..", "public", existingArtist.imageUrl)
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath)
        }
      }

      imageUrl = `/uploads/artists/${filename}`
    } else if (req.body.imageUrl && req.body.imageUrl !== existingArtist.imageUrl) {
      imageUrl = req.body.imageUrl
    }

    // Update artist
    const artist = await Artist.findByIdAndUpdate(
      req.params.id,
      {
        name,
        biography,
        birthDate,
        deathDate,
        nationality,
        imageUrl,
        artMovements: artMovements
          ? Array.isArray(artMovements)
            ? artMovements
            : artMovements.split(",").map((movement) => movement.trim())
          : existingArtist.artMovements,
        featured,
      },
      { new: true, runValidators: true },
    )

    res.status(200).json({ success: true, artist })
  } catch (error) {
    console.error("Error updating artist:", error)
    res.status(500).json({ success: false, error: "Server error" })
  }
}

exports.deleteArtist = async (req, res) => {
  try {
    const artist = await Artist.findById(req.params.id)

    if (!artist) {
      return res.status(404).json({ success: false, error: "Artist not found" })
    }

    // Check if artist has artworks
    const artworksCount = await Artwork.countDocuments({ artist: req.params.id })
    if (artworksCount > 0) {
      return res.status(400).json({ success: false, error: "Cannot delete artist with associated artworks" })
    }

    // Delete artist image
    if (artist.imageUrl && !artist.imageUrl.includes("placeholder")) {
      const imagePath = path.join(__dirname, "..", "public", artist.imageUrl)
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath)
      }
    }

    // Delete artist from database
    await Artist.findByIdAndDelete(req.params.id)

    res.status(200).json({ success: true, message: "Artist deleted successfully" })
  } catch (error) {
    console.error("Error deleting artist:", error)
    res.status(500).json({ success: false, error: "Server error" })
  }
}

// Exhibition management
exports.getAllExhibitions = async (req, res) => {
  try {
    const exhibitions = await Exhibition.find().sort({ startDate: -1 })
    res.status(200).json({ success: true, exhibitions })
  } catch (error) {
    console.error("Error getting all exhibitions:", error)
    res.status(500).json({ success: false, error: "Server error" })
  }
}

exports.createExhibition = async (req, res) => {
  try {
    const { title, description, startDate, endDate, location, ticketPrice, artworks, featured } = req.body

    // Handle image upload
    let imageUrl = ""
    if (req.files && req.files.image) {
      const image = req.files.image

      // Check file type
      const allowedTypes = ["image/jpeg", "image/png", "image/gif"]
      if (!allowedTypes.includes(image.mimetype)) {
        return res.status(400).json({ success: false, error: "Invalid file type. Only JPEG, PNG, and GIF are allowed" })
      }

      // Check file size (max 5MB)
      if (image.size > 5 * 1024 * 1024) {
        return res.status(400).json({ success: false, error: "File too large. Maximum size is 5MB" })
      }

      // Create uploads directory if it doesn't exist
      const uploadDir = path.join(__dirname, "..", "public", "uploads", "exhibitions")
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true })
      }

      // Generate unique filename
      const filename = `${uuidv4()}-${image.name}`
      const filepath = path.join(uploadDir, filename)

      // Save file
      await image.mv(filepath)

      imageUrl = `/uploads/exhibitions/${filename}`
    } else if (req.body.imageUrl) {
      imageUrl = req.body.imageUrl
    } else {
      return res.status(400).json({ success: false, error: "Image is required" })
    }

    // Validate artworks
    let artworksArray = []
    if (artworks) {
      artworksArray = Array.isArray(artworks) ? artworks : artworks.split(",").map((id) => id.trim())

      // Check if all artworks exist
      for (const artworkId of artworksArray) {
        const artwork = await Artwork.findById(artworkId)
        if (!artwork) {
          return res.status(404).json({ success: false, error: `Artwork with ID ${artworkId} not found` })
        }
      }
    }

    // Determine status based on dates
    const now = new Date()
    const start = new Date(startDate)
    const end = new Date(endDate)

    let status = "Upcoming"
    if (now > end) {
      status = "Past"
    } else if (now >= start && now <= end) {
      status = "Ongoing"
    }

    // Create exhibition
    const exhibition = await Exhibition.create({
      title,
      description,
      startDate,
      endDate,
      imageUrl,
      location,
      ticketPrice: {
        regular: ticketPrice?.regular || 10,
        student: ticketPrice?.student || 5,
        senior: ticketPrice?.senior || 7,
        vip: ticketPrice?.vip || 20,
      },
      artworks: artworksArray,
      featured: featured || false,
      status,
    })

    res.status(201).json({ success: true, exhibition })
  } catch (error) {
    console.error("Error creating exhibition:", error)
    res.status(500).json({ success: false, error: "Server error" })
  }
}

exports.getExhibitionById = async (req, res) => {
  try {
    const exhibition = await Exhibition.findById(req.params.id).populate("artworks", "title artist imageUrl")

    if (!exhibition) {
      return res.status(404).json({ success: false, error: "Exhibition not found" })
    }

    res.status(200).json({ success: true, exhibition })
  } catch (error) {
    console.error("Error getting exhibition by ID:", error)
    res.status(500).json({ success: false, error: "Server error" })
  }
}

exports.updateExhibition = async (req, res) => {
  try {
    const { title, description, startDate, endDate, location, ticketPrice, artworks, featured } = req.body

    // Get existing exhibition
    const existingExhibition = await Exhibition.findById(req.params.id)
    if (!existingExhibition) {
      return res.status(404).json({ success: false, error: "Exhibition not found" })
    }

    // Handle image upload
    let imageUrl = existingExhibition.imageUrl
    if (req.files && req.files.image) {
      const image = req.files.image

      // Check file type
      const allowedTypes = ["image/jpeg", "image/png", "image/gif"]
      if (!allowedTypes.includes(image.mimetype)) {
        return res.status(400).json({ success: false, error: "Invalid file type. Only JPEG, PNG, and GIF are allowed" })
      }

      // Check file size (max 5MB)
      if (image.size > 5 * 1024 * 1024) {
        return res.status(400).json({ success: false, error: "File too large. Maximum size is 5MB" })
      }

      // Create uploads directory if it doesn't exist
      const uploadDir = path.join(__dirname, "..", "public", "uploads", "exhibitions")
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true })
      }

      // Generate unique filename
      const filename = `${uuidv4()}-${image.name}`
      const filepath = path.join(uploadDir, filename)

      // Save file
      await image.mv(filepath)

      // Delete old image if it exists and is not a default image
      if (existingExhibition.imageUrl && !existingExhibition.imageUrl.includes("placeholder")) {
        const oldImagePath = path.join(__dirname, "..", "public", existingExhibition.imageUrl)
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath)
        }
      }

      imageUrl = `/uploads/exhibitions/${filename}`
    } else if (req.body.imageUrl && req.body.imageUrl !== existingExhibition.imageUrl) {
      imageUrl = req.body.imageUrl
    }

    // Validate artworks
    let artworksArray = existingExhibition.artworks
    if (artworks) {
      artworksArray = Array.isArray(artworks) ? artworks : artworks.split(",").map((id) => id.trim())

      // Check if all artworks exist
      for (const artworkId of artworksArray) {
        const artwork = await Artwork.findById(artworkId)
        if (!artwork) {
          return res.status(404).json({ success: false, error: `Artwork with ID ${artworkId} not found` })
        }
      }
    }

    // Determine status based on dates
    const now = new Date()
    const start = new Date(startDate || existingExhibition.startDate)
    const end = new Date(endDate || existingExhibition.endDate)

    let status = "Upcoming"
    if (now > end) {
      status = "Past"
    } else if (now >= start && now <= end) {
      status = "Ongoing"
    }

    // Update exhibition
    const exhibition = await Exhibition.findByIdAndUpdate(
      req.params.id,
      {
        title,
        description,
        startDate,
        endDate,
        imageUrl,
        location,
        ticketPrice: {
          regular: ticketPrice?.regular || existingExhibition.ticketPrice.regular,
          student: ticketPrice?.student || existingExhibition.ticketPrice.student,
          senior: ticketPrice?.senior || existingExhibition.ticketPrice.senior,
          vip: ticketPrice?.vip || existingExhibition.ticketPrice.vip,
        },
        artworks: artworksArray,
        featured: featured !== undefined ? featured : existingExhibition.featured,
        status,
      },
      { new: true, runValidators: true },
    ).populate("artworks", "title artist imageUrl")

    res.status(200).json({ success: true, exhibition })
  } catch (error) {
    console.error("Error updating exhibition:", error)
    res.status(500).json({ success: false, error: "Server error" })
  }
}

exports.deleteExhibition = async (req, res) => {
  try {
    const exhibition = await Exhibition.findById(req.params.id)

    if (!exhibition) {
      return res.status(404).json({ success: false, error: "Exhibition not found" })
    }

    // Delete exhibition image
    if (exhibition.imageUrl && !exhibition.imageUrl.includes("placeholder")) {
      const imagePath = path.join(__dirname, "..", "public", exhibition.imageUrl)
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath)
      }
    }

    // Delete exhibition from database
    await Exhibition.findByIdAndDelete(req.params.id)

    res.status(200).json({ success: true, message: "Exhibition deleted successfully" })
  } catch (error) {
    console.error("Error deleting exhibition:", error)
    res.status(500).json({ success: false, error: "Server error" })
  }
}

// Product management
exports.getAllProducts = async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 })
    res.status(200).json({ success: true, products })
  } catch (error) {
    console.error("Error getting all products:", error)
    res.status(500).json({ success: false, error: "Server error" })
  }
}

exports.createProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      category,
      stockQuantity,
      relatedArtwork,
      dimensions,
      weight,
      material,
      featured,
      inStock,
    } = req.body

    // Handle image upload
    let imageUrl = ""
    if (req.files && req.files.image) {
      const image = req.files.image

      // Check file type
      const allowedTypes = ["image/jpeg", "image/png", "image/gif"]
      if (!allowedTypes.includes(image.mimetype)) {
        return res.status(400).json({ success: false, error: "Invalid file type. Only JPEG, PNG, and GIF are allowed" })
      }

      // Check file size (max 5MB)
      if (image.size > 5 * 1024 * 1024) {
        return res.status(400).json({ success: false, error: "File too large. Maximum size is 5MB" })
      }

      // Create uploads directory if it doesn't exist
      const uploadDir = path.join(__dirname, "..", "public", "uploads", "products")
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true })
      }

      // Generate unique filename
      const filename = `${uuidv4()}-${image.name}`
      const filepath = path.join(uploadDir, filename)

      // Save file
      await image.mv(filepath)

      imageUrl = `/uploads/products/${filename}`
    } else if (req.body.imageUrl) {
      imageUrl = req.body.imageUrl
    } else {
      return res.status(400).json({ success: false, error: "Image is required" })
    }

    // Handle additional images
    const additionalImages = []
    if (req.files && req.files.additionalImages) {
      const images = Array.isArray(req.files.additionalImages)
        ? req.files.additionalImages
        : [req.files.additionalImages]

      // Create uploads directory if it doesn't exist
      const uploadDir = path.join(__dirname, "..", "public", "uploads", "products")
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true })
      }

      for (const image of images) {
        // Check file type
        const allowedTypes = ["image/jpeg", "image/png", "image/gif"]
        if (!allowedTypes.includes(image.mimetype)) {
          continue
        }

        // Check file size (max 5MB)
        if (image.size > 5 * 1024 * 1024) {
          continue
        }

        // Generate unique filename
        const filename = `${uuidv4()}-${image.name}`
        const filepath = path.join(uploadDir, filename)

        // Save file
        await image.mv(filepath)

        additionalImages.push(`/uploads/products/${filename}`)
      }
    } else if (req.body.additionalImages) {
      // Handle additionalImages from request body (array or string)
      if (Array.isArray(req.body.additionalImages)) {
        additionalImages.push(...req.body.additionalImages)
      } else {
        additionalImages.push(req.body.additionalImages)
      }
    }

    // Create product
    const product = await Product.create({
      name,
      description,
      price,
      imageUrl,
      additionalImages,
      category,
      stockQuantity: stockQuantity || 0,
      inStock: inStock !== undefined ? inStock : true,
      relatedArtwork,
      dimensions,
      weight,
      material,
      featured: featured || false,
    })

    res.status(201).json({ success: true, product })
  } catch (error) {
    console.error("Error creating product:", error)
    res.status(500).json({ success: false, error: "Server error" })
  }
}

exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate("relatedArtwork", "title artist imageUrl")

    if (!product) {
      return res.status(404).json({ success: false, error: "Product not found" })
    }

    res.status(200).json({ success: true, product })
  } catch (error) {
    console.error("Error getting product by ID:", error)
    res.status(500).json({ success: false, error: "Server error" })
  }
}

exports.updateProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      category,
      stockQuantity,
      relatedArtwork,
      dimensions,
      weight,
      material,
      featured,
      inStock,
    } = req.body

    // Get existing product
    const existingProduct = await Product.findById(req.params.id)
    if (!existingProduct) {
      return res.status(404).json({ success: false, error: "Product not found" })
    }

    // Handle image upload
    let imageUrl = existingProduct.imageUrl
    if (req.files && req.files.image) {
      const image = req.files.image

      // Check file type
      const allowedTypes = ["image/jpeg", "image/png", "image/gif"]
      if (!allowedTypes.includes(image.mimetype)) {
        return res.status(400).json({ success: false, error: "Invalid file type. Only JPEG, PNG, and GIF are allowed" })
      }

      // Check file size (max 5MB)
      if (image.size > 5 * 1024 * 1024) {
        return res.status(400).json({ success: false, error: "File too large. Maximum size is 5MB" })
      }

      // Create uploads directory if it doesn't exist
      const uploadDir = path.join(__dirname, "..", "public", "uploads", "products")
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true })
      }

      // Generate unique filename
      const filename = `${uuidv4()}-${image.name}`
      const filepath = path.join(uploadDir, filename)

      // Save file
      await image.mv(filepath)

      // Delete old image if it exists and is not a default image
      if (existingProduct.imageUrl && !existingProduct.imageUrl.includes("placeholder")) {
        const oldImagePath = path.join(__dirname, "..", "public", existingProduct.imageUrl)
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath)
        }
      }

      imageUrl = `/uploads/products/${filename}`
    } else if (req.body.imageUrl && req.body.imageUrl !== existingProduct.imageUrl) {
      imageUrl = req.body.imageUrl
    }

    // Handle additional images
    let additionalImages = [...existingProduct.additionalImages]
    if (req.files && req.files.additionalImages) {
      const images = Array.isArray(req.files.additionalImages)
        ? req.files.additionalImages
        : [req.files.additionalImages]

      // Create uploads directory if it doesn't exist
      const uploadDir = path.join(__dirname, "..", "public", "uploads", "products")
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true })
      }

      for (const image of images) {
        // Check file type
        const allowedTypes = ["image/jpeg", "image/png", "image/gif"]
        if (!allowedTypes.includes(image.mimetype)) {
          continue
        }

        // Check file size (max 5MB)
        if (image.size > 5 * 1024 * 1024) {
          continue
        }

        // Generate unique filename
        const filename = `${uuidv4()}-${image.name}`
        const filepath = path.join(uploadDir, filename)

        // Save file
        await image.mv(filepath)

        additionalImages.push(`/uploads/products/${filename}`)
      }
    } else if (req.body.additionalImages) {
      // Replace existing additional images
      if (Array.isArray(req.body.additionalImages)) {
        additionalImages = req.body.additionalImages
      } else if (typeof req.body.additionalImages === "string") {
        additionalImages = req.body.additionalImages.split(",").map((img) => img.trim())
      }
    }

    // Update product
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      {
        name,
        description,
        price,
        imageUrl,
        additionalImages,
        category,
        stockQuantity: stockQuantity !== undefined ? stockQuantity : existingProduct.stockQuantity,
        inStock: inStock !== undefined ? inStock : existingProduct.inStock,
        relatedArtwork,
        dimensions,
        weight,
        material,
        featured: featured !== undefined ? featured : existingProduct.featured,
      },
      { new: true, runValidators: true },
    ).populate("relatedArtwork", "title artist imageUrl")

    res.status(200).json({ success: true, product })
  } catch (error) {
    console.error("Error updating product:", error)
    res.status(500).json({ success: false, error: "Server error" })
  }
}

exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)

    if (!product) {
      return res.status(404).json({ success: false, error: "Product not found" })
    }

    // Delete product image
    if (product.imageUrl && !product.imageUrl.includes("placeholder")) {
      const imagePath = path.join(__dirname, "..", "public", product.imageUrl)
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath)
      }
    }

    // Delete additional images
    product.additionalImages.forEach((image) => {
      if (!image.includes("placeholder")) {
        const imagePath = path.join(__dirname, "..", "public", image)
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath)
        }
      }
    })

    // Delete product from database
    await Product.findByIdAndDelete(req.params.id)

    res.status(200).json({ success: true, message: "Product deleted successfully" })
  } catch (error) {
    console.error("Error deleting product:", error)
    res.status(500).json({ success: false, error: "Server error" })
  }
}

// Order management
exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 }).populate("user", "firstName lastName email")

    res.status(200).json({ success: true, orders })
  } catch (error) {
    console.error("Error getting all orders:", error)
    res.status(500).json({ success: false, error: "Server error" })
  }
}

exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("user", "firstName lastName email")
      .populate("items.product", "name imageUrl price")

    if (!order) {
      return res.status(404).json({ success: false, error: "Order not found" })
    }

    res.status(200).json({ success: true, order })
  } catch (error) {
    console.error("Error getting order by ID:", error)
    res.status(500).json({ success: false, error: "Server error" })
  }
}

exports.updateOrder = async (req, res) => {
  try {
    const { status, paymentStatus, trackingNumber, notes } = req.body

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      {
        status,
        paymentStatus,
        trackingNumber,
        notes,
      },
      { new: true, runValidators: true },
    )
      .populate("user", "firstName lastName email")
      .populate("items.product", "name imageUrl price")

    if (!order) {
      return res.status(404).json({ success: false, error: "Order not found" })
    }

    res.status(200).json({ success: true, order })
  } catch (error) {
    console.error("Error updating order:", error)
    res.status(500).json({ success: false, error: "Server error" })
  }
}

// Blog management
exports.getAllBlogPosts = async (req, res) => {
  try {
    const blogPosts = await BlogPost.find().sort({ createdAt: -1 })
    res.status(200).json({ success: true, blogPosts })
  } catch (error) {
    console.error("Error getting all blog posts:", error)
    res.status(500).json({ success: false, error: "Server error" })
  }
}

exports.createBlogPost = async (req, res) => {
  try {
    const { title, content, author, tags, featured } = req.body

    // Handle image upload
    let imageUrl = ""
    if (req.files && req.files.image) {
      const image = req.files.image

      // Check file type
      const allowedTypes = ["image/jpeg", "image/png", "image/gif"]
      if (!allowedTypes.includes(image.mimetype)) {
        return res.status(400).json({ success: false, error: "Invalid file type. Only JPEG, PNG, and GIF are allowed" })
      }

      // Check file size (max 5MB)
      if (image.size > 5 * 1024 * 1024) {
        return res.status(400).json({ success: false, error: "File too large. Maximum size is 5MB" })
      }

      // Create uploads directory if it doesn't exist
      const uploadDir = path.join(__dirname, "..", "public", "uploads", "blog")
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true })
      }

      // Generate unique filename
      const filename = `${uuidv4()}-${image.name}`
      const filepath = path.join(uploadDir, filename)

      // Save file
      await image.mv(filepath)

      imageUrl = `/uploads/blog/${filename}`
    } else if (req.body.imageUrl) {
      imageUrl = req.body.imageUrl
    } else {
      return res.status(400).json({ success: false, error: "Image is required" })
    }

    // Create blog post
    const blogPost = await BlogPost.create({
      title,
      content,
      author,
      imageUrl,
      tags: tags ? (Array.isArray(tags) ? tags : tags.split(",").map((tag) => tag.trim())) : [],
      featured: featured || false,
    })

    res.status(201).json({ success: true, blogPost })
  } catch (error) {
    console.error("Error creating blog post:", error)
    res.status(500).json({ success: false, error: "Server error" })
  }
}

exports.getBlogPostById = async (req, res) => {
  try {
    const blogPost = await BlogPost.findById(req.params.id)

    if (!blogPost) {
      return res.status(404).json({ success: false, error: "Blog post not found" })
    }

    res.status(200).json({ success: true, blogPost })
  } catch (error) {
    console.error("Error getting blog post by ID:", error)
    res.status(500).json({ success: false, error: "Server error" })
  }
}

exports.updateBlogPost = async (req, res) => {
  try {
    const { title, content, author, tags, featured } = req.body

    // Get existing blog post
    const existingBlogPost = await BlogPost.findById(req.params.id)
    if (!existingBlogPost) {
      return res.status(404).json({ success: false, error: "Blog post not found" })
    }

    // Handle image upload
    let imageUrl = existingBlogPost.imageUrl
    if (req.files && req.files.image) {
      const image = req.files.image

      // Check file type
      const allowedTypes = ["image/jpeg", "image/png", "image/gif"]
      if (!allowedTypes.includes(image.mimetype)) {
        return res.status(400).json({ success: false, error: "Invalid file type. Only JPEG, PNG, and GIF are allowed" })
      }

      // Check file size (max 5MB)
      if (image.size > 5 * 1024 * 1024) {
        return res.status(400).json({ success: false, error: "File too large. Maximum size is 5MB" })
      }

      // Create uploads directory if it doesn't exist
      const uploadDir = path.join(__dirname, "..", "public", "uploads", "blog")
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true })
      }

      // Generate unique filename
      const filename = `${uuidv4()}-${image.name}`
      const filepath = path.join(uploadDir, filename)

      // Save file
      await image.mv(filepath)

      // Delete old image if it exists and is not a default image
      if (existingBlogPost.imageUrl && !existingBlogPost.imageUrl.includes("placeholder")) {
        const oldImagePath = path.join(__dirname, "..", "public", existingBlogPost.imageUrl)
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath)
        }
      }

      imageUrl = `/uploads/blog/${filename}`
    } else if (req.body.imageUrl && req.body.imageUrl !== existingBlogPost.imageUrl) {
      imageUrl = req.body.imageUrl
    }

    // Update blog post
    const blogPost = await BlogPost.findByIdAndUpdate(
      req.params.id,
      {
        title,
        content,
        author,
        imageUrl,
        tags: tags ? (Array.isArray(tags) ? tags : tags.split(",").map((tag) => tag.trim())) : existingBlogPost.tags,
        featured: featured !== undefined ? featured : existingBlogPost.featured,
      },
      { new: true, runValidators: true },
    )

    res.status(200).json({ success: true, blogPost })
  } catch (error) {
    console.error("Error updating blog post:", error)
    res.status(500).json({ success: false, error: "Server error" })
  }
}

exports.deleteBlogPost = async (req, res) => {
  try {
    const blogPost = await BlogPost.findById(req.params.id)

    if (!blogPost) {
      return res.status(404).json({ success: false, error: "Blog post not found" })
    }

    // Delete blog post image
    if (blogPost.imageUrl && !blogPost.imageUrl.includes("placeholder")) {
      const imagePath = path.join(__dirname, "..", "public", blogPost.imageUrl)
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath)
      }
    }

    // Delete blog post from database
    await BlogPost.findByIdAndDelete(req.params.id)

    res.status(200).json({ success: true, message: "Blog post deleted successfully" })
  } catch (error) {
    console.error("Error deleting blog post:", error)
    res.status(500).json({ success: false, error: "Server error" })
  }
}
