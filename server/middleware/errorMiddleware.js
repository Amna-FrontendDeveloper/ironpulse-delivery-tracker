
function errorMiddleware(err, req, res, next) {
  console.error(err);

  if (err.name === "ValidationError") {
    return res.status(400).json({
      message: "Validation failed",
      errors: Object.values(err.errors).map((item) => item.message),
    });
  }

  if (err.code === 11000) {
    return res.status(409).json({
      message: "A record with this value already exists",
    });
  }

  if (err.name === "CastError") {
    return res.status(400).json({
      message: "Invalid ID or data format",
    });
  }

  res.status(err.status || 500).json({
    message:
      err.status && err.status < 500
        ? err.message
        : "Internal server error",
  });
}

module.exports = errorMiddleware;
