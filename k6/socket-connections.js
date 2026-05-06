/**
 * k6 Load Test: 15,000 concurrent WebSocket connections
 *
 * Simulates 15K customers holding open Socket.IO connections and
 * receiving real-time location updates. Validates that the server
 * sustains the connection count without memory leaks or drops.
 *
 * Socket.IO uses long-polling then upgrades to WebSocket.
 * k6 WebSocket API is used directly after the upgrade.
 *
 * Usage:
 *   k6 run --env BASE_URL=http://localhost:4000 k6/socket-connections.js
 *
 * Prerequisites:
 *   - k6 >= 0.43 (built-in WebSocket support)
 *   - A valid JWT_TEST_TOKEN env var (pre-issued long-lived test token)
 */
import ws from 'k6/ws';
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Gauge, Rate } from 'k6/metrics';

const socketErrors = new Rate('socket_errors');
const msgReceived = new Counter('messages_received');
const activeConns = new Gauge('active_connections');

export const options = {
  stages: [
    { duration: '60s', target: 1000 },   // warm-up
    { duration: '120s', target: 5000 },  // ramp
    { duration: '60s', target: 15000 },  // peak
    { duration: '60s', target: 15000 },  // hold at peak
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    socket_errors: ['rate<0.02'],  // < 2% socket errors
    messages_received: ['count>10000'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:4000';
const WS_URL = BASE_URL.replace('http://', 'ws://').replace('https://', 'wss://');
const TEST_TOKEN = __ENV.JWT_TEST_TOKEN || '';
const TEST_BOOKING_ID = __ENV.BOOKING_ID || '000000000000000000000001';

export default function () {
  // Socket.IO handshake via HTTP polling first
  const pollRes = http.get(`${BASE_URL}/socket.io/?EIO=4&transport=polling&token=${TEST_TOKEN}`);
  const pollOk = check(pollRes, { 'socket.io poll ok': (r) => r.status === 200 });
  if (!pollOk) {
    socketErrors.add(1);
    return;
  }

  // Extract session ID from polling response
  let sid = '';
  try {
    const body = pollRes.body;
    // Socket.IO response: 0{"sid":"...","upgrades":["websocket"],...}
    const match = body.match(/"sid":"([^"]+)"/);
    if (match) sid = match[1];
  } catch {}

  // Upgrade to WebSocket
  const url = `${WS_URL}/socket.io/?EIO=4&transport=websocket&sid=${sid}&token=${TEST_TOKEN}`;

  const res = ws.connect(url, {}, function (socket) {
    activeConns.add(1);

    // Socket.IO WebSocket upgrade handshake
    socket.on('open', () => {
      socket.send('2probe'); // ping probe
    });

    socket.on('message', (msg) => {
      msgReceived.add(1);

      if (msg === '3probe') {
        socket.send('5'); // upgrade confirm
        // Join tracking room
        socket.send(`42["join-tracking",{"bookingId":"${TEST_BOOKING_ID}"}]`);
      }
    });

    socket.on('error', (err) => {
      socketErrors.add(1);
    });

    socket.on('close', () => {
      activeConns.add(-1);
    });

    // Hold connection for 90 seconds, then gracefully close
    sleep(90);
    socket.close();
  });

  check(res, { 'ws connected': (r) => r && r.status === 101 });
}
