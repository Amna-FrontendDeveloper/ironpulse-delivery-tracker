
require("dotenv").config();
const deliveryRoutes = require("./routes/deliveryRoutes");
const authRoutes = require("./routes/authRoutes");

// const dns = require("dns");
// dns.setServers(["8.8.8.8", "8.8.4.4"]);

const express = require("express");
const mongoose = require("mongoose");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware to read JSON data
app.use(express.json());
app.use("/api/auth", authRoutes);

app.use("/api/deliveries", deliveryRoutes);

// Health endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "IronPulse server is running",
  });
});

// MongoDB connection and server startup
async function startServer() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is missing from the .env file");
    }

    await mongoose.connect(process.env.MONGODB_URI);

    console.log("MongoDB connected successfully");

    app.listen(PORT, () => {
      console.log(
        `IronPulse server running on http://localhost:${PORT}`
      );
    });
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
}

startServer();
