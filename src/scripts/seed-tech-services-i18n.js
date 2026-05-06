// seed-tech-services-i18n.js
//
// Replaces all services with the 20-service tech catalog from the spec PDF,
// with EVERY user-facing string as an i18n object { en, hi, ar, de }.
//
// Frontend's flattenI18nDeep auto-picks the locale from `qh_locale` cookie,
// so any field rendered as `{service.<field>}` will localize automatically.
//
// Run:  node src/scripts/seed-tech-services-i18n.js

import 'dotenv/config';
import { connectDb, getDb, closeDb } from '../config/db.js';
import { logger } from '../config/logger.js';

const now = new Date();

// ─── i18n helpers ──────────────────────────────────────────────────────────
const T = (en, hi, ar, de) => ({ en, hi, ar, de });

// Common phrases shared across services (DRY).
const COMMON = {
  weekendSurge: T(
    'Weekend Surge', 'वीकेंड सर्ज', 'زيادة عطلة نهاية الأسبوع', 'Wochenend-Aufschlag',
  ),
  weekendUAE: T(
    'Weekend (Fri/Sat)', 'वीकेंड (शुक्र/शनि)', 'عطلة نهاية الأسبوع (الجمعة/السبت)', 'Wochenende (Fr/Sa)',
  ),
  sunday: T(
    'Sunday', 'रविवार', 'الأحد', 'Sonntag',
  ),
  weekend: T(
    'Weekend', 'वीकेंड', 'عطلة نهاية الأسبوع', 'Wochenende',
  ),
  category: {
    ai: T('AI & Machine Learning', 'AI और मशीन लर्निंग', 'الذكاء الاصطناعي والتعلم الآلي', 'KI & Machine Learning'),
    engineering: T('Engineering', 'इंजीनियरिंग', 'الهندسة', 'Engineering'),
    design: T('Design', 'डिज़ाइन', 'التصميم', 'Design'),
    'it-services': T('IT Services', 'IT सर्विसेज़', 'خدمات تقنية المعلومات', 'IT-Services'),
    devops: T('DevOps', 'DevOps', 'ديف أوبس', 'DevOps'),
    content: T('Content', 'कंटेंट', 'المحتوى', 'Content'),
    marketing: T('Marketing', 'मार्केटिंग', 'التسويق', 'Marketing'),
    qa: T('Quality Assurance', 'क्वालिटी एश्योरेंस', 'ضمان الجودة', 'Qualitätssicherung'),
    mobile: T('Mobile Development', 'मोबाइल डेवलपमेंट', 'تطوير الجوال', 'Mobile-Entwicklung'),
    integration: T('Integrations', 'इंटीग्रेशन', 'التكاملات', 'Integrationen'),
    security: T('Security', 'सिक्योरिटी', 'الأمان', 'Sicherheit'),
  },
};

// Per-country pricing template — INR base → all 5 currencies, with i18n surge names.
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
        { name: COMMON.weekend, multiplier: 1.15, daysOfWeek: [0, 6], startHour: 0, endHour: 23, active: true },
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
        { name: COMMON.weekendUAE, multiplier: 1.15, daysOfWeek: [5, 6], startHour: 0, endHour: 23, active: true },
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
        { name: COMMON.sunday, multiplier: 1.4, daysOfWeek: [0], startHour: 0, endHour: 23, active: true },
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
        { name: COMMON.weekend, multiplier: 1.2, daysOfWeek: [0, 6], startHour: 0, endHour: 23, active: true },
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
        { name: COMMON.weekend, multiplier: 1.15, daysOfWeek: [0, 6], startHour: 0, endHour: 23, active: true },
      ],
      cities: [],
      active: true,
    },
  ];
}

