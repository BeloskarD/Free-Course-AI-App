// Request ID Middleware for tracing
export const requestIdMiddleware = (req, res, next) => {
  // Generate a unique request ID
  req.id = Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  
  // Add response header for client-side tracing (optional)
  res.setHeader('X-Request-ID', req.id);
  
  next();
};