const Artist = require("../models/Artist")
const Artwork = require("../models/Artwork")
const User = require("../models/User")
const mailer = require("../utils/mailer")
const cloudinary = require("../utils/cloudinary")
const mongoose = require("mongoose")
const { validationResult } = require("express-validator")

// Get all artists with pagination
/**
 * Get all artists with pagination, filtering, and sorting
 * @route GET /api/artists
 * @access Public
 */
const getAllArtists = async (req, res) => {
  try {
    const page = Number.parseInt(req.query.page) || 1
    const limit = Number.parseInt(req.query.limit) || 10
    const skip = (page - 1) * limit

    // Filter options
    const filter = {}

    if (req.query.featured) {
      filter.featured = req.query.featured === "true"
    }

    if (req.query.verified) {
      filter.verified = req.query.verified === "true"
    }

    if (req.query.nationality) {
      filter.nationality = { $regex: req.query.nationality, $options: "i" }
    }

    if (req.query.style) {
      filter.styles = { $in: [req.query.style] }
    }

    // Sort options
    let sort = {}
    if (req.query.sort) {
      const sortField = req.query.sort.startsWith("-") ? req.query.sort.substring(1) : req.query.sort
      const sortOrder = req.query.sort.startsWith("-") ? -1 : 1
      sort[sortField] = sortOrder
    } else {
      sort = { name: 1 }
    }

    const artists = await Artist.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .select("name bio profileImage nationality styles featured verified createdAt")
    const total = await Artist.countDocuments(filter)

    res.status(200).json({
      success: true,
      count: artists.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      artists,
    })
  } catch (error) {
    console.error("Error fetching artists:", error)
    res.status(500).json({ success: false, error: "Server error", message: error.message })
  }
}

// Get single artist by ID
/**
 * Get single artist by ID with their artworks
 * @route GET /api/artists/:id
 * @access Public
 */
const getArtistById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, error: "Invalid artist ID format" })
    }

    const artist = await Artist.findById(req.params.id)
    if (!artist) {
      return res.status(404).json({ success: false, error: "Artist not found" })
    }
    const artworks = await Artwork.find({ artist: artist._id })
      .select("title year medium images price forSale dimensions views likes")
      .sort({ createdAt: -1 })
    res.status(200).json({ success: true, artist, artworks, artworksCount: artworks.length })
  } catch (error) {
    console.error("Error fetching artist:", error)
    res.status(500).json({ success: false, error: "Server error", message: error.message })
  }
}

// Create new artist
/**
 * Create new artist
 * @route POST /api/artists
 * @access Private (Admin)
 */
const createArtist = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() })
    }

    // Check if artist with same name already exists
    const existingArtist = await Artist.findOne({ name: req.body.name })
    if (existingArtist) {
      return res.status(400).json({ success: false, error: "Artist with this name already exists" })
    }

    // Handle profile image upload if provided
    let profileImageUrl = null
    if (req.body.profileImage) {
      try {
        const uploadResult = await cloudinary.uploader.upload(req.body.profileImage, {
          folder: "artists/profiles",
          transformation: [{ width: 500, height: 500, crop: "fill" }],
        })
        profileImageUrl = uploadResult.secure_url
      } catch (uploadError) {
        console.error("Error uploading profile image:", uploadError)
        // Continue without image if upload fails
      }
    }

    // Create artist with uploaded image URL if available
    const artistData = {
      ...req.body,
      profileImage: profileImageUrl || req.body.profileImage,
    }

    const artist = new Artist(artistData)
    await artist.save()

    // If user ID is provided, link artist to user
    if (req.body.userId) {
      await User.findByIdAndUpdate(req.body.userId, { artistProfile: artist._id })
    }

    res.status(201).json({
      success: true,
      message: "Artist created successfully",
      artist,
    })
  } catch (error) {
    console.error("Error creating artist:", error)
    res.status(500).json({ success: false, error: "Server error", message: error.message })
  }
}

// Update artist
/**
 * Update artist
 * @route PUT /api/artists/:id
 * @access Private (Admin or Artist Owner)
 */
