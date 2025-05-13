const mongoose = require("mongoose")

const OrderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    orderNumber: {
      type: String,
      required: true,
      unique: true,
    },
    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
        price: {
          type: Number,
          required: true,
        },
      },
    ],
    total: {
      type: Number,
      required: true,
    },
    shippingAddress: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"],
      default: "Pending",
    },
    paymentMethod: {
      type: String,
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ["Pending", "Completed", "Failed", "Refunded"],
      default: "Pending",
    },
    trackingNumber: {
      type: String,
    },
    notes: {
      type: String,
    },
    trackingInfo: {
      status: {
        type: String,
        enum: ["processing", "shipped", "delivered", "cancelled"],
        default: "processing",
      },
      trackingNumber: String,
      carrier: String,
      estimatedDelivery: Date,
      updates: [
        {
          status: String,
          location: String,
          timestamp: {
            type: Date,
            default: Date.now,
          },
          description: String,
        },
      ],
    },
  },
  {
    timestamps: true,
  },
)

module.exports = mongoose.model("Order", OrderSchema)
