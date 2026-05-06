# Runbook: High API Latency

**Alert:** `APIHighLatency`
**Severity:** Warning
**Threshold:** p95 latency > 2s for 5 minutes

## Triage

1. Check Grafana → Latency by Route to identify slow endpoints.
2. Check MongoDB slow query log:
   ```
   db.adminCommand({ getLog: "global" })
   # or via Atlas: Performance Advisor → slow queries
   ```
3. Check Redis:
   ```
   redis-cli INFO stats | grep -E "ops_per_sec|blocked_clients"
   redis-cli SLOWLOG GET 10
   ```

## Common causes

### Missing MongoDB index
- **Symptom:** Specific routes are slow; `explain()` shows `COLLSCAN`.
- **Fix:** Add a compound index for the filter pattern.
  ```js
  db.jobs.createIndex({ userId: 1, status: 1, createdAt: -1 })
  ```
- **Permanent fix:** add index to `src/config/db.js` setup script.

### Analytics aggregations not cached
- **Symptom:** `/api/analytics/*` routes slow under load.
- **Fix:** Confirm `REDIS_URL` is set. Analytics caches 30-min TTL; on cold start after Redis flush, first call is expensive.
- Manually seed cache:
  ```
  curl -H "Authorization: Bearer $ADMIN_TOKEN" http://localhost:4000/api/analytics/funnel
  ```

### CPU saturation
- **Symptom:** High CPU across all routes; nothing specific.
- **Fix:** Scale out — `kubectl scale deploy/api --replicas=<n+2>`.
- Check for tight loops or `JSON.stringify` on large payloads.

### External API latency (Claude / payment gateways)
- **Symptom:** Chatbot or payment routes only.
- **Fix:**
  - Chatbot: already has 300-token cap and fallback; if Claude is slow, timeout fires and fallback serves.
  - Payments: verify with gateway status page. Set `PAYMENT_TIMEOUT_MS=5000` env var (not yet implemented — escalate to backend lead).

## Connection pool tuning

If latency is caused by MongoDB connection wait:
```js
// src/config/db.js — current defaults
maxPoolSize: 50,          // increase to 100 for > 20 API pods
waitQueueTimeoutMS: 5000,
serverSelectionTimeoutMS: 5000,
```
Bump `maxPoolSize` to 100 and redeploy. Do not exceed 500 (MongoDB Atlas M10 limit).
