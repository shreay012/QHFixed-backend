import { ObjectId } from 'mongodb';
import { getDb } from '../../config/db.js';

const col = () => getDb().collection('bookings');
const histCol = () => getDb().collection('booking_histories');

export const insert = async (doc) => {
  const r = await col().insertOne(doc);
  return { _id: r.insertedId, ...doc };
};

export const findById = (id) => col().findOne({ _id: new ObjectId(id) });

export const updateOne = async (id, set) => {
  const r = await col().findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: { ...set, updatedAt: new Date() } },
    { returnDocument: 'after' },
  );
  return r.value || r;
};

export const find = (filter, { skip = 0, limit = 10, sort = { createdAt: -1 } } = {}) =>
  col().find(filter).sort(sort).skip(skip).limit(limit).toArray();

export const count = (filter) => col().countDocuments(filter);

export const appendHistory = (event) => histCol().insertOne(event);

export const findHistory = (bookingId, serviceId) =>
  histCol().find({
    bookingId: new ObjectId(bookingId),
    ...(serviceId ? { serviceId: new ObjectId(serviceId) } : {}),
  }).sort({ at: 1 }).toArray();
