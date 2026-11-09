
const express = require("express");
const mongoose = require("mongoose");
const Vehicle = require("../models/Vehicle");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// GET: Current GPS locations for the manager map (admin role).
router.get("/locations", authMiddleware, async (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({
      message: "Only managers can view vehicle locations",
    });
  }

  try {
    const vehicles = await Vehicle.find({
      latitude: { $ne: null },
      longitude: { $ne: null },
      lastSeen: { $ne: null },
    })
      .select("_id latitude longitude lastSeen")
      .sort({ lastSeen: -1 })
      .lean();

    const locations = vehicles.map((vehicle) => ({
      vehicleId: vehicle._id.toString(),
      lat: vehicle.latitude,
      lng: vehicle.longitude,
      updatedAt: vehicle.lastSeen,
    }));

    return res.status(200).json(locations);
  } catch (error) {
    return next(error);
  }
});

// GET: All vehicles
router.get("/", async (req, res, next) => {
  try {
    const vehicles = await Vehicle.find().sort({ createdAt: -1 });
    res.status(200).json(vehicles);
  } catch (error) {
    next(error);
  }
});

// GET: Single vehicle by ID
router.get("/:id", async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid vehicle ID" });
    }

    const vehicle = await Vehicle.findById(req.params.id);

    if (!vehicle) {
      return res.status(404).json({ message: "Vehicle not found" });
    }

    res.status(200).json(vehicle);
  } catch (error) {
    next(error);
  }
});

// POST: Create vehicle
router.post("/", async (req, res, next) => {
  try {
    const vehicle = await Vehicle.create(req.body);
    res.status(201).json(vehicle);
  } catch (error) {
    next(error);
  }
});

// PUT: Update vehicle
router.put("/:id", async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid vehicle ID" });
    }

    const vehicle = await Vehicle.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!vehicle) {
      return res.status(404).json({ message: "Vehicle not found" });
    }

    res.status(200).json(vehicle);
  } catch (error) {
    next(error);
  }
});

// DELETE: Remove vehicle
router.delete("/:id", async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid vehicle ID" });
    }

    const vehicle = await Vehicle.findByIdAndDelete(req.params.id);

    if (!vehicle) {
      return res.status(404).json({ message: "Vehicle not found" });
    }

    res.status(200).json({ message: "Vehicle deleted successfully" });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
