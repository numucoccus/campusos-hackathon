// Room service — the ONLY layer that touches Supabase for rooms & bookings.
const supabase = require('../database/supabaseClient');
const { NotFoundError, ConflictError, UnauthorizedError, ValidationError } = require('../utils/errors');
const { rangesOverlap, weekdayOf } = require('../utils/datetime');

async function getAll(filters = {}) {
  let query = supabase
    .from('rooms')
    .select('*, bookings:room_bookings(*)')
    .order('room_number');
  if (filters.type) query = query.eq('type', filters.type);
  if (filters.minCapacity) query = query.gte('capacity', filters.minCapacity);
  if (filters.status) query = query.eq('status', filters.status);
  if (filters.equipment) {
    const items = Array.isArray(filters.equipment) ? filters.equipment : [filters.equipment];
    query = query.contains('equipment', items);
  }
  const { data, error } = await query;
  if (error) throw new Error(`Failed to fetch rooms: ${error.message}`);
  return data;
}

async function getById(id) {
  const { data, error } = await supabase
    .from('rooms')
    .select('*, bookings:room_bookings(*)')
    .eq('id', id)
    .maybeSingle();
  if (error) throw new Error(`Failed to fetch room: ${error.message}`);
  if (!data) throw new NotFoundError(`Room "${id}" not found`);
  return data;
}

async function getByRoomNumber(roomNumber) {
  const { data, error } = await supabase
    .from('rooms')
    .select('*, bookings:room_bookings(*)')
    .ilike('room_number', roomNumber)
    .maybeSingle();
  if (error) throw new Error(`Failed to fetch room: ${error.message}`);
  if (!data) throw new NotFoundError(`Room "${roomNumber}" not found`);
  return data;
}

async function create(record) {
  const id = record.id || `room-${Date.now()}`;
  const { data, error } = await supabase
    .from('rooms')
    .insert({ ...record, id })
    .select()
    .single();
  if (error) {
    if (error.code === '23505') throw new ConflictError(`Room number "${record.room_number}" already exists`);
    throw new Error(`Failed to create room: ${error.message}`);
  }
  return data;
}

async function update(id, changes) {
  const { data, error } = await supabase
    .from('rooms')
    .update(changes)
    .eq('id', id)
    .select()
    .maybeSingle();
  if (error) throw new Error(`Failed to update room: ${error.message}`);
  if (!data) throw new NotFoundError(`Room "${id}" not found`);
  return data;
}

async function remove(id) {
  const existing = await getById(id);
  const { error } = await supabase.from('rooms').delete().eq('id', id);
  if (error) throw new Error(`Failed to delete room: ${error.message}`);
  return existing;
}

async function getBookings(roomId) {
  const { data, error } = await supabase
    .from('room_bookings')
    .select('*')
    .eq('room_id', roomId)
    .order('date')
    .order('start_time');
  if (error) throw new Error(`Failed to fetch bookings: ${error.message}`);
  return data;
}

// Checks a room's availability for a date + time range against BOTH existing
// bookings and regular class schedules occupying that room on that weekday.
// Returns { available, conflicts: [...] }.
async function checkAvailability(roomNumber, date, start_time, end_time) {
  if (!(start_time < end_time)) throw new ValidationError('end_time must be after start_time');
  const room = await getByRoomNumber(roomNumber);
  if (room.status !== 'available') {
    return { available: false, room, conflicts: [{ type: 'room_status', reason: `Room ${room.room_number} is marked ${room.status}` }] };
  }

  const conflicts = [];

  const bookingConflicts = (room.bookings || []).filter(
    (b) => b.date === date && rangesOverlap(start_time, end_time, b.start_time, b.end_time)
  );
  for (const b of bookingConflicts) {
    conflicts.push({ type: 'booking', reason: `Booked by ${b.booked_by} ${b.start_time}–${b.end_time} (${b.purpose})`, booking: b });
  }

  const weekday = weekdayOf(date);
  const { data: classes, error } = await supabase
    .from('schedules')
    .select('*')
    .eq('room', room.room_number)
    .eq('day', weekday);
  if (error) throw new Error(`Failed to check schedules: ${error.message}`);
  for (const c of classes || []) {
    if (rangesOverlap(start_time, end_time, c.start_time, c.end_time)) {
      conflicts.push({ type: 'class', reason: `${c.course} class ${c.start_time}–${c.end_time}`, schedule: c });
    }
  }

  return { available: conflicts.length === 0, room, conflicts };
}

async function bookRoom({ room_number, date, start_time, end_time, booked_by, purpose = '' }) {
  const { available, room, conflicts } = await checkAvailability(room_number, date, start_time, end_time);
  if (!available) {
    throw new ConflictError(
      `Room ${room.room_number} is not available on ${date} ${start_time}–${end_time}: ${conflicts.map((c) => c.reason).join('; ')}`,
      conflicts
    );
  }
  const booking = {
    booking_id: `bk-${Date.now()}`,
    room_id: room.id,
    booked_by,
    date,
    start_time,
    end_time,
    purpose,
  };
  const { data, error } = await supabase.from('room_bookings').insert(booking).select().single();
  if (error) {
    // DB unique constraint double-checks the exact slot (race-condition guard).
    if (error.code === '23505') throw new ConflictError(`Room ${room.room_number} was just booked for that exact slot`);
    throw new Error(`Failed to book room: ${error.message}`);
  }
  return { ...data, room_number: room.room_number };
}

async function cancelBooking(booking_id, requested_by) {
  const { data: booking, error } = await supabase
    .from('room_bookings')
    .select('*')
    .eq('booking_id', booking_id)
    .maybeSingle();
  if (error) throw new Error(`Failed to fetch booking: ${error.message}`);
  if (!booking) throw new NotFoundError(`Booking "${booking_id}" not found`);
  if (!requested_by || booking.booked_by.toLowerCase() !== requested_by.toLowerCase()) {
    throw new UnauthorizedError(
      `This booking belongs to "${booking.booked_by}". You can only cancel your own bookings.`
    );
  }
  const { error: delError } = await supabase.from('room_bookings').delete().eq('booking_id', booking_id);
  if (delError) throw new Error(`Failed to cancel booking: ${delError.message}`);
  return booking;
}

// Finds all rooms free for the given slot, optionally filtered by capacity/equipment.
async function findAvailableRooms({ date, start_time, end_time, minCapacity, equipment }) {
  const rooms = await getAll({ minCapacity, equipment, status: 'available' });
  const results = [];
  for (const room of rooms) {
    const { available } = await checkAvailability(room.room_number, date, start_time, end_time);
    if (available) results.push(room);
  }
  return results;
}

module.exports = {
  getAll,
  getById,
  getByRoomNumber,
  create,
  update,
  remove,
  getBookings,
  checkAvailability,
  bookRoom,
  cancelBooking,
  findAvailableRooms,
};
