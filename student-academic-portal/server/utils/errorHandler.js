/**
 * Small helpers for consistent error responses across controllers.
 */

class PortalError extends Error {
  /**
   * @param {string} message
   * @param {number} statusCode
   * @param {string} [code] machine-readable error code for the frontend
   */
  constructor(message, statusCode = 502, code = "PORTAL_ERROR") {
    super(message);
    this.name = "PortalError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

/**
 * Express error-handling middleware. Register with app.use(errorMiddleware)
 * AFTER all routes.
 */
function errorMiddleware(err, req, res, _next) {
  // eslint-disable-next-line no-console
  console.error("[error]", err.message);

  const statusCode = err.statusCode || 500;
  const code = err.code || "INTERNAL_ERROR";

  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message: err.message || "Something went wrong.",
    },
  });
}

/**
 * Wraps an async Express handler so thrown errors are forwarded to next().
 * @param {Function} fn
 */
function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

module.exports = { PortalError, errorMiddleware, asyncHandler };
