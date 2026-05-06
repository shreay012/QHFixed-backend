import { AppError } from '../utils/AppError.js';

export const validate = (schema, source = 'body') => (req, _res, next) => {
  const result = schema.safeParse(req[source]);
  if (!result.success) {
    return next(new AppError('VALIDATION_ERROR', 'Validation failed', 422, {
      errors: result.error.flatten(),
    }));
  }
  req[source] = result.data;
  next();
};
