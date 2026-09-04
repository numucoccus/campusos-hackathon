// Smoke test: exercises the service layer against the live Supabase DB.
// Usage: node scripts/smokeTest.js (from backend/)

const schedules = require('../services/scheduleService');
const rooms = require('../services/roomService');
const events = require('../services/eventService');
const announcements = require('../services/announcementService');
const assignments = require('../services/assignmentService');

async function main() {
  console.log('— Read checks —');
  console.log('schedules:', (await schedules.getAll()).length);
  console.log('schedules (Wednesday):', (await schedules.getAll({ day: 'Wednesday' })).length);
  const allRooms = await rooms.getAll();
  console.log('rooms:', allRooms.length);
  console.log('labs w/ projector cap>=30:', (await rooms.getAll({ type: 'lab', minCapacity: 30, equipment: 'projector' })).map((r) => r.room_number));
  console.log('events:', (await events.getAll()).length);
  console.log('announcements:', (await announcements.getAll()).length);
  console.log('announcements (high, active):', (await announcements.getAll({ priority: 'high', activeOnly: true })).length);
  console.log('assignments:', (await assignments.getAll()).length);
  console.log('assignments due this week:', (await assignments.getDueThisWeek()).map((a) => `${a.course} ${a.deadline}`));

  console.log('\n— Availability checks —');
  const avail = await rooms.checkAvailability('7A02', '2026-09-05', '15:00', '17:00');
  console.log('7A02 2026-09-05 15:00-17:00 available:', avail.available);
  const found = await rooms.findAvailableRooms({ date: '2026-09-05', start_time: '14:00', end_time: '16:00', minCapacity: 5, equipment: 'projector' });
  console.log('rooms for 5 ppl + projector tomorrow 14-16:', found.length);

  console.log('\n— Mutation round-trip (announcement) —');
  const created = await announcements.create({ title: 'SMOKE TEST', body: 'temp', priority: 'low', posted_by: 'smoke', expires: '2026-12-31', date: '2026-09-04' });
  console.log('created:', created.id);
  const updated = await announcements.update(created.id, { title: 'SMOKE TEST v2' });
  console.log('updated title:', updated.title);
  await announcements.remove(created.id);
  console.log('deleted OK');

  console.log('\n— Booking conflict + auth checks —');
  const booking = await rooms.bookRoom({ room_number: '7A01', date: '2026-09-05', start_time: '15:00', end_time: '16:00', booked_by: 'Smoke Tester', purpose: 'test' });
  console.log('booked:', booking.booking_id);
  try {
    await rooms.bookRoom({ room_number: '7A01', date: '2026-09-05', start_time: '15:30', end_time: '16:30', booked_by: 'Other', purpose: 'overlap' });
    console.log('ERROR: overlap was allowed!');
  } catch (e) {
    console.log('overlap rejected (expected):', e.name);
  }
  try {
    await rooms.cancelBooking(booking.booking_id, 'Someone Else');
    console.log('ERROR: unauthorized cancel allowed!');
  } catch (e) {
    console.log('unauthorized cancel rejected (expected):', e.name);
  }
  await rooms.cancelBooking(booking.booking_id, 'Smoke Tester');
  console.log('own booking cancelled OK');

  console.log('\nAll smoke tests passed.');
}

main().catch((err) => {
  console.error('SMOKE TEST FAILED:', err.message);
  process.exit(1);
});
