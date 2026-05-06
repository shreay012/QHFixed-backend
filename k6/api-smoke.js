/**
 * k6 Smoke Test: Critical API path sanity check
 *
 * Runs a small number of VUs through every major API flow to verify
 * nothing is broken after a deployment. Runs in < 2 minutes.
 *
 * Usage (CI):
 *   k6 run --env BASE_URL=http://localhost:4000 k6/api-smoke.js
 */
import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('errors');

export const options = {
  vus: 5,
  duration: '90s',
  thresholds: {
    http_req_duration: ['p(95)<3000'],
    errors: ['rate<0.05'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:4000';
const ADMIN_TOKEN = __ENV.ADMIN_TOKEN || '';

const headers = (token) => ({
  'Content-Type': 'application/json',
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
});

export function setup() {
  const res = http.get(`${BASE_URL}/healthz`);
  if (res.status !== 200) throw new Error(`Healthz failed: ${res.status}`);
}

export default function () {
  group('Public endpoints', () => {
    const geo = http.get(`${BASE_URL}/api/i18n/geo`);
    check(geo, { 'geo ok': (r) => r.status === 200 }) || errorRate.add(1);

    const suggest = http.get(`${BASE_URL}/api/chatbot/suggested`);
    check(suggest, { 'suggested ok': (r) => r.status === 200 }) || errorRate.add(1);

    const articles = http.get(`${BASE_URL}/api/search/articles?q=booking`);
    check(articles, { 'article search ok': (r) => r.status === 200 }) || errorRate.add(1);
  });

  if (ADMIN_TOKEN) {
    group('Admin endpoints', () => {
      const ops = http.get(`${BASE_URL}/api/ops/live`, { headers: headers(ADMIN_TOKEN) });
      check(ops, { 'ops/live ok': (r) => r.status === 200 }) || errorRate.add(1);

      const funnel = http.get(`${BASE_URL}/api/analytics/funnel`, { headers: headers(ADMIN_TOKEN) });
      check(funnel, { 'analytics funnel ok': (r) => r.status === 200 }) || errorRate.add(1);

      const rfm = http.get(`${BASE_URL}/api/analytics/rfm?limit=10`, { headers: headers(ADMIN_TOKEN) });
      check(rfm, { 'analytics rfm ok': (r) => r.status === 200 }) || errorRate.add(1);
    });
  }

  group('Chatbot', () => {
    const chat = http.post(
      `${BASE_URL}/api/chatbot/message`,
      JSON.stringify({ message: 'how do I cancel my booking?', lang: 'en' }),
      { headers: headers() },
    );
    check(chat, {
      'chatbot 200': (r) => r.status === 200,
      'chatbot has answer': (r) => !!r.json('data.answer'),
    }) || errorRate.add(1);
  });

  sleep(1);
}