const updateArtist = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() })
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, error: "Invalid artist ID format" })
    }

    // Check if artist exists
    const artist = await Artist.findById(req.params.id)
    if (!artist) {
      return res.status(404).json({ success: false, error: "Artist not found" })
    }

    // Handle profile image upload if provided and different from current
    if (req.body.profileImage && req.body.profileImage !== artist.profileImage) {
      try {
        // Delete old image if it exists and is on Cloudinary
        if (artist.profileImage && artist.profileImage.includes("cloudinary")) {
          const publicId = artist.profileImage.split("/").pop().split(".")[0]
          await cloudinary.uploader.destroy(`artists/profiles/${publicId}`)
        }

        // Upload new image
        const uploadResult = await cloudinary.uploader.upload(req.body.profileImage, {
          folder: "artists/profiles",
          transformation: [{ width: 500, height: 500, crop: "fill" }],
        })
        req.body.profileImage = uploadResult.secure_url
      } catch (uploadError) {
        console.error("Error updating profile image:", uploadError)
        // Keep old image if upload fails
        req.body.profileImage = artist.profileImage
      }
    }

    // Update artist
    const updatedArtist = await Artist.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })

    res.status(200).json({
      success: true,
      message: "Artist updated successfully",
      artist: updatedArtist,
    })
  } catch (error) {
    console.error("Error updating artist:", error)
    res.status(500).json({ success: false, error: "Server error", message: error.message })
  }
}

// Delete artist
/**
 * Delete artist
 * @route DELETE /api/artists/:id
 * @access Private (Admin)
 */
const deleteArtist = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, error: "Invalid artist ID format" })
    }

    const artist = await Artist.findById(req.params.id)
    if (!artist) {
      return res.status(404).json({ success: false, error: "Artist not found" })
    }

    // Delete artist's profile image from Cloudinary if exists
    if (artist.profileImage && artist.profileImage.includes("cloudinary")) {
      try {
        const publicId = artist.profileImage.split("/").pop().split(".")[0]
        await cloudinary.uploader.destroy(`artists/profiles/${publicId}`)
      } catch (deleteError) {
        console.error("Error deleting profile image:", deleteError)
        // Continue with artist deletion even if image deletion fails
      }
    }

    // Find all artworks by this artist
    const artworks = await Artwork.find({ artist: artist._id })

    // Delete all artwork images from Cloudinary
    for (const artwork of artworks) {
      if (artwork.images && artwork.images.length > 0) {
        for (const image of artwork.images) {
          if (image.includes("cloudinary")) {
            try {
              const publicId = image.split("/").pop().split(".")[0]
              await cloudinary.uploader.destroy(`artworks/${publicId}`)
            } catch (deleteError) {
              console.error("Error deleting artwork image:", deleteError)
              // Continue with deletion even if image deletion fails
            }
          }
        }
      }
    }

    // Delete all artworks by this artist
    await Artwork.deleteMany({ artist: artist._id })

    // Update any users that have this artist profile
    await User.updateMany({ artistProfile: artist._id }, { $unset: { artistProfile: "" } })

    // Delete the artist
    await Artist.findByIdAndDelete(req.params.id)

    res.status(200).json({
      success: true,
      message: "Artist and all associated artworks deleted successfully",
    })
  } catch (error) {
    console.error("Error deleting artist:", error)
    res.status(500).json({ success: false, error: "Server error", message: error.message })
  }
}

// Get featured artists
/**
 * Get featured artists
 * @route GET /api/artists/featured
 * @access Public
 */
const getFeaturedArtists = async (req, res) => {
  try {
    const limit = Number.parseInt(req.query.limit) || 6
    const artists = await Artist.find({ featured: true })
      .limit(limit)
      .select("name bio profileImage nationality styles verified")
    res.status(200).json({ success: true, count: artists.length, artists })
  } catch (error) {
    console.error("Error fetching featured artists:", error)
    res.status(500).json({ success: false, error: "Server error", message: error.message })
  }
}

// Search artists
/**
 * Search artists
 * @route GET /api/artists/search
 * @access Public
 */
const searchArtists = async (req, res) => {
  try {
    const searchTerm = req.query.q
    if (!searchTerm) {
      return res.status(400).json({ success: false, error: "Search term is required" })
    }
    const artists = await Artist.find({
      $or: [
        { name: { $regex: searchTerm, $options: "i" } },
        { bio: { $regex: searchTerm, $options: "i" } },
        { nationality: { $regex: searchTerm, $options: "i" } },
        { styles: { $regex: searchTerm, $options: "i" } },
      ],
    }).select("name bio profileImage nationality styles verified")
    res.status(200).json({ success: true, count: artists.length, artists })
  } catch (error) {
    console.error("Error searching artists:", error)
    res.status(500).json({ success: false, error: "Server error", message: error.message })
  }
}

