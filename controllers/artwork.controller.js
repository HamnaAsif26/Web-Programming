const Artwork = require("../models/Artwork")
const Artist = require("../models/Artist")
const User = require("../models/User")
const mongoose = require("mongoose")
const cloudinary = require("../utils/cloudinary")

// Get all artworks with pagination and filtering
exports.getAllArtworks = async (req, res) => {
  try {
    const page = Number.parseInt(req.query.page) || 1
    const limit = Number.parseInt(req.query.limit) || 12
    const skip = (page - 1) * limit

    // Build filter object
    const filter = {}

    // Add filters if provided
    if (req.query.artist) {
      filter.artist = mongoose.Types.ObjectId(req.query.artist)
    }

    if (req.query.period) {
      filter.period = req.query.period
    }

    if (req.query.medium) {
      filter.medium = req.query.medium
    }

    if (req.query.style) {
      filter.style = req.query.style
    }

    if (req.query.year) {
      filter.year = req.query.year
    }

    if (req.query.minPrice || req.query.maxPrice) {
      filter.price = {}
      if (req.query.minPrice) {
        filter.price.$gte = Number.parseInt(req.query.minPrice)
      }
      if (req.query.maxPrice) {
        filter.price.$lte = Number.parseInt(req.query.maxPrice)
      }
    }

    // Search by title or description
    if (req.query.search) {
      filter.$or = [
        { title: { $regex: req.query.search, $options: "i" } },
        { description: { $regex: req.query.search, $options: "i" } },
      ]
    }

    // Build sort object
    let sort = {}
    if (req.query.sortBy) {
      sort[req.query.sortBy] = req.query.sortOrder === "desc" ? -1 : 1
    } else {
      sort = { createdAt: -1 } // Default sort by newest
    }

    // Count total artworks matching the filter
    const total = await Artwork.countDocuments(filter)

    // Get artworks with pagination
    const artworks = await Artwork.find(filter).populate("artist", "name").sort(sort).skip(skip).limit(limit)

    res.status(200).json({
      success: true,
      count: artworks.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      hasMore: skip + artworks.length < total,
      artworks,
    })
  } catch (error) {
    console.error("Error getting artworks:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
}

// Get single artwork by ID
exports.getArtworkById = async (req, res) => {
  try {
    const artwork = await Artwork.findById(req.params.id).populate("artist").populate("exhibitions")

    if (!artwork) {
      return res.status(404).json({
        success: false,
        message: "Artwork not found",
      })
    }

    res.status(200).json({
      success: true,
      artwork,
    })
  } catch (error) {
    console.error("Error getting artwork:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
}

// Get artworks by artist
exports.getArtworksByArtist = async (req, res) => {
  try {
    const page = Number.parseInt(req.query.page) || 1
    const limit = Number.parseInt(req.query.limit) || 6
    const skip = (page - 1) * limit
    const artistId = req.params.artistId
    const excludeId = req.query.exclude

    // Build filter
    const filter = { artist: mongoose.Types.ObjectId(artistId) }

    // Exclude current artwork if provided
    if (excludeId) {
      filter._id = { $ne: mongoose.Types.ObjectId(excludeId) }
    }

    // Count total artworks by this artist
    const total = await Artwork.countDocuments(filter)

    // Get artworks
    const artworks = await Artwork.find(filter)
      .populate("artist", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)

    res.status(200).json({
      success: true,
      count: artworks.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      hasMore: skip + artworks.length < total,
      artworks,
    })
  } catch (error) {
    console.error("Error getting artworks by artist:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
}

// Filter artworks
exports.filterArtworks = async (req, res) => {
  try {
    const { period, medium, artist, price, style, year, sortBy, sortOrder } = req.body

    // Build filter object
    const filter = {}

    if (period) {
      filter.period = period
    }

    if (medium) {
      filter.medium = medium
    }

    if (artist) {
      filter.artist = mongoose.Types.ObjectId(artist)
    }

    if (style) {
      filter.style = style
    }

    if (year) {
      filter.year = year
    }

    if (price && (price.min || price.max)) {
      filter.price = {}
      if (price.min) {
        filter.price.$gte = Number.parseInt(price.min)
      }
      if (price.max) {
        filter.price.$lte = Number.parseInt(price.max)
      }
    }

    // Build sort object
    let sort = {}
    if (sortBy) {
      sort[sortBy] = sortOrder === "desc" ? -1 : 1
    } else {
      sort = { createdAt: -1 } // Default sort by newest
    }

    // Get filtered artworks
    const artworks = await Artwork.find(filter).populate("artist", "name").sort(sort).limit(50) // Limit to 50 results

    res.status(200).json({
      success: true,
      count: artworks.length,
      artworks,
    })
  } catch (error) {
    console.error("Error filtering artworks:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
}

// Get zoomable artwork image
exports.getZoomableArtwork = async (req, res) => {
  try {
    const artwork = await Artwork.findById(req.params.id)

    if (!artwork) {
      return res.status(404).json({
        success: false,
        message: "Artwork not found",
      })
    }

    // Get high-resolution image if available
    const zoomableImages = artwork.zoomableImages || []
    const imageIndex = req.query.index ? Number.parseInt(req.query.index) : 0

    // If no zoomable images, return the regular image
    if (zoomableImages.length === 0) {
      return res.status(200).json({
        success: true,
        artwork: {
          _id: artwork._id,
          title: artwork.title,
          imageUrl: artwork.imageUrl,
        },
      })
    }

    // Return zoomable image at the specified index or the first one
    const zoomImage = imageIndex < zoomableImages.length ? zoomableImages[imageIndex] : zoomableImages[0]

    res.status(200).json({
      success: true,
      artwork: {
        _id: artwork._id,
        title: artwork.title,
        zoomableImages,
        imageUrl: zoomImage,
      },
    })
  } catch (error) {
    console.error("Error getting zoomable artwork:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
}

// Like/save artwork
exports.toggleSaveArtwork = async (req, res) => {
  try {
    const { artworkId } = req.body
    const userId = req.user.id

    // Check if artwork exists
    const artwork = await Artwork.findById(artworkId)
    if (!artwork) {
      return res.status(404).json({
        success: false,
        message: "Artwork not found",
      })
    }

    // Get user
    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      })
    }

    // Check if artwork is already saved
    const isSaved = user.savedArtworks.includes(artworkId)

    if (isSaved) {
      // Remove artwork from saved list
      user.savedArtworks = user.savedArtworks.filter((id) => id.toString() !== artworkId)
      await user.save()

      res.status(200).json({
        success: true,
        message: "Artwork removed from saved list",
        isSaved: false,
      })
    } else {
      // Add artwork to saved list
      user.savedArtworks.push(artworkId)
      await user.save()

      res.status(200).json({
        success: true,
        message: "Artwork saved successfully",
        isSaved: true,
      })
    }
  } catch (error) {
    console.error("Error toggling save artwork:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
}

// Check if artwork is saved by user
exports.checkSavedStatus = async (req, res) => {
  try {
    const artworkId = req.params.artworkId
    const userId = req.user.id

    // Get user
    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      })
    }

    // Check if artwork is saved
    const isSaved = user.savedArtworks.includes(artworkId)

    res.status(200).json({
      success: true,
      isSaved,
    })
  } catch (error) {
    console.error("Error checking saved status:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
}

// Get user's saved artworks
exports.getSavedArtworks = async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({ success: false, error: "Authentication required" })
    }

    // Find user and populate saved artworks
    const user = await User.findById(req.user.id).populate({
      path: "savedArtworks",
      populate: {
        path: "artist",
        select: "name profileImage",
      },
    })

    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" })
    }

    res.status(200).json({
      success: true,
      count: user.savedArtworks.length,
      artworks: user.savedArtworks,
    })
  } catch (error) {
    console.error("Error getting saved artworks:", error)
    res.status(500).json({ success: false, error: "Server error" })
  }
}

// Create new artwork (admin only)
exports.createArtwork = async (req, res) => {
  try {
    const { title, description, artist, year, period, medium, dimensions, price, forSale, isPublished } = req.body

    // Check if artist exists
    const artistExists = await Artist.findById(artist)
    if (!artistExists) {
      return res.status(404).json({
        success: false,
        message: "Artist not found",
      })
    }

    // Upload image to Cloudinary if provided
    let imageUrl = ""
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "artworks",
      })
      imageUrl = result.secure_url
    }

    // Create new artwork
    const artwork = new Artwork({
      title,
      description,
      artist,
      year,
      period,
      medium,
      dimensions,
      price: forSale ? price : 0,
      forSale: forSale || false,
      isPublished: isPublished || false,
      imageUrl,
    })

    await artwork.save()

    res.status(201).json({
      success: true,
      message: "Artwork created successfully",
      artwork,
    })
  } catch (error) {
    console.error("Error creating artwork:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
}

// Update artwork (admin only)
exports.updateArtwork = async (req, res) => {
  try {
    const { title, description, artist, year, period, medium, dimensions, price, forSale, isPublished } = req.body

    // Check if artwork exists
    const artwork = await Artwork.findById(req.params.id)
    if (!artwork) {
      return res.status(404).json({
        success: false,
        message: "Artwork not found",
      })
    }

    // Check if artist exists if provided
    if (artist) {
      const artistExists = await Artist.findById(artist)
      if (!artistExists) {
        return res.status(404).json({
          success: false,
          message: "Artist not found",
        })
      }
    }

    // Upload image to Cloudinary if provided
    let imageUrl = artwork.imageUrl
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "artworks",
      })
      imageUrl = result.secure_url
    }

    // Update artwork
    const updatedArtwork = await Artwork.findByIdAndUpdate(
      req.params.id,
      {
        title: title || artwork.title,
        description: description || artwork.description,
        artist: artist || artwork.artist,
        year: year || artwork.year,
        period: period || artwork.period,
        medium: medium || artwork.medium,
        dimensions: dimensions || artwork.dimensions,
        price: forSale ? price : 0,
        forSale: forSale !== undefined ? forSale : artwork.forSale,
        isPublished: isPublished !== undefined ? isPublished : artwork.isPublished,
        imageUrl,
      },
      { new: true },
    )

    res.status(200).json({
      success: true,
      message: "Artwork updated successfully",
      artwork: updatedArtwork,
    })
  } catch (error) {
    console.error("Error updating artwork:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
}

// Delete artwork (admin only)
exports.deleteArtwork = async (req, res) => {
  try {
    const artwork = await Artwork.findById(req.params.id)

    if (!artwork) {
      return res.status(404).json({
        success: false,
        message: "Artwork not found",
      })
    }

    // Delete artwork image from Cloudinary if exists
    if (artwork.imageUrl) {
      const publicId = artwork.imageUrl.split("/").pop().split(".")[0]
      await cloudinary.uploader.destroy(`artworks/${publicId}`)
    }

    await artwork.remove()

    res.status(200).json({
      success: true,
      message: "Artwork deleted successfully",
    })
  } catch (error) {
    console.error("Error deleting artwork:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
}

// Add additional images to artwork (admin only)
exports.addAdditionalImages = async (req, res) => {
  try {
    const artwork = await Artwork.findById(req.params.id)

    if (!artwork) {
      return res.status(404).json({
        success: false,
        message: "Artwork not found",
      })
    }

    // Upload images to Cloudinary
    const additionalImages = []
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const result = await cloudinary.uploader.upload(file.path, {
          folder: "artworks",
        })
        additionalImages.push(result.secure_url)
      }
    }

    // Add new images to existing ones
    artwork.additionalImages = [...(artwork.additionalImages || []), ...additionalImages]
    await artwork.save()

    res.status(200).json({
      success: true,
      message: "Additional images added successfully",
      artwork,
    })
  } catch (error) {
    console.error("Error adding additional images:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
}

// Add zoomable images to artwork (admin only)
exports.addZoomableImages = async (req, res) => {
  try {
    const artwork = await Artwork.findById(req.params.id)

    if (!artwork) {
      return res.status(404).json({
        success: false,
        message: "Artwork not found",
      })
    }

    // Upload high-resolution images to Cloudinary
    const zoomableImages = []
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const result = await cloudinary.uploader.upload(file.path, {
          folder: "artworks/zoom",
          quality: "auto:best",
        })
        zoomableImages.push({
          original: artwork.imageUrl, // Link to the original image
          zoom: result.secure_url, // Link to the high-res image
        })
      }
    }

    // Add new zoomable images
    artwork.zoomableImages = [...(artwork.zoomableImages || []), ...zoomableImages]
    await artwork.save()

    res.status(200).json({
      success: true,
      message: "Zoomable images added successfully",
      artwork,
    })
  } catch (error) {
    console.error("Error adding zoomable images:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
}

// Get artwork statistics (admin only)
exports.getArtworkStats = async (req, res) => {
  try {
    // Get total count
    const totalCount = await Artwork.countDocuments()

    // Get count by period
    const periodStats = await Artwork.aggregate([
      {
        $group: {
          _id: "$period",
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
    ])

    // Get count by medium
    const mediumStats = await Artwork.aggregate([
      {
        $group: {
          _id: "$medium",
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
    ])

    // Get count by artist
    const artistStats = await Artwork.aggregate([
      {
        $group: {
          _id: "$artist",
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
      {
        $limit: 10, // Top 10 artists
      },
    ])

    // Get artist details
    const artistIds = artistStats.map((stat) => stat._id)
    const artists = await Artist.find({ _id: { $in: artistIds } }, "name")

    // Map artist names to stats
    const artistStatsWithNames = artistStats.map((stat) => {
      const artist = artists.find((a) => a._id.toString() === stat._id.toString())
      return {
        _id: stat._id,
        name: artist ? artist.name : "Unknown",
        count: stat.count,
      }
    })

    res.status(200).json({
      success: true,
      stats: {
        totalCount,
        periodStats,
        mediumStats,
        artistStats: artistStatsWithNames,
      },
    })
  } catch (error) {
    console.error("Error getting artwork stats:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
}
