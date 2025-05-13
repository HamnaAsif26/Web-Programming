const express = require("express")
const router = express.Router()
const artworkController = require("../controllers/artwork.controller")
const { isAuthenticated, isAdmin } = require("../middleware/auth")
const upload = require("../middleware/upload")

// Public routes
router.get("/", artworkController.getAllArtworks)
router.get("/:id", artworkController.getArtworkById)
router.get("/artist/:artistId", artworkController.getArtworksByArtist)
router.get("/zoom/:id", artworkController.getZoomableArtwork)
router.post("/filter", artworkController.filterArtworks)

// Authenticated routes
router.post("/like", isAuthenticated, artworkController.toggleSaveArtwork)
router.get("/saved/status/:artworkId", isAuthenticated, artworkController.checkSavedStatus)

// Admin routes
router.post("/", isAuthenticated, isAdmin, upload.single("image"), artworkController.createArtwork)
router.put("/:id", isAuthenticated, isAdmin, upload.single("image"), artworkController.updateArtwork)
router.delete("/:id", isAuthenticated, isAdmin, artworkController.deleteArtwork)
router.post("/:id/images", isAuthenticated, isAdmin, upload.array("images", 5), artworkController.addAdditionalImages)
router.post("/:id/zoom", isAuthenticated, isAdmin, upload.array("zoomImages", 5), artworkController.addZoomableImages)
router.get("/stats/admin", isAuthenticated, isAdmin, artworkController.getArtworkStats)

module.exports = router
