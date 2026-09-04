// API verification for Prompt 3 (uses fetch against the running server).
const base = 'http://localhost:3001/api';

async function req(method, path, body) {
  const res = await fetch(base + path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  let json = null;
  try { json = await res.json(); } catch {}
  return { status: res.status, json };
}

async function main() {
  console.log('--- announcement CRUD ---');
  const c = await req('POST', '/announcements', { title: 'API TEST', body: 'test body', priority: 'low', posted_by: 'tester', expires: '2026-12-31' });
  console.log('create:', c.status, c.json.id);
  const u = await req('PUT', `/announcements/${c.json.id}`, { title: 'API TEST v2' });
  console.log('update:', u.status, u.json.title);
  const d = await req('DELETE', `/announcements/${c.json.id}`);
  console.log('delete:', d.status);

  console.log('--- validation (bad priority, expect 400) ---');
  const v = await req('POST', '/announcements', { title: 'x', body: 'y', priority: 'urgent', posted_by: 'z', expires: '2026-12-31' });
  console.log('status:', v.status, JSON.stringify(v.json.details));

  console.log('--- booking flow ---');
  const b1 = await req('POST', '/rooms/7A01/book', { date: '2026-09-05', start_time: '18:00', end_time: '19:00', booked_by: 'API Tester', purpose: 'test' });
  console.log('book (expect 201):', b1.status, b1.json.booking_id);
  const b2 = await req('POST', '/rooms/7A01/book', { date: '2026-09-05', start_time: '18:30', end_time: '19:30', booked_by: 'Other', purpose: 'overlap' });
  console.log('double-book (expect 409):', b2.status, b2.json.error);
  const cx = await req('DELETE', `/rooms/bookings/${b1.json.booking_id}`, { requested_by: 'Wrong Person' });
  console.log('unauthorized cancel (expect 403):', cx.status);
  const ok = await req('DELETE', `/rooms/bookings/${b1.json.booking_id}`, { requested_by: 'API Tester' });
  console.log('own cancel (expect 200):', ok.status);

  console.log('--- event registration flow ---');
  const r1 = await req('POST', '/events/evt-003/register', { student_id: '99-99999', name: 'Api Tester' });
  console.log('register (expect 201):', r1.status, `${r1.json.registered}/${r1.json.capacity}`);
  const r2 = await req('POST', '/events/evt-003/register', { student_id: '99-99999', name: 'Api Tester' });
  console.log('duplicate register (expect 409):', r2.status);
  const r3 = await req('DELETE', '/events/evt-003/register/99-99999');
  console.log('cancel registration (expect 200):', r3.status, `registered=${r3.json.registered}`);

  console.log('--- availability endpoints ---');
  const av = await req('GET', '/rooms/availability?room_number=7A02&date=2026-09-05&start=15:00&end=17:00');
  console.log('7A02 availability:', av.status, 'available =', av.json.available);
  const fr = await req('GET', '/rooms/available?date=2026-09-05&start=14:00&end=16:00&minCapacity=5&equipment=projector');
  console.log('find rooms:', fr.status, 'count =', fr.json.length);
}

main().catch((e) => { console.error('FAILED:', e); process.exit(1); });
