# QuickHire Backend

Production-ready Node.js + Express + MongoDB + Redis + Socket.IO backend for the QuickHire platform.
Implements the full system described in [`docs/QUICKHIRE_SYSTEM_DESIGN.md`](../docs/QUICKHIRE_SYSTEM_DESIGN.md).

## Stack

- **Node 20** (ES modules)
- **Express 4** — HTTP API
- **MongoDB 7** (native driver)
- **Redis 7** (ioredis) — cache, rate-limit, pub/sub, Socket.IO adapter, idempotency
- **Socket.IO 4** + `@socket.io/redis-adapter` — real-time chat & notifications
- **AWS SDK v3** — S3 (uploads), SQS (queues), SNS (push), SES (email)
- **Razorpay** — payments
- **Pino** — structured logs
- **Zod** — request validation
- **JWT RS256** — stateless auth

## Modules (`src/modules/*`)

| Module | Routes |
|---|---|
| auth | `/api/auth/send-otp`, `verify-otp`, `guest-access`, `refresh`, `logout` |
| user | `/api/user/profile`, `/api/user/devices` |
| service | `/api/services`, `/api/services/:id`, `/api/services/category/:c` |
| booking | `/api/bookings/*`, `/api/customer/bookings`, `/api/bookingHistories/getBookingHistory` |
| job | `/api/jobs/*`, `/api/jobs/pricing` |
| payment | `/api/payments/create-order`, `verify`, `status`, `history`, `invoice/download/:jobId`, `webhook` |
| chat | `/api/chat/messages/:customerId`, `send/:customerId`, `seen/:messageId`, `upload-url` + Socket.IO |
| notification | `/api/notifications`, `:id/read`, `mark-all-read` |
| admin | `/api/admin/dashboard`, `bookings`, `bookings/:id/confirm`, `bookings/:id/assign-pm`, `users`, `availability` |
| ticket | `/api/tickets/ticket`, `user/all-tickets`, `:id/message` + `/api/ticket-messages/:ticketId` |
| misc | `/api/miscellaneous/contact-us` |

All routes follow the `Controller → Service → Repository` pattern.

## Quick Start (Local)

### 1. Generate JWT keypair

```bash
cd backend
openssl genrsa -out private.pem 2048
openssl rsa -in private.pem -pubout -out public.pem
```

### 2. Configure environment

```bash
cp .env.example .env
# Paste private.pem and public.pem contents into JWT_PRIVATE_KEY / JWT_PUBLIC_KEY
# (escape newlines as \n on a single line, env.js will convert them back)
```

### 3. Start dependencies + API

```bash
docker compose up -d mongo redis
npm install
npm run dev
```

API runs at `http://localhost:4000`. Health: `GET /healthz`.

### 4. Run workers (optional, only if SQS configured)

```bash
npm run worker:notifications
npm run worker:invoice
npm run worker:email
```

## Smoke Test

```bash
# Send OTP (mock SMS prints to logs)
curl -X POST http://localhost:4000/api/auth/send-otp \
  -H 'content-type: application/json' \
  -d '{"mobile":"9999999999","role":"user"}'

# Read OTP from server logs, then verify
curl -X POST http://localhost:4000/api/auth/verify-otp \
  -H 'content-type: application/json' \
  -d '{"mobile":"9999999999","otp":"1234","fcmToken":""}'

# Guest access
curl -X POST http://localhost:4000/api/auth/guest-access
```

## Folder Structure

```
src/
  config/            env, db, redis, logger, aws
  middleware/        auth, role, rateLimit, validate, error, requestId
  modules/
    auth/            controller + service + repository + routes + validators
    user/
    service/
    booking/         (state machine in booking.service.js)
    job/
    payment/         (+ payment.webhook.js for Razorpay raw-body endpoint)
    chat/            (HTTP routes + chat.socket.js for WS handlers)
    notification/    (service + SQS-backed enqueue + in-app socket fan-out)
    admin/
    ticket/
    misc/
  socket/            io setup with Redis adapter + JWT auth
  utils/             AppError, asyncHandler, idempotency, pagination, oid
  workers/           notification, invoice, email — long-running SQS consumers
  app.js             express wiring
  routes.js          /api/* mount points
  server.js          http + socket + graceful shutdown
```

## Booking State Machine

```
pending → confirmed → assigned_to_pm → in_progress → completed
   ↓          ↓               ↓               ↓
cancelled  cancelled       cancelled       cancelled
```

Enforced in `modules/booking/booking.service.js → transition()`.

## Socket.IO Rooms

| Purpose | Room ID |
|---|---|
| Chat (assigned) | `${pmId}_service_${serviceId}` |
| Chat (pre-assignment) | `service_${serviceId}_pending_${userId}` |
| User notifications | `user_${userId}` |
| Support ticket | `ticket_${ticketId}` |
| Admin broadcast | `role_admin` |

Authenticated via JWT in `socket.handshake.auth.token` or `query.token`.
Cross-node fan-out via Redis adapter.

## Idempotency & Concurrency

- `POST /bookings` accepts `Idempotency-Key` header (response cached 24h in Redis).
- Slot reservation uses Redis `SETNX slot:{serviceId}:{startTs}` with 60s TTL.
- Razorpay payments deduped by unique `paymentId` index + webhook event id stored on payment doc.

## Production Deployment

See [`docs/QUICKHIRE_SYSTEM_DESIGN.md`](../docs/QUICKHIRE_SYSTEM_DESIGN.md) §12 for the full AWS / ECS / CloudWatch blueprint.

## License

Proprietary — internal use only.
