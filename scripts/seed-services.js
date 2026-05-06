// Seed all services from the QuickHire catalog + 5 resources per service.
// Run from backend folder: node scripts/seed-services.js
import { MongoClient, ObjectId } from 'mongodb';
import 'dotenv/config';

const URI = process.env.MONGO_URI || 'mongodb://localhost:27017';
const DB = process.env.MONGO_DB || 'quickhire';

// Per the source catalog, each KEY is a top-level service offering and the
// VALUES are the technologies / skills offered under that service.
const CATALOG = {
  'AI Engineers': [
    'Gen AI Solutions', 'Prompt Engineering', 'Predictive Analytics', 'Computer Vision',
    'NLP', 'AI Chatbots', 'ML Engineer', 'Vector Database Developer',
    'Vision Engineer', 'RAG Systems',
  ],
  'Backend Developers': [
    'Rest API Development', 'GraphQL API Development', 'Database Management',
    'Microservices Architecture', 'Server Integration', 'Cloud Functions (Serverless)',
    'Authentication Setup', 'Cloud Deployment', 'Data Processing',
    'Performance Optimization',
  ],
  'Frontend Development': [
    'React.js Development', 'Nxt.js Development', 'Vue.js Development',
    'Angular Development', 'PWA (Progressive Web Apps)', 'Web Performance Optimization',
    'Single Page Applications (SPA)', 'Wordpress Developer', 'Magento Developer',
    'Accessibility Compliance', 'Component Library',
  ],
  'UI/UX Designer': [
    'Brand Book', 'Company Deck', 'Mobile App', 'Website Design',
    'Landing Page', 'Graphic Designer', 'UI/UX Designer',
    'Prototype Design', 'Wireframe Designer',
  ],
  'IT Support': [
    'Server Administration', '24/7 Help Desk (L1/L2/L3)', 'Remote Monitoring (RMM)',
    'Network Administration', 'Cloud Migration & Support', 'Backup Expert',
    'VPN & Firewall Setup', 'Disaster Recovery Expert', 'Hosting Engineer',
    'ORM Expert',
  ],
  'DevOps': [
    'CI/CD Pipeline Management', 'Infrastructure as Code (IaC)', 'Containerization (Docker)',
    'Orchestration (Kubernetes)', 'Network Administration', 'Log Management',
    'Performance Monitoring', 'Monitoring Specialist',
  ],
  'Content Writing': [
    'SEO Blog Writing', 'Technical Documentation', 'API Documentation', 'Whitepapers',
    'Ad & Sales Copywriting', 'Email Marketing Sequences', 'Newsletter Writer',
    'Ebook Writer', 'Social Copywriter',
  ],
  'Digital Marketing': [
    'Search Engine Optimization (SEO)', 'Social Media Marketing (SMM)',
    'Influencer Marketing', 'PPC Advertising (Google/Meta Ads)', 'Email Marketing Strategy',
    'Content Marketer', 'Performance Marketer', 'Social Marketer',
  ],
  'Quality Assurance': [
    'Automation Testing', 'Manual Functional Testing', 'User Acceptance Testing (UAT)',
    'Performance Testing', 'Load Testing', 'API Testing', 'Database Testing',
    'Stress Testing', 'Regression Testing', 'Unit Testing', 'Integration Testing',
  ],
  'Mobile App Development': [
    'Flutter Development', 'React Native Development', 'Native iOS (Swift)',
    'Native Android (Kotlin)', 'App Store & Play Store Deployment', 'IoT App Integration',
    'AR / VR Mobile Experiences', 'App Store Optimization (ASO)',
    'Mobile App Maintenance & Support', 'Tablet & Foldable App Development',
    'App Migration Services', 'Wearable App Development',
  ],
  'Third Party Integration': [
    'Payment Gateway Integration', 'Social Auth & SSO', 'Map & Geolocation APIs',
    'SMS & Email Service Integration', 'Chat SDK Integration',
    'Analytics & Crash Reporting', 'Video Conferencing & Streaming',
    'Calendar & Scheduling API', 'CRM System Synchronization', 'Accounting & Invoicing',
    'Shipping & Logistics', 'Marketplace & E-commerce', 'Customer Support Ticketing',
  ],
  'Security Testing': [
    'Vulnerability Assessment (VAPT)', 'Penetration Testing',
    'Compliance Audits (GDPR/SOC2)', 'Static Code Analysis (SAST)',
    'DAST (Runtime Scanning)', 'IAST (Hybrid Analysis)', 'SCA (Dependency Scanning)',
    'API Security Testing', 'Container Security', 'Cloud Posture (CSPM)',
    'Mobile App Security (MAST)', 'Phishing Simulation', 'Red Teaming',
    'Runtime Protection (RASP)', 'Secure Backend Architecture',
  ],
  'Gen Ai Development': [
    'AI Chatbots (Customer support, internal tools)',
    'LLM Integration (OpenAI, Gemini, Claude, etc.)',
    'Prompt Engineering',
    'Retrieval-Augmented Generation (RAG) Systems',
    'Predictive Analytics',
    'Natural Language Processing (NLP)',
    'Computer Vision Solutions',
    'Vector Database Development',
    'Machine Learning Model Development & Optimization',
    'AI Model Integration into Existing Products',
  ],
  'API Development': [
    'REST API Development', 'GraphQL API Development', 'Database Design & Management',
    'Microservices Architecture', 'Authentication & Authorization Setup',
    'Server Integration', 'Cloud Functions (Serverless)', 'Data Processing Pipelines',
    'Backend Performance Optimization', 'Cloud Deployment Support',
  ],
  'React.js Development': [
    'Next.js Development', 'Vue.js Development', 'Angular Development',
    'Single Page Applications (SPA)', 'Progressive Web Apps (PWA)',
    'Web Performance Optimization', 'Accessibility Compliance (WCAG)',
    'WordPress Development', 'Magento Development', 'Component Library Development',
  ],
  'Website Design': [
    'Mobile App Design', 'Landing Page Design', 'Wireframe Design', 'Prototype Design',
    'Brand Book Creation', 'Company / Investor Deck Design', 'Graphic Design',
    'Design System Creation', 'User Journey Mapping', 'Conversion-Focused UX',
  ],
  'IT services': [
    'Server Administration', 'Remote Monitoring & Management (RMM)',
    'Network Administration', 'VPN & Firewall Setup', 'Backup & Restore Management',
    'Hosting & Server Management', 'Disaster Recovery Planning',
    'System Migration & Upgrades', 'Performance & Health Monitoring',
  ],
  'CI/CD Pipeline Management': [
    'Infrastructure as Code (IaC)', 'Containerization (Docker)',
    'Orchestration (Kubernetes)', 'Log Management', 'Performance Monitoring',
    'Migration engineer', 'Monitoring Specialist', 'Hosting Engineer', 'Scaling Engineer',
  ],
  'SEO Blog Writing': [
    'Technical Documentation', 'Whitepapers', 'Ad & Sales Copywriting',
    'Email Marketing Sequences', 'Newsletter Writer', 'Ebook Writer', 'Social Copywriter',
  ],
};

