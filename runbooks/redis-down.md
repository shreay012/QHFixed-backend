# Runbook: Redis Down

**Alert:** `RedisDown`
**Severity:** Critical
**Threshold:** Redis scrape target `up == 0` for 1 minute

## Impact assessment

| Feature | Degraded? | Fail mode |
|---|---|---|
| Rate limiting | Yes | Requests pass through (no 429s) |
| JWT blacklist | Yes | Logged-out tokens briefly valid |
| OTP codes | Yes | OTP send fails |
| BullMQ workers | Yes | No new jobs; existing workers drain then block |
| Live tracking | Yes | GPS positions not cached |
| Analytics cache | Yes | All analytics hit MongoDB directly |
| Core booking flow | No | DB-backed, Redis-independent |
| Payments | No | DB-backed |

## Immediate recovery

### If Redis is managed (Upstash / ElastiCache / Redis Cloud)
1. Check provider dashboard for status.
2. Check connectivity from pod:
   ```
   kubectl exec -n quickhire deploy/api -- redis-cli -u $REDIS_URL ping
   ```
3. If network partition: check VPC security groups / firewall rules.

### If Redis is self-hosted (k8s StatefulSet)
1. Check pod status:
   ```
   kubectl get pods -n quickhire -l app=redis
   kubectl describe pod redis-0 -n quickhire
   ```
2. Check PersistentVolume:
   ```
   kubectl get pvc -n quickhire
   ```
3. Restart Redis pod:
   ```
   kubectl delete pod redis-0 -n quickhire  # StatefulSet will recreate
   ```
4. Check AOF/RDB persistence: `redis-cli BGSAVE` to force snapshot.

## After Redis recovers

1. OTP codes are lost — users who requested OTPs during outage must re-request.
2. Queue workers will drain backlog automatically.
3. Flush any stale rate-limit keys if attack was in progress during outage:
   ```
   redis-cli KEYS "rl:*" | xargs redis-cli DEL
   ```
4. Confirm BullMQ workers reconnected:
   ```
   kubectl logs deploy/api -n quickhire | grep "worker\|bull" | tail -20
   ```

## Long-term

- Configure Redis Sentinel or Cluster for HA.
- Set `REDIS_RETRY_DELAY_MS=1000` (already in `src/config/redis.js` retry logic).
- Set Redis maxmemory-policy to `allkeys-lru` to prevent OOM under memory pressure.