// Request verification
/**
 * Request artist verification
 * @route POST /api/artists/:id/verification
 * @access Private (Artist Owner)
 */
const requestVerification = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, error: "Invalid artist ID format" })
    }

    const artist = await Artist.findById(req.params.id)

    if (!artist) {
      return res.status(404).json({ success: false, message: "Artist not found" })
    }

    if (artist.verified) {
      return res.status(400).json({ success: false, message: "Artist is already verified" })
    }

    if (artist.verificationRequest && artist.verificationRequest.status === "pending") {
      return res.status(400).json({ success: false, message: "Verification request already pending" })
    }

    // Process document uploads if provided
    const documentUrls = []
    if (req.body.documents && Array.isArray(req.body.documents)) {
      for (const document of req.body.documents) {
        try {
          const uploadResult = await cloudinary.uploader.upload(document, {
            folder: "artists/verification",
            resource_type: "auto",
          })
          documentUrls.push(uploadResult.secure_url)
        } catch (uploadError) {
          console.error("Error uploading verification document:", uploadError)
          // Continue with other documents if one fails
        }
      }
    }

    // Update artist with verification request
    artist.verificationRequest = {
      status: "pending",
      documents: documentUrls.length > 0 ? documentUrls : req.body.documents,
      message: req.body.message || "",
      submittedAt: new Date(),
    }

    await artist.save()

    // Send notification email to admin
    try {
      await mailer.sendVerificationRequestNotification(artist.email, artist.name)
    } catch (emailError) {
      console.error("Error sending verification email:", emailError)
      // Continue even if email fails
    }

    res.status(200).json({
      success: true,
      message: "Verification request submitted successfully",
      verificationRequest: artist.verificationRequest,
    })
  } catch (error) {
    console.error("Error requesting verification:", error)
    res.status(500).json({ success: false, message: "Server error", error: error.message })
  }
}

// Admin: Review verification request
/**
 * Admin: Review verification request
 * @route PUT /api/artists/:id/verification
 * @access Private (Admin)
 */
