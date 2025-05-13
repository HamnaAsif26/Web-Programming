const express = require("express")
const router = express.Router()
const shopController = require("../controllers/shop.controller")
const { isAuthenticated, isAdmin } = require("../middleware/auth")

// Public routes
router.get("/products", shopController.getAllProducts)
router.get("/products/featured", shopController.getFeaturedProducts)
router.get("/products/search", shopController.searchProducts)
router.get("/products/:id", shopController.getProductById)
router.post("/orders", shopController.createOrder)

// User routes
router.get("/orders", isAuthenticated, shopController.getUserOrders)
router.get("/orders/:id", isAuthenticated, shopController.getOrderById)

// Admin routes
router.post("/products", isAuthenticated, isAdmin, shopController.createProduct)
router.put("/products/:id", isAuthenticated, isAdmin, shopController.updateProduct)
router.delete("/products/:id", isAuthenticated, isAdmin, shopController.deleteProduct)
router.put("/orders/:id/status", isAuthenticated, isAdmin, shopController.updateOrderStatus)

// Wishlist routes
router.post("/wishlist/:artworkId", isAuthenticated, shopController.addToWishlist)
router.delete("/wishlist/:artworkId", isAuthenticated, shopController.removeFromWishlist)
router.get("/wishlist", isAuthenticated, shopController.getWishlist)

// Order tracking routes
router.get("/orders/:orderId/tracking", isAuthenticated, shopController.getOrderTracking)
router.get("/orders/:orderId/updates", isAuthenticated, shopController.getOrderUpdates)

module.exports = router
