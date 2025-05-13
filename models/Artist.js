const mongoose = require("mongoose")

const ArtistSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    bio: {
      type: String,
      required: [true, "Bio is required"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address"],
    },
    phone: {
      type: String,
      trim: true,
    },
    website: {
      type: String,
      trim: true,
    },
    socialMedia: {
      instagram: String,
      twitter: String,
      facebook: String,
    },
    artworks: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Artwork",
      },
    ],
    featured: {
      type: Boolean,
      default: false,
    },
    verificationStatus: {
      verified: {
        type: Boolean,
        default: false,
      },
    },
    verificationRequest: {
      submittedAt: Date,
      documents: [String],
      notes: String,
      reviewedAt: Date,
      reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    },
    nationality: {
      type: String,
      trim: true,
    },
    verifiedAt: Date,
    contributions: [
      {
        title: {
          type: String,
          required: true,
        },
        description: String,
        type: {
          type: String,
          enum: ["artwork", "exhibition", "workshop", "other"],
        },
        media: [String],
        submittedAt: {
          type: Date,
          default: Date.now,
        },
        status: {
          type: String,
          enum: ["pending", "approved", "rejected"],
          default: "pending",
        },
        reviewedAt: Date,
        reviewedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        notes: String,
      },
    ],
  },
  {
    timestamps: true,
  },
)

module.exports = mongoose.model("Artist", ArtistSchema)
