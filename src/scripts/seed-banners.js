/**
 * Banner seed script — populates cms_banners with starter banners that
 * admins can edit/duplicate immediately. Idempotent: each banner is
 * upserted on its `internalName` so re-running is safe.
 *
 * Two entry points:
 *   • CLI:  `node src/scripts/seed-banners.js` (or `npm run seed:banners`)
 *           — runs on whatever Mongo the env points at and exits.
 *   • Programmatic:  import { STARTER_BANNERS, seedStarterBanners,
 *           seedStarterBannersIfEmpty } from './seed-banners.js'
 *           — used by db.js (boot-time auto-seed when collection is empty)
 *           and by the admin "Seed starter banners" endpoint.
 */
import 'dotenv/config';
import { connectDb, closeDb, getDb } from '../config/db.js';
import { logger } from '../config/logger.js';

export const STARTER_BANNERS = [
  {
    internalName: 'Home — Not sure what you need?',
    position: 'home-secondary',
    variant: 'expert-match',
    title: {
      en: 'Not sure what\nyou need?',
      hi: 'पता नहीं क्या\nचाहिए?',
      de: 'Nicht sicher, was\nSie brauchen?',
      ar: 'غير متأكد ما\nتحتاج؟',
      es: '¿No sabes qué\nnecesitas?',
    },
    body: {
      en: "Tell us what you're trying to build or fix, and we'll match you with the right expert.",
      hi: 'हमें बताएं कि आप क्या बनाना या ठीक करना चाहते हैं, और हम आपको सही विशेषज्ञ से मिलाएंगे।',
      de: 'Sagen Sie uns, was Sie bauen oder reparieren möchten — wir vermitteln den passenden Experten.',
      ar: 'أخبرنا بما تحاول بناءه أو إصلاحه، وسنقوم بمطابقتك مع الخبير المناسب.',
      es: 'Cuéntanos qué estás tratando de construir o arreglar y te conectaremos con el experto adecuado.',
    },
    ctaLabel: {
      en: 'Find Right Expert',
      hi: 'सही विशेषज्ञ ढूंढें',
      de: 'Experten finden',
      ar: 'ابحث عن خبير',
      es: 'Encontrar experto',
    },
    ctaUrl: '/book-your-resource',
    experts: [
      { name: 'Rohan',   role: 'Vibe Coding Expert', yearsOfExperience: 9, verified: true,
        imageUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&h=400&fit=crop&auto=format&q=70' },
      { name: 'Akansha', role: 'AI Engineer',         yearsOfExperience: 3, verified: true,
        imageUrl: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=400&h=400&fit=crop&auto=format&q=70' },
    ],
    order: 0,
    autoplayMs: 6000,
    active: true,
  },
  {
    internalName: 'Home — Find a developer in 60s',
    position: 'home-mid',
    variant: 'simple',
    title: {
      en: 'Find a verified developer in 60 seconds',
      hi: '60 सेकंड में सत्यापित डेवलपर खोजें',
      de: 'In 60 Sekunden einen verifizierten Entwickler finden',
    },
    body: {
      en: 'Browse 400+ pre-vetted experts across React, Node, AI, Mobile and more.',
      hi: 'React, Node, AI, मोबाइल और अधिक में 400+ पूर्व-सत्यापित विशेषज्ञ ब्राउज़ करें।',
      de: 'Durchsuchen Sie 400+ vorab geprüfte Experten in React, Node, KI, Mobile und mehr.',
    },
    ctaLabel: { en: 'Browse experts', hi: 'विशेषज्ञ देखें', de: 'Experten ansehen' },
    ctaUrl: '/book-your-resource',
    mediaType: 'image',
    mediaUrl: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=900&h=600&fit=crop&auto=format&q=70',
    order: 1,
    active: true,
  },
  {
    // Featured banner — drives the same visual on home, how-it-works,
    // and book-your-resource. Admins edit one record, all three update.
    internalName: 'Featured — Find Right Experts',
    position: 'featured-find-experts',
    variant: 'simple',
    title: {
      en: 'Not sure what\nyou need?',
      hi: 'पता नहीं क्या\nचाहिए?',
      de: 'Nicht sicher, was\nSie brauchen?',
      ar: 'غير متأكد ما\nتحتاج؟',
      es: '¿No sabes qué\nnecesitas?',
    },
    body: {
      en: "Tell us what you're trying to build or fix, and we'll match you with the right expert.",
      hi: 'हमें बताएं कि आप क्या बनाना या ठीक करना चाहते हैं, और हम आपको सही विशेषज्ञ से मिलाएंगे।',
      de: 'Sagen Sie uns, was Sie bauen oder reparieren möchten — wir vermitteln den passenden Experten.',
      ar: 'أخبرنا بما تحاول بناءه أو إصلاحه، وسنقوم بمطابقتك مع الخبير المناسب.',
      es: 'Cuéntanos qué estás tratando de construir o arreglar y te conectaremos con el experto adecuado.',
    },
    ctaLabel: {
      en: 'Find Right Experts',
      hi: 'सही विशेषज्ञ ढूंढें',
      de: 'Experten finden',
      ar: 'ابحث عن خبير',
      es: 'Encontrar experto',
    },
    ctaUrl: '/book-your-resource',
    mediaType: 'image',
    mediaUrl: '/images/resource-services/bookexpert.png',
    order: 0,
    active: true,
  },
  {
    internalName: 'Services — Tell us about your project',
    position: 'services-top',
    variant: 'split',
    title: {
      en: 'Tell us about your project',
      hi: 'अपनी परियोजना के बारे में बताएं',
      de: 'Erzählen Sie uns von Ihrem Projekt',
    },
    body: {
      en: 'Brief us once, get matched in minutes, hire in hours.',
      hi: 'एक बार बताएं, मिनटों में मिलान करें, घंटों में हायर करें।',
      de: 'Ein kurzes Briefing — Match in Minuten — Vertrag in Stunden.',
    },
    ctaLabel: { en: 'Start brief', hi: 'ब्रीफ शुरू करें', de: 'Briefing starten' },
    ctaUrl: '/book-your-resource',
    mediaType: 'image',
    mediaUrl: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=900&h=600&fit=crop&auto=format&q=70',
    order: 0,
    active: true,
  },
];

/**
 * Idempotently upsert STARTER_BANNERS into cms_banners. Always safe to
 * re-run — each banner is keyed on its `internalName` so existing
 * records are refreshed (NOT duplicated).
 *
 * @param {import('mongodb').Db} db
 * @returns {Promise<{ upserted: number, modified: number, total: number }>}
 */
export async function seedStarterBanners(db) {
  const col = db.collection('cms_banners');
  let upserted = 0, modified = 0;
  for (const banner of STARTER_BANNERS) {
    const result = await col.replaceOne(
      { internalName: banner.internalName },
      { ...banner, updatedAt: new Date(), createdAt: new Date() },
      { upsert: true },
    );
    if (result.upsertedCount) upserted++;
    else if (result.modifiedCount) modified++;
  }
  return { upserted, modified, total: STARTER_BANNERS.length };
}

/**
 * Boot-time auto-seed: if cms_banners is empty, drop the starter set in
 * so the admin opens to a populated CMS instead of "no banners yet" the
 * very first time the app comes up. No-op if any banners already exist
 * — including custom banners admins added themselves.
 */
export async function seedStarterBannersIfEmpty(db) {
  try {
    const col = db.collection('cms_banners');
    const existing = await col.countDocuments({});
    if (existing > 0) return { skipped: true, existing };
    const result = await seedStarterBanners(db);
    logger.info({ ...result }, 'cms_banners auto-seeded with starter set');
    return { skipped: false, ...result };
  } catch (err) {
    // Non-fatal — admin can re-run via /cms-x/banners/seed if needed.
    logger.warn({ err: err.message }, 'auto-seed of cms_banners failed (non-fatal)');
    return { skipped: true, error: err.message };
  }
}

// CLI entry point — only runs when this file is invoked directly via
// `node src/scripts/seed-banners.js`, not when imported.
const isMain = import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
  (async () => {
    try {
      await connectDb();
      const result = await seedStarterBanners(getDb());
      logger.info({ ...result }, 'banner seed complete');
      await closeDb();
    } catch (err) {
      logger.fatal({ err }, 'banner seed failed');
      process.exit(1);
    }
  })();
}
