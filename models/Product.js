const mongoose = require("mongoose")

const ProductSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Description is required"],
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: 0,
    },
    imageUrl: {
      type: String,
      required: [true, "Image URL is required"],
    },
    additionalImages: [
      {
        type: String,
      },
    ],
    category: {
      type: String,
      enum: ["Prints", "Books", "Accessories", "Apparel", "Home Decor", "Stationery", "Other"],
      required: [true, "Category is required"],
    },
    featured: {
      type: Boolean,
      default: false,
    },
    inStock: {
      type: Boolean,
      default: true,
    },
    stockQuantity: {
      type: Number,
      default: 0,
    },
    relatedArtwork: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Artwork",
    },
    dimensions: {
      type: String,
    },
    weight: {
      type: String,
    },
    material: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
)

module.exports = mongoose.model("Product", ProductSchema)
