
const mongoose = require("mongoose");

const vehicleSchema = new mongoose.Schema(
  {
    vehicleNumber: {
      type: String,
      required: [true, "Vehicle number is required"],
      unique: true,
      trim: true,
      uppercase: true,
    },
    make: {
      type: String,
      required: [true, "Vehicle make is required"],
      trim: true,
    },
    model: {
      type: String,
      required: [true, "Vehicle model is required"],
      trim: true,
    },
    year: {
      type: Number,
      required: [true, "Vehicle year is required"],
      min: [1990, "Year must be 1990 or later"],
      max: [
        new Date().getFullYear() + 1,
        "Year cannot be too far in the future",
      ],
    },
    capacityKg: {
      type: Number,
      required: [true, "Vehicle capacity is required"],
      min: [1, "Capacity must be greater than zero"],
    },
    status: {
      type: String,
      enum: ["Available", "In Use", "Maintenance"],
      default: "Available",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Vehicle", vehicleSchema);