const RATE_BY_CATEGORY = {
  'AI Engineers': 1500,
  'Backend Developers': 1200,
  'Frontend Development': 1100,
  'UI/UX Designer': 900,
  'IT Support': 700,
  'DevOps': 1300,
  'Content Writing': 600,
  'Digital Marketing': 800,
  'Quality Assurance': 900,
  'Mobile App Development': 1200,
  'Third Party Integration': 1000,
  'Security Testing': 1600,
  'Gen Ai Development': 1700,
  'API Development': 1200,
  'React.js Development': 1100,
  'Website Design': 900,
  'IT services': 700,
  'CI/CD Pipeline Management': 1300,
  'SEO Blog Writing': 600,
};

const FIRST_NAMES = ['Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Sai', 'Reyansh', 'Krishna', 'Ishaan', 'Kabir', 'Anaya', 'Diya', 'Saanvi', 'Aadhya', 'Myra'];
const LAST_NAMES = ['Sharma', 'Verma', 'Patel', 'Singh', 'Kumar', 'Gupta', 'Mehta', 'Reddy', 'Iyer', 'Khan'];

function slugify(s) {
  return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 60);
}

function pick(arr, i) { return arr[i % arr.length]; }

async function main() {
  const client = new MongoClient(URI);
  await client.connect();
  const db = client.db(DB);
  const services = db.collection('services');
  const users = db.collection('users');

  // ── WIPE existing services + seeded resources ────────────────────────────
  const delServices = await services.deleteMany({});
  console.log(`🧹 Removed ${delServices.deletedCount} existing services.`);
  const delResources = await users.deleteMany({
    role: 'resource',
    mobile: { $regex: '^91[0-9]{8}$' },
  });
  console.log(`🧹 Removed ${delResources.deletedCount} previously seeded resources.`);

  let serviceCount = 0;
  let resourceCount = 0;
  let mobileCounter = 9100000000; // start of range for seeded resources

  for (const [name, techNames] of Object.entries(CATALOG)) {
    const hourly = RATE_BY_CATEGORY[name] || 1000;
    const slug = slugify(name);
    const now = new Date();
    // FE expects technologies as objects with { id, name } so the same shape
    // works in cards, pills, summary, payment etc.
    const technologies = techNames.map((n) => ({
      id: slugify(n),
      name: n,
    }));

    const doc = {
      slug,
      name,
      title: name,
      description: `${name} services delivered by vetted experts. Choose from ${technologies.length} specialised technologies under this offering.`,
      category: name,
      technologies,
      hourlyRate: hourly,
      pricing: { hourly, currency: 'INR' },
      imageUrl: '',
      image: '',
      faqs: [],
      availability: { mode: 'instant', instant: true, scheduled: true },
      active: true,
      createdAt: now,
      updatedAt: now,
    };
    const r = await services.insertOne(doc);
    const serviceId = r.insertedId;
    serviceCount += 1;

    // Create 5 resources per service. Each resource lists this service's
    // technologies as their skill set so PMs can match them.
    for (let i = 0; i < 5; i += 1) {
      const mobile = String(mobileCounter++);
      const fn = pick(FIRST_NAMES, i + serviceCount);
      const ln = pick(LAST_NAMES, i + serviceCount * 3);
      const fullName = `${fn} ${ln}`;
      const userDoc = {
        mobile,
        name: fullName,
        role: 'resource',
        skills: technologies.slice(0, 5),
        serviceIds: [serviceId],
        primaryServiceId: serviceId,
        category: name,
        hourlyRate: hourly,
        experienceYears: 2 + (i % 6),
        rating: 4 + (i % 10) / 10,
        bio: `${fullName} – specialist under ${name}.`,
        meta: { isProfileComplete: true, status: 'active' },
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      try {
        await users.insertOne(userDoc);
        resourceCount += 1;
      } catch (e) {
        if (e.code !== 11000) throw e;
      }
    }
  }

  console.log(`✅ Inserted ${serviceCount} services and ${resourceCount} resources.`);
  await client.close();
}

main().catch((e) => { console.error(e); process.exit(1); });
