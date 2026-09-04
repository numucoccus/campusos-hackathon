// Schedule service — the ONLY layer that touches Supabase for schedules.
const supabase = require('../database/supabaseClient');
const { NotFoundError } = require('../utils/errors');

async function getAll(filters = {}) {
  let query = supabase.from('schedules').select('*').order('day').order('start_time');
  if (filters.day) query = query.eq('day', filters.day);
  if (filters.course) query = query.ilike('course', `%${filters.course}%`);
  if (filters.room) query = query.eq('room', filters.room);
  const { data, error } = await query;
  if (error) throw new Error(`Failed to fetch schedules: ${error.message}`);
  return data;
}

async function getById(id) {
  const { data, error } = await supabase.from('schedules').select('*').eq('id', id).maybeSingle();
  if (error) throw new Error(`Failed to fetch schedule: ${error.message}`);
  if (!data) throw new NotFoundError(`Schedule "${id}" not found`);
  return data;
}

async function create(record) {
  const id = record.id || `sch-${Date.now()}`;
  const { data, error } = await supabase
    .from('schedules')
    .insert({ ...record, id })
    .select()
    .single();
  if (error) throw new Error(`Failed to create schedule: ${error.message}`);
  return data;
}

async function update(id, changes) {
  const { data, error } = await supabase
    .from('schedules')
    .update(changes)
    .eq('id', id)
    .select()
    .maybeSingle();
  if (error) throw new Error(`Failed to update schedule: ${error.message}`);
  if (!data) throw new NotFoundError(`Schedule "${id}" not found`);
  return data;
}

async function remove(id) {
  const existing = await getById(id);
  const { error } = await supabase.from('schedules').delete().eq('id', id);
  if (error) throw new Error(`Failed to delete schedule: ${error.message}`);
  return existing;
}

module.exports = { getAll, getById, create, update, remove };
