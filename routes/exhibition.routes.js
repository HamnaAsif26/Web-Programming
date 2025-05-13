const express = require("express")
const router = express.Router()
const exhibitionController = require("../controllers/exhibition.controller")
const { isAuthenticated, isAdmin } = require("../middleware/auth")

// Public routes
router.get("/", exhibitionController.getAllExhibitions)
router.get("/current", exhibitionController.getCurrentExhibitions)
router.get("/upcoming", exhibitionController.getUpcomingExhibitions)
router.get("/past", exhibitionController.getPastExhibitions)
router.get("/:id", exhibitionController.getExhibitionById)

// Admin routes
router.post("/", isAuthenticated, isAdmin, exhibitionController.createExhibition)
router.put("/:id", isAuthenticated, isAdmin, exhibitionController.updateExhibition)
router.delete("/:id", isAuthenticated, isAdmin, exhibitionController.deleteExhibition)

// Notification subscription routes
router.post("/notifications/subscribe", isAuthenticated, exhibitionController.subscribeToNotifications)
router.post("/notifications/unsubscribe", isAuthenticated, exhibitionController.unsubscribeFromNotifications)

module.exports = router
