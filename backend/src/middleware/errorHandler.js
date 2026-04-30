// Centralized Error Handler Middleware
import * as Sentry from "@sentry/node";

export const errorHandler = (err, req, res, next) => {
  // Capture exception in Sentry
  Sentry.captureException(err);

  // Log error with request ID for tracing
  const requestId = req.id || 'unknown';
  
  // In production, don't log sensitive error details to console
  if (process.env.NODE_ENV === 'production') {
    console.error(`[Error-${requestId}] ${err.name}: ${err.message}`);
  } else {
    console.error(`[Error-${requestId}] ${err.name}: ${err.message}`);
    if (err.stack) {
      console.error(err.stack);
    }
  }

  // Determine status code based on error type
  let statusCode = 500;
  if (err.statusCode) {
    statusCode = err.statusCode;
  } else if (err.name === 'ValidationError') {
    statusCode = 400;
  } else if (err.name === 'UnauthorizedError' || err.name === 'JsonWebTokenError') {
    statusCode = 401;
  } else if (err.name === 'ForbiddenError') {
    statusCode = 403;
  } else if (err.name === 'NotFoundError') {
    statusCode = 404;
  } else if (err.name === 'ConflictError') {
    statusCode = 409;
  }

  // Create a structured error response
  const response = {
    error: err.name || 'ServerError',
    message: err.message || 'An unexpected error occurred on the server.',
  };

  // Only include stack trace if not in production
  if (process.env.NODE_ENV !== 'production') {
    response.stack = err.stack;
  }

  // Add request ID for tracing in production
  if (process.env.NODE_ENV === 'production') {
    response.requestId = requestId;
  }

  res.status(statusCode).json(response);
};
