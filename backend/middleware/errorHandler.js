export function errorHandler(error, req, res, next) {
  console.error("Internal server error:", error.message);

  if (res.headersSent) {
    return next(error);
  }

  return res.status(500).json({
    message: "Internal server error"
  });
}
