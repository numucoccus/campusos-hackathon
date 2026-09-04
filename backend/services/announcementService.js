// Announcement service — the ONLY layer that touches Supabase for announcements.
const supabase = require('../database/supabaseClient');
const { NotFoundError } = require('../utils/errors');
const { todayISO } = require('../utils/datetime');

async function getAll(filters = {}) {
  let query = supabase
    .from('announcements')
    .select('*')
    .order('date', { ascending: false });
  if (filters.priority) query = query.eq('priority', filters.priority);
  if (filters.activeOnly) query = query.gte('expires', todayISO());
  const { data, error } = await query;
  if (error) throw new Error(`Failed to fetch announcements: ${error.message}`);
  return data;
}

async function getById(id) {
  const { data, error } = await supabase.from('announcements').select('*').eq('id', id).maybeSingle();
  if (error) throw new Error(`Failed to fetch announcement: ${error.message}`);
  if (!data) throw new NotFoundError(`Announcement "${id}" not found`);
  return data;
}

async function create(record) {
  const id = record.id || `ann-${Date.now()}`;
  const withDefaults = { date: todayISO(), ...record, id };
  const { data, error } = await supabase.from('announcements').insert(withDefaults).select().single();
  if (error) throw new Error(`Failed to create announcement: ${error.message}`);
  return data;
}

async function update(id, changes) {
  const { data, error } = await supabase
    .from('announcements')
    .update(changes)
    .eq('id', id)
    .select()
    .maybeSingle();
  if (error) throw new Error(`Failed to update announcement: ${error.message}`);
  if (!data) throw new NotFoundError(`Announcement "${id}" not found`);
  return data;
}

async function remove(id) {
  const existing = await getById(id);
  const { error } = await supabase.from('announcements').delete().eq('id', id);
  if (error) throw new Error(`Failed to delete announcement: ${error.message}`);
  return existing;
}

module.exports = { getAll, getById, create, update, remove };
