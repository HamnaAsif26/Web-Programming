const Exhibition = require("../models/Exhibition")
const Artist = require("../models/Artist")
const Artwork = require("../models/Artwork")
const User = require("../models/User")
const mailer = require("../utils/mailer")

// Get all exhibitions with pagination
exports.getAllExhibitions = async (req, res) => {
  try {
    const page = Number.parseInt(req.query.page) || 1
    const limit = Number.parseInt(req.query.limit) || 10
    const skip = (page - 1) * limit

    // Filter options
    const filter = {}

    if (req.query.status) {
      filter.status = req.query.status
    }

    if (req.query.featured) {
      filter.featured = req.query.featured === "true"
    }

    // Sort options
    let sort = {}
    if (req.query.sort) {
      const sortField = req.query.sort.startsWith("-") ? req.query.sort.substring(1) : req.query.sort
      const sortOrder = req.query.sort.startsWith("-") ? -1 : 1
      sort[sortField] = sortOrder
    } else {
      // Default sort: upcoming first, then current, then past by most recent end date
      sort = {
        status: 1,
        startDate: 1,
      }
    }

    const exhibitions = await Exhibition.find(filter).populate("artists", "name").sort(sort).skip(skip).limit(limit)

    const total = await Exhibition.countDocuments(filter)

    res.status(200).json({
      success: true,
      count: exhibitions.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      exhibitions,
    })
  } catch (error) {
    console.error("Error fetching exhibitions:", error)
    res.status(500).json({ success: false, error: "Server error" })
  }
}

// Get single exhibition by ID
exports.getExhibitionById = async (req, res) => {
  try {
    const exhibition = await Exhibition.findById(req.params.id)
      .populate("artists", "name photo")
      .populate("artworks", "title artist images")

    if (!exhibition) {
      return res.status(404).json({ success: false, error: "Exhibition not found" })
    }

    res.status(200).json({ success: true, exhibition })
  } catch (error) {
    console.error("Error fetching exhibition:", error)
    res.status(500).json({ success: false, error: "Server error" })
  }
}

// Create new exhibition (admin only)
exports.createExhibition = async (req, res) => {
  try {
    const {
      title,
      description,
      startDate,
      endDate,
      location,
      coverImage,
      images,
      artists,
      artworks,
      featured,
      openingHours,
      ticketPrice,
      ticketUrl,
      isVirtual,
      capacity
    } = req.body

    // Create new exhibition
    const exhibition = new Exhibition({
      title,
      description,
      startDate,
      endDate,
      location,
      coverImage,
      images,
      artists,
      artworks,
      featured,
      openingHours,
      ticketPrice,
      ticketUrl,
      isVirtual,
      capacity
    })

    await exhibition.save()

    // Add exhibition to artists' exhibitions array
    if (artists && artists.length > 0) {
      await Artist.updateMany({ _id: { $in: artists } }, { $push: { exhibitions: exhibition._id } })
    }

    // Add exhibition to artworks' exhibitions array
    if (artworks && artworks.length > 0) {
      await Artwork.updateMany({ _id: { $in: artworks } }, { $push: { exhibitions: exhibition._id } })
    }

    // Send notifications to interested users
    const interestedUsers = await User.find({
      notificationPreferences: { exhibitions: true }
    })

    // Send emails in batches to avoid overwhelming the email service
    const batchSize = 50
    for (let i = 0; i < interestedUsers.length; i += batchSize) {
      const batch = interestedUsers.slice(i, i + batchSize)
      await Promise.all(
        batch.map(user =>
          mailer.sendExhibitionNotification(user.email, {
            title,
            startDate,
            location,
            isVirtual
          })
        )
      )
    }

    res.status(201).json({
      success: true,
      exhibition,
      notificationsSent: interestedUsers.length
    })
  } catch (error) {
    console.error("Error creating exhibition:", error)
    res.status(500).json({ success: false, error: "Server error" })
  }
}

