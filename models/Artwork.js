const mongoose = require("mongoose")

const ArtworkSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Please provide a title"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Please provide a description"],
    },
    artist: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Artist",
      required: [true, "Please provide an artist"],
    },
    year: {
      type: String,
      required: [true, "Please provide a year"],
    },
    period: {
      type: String,
      required: [true, "Please provide a period"],
    },
    medium: {
      type: String,
      required: [true, "Please provide a medium"],
    },
    dimensions: {
      type: String,
    },
    price: {
      type: Number,
      default: 0,
    },
    forSale: {
      type: Boolean,
      default: false,
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
    imageUrl: {
      type: String,
      required: [true, "Please provide an image URL"],
    },
    additionalImages: {
      type: [String],
      default: [],
    },
    zoomableImages: {
      type: [
        {
          original: String, // URL of the original image
          zoom: String, // URL of the high-resolution image
        },
      ],
      default: [],
    },
    exhibitions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Exhibition",
      },
    ],
    views: {
      type: Number,
      default: 0,
    },
    likes: {
      type: Number,
      default: 0,
    },
    featured: {
      type: Boolean,
      default: false,
    },
    style: {
      type: String,
    },
    tags: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true },
)

// Add text index for search
ArtworkSchema.index({ title: "text", description: "text" })

module.exports = mongoose.model("Artwork", ArtworkSchema)
