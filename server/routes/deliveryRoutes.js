
const express = require("express");
const router = express.Router();

const Delivery = require("../models/Delivery");
const authMiddleware = require("../middleware/authMiddleware");

function isValidObjectId(id) {
  return /^[a-fA-F0-9]{24}$/.test(id);
}

function allowRoles(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        message: "You do not have permission to perform this action",
      });
    }

    next();
  };
}

// Every delivery route requires authentication.
router.use(authMiddleware);

// GET: Admin sees all deliveries; driver sees assigned deliveries only.
router.get("/", async (req, res) => {
  try {
    const filter =
      req.user.role === "admin"
        ? {}
        : { driverId: req.user.userId };

    const deliveries = await Delivery.find(filter).sort({
      createdAt: -1,
    });

    return res.status(200).json(deliveries);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// POST: Create a delivery (admin only).
router.post("/", allowRoles("admin"), async (req, res) => {
  try {
    const {
      trackingNumber,
      customerName,
      deliveryAddress,
      status,
      driverName,
      driverId,
      estimatedDelivery,
    } = req.body;

    // If assigning a driver, ensure the ID is valid.
    if (driverId && !isValidObjectId(driverId)) {
      return res.status(400).json({
        message: "Invalid driver ID",
      });
    }

    const delivery = await Delivery.create({
      trackingNumber,
      customerName,
      deliveryAddress,
      status,
      driverName,
      driverId: driverId || null,
      estimatedDelivery,
    });

    return res.status(201).json(delivery);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

// GET: Fetch one delivery.
// Drivers can access only their assigned deliveries.
router.get("/:id", async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid delivery ID",
      });
    }

    const filter =
      req.user.role === "admin"
        ? { _id: req.params.id }
        : { _id: req.params.id, driverId: req.user.userId };

    const delivery = await Delivery.findOne(filter);

    if (!delivery) {
      return res.status(404).json({
        message: "Delivery not found",
      });
    }

    return res.status(200).json(delivery);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// PUT: Admin can update delivery details.
// Driver can update only the status of their assigned delivery.
router.put("/:id", async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid delivery ID",
      });
    }

    if (req.user.role === "admin") {
      const {
        _id,
        __v,
        createdAt,
        updatedAt,
        ...updates
      } = req.body;

      if (
        updates.driverId &&
        !isValidObjectId(updates.driverId)
      ) {
        return res.status(400).json({
          message: "Invalid driver ID",
        });
      }

      const delivery = await Delivery.findByIdAndUpdate(
        req.params.id,
        updates,
        { new: true, runValidators: true }
      );

      if (!delivery) {
        return res.status(404).json({
          message: "Delivery not found",
        });
      }

      return res.status(200).json(delivery);
    }

    if (req.user.role !== "driver") {
      return res.status(403).json({
        message: "You do not have permission to update deliveries",
      });
    }

    // Drivers may change only the delivery status.
    const allowedStatuses = [
      "Picked Up",
      "In Transit",
      "Delivered",
    ];

    const keys = Object.keys(req.body || {});

    if (
      keys.length !== 1 ||
      keys[0] !== "status" ||
      !allowedStatuses.includes(req.body.status)
    ) {
      return res.status(400).json({
        message: "Drivers may update only to an allowed delivery status",
      });
    }

    const delivery = await Delivery.findOneAndUpdate(
      {
        _id: req.params.id,
        driverId: req.user.userId,
      },
      { $set: { status: req.body.status } },
      { new: true, runValidators: true }
    );

    if (!delivery) {
      return res.status(404).json({
        message: "Assigned delivery not found",
      });
    }

    return res.status(200).json(delivery);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

// DELETE: Admin only.
router.delete("/:id", allowRoles("admin"), async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid delivery ID",
      });
    }

    const delivery = await Delivery.findByIdAndDelete(req.params.id);

    if (!delivery) {
      return res.status(404).json({
        message: "Delivery not found",
      });
    }

    return res.status(200).json({
      message: "Delivery deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

module.exports = router;
