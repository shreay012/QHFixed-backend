// seed-tech-services.js — Replaces all existing services with 20 tech services
// from PDF spec. Multi-country (IN/AE/DE/AU/US) format, 1000-1500 INR/hr range.
//
// Run:  node src/scripts/seed-tech-services.js

import 'dotenv/config';
import { connectDb, getDb, closeDb } from '../config/db.js';
import { logger } from '../config/logger.js';

const now = new Date();

// Per-country pricing template — pass INR base, get all 5 currencies.
// FX (rough): 1 USD ≈ 84 INR · 1 EUR ≈ 91 · 1 AED ≈ 23 · 1 AUD ≈ 55
function buildPricing(inrBase) {
  const round5 = (n) => Math.round(n / 5) * 5;
  return [
    {
      country: 'IN', currency: 'INR',
      basePrice: inrBase, unit: 'per_hour',
      minDuration: 60, minCharge: inrBase,
      tax: {
        type: 'GST', rate: 18, inclusive: false,
        split: [{ name: 'CGST', rate: 9 }, { name: 'SGST', rate: 9 }],
        registrationNumber: '06AABCU9603R1ZN',
      },
      surgeRules: [
        { name: 'Weekend', multiplier: 1.15, daysOfWeek: [0, 6], startHour: 0, endHour: 23, active: true },
      ],
      cities: ['DEL', 'BLR', 'MUM', 'GGN', 'HYD', 'PUN'],
      active: true,
    },
    {
      country: 'AE', currency: 'AED',
      basePrice: round5(inrBase / 23), unit: 'per_hour',
      minDuration: 60, minCharge: round5(inrBase / 23),
      tax: { type: 'VAT', rate: 5, inclusive: true, registrationNumber: '100123456700003' },
      surgeRules: [
        { name: 'Weekend (Fri/Sat)', multiplier: 1.15, daysOfWeek: [5, 6], startHour: 0, endHour: 23, active: true },
      ],
      cities: ['DXB', 'AUH', 'SHJ'],
      active: true,
    },
    {
      country: 'DE', currency: 'EUR',
      basePrice: Math.max(10, Math.round(inrBase / 91)), unit: 'per_hour',
      minDuration: 60, minCharge: Math.max(10, Math.round(inrBase / 91)),
      tax: { type: 'VAT', rate: 19, inclusive: true, registrationNumber: 'DE123456789' },
      surgeRules: [
        { name: 'Sunday', multiplier: 1.4, daysOfWeek: [0], startHour: 0, endHour: 23, active: true },
      ],
      cities: ['BER', 'MUC', 'HAM', 'FRA'],
      active: true,
    },
    {
      country: 'AU', currency: 'AUD',
      basePrice: Math.round(inrBase / 55), unit: 'per_hour',
      minDuration: 60, minCharge: Math.round(inrBase / 55),
      tax: { type: 'GST_AU', rate: 10, inclusive: true, registrationNumber: '12345678901' },
      surgeRules: [
        { name: 'Weekend', multiplier: 1.2, daysOfWeek: [0, 6], startHour: 0, endHour: 23, active: true },
      ],
      cities: ['SYD', 'MEL', 'BNE', 'PER'],
      active: true,
    },
    {
      country: 'US', currency: 'USD',
      basePrice: Math.round(inrBase / 84), unit: 'per_hour',
      minDuration: 60, minCharge: Math.round(inrBase / 84),
      tax: { type: 'SALES_TAX', provider: 'taxjar', inclusive: false, registrationNumber: '12-3456789' },
      surgeRules: [
        { name: 'Weekend', multiplier: 1.15, daysOfWeek: [0, 6], startHour: 0, endHour: 23, active: true },
      ],
      cities: [],
      active: true,
    },
  ];
}

const tech = (...names) => names.map((n) => ({ name: n, required: false }));

