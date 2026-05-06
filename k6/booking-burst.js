/**
 * k6 Load Test: 5,000 concurrent booking burst
 *
 * Simulates a flash-sale scenario where 5K users simultaneously
 * try to create bookings. Validates that p95 latency < 2s and
 * error rate < 1%.
 *
 * Usage:
 *   k6 run --env BASE_URL=http://localhost:4000 k6/booking-burst.js
 *   k6 run --env BASE_URL=https://api.quickhire.in k6/booking-burst.js --vus 500 --duration 60s
 */
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const errorRate = new Rate('errors');
const bookingDuration = new Trend('booking_duration', true);
const authDuration = new Trend('auth_duration', true);

export const options = {
  stages: [
    { duration: '30s', target: 100 },   // warm-up
    { duration: '60s', target: 1000 },  // ramp to 1K
    { duration: '60s', target: 5000 },  // burst to 5K
    { duration: '30s', target: 5000 },  // hold
    { duration: '30s', target: 0 },     // ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000', 'p(99)<5000'],
    errors: ['rate<0.01'],           // < 1% error rate
    booking_duration: ['p(95)<3000'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:4000';

// Pre-registered test user pool (seed DB before running)
function getTestUser(vu) {
  const idx = (vu % 100) + 1;
  return { mobile: `9000000${String(idx).padStart(3, '0')}`, otp: '1234' };
}

function getServiceId() {
  // Replace with a valid serviceId from your seed data
  return __ENV.SERVICE_ID || '000000000000000000000001';
}

export function setup() {
  // Verify the API is reachable
  const res = http.get(`${BASE_URL}/healthz`);
  check(res, { 'healthz ok': (r) => r.status === 200 });
  return { serviceId: getServiceId() };
}

export default function (data) {
  const user = getTestUser(__VU);

  // Step 1: OTP request
  const otpRes = http.post(`${BASE_URL}/api/auth/otp/send`, JSON.stringify({ mobile: user.mobile }), {
    headers: { 'Content-Type': 'application/json' },
  });
  check(otpRes, { 'otp send 200': (r) => r.status === 200 });

  // Step 2: OTP verify (dev master OTP)
  const startAuth = Date.now();
  const verifyRes = http.post(`${BASE_URL}/api/auth/otp/verify`, JSON.stringify({ mobile: user.mobile, otp: user.otp }), {
    headers: { 'Content-Type': 'application/json' },
  });
  authDuration.add(Date.now() - startAuth);

  const verified = check(verifyRes, {
    'auth 200': (r) => r.status === 200,
    'has access token': (r) => !!r.json('data.accessToken'),
  });

  if (!verified) {
    errorRate.add(1);
    return;
  }

  const token = verifyRes.json('data.accessToken');
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  // Step 3: Create booking
  const bookingPayload = JSON.stringify({
    serviceId: data.serviceId,
    schedule: {
      startTime: new Date(Date.now() + 86400_000).toISOString(),
      endTime: new Date(Date.now() + 90000_000).toISOString(),
    },
    address: {
      line1: 'Test Address',
      city: 'Mumbai',
      state: 'MH',
      pincode: '400001',
    },
    notes: `Load test booking VU ${__VU}`,
  });

  const startBook = Date.now();
  const bookRes = http.post(`${BASE_URL}/api/bookings`, bookingPayload, { headers });
  bookingDuration.add(Date.now() - startBook);

  const bookOk = check(bookRes, {
    'booking 201': (r) => r.status === 201,
    'booking has id': (r) => !!r.json('data._id'),
  });

  errorRate.add(!bookOk ? 1 : 0);

  sleep(Math.random() * 2 + 0.5); // 0.5–2.5s think time
}
