
const express = require("express");

const deliveryRoutes = require("./routes/deliveryRoutes");
const authRoutes = require("./routes/authRoutes");
const vehicleRoutes = require("./routes/vehicleRoutes");
const errorMiddleware = require("./middleware/errorMiddleware");

const app = express();

app.use(express.json());

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/vehicles", vehicleRoutes);
app.use("/api/deliveries", deliveryRoutes);

// Health endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "IronPulse server is running",
  });
});

// Handle unknown routes
app.use((req, res) => {
  res.status(404).json({
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// Error handler must be last
app.use(errorMiddleware);

module.exports = app;
