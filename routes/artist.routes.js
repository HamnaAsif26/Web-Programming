const express = require("express")
const router = express.Router()
const { 
  getAllArtists,
  getFeaturedArtists,
  searchArtists,
  getArtistById,
  createArtist,
  updateArtist,
  deleteArtist,
  requestVerification,
  reviewVerification,
  getVerificationStatus,
  submitContribution,
  getArtistContributions,
  updateContribution
} = require("../controllers/artist.controller")
const { isAuthenticated, isAdmin } = require("../middleware/auth")

// Public routes
router.get("/", getAllArtists)
router.get("/featured", getFeaturedArtists)
router.get("/search", searchArtists)
router.get("/:id", getArtistById)

// Admin routes
router.post("/", isAuthenticated, isAdmin, createArtist)
router.put("/:id", isAuthenticated, isAdmin, updateArtist)
router.delete("/:id", isAuthenticated, isAdmin, deleteArtist)

// Artist verification routes
router.post("/verify/request/:id", isAuthenticated, requestVerification)
router.put("/verify/review/:artistId", isAdmin, reviewVerification)
router.get("/verify/status/:id", isAuthenticated, getVerificationStatus)

// Artist contribution routes
router.post("/contribution", isAuthenticated, submitContribution)
router.get("/contributions", isAuthenticated, getArtistContributions)
router.put("/contributions/:id", isAuthenticated, updateContribution)

module.exports = router
