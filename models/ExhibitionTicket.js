const mongoose = require("mongoose")

const ExhibitionTicketSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    exhibition: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Exhibition",
      required: true,
    },
    exhibitionTitle: {
      type: String,
      required: true,
    },
    exhibitionId: {
      type: String,
      required: true,
    },
    ticketNumber: {
      type: String,
      required: true,
      unique: true,
    },
    date: {
      type: Date,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    ticketType: {
      type: String,
      enum: ["Regular", "Student", "Senior", "VIP"],
      default: "Regular",
    },
    total: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["Active", "Used", "Cancelled"],
      default: "Active",
    },
  },
  {
    timestamps: true,
  },
)

module.exports = mongoose.model("ExhibitionTicket", ExhibitionTicketSchema)
