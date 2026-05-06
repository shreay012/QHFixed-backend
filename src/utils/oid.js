import { ObjectId } from 'mongodb';
import { AppError } from './AppError.js';

export function toObjectId(id, field = 'id') {
  if (!ObjectId.isValid(id)) {
    throw new AppError('VALIDATION_ERROR', `Invalid ${field}`, 400, { [field]: id });
  }
  return new ObjectId(id);
}