// 20 tech services from the PDF — title, multi-lang name + description,
// technologies, and INR base price (1000–1500/hr).
const SERVICES = [
  {
    slug: 'ai-engineers',
    category: 'ai',
    name: {
      en: 'AI Engineers',
      hi: 'AI इंजीनियर',
      ar: 'مهندسو الذكاء الاصطناعي',
      de: 'KI-Ingenieure',
    },
    description: {
      en: 'Production-grade AI engineers for LLM, vision, NLP and predictive systems — from prototype to deployed model.',
      hi: 'LLM, विज़न, NLP और प्रिडिक्टिव सिस्टम के लिए प्रोडक्शन-ग्रेड AI इंजीनियर — प्रोटोटाइप से डिप्लॉयमेंट तक।',
      ar: 'مهندسو ذكاء اصطناعي بمستوى إنتاجي لأنظمة LLM والرؤية والمعالجة اللغوية والتنبؤية.',
      de: 'Produktionsreife KI-Ingenieure für LLM, Vision, NLP und Predictive Systems.',
    },
    technologies: tech('Gen AI Solutions', 'LLM Integration', 'Prompt Engineering', 'Predictive Analytics', 'Computer Vision', 'NLP', 'AI Chatbots', 'ML Engineer', 'Vector Database Developer', 'Vision Engineer', 'RAG Systems'),
    inrBase: 1500,
  },
  {
    slug: 'backend-developers',
    category: 'engineering',
    name: {
      en: 'Backend Developers',
      hi: 'बैकएंड डेवलपर्स',
      ar: 'مطورو الخلفية',
      de: 'Backend-Entwickler',
    },
    description: {
      en: 'Senior backend engineers for REST/GraphQL APIs, microservices, databases and cloud-native deployments.',
      hi: 'REST/GraphQL APIs, माइक्रोसर्विस, डेटाबेस और क्लाउड-नेटिव डिप्लॉयमेंट के लिए सीनियर बैकएंड इंजीनियर।',
      ar: 'مهندسو خلفية متمرسون لواجهات REST/GraphQL والخدمات المصغرة وقواعد البيانات والنشر السحابي.',
      de: 'Senior-Backend-Engineers für REST/GraphQL-APIs, Microservices, Datenbanken und Cloud-native Deployments.',
    },
    technologies: tech('REST API Development', 'GraphQL API Development', 'Database Management', 'Microservices Architecture', 'Server Integration', 'Cloud Functions (Serverless)', 'Authentication Setup', 'Cloud Deployment', 'Data Processing', 'Performance Optimization', 'Component Library'),
    inrBase: 1400,
  },
  {
    slug: 'frontend-development',
    category: 'engineering',
    name: {
      en: 'Frontend Development',
      hi: 'फ्रंटएंड डेवलपमेंट',
      ar: 'تطوير الواجهة الأمامية',
      de: 'Frontend-Entwicklung',
    },
    description: {
      en: 'Modern SPA / PWA / SSR builds in React, Next.js, Vue or Angular — performant, accessible, type-safe.',
      hi: 'React, Next.js, Vue या Angular में मॉडर्न SPA/PWA/SSR — फास्ट, एक्सेसिबल और टाइप-सेफ।',
      ar: 'تطبيقات SPA/PWA/SSR حديثة بـ React وNext.js وVue أو Angular — سريعة وقابلة للوصول وآمنة الأنواع.',
      de: 'Moderne SPA/PWA/SSR mit React, Next.js, Vue oder Angular — performant, barrierefrei, typsicher.',
    },
    technologies: tech('React.js Development', 'Next.js Development', 'Vue.js Development', 'Angular Development', 'Single Page Applications (SPA)', 'PWA (Progressive Web Apps)', 'Web Performance Optimization', 'WordPress Development', 'Magento Development', 'Accessibility Compliance (WCAG)', 'Component Library Development'),
    inrBase: 1200,
  },
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
      en: 'End-to-end product design — wireframes, prototypes, design systems, user journeys for web & mobile.',
      hi: 'वेब और मोबाइल के लिए वायरफ्रेम, प्रोटोटाइप, डिज़ाइन सिस्टम और यूज़र जर्नी — एंड-टू-एंड प्रोडक्ट डिज़ाइन।',
      ar: 'تصميم منتج شامل — Wireframes والنماذج الأولية وأنظمة التصميم لرحلات المستخدم عبر الويب والجوال.',
      de: 'End-to-End-Produktdesign — Wireframes, Prototypen, Design-Systeme und User Journeys für Web & Mobile.',
    },
    technologies: tech('Brand Book', 'Mobile App Design', 'Landing Page Design', 'Wireframe Design', 'Website Design', 'Graphic Design', 'Prototype Design', 'Design System Creation', 'User Journey Mapping', 'Conversion-Focused UX'),
    inrBase: 1100,
  },
  {
    slug: 'it-support',
    category: 'it-services',
    name: {
      en: 'IT Support',
      hi: 'IT सपोर्ट',
      ar: 'دعم تقنية المعلومات',
      de: 'IT-Support',
    },
    description: {
      en: '24/7 L1/L2/L3 help desk, server admin, RMM, VPN/firewall setup, backup and disaster recovery.',
      hi: '24/7 L1/L2/L3 हेल्प डेस्क, सर्वर एडमिन, RMM, VPN/फ़ायरवॉल सेटअप, बैकअप और डिज़ास्टर रिकवरी।',
      ar: 'مكتب مساعدة 24/7 لمستويات L1/L2/L3، إدارة السيرفر، RMM، إعداد VPN/جدار الحماية والنسخ الاحتياطي.',
      de: '24/7 L1/L2/L3 Helpdesk, Serveradministration, RMM, VPN/Firewall-Setup, Backup & Disaster Recovery.',
    },
    technologies: tech('Server Administration', '24/7 Help Desk (L1/L2/L3)', 'Remote Monitoring (RMM)', 'VPN & Firewall Setup', 'Cloud Migration & Support', 'Network Administration', 'Backup & Restore Management', 'Disaster Recovery Planning', 'Hosting & Server Management', 'System Migration & Upgrades'),
    inrBase: 1000,
  },
  {
    slug: 'devops',
    category: 'devops',
    name: {
      en: 'DevOps',
      hi: 'DevOps',
      ar: 'DevOps',
      de: 'DevOps',
    },
    description: {
      en: 'CI/CD pipelines, IaC (Terraform), Docker, Kubernetes, observability — ship safely, scale on demand.',
      hi: 'CI/CD पाइपलाइन, IaC (Terraform), Docker, Kubernetes, ऑब्ज़र्वेबिलिटी — सुरक्षित डिप्लॉय, स्केलेबल।',
      ar: 'خطوط CI/CD وIaC (Terraform) وDocker وKubernetes وقابلية المراقبة — نشر آمن وقابلية التوسع.',
      de: 'CI/CD-Pipelines, IaC (Terraform), Docker, Kubernetes, Observability — sicher deployen, on-demand skalieren.',
    },
    technologies: tech('CI/CD Pipeline Management', 'Infrastructure as Code (IaC)', 'Containerization (Docker)', 'Orchestration (Kubernetes)', 'Log Management', 'Performance Monitoring', 'Migration Engineer', 'Monitoring Specialist', 'Hosting Engineer', 'Scaling Engineer'),
    inrBase: 1400,
  },
  {
    slug: 'content-writing',
    category: 'content',
    name: {
      en: 'Content Writing',
      hi: 'कंटेंट राइटिंग',
      ar: 'كتابة المحتوى',
      de: 'Content Writing',
    },
    description: {
      en: 'Blog posts, technical docs, whitepapers, ad copy and email sequences that rank and convert.',
      hi: 'ब्लॉग पोस्ट, टेक्निकल डॉक्स, वाइटपेपर्स, ऐड कॉपी और ईमेल सीक्वेंस — रैंक और कन्वर्ट करने वाले।',
      ar: 'منشورات المدونة والوثائق الفنية والكتب البيضاء ونصوص الإعلانات وتسلسلات البريد الإلكتروني.',
      de: 'Blogposts, technische Dokus, Whitepaper, Werbetexte und E-Mail-Sequenzen — ranken und konvertieren.',
    },
    technologies: tech('SEO Writing', 'Blog Writing', 'Technical Documentation', 'API Documentation', 'Whitepapers', 'Ad & Sales Copywriting', 'Email Marketing Sequences', 'Newsletter Writing', 'Ebook Writing', 'Social Copywriting'),
    inrBase: 1000,
  },
  {
    slug: 'digital-marketing',
    category: 'marketing',
    name: {
      en: 'Digital Marketing',
      hi: 'डिजिटल मार्केटिंग',
      ar: 'التسويق الرقمي',
      de: 'Digital Marketing',
    },
    description: {
      en: 'SEO, SMM, PPC, influencer & email — full-funnel growth with measurable ROI per channel.',
      hi: 'SEO, SMM, PPC, इन्फ्लुएंसर और ईमेल — मेज़रेबल ROI के साथ फुल-फनल ग्रोथ।',
      ar: 'تحسين محركات البحث ووسائل التواصل والإعلانات المدفوعة والمؤثرين والبريد — نمو شامل بقياس عائد الاستثمار.',
      de: 'SEO, SMM, PPC, Influencer & E-Mail — Full-Funnel-Wachstum mit messbarem ROI pro Kanal.',
    },
    technologies: tech('Search Engine Optimization (SEO)', 'Social Media Marketing (SMM)', 'Influencer Marketing', 'PPC Advertising (Google/Meta Ads)', 'Email Marketing Strategy', 'Content Marketing', 'Performance Marketing', 'Social Marketing', 'CRO Expert', 'Analytics Expert'),
    inrBase: 1100,
  },
  {
    slug: 'quality-assurance',
    category: 'qa',
    name: {
      en: 'Quality Assurance',
      hi: 'क्वालिटी एश्योरेंस',
      ar: 'ضمان الجودة',
      de: 'Qualitätssicherung',
    },
    description: {
      en: 'Manual + automation testing, performance, load, API and database — release with confidence.',
      hi: 'मैन्युअल + ऑटोमेशन टेस्टिंग, परफॉरमेंस, लोड, API और डेटाबेस — कॉन्फिडेंस के साथ रिलीज़।',
      ar: 'اختبارات يدوية + آلية وأداء وحمل وواجهات برمجة التطبيقات وقواعد البيانات — إصدارات بثقة.',
      de: 'Manuelles + Automated Testing, Performance, Load, API und Database — sicher releasen.',
    },
    technologies: tech('Automation Testing', 'Manual Functional Testing', 'User Acceptance Testing (UAT)', 'Performance Testing', 'Load Testing', 'API Testing', 'Database Testing', 'Stress Testing', 'Regression Testing', 'Unit Testing', 'Integration Testing'),
    inrBase: 1200,
  },
  {
    slug: 'mobile-app-development',
    category: 'mobile',
    name: {
      en: 'Mobile App Development',
      hi: 'मोबाइल ऐप डेवलपमेंट',
      ar: 'تطوير تطبيقات الجوال',
      de: 'Mobile App-Entwicklung',
    },
    description: {
      en: 'Cross-platform (Flutter / React Native) and native iOS/Android apps with Store deployment.',
      hi: 'क्रॉस-प्लेटफ़ॉर्म (Flutter/React Native) और नेटिव iOS/Android ऐप्स — Store deployment के साथ।',
      ar: 'تطبيقات مشتركة (Flutter / React Native) ونيتيف iOS/Android مع نشر على المتاجر.',
      de: 'Cross-Plattform (Flutter / React Native) und native iOS/Android-Apps mit Store-Deployment.',
    },
    technologies: tech('Flutter Development', 'React Native Development', 'Native iOS (Swift)', 'Native Android (Kotlin)', 'App Store & Play Store Deployment', 'IoT App Integration', 'AR / VR Mobile Experiences', 'App Store Optimization (ASO)', 'Mobile App Maintenance & Support', 'Tablet & Foldable App Development', 'Wearable App Development'),
    inrBase: 1350,
  },
  {
    slug: 'third-party-integration',
    category: 'integration',
    name: {
      en: 'Third Party Integration',
      hi: 'थर्ड पार्टी इंटीग्रेशन',
      ar: 'تكامل الأطراف الثالثة',
      de: 'Drittanbieter-Integration',
    },
    description: {
      en: 'Payment gateways, SSO, maps, SMS/email, chat, video, calendars, CRM, accounting and logistics APIs.',
      hi: 'पेमेंट गेटवे, SSO, मैप्स, SMS/ईमेल, चैट, वीडियो, कैलेंडर, CRM, अकाउंटिंग और लॉजिस्टिक्स APIs।',
      ar: 'بوابات الدفع وSSO والخرائط والرسائل والبريد والدردشة والفيديو والتقاويم وCRM والمحاسبة واللوجستيات.',
      de: 'Payment-Gateways, SSO, Karten, SMS/Email, Chat, Video, Kalender, CRM, Buchhaltung und Logistik-APIs.',
    },
    technologies: tech('Payment Gateway Integration', 'Social Auth & SSO', 'Map & Geolocation APIs', 'SMS & Email Service Integration', 'Chat SDK Integration', 'Analytics & Crash Reporting', 'Video Conferencing & Streaming', 'Calendar & Scheduling API', 'CRM System Synchronization', 'Accounting & Invoicing', 'Shipping & Logistics', 'Marketplace & E-commerce', 'Customer Support Ticketing'),
    inrBase: 1250,
  },
  {
    slug: 'security-testing',
    category: 'security',
    name: {
      en: 'Security Testing',
      hi: 'सिक्योरिटी टेस्टिंग',
      ar: 'اختبار الأمان',
      de: 'Security Testing',
    },
    description: {
      en: 'VAPT, pen-testing, SAST/DAST/IAST, compliance audits (GDPR/SOC2), red teaming and runtime defence.',
      hi: 'VAPT, पेन-टेस्टिंग, SAST/DAST/IAST, कम्प्लायंस ऑडिट (GDPR/SOC2), रेड टीमिंग और रनटाइम डिफेंस।',
      ar: 'تقييم الثغرات والاختراق وSAST/DAST/IAST وتدقيق الامتثال (GDPR/SOC2) والـRed Teaming والحماية أثناء التشغيل.',
      de: 'VAPT, Pen-Testing, SAST/DAST/IAST, Compliance-Audits (DSGVO/SOC2), Red Teaming und Laufzeitschutz.',
    },
    technologies: tech('Vulnerability Assessment (VAPT)', 'Penetration Testing', 'Compliance Audits (GDPR/SOC2)', 'Static Code Analysis (SAST)', 'DAST (Runtime Scanning)', 'IAST (Hybrid Analysis)', 'SCA (Dependency Scanning)', 'API Security Testing', 'Container Security', 'Mobile App Security (MAST)', 'Cloud Posture (CSPM)', 'Phishing Simulation', 'Red Teaming', 'Runtime Protection (RASP)', 'Secure Backend Architecture'),
    inrBase: 1500,
  },
  {
    slug: 'gen-ai-development',
    category: 'ai',
    name: {
      en: 'Gen AI Development',
      hi: 'Gen AI डेवलपमेंट',
      ar: 'تطوير الذكاء الاصطناعي التوليدي',
      de: 'Gen AI-Entwicklung',
    },
    description: {
      en: 'Custom GPT/Claude/Gemini integrations, RAG systems, vector DBs and ML model fine-tuning for products.',
      hi: 'कस्टम GPT/Claude/Gemini इंटीग्रेशन, RAG सिस्टम, वेक्टर DB और प्रोडक्ट के लिए ML मॉडल फाइन-ट्यूनिंग।',
      ar: 'تكاملات مخصصة GPT/Claude/Gemini وأنظمة RAG وقواعد بيانات Vector وتحسين نماذج ML للمنتجات.',
      de: 'Custom-GPT/Claude/Gemini-Integrationen, RAG-Systeme, Vektor-DBs und ML-Modell-Feintuning.',
    },
    technologies: tech('AI Chatbots (Customer Support, Internal Tools)', 'LLM Integration (OpenAI, Gemini, Claude)', 'Prompt Engineering', 'Predictive Analytics', 'Retrieval-Augmented Generation (RAG) Systems', 'Computer Vision Solutions', 'Natural Language Processing (NLP)', 'Vector Database Development', 'Machine Learning Model Development', 'AI Model Integration into Existing Products'),
    inrBase: 1500,
  },
  {
    slug: 'api-development',
    category: 'engineering',
    name: {
      en: 'API Development',
      hi: 'API डेवलपमेंट',
      ar: 'تطوير واجهات برمجة التطبيقات',
      de: 'API-Entwicklung',
    },
    description: {
      en: 'REST/GraphQL APIs, microservices, OAuth/JWT auth, idempotency, rate-limiting and full OpenAPI docs.',
      hi: 'REST/GraphQL APIs, माइक्रोसर्विस, OAuth/JWT auth, idempotency, rate-limiting और OpenAPI डॉक्स।',
      ar: 'واجهات REST/GraphQL والخدمات المصغرة وOAuth/JWT والـIdempotency وحدود المعدل ووثائق OpenAPI.',
      de: 'REST/GraphQL-APIs, Microservices, OAuth/JWT, Idempotenz, Rate-Limiting und OpenAPI-Docs.',
    },
    technologies: tech('REST API Development', 'GraphQL API Development', 'Microservices Architecture', 'Database Design & Management', 'Authentication & Authorization Setup', 'Server Integration', 'Cloud Functions (Serverless)', 'Data Processing Pipelines', 'Backend Performance Optimization', 'API Documentation'),
    inrBase: 1300,
  },
  {
    slug: 'react-js-development',
    category: 'engineering',
    name: {
      en: 'React.js Development',
      hi: 'React.js डेवलपमेंट',
      ar: 'تطوير React.js',
      de: 'React.js-Entwicklung',
    },
    description: {
      en: 'Production React/Next.js apps with TypeScript, SSR/SSG, state management and Core Web Vitals tuning.',
      hi: 'प्रोडक्शन React/Next.js ऐप्स — TypeScript, SSR/SSG, स्टेट मैनेजमेंट और Core Web Vitals ट्यूनिंग।',
      ar: 'تطبيقات React/Next.js إنتاجية مع TypeScript وSSR/SSG وإدارة الحالة وتحسين Core Web Vitals.',
      de: 'Produktions-React/Next.js-Apps mit TypeScript, SSR/SSG, State Management und Core Web Vitals.',
    },
    technologies: tech('React.js Development', 'Next.js Development', 'Vue.js Development', 'Angular Development', 'Single Page Applications (SPA)', 'Progressive Web Apps (PWA)', 'Web Performance Optimization', 'Accessibility Compliance (WCAG)', 'Component Library Development', 'TypeScript', 'Server-Side Rendering (SSR)'),
    inrBase: 1300,
  },
  {
    slug: 'website-design',
    category: 'design',
    name: {
      en: 'Website Design',
      hi: 'वेबसाइट डिज़ाइन',
      ar: 'تصميم المواقع',
      de: 'Website-Design',
    },
    description: {
      en: 'Brand-aligned websites with modern UI, responsive layouts, conversion-focused UX and design systems.',
      hi: 'ब्रैंड-अलाइन्ड वेबसाइट्स — मॉडर्न UI, रिस्पॉन्सिव लेआउट, कन्वर्ज़न-फ़ोकस्ड UX और डिज़ाइन सिस्टम।',
      ar: 'مواقع متماشية مع الهوية بواجهات حديثة وتصميم متجاوب وUX يركز على التحويل وأنظمة تصميم.',
      de: 'Markenkonforme Websites mit modernem UI, responsivem Layout, konversionsfokussiertem UX und Design-Systemen.',
    },
    technologies: tech('Brand Book Creation', 'Mobile App Design', 'Website Design', 'Landing Page Design', 'Graphic Design', 'UI/UX Design', 'Prototype Design', 'Wireframe Design', 'Company / Investor Deck Design', 'Design System Creation', 'User Journey Mapping', 'Conversion-Focused UX'),
    inrBase: 1100,
  },
  {
    slug: 'it-services',
    category: 'it-services',
    name: {
      en: 'IT Services',
      hi: 'IT सर्विसेज़',
      ar: 'خدمات تقنية المعلومات',
      de: 'IT-Dienstleistungen',
    },
    description: {
      en: 'Managed IT — server admin, RMM, networking, hosting, backups, DR planning and migrations.',
      hi: 'मैनेज्ड IT — सर्वर एडमिन, RMM, नेटवर्किंग, होस्टिंग, बैकअप, DR प्लानिंग और माइग्रेशन।',
      ar: 'خدمات IT مُدارة — إدارة السيرفر وRMM والشبكات والاستضافة والنسخ الاحتياطي والتعافي من الكوارث والترحيل.',
      de: 'Managed IT — Serveradministration, RMM, Networking, Hosting, Backups, DR-Planung und Migrationen.',
    },
    technologies: tech('Server Administration', '24/7 Help Desk (L1/L2/L3)', 'Remote Monitoring & Management (RMM)', 'VPN & Firewall Setup', 'Cloud Migration & Support', 'Network Administration', 'Backup & Restore Management', 'Disaster Recovery Planning', 'Hosting & Server Management', 'System Migration & Upgrades', 'Performance & Health Monitoring', 'Cloud Deployment Support'),
    inrBase: 1050,
  },
  {
    slug: 'ci-cd-pipeline-management',
    category: 'devops',
    name: {
      en: 'CI/CD Pipeline Management',
      hi: 'CI/CD पाइपलाइन मैनेजमेंट',
      ar: 'إدارة CI/CD',
      de: 'CI/CD-Pipeline-Management',
    },
    description: {
      en: 'GitHub Actions, GitLab CI, Jenkins — automated build, test, deploy with rollback and canary releases.',
      hi: 'GitHub Actions, GitLab CI, Jenkins — automated build, test, deploy with rollback aur canary releases.',
      ar: 'GitHub Actions وGitLab CI وJenkins — بناء واختبار ونشر تلقائي مع التراجع والإصدارات الجزئية.',
      de: 'GitHub Actions, GitLab CI, Jenkins — automatisiertes Build/Test/Deploy mit Rollback und Canary-Releases.',
    },
    technologies: tech('CI/CD Pipeline Management', 'Infrastructure as Code (IaC)', 'Containerization (Docker)', 'Orchestration (Kubernetes)', 'Log Management', 'Performance Monitoring', 'Migration Engineer', 'Monitoring Specialist', 'Hosting Engineer', 'Scaling Engineer'),
    inrBase: 1400,
  },
  {
    slug: 'seo',
    category: 'marketing',
    name: {
      en: 'SEO',
      hi: 'SEO',
      ar: 'تحسين محركات البحث',
      de: 'SEO',
    },
    description: {
      en: 'Technical SEO + content + link-building — sustainable organic growth with measurable rankings.',
      hi: 'टेक्निकल SEO + कंटेंट + लिंक-बिल्डिंग — मेज़रेबल रैंकिंग के साथ ऑर्गेनिक ग्रोथ।',
      ar: 'SEO تقني + محتوى + بناء روابط — نمو عضوي مستدام بترتيبات قابلة للقياس.',
      de: 'Technisches SEO + Content + Linkbuilding — nachhaltiges organisches Wachstum mit messbaren Rankings.',
    },
    technologies: tech('SEO Blog Writing', 'Search Engine Optimization (SEO)', 'Social Media Marketing (SMM)', 'Influencer Marketing', 'PPC Advertising (Google/Meta Ads)', 'Email Marketing Strategy', 'Content Marketing', 'Performance Marketing', 'CRO Expert', 'Technical SEO Audits'),
    inrBase: 1000,
  },
  {
    slug: 'blog-writing',
    category: 'content',
    name: {
      en: 'Blog Writing',
      hi: 'ब्लॉग राइटिंग',
      ar: 'كتابة المدونات',
      de: 'Blog-Writing',
    },
    description: {
      en: 'Long-form, well-researched blog content optimised for search and reader engagement.',
      hi: 'लॉन्ग-फ़ॉर्म, अच्छी रिसर्च की हुई ब्लॉग कंटेंट — सर्च और रीडर एंगेजमेंट के लिए ऑप्टिमाइज़्ड।',
      ar: 'محتوى مدونات طويل ومدروس مُحسّن لمحركات البحث وتفاعل القارئ.',
      de: 'Long-Form, gut recherchierte Blogposts, optimiert für Suche und Leser-Engagement.',
    },
    technologies: tech('SEO Writing', 'Blog Writing', 'Technical Documentation', 'API Documentation', 'Whitepapers', 'Ad & Sales Copywriting', 'Email Marketing Sequences', 'Newsletter Writing', 'Ebook Writing', 'Social Copywriting'),
    inrBase: 1000,
  },
];

