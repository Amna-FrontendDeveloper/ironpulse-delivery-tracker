
const express = require("express");

const app = express();
const PORT = 5000;

// Health endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "IronPulse server is running",
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`IronPulse server running on http://localhost:${PORT}`);
});
