# BullMQ Queue Infrastructure

## Overview

Phase 1b: BullMQ Queue System provides scalable, reliable async job processing for:

✅ **Notifications** - In-app, push, email, SMS with guaranteed delivery  
✅ **Lifecycle Events** - Booking status transitions with proper sequencing  
✅ **Scalable** - Processes jobs across multiple workers/nodes  
✅ **Fault-tolerant** - Automatic retries, exponential backoff, dead-letter queue  
✅ **Observable** - Queue dashboard + detailed job monitoring  

## Architecture

```
App Request
    ↓
enqueueJob(QUEUES.NOTIFICATIONS, payload)
    ↓
Redis (persistent queue storage)
    ↓
BullMQ Worker (concurrent job processor)
    ↓
Job Handler (handleNotificationJob, handleLifecycleTick)
    ↓
Database Updates + Socket.IO Events
```

### Key Design Decisions

1. **Redis-backed**: Uses same Redis instance for cache + queue
2. **Persistent**: If server crashes, jobs survive and resume
3. **Distributed**: Multiple workers can process same queue (horizontal scaling)
4. **Backward compatible**: Existing `enqueueNotification()` calls still work
5. **Graceful fallback**: If queue fails, requests don't error (inline dispatch)

## Files Added

| File | Purpose |
|---|---|
| `src/queue/index.js` | Core queue manager (create, register, enqueue) |
| `src/queue/notification.handler.js` | Notification job handler + queue integration |
| `src/queue/lifecycle.handler.js` | Lifecycle job handler + recurring tick |
| `src/queue/setup.js` | Queue initialization at app startup |
| `src/queue/dashboard.js` | Bull Board UI for monitoring |
| `scripts/test-queues.js` | Smoke test suite for queue operations |

## Usage Guide

### 1. Enqueue a Job (Async)

```javascript
import { enqueueJob, QUEUES } from '../../queue/index.js';

// Add a job to the notification queue
const job = await enqueueJob(QUEUES.NOTIFICATIONS, {
  userId: '507f1f77bcf86cd799439011',
  type: 'BOOKING_CONFIRMED',
  title: 'Booking Confirmed',
  body: 'Your booking is confirmed',
  data: { bookingId: '...' },
  channels: ['in_app', 'push'],
});

console.log(`Job enqueued with ID: ${job.id}`);
```

### 2. Enqueue a Notification (Existing API)

```javascript
import { enqueueNotification } from '../../queue/notification.handler.js';

// This now uses BullMQ under the hood
await enqueueNotification({
  userId: customerId,
  type: 'BOOKING_START_REMINDER',
  title: 'Your booking is starting soon',
  body: 'Check in now',
  channels: ['in_app', 'push'],
});
```

### 3. Job Options & Priorities

```javascript
// High priority job (processed first)
await enqueueJob(QUEUES.NOTIFICATIONS, payload, {
  priority: 10,
});

// Delayed job (process in 5 minutes)
await enqueueJob(QUEUES.NOTIFICATIONS, payload, {
  delay: 5 * 60 * 1000,
});

// Idempotent job (won't duplicate if retried)
await enqueueJob(QUEUES.NOTIFICATIONS, payload, {
  jobId: `notif:${userId}:${timestamp}`,
});
```

### 4. Monitor Queue Status

```javascript
import { getQueueStats } from '../../queue/index.js';

const stats = await getQueueStats(QUEUES.NOTIFICATIONS);
console.log(stats);
// {
//   name: 'notifications',
//   wait: 42,           // Waiting to be processed
//   active: 3,          // Currently processing
//   completed: 1200,    // Successfully completed
//   failed: 5,          // Failed after retries
//   delayed: 0,
//   isRunning: true,
//   workerConcurrency: 10
// }
```

## Queue Types

### 1. Notifications Queue

**Purpose**: Reliable notification delivery (in-app, push, email, SMS)

**Worker config**: 10 concurrent jobs

**Job structure**:
```javascript
{
  userId: String,           // Target user ID
  type: String,             // BOOKING_CONFIRMED, etc
  title: String,            // Display title
  body: String,             // Notification body
  data: Object,             // Custom data
  channels: Array,          // ['in_app', 'push', 'email', 'sms']
}
```

**Handler**: Persists to MongoDB + emits socket.io + sends push

### 2. Lifecycle Queue

**Purpose**: Booking status transitions (scheduled → in_progress → completed)

**Worker config**: 1 concurrent job (sequential, critical)

**Special**: Uses repeating job that runs every 60 seconds

**Handler**: Scans 500 bookings, runs state machine, sends reminders

## Monitoring

### Queue Dashboard

