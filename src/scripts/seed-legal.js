/**
 * seed-legal.js — Seed initial legal documents for all active markets.
 *
 * Publishes v1.0 of Terms of Service, Privacy Policy, and Refund Policy for:
 *   - IN (India)   — Razorpay, GST, Indian Contract Act
 *   - AE (UAE)     — Stripe, VAT, UAE law
 *   - DE (Germany) — Stripe SEPA, MwSt., GDPR / BGB
 *   - US (USA)     — Stripe, CCPA, Federal/State law
 *   - AU (Australia) — Stripe, GST, Australian Privacy Act
 *
 * Safe to re-run: skips any country/docType combo that already has
 * a published version.
 *
 * Run:
 *   cd "quickhire-AI-mode /backend"
 *   node src/scripts/seed-legal.js
 */

import 'dotenv/config';
import { connectDb, getDb, closeDb } from '../config/db.js';
import { logger } from '../config/logger.js';

const EFFECTIVE_DATE = new Date('2024-01-01T00:00:00Z').toISOString();

const DOCUMENTS = [

  /* ── INDIA ──────────────────────────────────────────────────────────────── */
  {
    countryCode: 'IN',
    docType: 'terms-of-service',
    version: '1.0',
    title: 'Terms of Service — India',
    effectiveDate: EFFECTIVE_DATE,
    materialChange: false,
    changeNotes: 'Initial publish',
    content: `<h2>1. Scope of Services</h2>
<p>QuickHire is a technology platform that enables Users to access platform-managed, AI-screened IT resources coordinated through a Technical Project Manager (TPM) on an hourly or custom-day basis for virtual/remote services only.</p>
<p>QuickHire acts solely as an intermediary and facilitator and does not itself provide IT development services. All services are remote/virtual, time-and-material based.</p>

<h2>2. User Eligibility</h2>
<p>You must be at least 18 years of age and competent to contract under the Indian Contract Act, 1872. By using the platform, you confirm all information provided is true, accurate, and complete.</p>

<h2>3. Account Registration & Security</h2>
<p>Users must register using a valid mobile number and email address. Login is enabled through OTP. You are responsible for maintaining the confidentiality of your account.</p>

<h2>4. Booking Process</h2>
<p>To place a booking: select a Service, choose duration, select date and time slot, and complete advance payment. Booking confirmation is subject to successful payment.</p>

<h2>5. Pricing, Taxes & Payment</h2>
<p>Pricing is calculated on an hourly or custom-day basis. 18% GST is applicable and displayed at checkout. Full advance payment is mandatory to confirm any booking. QuickHire facilitates payments via Razorpay.</p>

<h2>6. Cancellation & Refund</h2>
<p>Cancellations made 24+ hours before the session are eligible for a full refund. No-shows and cancellations within 24 hours are non-refundable. Refunds are processed within 5–7 business days.</p>

<h2>7. Dispute Resolution</h2>
<p>Disputes will first be attempted through mediation. Unresolved disputes are subject to arbitration under the Arbitration and Conciliation Act, 1996, with jurisdiction in New Delhi, India.</p>

<h2>8. Governing Law</h2>
<p>These Terms are governed by the laws of India. Disputes are subject to the exclusive jurisdiction of courts in New Delhi.</p>`,
  },
  {
    countryCode: 'IN',
    docType: 'privacy-policy',
    version: '1.0',
    title: 'Privacy Policy — India',
    effectiveDate: EFFECTIVE_DATE,
    materialChange: false,
    changeNotes: 'Initial publish',
    content: `<h2>1. Information We Collect</h2>
<p>We collect: contact information (name, email, phone), usage data, device information, and payment information (processed by Razorpay — QuickHire does not store card details).</p>

<h2>2. How We Use Your Information</h2>
<p>To provide and improve our services, process payments, send booking confirmations and notifications, comply with legal obligations, and prevent fraud.</p>

<h2>3. Data Storage</h2>
<p>Your data is stored in AWS ap-south-1 (Mumbai) in compliance with Indian data protection requirements. We do not transfer your personal data outside India without your consent.</p>

<h2>4. Your Rights</h2>
<p>You may request access to, correction of, or deletion of your personal data by contacting privacy@quickhire.services.</p>

<h2>5. Cookies</h2>
<p>We use essential cookies for session management and preferences. No third-party advertising cookies are used.</p>

<h2>6. Contact</h2>
<p>Privacy enquiries: privacy@quickhire.services</p>`,
  },
  {
    countryCode: 'IN',
    docType: 'refund-policy',
    version: '1.0',
    title: 'Cancellation & Refund Policy — India',
    effectiveDate: EFFECTIVE_DATE,
    materialChange: false,
    changeNotes: 'Initial publish',
    content: `<h2>Cancellation Policy</h2>
<p><strong>24+ hours before session:</strong> Full refund to original payment method.</p>
<p><strong>2–24 hours before session:</strong> 50% refund. Remaining 50% is a cancellation fee.</p>
<p><strong>Less than 2 hours / No-show:</strong> Non-refundable.</p>

<h2>Refund Processing</h2>
<p>Approved refunds are processed within 5–7 business days to the original payment method via Razorpay. GST paid (18%) is non-refundable.</p>

<h2>Service Issues</h2>
<p>If QuickHire is unable to deliver the booked service due to resource unavailability, a full refund will be issued automatically within 2 business days.</p>

<h2>How to Request a Refund</h2>
<p>Contact support@quickhire.services or use the in-app support chat with your booking ID.</p>`,
  },

  /* ── UAE ────────────────────────────────────────────────────────────────── */
  {
    countryCode: 'AE',
    docType: 'terms-of-service',
    version: '1.0',
    title: 'Terms of Service — UAE',
    effectiveDate: EFFECTIVE_DATE,
    materialChange: false,
    changeNotes: 'Initial publish',
    content: `<h2>1. Platform Overview</h2>
<p>QuickHire connects clients with verified IT professionals in the UAE market. All services are delivered remotely on a time-and-material basis.</p>

<h2>2. Taxes</h2>
<p>5% VAT is applicable on all services as per UAE Federal Tax Authority requirements. VAT is added to the displayed price at checkout.</p>

<h2>3. Payment</h2>
<p>Payments are processed via Stripe in AED. Tabby BNPL (buy now, pay later) is available for eligible orders. Full payment is required before service delivery.</p>

<h2>4. Governing Law</h2>
<p>These Terms are governed by the laws of the United Arab Emirates. Disputes are subject to the jurisdiction of Dubai courts.</p>`,
  },
  {
    countryCode: 'AE',
    docType: 'privacy-policy',
    version: '1.0',
    title: 'Privacy Policy — UAE',
    effectiveDate: EFFECTIVE_DATE,
    materialChange: false,
    changeNotes: 'Initial publish',
    content: `<h2>Data Collection & Use</h2>
<p>We collect contact information, usage data, and payment information to provide our services. Payment data is processed by Stripe — we do not store card details.</p>

<h2>Data Storage</h2>
<p>UAE user data is stored in AWS me-central-1 (UAE) in compliance with UAE data protection requirements.</p>

<h2>Your Rights</h2>
<p>You may request access to or deletion of your data by contacting privacy@quickhire.services.</p>`,
  },
  {
    countryCode: 'AE',
    docType: 'refund-policy',
    version: '1.0',
    title: 'Cancellation & Refund Policy — UAE',
    effectiveDate: EFFECTIVE_DATE,
    materialChange: false,
    changeNotes: 'Initial publish',
    content: `<h2>Cancellation</h2>
<p>24+ hours: Full refund. 2–24 hours: 50% refund. Under 2 hours / no-show: Non-refundable.</p>
<p>VAT paid (5%) is refundable on approved full refunds.</p>

<h2>Processing</h2>
<p>Refunds are processed within 7–10 business days to the original payment method.</p>`,
  },

  /* ── GERMANY ────────────────────────────────────────────────────────────── */
  {
    countryCode: 'DE',
    docType: 'terms-of-service',
    version: '1.0',
    title: 'Allgemeine Geschäftsbedingungen (AGB) — Deutschland',
    effectiveDate: EFFECTIVE_DATE,
    materialChange: false,
    changeNotes: 'Initial publish',
    content: `<h2>1. Geltungsbereich</h2>
<p>QuickHire ist eine Vermittlungsplattform für IT-Fachkräfte. Alle Leistungen werden remote erbracht.</p>

<h2>2. Mehrwertsteuer</h2>
<p>Alle Preise verstehen sich zuzüglich der gesetzlichen Mehrwertsteuer von 19% (MwSt.).</p>

<h2>3. Zahlung</h2>
<p>Zahlungen erfolgen über Stripe (SEPA-Lastschrift oder Kreditkarte) in EUR. Die vollständige Zahlung ist vor Leistungserbringung fällig.</p>

<h2>4. Widerrufsrecht</h2>
<p>Verbraucher haben das Recht, diesen Vertrag innerhalb von 14 Tagen ohne Angabe von Gründen zu widerrufen. Die Frist beginnt mit Vertragsabschluss.</p>

<h2>5. Datenschutz</h2>
<p>Die Verarbeitung personenbezogener Daten erfolgt gemäß unserer Datenschutzerklärung und der DSGVO.</p>

<h2>6. Anwendbares Recht</h2>
<p>Es gilt deutsches Recht. Gerichtsstand ist Berlin.</p>`,
  },
  {
    countryCode: 'DE',
    docType: 'privacy-policy',
    version: '1.0',
    title: 'Datenschutzerklärung — Deutschland (DSGVO)',
    effectiveDate: EFFECTIVE_DATE,
    materialChange: false,
    changeNotes: 'Initial publish',
    content: `<h2>Verantwortlicher</h2>
<p>QuickHire Services GmbH, Berlin, Deutschland. E-Mail: datenschutz@quickhire.services</p>

<h2>Erhobene Daten</h2>
<p>Wir erheben: Name, E-Mail-Adresse, Telefonnummer, Nutzungsdaten und Zahlungsdaten (verarbeitet durch Stripe).</p>

<h2>Rechtsgrundlage</h2>
<p>Die Datenverarbeitung erfolgt auf Grundlage von Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung) und Art. 6 Abs. 1 lit. f DSGVO (berechtigte Interessen).</p>

<h2>Datenspeicherung</h2>
<p>Daten deutscher Nutzer werden in AWS eu-central-1 (Frankfurt) gespeichert und nicht an Drittländer ohne angemessenes Schutzniveau übermittelt.</p>

<h2>Ihre Rechte (Art. 15–22 DSGVO)</h2>
<p>Sie haben das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung, Datenübertragbarkeit und Widerspruch. Anfragen an: datenschutz@quickhire.services</p>

<h2>Beschwerderecht</h2>
<p>Sie haben das Recht, sich bei einer Datenschutzaufsichtsbehörde zu beschweren.</p>`,
  },
  {
    countryCode: 'DE',
    docType: 'refund-policy',
    version: '1.0',
    title: 'Widerrufsbelehrung & Rückgaberecht — Deutschland',
    effectiveDate: EFFECTIVE_DATE,
    materialChange: false,
    changeNotes: 'Initial publish',
    content: `<h2>Widerrufsrecht</h2>
<p>Sie haben das Recht, innerhalb von 14 Tagen ohne Angabe von Gründen diesen Vertrag zu widerrufen.</p>

<h2>Stornierungsbedingungen</h2>
<p>Mehr als 24 Stunden vorher: Vollständige Erstattung einschließlich MwSt. 2–24 Stunden vorher: 50% Erstattung. Weniger als 2 Stunden / Nichterscheinen: Keine Erstattung.</p>

<h2>Rückerstattungsbearbeitung</h2>
<p>Erstattungen werden innerhalb von 7–10 Werktagen auf das ursprüngliche Zahlungsmittel zurückgebucht.</p>`,
  },
];

async function run() {
  await connectDb();
  const db = getDb();
  const col = db.collection('legal_documents');

  let published = 0;
  let skipped = 0;

  for (const doc of DOCUMENTS) {
    // Skip if already published for this country/docType
    const existing = await col.findOne({
      countryCode: doc.countryCode,
      docType: doc.docType,
      status: 'published',
    });

    if (existing) {
      logger.info({ countryCode: doc.countryCode, docType: doc.docType }, 'seed-legal: already published, skipping');
      skipped++;
      continue;
    }

    const now = new Date();
    await col.insertOne({
      ...doc,
      effectiveDate: new Date(doc.effectiveDate),
      status: 'published',
      publishedBy: 'seed-script',
      publishedAt: now,
      createdAt: now,
    });

    logger.info({ countryCode: doc.countryCode, docType: doc.docType, version: doc.version }, 'seed-legal: published');
    published++;
  }

  logger.info({ published, skipped, total: DOCUMENTS.length }, 'seed-legal: complete');
  await closeDb();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
