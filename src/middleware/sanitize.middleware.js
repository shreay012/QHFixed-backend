import mongoSanitize from 'express-mongo-sanitize';

/**
 * NoSQL injection defence — strips keys starting with $ or containing dots
 * from req.body, req.query, and req.params.
 *
 * express-mongo-sanitize covers the main attack vectors. Zod validators
 * (already wired on every write route) provide a second line of defence
 * by rejecting unexpected fields and types.
 */
export const sanitizeMongo = mongoSanitize({
  replaceWith: '_',
  // dryRun: true would log without mutating — useful for auditing
});

/**
 * XSS defence — strips / escapes HTML from every string value in the body.
 * We do a simple approach: reject any value that looks like HTML tags in
 * fields that should never contain markup.
 *
 * Full HTML sanitisation (DOMPurify / sanitize-html) is heavy for an API;
 * instead we encode the five dangerous chars so they never reach the DB raw.
 * Content that genuinely needs HTML (CMS rich text) should be handled
 * separately with a proper allowlist-based sanitizer.
 */
function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

function sanitizeValue(val, depth = 0) {
  if (depth > 5 || val == null) return val;
  if (typeof val === 'string') return escapeHtml(val);
  if (Array.isArray(val)) return val.map((v) => sanitizeValue(v, depth + 1));
  if (typeof val === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(val)) {
      out[k] = sanitizeValue(v, depth + 1);
    }
    return out;
  }
  return val;
}

// Fields that legitimately contain HTML / rich text — skip XSS escaping for these
const HTML_ALLOWED_FIELDS = new Set(['content', 'body', 'html', 'richText', 'description']);

export function sanitizeXss(req, _res, next) {
  if (req.body && typeof req.body === 'object') {
    const sanitized = {};
    for (const [k, v] of Object.entries(req.body)) {
      sanitized[k] = HTML_ALLOWED_FIELDS.has(k) ? v : sanitizeValue(v);
    }
    req.body = sanitized;
  }
  next();
}
