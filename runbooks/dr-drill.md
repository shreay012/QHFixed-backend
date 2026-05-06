# Disaster Recovery Drill — QuickHire API

Run quarterly. Target RTO: 30 min, RPO: 1 hour.

## Pre-drill checklist

- [ ] Notify team at least 24h in advance (impacts staging/UAT environment, not production).
- [ ] Confirm latest MongoDB Atlas backup is < 1h old:
  `Atlas UI → Backup → Snapshots → verify timestamp`.
- [ ] Confirm S3 chat-attachments bucket cross-region replication is enabled.
- [ ] Record start time.

## Drill steps

### 1. Simulate database failure (< 5 min)
```bash
# On staging: pause the primary
kubectl scale statefulset mongodb -n quickhire-staging --replicas=0
# or in Atlas: pause cluster

# Observe: API should return 503 on DB-backed routes, not crash
curl http://staging-api.quickhire.in/healthz  # should return 200
curl http://staging-api.quickhire.in/api/bookings  # should return 503 or queue
```

### 2. Restore from backup (< 20 min)
```bash
# Atlas: Restore snapshot to a new cluster
# Atlas UI → Backup → Restore → Point in Time → new cluster

# Once new cluster is ready, update MONGO_URI:
kubectl set env deploy/api -n quickhire-staging \
  MONGO_URI=mongodb+srv://user:pass@restored-cluster.mongodb.net/quickhire

kubectl rollout restart deploy/api -n quickhire-staging
kubectl rollout status deploy/api -n quickhire-staging
```

### 3. Verify data integrity
```bash
node -e "
import('./src/config/db.js').then(({ connectDb, getDb }) =>
  connectDb().then(() => {
    const db = getDb();
    return Promise.all([
      db.collection('jobs').estimatedDocumentCount(),
      db.collection('users').estimatedDocumentCount(),
      db.collection('payments').estimatedDocumentCount(),
    ]);
  }).then(([jobs, users, payments]) => {
    console.log({ jobs, users, payments });
    process.exit(0);
  })
);
"
```
Expected: counts within 1% of production snapshot.

### 4. Test critical flows
- [ ] OTP login succeeds.
- [ ] Booking creation succeeds.
- [ ] Payment webhook processes.
- [ ] Admin dashboard loads.

### 5. Restore Redis state
```bash
# Flush stale rate-limit keys
redis-cli -u $REDIS_URL FLUSHDB ASYNC
# Queue workers will pick up any pending jobs from DB
```

## Post-drill

- Record actual RTO and RPO achieved.
- Document any gaps found.
- Update this runbook if steps changed.
- File a Jira ticket for any gaps requiring engineering work.

## Backup schedule (production)

| Data | Backup type | Frequency | Retention |
|---|---|---|---|
| MongoDB | Atlas continuous backup | Every 6h snapshot + oplog | 7 days |
| Redis | AOF + RDB | Every 60s AOF sync | Not restored on DR (cache only) |
| S3 chat attachments | Cross-region replication | Continuous | 365 days |
| Application logs | CloudWatch / Loki | Stream | 30 days |
| Env secrets | AWS Secrets Manager | Versioned | Indefinite |
