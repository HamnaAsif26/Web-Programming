const mongoose = require("mongoose")

const ExhibitionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Description is required"],
    },
    startDate: {
      type: Date,
      required: [true, "Start date is required"],
    },
    endDate: {
      type: Date,
      required: [true, "End date is required"],
    },
    imageUrl: {
      type: String,
      required: [true, "Image URL is required"],
    },
    featured: {
      type: Boolean,
      default: false,
    },
    artworks: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Artwork",
      },
    ],
    ticketPrice: {
      regular: {
        type: Number,
        required: true,
      },
      student: {
        type: Number,
        required: true,
      },
      senior: {
        type: Number,
        required: true,
      },
      vip: {
        type: Number,
        required: true,
      },
    },
    location: {
      type: String,
      required: [true, "Location is required"],
    },
    status: {
      type: String,
      enum: ["Upcoming", "Ongoing", "Past"],
      default: "Upcoming",
    },
  },
  {
    timestamps: true,
  },
)

module.exports = mongoose.model("Exhibition", ExhibitionSchema)
