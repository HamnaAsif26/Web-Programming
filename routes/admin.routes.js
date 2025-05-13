const express = require("express")
const router = express.Router()
const adminController = require("../controllers/admin.controller")
const authController = require("../controllers/auth.controller")

// Protect all routes with authentication and admin check
router.use(authController.verifyToken, authController.isAdmin)

// Dashboard
router.get("/dashboard", adminController.getDashboardStats)

// Users management
router.get("/users", adminController.getAllUsers)
router.get("/users/:id", adminController.getUserById)
router.put("/users/:id", adminController.updateUser)
router.delete("/users/:id", adminController.deleteUser)

// Artworks management
router.get("/artworks", adminController.getAllArtworks)
router.post("/artworks", adminController.createArtwork)
router.get("/artworks/:id", adminController.getArtworkById)
router.put("/artworks/:id", adminController.updateArtwork)
router.delete("/artworks/:id", adminController.deleteArtwork)

// Artists management
router.get("/artists", adminController.getAllArtists)
router.post("/artists", adminController.createArtist)
router.get("/artists/:id", adminController.getArtistById)
router.put("/artists/:id", adminController.updateArtist)
router.delete("/artists/:id", adminController.deleteArtist)

// Exhibitions management
router.get("/exhibitions", adminController.getAllExhibitions)
router.post("/exhibitions", adminController.createExhibition)
router.get("/exhibitions/:id", adminController.getExhibitionById)
router.put("/exhibitions/:id", adminController.updateExhibition)
router.delete("/exhibitions/:id", adminController.deleteExhibition)

// Products management
router.get("/products", adminController.getAllProducts)
router.post("/products", adminController.createProduct)
router.get("/products/:id", adminController.getProductById)
router.put("/products/:id", adminController.updateProduct)
router.delete("/products/:id", adminController.deleteProduct)

// Orders management
router.get("/orders", adminController.getAllOrders)
router.get("/orders/:id", adminController.getOrderById)
router.put("/orders/:id", adminController.updateOrder)

// Blog management
router.get("/blog", adminController.getAllBlogPosts)
router.post("/blog", adminController.createBlogPost)
router.get("/blog/:id", adminController.getBlogPostById)
router.put("/blog/:id", adminController.updateBlogPost)
router.delete("/blog/:id", adminController.deleteBlogPost)

module.exports = router
