import { nanoid } from 'nanoid';

export function requestIdMiddleware(req, _res, next) {
  req.id = req.header('x-request-id') || `req_${nanoid(12)}`;
  next();
}
