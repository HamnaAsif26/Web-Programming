const express = require("express")
const router = express.Router()
const newsletterController = require("../controllers/newsletter.controller")

// Subscribe to newsletter
router.post("/subscribe", newsletterController.subscribe)

// Unsubscribe from newsletter
router.post("/unsubscribe", newsletterController.unsubscribe)

module.exports = router
