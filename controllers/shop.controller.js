const Product = require("../models/Product")
const Order = require("../models/Order")
const User = require("../models/User")
const mailer = require("../utils/mailer")

// Get all products with pagination
const getAllProducts = async (req, res) => {
  try {
    const page = Number.parseInt(req.query.page) || 1
    const limit = Number.parseInt(req.query.limit) || 12
    const skip = (page - 1) * limit

    // Filter options
    const filter = {}

    if (req.query.category) {
      filter.category = req.query.category
    }

    if (req.query.featured) {
      filter.featured = req.query.featured === "true"
    }

    if (req.query.artist) {
      filter.relatedArtist = req.query.artist
    }

    if (req.query.minPrice || req.query.maxPrice) {
      filter.price = {}
      if (req.query.minPrice) filter.price.$gte = Number.parseInt(req.query.minPrice)
      if (req.query.maxPrice) filter.price.$lte = Number.parseInt(req.query.maxPrice)
    }

    // Sort options
    const sort = req.query.sort ? 
      { [req.query.sort.startsWith("-") ? req.query.sort.substring(1) : req.query.sort]: req.query.sort.startsWith("-") ? -1 : 1 } 
      : { createdAt: -1 }

    const products = await Product.find(filter)
      .populate("relatedArtist", "name")
      .populate("relatedArtwork", "title")
      .sort(sort)
      .skip(skip)
      .limit(limit)

    const total = await Product.countDocuments(filter)

    res.status(200).json({
      success: true,
      count: products.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      products,
    })
  } catch (error) {
    console.error("Error fetching products:", error)
    res.status(500).json({ success: false, error: "Server error" })
  }
}

// Get single product by ID
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate("relatedArtist", "name")
      .populate("relatedArtwork", "title images")

    if (!product) {
      return res.status(404).json({ success: false, error: "Product not found" })
    }

    // Get related products (same category or same artist)
    const relatedProducts = await Product.find({
      _id: { $ne: product._id },
      $or: [{ category: product.category }, { relatedArtist: product.relatedArtist }],
    })
      .limit(4)
      .select("name price images category")

    res.status(200).json({
      success: true,
      product,
      relatedProducts,
    })
  } catch (error) {
    console.error("Error fetching product:", error)
    res.status(500).json({ success: false, error: "Server error" })
  }
}

// Create new product (admin only)
const createProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      discountPrice,
      images,
      category,
      relatedArtwork,
      relatedArtist,
      stock,
      featured,
      dimensions,
      weight,
    } = req.body

    // Create new product
    const product = new Product({
      name,
      description,
      price,
      discountPrice,
      images,
      category,
      relatedArtwork,
      relatedArtist,
      stock,
      featured,
      dimensions,
      weight,
    })

    await product.save()

    res.status(201).json({ success: true, product })
  } catch (error) {
    console.error("Error creating product:", error)
    res.status(500).json({ success: false, error: "Server error" })
  }
}

// Update product (admin only)
const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)

    if (!product) {
      return res.status(404).json({ success: false, error: "Product not found" })
    }

    // Update product
    const updatedProduct = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })

    res.status(200).json({ success: true, product: updatedProduct })
  } catch (error) {
    console.error("Error updating product:", error)
    res.status(500).json({ success: false, error: "Server error" })
  }
}

// Delete product (admin only)
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)

    if (!product) {
      return res.status(404).json({ success: false, error: "Product not found" })
    }

    // Delete product
    await product.remove()

    res.status(200).json({ success: true, message: "Product deleted successfully" })
  } catch (error) {
    console.error("Error deleting product:", error)
    res.status(500).json({ success: false, error: "Server error" })
  }
}

// Get featured products
const getFeaturedProducts = async (req, res) => {
  try {
    const products = await Product.find({ featured: true }).populate("relatedArtist", "name").limit(8)

    res.status(200).json({ success: true, products })
  } catch (error) {
    console.error("Error fetching featured products:", error)
    res.status(500).json({ success: false, error: "Server error" })
  }
}

// Create order
const createOrder = async (req, res) => {
  try {
    const {
      items,
      shippingAddress,
      billingAddress,
      paymentMethod,
      paymentDetails,
      subtotal,
      tax,
      shipping,
      total,
      notes,
    } = req.body

    // Check if user is logged in
    let userId = null
    if (req.user) {
      userId = req.user._id
    }

    // Validate items in stock
    for (const item of items) {
      const product = await Product.findById(item.product)

      if (!product) {
        return res.status(404).json({
          success: false,
          error: `Product not found: ${item.product}`,
        })
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          error: `Not enough stock for ${product.name}. Available: ${product.stock}`,
        })
      }
    }

    // Create new order
    const order = new Order({
      user: userId,
      items,
      shippingAddress,
      billingAddress,
      paymentMethod,
      paymentDetails,
      subtotal,
      tax,
      shipping,
      total,
      notes,
    })

    await order.save()

    // Update product stock
    for (const item of items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: -item.quantity },
      })
    }

    // If user is logged in, add order to user's orders
    if (userId) {
      await User.findByIdAndUpdate(userId, {
        $push: { orders: order._id },
      })
    }

    // Send order confirmation email
    if (shippingAddress.email) {
      try {
        await mailer.sendOrderConfirmation(shippingAddress.email, shippingAddress.firstName, order._id, items, total)
      } catch (emailError) {
        console.error("Error sending order confirmation email:", emailError)
      }
    }

    res.status(201).json({
      success: true,
      order,
      message: "Order placed successfully",
    })
  } catch (error) {
    console.error("Error creating order:", error)
    res.status(500).json({ success: false, error: "Server error" })
  }
}

