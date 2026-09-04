// Event service — the ONLY layer that touches Supabase for events & registrations.
const supabase = require('../database/supabaseClient');
const { NotFoundError, ConflictError, UnauthorizedError } = require('../utils/errors');

async function getAll(filters = {}) {
  let query = supabase
    .from('events')
    .select('*, registrations:event_registrations(student_id, name)')
    .order('date');
  if (filters.status) query = query.eq('status', filters.status);
  if (filters.dateFrom) query = query.gte('date', filters.dateFrom);
  if (filters.dateTo) query = query.lte('date', filters.dateTo);
  const { data, error } = await query;
  if (error) throw new Error(`Failed to fetch events: ${error.message}`);
  return data;
}

async function getById(id) {
  const { data, error } = await supabase
    .from('events')
    .select('*, registrations:event_registrations(student_id, name)')
    .eq('id', id)
    .maybeSingle();
  if (error) throw new Error(`Failed to fetch event: ${error.message}`);
  if (!data) throw new NotFoundError(`Event "${id}" not found`);
  return data;
}

// Fuzzy lookup by name for the AI agent ("the Deep Learning guest lecture").
async function findByName(name) {
  const { data, error } = await supabase
    .from('events')
    .select('*, registrations:event_registrations(student_id, name)')
    .ilike('name', `%${name}%`);
  if (error) throw new Error(`Failed to search events: ${error.message}`);
  return data;
}

async function create(record) {
  const id = record.id || `evt-${Date.now()}`;
  const withDefaults = { registered: 0, status: 'upcoming', end_date: record.date, ...record, id };
  const { data, error } = await supabase.from('events').insert(withDefaults).select().single();
  if (error) throw new Error(`Failed to create event: ${error.message}`);
  return data;
}

async function update(id, changes) {
  const { data, error } = await supabase
    .from('events')
    .update(changes)
    .eq('id', id)
    .select()
    .maybeSingle();
  if (error) throw new Error(`Failed to update event: ${error.message}`);
  if (!data) throw new NotFoundError(`Event "${id}" not found`);
  return data;
}

async function remove(id) {
  const existing = await getById(id);
  const { error } = await supabase.from('events').delete().eq('id', id);
  if (error) throw new Error(`Failed to delete event: ${error.message}`);
  return existing;
}

async function register(eventId, { student_id, name }) {
  const event = await getById(eventId);
  if (['cancelled', 'completed'].includes(event.status)) {
    throw new ConflictError(`Cannot register: event "${event.name}" is ${event.status}`);
  }
  if (event.registered >= event.capacity) {
    throw new ConflictError(`Event "${event.name}" is full (${event.registered}/${event.capacity})`);
  }
  if ((event.registrations || []).some((r) => r.student_id === student_id)) {
    throw new ConflictError(`Student ${student_id} is already registered for "${event.name}"`);
  }

  const { error } = await supabase
    .from('event_registrations')
    .insert({ event_id: eventId, student_id, name });
  if (error) {
    if (error.code === '23505') throw new ConflictError(`Student ${student_id} is already registered for "${event.name}"`);
    throw new Error(`Failed to register: ${error.message}`);
  }

  const newCount = event.registered + 1;
  const changes = { registered: newCount };
  if (newCount >= event.capacity) changes.status = 'full';
  return update(eventId, changes);
}

async function cancelRegistration(eventId, student_id, requested_by_student_id) {
  // A student may only cancel their own registration.
  if (requested_by_student_id && requested_by_student_id !== student_id) {
    throw new UnauthorizedError('You can only cancel your own event registration.');
  }
  const event = await getById(eventId);
  const registration = (event.registrations || []).find((r) => r.student_id === student_id);
  if (!registration) {
    throw new NotFoundError(`Student ${student_id} is not registered for "${event.name}"`);
  }
  const { error } = await supabase
    .from('event_registrations')
    .delete()
    .eq('event_id', eventId)
    .eq('student_id', student_id);
  if (error) throw new Error(`Failed to cancel registration: ${error.message}`);

  const newCount = Math.max(0, event.registered - 1);
  const changes = { registered: newCount };
  if (event.status === 'full' && newCount < event.capacity) changes.status = 'upcoming';
  return update(eventId, changes);
}

module.exports = { getAll, getById, findByName, create, update, remove, register, cancelRegistration };