const reviewVerification = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, error: "Invalid artist ID format" })
    }

    const { status, notes } = req.body

    if (!status || !["approved", "rejected"].includes(status)) {
      return res.status(400).json({ success: false, message: "Valid status (approved/rejected) is required" })
    }

    const artist = await Artist.findById(req.params.id)

    if (!artist) {
      return res.status(404).json({ success: false, message: "Artist not found" })
    }

    if (!artist.verificationRequest) {
      return res.status(400).json({ success: false, message: "No verification request found" })
    }

    if (artist.verificationRequest.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Verification request has already been ${artist.verificationRequest.status}`,
      })
    }

    // Update verification status
    artist.verificationRequest.status = status
    artist.verificationRequest.reviewedAt = new Date()
    artist.verificationRequest.reviewNotes = notes || ""

    if (status === "approved") {
      artist.verified = true
      artist.verifiedAt = new Date()
    }

    await artist.save()

    // Send notification email to artist
    try {
      await mailer.sendVerificationStatusUpdate(artist.email, artist.name, status, notes)
    } catch (emailError) {
      console.error("Error sending verification status email:", emailError)
      // Continue even if email fails
    }

    res.status(200).json({
      success: true,
      message: `Verification request ${status} successfully`,
      verificationStatus: {
        verified: artist.verified,
        verificationRequest: artist.verificationRequest,
      },
    })
  } catch (error) {
    console.error("Error reviewing verification:", error)
    res.status(500).json({ success: false, message: "Server error", error: error.message })
  }
}

// Get verification status
/**
 * Get verification status
 * @route GET /api/artists/:id/verification
 * @access Private (Admin or Artist Owner)
 */
const getVerificationStatus = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, error: "Invalid artist ID format" })
    }

    const artist = await Artist.findById(req.params.id)

    if (!artist) {
      return res.status(404).json({ success: false, message: "Artist not found" })
    }

    res.status(200).json({
      success: true,
      verified: artist.verified,
      verifiedAt: artist.verifiedAt,
      verificationRequest: artist.verificationRequest,
    })
  } catch (error) {
    console.error("Error fetching verification status:", error)
    res.status(500).json({ success: false, message: "Server error", error: error.message })
  }
}

// Artist contribution functions
/**
 * Submit artist contribution (blog post, event, etc.)
 * @route POST /api/artists/:id/contributions
 * @access Private (Artist Owner)
 */
const submitContribution = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, error: "Invalid artist ID format" })
    }

    // Validate request body
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() })
    }

    const artist = await Artist.findById(req.params.id)
    if (!artist) {
      return res.status(404).json({ success: false, message: "Artist not found" })
    }

    // Check if user is authorized (either admin or the artist owner)
    if (!req.user.isAdmin && req.user.artistId.toString() !== artist._id.toString()) {
      return res.status(403).json({ success: false, message: "Not authorized to submit contributions for this artist" })
    }

    // Process media uploads if provided
    const mediaUrls = []
    if (req.body.media && Array.isArray(req.body.media)) {
      for (const mediaItem of req.body.media) {
        try {
          const uploadResult = await cloudinary.uploader.upload(mediaItem, {
            folder: "artists/contributions",
            resource_type: "auto",
          })
          mediaUrls.push(uploadResult.secure_url)
        } catch (uploadError) {
          console.error("Error uploading contribution media:", uploadError)
          // Continue with other media if one fails
        }
      }
    }

    const contribution = {
      title: req.body.title,
      description: req.body.description,
      type: req.body.type,
      media: mediaUrls.length > 0 ? mediaUrls : req.body.media,
      submittedAt: new Date(),
      status: "pending",
    }

    artist.contributions.push(contribution)
    await artist.save()

    // Notify admin about new contribution
    try {
      await mailer.sendNewContributionNotification(artist.name, contribution.title, contribution.type)
    } catch (emailError) {
      console.error("Error sending contribution notification email:", emailError)
      // Continue even if email fails
    }

    res.status(201).json({
      success: true,
      message: "Contribution submitted successfully",
      contribution: artist.contributions[artist.contributions.length - 1],
    })
  } catch (error) {
    console.error("Error submitting contribution:", error)
    res.status(500).json({ success: false, message: "Server error", error: error.message })
  }
}

const getArtistContributions = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, error: "Invalid artist ID format" })
    }

    const artist = await Artist.findById(req.params.id)
    if (!artist) {
      return res.status(404).json({ success: false, message: "Artist not found" })
    }

    // Check if user is authorized (either admin or the artist owner)
    if (!req.user.isAdmin && req.user.artistId.toString() !== artist._id.toString()) {
      return res.status(403).json({ success: false, message: "Not authorized to view contributions for this artist" })
    }

    // Filter by status if provided
    let contributions = artist.contributions
    if (req.query.status) {
      contributions = contributions.filter((c) => c.status === req.query.status)
    }

    // Sort by date (newest first)
    contributions.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))

    res.status(200).json({
      success: true,
      count: contributions.length,
      contributions,
    })
  } catch (error) {
    console.error("Error fetching contributions:", error)
    res.status(500).json({ success: false, message: "Server error", error: error.message })
  }
}

const updateContribution = async (req, res) => {
  try {
    if (
      !mongoose.Types.ObjectId.isValid(req.params.id) ||
      !mongoose.Types.ObjectId.isValid(req.params.contributionId)
    ) {
      return res.status(400).json({ success: false, error: "Invalid ID format" })
    }

    const artist = await Artist.findById(req.params.id)
    if (!artist) {
      return res.status(404).json({ success: false, message: "Artist not found" })
    }

    // Check if user is authorized (either admin or the artist owner)
    if (!req.user.isAdmin && req.user.artistId.toString() !== artist._id.toString()) {
      return res.status(403).json({ success: false, message: "Not authorized to update contributions for this artist" })
    }

    const contribution = artist.contributions.id(req.params.contributionId)
    if (!contribution) {
      return res.status(404).json({ success: false, message: "Contribution not found" })
    }

    // Admin can update status, artist can only update if status is pending or rejected
    if (!req.user.isAdmin && contribution.status === "approved") {
      return res.status(403).json({ success: false, message: "Cannot update an approved contribution" })
    }

    // Process media uploads if provided and different from current
    if (
      req.body.media &&
      Array.isArray(req.body.media) &&
      JSON.stringify(req.body.media) !== JSON.stringify(contribution.media)
    ) {
      // Delete old media if it exists and is on Cloudinary
      if (contribution.media && Array.isArray(contribution.media)) {
        for (const mediaUrl of contribution.media) {
          if (mediaUrl.includes("cloudinary")) {
            try {
              const publicId = mediaUrl.split("/").pop().split(".")[0]
              await cloudinary.uploader.destroy(`artists/contributions/${publicId}`)
            } catch (deleteError) {
              console.error("Error deleting old contribution media:", deleteError)
              // Continue even if deletion fails
            }
          }
        }
      }

      // Upload new media
      const mediaUrls = []
      for (const mediaItem of req.body.media) {
        // Only upload if it's a new file (not a URL)
        if (!mediaItem.startsWith("http")) {
          try {
            const uploadResult = await cloudinary.uploader.upload(mediaItem, {
              folder: "artists/contributions",
              resource_type: "auto",
            })
            mediaUrls.push(uploadResult.secure_url)
          } catch (uploadError) {
            console.error("Error uploading contribution media:", uploadError)
            // Continue with other media if one fails
          }
        } else {
          // Keep existing URLs
          mediaUrls.push(mediaItem)
        }
      }
      req.body.media = mediaUrls
    }

    // Update fields
    Object.keys(req.body).forEach((key) => {
      // Admin can update status, artist cannot
      if (key === "status" && !req.user.isAdmin) {
        return
      }
      contribution[key] = req.body[key]
    })

    // Add update timestamp
    contribution.updatedAt = new Date()

    // If admin is approving, add approvedAt timestamp
    if (req.user.isAdmin && req.body.status === "approved" && contribution.status === "approved") {
      contribution.approvedAt = new Date()
    }

    await artist.save()

    // Notify artist if status was updated by admin
    if (req.user.isAdmin && req.body.status && req.body.status !== contribution.status) {
      try {
        await mailer.sendContributionStatusUpdate(artist.email, artist.name, contribution.title, req.body.status)
      } catch (emailError) {
        console.error("Error sending contribution status email:", emailError)
        // Continue even if email fails
      }
    }

    res.status(200).json({
      success: true,
      message: "Contribution updated successfully",
      contribution,
    })
  } catch (error) {
    console.error("Error updating contribution:", error)
    res.status(500).json({ success: false, message: "Server error", error: error.message })
  }
}

/**
 * Delete artist contribution
 * @route DELETE /api/artists/:id/contributions/:contributionId
 * @access Private (Admin or Artist Owner)
 */
const deleteContribution = async (req, res) => {
  try {
    if (
      !mongoose.Types.ObjectId.isValid(req.params.id) ||
      !mongoose.Types.ObjectId.isValid(req.params.contributionId)
    ) {
      return res.status(400).json({ success: false, error: "Invalid ID format" })
    }

    const artist = await Artist.findById(req.params.id)
    if (!artist) {
      return res.status(404).json({ success: false, message: "Artist not found" })
    }

    // Check if user is authorized (either admin or the artist owner)
    if (!req.user.isAdmin && req.user.artistId.toString() !== artist._id.toString()) {
      return res.status(403).json({ success: false, message: "Not authorized to delete contributions for this artist" })
    }

    const contribution = artist.contributions.id(req.params.contributionId)
    if (!contribution) {
      return res.status(404).json({ success: false, message: "Contribution not found" })
    }

    // Delete media from Cloudinary if exists
    if (contribution.media && Array.isArray(contribution.media)) {
      for (const mediaUrl of contribution.media) {
        if (mediaUrl.includes("cloudinary")) {
          try {
            const publicId = mediaUrl.split("/").pop().split(".")[0]
            await cloudinary.uploader.destroy(`artists/contributions/${publicId}`)
          } catch (deleteError) {
            console.error("Error deleting contribution media:", deleteError)
            // Continue even if deletion fails
          }
        }
      }
    }

    // Remove the contribution
    artist.contributions.pull(req.params.contributionId)
    await artist.save()

    res.status(200).json({
      success: true,
      message: "Contribution deleted successfully",
    })
  } catch (error) {
    console.error("Error deleting contribution:", error)
    res.status(500).json({ success: false, message: "Server error", error: error.message })
  }
}

/**
 * Get artist statistics
 * @route GET /api/artists/:id/stats
 * @access Private (Admin or Artist Owner)
 */
const getArtistStats = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, error: "Invalid artist ID format" })
    }

    const artist = await Artist.findById(req.params.id)
    if (!artist) {
      return res.status(404).json({ success: false, message: "Artist not found" })
    }

    // Check if user is authorized (either admin or the artist owner)
    if (!req.user.isAdmin && req.user.artistId.toString() !== artist._id.toString()) {
      return res.status(403).json({ success: false, message: "Not authorized to view stats for this artist" })
    }

    // Get artworks by this artist
    const artworks = await Artwork.find({ artist: artist._id })

    // Calculate statistics
    const totalArtworks = artworks.length
    const totalViews = artworks.reduce((sum, artwork) => sum + artwork.views, 0)
    const totalLikes = artworks.reduce((sum, artwork) => sum + artwork.likes.length, 0)

    const forSaleCount = artworks.filter((artwork) => artwork.forSale).length
    const soldCount = artworks.filter((artwork) => artwork.sold).length

    // Calculate total sales value
    const totalSalesValue = artworks
      .filter((artwork) => artwork.sold)
      .reduce((sum, artwork) => sum + (artwork.price || 0), 0)

    // Get most viewed artworks
    const mostViewedArtworks = [...artworks]
      .sort((a, b) => b.views - a.views)
      .slice(0, 5)
      .map((artwork) => ({
        _id: artwork._id,
        title: artwork.title,
        views: artwork.views,
        likes: artwork.likes.length,
        price: artwork.price,
        sold: artwork.sold,
        image: artwork.images && artwork.images.length > 0 ? artwork.images[0] : null,
      }))

    // Get most liked artworks
    const mostLikedArtworks = [...artworks]
      .sort((a, b) => b.likes.length - a.likes.length)
      .slice(0, 5)
      .map((artwork) => ({
        _id: artwork._id,
        title: artwork.title,
        views: artwork.views,
        likes: artwork.likes.length,
        price: artwork.price,
        sold: artwork.sold,
        image: artwork.images && artwork.images.length > 0 ? artwork.images[0] : null,
      }))

    res.status(200).json({
      success: true,
      stats: {
        totalArtworks,
        totalViews,
        totalLikes,
        forSaleCount,
        soldCount,
        totalSalesValue,
        mostViewedArtworks,
        mostLikedArtworks,
        profileViews: artist.profileViews || 0,
        contributionsCount: artist.contributions.length,
        verificationStatus: artist.verified
          ? "Verified"
          : artist.verificationRequest
            ? artist.verificationRequest.status
            : "Not requested",
      },
    })
  } catch (error) {
    console.error("Error fetching artist stats:", error)
    res.status(500).json({ success: false, message: "Server error", error: error.message })
  }
}

/**
 * Increment artist profile views
 * @route POST /api/artists/:id/view
 * @access Public
 */
const incrementProfileViews = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, error: "Invalid artist ID format" })
    }

    const artist = await Artist.findById(req.params.id)
    if (!artist) {
      return res.status(404).json({ success: false, message: "Artist not found" })
    }

    // Increment profile views
    artist.profileViews = (artist.profileViews || 0) + 1
    await artist.save()

    res.status(200).json({
      success: true,
      profileViews: artist.profileViews,
    })
  } catch (error) {
    console.error("Error incrementing profile views:", error)
    res.status(500).json({ success: false, message: "Server error", error: error.message })
  }
}

/**
 * Get artist styles (for filtering)
 * @route GET /api/artists/styles
 * @access Public
 */
const getArtistStyles = async (req, res) => {
  try {
    // Aggregate all unique styles across artists
    const styles = await Artist.aggregate([
      { $unwind: "$styles" },
      { $group: { _id: "$styles" } },
      { $sort: { _id: 1 } },
    ])

    const styleList = styles.map((style) => style._id)

    res.status(200).json({
      success: true,
      count: styleList.length,
      styles: styleList,
    })
  } catch (error) {
    console.error("Error fetching artist styles:", error)
    res.status(500).json({ success: false, message: "Server error", error: error.message })
  }
}

/**
 * Get artist nationalities (for filtering)
 * @route GET /api/artists/nationalities
 * @access Public
 */
const getArtistNationalities = async (req, res) => {
  try {
    // Aggregate all unique nationalities across artists
    const nationalities = await Artist.aggregate([{ $group: { _id: "$nationality" } }, { $sort: { _id: 1 } }])

    const nationalityList = nationalities.map((nationality) => nationality._id).filter((nationality) => nationality) // Remove null/empty values

    res.status(200).json({
      success: true,
      count: nationalityList.length,
      nationalities: nationalityList,
    })
  } catch (error) {
    console.error("Error fetching artist nationalities:", error)
    res.status(500).json({ success: false, message: "Server error", error: error.message })
  }
}

module.exports = {
  getAllArtists,
  getArtistById,
  createArtist,
  updateArtist,
  deleteArtist,
  getFeaturedArtists,
  searchArtists,
  requestVerification,
  reviewVerification,
  getVerificationStatus,
  submitContribution,
  getArtistContributions,
  updateContribution,
  deleteContribution,
  getArtistStats,
  incrementProfileViews,
  getArtistStyles,
  getArtistNationalities,
}