// Tech-name helper: each entry is an i18n-shaped name. Most tech names are
// loan-words across languages — only the operative word ("Development",
// "Testing", "Optimization") changes. The map below covers every term we use.
const TECH = (key) => {
  const map = {
    // ── AI / ML ─────────────────────────────────────────────────────
    'gen-ai-solutions':                T('Gen AI Solutions',                          'Gen AI सॉल्यूशंस',                          'حلول الذكاء الاصطناعي التوليدي',           'Gen-KI-Lösungen'),
    'llm-integration':                 T('LLM Integration',                           'LLM इंटीग्रेशन',                            'تكامل LLM',                                'LLM-Integration'),
    'llm-integration-providers':       T('LLM Integration (OpenAI, Gemini, Claude)',  'LLM इंटीग्रेशन (OpenAI, Gemini, Claude)',  'تكامل LLM (OpenAI, Gemini, Claude)',      'LLM-Integration (OpenAI, Gemini, Claude)'),
    'prompt-engineering':              T('Prompt Engineering',                        'प्रॉम्प्ट इंजीनियरिंग',                      'هندسة الموجهات',                            'Prompt Engineering'),
    'predictive-analytics':            T('Predictive Analytics',                      'प्रिडिक्टिव एनालिटिक्स',                    'التحليلات التنبؤية',                        'Predictive Analytics'),
    'computer-vision':                 T('Computer Vision',                           'कंप्यूटर विज़न',                            'الرؤية الحاسوبية',                          'Computer Vision'),
    'computer-vision-solutions':       T('Computer Vision Solutions',                 'कंप्यूटर विज़न सॉल्यूशंस',                  'حلول الرؤية الحاسوبية',                     'Computer-Vision-Lösungen'),
    'nlp':                             T('Natural Language Processing (NLP)',         'नेचुरल लैंग्वेज प्रोसेसिंग (NLP)',          'معالجة اللغة الطبيعية (NLP)',              'Natural Language Processing (NLP)'),
    'ai-chatbots':                     T('AI Chatbots',                               'AI चैटबॉट',                                  'روبوتات الدردشة بالذكاء الاصطناعي',         'KI-Chatbots'),
    'ai-chatbots-support':             T('AI Chatbots (Customer Support, Internal Tools)', 'AI चैटबॉट (कस्टमर सपोर्ट, इंटरनल टूल्स)', 'روبوتات الدردشة (دعم العملاء، الأدوات الداخلية)', 'KI-Chatbots (Kundensupport, interne Tools)'),
    'ml-engineer':                     T('ML Engineer',                               'ML इंजीनियर',                                'مهندس تعلم آلي',                            'ML-Engineer'),
    'vector-database-developer':       T('Vector Database Developer',                 'वेक्टर डेटाबेस डेवलपर',                      'مطور قاعدة بيانات Vector',                  'Vector-Datenbank-Entwickler'),
    'vector-database-development':     T('Vector Database Development',               'वेक्टर डेटाबेस डेवलपमेंट',                   'تطوير قاعدة بيانات Vector',                 'Vector-Datenbank-Entwicklung'),
    'vision-engineer':                 T('Vision Engineer',                           'विज़न इंजीनियर',                             'مهندس رؤية',                                'Vision-Engineer'),
    'rag-systems':                     T('RAG Systems',                               'RAG सिस्टम',                                 'أنظمة RAG',                                 'RAG-Systeme'),
    'rag-systems-full':                T('Retrieval-Augmented Generation (RAG) Systems', 'रिट्रीवल-ऑगमेंटेड जनरेशन (RAG) सिस्टम',  'أنظمة RAG (التوليد المعزز بالاسترجاع)',     'Retrieval-Augmented Generation (RAG)'),
    'ml-model-development':            T('Machine Learning Model Development',        'मशीन लर्निंग मॉडल डेवलपमेंट',                'تطوير نماذج التعلم الآلي',                  'Machine-Learning-Modellentwicklung'),
    'ai-model-integration':            T('AI Model Integration into Existing Products','मौजूदा प्रोडक्ट्स में AI मॉडल इंटीग्रेशन',  'دمج نماذج الذكاء الاصطناعي في المنتجات',    'KI-Modell-Integration in bestehende Produkte'),

    // ── Backend / API ───────────────────────────────────────────────
    'rest-api-dev':                    T('REST API Development',                      'REST API डेवलपमेंट',                         'تطوير REST API',                            'REST-API-Entwicklung'),
    'graphql-api-dev':                 T('GraphQL API Development',                   'GraphQL API डेवलपमेंट',                      'تطوير GraphQL API',                         'GraphQL-API-Entwicklung'),
    'database-management':             T('Database Management',                       'डेटाबेस मैनेजमेंट',                          'إدارة قواعد البيانات',                      'Datenbank-Management'),
    'database-design':                 T('Database Design & Management',              'डेटाबेस डिज़ाइन और मैनेजमेंट',                'تصميم وإدارة قواعد البيانات',               'Datenbank-Design & -Management'),
    'microservices-architecture':      T('Microservices Architecture',                'माइक्रोसर्विसेज़ आर्किटेक्चर',                'هندسة الخدمات المصغرة',                     'Microservices-Architektur'),
    'server-integration':              T('Server Integration',                        'सर्वर इंटीग्रेशन',                           'تكامل السيرفر',                             'Server-Integration'),
    'cloud-functions':                 T('Cloud Functions (Serverless)',              'क्लाउड फंक्शंस (Serverless)',                'وظائف السحابة (Serverless)',                'Cloud Functions (Serverless)'),
    'authentication-setup':            T('Authentication Setup',                      'ऑथेंटिकेशन सेटअप',                           'إعداد المصادقة',                            'Authentifizierungs-Setup'),
    'auth-authorization-setup':        T('Authentication & Authorization Setup',      'ऑथेंटिकेशन और ऑथराइज़ेशन सेटअप',             'إعداد المصادقة والتخويل',                   'Authentifizierungs- & Autorisierungs-Setup'),
    'cloud-deployment':                T('Cloud Deployment',                          'क्लाउड डिप्लॉयमेंट',                         'النشر السحابي',                             'Cloud-Deployment'),
    'data-processing':                 T('Data Processing',                           'डेटा प्रोसेसिंग',                            'معالجة البيانات',                           'Datenverarbeitung'),
    'data-processing-pipelines':       T('Data Processing Pipelines',                 'डेटा प्रोसेसिंग पाइपलाइन',                   'خطوط معالجة البيانات',                      'Datenverarbeitungs-Pipelines'),
    'performance-optimization':        T('Performance Optimization',                  'परफॉरमेंस ऑप्टिमाइज़ेशन',                    'تحسين الأداء',                              'Performance-Optimierung'),
    'backend-performance-optimization':T('Backend Performance Optimization',          'बैकएंड परफॉरमेंस ऑप्टिमाइज़ेशन',             'تحسين أداء الخلفية',                        'Backend-Performance-Optimierung'),
    'component-library':               T('Component Library',                         'कंपोनेंट लाइब्रेरी',                         'مكتبة المكونات',                            'Komponenten-Bibliothek'),
    'component-library-dev':           T('Component Library Development',             'कंपोनेंट लाइब्रेरी डेवलपमेंट',                'تطوير مكتبة المكونات',                      'Komponenten-Bibliotheks-Entwicklung'),
    'api-documentation':               T('API Documentation',                         'API डॉक्यूमेंटेशन',                          'توثيق API',                                 'API-Dokumentation'),

    // ── Frontend ────────────────────────────────────────────────────
    'react-dev':                       T('React.js Development',                      'React.js डेवलपमेंट',                         'تطوير React.js',                            'React.js-Entwicklung'),
    'next-dev':                        T('Next.js Development',                       'Next.js डेवलपमेंट',                          'تطوير Next.js',                             'Next.js-Entwicklung'),
    'vue-dev':                         T('Vue.js Development',                        'Vue.js डेवलपमेंट',                           'تطوير Vue.js',                              'Vue.js-Entwicklung'),
    'angular-dev':                     T('Angular Development',                       'Angular डेवलपमेंट',                          'تطوير Angular',                             'Angular-Entwicklung'),
    'spa':                             T('Single Page Applications (SPA)',            'सिंगल पेज ऐप्लिकेशन (SPA)',                  'تطبيقات الصفحة الواحدة (SPA)',              'Single-Page-Applications (SPA)'),
    'pwa':                             T('Progressive Web Apps (PWA)',                'प्रोग्रेसिव वेब ऐप्स (PWA)',                  'تطبيقات الويب التقدمية (PWA)',              'Progressive Web Apps (PWA)'),
    'web-perf-opt':                    T('Web Performance Optimization',              'वेब परफॉरमेंस ऑप्टिमाइज़ेशन',                'تحسين أداء الويب',                          'Web-Performance-Optimierung'),
    'wordpress-dev':                   T('WordPress Development',                     'WordPress डेवलपमेंट',                        'تطوير WordPress',                           'WordPress-Entwicklung'),
    'magento-dev':                     T('Magento Development',                       'Magento डेवलपमेंट',                          'تطوير Magento',                             'Magento-Entwicklung'),
    'a11y-wcag':                       T('Accessibility Compliance (WCAG)',           'एक्सेसिबिलिटी कम्प्लायंस (WCAG)',            'الامتثال للوصول (WCAG)',                    'Barrierefreiheit (WCAG)'),
    'typescript':                      T('TypeScript',                                'TypeScript',                                  'TypeScript',                                'TypeScript'),
    'ssr':                             T('Server-Side Rendering (SSR)',               'सर्वर-साइड रेंडरिंग (SSR)',                  'العرض من جانب السيرفر (SSR)',               'Server-Side Rendering (SSR)'),

    // ── Design ──────────────────────────────────────────────────────
    'brand-book':                      T('Brand Book',                                'ब्रैंड बुक',                                 'كتاب الهوية',                               'Brand Book'),
    'brand-book-creation':             T('Brand Book Creation',                       'ब्रैंड बुक क्रिएशन',                         'إنشاء كتاب الهوية',                         'Brand-Book-Erstellung'),
    'mobile-app-design':               T('Mobile App Design',                         'मोबाइल ऐप डिज़ाइन',                          'تصميم تطبيقات الجوال',                      'Mobile-App-Design'),
    'landing-page-design':             T('Landing Page Design',                       'लैंडिंग पेज डिज़ाइन',                        'تصميم صفحة الهبوط',                         'Landingpage-Design'),
    'wireframe-design':                T('Wireframe Design',                          'वायरफ्रेम डिज़ाइन',                          'تصميم Wireframe',                           'Wireframe-Design'),
    'website-design':                  T('Website Design',                            'वेबसाइट डिज़ाइन',                            'تصميم المواقع',                             'Website-Design'),
    'graphic-design':                  T('Graphic Design',                            'ग्राफिक डिज़ाइन',                            'التصميم الجرافيكي',                         'Grafikdesign'),
    'prototype-design':                T('Prototype Design',                          'प्रोटोटाइप डिज़ाइन',                         'تصميم النموذج الأولي',                      'Prototyp-Design'),
    'design-system':                   T('Design System Creation',                    'डिज़ाइन सिस्टम क्रिएशन',                      'إنشاء نظام التصميم',                        'Design-System-Erstellung'),
    'user-journey-mapping':            T('User Journey Mapping',                      'यूज़र जर्नी मैपिंग',                          'رسم رحلة المستخدم',                         'User-Journey-Mapping'),
    'cro-ux':                          T('Conversion-Focused UX',                     'कन्वर्जन-फ़ोकस्ड UX',                        'UX يركز على التحويل',                       'Conversion-fokussiertes UX'),
    'investor-deck-design':            T('Company / Investor Deck Design',            'कंपनी / इन्वेस्टर डेक डिज़ाइन',               'تصميم عرض الشركة / المستثمر',               'Investor-Deck-Design'),
    'ui-ux-design':                    T('UI/UX Design',                              'UI/UX डिज़ाइन',                              'تصميم UI/UX',                               'UI/UX-Design'),

    // ── IT Support / Services ───────────────────────────────────────
    'server-admin':                    T('Server Administration',                     'सर्वर एडमिनिस्ट्रेशन',                       'إدارة السيرفر',                             'Serveradministration'),
    'help-desk-247':                   T('24/7 Help Desk (L1/L2/L3)',                 '24/7 हेल्प डेस्क (L1/L2/L3)',                'مكتب مساعدة 24/7 (L1/L2/L3)',              '24/7-Helpdesk (L1/L2/L3)'),
    'rmm':                             T('Remote Monitoring (RMM)',                   'रिमोट मॉनिटरिंग (RMM)',                       'المراقبة عن بعد (RMM)',                    'Remote Monitoring (RMM)'),
    'rmm-mgmt':                        T('Remote Monitoring & Management (RMM)',      'रिमोट मॉनिटरिंग और मैनेजमेंट (RMM)',         'المراقبة والإدارة عن بعد (RMM)',           'Remote Monitoring & Management (RMM)'),
    'vpn-firewall':                    T('VPN & Firewall Setup',                      'VPN और फ़ायरवॉल सेटअप',                       'إعداد VPN وجدار الحماية',                   'VPN- & Firewall-Einrichtung'),
    'cloud-migration':                 T('Cloud Migration & Support',                 'क्लाउड माइग्रेशन और सपोर्ट',                  'الترحيل والدعم السحابي',                    'Cloud-Migration & Support'),
    'network-admin':                   T('Network Administration',                    'नेटवर्क एडमिनिस्ट्रेशन',                      'إدارة الشبكة',                              'Netzwerkadministration'),
    'backup-restore':                  T('Backup & Restore Management',               'बैकअप और रिस्टोर मैनेजमेंट',                 'إدارة النسخ الاحتياطي والاستعادة',          'Backup- & Restore-Management'),
    'disaster-recovery':               T('Disaster Recovery Planning',                'डिज़ास्टर रिकवरी प्लानिंग',                   'تخطيط التعافي من الكوارث',                  'Disaster-Recovery-Planung'),
    'hosting-server':                  T('Hosting & Server Management',               'होस्टिंग और सर्वर मैनेजमेंट',                 'إدارة الاستضافة والسيرفر',                  'Hosting- & Server-Management'),
    'system-migration':                T('System Migration & Upgrades',               'सिस्टम माइग्रेशन और अपग्रेड',                 'ترحيل وترقية الأنظمة',                      'Systemmigration & Upgrades'),
    'health-monitoring':               T('Performance & Health Monitoring',           'परफॉरमेंस और हेल्थ मॉनिटरिंग',                'مراقبة الأداء والصحة',                      'Performance- & Health-Monitoring'),
    'cloud-deployment-support':        T('Cloud Deployment Support',                  'क्लाउड डिप्लॉयमेंट सपोर्ट',                   'دعم النشر السحابي',                         'Cloud-Deployment-Support'),

    // ── DevOps / CI/CD ──────────────────────────────────────────────
    'cicd':                            T('CI/CD Pipeline Management',                 'CI/CD पाइपलाइन मैनेजमेंट',                   'إدارة CI/CD',                               'CI/CD-Pipeline-Management'),
    'iac':                             T('Infrastructure as Code (IaC)',              'इंफ्रास्ट्रक्चर ऐज़ कोड (IaC)',               'البنية التحتية كرمز (IaC)',                'Infrastructure as Code (IaC)'),
    'docker':                          T('Containerization (Docker)',                 'कंटेनराइज़ेशन (Docker)',                      'الحاويات (Docker)',                         'Containerisierung (Docker)'),
    'k8s':                             T('Orchestration (Kubernetes)',                'ऑर्केस्ट्रेशन (Kubernetes)',                  'التنسيق (Kubernetes)',                      'Orchestrierung (Kubernetes)'),
    'log-management':                  T('Log Management',                            'लॉग मैनेजमेंट',                                'إدارة السجلات',                             'Log-Management'),
    'perf-monitoring':                 T('Performance Monitoring',                    'परफॉरमेंस मॉनिटरिंग',                          'مراقبة الأداء',                             'Performance-Monitoring'),
    'migration-engineer':              T('Migration Engineer',                        'माइग्रेशन इंजीनियर',                            'مهندس ترحيل',                               'Migrations-Engineer'),
    'monitoring-specialist':           T('Monitoring Specialist',                     'मॉनिटरिंग स्पेशलिस्ट',                         'أخصائي مراقبة',                             'Monitoring-Spezialist'),
    'hosting-engineer':                T('Hosting Engineer',                          'होस्टिंग इंजीनियर',                            'مهندس استضافة',                             'Hosting-Engineer'),
    'scaling-engineer':                T('Scaling Engineer',                          'स्केलिंग इंजीनियर',                            'مهندس توسعة',                                'Scaling-Engineer'),

    // ── Content / Writing ───────────────────────────────────────────
    'seo-writing':                     T('SEO Writing',                               'SEO राइटिंग',                                  'كتابة SEO',                                 'SEO-Writing'),
    'seo-blog-writing':                T('SEO Blog Writing',                          'SEO ब्लॉग राइटिंग',                            'كتابة مدونات SEO',                          'SEO-Blog-Writing'),
    'blog-writing':                    T('Blog Writing',                              'ब्लॉग राइटिंग',                                'كتابة المدونات',                             'Blog-Writing'),
    'tech-docs':                       T('Technical Documentation',                   'टेक्निकल डॉक्यूमेंटेशन',                       'الوثائق التقنية',                           'Technische Dokumentation'),
    'whitepapers':                     T('Whitepapers',                               'वाइटपेपर्स',                                   'الأوراق البيضاء',                            'Whitepapers'),
    'ad-copy':                         T('Ad & Sales Copywriting',                    'ऐड और सेल्स कॉपीराइटिंग',                       'كتابة إعلانات ومبيعات',                     'Werbe- & Verkaufstexte'),
    'email-sequences':                 T('Email Marketing Sequences',                 'ईमेल मार्केटिंग सीक्वेंस',                      'تسلسلات البريد الإلكتروني',                  'E-Mail-Marketing-Sequenzen'),
    'newsletter-writing':              T('Newsletter Writing',                        'न्यूज़लेटर राइटिंग',                            'كتابة الرسائل الإخبارية',                   'Newsletter-Writing'),
    'ebook-writing':                   T('Ebook Writing',                             'ईबुक राइटिंग',                                 'كتابة الكتب الإلكترونية',                   'Ebook-Writing'),
    'social-copywriting':              T('Social Copywriting',                        'सोशल कॉपीराइटिंग',                              'الكتابة لوسائل التواصل',                    'Social-Copywriting'),

    // ── Marketing ───────────────────────────────────────────────────
    'seo':                             T('Search Engine Optimization (SEO)',          'सर्च इंजन ऑप्टिमाइज़ेशन (SEO)',                'تحسين محركات البحث (SEO)',                  'Suchmaschinenoptimierung (SEO)'),
    'smm':                             T('Social Media Marketing (SMM)',              'सोशल मीडिया मार्केटिंग (SMM)',                  'تسويق وسائل التواصل (SMM)',                 'Social-Media-Marketing (SMM)'),
    'influencer-marketing':            T('Influencer Marketing',                      'इन्फ्लुएंसर मार्केटिंग',                        'التسويق عبر المؤثرين',                      'Influencer-Marketing'),
    'ppc':                             T('PPC Advertising (Google/Meta Ads)',         'PPC ऐडवर्टाइज़िंग (Google/Meta Ads)',          'إعلانات الدفع لكل نقرة (Google/Meta)',      'PPC-Werbung (Google/Meta Ads)'),
    'email-marketing':                 T('Email Marketing Strategy',                  'ईमेल मार्केटिंग स्ट्रैटजी',                      'استراتيجية البريد الإلكتروني',              'E-Mail-Marketing-Strategie'),
    'content-marketing':               T('Content Marketing',                         'कंटेंट मार्केटिंग',                             'تسويق المحتوى',                              'Content-Marketing'),
    'performance-marketing':           T('Performance Marketing',                     'परफॉरमेंस मार्केटिंग',                          'تسويق الأداء',                               'Performance-Marketing'),
    'social-marketing':                T('Social Marketing',                          'सोशल मार्केटिंग',                                'التسويق الاجتماعي',                          'Social-Marketing'),
    'cro':                             T('CRO Expert',                                'CRO एक्सपर्ट',                                  'خبير CRO',                                   'CRO-Experte'),
    'analytics-expert':                T('Analytics Expert',                          'एनालिटिक्स एक्सपर्ट',                            'خبير التحليلات',                             'Analytics-Experte'),
    'tech-seo':                        T('Technical SEO Audits',                      'टेक्निकल SEO ऑडिट',                              'تدقيق SEO تقني',                             'Technische SEO-Audits'),

    // ── QA ──────────────────────────────────────────────────────────
    'automation-testing':              T('Automation Testing',                        'ऑटोमेशन टेस्टिंग',                              'الاختبار الآلي',                             'Automatisiertes Testing'),
    'manual-testing':                  T('Manual Functional Testing',                 'मैन्युअल फंक्शनल टेस्टिंग',                      'الاختبار الوظيفي اليدوي',                    'Manuelles Funktions-Testing'),
    'uat':                             T('User Acceptance Testing (UAT)',             'यूज़र एक्सेप्टेंस टेस्टिंग (UAT)',               'اختبار قبول المستخدم (UAT)',                'User Acceptance Testing (UAT)'),
    'performance-testing':             T('Performance Testing',                       'परफॉरमेंस टेस्टिंग',                             'اختبار الأداء',                              'Performance-Testing'),
    'load-testing':                    T('Load Testing',                              'लोड टेस्टिंग',                                   'اختبار التحميل',                             'Lasttest'),
    'api-testing':                     T('API Testing',                               'API टेस्टिंग',                                  'اختبار API',                                 'API-Testing'),
    'database-testing':                T('Database Testing',                          'डेटाबेस टेस्टिंग',                               'اختبار قواعد البيانات',                      'Datenbank-Testing'),
    'stress-testing':                  T('Stress Testing',                            'स्ट्रेस टेस्टिंग',                               'اختبار الضغط',                                'Stress-Testing'),
    'regression-testing':              T('Regression Testing',                        'रिग्रेशन टेस्टिंग',                              'اختبار الانحدار',                             'Regressionstest'),
    'unit-testing':                    T('Unit Testing',                              'यूनिट टेस्टिंग',                                'اختبار الوحدة',                               'Unit-Testing'),
    'integration-testing':             T('Integration Testing',                       'इंटीग्रेशन टेस्टिंग',                            'اختبار التكامل',                              'Integrations-Testing'),

    // ── Mobile ──────────────────────────────────────────────────────
    'flutter-dev':                     T('Flutter Development',                       'Flutter डेवलपमेंट',                              'تطوير Flutter',                              'Flutter-Entwicklung'),
    'rn-dev':                          T('React Native Development',                  'React Native डेवलपमेंट',                          'تطوير React Native',                          'React-Native-Entwicklung'),
    'ios-swift':                       T('Native iOS (Swift)',                        'नेटिव iOS (Swift)',                              'iOS الأصلي (Swift)',                          'Natives iOS (Swift)'),
    'android-kotlin':                  T('Native Android (Kotlin)',                   'नेटिव Android (Kotlin)',                          'Android الأصلي (Kotlin)',                     'Natives Android (Kotlin)'),
    'app-store-deploy':                T('App Store & Play Store Deployment',         'App Store और Play Store डिप्लॉयमेंट',           'نشر متجر التطبيقات و Play Store',            'App-Store- & Play-Store-Deployment'),
    'iot-app':                         T('IoT App Integration',                       'IoT ऐप इंटीग्रेशन',                              'تكامل تطبيقات IoT',                           'IoT-App-Integration'),
    'ar-vr':                           T('AR / VR Mobile Experiences',                'AR / VR मोबाइल अनुभव',                            'تجارب AR / VR للجوال',                        'AR/VR-Mobile-Experiences'),
    'aso':                             T('App Store Optimization (ASO)',              'ऐप स्टोर ऑप्टिमाइज़ेशन (ASO)',                    'تحسين متجر التطبيقات (ASO)',                  'App-Store-Optimization (ASO)'),
    'mobile-maintenance':              T('Mobile App Maintenance & Support',          'मोबाइल ऐप मेंटेनेंस और सपोर्ट',                    'صيانة ودعم تطبيقات الجوال',                   'Mobile-App-Wartung & -Support'),
    'tablet-foldable':                 T('Tablet & Foldable App Development',         'टैबलेट और फ़ोल्डेबल ऐप डेवलपमेंट',                  'تطوير تطبيقات الأجهزة اللوحية والقابلة للطي',  'Tablet- & Foldable-App-Entwicklung'),
    'wearable':                        T('Wearable App Development',                  'वियरेबल ऐप डेवलपमेंट',                              'تطوير تطبيقات الأجهزة القابلة للارتداء',       'Wearable-App-Entwicklung'),

    // ── 3rd-party Integration ───────────────────────────────────────
    'payment-gateway':                 T('Payment Gateway Integration',               'पेमेंट गेटवे इंटीग्रेशन',                          'تكامل بوابات الدفع',                          'Payment-Gateway-Integration'),
    'social-auth-sso':                 T('Social Auth & SSO',                         'सोशल ऑथ और SSO',                                  'المصادقة الاجتماعية و SSO',                   'Social Auth & SSO'),
    'maps-geo':                        T('Map & Geolocation APIs',                    'मैप और जियो-लोकेशन APIs',                          'واجهات الخرائط والموقع الجغرافي',             'Map- & Geolocation-APIs'),
    'sms-email':                       T('SMS & Email Service Integration',           'SMS और ईमेल सर्विस इंटीग्रेशन',                     'تكامل خدمات SMS والبريد الإلكتروني',          'SMS- & E-Mail-Service-Integration'),
    'chat-sdk':                        T('Chat SDK Integration',                      'चैट SDK इंटीग्रेशन',                               'تكامل SDK الدردشة',                           'Chat-SDK-Integration'),
    'analytics-crash':                 T('Analytics & Crash Reporting',               'एनालिटिक्स और क्रैश रिपोर्टिंग',                   'التحليلات والإبلاغ عن الأعطال',               'Analytics & Crash-Reporting'),
    'video-streaming':                 T('Video Conferencing & Streaming',            'वीडियो कॉन्फ्रेंसिंग और स्ट्रीमिंग',                'مؤتمرات الفيديو والبث',                        'Video-Conferencing & Streaming'),
    'calendar-api':                    T('Calendar & Scheduling API',                 'कैलेंडर और शेड्यूलिंग API',                          'API التقويم والجدولة',                        'Kalender- & Scheduling-API'),
    'crm-sync':                        T('CRM System Synchronization',                'CRM सिस्टम सिंक्रोनाइज़ेशन',                        'مزامنة نظام CRM',                              'CRM-System-Synchronisation'),
    'accounting-invoicing':            T('Accounting & Invoicing',                    'अकाउंटिंग और इनवॉइसिंग',                            'المحاسبة والفوترة',                            'Buchhaltung & Rechnungsstellung'),
    'shipping-logistics':              T('Shipping & Logistics',                      'शिपिंग और लॉजिस्टिक्स',                              'الشحن والخدمات اللوجستية',                     'Versand & Logistik'),
    'marketplace-ecom':                T('Marketplace & E-commerce',                  'मार्केटप्लेस और ई-कॉमर्स',                           'الأسواق والتجارة الإلكترونية',                 'Marketplace & E-Commerce'),
    'support-ticketing':               T('Customer Support Ticketing',                'कस्टमर सपोर्ट टिकटिंग',                             'تذاكر دعم العملاء',                            'Kundensupport-Ticketing'),

    // ── Security ────────────────────────────────────────────────────
    'vapt':                            T('Vulnerability Assessment (VAPT)',           'वल्नरबिलिटी असेसमेंट (VAPT)',                       'تقييم الثغرات (VAPT)',                        'Schwachstellenbewertung (VAPT)'),
    'pentesting':                      T('Penetration Testing',                       'पेनिट्रेशन टेस्टिंग',                                'اختبار الاختراق',                              'Penetrationstest'),
    'compliance':                      T('Compliance Audits (GDPR/SOC2)',             'कम्प्लायंस ऑडिट (GDPR/SOC2)',                        'تدقيق الامتثال (GDPR/SOC2)',                  'Compliance-Audits (DSGVO/SOC2)'),
    'sast':                            T('Static Code Analysis (SAST)',               'स्टैटिक कोड एनालिसिस (SAST)',                        'التحليل الثابت للكود (SAST)',                 'Static Code Analysis (SAST)'),
    'dast':                            T('DAST (Runtime Scanning)',                   'DAST (रनटाइम स्कैनिंग)',                              'DAST (الفحص أثناء التشغيل)',                  'DAST (Laufzeit-Scanning)'),
    'iast':                            T('IAST (Hybrid Analysis)',                    'IAST (हाइब्रिड एनालिसिस)',                            'IAST (التحليل الهجين)',                       'IAST (Hybride Analyse)'),
    'sca':                             T('SCA (Dependency Scanning)',                 'SCA (डिपेंडेंसी स्कैनिंग)',                            'SCA (فحص التبعيات)',                          'SCA (Dependency-Scanning)'),
    'api-security':                    T('API Security Testing',                      'API सिक्योरिटी टेस्टिंग',                              'اختبار أمان API',                              'API-Sicherheits-Testing'),
    'container-security':              T('Container Security',                        'कंटेनर सिक्योरिटी',                                   'أمان الحاويات',                                'Container-Sicherheit'),
    'mast':                            T('Mobile App Security (MAST)',                'मोबाइल ऐप सिक्योरिटी (MAST)',                          'أمان تطبيقات الجوال (MAST)',                  'Mobile-App-Sicherheit (MAST)'),
    'cspm':                            T('Cloud Posture (CSPM)',                      'क्लाउड पोस्चर (CSPM)',                                 'وضع الأمان السحابي (CSPM)',                   'Cloud Posture (CSPM)'),
    'phishing-sim':                    T('Phishing Simulation',                       'फ़िशिंग सिमुलेशन',                                     'محاكاة التصيد الاحتيالي',                      'Phishing-Simulation'),
    'red-team':                        T('Red Teaming',                               'रेड टीमिंग',                                         'Red Teaming',                                 'Red Teaming'),
    'rasp':                            T('Runtime Protection (RASP)',                 'रनटाइम प्रोटेक्शन (RASP)',                            'الحماية أثناء التشغيل (RASP)',                'Runtime-Schutz (RASP)'),
    'secure-backend':                  T('Secure Backend Architecture',               'सिक्योर बैकएंड आर्किटेक्चर',                          'بنية الخلفية الآمنة',                         'Sichere Backend-Architektur'),
  };
  return map[key];
};

