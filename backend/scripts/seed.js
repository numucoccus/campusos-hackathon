// Idempotent seeder: loads the 5 JSON files from ../../data into Supabase.
// Safe to run multiple times (upserts by primary key).
// Usage: node scripts/seed.js   (from the backend/ folder)

const fs = require('fs');
const path = require('path');
const supabase = require('../database/supabaseClient');

const DATA_DIR = path.join(__dirname, '..', '..', 'data');

function loadJson(name) {
  return JSON.parse(fs.readFileSync(path.join(DATA_DIR, name), 'utf8'));
}

async function upsert(table, rows, onConflict = 'id') {
  if (!rows.length) return;
  const { error } = await supabase.from(table).upsert(rows, { onConflict });
  if (error) throw new Error(`Seeding ${table} failed: ${error.message}`);
  console.log(`  ✔ ${table}: ${rows.length} rows upserted`);
}

async function main() {
  console.log('Seeding CampusOS data into Supabase...');

  // 1. Schedules — flat
  const schedules = loadJson('schedules.json');
  await upsert('schedules', schedules);

  // 2. Rooms — split out nested bookings
  const roomsRaw = loadJson('rooms.json');
  const rooms = roomsRaw.map(({ bookings, ...room }) => room);
  const bookings = roomsRaw.flatMap((room) =>
    (room.bookings || []).map((b) => ({ ...b, room_id: room.id }))
  );
  await upsert('rooms', rooms);
  await upsert('room_bookings', bookings, 'booking_id');

  // 3. Events — split out nested registrations
  const eventsRaw = loadJson('events.json');
  const events = eventsRaw.map(({ registrations, ...evt }) => evt);
  const registrations = eventsRaw.flatMap((evt) =>
    (evt.registrations || []).map((r) => ({
      event_id: evt.id,
      student_id: r.student_id,
      name: r.name,
    }))
  );
  await upsert('events', events);
  if (registrations.length) {
    // identity PK, so upsert on the (event_id, student_id) unique constraint
    const { error } = await supabase
      .from('event_registrations')
      .upsert(registrations, { onConflict: 'event_id,student_id', ignoreDuplicates: true });
    if (error) throw new Error(`Seeding event_registrations failed: ${error.message}`);
    console.log(`  ✔ event_registrations: ${registrations.length} rows upserted`);
  }

  // 4. Announcements — flat
  await upsert('announcements', loadJson('announcements.json'));

  // 5. Assignments — flat
  await upsert('assignments', loadJson('assignments.json'));

  console.log('Done. Database is seeded and ready.');
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
