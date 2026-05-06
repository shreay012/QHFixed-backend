/**
 * seed-all.js  —  Full database seed for QuickHire local development
 *
 * Populates every collection used by the backend with realistic sample data.
 * Safe to re-run: every upsert is idempotent (keyed on a unique field).
 *
 * Run:
 *   cd "quickhire-AI-mode /backend"
 *   node src/scripts/seed-all.js
 */

import 'dotenv/config';
import { connectDb, getDb, closeDb } from '../config/db.js';
import { logger } from '../config/logger.js';
import { ObjectId } from 'mongodb';
import Redis from 'ioredis';

// ─── Redis cache flush for services ─────────────────────────────────────────
async function flushServicesCache() {
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  const client = new Redis(redisUrl, { maxRetriesPerRequest: 1, lazyConnect: true });
  try {
    await client.connect();
    // Scan and delete all services:* keys
    let cursor = '0';
    let deleted = 0;
    do {
      const [nextCursor, keys] = await client.scan(cursor, 'MATCH', 'services:*', 'COUNT', 100);
      cursor = nextCursor;
      if (keys.length > 0) {
        await client.del(...keys);
        deleted += keys.length;
      }
    } while (cursor !== '0');
    logger.info({ deleted }, '✅ Redis services cache cleared');
  } catch (e) {
    logger.warn({ err: e.message }, 'Redis cache flush skipped (Redis unavailable)');
  } finally {
    await client.quit().catch(() => {});
  }
}

// ─── helpers ────────────────────────────────────────────────────────────────
const id = () => new ObjectId();
const now = new Date();
const daysAgo = (n) => new Date(Date.now() - n * 86400_000);
const upsert = async (col, filter, doc) => {
  const r = await col.findOneAndUpdate(
    filter,
    { $setOnInsert: { ...doc, createdAt: now }, $set: { updatedAt: now } },
    { upsert: true, returnDocument: 'after' },
  );
  return r.value || r;
};

// ─── Common service fields ──────────────────────────────────────────────────
const COMMON_NOT_INCLUDED = [
  'Software licenses or paid third-party tools',
  'Support beyond agreed timelines',
  'Work beyond the defined project scope',
  'Weekends & national holiday support',
];

const makeFaqs = (serviceName) => [
  { question: `How quickly can I get a ${serviceName}?`, answer: 'Once you book and complete payment, our AI-TPM matches you with a verified expert within 10 minutes.' },
  { question: 'Can I extend the session?', answer: 'Yes, you can extend at any time from the app. The same expert continues your project for seamless delivery.' },
  { question: 'What if I am not satisfied?', answer: 'We offer a satisfaction guarantee. If the work does not meet your expectations, raise a ticket and we will resolve it.' },
  { question: 'Is the expert dedicated to my project?', answer: 'Yes. Once assigned, the expert works exclusively on your task during the booked hours.' },
  { question: 'How do I communicate with the expert?', answer: 'Live in-app chat activates automatically after booking. You can also schedule calls via your Project Manager.' },
];