Access at: **http://localhost:4000/admin/queues**

Features:
- Real-time job counts (wait, active, completed, failed)
- View individual job details
- Retry failed jobs
- Clear completed/failed jobs
- Worker status

### Command Line Monitoring

```bash
# Get queue stats
node -e "
const { getQueueStats, QUEUES } = require('./src/queue/index.js');
getQueueStats(QUEUES.NOTIFICATIONS).then(console.log);
"

# See active workers
redis-cli
> client list
> monitor  # Real-time command log
```

### Metrics to Track

| Metric | Good | Warning | Critical |
|---|---|---|---|
| Notification wait time | < 1s | 5-10s | > 30s |
| Failed jobs % | 0% | 0.1-1% | > 1% |
| Queue depth (wait) | < 100 | 100-1000 | > 1000 |
| Worker utilization | 30-70% | 10-30% or 80%+ | > 90% |

## Error Handling & Retries

**Automatic retries**:
- 3 attempts by default
- Exponential backoff (2s, 4s, 8s)
- Failed jobs moved to dead-letter queue after 3 attempts

**What happens when job fails**:
1. First failure → logged, job retried
2. Second failure → logged, job retried
3. Third failure → moved to `failed` state, manual intervention needed

**Manual intervention**:
```javascript
// Retry a failed job via dashboard UI
// OR via code:
const job = await getJob(QUEUES.NOTIFICATIONS, jobId);
await job.retry();
```

## Performance Considerations

### Throughput

At current config:
- **Notifications**: 10 concurrent × 60s/job ≈ 600 jobs/min
- **Lifecycle**: 1 concurrent × tick every 60s ≈ 1 tick/min processing 500 bookings

To increase:
- Raise worker concurrency: `registerWorker(..., { concurrency: 20 })`
- Add more worker processes: run separate `node src/workers/notifications.js`

### Memory Usage

Each queue keeps 1 hour of completed jobs in-memory. At 600 jobs/min:
- Expected: ~50MB per hour of job history
- Monitor: `redis-cli INFO memory`

### Redis Keys

Queue uses predictable key patterns:
- `bull:notifications:*` - Notification queue data
- `bull:lifecycle:*` - Lifecycle queue data

Can be monitored: `redis-cli KEYS 'bull:*' | wc -l`

## Integration with Existing Code

### Before Phase 1b (Old way)

```javascript
// Notifications dispatched inline (blocking)
await dispatch(payload);

// Lifecycle ran every 60s via setInterval (in-process only)
startLifecycleWorker();
```

### After Phase 1b (New way)

```javascript
// Notifications enqueued via BullMQ (non-blocking)
await enqueueNotification(payload);

// Lifecycle runs as recurring job (distributable)
await scheduleLifecycleTick();
```

**Backward compatibility**: `enqueueNotification()` automatically delegates to queue

## Troubleshooting

**Queue is empty but jobs not processing**

- Check worker is running: Look for `worker registered` in logs
- Check Redis connection: `redis-cli ping`
- Check job handler for errors: View in dashboard under "Failed"

**Jobs stuck in `active` state**

- Worker may have crashed: Restart server
- Job timeout too short: Check `lockDuration` in worker config
- BullMQ will auto-retry after lock expires (default: 30s)

**Memory growing**

- Increase `removeOnComplete.age` to clear jobs faster
- Reduce history retention: change `3600` (1hr) to `600` (10min)

**High latency**

- Check Redis: `redis-cli --stat` for memory/evictions
- Check worker concurrency: May need to increase for high volume
- Check MongoDB: Notifications write to DB, ensure indexes exist

## Next Steps

After Phase 1b is validated:

1. **Phase 1c** → MongoDB indexes for critical queries
2. **Phase 1d** → Sentry/Prometheus for observability
3. **Phase 1e** → Socket.IO Redis adapter for multi-node
4. **Phase 2** → Admin power (payout engine, bulk actions)

## Testing

Run queue smoke tests:

```bash
cd backend
node scripts/test-queues.js
```

Expected output:

```
✅ Database and Redis connection
✅ Queues initialized
✅ Workers registered
✅ Notification job enqueued
✅ Lifecycle job enqueued
✅ Get queue statistics
✅ Schedule lifecycle tick
✅ Multiple jobs in queue

✅ 8 passed, ❌ 0 failed
🎉 All queue tests passed! Queue system is operational.
```

## References

- BullMQ docs: https://docs.bullmq.io/
- Bull Board: https://github.com/felixmosh/bull-board
- Queue best practices: https://docs.bullmq.io/guide/best-practices
- Monitoring: https://docs.bullmq.io/guide/monitoring