// Tech list helper — wrap names as {name: i18n, required}.
const techs = (...keys) => keys.map((k) => ({ name: TECH(k), required: false }));

// ─── 20 Services with full i18n ───────────────────────────────────────────
const SERVICES = [
  {
    slug: 'ai-engineers',
    cat: 'ai',
    name: T('AI Engineers', 'AI इंजीनियर', 'مهندسو الذكاء الاصطناعي', 'KI-Ingenieure'),
    tagline: T(
      'Production-grade AI from prototype to deployed model.',
      'प्रोटोटाइप से प्रोडक्शन तक — डिप्लॉय्ड AI मॉडल्स।',
      'ذكاء اصطناعي بمستوى إنتاجي من النموذج الأولي إلى النشر.',
      'Produktionsreife KI vom Prototyp bis zum deployten Modell.',
    ),
    description: T(
      'Senior AI engineers for LLMs, computer vision, NLP and predictive analytics — we own the full lifecycle from data prep to deployment, monitoring and continuous evaluation.',
      'LLM, कंप्यूटर विज़न, NLP और प्रिडिक्टिव एनालिटिक्स के लिए सीनियर AI इंजीनियर — डेटा प्रेप से लेकर डिप्लॉयमेंट, मॉनिटरिंग और लगातार मूल्यांकन तक पूरा जीवन-चक्र।',
      'مهندسو ذكاء اصطناعي متمرسون لأنظمة LLM والرؤية والمعالجة اللغوية والتحليلات التنبؤية — نتولى دورة الحياة الكاملة من إعداد البيانات إلى النشر والمراقبة والتقييم المستمر.',
      'Senior-KI-Ingenieure für LLMs, Computer Vision, NLP und Predictive Analytics — wir verantworten den gesamten Lebenszyklus von Datenaufbereitung bis Deployment und kontinuierlicher Evaluation.',
    ),
    highlights: [
      T('Custom model training and fine-tuning', 'कस्टम मॉडल ट्रेनिंग और फाइन-ट्यूनिंग', 'تدريب وضبط دقيق للنماذج المخصصة', 'Eigenes Training und Fine-Tuning'),
      T('Vector DBs, RAG and semantic search', 'वेक्टर DBs, RAG और सिमेंटिक सर्च', 'قواعد بيانات Vector وRAG والبحث الدلالي', 'Vektor-DBs, RAG und semantische Suche'),
      T('Production deployment on AWS / GCP', 'AWS / GCP पर प्रोडक्शन डिप्लॉयमेंट', 'نشر إنتاجي على AWS / GCP', 'Produktions-Deployment auf AWS / GCP'),
      T('Continuous monitoring and re-training', 'कंटिन्यूअस मॉनिटरिंग और रि-ट्रेनिंग', 'المراقبة وإعادة التدريب المستمرة', 'Kontinuierliches Monitoring & Re-Training'),
    ],
    inclusions: [
      T('Discovery & data audit', 'डिस्कवरी और डेटा ऑडिट', 'اكتشاف وتدقيق البيانات', 'Discovery & Daten-Audit'),
      T('Model selection or fine-tuning', 'मॉडल सेलेक्शन या फाइन-ट्यूनिंग', 'اختيار النماذج أو الضبط الدقيق', 'Modellauswahl oder Fine-Tuning'),
      T('Inference API + auth', 'इंफरेंस API + ऑथ', 'API الاستدلال + المصادقة', 'Inferenz-API + Auth'),
      T('Evaluation reports', 'मूल्यांकन रिपोर्ट्स', 'تقارير التقييم', 'Auswertungsberichte'),
    ],
    notIncluded: [
      T('Hosting / GPU infrastructure costs', 'होस्टिंग / GPU इंफ्रास्ट्रक्चर लागत', 'تكاليف الاستضافة / البنية التحتية لـ GPU', 'Hosting- / GPU-Infrastrukturkosten'),
      T('Third-party API usage charges', 'थर्ड-पार्टी API यूज़ेज चार्जेज़', 'رسوم استخدام واجهات برمجة التطبيقات الخارجية', 'Drittanbieter-API-Nutzungsgebühren'),
    ],
    faq: [
      {
        question: T('Which models do you work with?', 'आप कौन से मॉडल्स के साथ काम करते हैं?', 'مع أي نماذج تعملون؟', 'Mit welchen Modellen arbeiten Sie?'),
        answer:   T('GPT-4, Claude, Gemini, Llama 3, Mistral, plus open-source CV/NLP models.', 'GPT-4, Claude, Gemini, Llama 3, Mistral, और open-source CV/NLP मॉडल्स।', 'GPT-4 و Claude و Gemini و Llama 3 و Mistral، بالإضافة إلى نماذج CV/NLP مفتوحة المصدر.', 'GPT-4, Claude, Gemini, Llama 3, Mistral plus Open-Source-CV/NLP-Modelle.'),
      },
      {
        question: T('Do you handle data privacy compliance?', 'क्या आप डेटा प्राइवेसी कम्प्लायंस संभालते हैं?', 'هل تتعاملون مع الامتثال لخصوصية البيانات؟', 'Behandeln Sie Datenschutz-Compliance?'),
        answer:   T('Yes — GDPR, HIPAA, SOC 2 friendly architectures with on-prem options where required.', 'हाँ — GDPR, HIPAA, SOC 2 फ्रेंडली आर्किटेक्चर, जहाँ ज़रूरी हो वहाँ on-prem options भी।', 'نعم — هياكل متوافقة مع GDPR و HIPAA و SOC 2 مع خيارات داخل المؤسسة عند الحاجة.', 'Ja — DSGVO-, HIPAA-, SOC-2-konforme Architekturen mit On-Prem-Optionen.'),
      },
    ],
    technologies: techs('gen-ai-solutions','llm-integration','prompt-engineering','predictive-analytics','computer-vision','nlp','ai-chatbots','ml-engineer','vector-database-developer','vision-engineer','rag-systems'),
    inrBase: 1500,
  },
  {
    slug: 'backend-developers',
    cat: 'engineering',
    name: T('Backend Developers', 'बैकएंड डेवलपर्स', 'مطورو الخلفية', 'Backend-Entwickler'),
    tagline: T('Battle-tested APIs, databases and cloud-native services.', 'अनुभवी APIs, डेटाबेस और क्लाउड-नेटिव सर्विसेज़।', 'واجهات وقواعد بيانات وخدمات سحابية مجربة.', 'Erprobte APIs, Datenbanken und Cloud-Services.'),
    description: T(
      'Senior backend engineers building REST/GraphQL APIs, microservices, and high-throughput data pipelines on Node, Python or Go — designed for scale, observability and security from day one.',
      'Node, Python या Go पर REST/GraphQL APIs, माइक्रोसर्विसेज़ और हाई-थ्रूपुट डेटा पाइपलाइन बनाने वाले सीनियर बैकएंड इंजीनियर — स्केल, ऑब्ज़र्वेबिलिटी और सिक्योरिटी पहले दिन से।',
      'مهندسو خلفية متمرسون يبنون واجهات REST/GraphQL وخدمات مصغرة وخطوط بيانات عالية الإنتاجية على Node أو Python أو Go.',
      'Senior-Backend-Engineers für REST/GraphQL-APIs, Microservices und High-Throughput-Datenpipelines auf Node, Python oder Go.',
    ),
    highlights: [
      T('REST + GraphQL with full OpenAPI / SDL docs', 'REST + GraphQL — पूरी OpenAPI / SDL डॉक्स के साथ', 'REST + GraphQL مع وثائق OpenAPI/SDL كاملة', 'REST + GraphQL mit vollständigen OpenAPI/SDL-Docs'),
      T('Postgres, MongoDB, Redis, Elasticsearch', 'Postgres, MongoDB, Redis, Elasticsearch', 'Postgres و MongoDB و Redis و Elasticsearch', 'Postgres, MongoDB, Redis, Elasticsearch'),
      T('JWT/OAuth, rate-limiting, idempotency', 'JWT/OAuth, रेट-लिमिटिंग, idempotency', 'JWT/OAuth وحدود المعدل و Idempotency', 'JWT/OAuth, Rate-Limiting, Idempotenz'),
      T('Cloud-native deployment (AWS/GCP/Azure)', 'क्लाउड-नेटिव डिप्लॉयमेंट (AWS/GCP/Azure)', 'نشر سحابي (AWS/GCP/Azure)', 'Cloud-natives Deployment (AWS/GCP/Azure)'),
    ],
    inclusions: [
      T('API design and OpenAPI spec', 'API डिज़ाइन और OpenAPI स्पेक', 'تصميم API ومواصفات OpenAPI', 'API-Design und OpenAPI-Spec'),
      T('Database schema and migrations', 'डेटाबेस स्कीमा और माइग्रेशन', 'مخطط قاعدة البيانات والترحيل', 'Datenbank-Schema und Migrationen'),
      T('Auth, rate-limit, error handling', 'ऑथ, रेट-लिमिट, एरर हैंडलिंग', 'المصادقة وحدود المعدل ومعالجة الأخطاء', 'Auth, Rate-Limit, Fehlerbehandlung'),
      T('Tests + CI pipeline setup', 'टेस्ट्स + CI पाइपलाइन सेटअप', 'اختبارات + إعداد خط CI', 'Tests + CI-Pipeline-Setup'),
    ],
    notIncluded: [
      T('Frontend / UI work', 'फ्रंटएंड / UI काम', 'أعمال الواجهة الأمامية / UI', 'Frontend- / UI-Arbeiten'),
      T('Cloud bill / infra costs', 'क्लाउड बिल / इंफ्रा लागत', 'فاتورة السحابة / تكاليف البنية', 'Cloud-Rechnung / Infra-Kosten'),
    ],
    faq: [
      {
        question: T('Which language stacks do you cover?', 'आप कौन से लैंग्वेज स्टैक कवर करते हैं?', 'ما هي حزم اللغات التي تغطونها؟', 'Welche Sprachstacks decken Sie ab?'),
        answer:   T('Node.js (TypeScript), Python (FastAPI/Django), Go (Gin/Fiber), Java (Spring).', 'Node.js (TypeScript), Python (FastAPI/Django), Go (Gin/Fiber), Java (Spring)।', 'Node.js (TypeScript)، Python (FastAPI/Django)، Go (Gin/Fiber)، Java (Spring).', 'Node.js (TypeScript), Python (FastAPI/Django), Go (Gin/Fiber), Java (Spring).'),
      },
    ],
    technologies: techs('rest-api-dev','graphql-api-dev','database-management','microservices-architecture','server-integration','cloud-functions','authentication-setup','cloud-deployment','data-processing','performance-optimization','component-library'),
    inrBase: 1400,
  },
  {
    slug: 'frontend-development',
    cat: 'engineering',
    name: T('Frontend Development', 'फ्रंटएंड डेवलपमेंट', 'تطوير الواجهة الأمامية', 'Frontend-Entwicklung'),
    tagline: T('Fast, accessible, type-safe modern web apps.', 'फ़ास्ट, एक्सेसिबल, टाइप-सेफ मॉडर्न वेब ऐप्स।', 'تطبيقات ويب حديثة سريعة وقابلة للوصول وآمنة الأنواع.', 'Schnelle, barrierefreie, typsichere moderne Web-Apps.'),
    description: T(
      'SPA, PWA and SSR/SSG builds in React, Next.js, Vue or Angular — focused on Core Web Vitals, WCAG accessibility and design-system reuse.',
      'React, Next.js, Vue या Angular में SPA, PWA और SSR/SSG बिल्ड्स — Core Web Vitals, WCAG एक्सेसिबिलिटी और डिज़ाइन-सिस्टम रीयूज़ पर फ़ोकस।',
      'تطبيقات SPA و PWA و SSR/SSG في React و Next.js و Vue أو Angular — مع التركيز على Core Web Vitals وإمكانية الوصول WCAG وإعادة استخدام نظام التصميم.',
      'SPA-, PWA- und SSR/SSG-Builds in React, Next.js, Vue oder Angular — mit Fokus auf Core Web Vitals, WCAG und Design-System-Reuse.',
    ),
    highlights: [
      T('Core Web Vitals score 90+', 'Core Web Vitals स्कोर 90+', 'نقاط Core Web Vitals 90+', 'Core Web Vitals Score 90+'),
      T('WCAG 2.1 AA accessibility', 'WCAG 2.1 AA एक्सेसिबिलिटी', 'إمكانية الوصول WCAG 2.1 AA', 'WCAG 2.1 AA Barrierefreiheit'),
      T('TypeScript-first', 'TypeScript-फ़र्स्ट', 'TypeScript أولاً', 'TypeScript-first'),
      T('Reusable component library', 'रीयूज़ेबल कंपोनेंट लाइब्रेरी', 'مكتبة مكونات قابلة لإعادة الاستخدام', 'Wiederverwendbare Komponenten-Bibliothek'),
    ],
    inclusions: [
      T('UI implementation from designs', 'डिज़ाइन से UI इम्प्लीमेंटेशन', 'تنفيذ واجهة المستخدم من التصاميم', 'UI-Umsetzung aus Designs'),
      T('Routing, state management, forms', 'राउटिंग, स्टेट मैनेजमेंट, फॉर्म्स', 'التوجيه وإدارة الحالة والنماذج', 'Routing, State-Management, Formulare'),
      T('API integration', 'API इंटीग्रेशन', 'تكامل API', 'API-Integration'),
      T('Performance and a11y audits', 'परफॉरमेंस और a11y ऑडिट', 'تدقيق الأداء وإمكانية الوصول', 'Performance- und a11y-Audits'),
    ],
    notIncluded: [
      T('Design / UX wireframes', 'डिज़ाइन / UX वायरफ्रेम', 'تصميم / Wireframes UX', 'Design / UX-Wireframes'),
      T('Backend APIs', 'बैकएंड APIs', 'واجهات الخلفية', 'Backend-APIs'),
    ],
    faq: [
      {
        question: T('Do you write tests?', 'क्या आप टेस्ट लिखते हैं?', 'هل تكتبون اختبارات؟', 'Schreiben Sie Tests?'),
        answer:   T('Yes — Jest/Vitest unit, Playwright e2e, with CI integration.', 'हाँ — Jest/Vitest unit, Playwright e2e, CI integration के साथ।', 'نعم — Jest/Vitest وحدة، Playwright e2e، مع تكامل CI.', 'Ja — Jest/Vitest Unit, Playwright e2e, mit CI-Integration.'),
      },
    ],
    technologies: techs('react-dev','next-dev','vue-dev','angular-dev','spa','pwa','web-perf-opt','wordpress-dev','magento-dev','a11y-wcag','component-library-dev'),
    inrBase: 1200,
  },
  {
    slug: 'ui-ux-designer',
    cat: 'design',
    name: T('UI/UX Designer', 'UI/UX डिज़ाइनर', 'مصمم UI/UX', 'UI/UX-Designer'),
    tagline: T('Research-led product design that converts.', 'रिसर्च-लेड प्रोडक्ट डिज़ाइन जो कन्वर्ट करता है।', 'تصميم منتج قائم على البحث ويحقق التحويل.', 'Forschungsgeleitetes Produktdesign, das konvertiert.'),
    description: T(
      'End-to-end product design covering user research, wireframes, prototypes, design systems and usability testing — for web and mobile.',
      'यूज़र रिसर्च, वायरफ्रेम, प्रोटोटाइप, डिज़ाइन सिस्टम और usability testing कवर करता एंड-टू-एंड प्रोडक्ट डिज़ाइन — वेब और मोबाइल के लिए।',
      'تصميم منتج شامل يغطي بحث المستخدم وWireframes والنماذج الأولية وأنظمة التصميم واختبار قابلية الاستخدام — للويب والجوال.',
      'End-to-End-Produktdesign — User Research, Wireframes, Prototypen, Design-Systeme und Usability-Tests für Web und Mobile.',
    ),
    highlights: [
      T('User research and journey mapping', 'यूज़र रिसर्च और जर्नी मैपिंग', 'بحث المستخدم ورسم الرحلة', 'User Research und Journey Mapping'),
      T('Figma design systems', 'Figma डिज़ाइन सिस्टम', 'أنظمة تصميم Figma', 'Figma Design-Systeme'),
      T('Interactive prototypes', 'इंटरैक्टिव प्रोटोटाइप', 'النماذج الأولية التفاعلية', 'Interaktive Prototypen'),
      T('Conversion-focused UX', 'कन्वर्ज़न-फ़ोकस्ड UX', 'UX يركز على التحويل', 'Conversion-fokussiertes UX'),
    ],
    inclusions: [
      T('Discovery + competitive audit', 'डिस्कवरी + कम्पटीटिव ऑडिट', 'استكشاف + تدقيق تنافسي', 'Discovery + Wettbewerbs-Audit'),
      T('Wireframes and hi-fi mockups', 'वायरफ्रेम और हाई-फ़ाई मॉकअप्स', 'Wireframes ونماذج عالية الدقة', 'Wireframes und Hi-Fi-Mockups'),
      T('Clickable prototype', 'क्लिकेबल प्रोटोटाइप', 'نموذج أولي قابل للنقر', 'Klickbarer Prototyp'),
      T('Style guide / design tokens', 'स्टाइल गाइड / डिज़ाइन टोकन', 'دليل النمط / رموز التصميم', 'Style Guide / Design Tokens'),
    ],
    notIncluded: [
      T('Code implementation', 'कोड इम्प्लीमेंटेशन', 'تنفيذ الكود', 'Code-Umsetzung'),
      T('Marketing copy', 'मार्केटिंग कॉपी', 'النسخة التسويقية', 'Marketing-Texte'),
    ],
    faq: [
      {
        question: T('Do you provide source files?', 'क्या आप सोर्स फाइलें देते हैं?', 'هل تقدمون ملفات المصدر؟', 'Stellen Sie Quelldateien bereit?'),
        answer:   T('Yes — full Figma file with all components and design tokens.', 'हाँ — सभी कंपोनेंट और डिज़ाइन टोकन के साथ पूरी Figma फ़ाइल।', 'نعم — ملف Figma كامل بجميع المكونات ورموز التصميم.', 'Ja — vollständige Figma-Datei mit allen Komponenten und Design Tokens.'),
      },
    ],
    technologies: techs('brand-book','mobile-app-design','landing-page-design','wireframe-design','website-design','graphic-design','prototype-design','design-system','user-journey-mapping','cro-ux'),
    inrBase: 1100,
  },
  {
    slug: 'it-support',
    cat: 'it-services',
    name: T('IT Support', 'IT सपोर्ट', 'دعم تقنية المعلومات', 'IT-Support'),
    tagline: T('24/7 help desk and infrastructure operations.', '24/7 हेल्प डेस्क और इंफ्रास्ट्रक्चर ऑपरेशन्स।', 'مكتب مساعدة 24/7 وعمليات البنية التحتية.', '24/7 Helpdesk und Infrastruktur-Betrieb.'),
    description: T(
      'Round-the-clock L1/L2/L3 help desk, server administration, network operations, VPN/firewall management, backups and disaster recovery — for offices, SaaS and remote teams.',
      '24/7 L1/L2/L3 हेल्प डेस्क, सर्वर एडमिन, नेटवर्क ऑप्स, VPN/फ़ायरवॉल मैनेजमेंट, बैकअप और डिज़ास्टर रिकवरी — ऑफिस, SaaS और रिमोट टीम्स के लिए।',
      'مكتب مساعدة L1/L2/L3 على مدار الساعة، إدارة السيرفر، عمليات الشبكة، إدارة VPN/جدار الحماية، النسخ الاحتياطي والتعافي من الكوارث.',
      'L1/L2/L3-Helpdesk rund um die Uhr, Serveradministration, Netzwerkbetrieb, VPN/Firewall, Backups und Disaster Recovery.',
    ),
    highlights: [
      T('SLA-backed response times', 'SLA-बैक्ड रिस्पॉन्स टाइम्स', 'أوقات استجابة مدعومة بـ SLA', 'SLA-abgesicherte Reaktionszeiten'),
      T('Multi-channel support (chat/email/phone)', 'मल्टी-चैनल सपोर्ट (चैट/ईमेल/फ़ोन)', 'دعم متعدد القنوات (دردشة/بريد/هاتف)', 'Multi-Channel-Support'),
      T('Proactive monitoring (RMM)', 'प्रोएक्टिव मॉनिटरिंग (RMM)', 'مراقبة استباقية (RMM)', 'Proaktives Monitoring (RMM)'),
      T('Ticketing & runbooks included', 'टिकटिंग और रनबुक शामिल', 'التذاكر وأدلة التشغيل مشمولة', 'Ticketing & Runbooks inklusive'),
    ],
    inclusions: [
      T('Onboarding and asset inventory', 'ऑनबोर्डिंग और एसेट इन्वेंटरी', 'الإعداد وجرد الأصول', 'Onboarding und Asset-Inventar'),
      T('Help desk tier 1 + 2 + 3', 'हेल्प डेस्क tier 1 + 2 + 3', 'مكتب مساعدة tier 1 + 2 + 3', 'Helpdesk Tier 1 + 2 + 3'),
      T('Patch management', 'पैच मैनेजमेंट', 'إدارة التصحيحات', 'Patch-Management'),
      T('Monthly health report', 'मंथली हेल्थ रिपोर्ट', 'تقرير صحة شهري', 'Monatlicher Health-Report'),
    ],
    notIncluded: [
      T('Hardware procurement', 'हार्डवेयर खरीदारी', 'شراء الأجهزة', 'Hardware-Beschaffung'),
      T('On-site visits (extra)', 'ऑन-साइट विज़िट (अतिरिक्त)', 'زيارات في الموقع (إضافية)', 'Vor-Ort-Besuche (extra)'),
    ],
    faq: [
      {
        question: T('What is your response SLA?', 'आपका रिस्पॉन्स SLA क्या है?', 'ما هو SLA الاستجابة لديكم؟', 'Wie ist Ihre Reaktions-SLA?'),
        answer:   T('Critical: 15 min · High: 1 h · Medium: 4 h · Low: next business day.', 'क्रिटिकल: 15 मिनट · हाई: 1 घंटा · मीडियम: 4 घंटे · लो: अगला बिज़नेस डे।', 'حرج: 15 دقيقة · مرتفع: ساعة · متوسط: 4 ساعات · منخفض: يوم العمل التالي.', 'Kritisch: 15 Min · Hoch: 1 h · Mittel: 4 h · Niedrig: nächster Werktag.'),
      },
    ],
    technologies: techs('server-admin','help-desk-247','rmm','vpn-firewall','cloud-migration','network-admin','backup-restore','disaster-recovery','hosting-server','system-migration'),
    inrBase: 1000,
  },
];