// Update exhibition (admin only)
exports.updateExhibition = async (req, res) => {
  try {
    const exhibition = await Exhibition.findById(req.params.id)

    if (!exhibition) {
      return res.status(404).json({ success: false, error: "Exhibition not found" })
    }

    // If artists are being changed, update references
    if (req.body.artists) {
      // Get current artists
      const currentArtists = exhibition.artists.map((id) => id.toString())

      // Artists to remove
      const artistsToRemove = currentArtists.filter((id) => !req.body.artists.includes(id))

      // Artists to add
      const artistsToAdd = req.body.artists.filter((id) => !currentArtists.includes(id))

      // Remove exhibition from artists no longer in the exhibition
      if (artistsToRemove.length > 0) {
        await Artist.updateMany({ _id: { $in: artistsToRemove } }, { $pull: { exhibitions: exhibition._id } })
      }

      // Add exhibition to new artists
      if (artistsToAdd.length > 0) {
        await Artist.updateMany({ _id: { $in: artistsToAdd } }, { $push: { exhibitions: exhibition._id } })
      }
    }

    // If artworks are being changed, update references
    if (req.body.artworks) {
      // Get current artworks
      const currentArtworks = exhibition.artworks.map((id) => id.toString())

      // Artworks to remove
      const artworksToRemove = currentArtworks.filter((id) => !req.body.artworks.includes(id))

      // Artworks to add
      const artworksToAdd = req.body.artworks.filter((id) => !currentArtworks.includes(id))

      // Remove exhibition from artworks no longer in the exhibition
      if (artworksToRemove.length > 0) {
        await Artwork.updateMany({ _id: { $in: artworksToRemove } }, { $pull: { exhibitions: exhibition._id } })
      }

      // Add exhibition to new artworks
      if (artworksToAdd.length > 0) {
        await Artwork.updateMany({ _id: { $in: artworksToAdd } }, { $push: { exhibitions: exhibition._id } })
      }
    }

    // Update exhibition
    const updatedExhibition = await Exhibition.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })

    res.status(200).json({ success: true, exhibition: updatedExhibition })
  } catch (error) {
    console.error("Error updating exhibition:", error)
    res.status(500).json({ success: false, error: "Server error" })
  }
}

// Delete exhibition (admin only)
exports.deleteExhibition = async (req, res) => {
  try {
    const exhibition = await Exhibition.findById(req.params.id)

    if (!exhibition) {
      return res.status(404).json({ success: false, error: "Exhibition not found" })
    }

    // Remove exhibition from artists' exhibitions array
    if (exhibition.artists && exhibition.artists.length > 0) {
      await Artist.updateMany({ _id: { $in: exhibition.artists } }, { $pull: { exhibitions: exhibition._id } })
    }

    // Remove exhibition from artworks' exhibitions array
    if (exhibition.artworks && exhibition.artworks.length > 0) {
      await Artwork.updateMany({ _id: { $in: exhibition.artworks } }, { $pull: { exhibitions: exhibition._id } })
    }

    // Delete exhibition
    await exhibition.remove()

    res.status(200).json({ success: true, message: "Exhibition deleted successfully" })
  } catch (error) {
    console.error("Error deleting exhibition:", error)
    res.status(500).json({ success: false, error: "Server error" })
  }
}

// Get current exhibitions
exports.getCurrentExhibitions = async (req, res) => {
  try {
    const exhibitions = await Exhibition.find({ status: "current" }).populate("artists", "name").sort({ startDate: 1 })

    res.status(200).json({ success: true, count: exhibitions.length, exhibitions })
  } catch (error) {
    console.error("Error fetching current exhibitions:", error)
    res.status(500).json({ success: false, error: "Server error" })
  }
}

// Get upcoming exhibitions
exports.getUpcomingExhibitions = async (req, res) => {
  try {
    const exhibitions = await Exhibition.find({
      startDate: { $gte: new Date() }
    })
      .populate('artists', 'name')
      .populate('artworks', 'title images')
      .sort('startDate')

    res.status(200).json({
      success: true,
      exhibitions
    })
  } catch (error) {
    console.error('Error fetching upcoming exhibitions:', error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// Get past exhibitions
exports.getPastExhibitions = async (req, res) => {
  try {
    const page = Number.parseInt(req.query.page) || 1
    const limit = Number.parseInt(req.query.limit) || 10
    const skip = (page - 1) * limit

    const exhibitions = await Exhibition.find({ status: "past" })
      .populate("artists", "name")
      .sort({ endDate: -1 })
      .skip(skip)
      .limit(limit)

    const total = await Exhibition.countDocuments({ status: "past" })

    res.status(200).json({
      success: true,
      count: exhibitions.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      exhibitions,
    })
  } catch (error) {
    console.error("Error fetching past exhibitions:", error)
    res.status(500).json({ success: false, error: "Server error" })
  }
}

// Subscribe to exhibition notifications
exports.subscribeToNotifications = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' })
    }

    user.notificationPreferences = {
      ...user.notificationPreferences,
      exhibitions: true
    }

    await user.save()

    res.status(200).json({
      success: true,
      message: 'Successfully subscribed to exhibition notifications'
    })
  } catch (error) {
    console.error('Error subscribing to notifications:', error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// Unsubscribe from exhibition notifications
exports.unsubscribeFromNotifications = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' })
    }

    user.notificationPreferences = {
      ...user.notificationPreferences,
      exhibitions: false
    }

    await user.save()

    res.status(200).json({
      success: true,
      message: 'Successfully unsubscribed from exhibition notifications'
    })
  } catch (error) {
    console.error('Error unsubscribing from notifications:', error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}