// Get order by ID (user or admin)
const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate({
        path: "items.product",
        select: "name images price",
      })
      .populate({
        path: "items.artwork",
        select: "title images price",
      })

    if (!order) {
      return res.status(404).json({ success: false, error: "Order not found" })
    }

    // Check if user is authorized to view this order
    if (req.user && !req.user.isAdmin && order.user && order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, error: "Not authorized to view this order" })
    }

    res.status(200).json({ success: true, order })
  } catch (error) {
    console.error("Error fetching order:", error)
    res.status(500).json({ success: false, error: "Server error" })
  }
}

// Update order status (admin only)
const updateOrderStatus = async (req, res) => {
  try {
    const { status, trackingNumber } = req.body

    const order = await Order.findById(req.params.id)

    if (!order) {
      return res.status(404).json({ success: false, error: "Order not found" })
    }

    // Update order
    order.status = status
    if (trackingNumber) {
      order.trackingNumber = trackingNumber
    }

    await order.save()

    // Send order status update email
    if (order.shippingAddress.email) {
      try {
        await mailer.sendOrderStatusUpdate(
          order.shippingAddress.email,
          order.shippingAddress.firstName,
          order._id,
          status,
          trackingNumber,
        )
      } catch (emailError) {
        console.error("Error sending order status update email:", emailError)
      }
    }

    res.status(200).json({
      success: true,
      order,
      message: "Order status updated successfully",
    })
  } catch (error) {
    console.error("Error updating order status:", error)
    res.status(500).json({ success: false, error: "Server error" })
  }
}

// Get user orders (for logged in user)
const getUserOrders = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: "Not authenticated" })
    }

    const orders = await Order.find({ user: req.user._id })
      .select("createdAt total status trackingNumber items")
      .sort({ createdAt: -1 })

    res.status(200).json({ success: true, count: orders.length, orders })
  } catch (error) {
    console.error("Error fetching user orders:", error)
    res.status(500).json({ success: false, error: "Server error" })
  }
}

// Search products
const searchProducts = async (req, res) => {
  try {
    const searchTerm = req.query.q

    if (!searchTerm) {
      return res.status(400).json({ success: false, error: "Search term is required" })
    }

    const products = await Product.find({
      $or: [
        { name: { $regex: searchTerm, $options: "i" } },
        { description: { $regex: searchTerm, $options: "i" } },
        { category: { $regex: searchTerm, $options: "i" } },
      ],
    }).populate("relatedArtist", "name")

    res.status(200).json({ success: true, count: products.length, products })
  } catch (error) {
    console.error("Error searching products:", error)
    res.status(500).json({ success: false, error: "Server error" })
  }
}

// Wishlist functions
const addToWishlist = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
    const artworkId = req.params.artworkId

    if (!user.wishlist.includes(artworkId)) {
      user.wishlist.push(artworkId)
      await user.save()
    }

    res.status(200).json({ message: "Added to wishlist successfully" })
  } catch (error) {
    res.status(500).json({ message: "Error adding to wishlist", error: error.message })
  }
}

const removeFromWishlist = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
    const artworkId = req.params.artworkId

    user.wishlist = user.wishlist.filter(id => id.toString() !== artworkId)
    await user.save()

    res.status(200).json({ message: "Removed from wishlist successfully" })
  } catch (error) {
    res.status(500).json({ message: "Error removing from wishlist", error: error.message })
  }
}

const getWishlist = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate("wishlist")
    res.status(200).json(user.wishlist)
  } catch (error) {
    res.status(500).json({ message: "Error fetching wishlist", error: error.message })
  }
}

// Order tracking functions
const getOrderTracking = async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId)
    if (!order) {
      return res.status(404).json({ message: "Order not found" })
    }

    // Check if user is authorized to view this order
    if (order.user.toString() !== req.user.id && !req.user.isAdmin) {
      return res.status(403).json({ message: "Not authorized to view this order" })
    }

    res.status(200).json(order.trackingInfo)
  } catch (error) {
    res.status(500).json({ message: "Error fetching order tracking", error: error.message })
  }
}

const getOrderUpdates = async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId)
    if (!order) {
      return res.status(404).json({ message: "Order not found" })
    }

    // Check if user is authorized to view this order
    if (order.user.toString() !== req.user.id && !req.user.isAdmin) {
      return res.status(403).json({ message: "Not authorized to view this order" })
    }

    res.status(200).json(order.trackingInfo.updates)
  } catch (error) {
    res.status(500).json({ message: "Error fetching order updates", error: error.message })
  }
}

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getFeaturedProducts,
  createOrder,
  getOrderById,
  updateOrderStatus,
  getUserOrders,
  searchProducts,
  addToWishlist,
  removeFromWishlist,
  getWishlist,
  getOrderTracking,
  getOrderUpdates
}