// 15 more services kept compact (only essential i18n fields). The frontend
// flatten works regardless of how many sub-fields are i18n.
const COMPACT_SERVICES = [
  {
    slug: 'devops', cat: 'devops',
    name: T('DevOps', 'DevOps', 'DevOps', 'DevOps'),
    tagline: T('CI/CD, IaC and observability — ship safely.', 'CI/CD, IaC और observability — सुरक्षित डिप्लॉय।', 'CI/CD وIaC وقابلية المراقبة — نشر آمن.', 'CI/CD, IaC und Observability — sicher deployen.'),
    description: T(
      'Pipeline automation with GitHub Actions/GitLab/Jenkins, IaC with Terraform, container orchestration on Kubernetes, plus full-stack observability.',
      'GitHub Actions/GitLab/Jenkins से पाइपलाइन ऑटोमेशन, Terraform से IaC, Kubernetes पर कंटेनर ऑर्केस्ट्रेशन, और फुल-स्टैक observability।',
      'أتمتة خطوط الأنابيب مع GitHub Actions/GitLab/Jenkins، IaC باستخدام Terraform، تنسيق الحاويات على Kubernetes، والمراقبة الشاملة.',
      'Pipeline-Automatisierung mit GitHub Actions/GitLab/Jenkins, IaC mit Terraform, Container-Orchestrierung auf Kubernetes plus Full-Stack-Observability.',
    ),
    technologies: techs('cicd','iac','docker','k8s','log-management','perf-monitoring','migration-engineer','monitoring-specialist','hosting-engineer','scaling-engineer'),
    inrBase: 1400,
  },
  {
    slug: 'content-writing', cat: 'content',
    name: T('Content Writing', 'कंटेंट राइटिंग', 'كتابة المحتوى', 'Content Writing'),
    tagline: T('SEO-friendly content that ranks and converts.', 'SEO-फ्रेंडली कंटेंट जो रैंक और कन्वर्ट करता है।', 'محتوى صديق لـ SEO يحقق ترتيبات وتحويلات.', 'SEO-freundlicher Content, der rankt und konvertiert.'),
    description: T(
      'Blog posts, technical docs, whitepapers, ad copy and email sequences crafted for engagement and search visibility.',
      'इंगेजमेंट और सर्च विज़िबिलिटी के लिए तैयार किए गए ब्लॉग पोस्ट, टेक्निकल डॉक्स, वाइटपेपर्स, ऐड कॉपी और ईमेल सीक्वेंस।',
      'منشورات مدونات وثائق تقنية وأوراق بيضاء ونصوص إعلانية وتسلسلات بريد إلكتروني للتفاعل وظهور البحث.',
      'Blogposts, technische Dokus, Whitepaper, Werbetexte und E-Mail-Sequenzen für Engagement und Sichtbarkeit.',
    ),
    technologies: techs('seo-writing','blog-writing','tech-docs','api-documentation','whitepapers','ad-copy','email-sequences','newsletter-writing','ebook-writing','social-copywriting'),
    inrBase: 1000,
  },
  {
    slug: 'digital-marketing', cat: 'marketing',
    name: T('Digital Marketing', 'डिजिटल मार्केटिंग', 'التسويق الرقمي', 'Digital Marketing'),
    tagline: T('Full-funnel growth with measurable ROI.', 'मेज़रेबल ROI के साथ फुल-फनल ग्रोथ।', 'نمو شامل بقياس عائد الاستثمار.', 'Full-Funnel-Wachstum mit messbarem ROI.'),
    description: T(
      'SEO, SMM, PPC, influencer outreach and email marketing — campaigns built to generate qualified leads and measurable revenue.',
      'SEO, SMM, PPC, इन्फ्लुएंसर आउटरीच और ईमेल मार्केटिंग — qualified leads और मेज़रेबल रेवेन्यू के लिए बनाए कैम्पेन।',
      'SEO و SMM و PPC والمؤثرين والبريد الإلكتروني — حملات مصممة لتوليد عملاء محتملين وإيرادات قابلة للقياس.',
      'SEO, SMM, PPC, Influencer und E-Mail-Marketing — Kampagnen für qualifizierte Leads und messbaren Umsatz.',
    ),
    technologies: techs('seo','smm','influencer-marketing','ppc','email-marketing','content-marketing','performance-marketing','social-marketing','cro','analytics-expert'),
    inrBase: 1100,
  },
  {
    slug: 'quality-assurance', cat: 'qa',
    name: T('Quality Assurance', 'क्वालिटी एश्योरेंस', 'ضمان الجودة', 'Qualitätssicherung'),
    tagline: T('Manual + automation testing — release with confidence.', 'मैन्युअल + ऑटोमेशन टेस्टिंग — कॉन्फिडेंस के साथ रिलीज़।', 'اختبارات يدوية + آلية — إصدار بثقة.', 'Manuelles + Automated Testing — sicher releasen.'),
    description: T(
      'Comprehensive QA across functional, regression, performance, load, API, database and security testing — tightly integrated into your CI/CD.',
      'फंक्शनल, रिग्रेशन, परफॉरमेंस, लोड, API, डेटाबेस और सिक्योरिटी टेस्टिंग — आपके CI/CD में टाइट इंटीग्रेटेड।',
      'ضمان جودة شامل عبر الوظيفي والانحدار والأداء والحمل وواجهات برمجة التطبيقات وقواعد البيانات والأمان.',
      'Umfassende QA — Funktion, Regression, Performance, Load, API, DB, Security — direkt in Ihre CI/CD integriert.',
    ),
    technologies: techs('automation-testing','manual-testing','uat','performance-testing','load-testing','api-testing','database-testing','stress-testing','regression-testing','unit-testing','integration-testing'),
    inrBase: 1200,
  },
  {
    slug: 'mobile-app-development', cat: 'mobile',
    name: T('Mobile App Development', 'मोबाइल ऐप डेवलपमेंट', 'تطوير تطبيقات الجوال', 'Mobile-App-Entwicklung'),
    tagline: T('Cross-platform and native — iOS, Android, web.', 'क्रॉस-प्लेटफ़ॉर्म और नेटिव — iOS, Android, वेब।', 'متعدد المنصات وأصلي — iOS و Android والويب.', 'Cross-Platform und Native — iOS, Android, Web.'),
    description: T(
      'Flutter / React Native cross-platform builds plus native Swift / Kotlin apps with App Store and Play Store deployment, ASO and post-launch support.',
      'Flutter / React Native क्रॉस-प्लेटफ़ॉर्म + नेटिव Swift / Kotlin ऐप्स — App Store/Play Store deployment, ASO और post-launch सपोर्ट के साथ।',
      'Flutter / React Native متعدد المنصات + تطبيقات Swift / Kotlin أصلية مع نشر على المتاجر و ASO ودعم بعد الإطلاق.',
      'Flutter / React Native Cross-Platform + native Swift / Kotlin Apps mit Store-Deployment, ASO und Post-Launch-Support.',
    ),
    technologies: techs('flutter-dev','rn-dev','ios-swift','android-kotlin','app-store-deploy','iot-app','ar-vr','aso','mobile-maintenance','tablet-foldable','wearable'),
    inrBase: 1350,
  },
  {
    slug: 'third-party-integration', cat: 'integration',
    name: T('Third Party Integration', 'थर्ड पार्टी इंटीग्रेशन', 'تكامل الأطراف الثالثة', 'Drittanbieter-Integration'),
    tagline: T('Connect any service into your stack.', 'कोई भी सर्विस आपके स्टैक में कनेक्ट करें।', 'صل أي خدمة بمنظومتك.', 'Verbinden Sie jeden Service mit Ihrem Stack.'),
    description: T(
      'Payments, SSO, maps, SMS/email, chat, video, calendars, CRM, accounting, shipping and ticketing — production integrations with retries, webhooks and error tracking.',
      'पेमेंट, SSO, मैप्स, SMS/ईमेल, चैट, वीडियो, कैलेंडर, CRM, अकाउंटिंग, शिपिंग और टिकटिंग — रिट्राइज़, वेबहुक्स और एरर ट्रैकिंग के साथ प्रोडक्शन इंटीग्रेशन।',
      'الدفع و SSO والخرائط والرسائل والبريد والدردشة والفيديو والتقاويم وCRM والمحاسبة والشحن والتذاكر — مع إعادة المحاولة و Webhooks وتتبع الأخطاء.',
      'Zahlungen, SSO, Karten, SMS/E-Mail, Chat, Video, Kalender, CRM, Buchhaltung, Versand und Ticketing — produktionsreife Integrationen mit Retries, Webhooks und Error-Tracking.',
    ),
    technologies: techs('payment-gateway','social-auth-sso','maps-geo','sms-email','chat-sdk','analytics-crash','video-streaming','calendar-api','crm-sync','accounting-invoicing','shipping-logistics','marketplace-ecom','support-ticketing'),
    inrBase: 1250,
  },
  {
    slug: 'security-testing', cat: 'security',
    name: T('Security Testing', 'सिक्योरिटी टेस्टिंग', 'اختبار الأمان', 'Security Testing'),
    tagline: T('Find vulnerabilities before attackers do.', 'अटैकर्स से पहले vulnerabilities खोजें।', 'اكتشاف الثغرات قبل المهاجمين.', 'Schwachstellen finden, bevor Angreifer sie nutzen.'),
    description: T(
      'VAPT, pen-testing, SAST/DAST/IAST, compliance audits (GDPR/SOC2), red teaming, runtime defence and secure architecture reviews.',
      'VAPT, पेन-टेस्टिंग, SAST/DAST/IAST, कम्प्लायंस ऑडिट (GDPR/SOC2), रेड टीमिंग, रनटाइम डिफेंस और सिक्योर आर्किटेक्चर रिव्यू।',
      'VAPT والاختراق و SAST/DAST/IAST وتدقيق الامتثال (GDPR/SOC2) و Red Teaming وحماية وقت التشغيل ومراجعة البنية الآمنة.',
      'VAPT, Pen-Testing, SAST/DAST/IAST, Compliance-Audits (DSGVO/SOC2), Red Teaming, Laufzeitschutz und sichere Architektur-Reviews.',
    ),
    technologies: techs('vapt','pentesting','compliance','sast','dast','iast','sca','api-security','container-security','mast','cspm','phishing-sim','red-team','rasp','secure-backend'),
    inrBase: 1500,
  },
  {
    slug: 'gen-ai-development', cat: 'ai',
    name: T('Gen AI Development', 'Gen AI डेवलपमेंट', 'تطوير الذكاء الاصطناعي التوليدي', 'Gen AI-Entwicklung'),
    tagline: T('Custom GPT/Claude/Gemini integrations and RAG.', 'कस्टम GPT/Claude/Gemini इंटीग्रेशन और RAG।', 'تكاملات مخصصة GPT/Claude/Gemini و RAG.', 'Custom GPT/Claude/Gemini-Integrationen und RAG.'),
    description: T(
      'Production-ready Gen-AI features — chatbots, RAG search, vector DBs, fine-tuning and seamless integration into your existing product.',
      'प्रोडक्शन-रेडी Gen-AI फ़ीचर्स — चैटबॉट्स, RAG search, वेक्टर DB, fine-tuning और आपके मौजूदा प्रोडक्ट में सहज इंटीग्रेशन।',
      'ميزات Gen-AI جاهزة للإنتاج — روبوتات دردشة وبحث RAG وقواعد بيانات Vector وضبط دقيق وتكامل سلس في منتجك الحالي.',
      'Produktionsreife Gen-AI-Features — Chatbots, RAG-Suche, Vektor-DBs, Fine-Tuning und nahtlose Integration in Ihr Produkt.',
    ),
    technologies: techs('ai-chatbots-support','llm-integration-providers','prompt-engineering','predictive-analytics','rag-systems-full','computer-vision-solutions','nlp','vector-database-development','ml-model-development','ai-model-integration'),
    inrBase: 1500,
  },
  {
    slug: 'api-development', cat: 'engineering',
    name: T('API Development', 'API डेवलपमेंट', 'تطوير واجهات برمجة التطبيقات', 'API-Entwicklung'),
    tagline: T('Robust REST and GraphQL APIs at scale.', 'स्केल पर रोबस्ट REST और GraphQL APIs।', 'واجهات REST و GraphQL قوية على نطاق واسع.', 'Robuste REST- und GraphQL-APIs im großen Maßstab.'),
    description: T(
      'API-first design with OAuth/JWT, idempotency, rate-limiting, schema validation and full OpenAPI documentation.',
      'OAuth/JWT, idempotency, rate-limiting, schema validation और पूरी OpenAPI डॉक्यूमेंटेशन के साथ API-first डिज़ाइन।',
      'تصميم API أولاً مع OAuth/JWT و Idempotency وحدود المعدل والتحقق من المخطط ووثائق OpenAPI كاملة.',
      'API-First-Design mit OAuth/JWT, Idempotenz, Rate-Limiting, Schema-Validierung und vollständigen OpenAPI-Docs.',
    ),
    technologies: techs('rest-api-dev','graphql-api-dev','microservices-architecture','database-design','auth-authorization-setup','server-integration','cloud-functions','data-processing-pipelines','backend-performance-optimization','api-documentation'),
    inrBase: 1300,
  },
  {
    slug: 'react-js-development', cat: 'engineering',
    name: T('React.js Development', 'React.js डेवलपमेंट', 'تطوير React.js', 'React.js-Entwicklung'),
    tagline: T('Production React/Next.js with TypeScript and SSR.', 'TypeScript और SSR के साथ प्रोडक्शन React/Next.js।', 'React/Next.js للإنتاج مع TypeScript و SSR.', 'Produktions-React/Next.js mit TypeScript und SSR.'),
    description: T(
      'Modern React + Next.js builds with App Router, Server Components, edge functions, comprehensive testing and Core Web Vitals tuning.',
      'App Router, Server Components, edge functions, comprehensive testing और Core Web Vitals ट्यूनिंग के साथ मॉडर्न React + Next.js बिल्ड्स।',
      'بنى React + Next.js حديثة مع App Router و Server Components ووظائف Edge واختبارات شاملة وتحسين Core Web Vitals.',
      'Moderne React- und Next.js-Builds mit App Router, Server Components, Edge Functions, umfassenden Tests und Core Web Vitals.',
    ),
    technologies: techs('react-dev','next-dev','vue-dev','angular-dev','spa','pwa','web-perf-opt','a11y-wcag','component-library-dev','typescript','ssr'),
    inrBase: 1300,
  },
  {
    slug: 'website-design', cat: 'design',
    name: T('Website Design', 'वेबसाइट डिज़ाइन', 'تصميم المواقع', 'Website-Design'),
    tagline: T('Brand-aligned, conversion-driven websites.', 'ब्रैंड-अलाइन्ड, कन्वर्ज़न-ड्रिवन वेबसाइट्स।', 'مواقع متماشية مع الهوية ومركزة على التحويل.', 'Markenkonforme, konversionsorientierte Websites.'),
    description: T(
      'Modern responsive websites with strong information architecture, accessible design and CRO-first layouts that turn visitors into customers.',
      'स्ट्रॉन्ग information architecture, accessible डिज़ाइन और CRO-first लेआउट के साथ मॉडर्न responsive वेबसाइट्स।',
      'مواقع حديثة متجاوبة بهيكل معلومات قوي وتصميم قابل للوصول وتخطيطات تركز على CRO تحول الزوار إلى عملاء.',
      'Moderne responsive Websites mit klarer IA, barrierefreiem Design und CRO-fokussierten Layouts.',
    ),
    technologies: techs('brand-book-creation','mobile-app-design','website-design','landing-page-design','graphic-design','ui-ux-design','prototype-design','wireframe-design','investor-deck-design','design-system','user-journey-mapping','cro-ux'),
    inrBase: 1100,
  },
  {
    slug: 'it-services', cat: 'it-services',
    name: T('IT Services', 'IT सर्विसेज़', 'خدمات تقنية المعلومات', 'IT-Dienstleistungen'),
    tagline: T('End-to-end managed IT operations.', 'एंड-टू-एंड मैनेज्ड IT ऑपरेशन्स।', 'عمليات IT مُدارة شاملة.', 'End-to-End Managed IT.'),
    description: T(
      'Managed IT — server admin, RMM, networking, hosting, backups, DR planning, system migrations and continuous health monitoring.',
      'मैनेज्ड IT — सर्वर एडमिन, RMM, नेटवर्किंग, होस्टिंग, बैकअप, DR प्लानिंग, सिस्टम माइग्रेशन और कंटिन्यूअस हेल्थ मॉनिटरिंग।',
      'IT مُدارة — إدارة السيرفر و RMM والشبكات والاستضافة والنسخ الاحتياطي وتخطيط DR وترحيل الأنظمة ومراقبة الصحة المستمرة.',
      'Managed IT — Serveradministration, RMM, Networking, Hosting, Backups, DR-Planung, Systemmigration und kontinuierliches Health-Monitoring.',
    ),
    technologies: techs('server-admin','help-desk-247','rmm-mgmt','vpn-firewall','cloud-migration','network-admin','backup-restore','disaster-recovery','hosting-server','system-migration','health-monitoring','cloud-deployment-support'),
    inrBase: 1050,
  },
  {
    slug: 'ci-cd-pipeline-management', cat: 'devops',
    name: T('CI/CD Pipeline Management', 'CI/CD पाइपलाइन मैनेजमेंट', 'إدارة CI/CD', 'CI/CD-Pipeline-Management'),
    tagline: T('Automated build, test, deploy with rollback.', 'ऑटोमेटेड बिल्ड, टेस्ट, डिप्लॉय with rollback।', 'بناء واختبار ونشر تلقائي مع التراجع.', 'Automatisches Build/Test/Deploy mit Rollback.'),
    description: T(
      'GitHub Actions, GitLab CI or Jenkins pipelines with canary releases, automated rollbacks and full observability of every deploy.',
      'GitHub Actions, GitLab CI या Jenkins पाइपलाइन — canary releases, automated rollbacks और हर डिप्लॉय की पूरी observability।',
      'خطوط GitHub Actions أو GitLab CI أو Jenkins مع إصدارات Canary وتراجع تلقائي ومراقبة كاملة لكل نشر.',
      'GitHub Actions-, GitLab-CI- oder Jenkins-Pipelines mit Canary-Releases, automatischen Rollbacks und vollständiger Observability.',
    ),
    technologies: techs('cicd','iac','docker','k8s','log-management','perf-monitoring','migration-engineer','monitoring-specialist','hosting-engineer','scaling-engineer'),
    inrBase: 1400,
  },
  {
    slug: 'seo', cat: 'marketing',
    name: T('SEO', 'SEO', 'تحسين محركات البحث', 'SEO'),
    tagline: T('Sustainable organic growth with measurable rankings.', 'मेज़रेबल रैंकिंग के साथ स्थिर ऑर्गेनिक ग्रोथ।', 'نمو عضوي مستدام بترتيبات قابلة للقياس.', 'Nachhaltiges organisches Wachstum mit messbaren Rankings.'),
    description: T(
      'Technical SEO audits, on-page optimization, content strategy, link building and Core Web Vitals tuning for measurable organic growth.',
      'टेक्निकल SEO ऑडिट, on-page ऑप्टिमाइज़ेशन, कंटेंट स्ट्रैटजी, लिंक बिल्डिंग और Core Web Vitals ट्यूनिंग।',
      'تدقيق SEO تقني وتحسين على الصفحة واستراتيجية المحتوى وبناء الروابط وتحسين Core Web Vitals.',
      'Technische SEO-Audits, On-Page-Optimierung, Content-Strategie, Linkbuilding und Core Web Vitals.',
    ),
    technologies: techs('seo-blog-writing','seo','smm','influencer-marketing','ppc','email-marketing','content-marketing','performance-marketing','cro','tech-seo'),
    inrBase: 1000,
  },
  {
    slug: 'blog-writing', cat: 'content',
    name: T('Blog Writing', 'ब्लॉग राइटिंग', 'كتابة المدونات', 'Blog-Writing'),
    tagline: T('Long-form blogs that rank and engage.', 'लॉन्ग-फ़ॉर्म ब्लॉग्स जो रैंक और एंगेज करते हैं।', 'مدونات طويلة تحقق ترتيبات وتفاعل.', 'Long-Form-Blogs, die ranken und engagieren.'),
    description: T(
      'Well-researched, long-form blog content optimized for search intent, reader engagement and conversion CTAs.',
      'सर्च इंटेंट, रीडर एंगेजमेंट और कन्वर्ज़न CTAs के लिए ऑप्टिमाइज़्ड well-researched long-form ब्लॉग कंटेंट।',
      'محتوى مدونات طويل ومدروس ومُحسّن لنية البحث وتفاعل القارئ ودعوات التحويل.',
      'Gut recherchierte Long-Form-Blogs, optimiert für Search Intent, Engagement und Conversion-CTAs.',
    ),
    technologies: techs('seo-writing','blog-writing','tech-docs','api-documentation','whitepapers','ad-copy','email-sequences','newsletter-writing','ebook-writing','social-copywriting'),
    inrBase: 1000,
  },
];

