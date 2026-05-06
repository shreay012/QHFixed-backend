// E2E flow test: customer→admin→PM→resource booking + chat + notifications
// Runs twice (PASS 1 & PASS 2). Uses dev master OTP 1234.

const BASE = process.env.BASE || 'http://localhost:4000/api';
const OTP = '1234';
const NUMBERS = {
  user: '9999988887',
  admin: '9000000000',
  pm: '9111111111',
  resource: '9222222222',
};

const tags = { pass: 0 };
const PASS = (msg) => console.log(`  ✅ ${msg}`);
const FAIL = (msg) => { console.log(`  ❌ ${msg}`); throw new Error(msg); };
const STEP = (msg) => console.log(`\n[P${tags.pass}] ▶ ${msg}`);

async function http(method, path, { token, body } = {}) {
  const r = await fetch(BASE + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await r.text();
  let json;
  try { json = JSON.parse(text); } catch { json = { raw: text }; }
  if (!r.ok) {
    const msg = json?.error?.message || json?.message || text || `HTTP ${r.status}`;
    throw new Error(`${method} ${path} → ${r.status} ${msg}`);
  }
  return json;
}

async function login(role) {
  const mobile = NUMBERS[role];
  await http('POST', '/auth/send-otp', { body: { mobile, role } });
  const r = await http('POST', '/auth/verify-otp', { body: { mobile, otp: OTP, role } });
  const token = r.data?.token;
  const userId = r.data?.user?._id;
  if (!token) throw new Error(`No token for ${role}`);
  return { token, userId, mobile };
}

async function ensureService(adminToken) {
  const list = await http('GET', '/services');
  if (list.data && list.data.length > 0) return list.data[0]._id;
  const created = await http('POST', '/admin/services', {
    token: adminToken,
    body: {
      name: 'E2E Test Service',
      description: 'Test service for E2E flow',
      technologies: ['Node', 'React'],
      hourlyRate: 500,
    },
  });
  return created.data?._id || created.data?.insertedId;
}

async function runOnePass(passNum) {
  tags.pass = passNum;
  console.log(`\n========== PASS ${passNum} ==========`);

  STEP('Login all 4 roles');
  const cust = await login('user');     PASS(`customer ${cust.userId.slice(-8)}`);
  const admin = await login('admin');   PASS(`admin    ${admin.userId.slice(-8)}`);
  const pm = await login('pm');         PASS(`pm       ${pm.userId.slice(-8)}`);
  const res = await login('resource');  PASS(`resource ${res.userId.slice(-8)}`);

  STEP('Ensure a service exists');
  const serviceId = await ensureService(admin.token);
  PASS(`serviceId = ${serviceId}`);

  STEP('Customer creates booking (v3 /jobs flow)');
  // Pick the next weekday (skip Sat/Sun) within 7-day window
  const d = new Date();
  d.setDate(d.getDate() + 1);
  while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() + 1);
  const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const created = await http('POST', '/jobs', {
    token: cust.token,
    body: {
      services: [{
        serviceId,
        technologyIds: [],
        selectedDays: 1,
        requirements: `E2E pass ${passNum} requirements`,
        preferredStartDate: dateStr,
        preferredEndDate: dateStr,
        durationTime: 4,
        startTime: '09:00',
        endTime: '13:00',
        timeSlot: { startTime: '09:00', endTime: '13:00' },
        bookingType: 'later',
      }],
    },
  });
  const bookingId = created.data?.job?._id || created.data?._id;
  if (!bookingId) FAIL('Booking not created — ' + JSON.stringify(created).slice(0, 200));
  PASS(`booking created ${bookingId}`);

  STEP('Admin sees the booking');
  const adminList = await http('GET', '/admin/bookings?limit=50', { token: admin.token });
  const adminBookings = adminList.data?.bookings || adminList.data || [];
  const found = adminBookings.some((b) => String(b._id) === String(bookingId));
  if (!found) FAIL(`Admin list missing booking ${bookingId} (saw ${adminBookings.length})`);
  PASS(`admin /bookings includes new booking (total=${adminList.data?.total ?? adminBookings.length})`);

  STEP('Admin confirms booking');
  await http('POST', `/admin/bookings/${bookingId}/confirm`, { token: admin.token });
  PASS('confirmed');

  STEP('Admin assigns PM');
  await http('POST', `/admin/bookings/${bookingId}/assign-pm`, {
    token: admin.token,
    body: { pmId: pm.userId },
  });
  PASS(`PM ${pm.userId.slice(-8)} assigned`);

  STEP('PM sees booking in their list');
  const pmList = await http('GET', '/pm/bookings?limit=50', { token: pm.token });
  if (!(pmList.data || []).some((b) => String(b._id) === String(bookingId))) {
    FAIL('PM list missing booking');
  }
  PASS('PM /bookings includes booking');

  STEP('PM accepts booking');
  await http('POST', `/pm/bookings/${bookingId}/accept`, {
    token: pm.token,
    body: { note: 'Accepted by PM in E2E' },
  });
  PASS('PM accepted');

  STEP('PM assigns resource');
  await http('POST', `/pm/bookings/${bookingId}/assign-resource`, {
    token: pm.token,
    body: { resourceId: res.userId, note: 'Assigning E2E resource' },
  });
  PASS(`resource ${res.userId.slice(-8)} assigned`);

  STEP('Resource sees the assignment');
  const resList = await http('GET', '/resource/assignments?limit=50', { token: res.token });
  if (!(resList.data || []).some((b) => String(b._id) === String(bookingId))) {
    FAIL('Resource assignments missing booking');
  }
  PASS('resource /assignments includes booking');

  STEP('Resource accepts assignment');
  await http('POST', `/resource/assignments/${bookingId}/accept`, { token: res.token });
  PASS('resource accepted');

  STEP('Each role posts a chat message');
  await http('POST', `/admin/bookings/${bookingId}/messages`, {
    token: admin.token, body: { msg: `[Pass${passNum}] hello from admin` },
  });
  await http('POST', `/pm/bookings/${bookingId}/messages`, {
    token: pm.token, body: { msg: `[Pass${passNum}] hello from PM` },
  });
  await http('POST', `/resource/assignments/${bookingId}/messages`, {
    token: res.token, body: { msg: `[Pass${passNum}] hello from resource` },
  });
  PASS('admin + PM + resource all sent messages');

  STEP('All roles can READ the messages');
  const ma = await http('GET', `/admin/bookings/${bookingId}/messages`, { token: admin.token });
  const mp = await http('GET', `/pm/bookings/${bookingId}/messages`, { token: pm.token });
  const mr = await http('GET', `/resource/assignments/${bookingId}/messages`, { token: res.token });
  const expectAll = (label, arr) => {
    const roles = new Set((arr || []).map((m) => m.senderRole));
    const has = ['admin', 'pm', 'resource'].every((r) => roles.has(r));
    if (!has) FAIL(`${label} missing one of admin/pm/resource. saw=${[...roles].join(',')} count=${arr?.length || 0}`);
    PASS(`${label}: ${arr.length} msgs · roles=${[...roles].sort().join('+')}`);
  };
  expectAll('admin reads',    ma.data);
  expectAll('PM reads',       mp.data);
  expectAll('resource reads', mr.data);

  STEP('Notifications generated for the assignment');
  const pmNotifs = await http('GET', '/notifications', { token: pm.token });
  const resNotifs = await http('GET', '/notifications', { token: res.token });
  const custNotifs = await http('GET', '/notifications', { token: cust.token });
  const pmGotAssigned = (pmNotifs.data || []).some((n) => /assign|booking/i.test(n.type || ''));
  const resGotAssigned = (resNotifs.data || []).some((n) => /assign|booking/i.test(n.type || ''));
  const custGotPmAssigned = (custNotifs.data || []).some((n) => /assign|pm|book/i.test(n.type || ''));
  if (!pmGotAssigned)  FAIL('PM did not receive assignment notification');
  if (!resGotAssigned) FAIL('Resource did not receive assignment notification');
  if (!custGotPmAssigned) FAIL('Customer did not receive PM-assigned notification');
  PASS(`PM notifs ${pmNotifs.data.length} · resource notifs ${resNotifs.data.length} · customer notifs ${custNotifs.data.length}`);

  STEP('Customer sees booking with PM + resource attached');
  const myList = await http('GET', '/bookings/history', { token: cust.token });
  const my = (myList.data || []).find((b) => String(b._id) === String(bookingId));
  if (!my) FAIL('customer history missing booking');
  if (!my.projectManager?._id) FAIL('booking missing projectManager link');
  if (!my.assignedResource?._id) FAIL('booking missing assignedResource link');
  PASS(`customer sees booking · PM=${my.projectManager.name || '—'} · res=${my.assignedResource.name || '—'} · status=${my.status}`);

  return bookingId;
}

(async () => {
  try {
    const b1 = await runOnePass(1);
    const b2 = await runOnePass(2);
    console.log(`\n\n========== ALL PASSES OK ==========`);
    console.log(`Pass 1 booking: ${b1}`);
    console.log(`Pass 2 booking: ${b2}`);
    console.log('Everything interconnected: customer→admin→PM→resource + chat + notifications ✓');
  } catch (e) {
    console.error('\n💥 E2E FAILED:', e.message);
    process.exit(1);
  }
})();
