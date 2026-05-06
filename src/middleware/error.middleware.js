import { logger } from '../config/logger.js';

export function notFoundMiddleware(req, res) {
  res.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: `Route ${req.method} ${req.path} not found`, requestId: req.id },
  });
}

export function errorMiddleware(err, req, res, _next) {
  const status = err.status || 500;
  const isOp = err.isOperational === true;

  if (!isOp || status >= 500) {
    logger.error({ err, requestId: req.id, path: req.path, method: req.method }, 'request error');
  } else {
    logger.warn({ err: { code: err.code, message: err.message }, requestId: req.id }, 'client error');
  }

  res.status(status).json({
    success: false,
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message: status >= 500 ? 'Something went wrong' : err.message,
      details: err.details || undefined,
      requestId: req.id,
    },
  });
}