async function main() {
  await connectDb();
  const db = getDb();
  const col = db.collection('services');

  // Wipe existing
  const removed = await col.deleteMany({});
  logger.info({ removed: removed.deletedCount }, 'Removed existing services');

  // Build full docs
  let sortOrder = 1;
  const docs = SERVICES.map((s) => ({
    slug: s.slug,
    name: s.name,
    description: s.description,
    category: s.category,
    technologies: s.technologies,
    pricing: buildPricing(s.inrBase),
    // Legacy flat fields for back-compat with older clients
    hourlyRate: s.inrBase,
    currency: 'INR',
    minHours: 1,
    maxHours: 24,
    image: `https://placehold.co/600x400?text=${encodeURIComponent(s.name.en.replace(/\s+/g, '+'))}`,
    iconUrl: '',
    sortOrder: sortOrder++,
    active: true,
    createdAt: now,
    updatedAt: now,
  }));

  const r = await col.insertMany(docs);
  logger.info({ inserted: r.insertedCount }, 'Inserted tech services');

  // Verify
  const count = await col.countDocuments({ active: true });
  logger.info({ count }, 'Active services in DB');

  await closeDb();
}

main().catch((e) => {
  logger.error({ err: e.message, stack: e.stack }, 'seed-tech-services failed');
  process.exit(1);
});