// ─── main ────────────────────────────────────────────────────────────────────
const run = async () => {
  await connectDb();
  const db = getDb();

  // ── 1. USERS ───────────────────────────────────────────────────────────────
  logger.info('seeding users…');

  const adminUser = await upsert(db.collection('users'), { mobile: '9000000000', role: 'admin' }, {
    mobile: '9000000000', role: 'admin', name: 'Root Admin',
    email: 'admin@quickhire.local',
    'meta.isProfileComplete': true, 'meta.status': 'active',
  });

  const pmUser = await upsert(db.collection('users'), { mobile: '9000000001', role: 'pm' }, {
    mobile: '9000000001', role: 'pm', name: 'Priya Sharma',
    email: 'pm@quickhire.local',
    'meta.isProfileComplete': true, 'meta.status': 'active',
  });

  const resourceUser1 = await upsert(db.collection('users'), { mobile: '9000000002', role: 'resource' }, {
    mobile: '9000000002', role: 'resource', name: 'Arjun Mehta',
    email: 'arjun@quickhire.local',
    skills: ['react', 'node', 'typescript', 'mongodb'],
    experience: 5,
    hourlyRate: 800,
    'meta.isProfileComplete': true, 'meta.status': 'active',
  });

  const resourceUser2 = await upsert(db.collection('users'), { mobile: '9000000003', role: 'resource' }, {
    mobile: '9000000003', role: 'resource', name: 'Sneha Patel',
    email: 'sneha@quickhire.local',
    skills: ['flutter', 'dart', 'firebase', 'kotlin'],
    experience: 4,
    hourlyRate: 700,
    'meta.isProfileComplete': true, 'meta.status': 'active',
  });

  const resourceUser3 = await upsert(db.collection('users'), { mobile: '9000000004', role: 'resource' }, {
    mobile: '9000000004', role: 'resource', name: 'Rahul Verma',
    email: 'rahul@quickhire.local',
    skills: ['aws', 'docker', 'kubernetes', 'terraform', 'devops'],
    experience: 6,
    hourlyRate: 1000,
    'meta.isProfileComplete': true, 'meta.status': 'active',
  });

  const testUser = await upsert(db.collection('users'), { mobile: '9876543210', role: 'user' }, {
    mobile: '9876543210', role: 'user', name: 'Test Customer',
    email: 'testuser@example.com',
    'meta.isProfileComplete': true, 'meta.status': 'active',
  });

  const testUser2 = await upsert(db.collection('users'), { mobile: '9876543211', role: 'user' }, {
    mobile: '9876543211', role: 'user', name: 'Demo User',
    email: 'demo@example.com',
    'meta.isProfileComplete': true, 'meta.status': 'active',
  });

  logger.info('✅ users done');

  // ── 2. SERVICES ────────────────────────────────────────────────────────────
  logger.info('seeding services — deleting old ones first…');
  await db.collection('services').deleteMany({});

  const tech = (names) => names.map(name => ({ _id: new ObjectId(), name }));

  const s = (slug, name, category, desc, shortDesc, rate, skills, techs, img, featured, expYrs, rating, bookings, minH = 4, maxH = 40) => ({
    slug, name, category,
    description: desc, shortDescription: shortDesc,
    hourlyRate: rate, pricing: { hourly: rate },
    currency: 'INR', minHours: minH, maxHours: maxH,
    bookingType: 'instant',
    skills, technologies: tech(techs),
    notIncluded: COMMON_NOT_INCLUDED,
    faqs: makeFaqs(name),
    image: img, active: true, featured,
    experienceYears: expYrs, rating, totalBookings: bookings,
  });

  const SERVICES = [
    s('ai-engineers', 'AI Engineers', 'AI & Machine Learning',
      'Hire verified AI engineers for Gen AI solutions, LLM integrations, RAG pipelines, computer vision, NLP and ML model development.',
      'Gen AI, LLMs, ML models & intelligent solutions', 1200,
      ['Python', 'PyTorch', 'LangChain', 'OpenAI', 'TensorFlow'],
      ['Gen Ai Solutions', 'LLM Integration', 'Prompt Engineering', 'Predictive Analytics', 'Computer Vision', 'NLP', 'Ai Chatbots', 'ML Engineer', 'Vector Database Developer', 'Vision Engineer', 'RAG Systems', 'Analytics Expert'],
      '/images/services/ai.png', true, 5, 4.9, 89),

    s('backend-developers', 'Backend Developers', 'Backend Development',
      'Expert backend developers for REST & GraphQL APIs, microservices architecture, cloud functions, authentication, and database management.',
      'APIs, microservices, databases & cloud backend', 900,
      ['Node.js', 'Python', 'MongoDB', 'PostgreSQL', 'Redis'],
      ['Rest API Development', 'GraphQL API Development', 'Database Management', 'Microservices Architecture', 'Server Integration', 'Cloud Functions (Serverless)', 'Authentication Setup', 'Cloud Deployment', 'Data Processing', 'Performance Optimization'],
      '/images/services/node.png', true, 5, 4.7, 112),

    s('frontend-development', 'Frontend Development', 'Frontend Development',
      'Build fast, accessible, and responsive web apps with React, Next.js, Vue, Angular, PWA and more.',
      'React, Next.js, Vue, Angular & modern web apps', 850,
      ['React', 'Next.js', 'Vue', 'Angular', 'TypeScript'],
      ['React.js Development', 'Next.js Development', 'Vue.js Development', 'Angular Development', 'Single Page Applications (SPA)', 'PWA (Progressive Web Apps)', 'Web Performance Optimization', 'Accessibility Compliance', 'Wordpress Developer', 'Magento Developer', 'Component Library', 'ASO Expert'],
      '/images/services/react.png', true, 5, 4.8, 134),

    s('ui-ux-designer', 'UI/UX Designer', 'Design',
      'Professional UI/UX designers for brand books, mobile app design, wireframes, prototypes, landing pages and investor decks.',
      'Brand design, wireframes, prototypes & UX', 800,
      ['Figma', 'Adobe XD', 'Sketch', 'Prototyping', 'Wireframing'],
      ['Brand Book', 'Company Deck', 'Mobile App Design', 'Prototype Design', 'Wireframe Design', 'Landing Page Design', 'UI/UX Designer', 'Graphic Designer'],
      '/images/services/design.png', true, 4, 4.7, 76),

    s('it-support', 'IT Support', 'IT Services',
      '24/7 IT support engineers for server administration, remote monitoring, help desk, network management, VPN, backup and disaster recovery.',
      '24/7 help desk, server admin & IT management', 800,
      ['Linux', 'Windows Server', 'Network', 'VPN', 'RMM'],
      ['Server Administration', '24/7 Help Desk (L1/L2/L3)', 'Remote Monitoring (RMM)', 'Network Administration', 'VPN & Firewall Setup', 'Backup & Restore Management', 'Disaster Recovery Planning', 'Hosting & Server Management', 'System Migration & Upgrades', 'Disaster Recovery Expert', 'Backup Expert'],
      '/images/services/devops.png', false, 4, 4.5, 58),

    s('devops', 'DevOps', 'DevOps & Cloud',
      'DevOps engineers for CI/CD pipelines, Docker, Kubernetes, IaC, cloud migration, log management and performance monitoring.',
      'CI/CD, Docker, K8s, cloud & infrastructure', 1100,
      ['Docker', 'Kubernetes', 'Terraform', 'AWS', 'Jenkins'],
      ['CI/CD Pipeline Management', 'Infrastructure as Code (IaC)', 'Containerization (Docker)', 'Orchestration (Kubernetes)', 'Cloud Migration & Support', 'Log Management', 'Performance Monitoring', 'Migration engineer', 'Monitoring Specialist', 'Hosting Engineer', 'Scaling Engineer'],
      '/images/services/devops.png', true, 6, 4.9, 67),

    s('content-writing', 'Content Writing', 'Content & Marketing',
      'Professional content writers for SEO blogs, technical docs, API documentation, whitepapers, email sequences and newsletters.',
      'SEO blogs, technical docs & marketing content', 800,
      ['SEO', 'Technical Writing', 'Copywriting', 'API Docs'],
      ['SEO Blog Writing', 'Technical Documentation', 'API Documentation', 'Whitepapers', 'Ad & Sales Copywriting', 'Email Marketing Sequences', 'Newsletter Writer', 'Ebook Writer', 'Social Copywriter'],
      '/images/services/design.png', false, 3, 4.5, 45),

    s('digital-marketing', 'Digital Marketing', 'Content & Marketing',
      'Digital marketing experts for SEO, social media, PPC ads, influencer marketing, email campaigns and conversion rate optimization.',
      'SEO, SMM, PPC & growth marketing', 900,
      ['SEO', 'Google Ads', 'Meta Ads', 'Social Media', 'Analytics'],
      ['Search Engine Optimization (SEO)', 'Social Media Marketing (SMM)', 'Influencer Marketing', 'PPC Advertising (Google/Meta Ads)', 'Email Marketing Strategy', 'Content Marketer', 'Performance Marketer', 'Social Marketer', 'ORM Expert', 'CRO Expert'],
      '/images/services/ai.png', false, 4, 4.6, 52),

    s('quality-assurance', 'Quality Assurance', 'Quality Assurance',
      'QA engineers for automation testing, manual testing, performance, load, API, database and regression testing.',
      'Automation, manual & performance testing', 850,
      ['Selenium', 'Cypress', 'Appium', 'Jest', 'Postman'],
      ['Automation Testing', 'Manual Functional Testing', 'User Acceptance Testing (UAT)', 'Performance Testing', 'Load Testing', 'API Testing', 'Database Testing', 'Stress Testing', 'Regression Testing', 'Unit Testing', 'Integration Testing'],
      '/images/services/qa.png', false, 4, 4.6, 63),

    s('mobile-app-development', 'Mobile App Development', 'Mobile Development',
      'Mobile app developers for Flutter, React Native, iOS Swift, Android Kotlin, ASO, IoT, AR/VR and wearable apps.',
      'Flutter, React Native, iOS & Android apps', 1000,
      ['Flutter', 'React Native', 'Swift', 'Kotlin', 'Firebase'],
      ['Flutter Development', 'React Native Development', 'Native iOS (Swift)', 'Native Android (Kotlin)', 'App Store & Play Store Deployment', 'App Store Optimization (ASO)', 'IoT App Integration', 'AR / VR Mobile Experiences', 'Video Conferencing & Streaming', 'App Migration Services', 'Tablet & Foldable App Development', 'Wearable App Development'],
      '/images/services/flutter.png', true, 5, 4.8, 98),

    s('third-party-integration', 'Third Party Integration', 'Integrations',
      'Integration experts for payment gateways, social auth, maps, SMS/email services, chat SDKs, CRM, analytics and e-commerce APIs.',
      'Payment, auth, maps, CRM & API integrations', 950,
      ['REST API', 'Stripe', 'Twilio', 'Firebase', 'Webhooks'],
      ['Payment Gateway Integration', 'Social Auth & SSO', 'Map & Geolocation APIs', 'SMS & Email Service Integration', 'Chat SDK Integration', 'Analytics & Crash Reporting', 'Calendar & Scheduling API', 'CRM System Synchronization', 'Accounting & Invoicing', 'Shipping & Logistics', 'Marketplace & E-commerce', 'Customer Support Ticketing'],
      '/images/services/node.png', false, 4, 4.7, 41),

    s('security-testing', 'Security Testing', 'Security',
      'Security engineers for VAPT, penetration testing, compliance audits, SAST/DAST/IAST, container security, mobile app security and red teaming.',
      'VAPT, pen testing, SAST/DAST & compliance', 1200,
      ['OWASP', 'Burp Suite', 'Nmap', 'Metasploit', 'SonarQube'],
      ['Vulnerability Assessment (VAPT)', 'Penetration Testing', 'Compliance Audits (GDPR/SOC2)', 'Static Code Analysis (SAST)', 'DAST (Runtime Scanning)', 'IAST (Hybrid Analysis)', 'SCA (Dependency Scanning)', 'Container Security', 'Cloud Posture (CSPM)', 'Mobile App Security (MAST)', 'Phishing Simulation', 'Red Teaming', 'Runtime Protection (RASP)', 'Secure Backend Architecture'],
      '/images/services/qa.png', false, 6, 4.9, 29),

    s('gen-ai-development', 'Gen Ai Development', 'AI & Machine Learning',
      'Specialized Gen AI developers for AI chatbots, LLM integrations, RAG systems, ML model development and AI product integration.',
      'AI chatbots, LLMs, RAG & ML solutions', 1400,
      ['OpenAI', 'LangChain', 'Python', 'PyTorch', 'Pinecone'],
      ['AI Chatbots (Customer support, internal tools)', 'LLM Integration (OpenAI, Gemini, Claude, etc.)', 'Prompt Engineering', 'Predictive Analytics', 'Computer Vision', 'Natural Language Processing (NLP)', 'ML Engineer', 'Vector Database Development', 'Vision Engineer', 'RAG Systems', 'Machine Learning Model Development & Optimization', 'AI Model Integration into Existing Products'],
      '/images/services/ai.png', true, 5, 4.9, 44),

    s('api-development', 'API Development', 'Backend Development',
      'API specialists for REST & GraphQL APIs, database design, microservices, authentication, cloud deployment and backend performance.',
      'REST, GraphQL, microservices & API design', 950,
      ['Node.js', 'Python', 'REST', 'GraphQL', 'PostgreSQL'],
      ['REST API Development', 'GraphQL API Development', 'Database Design & Management', 'Microservices Architecture', 'Cloud Deployment Support', 'Backend Performance Optimization', 'Authentication & Authorization Setup', 'Server Integration', 'Data Processing Pipelines'],
      '/images/services/node.png', false, 5, 4.7, 56),

    s('reactjs-development', 'React.js Development', 'Frontend Development',
      'React.js specialists for Next.js, Vue, Angular, SPA, PWA, WCAG compliance, component libraries, WordPress and Magento.',
      'React, Next.js, Vue, Angular & web apps', 850,
      ['React', 'Next.js', 'TypeScript', 'Redux', 'Tailwind'],
      ['Next.js Development', 'Vue.js Development', 'Angular Development', 'Single Page Applications (SPA)', 'Progressive Web Apps (PWA)', 'Web Performance Optimization', 'Accessibility Compliance (WCAG)', 'Component Library Development', 'WordPress Development', 'Magento Development'],
      '/images/services/react.png', true, 5, 4.8, 87),

    s('website-design', 'Website Design', 'Design',
      'Website designers for brand books, mobile app design, landing pages, wireframes, investor decks, design systems and UX.',
      'Brand, landing pages, design systems & UX', 800,
      ['Figma', 'Adobe XD', 'Illustrator', 'Webflow', 'Framer'],
      ['Brand Book', 'Mobile App Design', 'Landing Page', 'Wireframe Design', 'Company / Investor Deck Design', 'Graphic Design', 'Design System Creation', 'User Journey Mapping', 'Conversion-Focused UX'],
      '/images/services/design.png', false, 4, 4.6, 61),

    s('it-services', 'IT Services', 'IT Services',
      'Comprehensive IT services including server administration, RMM, network management, VPN, backup, disaster recovery and hosting.',
      'Server admin, RMM, networking & IT ops', 800,
      ['Linux', 'Windows', 'VMware', 'Cisco', 'AWS'],
      ['Server Administration', 'Remote Monitoring & Management (RMM)', 'Network Administration', 'VPN & Firewall Setup', 'Backup & Restore Management', 'Disaster Recovery Planning', 'Hosting & Server Management', 'System Migration & Upgrades', 'Performance & Health Monitoring'],
      '/images/services/devops.png', false, 4, 4.5, 38),

    s('cicd-pipeline-management', 'CI/CD Pipeline Management', 'DevOps & Cloud',
      'CI/CD pipeline engineers for IaC, Docker, Kubernetes, log management, monitoring and cloud scaling.',
      'CI/CD, Docker, K8s & pipeline automation', 1100,
      ['Jenkins', 'GitHub Actions', 'Docker', 'Kubernetes', 'Terraform'],
      ['CI/CD Pipeline Management', 'Infrastructure as Code (IaC)', 'Containerization (Docker)', 'Orchestration (Kubernetes)', 'Log Management', 'Performance Monitoring', 'Migration engineer', 'Monitoring Specialist', 'Hosting Engineer', 'Scaling Engineer'],
      '/images/services/devops.png', false, 5, 4.8, 33),

    s('seo', 'SEO', 'Content & Marketing',
      'SEO specialists for search engine optimization, social media, PPC, influencer marketing, email campaigns and ORM.',
      'SEO, PPC, social media & digital growth', 900,
      ['Google Analytics', 'SEMrush', 'Ahrefs', 'Google Ads', 'Meta Ads'],
      ['Search Engine Optimization (SEO)', 'Social Media Marketing (SMM)', 'Influencer Marketing', 'PPC Advertising (Google/Meta Ads)', 'Email Marketing Strategy', 'Content Marketer', 'Performance Marketer', 'Social Marketer', 'ORM Expert', 'CRO Expert'],
      '/images/services/ai.png', false, 4, 4.6, 47),

    s('blog-writing', 'Blog Writing', 'Content & Marketing',
      'Professional blog writers for SEO content, technical documentation, API docs, whitepapers, email sequences and ebooks.',
      'SEO blogs, tech docs, emails & ebooks', 800,
      ['SEO', 'WordPress', 'Technical Writing', 'Copywriting'],
      ['SEO Blog Writing', 'Technical Documentation', 'API Documentation', 'Whitepapers', 'Ad & Sales Copywriting', 'Email Marketing Sequences', 'Newsletter Writer', 'Ebook Writer', 'Social Copywriter'],
      '/images/services/design.png', false, 3, 4.4, 35),
  ];

  // $set ALL fields so re-running always syncs latest data to existing docs
  const serviceIds = {};
  for (const svc of SERVICES) {
    const { slug, ...fields } = svc;
    const r = await db.collection('services').findOneAndUpdate(
      { slug },
      {
        $setOnInsert: { createdAt: now },   // slug only in filter, not duplicated here
        $set: { slug, ...fields, updatedAt: now },
      },
      { upsert: true, returnDocument: 'after' },
    );
    const doc = r.value || r;
    serviceIds[slug] = doc._id;
  }
  logger.info('✅ services done');
  await flushServicesCache(); // Clear stale Redis cache so live site shows fresh data

  // ── 3. BOOKINGS & JOBS ─────────────────────────────────────────────────────
  logger.info('seeding bookings & jobs…');

  const booking1Id = id();
  await db.collection('bookings').updateOne(
    { _id: booking1Id },
    {
      $setOnInsert: {
        _id: booking1Id,
        userId: testUser._id,
        serviceId: serviceIds['react-developer'],
        pmId: pmUser._id,
        resourceId: resourceUser1._id,
        status: 'completed',
        hours: 8,
        pricing: { hourlyRate: 800, hours: 8, subtotal: 6400, tax: 1152, total: 7552, currency: 'INR' },
        startTime: daysAgo(10),
        endTime: daysAgo(9),
        requirements: 'Build a dashboard with React and Recharts, integrate REST APIs.',
        createdAt: daysAgo(12),
        updatedAt: daysAgo(9),
      },
    },
    { upsert: true },
  );

  const booking2Id = id();
  await db.collection('bookings').updateOne(
    { _id: booking2Id },
    {
      $setOnInsert: {
        _id: booking2Id,
        userId: testUser._id,
        serviceId: serviceIds['flutter-developer'],
        pmId: pmUser._id,
        resourceId: resourceUser2._id,
        status: 'ongoing',
        hours: 16,
        pricing: { hourlyRate: 700, hours: 16, subtotal: 11200, tax: 2016, total: 13216, currency: 'INR' },
        startTime: daysAgo(2),
        endTime: new Date(Date.now() + 5 * 86400_000),
        requirements: 'Add push notifications and offline mode to existing Flutter app.',
        createdAt: daysAgo(3),
        updatedAt: daysAgo(1),
      },
    },
    { upsert: true },
  );

  const booking3Id = id();
  await db.collection('bookings').updateOne(
    { _id: booking3Id },
    {
      $setOnInsert: {
        _id: booking3Id,
        userId: testUser2._id,
        serviceId: serviceIds['devops-engineer'],
        pmId: pmUser._id,
        resourceId: resourceUser3._id,
        status: 'pending',
        hours: 4,
        pricing: { hourlyRate: 1000, hours: 4, subtotal: 4000, tax: 720, total: 4720, currency: 'INR' },
        startTime: new Date(Date.now() + 86400_000),
        requirements: 'Set up GitHub Actions CI/CD pipeline with Docker and deploy to AWS ECS.',
        createdAt: daysAgo(1),
        updatedAt: daysAgo(1),
      },
    },
    { upsert: true },
  );

  // Jobs linked to bookings
  await upsert(db.collection('jobs'), { bookingId: booking1Id }, {
    bookingId: booking1Id,
    userId: testUser._id,
    resourceId: resourceUser1._id,
    pmId: pmUser._id,
    serviceId: serviceIds['react-developer'],
    status: 'completed',
    title: 'React Dashboard Development',
    description: 'Build a dashboard with React and Recharts, integrate REST APIs.',
    pricing: { hourlyRate: 800, hours: 8, total: 7552, currency: 'INR' },
    schedule: { startTime: daysAgo(10), endTime: daysAgo(9) },
    servicesStatus: 'completed',
  });

  await upsert(db.collection('jobs'), { bookingId: booking2Id }, {
    bookingId: booking2Id,
    userId: testUser._id,
    resourceId: resourceUser2._id,
    pmId: pmUser._id,
    serviceId: serviceIds['flutter-developer'],
    status: 'ongoing',
    title: 'Flutter App Enhancement',
    description: 'Add push notifications and offline mode.',
    pricing: { hourlyRate: 700, hours: 16, total: 13216, currency: 'INR' },
    schedule: { startTime: daysAgo(2), endTime: new Date(Date.now() + 5 * 86400_000) },
    servicesStatus: 'ongoing',
  });

  logger.info('✅ bookings & jobs done');

  // ── 4. PAYMENTS ────────────────────────────────────────────────────────────
  logger.info('seeding payments…');

  await upsert(db.collection('payments'), { orderId: 'order_test_001' }, {
    orderId: 'order_test_001',
    paymentId: 'pay_test_001',
    userId: testUser._id,
    bookingId: booking1Id,
    amount: 7552, currency: 'INR',
    status: 'captured',
    method: 'upi',
    provider: 'razorpay',
    capturedAt: daysAgo(12),
  });

  await upsert(db.collection('payments'), { orderId: 'order_test_002' }, {
    orderId: 'order_test_002',
    paymentId: 'pay_test_002',
    userId: testUser._id,
    bookingId: booking2Id,
    amount: 13216, currency: 'INR',
    status: 'captured',
    method: 'card',
    provider: 'razorpay',
    capturedAt: daysAgo(3),
  });

  logger.info('✅ payments done');

  // ── 5. REVIEWS ─────────────────────────────────────────────────────────────
  logger.info('seeding reviews…');

  await upsert(db.collection('reviews'), { bookingId: booking1Id, fromId: testUser._id }, {
    bookingId: booking1Id,
    fromId: testUser._id,
    toId: resourceUser1._id,
    serviceId: serviceIds['react-developer'],
    rating: 5,
    comment: 'Arjun was exceptional — delivered clean, well-documented React code on time.',
    moderationStatus: 'approved',
  });

  logger.info('✅ reviews done');

  // ── 6. NOTIFICATIONS ───────────────────────────────────────────────────────
  logger.info('seeding notifications…');

  await upsert(db.collection('notifications'), { userId: testUser._id, type: 'booking_confirmed_seed' }, {
    userId: testUser._id,
    type: 'booking_confirmed_seed',
    title: 'Booking Confirmed',
    body: 'Your React Developer booking has been confirmed. Your PM will connect shortly.',
    read: true,
    data: { bookingId: booking1Id },
    createdAt: daysAgo(12),
  });

  await upsert(db.collection('notifications'), { userId: testUser._id, type: 'booking_ongoing_seed' }, {
    userId: testUser._id,
    type: 'booking_ongoing_seed',
    title: 'Work in Progress',
    body: 'Sneha has started working on your Flutter app. Check the chat for updates.',
    read: false,
    data: { bookingId: booking2Id },
    createdAt: daysAgo(2),
  });

  logger.info('✅ notifications done');

  // ── 7. NOTIFICATION TEMPLATES ──────────────────────────────────────────────
  logger.info('seeding notification_templates…');

  const NOTIF_TEMPLATES = [
    { key: 'booking_confirmed', title: 'Booking Confirmed 🎉', body: 'Your {{service}} booking is confirmed. Your PM {{pm_name}} will connect within 10 minutes.', channels: ['push', 'email'] },
    { key: 'booking_started',   title: 'Work Started',         body: '{{resource_name}} has started working on your project. Track progress in the app.',          channels: ['push'] },
    { key: 'booking_completed', title: 'Booking Completed',    body: 'Your {{service}} session is complete. Please leave a review!',                               channels: ['push', 'email'] },
    { key: 'booking_cancelled', title: 'Booking Cancelled',    body: 'Your booking has been cancelled. Refund will be processed in 5–7 business days.',            channels: ['push', 'email'] },
    { key: 'otp_sent',          title: 'Your OTP',             body: 'Your QuickHire OTP is {{otp}}. Valid for 5 minutes. Do not share it.',                       channels: ['sms'] },
    { key: 'payment_success',   title: 'Payment Received',     body: 'Payment of ₹{{amount}} for {{service}} received successfully. Order ID: {{order_id}}',       channels: ['push', 'email'] },
  ];

  for (const t of NOTIF_TEMPLATES) {
    await upsert(db.collection('notification_templates'), { key: t.key }, t);
  }
  logger.info('✅ notification_templates done');

  // ── 8. FEATURE FLAGS ───────────────────────────────────────────────────────
  logger.info('seeding feature_flags…');

  const FLAGS = [
    { key: 'chat_enabled',         enabled: true,  rolloutPct: 100, description: 'In-app chat between user, PM and resource' },
    { key: 'ai_matching',          enabled: true,  rolloutPct: 100, description: 'AI-powered resource matching at booking time' },
    { key: 'promo_codes',          enabled: true,  rolloutPct: 100, description: 'Promo code redemption at checkout' },
    { key: 'razorpay_payments',    enabled: true,  rolloutPct: 100, description: 'Razorpay payment gateway' },
    { key: 'referral_program',     enabled: true,  rolloutPct: 100, description: 'User referral & commission program' },
    { key: 'resource_deliverables',enabled: true,  rolloutPct: 100, description: 'Resource can upload deliverables per job' },
    { key: 'dark_mode',            enabled: false, rolloutPct: 0,   description: 'Dark mode UI toggle' },
    { key: 'new_dashboard',        enabled: true,  rolloutPct: 50,  description: 'New analytics dashboard (50% rollout)' },
  ];

  for (const f of FLAGS) {
    await upsert(db.collection('feature_flags'), { key: f.key }, { ...f, updatedBy: adminUser._id });
  }
  logger.info('✅ feature_flags done');

  // ── 9. SYSTEM CONFIG ───────────────────────────────────────────────────────
  logger.info('seeding system_config…');

  const CONFIG = [
    { key: 'platform_fee_pct',        value: 18,    description: 'Platform fee % applied to all bookings' },
    { key: 'gst_pct',                 value: 18,    description: 'GST % on all transactions' },
    { key: 'min_booking_hours',       value: 4,     description: 'Minimum hours per booking' },
    { key: 'max_booking_hours',       value: 40,    description: 'Maximum hours per booking' },
    { key: 'allocation_sla_minutes',  value: 10,    description: 'SLA to allocate a resource after booking (mins)' },
    { key: 'refund_window_hours',     value: 24,    description: 'Hours after booking start within which refund is allowed' },
    { key: 'support_email',           value: 'support@quickhire.services', description: 'Customer support email' },
    { key: 'support_phone',           value: '+91-9000000000',             description: 'Customer support phone' },
    { key: 'currency_default',        value: 'INR', description: 'Default currency' },
  ];

  for (const c of CONFIG) {
    await upsert(db.collection('system_config'), { key: c.key }, c);
  }
  logger.info('✅ system_config done');

  // ── 10. PROMO CODES ────────────────────────────────────────────────────────
  logger.info('seeding promo_codes…');

  const PROMOS = [
    { code: 'WELCOME200', type: 'flat_off',  value: 200,  minCart: 1000, usageLimit: 1000, perUserLimit: 1, active: true, description: '₹200 off on first booking' },
    { code: 'QHDEV10',    type: 'pct_off',   value: 10,   minCart: 2000, usageLimit: 500,  perUserLimit: 3, active: true, description: '10% off on developer services' },
    { code: 'AILAUNCH',   type: 'pct_off',   value: 15,   minCart: 3000, usageLimit: 200,  perUserLimit: 1, active: true, description: '15% off on AI/ML bookings' },
    { code: 'DEVOPS50',   type: 'flat_off',  value: 500,  minCart: 4000, usageLimit: 100,  perUserLimit: 2, active: true, description: '₹500 off DevOps bookings' },
  ];

  for (const p of PROMOS) {
    await upsert(db.collection('promo_codes'), { code: p.code }, {
      ...p,
      usageCount: 0,
      validFrom: daysAgo(30),
      validUntil: new Date(Date.now() + 90 * 86400_000),
      createdBy: adminUser._id,
    });
  }
  logger.info('✅ promo_codes done');

  // ── 11. CMS CONTENT ────────────────────────────────────────────────────────
  logger.info('seeding cms_content…');

  const CMS = [
    {
      key: 'hero',
      data: {
        headline: 'Hire IT Experts Instantly.',
        subheadline: 'No Delays. No Hassle.',
        cta_primary: 'Hire Now',
        cta_secondary: 'How it works',
      },
    },
    {
      key: 'about_us',
      data: {
        title: 'We match businesses with top IT talent in under 10 minutes.',
        body: 'QuickHire is an AI-powered platform that connects companies with vetted, full-time IT professionals — developers, designers, QA, DevOps and more — without the delays of traditional hiring.',
        founded: 2023,
        team_size: '50+',
      },
    },
    {
      key: 'contact',
      data: {
        email: 'hello@quickhire.services',
        phone: '+91-9000000000',
        address: 'Bangalore, Karnataka, India',
        linkedin: 'https://linkedin.com/company/quickhire',
      },
    },
    {
      key: 'footer',
      data: {
        tagline: 'Your tech team, ready in minutes.',
        copyright: `© ${new Date().getFullYear()} QuickHire Services Pvt. Ltd.`,
      },
    },
  ];

  for (const c of CMS) {
    await upsert(db.collection('cms_content'), { key: c.key }, c);
  }
  logger.info('✅ cms_content done');

  // ── 12. CURRENCIES & COUNTRIES ─────────────────────────────────────────────
  logger.info('seeding currencies & countries…');

  await upsert(db.collection('currencies'), { code: 'INR' }, { code: 'INR', symbol: '₹', name: 'Indian Rupee',  default: true  });
  await upsert(db.collection('currencies'), { code: 'USD' }, { code: 'USD', symbol: '$', name: 'US Dollar',     default: false });
  await upsert(db.collection('currencies'), { code: 'AED' }, { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham', default: false });

  await upsert(db.collection('countries'), { code: 'IN' }, { code: 'IN', name: 'India',        dialCode: '+91',  currency: 'INR', active: true });
  await upsert(db.collection('countries'), { code: 'US' }, { code: 'US', name: 'United States', dialCode: '+1',  currency: 'USD', active: true });
  await upsert(db.collection('countries'), { code: 'AE' }, { code: 'AE', name: 'UAE',           dialCode: '+971',currency: 'AED', active: true });

  logger.info('✅ currencies & countries done');

  // ── 13. GEO PRICING ────────────────────────────────────────────────────────
  logger.info('seeding geo_pricing…');

  await upsert(db.collection('geo_pricing'), { country: 'IN' }, {
    country: 'IN', currency: 'INR', multiplier: 1.0,
    tiers: { min: 450, max: 1200, default: 800 },
  });
  await upsert(db.collection('geo_pricing'), { country: 'US' }, {
    country: 'US', currency: 'USD', multiplier: 0.012,
    tiers: { min: 10, max: 25, default: 15 },
  });
  await upsert(db.collection('geo_pricing'), { country: 'AE' }, {
    country: 'AE', currency: 'AED', multiplier: 0.044,
    tiers: { min: 35, max: 90, default: 55 },
  });

  logger.info('✅ geo_pricing done');

  // ── 14. AUDIT LOGS (sample) ─────────────────────────────────────────────────
  logger.info('seeding audit_logs…');

  const auditDocs = [
    { actorId: adminUser._id, action: 'USER_CREATED',    resource: 'user',    resourceId: testUser._id,  ip: '127.0.0.1', at: daysAgo(12) },
    { actorId: testUser._id,  action: 'BOOKING_CREATED', resource: 'booking', resourceId: booking1Id,    ip: '127.0.0.1', at: daysAgo(12) },
    { actorId: testUser._id,  action: 'PAYMENT_SUCCESS', resource: 'payment', resourceId: booking1Id,    ip: '127.0.0.1', at: daysAgo(12) },
    { actorId: pmUser._id,    action: 'BOOKING_STARTED', resource: 'booking', resourceId: booking1Id,    ip: '127.0.0.1', at: daysAgo(10) },
    { actorId: pmUser._id,    action: 'BOOKING_COMPLETED',resource: 'booking',resourceId: booking1Id,    ip: '127.0.0.1', at: daysAgo(9)  },
  ];

  for (const log of auditDocs) {
    await db.collection('audit_logs').insertOne(log).catch(() => {/* skip dup */});
  }
  logger.info('✅ audit_logs done');

  // ── 15. TICKETS ────────────────────────────────────────────────────────────
  logger.info('seeding tickets…');

  const ticket1Id = id();
  await db.collection('tickets').updateOne(
    { _id: ticket1Id },
    {
      $setOnInsert: {
        _id: ticket1Id,
        userId: testUser._id,
        subject: 'Issue with booking extension',
        status: 'resolved',
        priority: 'medium',
        category: 'billing',
        createdAt: daysAgo(8),
        resolvedAt: daysAgo(7),
        updatedAt: daysAgo(7),
      },
    },
    { upsert: true },
  );
  await db.collection('ticket_messages').insertOne({
    ticketId: ticket1Id,
    senderId: testUser._id,
    senderRole: 'user',
    message: 'Hi, I tried to extend my React Developer booking but got an error.',
    createdAt: daysAgo(8),
  }).catch(() => {});
  await db.collection('ticket_messages').insertOne({
    ticketId: ticket1Id,
    senderId: adminUser._id,
    senderRole: 'admin',
    message: 'Thanks for reaching out! We have resolved the extension issue. Please try again.',
    createdAt: daysAgo(7),
  }).catch(() => {});

  logger.info('✅ tickets done');

  // ── summary ────────────────────────────────────────────────────────────────
  const counts = await Promise.all([
    'users','services','bookings','jobs','payments','reviews',
    'notifications','notification_templates','feature_flags',
    'system_config','promo_codes','cms_content','currencies',
    'countries','geo_pricing','audit_logs','tickets','ticket_messages',
  ].map(async (name) => ({ name, count: await db.collection(name).countDocuments() })));

  logger.info('');
  logger.info('════════════════════════════════════════');
  logger.info('  SEED COMPLETE — Collection counts');
  logger.info('════════════════════════════════════════');
  for (const { name, count } of counts) {
    logger.info(`  ${name.padEnd(28)} ${count}`);
  }
  logger.info('════════════════════════════════════════');
  logger.info('');
  logger.info('Test logins (DEV_MASTER_OTP = 1234):');
  logger.info('  User     → 9876543210');
  logger.info('  User 2   → 9876543211');
  logger.info('  Admin    → 9000000000');
  logger.info('  PM       → 9000000001');
  logger.info('  Resource → 9000000002');

  await closeDb();
  process.exit(0);
};

run().catch((e) => {
  logger.error(e, 'seed failed');
  process.exit(1);
});
