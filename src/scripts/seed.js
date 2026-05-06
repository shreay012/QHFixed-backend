// Seeds an admin user (mobile 9000000000) and sample services.
// Run: node src/scripts/seed.js
import 'dotenv/config';
import { connectDb, getDb, closeDb } from '../config/db.js';
import { logger } from '../config/logger.js';

const SERVICES = [
  {
    slug: 'wedding-photography',
    title: 'Wedding Photography',
    category: 'photography',
    description: 'Full-day candid + traditional wedding coverage by certified PMs.',
    hourlyRate: 1500,
    currency: 'INR',
    minHours: 4,
    maxHours: 12,
    image: 'https://placehold.co/600x400?text=Wedding',
    active: true,
  },
  {
    slug: 'corporate-event-pm',
    title: 'Corporate Event Project Manager',
    category: 'event-management',
    description: 'On-site event PM, vendor coordination, run-of-show.',
    hourlyRate: 2000,
    currency: 'INR',
    minHours: 4,
    maxHours: 24,
    image: 'https://placehold.co/600x400?text=Event+PM',
    active: true,
  },
  {
    slug: 'home-cleaning',
    title: 'Deep Home Cleaning',
    category: 'home-services',
    description: '2BHK / 3BHK deep cleaning with eco-friendly products.',
    hourlyRate: 350,
    currency: 'INR',
    minHours: 2,
    maxHours: 8,
    image: 'https://placehold.co/600x400?text=Cleaning',
    active: true,
  },
];

const run = async () => {
  await connectDb();
  const db = getDb();
  const now = new Date();

  // Admin
  const admin = await db.collection('users').findOneAndUpdate(
    { mobile: '9000000000', role: 'admin' },
    {
      $setOnInsert: {
        mobile: '9000000000',
        role: 'admin',
        name: 'Root Admin',
        email: 'admin@quickhire.local',
        'meta.isProfileComplete': true,
        'meta.status': 'active',
        createdAt: now,
      },
      $set: { updatedAt: now },
    },
    { upsert: true, returnDocument: 'after' },
  );
  logger.info({ adminId: (admin.value || admin)._id }, 'admin ready (mobile 9000000000)');

  // PM
  const pm = await db.collection('users').findOneAndUpdate(
    { mobile: '9000000001', role: 'pm' },
    {
      $setOnInsert: {
        mobile: '9000000001',
        role: 'pm',
        name: 'Sample PM',
        email: 'pm@quickhire.local',
        'meta.isProfileComplete': true,
        'meta.status': 'active',
        createdAt: now,
      },
      $set: { updatedAt: now },
    },
    { upsert: true, returnDocument: 'after' },
  );
  logger.info({ pmId: (pm.value || pm)._id }, 'pm ready (mobile 9000000001)');

  // Resource
  const resource = await db.collection('users').findOneAndUpdate(
    { mobile: '9000000002', role: 'resource' },
    {
      $setOnInsert: {
        mobile: '9000000002',
        role: 'resource',
        name: 'Sample Resource',
        email: 'resource@quickhire.local',
        skills: ['react', 'node'],
        'meta.isProfileComplete': true,
        'meta.status': 'active',
        createdAt: now,
      },
      $set: { updatedAt: now },
    },
    { upsert: true, returnDocument: 'after' },
  );
  logger.info({ resourceId: (resource.value || resource)._id }, 'resource ready (mobile 9000000002)');

  // Services
  for (const s of SERVICES) {
    const r = await db.collection('services').findOneAndUpdate(
      { slug: s.slug },
      { $setOnInsert: { ...s, createdAt: now }, $set: { updatedAt: now } },
      { upsert: true, returnDocument: 'after' },
    );
    logger.info({ id: (r.value || r)._id, slug: s.slug }, 'service ready');
  }

  await closeDb();
  logger.info('seed complete');
  process.exit(0);
};

run().catch((e) => {
  logger.error(e, 'seed failed');
  process.exit(1);
});
