/**
 * Country-aware Tax Invoice PDF renderer.
 *
 * Single source of truth for both invoice delivery paths:
 *   • workers/invoice.worker.js  → async, uploads to S3 after payment
 *   • POST /payments/invoice/download/:jobId → sync fallback
 *
 * Per market the document changes in three ways:
 *   1. Tax label + rate         (GST / VAT / MwSt. / "Sales tax exempt")
 *   2. Currency symbol          (₹ / AED / € / $ / A$ — `Intl.NumberFormat`)
 *   3. Seller registration      (GSTIN / TRN / USt-IdNr. / EIN / ABN)
 *      + a country-specific compliance footer (DE: Impressum, US: state
 *      sales-tax disclosure, etc.)
 *
 * The supplier (your company) details are env-driven so a single deploy can
 * issue compliant invoices in every market without per-tenant config.
 *
 *   COMPANY_NAME              "QuickHire Services Pvt. Ltd."
 *   COMPANY_LEGAL_FOOTER      free-form footer line (optional)
 *   COMPANY_ADDRESS_LINE1     street
 *   COMPANY_ADDRESS_LINE2     city / state / pin
 *   COMPANY_EMAIL             billing@…
 *   COMPANY_PHONE             +91 …
 *   COMPANY_GSTIN             India GST number
 *   COMPANY_TRN               UAE Tax Registration Number
 *   COMPANY_USTID             German USt-IdNr.
 *   COMPANY_EIN               US Employer Identification Number
 *   COMPANY_ABN               Australian Business Number
 *
 * Returns a Buffer of the rendered PDF. Caller decides where it goes
 * (S3 upload, HTTP body, …).
 */
import PDFDocument from 'pdfkit';
import { getCountryConfig } from '../../config/country.config.js';

const REGISTRATION_ENV = {
  IN: 'COMPANY_GSTIN',
  AE: 'COMPANY_TRN',
  DE: 'COMPANY_USTID',
  GB: 'COMPANY_VAT_GB',
  SA: 'COMPANY_VAT_SA',
  SG: 'COMPANY_UEN',
  US: 'COMPANY_EIN',
  AU: 'COMPANY_ABN',
};

// Country-specific footer disclosure strings appended below the totals block.
// Kept short — one or two lines max so the invoice stays single-page for
// typical bookings. Wording chosen to satisfy the most common compliance
// asks per market without overstepping (e.g. we say "subject to state and
// local sales tax" for US so we never accidentally claim exemption).
const COUNTRY_FOOTER = {
  IN: 'GST registered supply. Tax invoice issued under Section 31 of the CGST Act, 2017.',
  AE: 'VAT charged under Federal Decree-Law No. (8) of 2017 on Value Added Tax.',
  DE: 'Rechnung gemäß §14 UStG. Bei Fragen kontaktieren Sie uns über die unten angegebenen Kontaktdaten.',
  GB: 'VAT invoice issued under Section 6 of the Value Added Tax Act 1994.',
  SA: 'VAT invoice issued under the Saudi VAT Implementing Regulations.',
  SG: 'GST registered supply. Tax invoice issued under the Goods and Services Tax Act.',
  US: 'Subject to applicable U.S. state and local sales tax where required.',
  AU: 'Tax invoice issued under A New Tax System (Goods and Services Tax) Act 1999.',
};

function safe(s, fallback = '') {
  if (s === null || s === undefined) return fallback;
  return String(s);
}

/**
 * Format a money value using the country's locale + currency.
 *
 * We deliberately use `currencyDisplay: 'code'` (e.g. "INR 3,540.00",
 * "EUR 300,00") rather than symbol form because pdfkit's bundled Helvetica
 * is Latin-1 only — it can't render ₹ (U+20B9), د.إ, or other non-Latin
 * currency symbols, so the symbol form would silently degrade to a fallback
 * glyph on those markets. ISO codes are universally understood on tax
 * invoices and avoid the need to embed a Unicode TrueType font.
 *
 * Locale still drives number formatting (digit grouping + decimal sep)
 * so a German invoice reads "EUR 1.000,00" while an Indian one reads
 * "INR 1,00,000.00".
 */
