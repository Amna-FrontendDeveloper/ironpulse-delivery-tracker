
const mongoose = require("mongoose");

const deliverySchema = new mongoose.Schema(
  {
    trackingNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    customerName: {
      type: String,
      required: true,
      trim: true,
    },

    deliveryAddress: {
      type: String,
      required: true,
      trim: true,
    },

    status: {
      type: String,
      enum: [
        "Pending",
        "Picked Up",
        "In Transit",
        "Delivered",
        "Cancelled",
      ],
      default: "Pending",
    },

    driverName: {
      type: String,
      default: "",
      trim: true,
    },

    // Registered driver assigned to this delivery
    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    estimatedDelivery: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Delivery", deliverySchema);
