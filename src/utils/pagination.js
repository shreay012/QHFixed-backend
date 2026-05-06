// Accept either canonical `pageSize` or legacy `limit` for size; canonical
// `page` for the page number. Returns the resolved values plus skip/limit
// for Mongo. Per PLATFORM_ARCHITECTURE 12.7 we standardize on page+pageSize
// going forward but tolerate `limit` for endpoints already in production.
export function paginate(query = {}) {
  const { page = 1, pageSize, limit } = query;
  const p = Math.max(1, Number(page) || 1);
  const sizeRaw = pageSize ?? limit ?? 10;
  const s = Math.min(100, Math.max(1, Number(sizeRaw) || 10));
  return { page: p, pageSize: s, skip: (p - 1) * s, limit: s };
}

export function buildMeta({ page, pageSize, total }) {
  return { page, pageSize, total, totalPages: Math.ceil(total / pageSize) };
}