// Default empty arrays for compact services so frontend doesn't break.
const EMPTY_DEFAULTS = {
  highlights: [], inclusions: [], notIncluded: [], faq: [],
};

// ─── Main ────────────────────────────────────────────────────────────────
async function main() {
  await connectDb();
  const db = getDb();
  const col = db.collection('services');

  const removed = await col.deleteMany({});
  logger.info({ removed: removed.deletedCount }, 'Removed existing services');

  const allServices = [
    ...SERVICES,
    ...COMPACT_SERVICES.map((s) => ({ ...EMPTY_DEFAULTS, ...s })),
  ];

  let sortOrder = 1;
  const docs = allServices.map((s) => ({
    slug: s.slug,
    name: s.name,
    tagline: s.tagline,
    description: s.description,
    category: s.cat,
    categoryName: COMMON.category[s.cat],
    highlights: s.highlights || [],
    inclusions: s.inclusions || [],
    notIncluded: s.notIncluded || [],
    faq: s.faq || [],
    technologies: s.technologies,
    pricing: buildPricing(s.inrBase),
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
  logger.info({ inserted: r.insertedCount }, 'Inserted i18n tech services');

  const count = await col.countDocuments({ active: true });
  logger.info({ count }, 'Active services in DB');

  await closeDb();
}

main().catch((e) => {
  logger.error({ err: e.message, stack: e.stack }, 'seed failed');
  process.exit(1);
});
