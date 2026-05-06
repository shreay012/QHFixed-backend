// Seed services with embedded multi-country pricing for IN · AE · DE · AU · US.
//
// Run:  node src/scripts/seed-multi-country-services.js
//
// Produces 4 services (deep-cleaning, ai-engineers, ux-design, devops) each
// with country-specific pricing, currency, tax, and surge rules. Documents
// are upserted by slug so it's safe to re-run.

import 'dotenv/config';
import { connectDb, getDb, closeDb } from '../config/db.js';
import { logger } from '../config/logger.js';

const now = new Date();

const SERVICES = [
  /* ============================================================
   * Deep Cleaning — home services
   * ============================================================ */
  {
    slug: 'deep-cleaning',
    category: 'home-cleaning',
    name: {
      en: 'Deep Cleaning',
      hi: 'डीप क्लीनिंग',
      ar: 'تنظيف عميق',
      de: 'Grundreinigung',
    },
    description: {
      en: 'Thorough top-to-bottom home cleaning including kitchen, bathrooms, and floors.',
      hi: 'रसोई, बाथरूम और फर्श सहित घर की पूरी गहरी सफाई।',
      ar: 'تنظيف شامل للمنزل من الأعلى إلى الأسفل بما في ذلك المطبخ والحمامات والأرضيات.',
      de: 'Gründliche Reinigung der gesamten Wohnung inklusive Küche, Bäder und Böden.',
    },
    technologies: [
      { name: 'HEPA Vacuum',       icon: 'vacuum', required: true },
      { name: 'Steam Cleaner',     icon: 'steam',  required: false },
      { name: 'Eco Detergents',    icon: 'eco',    required: true },
      { name: 'Microfiber Cloths', icon: 'cloth',  required: true },
    ],
    pricing: [
      {
        country: 'IN', currency: 'INR',
        basePrice: 1499, unit: 'per_hour',
        minDuration: 120, minCharge: 2499,
        tax: {
          type: 'GST', rate: 18, inclusive: false,
          split: [{ name: 'CGST', rate: 9 }, { name: 'SGST', rate: 9 }],
          registrationNumber: '06AABCU9603R1ZN',
        },
        surgeRules: [
          { name: 'Weekend',  multiplier: 1.2, daysOfWeek: [0, 6], startHour: 0, endHour: 23, active: true },
          { name: 'Festival', multiplier: 1.5, daysOfWeek: [0, 1, 2, 3, 4, 5, 6], startHour: 0, endHour: 23, active: false },
        ],
        cities: ['DEL', 'BLR', 'MUM', 'GGN', 'HYD'],
        active: true,
      },
      {
        country: 'AE', currency: 'AED',
        basePrice: 75, unit: 'per_hour',
        minDuration: 120, minCharge: 150,
        tax: { type: 'VAT', rate: 5, inclusive: true, registrationNumber: '100123456700003' },
        surgeRules: [
          { name: 'Weekend (Fri/Sat)', multiplier: 1.15, daysOfWeek: [5, 6], startHour: 0, endHour: 23, active: true },
        ],
        cities: ['DXB', 'AUH', 'SHJ'],
        active: true,
      },
      {
        country: 'DE', currency: 'EUR',
        basePrice: 35, unit: 'per_hour',
        minDuration: 120, minCharge: 70,
        tax: { type: 'VAT', rate: 19, inclusive: true, registrationNumber: 'DE123456789' },
        surgeRules: [
          { name: 'Sunday/Holiday', multiplier: 1.5, daysOfWeek: [0], startHour: 0, endHour: 23, active: true },
        ],
        cities: ['BER', 'MUC', 'HAM', 'FRA'],
        active: true,
      },
      {
        country: 'AU', currency: 'AUD',
        basePrice: 55, unit: 'per_hour',
        minDuration: 120, minCharge: 110,
        tax: { type: 'GST_AU', rate: 10, inclusive: true, registrationNumber: '12345678901' },
        surgeRules: [
          { name: 'Weekend',        multiplier: 1.25, daysOfWeek: [0, 6], startHour: 0, endHour: 23, active: true },
          { name: 'Public Holiday', multiplier: 1.75, daysOfWeek: [0, 1, 2, 3, 4, 5, 6], startHour: 0, endHour: 23, active: false },
        ],
        cities: ['SYD', 'MEL', 'BNE', 'PER'],
        active: true,
      },
      {
        country: 'US', currency: 'USD',
        basePrice: 40, unit: 'per_hour',
        minDuration: 120, minCharge: 80,
        tax: { type: 'SALES_TAX', provider: 'taxjar', inclusive: false, registrationNumber: '12-3456789' },
        surgeRules: [
          { name: 'Weekend', multiplier: 1.2, daysOfWeek: [0, 6], startHour: 0, endHour: 23, active: true },
        ],
        cities: [],
        active: true,
      },
    ],
    images: ['https://cdn.quickhire.app/services/deep-cleaning/cover.jpg'],
    active: true,
  },

  /* ============================================================
   * AI Engineers — tech talent
   * ============================================================ */
  {
    slug: 'ai-engineers',
    category: 'tech-talent',
    name: {
      en: 'AI Engineers',
      hi: 'AI इंजीनियर्स',
      ar: 'مهندسو الذكاء الاصطناعي',
      de: 'KI-Ingenieure',
    },
    description: {
      en: 'Senior AI/ML engineers for LLM integration, RAG systems, computer vision, and MLOps.',
      hi: 'LLM एकीकरण, RAG सिस्टम, कंप्यूटर विज़न और MLOps के लिए वरिष्ठ AI/ML इंजीनियर।',
      ar: 'كبار مهندسي الذكاء الاصطناعي والتعلم الآلي لتكامل LLM وأنظمة RAG ورؤية الكمبيوتر و MLOps.',
      de: 'Senior KI/ML-Ingenieure für LLM-Integration, RAG-Systeme, Computer Vision und MLOps.',
    },
    technologies: [
      { name: 'Python',       required: true },
      { name: 'PyTorch',      required: false },
      { name: 'LangChain',    required: false },
      { name: 'Vector DB',    required: false },
    ],
    pricing: [
      {
        country: 'IN', currency: 'INR',
        basePrice: 2500, unit: 'per_hour',
        minDuration: 240, minCharge: 10000,
        tax: {
          type: 'GST', rate: 18, inclusive: false,
          split: [{ name: 'CGST', rate: 9 }, { name: 'SGST', rate: 9 }],
        },
        surgeRules: [], cities: ['BLR', 'HYD', 'PNQ', 'GGN'], active: true,
      },
      {
        country: 'AE', currency: 'AED',
        basePrice: 220, unit: 'per_hour',
        minDuration: 240, minCharge: 880,
        tax: { type: 'VAT', rate: 5, inclusive: true },
        surgeRules: [], cities: ['DXB', 'AUH'], active: true,
      },
      {
        country: 'DE', currency: 'EUR',
        basePrice: 95, unit: 'per_hour',
        minDuration: 240, minCharge: 380,
        tax: { type: 'VAT', rate: 19, inclusive: true },
        surgeRules: [], cities: ['BER', 'MUC', 'FRA'], active: true,
      },
      {
        country: 'AU', currency: 'AUD',
        basePrice: 160, unit: 'per_hour',
        minDuration: 240, minCharge: 640,
        tax: { type: 'GST_AU', rate: 10, inclusive: true },
        surgeRules: [], cities: ['SYD', 'MEL'], active: true,
      },
      {
        country: 'US', currency: 'USD',
        basePrice: 110, unit: 'per_hour',
        minDuration: 240, minCharge: 440,
        tax: { type: 'SALES_TAX', provider: 'taxjar', inclusive: false },
        surgeRules: [], cities: [], active: true,
      },
    ],
    active: true,
  },

  /* ============================================================
   * UI/UX Designer — design
   * ============================================================ */
  {
    slug: 'ui-ux-designer',
    category: 'design',
    name: {
      en: 'UI/UX Designer',
      hi: 'UI/UX डिज़ाइनर',
      ar: 'مصمم UI/UX',
      de: 'UI/UX-Designer',
    },
    description: {
      en: 'Senior product designers for wireframes, prototypes, design systems, and conversion-focused UX.',
      hi: 'वायरफ़्रेम, प्रोटोटाइप, डिज़ाइन सिस्टम और कन्वर्ज़न-केंद्रित UX के लिए वरिष्ठ प्रोडक्ट डिज़ाइनर।',
      ar: 'كبار مصممي المنتجات لإطارات أولية ونماذج وأنظمة تصميم وتجارب مستخدم تركز على التحويل.',
      de: 'Senior Produktdesigner für Wireframes, Prototypen, Designsysteme und konversionsorientierte UX.',
    },
    technologies: [
      { name: 'Figma', required: true },
      { name: 'Design Systems', required: false },
      { name: 'Prototyping', required: true },
    ],
    pricing: [
      {
        country: 'IN', currency: 'INR',
        basePrice: 1800, unit: 'per_hour',
        minDuration: 240, minCharge: 7200,
        tax: { type: 'GST', rate: 18, inclusive: false, split: [{ name: 'CGST', rate: 9 }, { name: 'SGST', rate: 9 }] },
        surgeRules: [], cities: [], active: true,
      },
      {
        country: 'AE', currency: 'AED',
        basePrice: 180, unit: 'per_hour',
        minDuration: 240, minCharge: 720,
        tax: { type: 'VAT', rate: 5, inclusive: true },
        surgeRules: [], cities: ['DXB'], active: true,
      },
      {
        country: 'DE', currency: 'EUR',
        basePrice: 80, unit: 'per_hour',
        minDuration: 240, minCharge: 320,
        tax: { type: 'VAT', rate: 19, inclusive: true },
        surgeRules: [], cities: [], active: true,
      },
      {
        country: 'AU', currency: 'AUD',
        basePrice: 140, unit: 'per_hour',
        minDuration: 240, minCharge: 560,
        tax: { type: 'GST_AU', rate: 10, inclusive: true },
        surgeRules: [], cities: [], active: true,
      },
      {
        country: 'US', currency: 'USD',
        basePrice: 95, unit: 'per_hour',
        minDuration: 240, minCharge: 380,
        tax: { type: 'SALES_TAX', provider: 'taxjar', inclusive: false },
        surgeRules: [], cities: [], active: true,
      },
    ],
    active: true,
  },

  /* ============================================================
   * DevOps — infra
   * ============================================================ */
  {
    slug: 'devops-engineers',
    category: 'tech-talent',
    name: {
      en: 'DevOps Engineers',
      hi: 'DevOps इंजीनियर्स',
      ar: 'مهندسو DevOps',
      de: 'DevOps-Ingenieure',
    },
    description: {
      en: 'Cloud + CI/CD + observability — Kubernetes, Terraform, AWS/GCP, GitHub Actions, monitoring.',
      hi: 'क्लाउड + CI/CD + निगरानी — Kubernetes, Terraform, AWS/GCP, GitHub Actions, मॉनिटरिंग।',
      ar: 'سحابة + CI/CD + مراقبة — Kubernetes و Terraform و AWS/GCP و GitHub Actions والمراقبة.',
      de: 'Cloud + CI/CD + Observability — Kubernetes, Terraform, AWS/GCP, GitHub Actions, Monitoring.',
    },
    technologies: [
      { name: 'Kubernetes', required: true },
      { name: 'Terraform',  required: true },
      { name: 'AWS',        required: false },
      { name: 'GCP',        required: false },
    ],
    pricing: [
      {
        country: 'IN', currency: 'INR',
        basePrice: 2200, unit: 'per_hour',
        minDuration: 240, minCharge: 8800,
        tax: { type: 'GST', rate: 18, inclusive: false, split: [{ name: 'CGST', rate: 9 }, { name: 'SGST', rate: 9 }] },
        surgeRules: [], cities: [], active: true,
      },
      {
        country: 'AE', currency: 'AED',
        basePrice: 200, unit: 'per_hour',
        minDuration: 240, minCharge: 800,
        tax: { type: 'VAT', rate: 5, inclusive: true },
        surgeRules: [], cities: [], active: true,
      },
      {
        country: 'DE', currency: 'EUR',
        basePrice: 90, unit: 'per_hour',
        minDuration: 240, minCharge: 360,
        tax: { type: 'VAT', rate: 19, inclusive: true },
        surgeRules: [], cities: [], active: true,
      },
      {
        country: 'AU', currency: 'AUD',
        basePrice: 150, unit: 'per_hour',
        minDuration: 240, minCharge: 600,
        tax: { type: 'GST_AU', rate: 10, inclusive: true },
        surgeRules: [], cities: [], active: true,
      },
      {
        country: 'US', currency: 'USD',
        basePrice: 105, unit: 'per_hour',
        minDuration: 240, minCharge: 420,
        tax: { type: 'SALES_TAX', provider: 'taxjar', inclusive: false },
        surgeRules: [], cities: [], active: true,
      },
    ],
    active: true,
  },
];

async function run() {
  await connectDb();
  const db = getDb();
  for (const svc of SERVICES) {
    await db.collection('services').findOneAndUpdate(
      { slug: svc.slug },
      {
        $set: { ...svc, updatedAt: now },
        $setOnInsert: { createdAt: now },
      },
      { upsert: true, returnDocument: 'after' },
    );
    logger.info({ slug: svc.slug, countries: svc.pricing.map((p) => p.country) }, 'multi-country service ready');
  }

  // Helpful indexes for the new shape. Best-effort — skip on conflict
  // (existing indexes may have differing options like `sparse`).
  for (const spec of [
    [{ 'pricing.country': 1, active: 1 }, {}],
    [{ category: 1, active: 1 }, {}],
  ]) {
    try { await db.collection('services').createIndex(spec[0], spec[1]); }
    catch (e) { logger.warn({ err: e.message, spec: spec[0] }, 'index skipped'); }
  }

  await closeDb();
  logger.info({ count: SERVICES.length }, 'multi-country seed complete');
  process.exit(0);
}

run().catch((e) => {
  logger.error(e, 'multi-country seed failed');
  process.exit(1);
});