function fmtMoney(amount, currency, locale) {
  const value = Number(amount || 0);
  try {
    return new Intl.NumberFormat(locale || 'en-US', {
      style: 'currency',
      currency: currency || 'USD',
      currencyDisplay: 'code',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${currency || ''} ${value.toFixed(2)}`.trim();
  }
}

function fmtDate(value, locale) {
  if (!value) return '';
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  try {
    return new Intl.DateTimeFormat(locale || 'en-US', {
      year: 'numeric', month: 'short', day: '2-digit',
    }).format(d);
  } catch {
    return d.toISOString().slice(0, 10);
  }
}

function readCompanyDetails(env, country) {
  return {
    name:     safe(env.COMPANY_NAME, 'QuickHire'),
    address1: safe(env.COMPANY_ADDRESS_LINE1),
    address2: safe(env.COMPANY_ADDRESS_LINE2),
    email:    safe(env.COMPANY_EMAIL),
    phone:    safe(env.COMPANY_PHONE),
    legalFooter: safe(env.COMPANY_LEGAL_FOOTER),
    registrationLabel: getCountryConfig(country)?.tax?.registrationLabel || '',
    registrationValue: safe(env[REGISTRATION_ENV[country]] || ''),
  };
}

function readCustomerDetails(payment) {
  const c = payment?.customer || {};
  return {
    name:    safe(c.name    || payment.customerName    || ''),
    email:   safe(c.email   || payment.customerEmail   || ''),
    mobile:  safe(c.mobile  || payment.customerMobile  || ''),
    address: safe(c.address || ''),
    taxId:   safe(c.taxId   || ''),  // optional B2B customer tax id
  };
}

/**
 * Draw a horizontal hairline rule across the content width.
 */
function rule(doc, y, color = '#E5E7EB') {
  doc.save()
    .strokeColor(color)
    .lineWidth(0.6)
    .moveTo(doc.page.margins.left, y)
    .lineTo(doc.page.width - doc.page.margins.right, y)
    .stroke()
    .restore();
}

function drawHeader(doc, { company, country, locale, invoiceNo, invoiceDate }) {
  const left = doc.page.margins.left;
  const right = doc.page.width - doc.page.margins.right;

  doc.fillColor('#26472B').font('Helvetica-Bold').fontSize(22)
    .text(company.name, left, doc.y, { align: 'left' });
  doc.font('Helvetica').fontSize(9).fillColor('#636363');
  if (company.address1) doc.text(company.address1);
  if (company.address2) doc.text(company.address2);
  if (company.email)    doc.text(company.email);
  if (company.phone)    doc.text(company.phone);
  if (company.registrationLabel && company.registrationValue) {
    doc.text(`${company.registrationLabel}: ${company.registrationValue}`);
  }

  // "TAX INVOICE" badge top-right
  const badgeY = doc.page.margins.top;
  doc.font('Helvetica-Bold').fontSize(16).fillColor('#26472B')
    .text('TAX INVOICE', left, badgeY, { width: right - left, align: 'right' });
  doc.font('Helvetica').fontSize(9).fillColor('#636363')
    .text(`Invoice #: ${invoiceNo}`,   left, badgeY + 22, { width: right - left, align: 'right' })
    .text(`Date: ${invoiceDate}`,      left, badgeY + 35, { width: right - left, align: 'right' })
    .text(`Country: ${country}`,       left, badgeY + 48, { width: right - left, align: 'right' });

  doc.moveDown(2);
  rule(doc, doc.y + 4);
  doc.moveDown(1);
}

function drawBillTo(doc, customer, payment) {
  const left = doc.page.margins.left;
  const startY = doc.y;
  const colWidth = (doc.page.width - doc.page.margins.left - doc.page.margins.right) / 2;

  doc.font('Helvetica-Bold').fontSize(10).fillColor('#26472B')
    .text('BILL TO', left, startY);
  doc.font('Helvetica').fontSize(10).fillColor('#1F2937');
  if (customer.name)   doc.text(customer.name);
  if (customer.email)  doc.text(customer.email);
  if (customer.mobile) doc.text(customer.mobile);
  if (customer.address) doc.text(customer.address);
  if (customer.taxId)   doc.text(`Tax ID: ${customer.taxId}`);

  // Right column — payment metadata
  const rightX = left + colWidth + 20;
  doc.font('Helvetica-Bold').fontSize(10).fillColor('#26472B')
    .text('PAYMENT', rightX, startY);
  doc.font('Helvetica').fontSize(10).fillColor('#1F2937');
  doc.text(`Order ID: ${safe(payment.orderId, '—')}`,    rightX, doc.y);
  doc.text(`Payment ID: ${safe(payment.paymentId, '—')}`, rightX, doc.y);
  doc.text(`Gateway: ${safe(payment.provider, '—')}${payment.mock ? ' (mock)' : ''}`, rightX, doc.y);
  doc.text(`Status: ${safe(payment.status, '—')}`,        rightX, doc.y);

  doc.moveDown(1.5);
  rule(doc, doc.y + 2);
  doc.moveDown(1);
}

function drawLineItems(doc, { job, payment, currency, locale }) {
  const left = doc.page.margins.left;
  const right = doc.page.width - doc.page.margins.right;
  const colDescX = left;
  const colQtyX  = right - 220;
  const colRateX = right - 140;
  const colAmtX  = right - 60;

  // Header
  doc.font('Helvetica-Bold').fontSize(10).fillColor('#26472B')
    .text('DESCRIPTION', colDescX, doc.y, { width: colQtyX - colDescX - 10 })
    .text('QTY', colQtyX, doc.y - 12, { width: 50, align: 'right' })
    .text('RATE', colRateX, doc.y - 12, { width: 70, align: 'right' })
    .text('AMOUNT', colAmtX, doc.y - 12, { width: 60, align: 'right' });
  doc.moveDown(0.4);
  rule(doc, doc.y);
  doc.moveDown(0.5);

  doc.font('Helvetica').fontSize(10).fillColor('#1F2937');

  const services = Array.isArray(job?.services) && job.services.length ? job.services : null;
  if (services) {
    for (const s of services) {
      const desc = safe(s.title || s.serviceName || job?.title || 'Professional Services');
      const qty  = Number(s.selectedDays || s.quantity || 1);
      const rate = Number(s.rate || s.pricePerDay || s.price || (payment.invoice?.subtotal / qty) || 0);
      const amt  = Number(s.amount || qty * rate);
      const lineY = doc.y;
      doc.text(desc, colDescX, lineY, { width: colQtyX - colDescX - 10 });
      doc.text(String(qty),                       colQtyX,  lineY, { width: 50, align: 'right' });
      doc.text(fmtMoney(rate, currency, locale),  colRateX, lineY, { width: 70, align: 'right' });
      doc.text(fmtMoney(amt,  currency, locale),  colAmtX,  lineY, { width: 60, align: 'right' });
      doc.moveDown(0.3);
    }
  } else {
    // Fallback: single line item from payment subtotal
    const desc = safe(job?.title || 'Professional Services');
    const subtotal = Number(payment.invoice?.subtotal || payment.amount || 0);
    const lineY = doc.y;
    doc.text(desc, colDescX, lineY, { width: colQtyX - colDescX - 10 });
    doc.text('1',                              colQtyX,  lineY, { width: 50, align: 'right' });
    doc.text(fmtMoney(subtotal, currency, locale), colRateX, lineY, { width: 70, align: 'right' });
    doc.text(fmtMoney(subtotal, currency, locale), colAmtX,  lineY, { width: 60, align: 'right' });
    doc.moveDown(0.4);
  }

  rule(doc, doc.y + 4);
  doc.moveDown(0.6);
}

function drawTotals(doc, { payment, currency, locale }) {
  const right = doc.page.width - doc.page.margins.right;
  const labelX = right - 220;
  const valueX = right - 100;

  const inv = payment.invoice || {};
  const subtotal = Number(inv.subtotal ?? payment.amount ?? 0);
  const discount = Number(inv.discount ?? 0);
  const tax = inv.tax || {};
  const taxAmount = Number(tax.amount ?? 0);
  const total = Number(inv.total ?? payment.amount ?? subtotal);

  const row = (label, value, opts = {}) => {
    const y = doc.y;
    doc.font(opts.bold ? 'Helvetica-Bold' : 'Helvetica')
      .fontSize(opts.bold ? 11 : 10)
      .fillColor(opts.bold ? '#26472B' : '#374151')
      .text(label, labelX, y, { width: 110, align: 'right' });
    doc.text(value, valueX, y, { width: 100, align: 'right' });
    doc.moveDown(0.4);
  };

  row('Subtotal', fmtMoney(subtotal, currency, locale));
  if (discount > 0) row('Discount', `-${fmtMoney(discount, currency, locale)}`);
  if (tax.name && taxAmount > 0) {
    const ratePct = tax.rate ? `${(Number(tax.rate) * 100).toFixed(0)}%` : '';
    row(
      `${tax.name}${ratePct ? ` (${ratePct})` : ''}${tax.inclusive ? ' incl.' : ''}`,
      fmtMoney(taxAmount, currency, locale),
    );
  }
  rule(doc, doc.y + 1);
  doc.moveDown(0.4);
  row('TOTAL', fmtMoney(total, currency, locale), { bold: true });
}

function drawFooter(doc, { country, company }) {
  const left = doc.page.margins.left;
  const right = doc.page.width - doc.page.margins.right;
  const footerY = doc.page.height - doc.page.margins.bottom - 60;

  doc.save();
  rule(doc, footerY);
  doc.font('Helvetica').fontSize(8).fillColor('#6B7280');
  const text = COUNTRY_FOOTER[country] || '';
  if (text) doc.text(text, left, footerY + 6, { width: right - left });
  if (company.legalFooter) doc.text(company.legalFooter, left, doc.y + 2, { width: right - left });
  doc.text('This is a computer-generated invoice and does not require a signature.',
    left, doc.y + 2, { width: right - left });
  doc.restore();
}

/**
 * Render an invoice PDF for a paid payment record.
 *
 * @param {{
 *   payment: object,                // payments document (with .invoice breakdown)
 *   job?: object,                   // jobs document (optional, used for line items)
 *   customer?: { name, email, mobile, address, taxId },
 *   env?: object,                   // overrideable for tests; defaults to process.env
 *   invoiceNumber?: string,         // override; otherwise derived from paymentId
 * }} args
 * @returns {Promise<Buffer>}        Rendered PDF bytes
 */
export async function renderInvoicePdf({ payment, job, customer, env = process.env, invoiceNumber } = {}) {
  if (!payment) throw new Error('renderInvoicePdf: payment is required');

  const country  = (payment.country || 'IN').toUpperCase();
  const cfg      = getCountryConfig(country);
  // pdfkit's bundled Helvetica is Latin-1 only — Arabic / Hebrew / CJK
  // glyphs from `Intl.DateTimeFormat('ar-AE', …)` would render as garbage
  // boxes. Force an English variant of the country locale for RTL markets
  // so dates stay readable; B2B invoices in those markets are typically
  // bilingual or English-only anyway. Number formatting still respects
  // regional conventions via the en-XX tag.
  const baseLocale = cfg?.locale || 'en-IN';
  const locale     = cfg?.rtl ? `en-${country}` : baseLocale;
  const currency = payment.currency || cfg?.currency || 'INR';

  const company  = readCompanyDetails(env, country);
  const cust     = customer ? { ...readCustomerDetails(payment), ...customer } : readCustomerDetails(payment);

  const invoiceNo   = invoiceNumber || `INV-${String(payment.paymentId || payment._id || Date.now()).slice(-12).toUpperCase()}`;
  const invoiceDate = fmtDate(payment.updatedAt || payment.createdAt || new Date(), locale);

  return new Promise((resolve, reject) => {
    try {
      const buffers = [];
      const doc = new PDFDocument({ size: 'A4', margin: 50, info: { Title: invoiceNo, Author: company.name } });
      doc.on('data', (b) => buffers.push(b));
      doc.on('end',  () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      drawHeader(doc, { company, country, locale, invoiceNo, invoiceDate });
      drawBillTo(doc, cust, payment);
      drawLineItems(doc, { job, payment, currency, locale });
      drawTotals(doc, { payment, currency, locale });
      drawFooter(doc, { country, company });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

export default renderInvoicePdf;
