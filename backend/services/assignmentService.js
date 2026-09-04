// Assignment service — the ONLY layer that touches Supabase for assignments.
const supabase = require('../database/supabaseClient');
const { NotFoundError } = require('../utils/errors');
const { todayISO, addDays } = require('../utils/datetime');

async function getAll(filters = {}) {
  let query = supabase.from('assignments').select('*').order('deadline');
  if (filters.course) query = query.ilike('course', `%${filters.course}%`);
  if (filters.status) query = query.eq('status', filters.status);
  if (filters.dueBefore) query = query.lte('deadline', filters.dueBefore);
  if (filters.dueAfter) query = query.gte('deadline', filters.dueAfter);
  const { data, error } = await query;
  if (error) throw new Error(`Failed to fetch assignments: ${error.message}`);
  return data;
}

// Assignments due in the next 7 days from referenceDate (inclusive).
async function getDueThisWeek(referenceDate = todayISO()) {
  return getAll({ dueAfter: referenceDate, dueBefore: addDays(referenceDate, 7) });
}

async function getById(id) {
  const { data, error } = await supabase.from('assignments').select('*').eq('id', id).maybeSingle();
  if (error) throw new Error(`Failed to fetch assignment: ${error.message}`);
  if (!data) throw new NotFoundError(`Assignment "${id}" not found`);
  return data;
}

async function create(record) {
  const id = record.id || `asgn-${Date.now()}`;
  const withDefaults = { assigned_date: todayISO(), status: 'pending', ...record, id };
  const { data, error } = await supabase.from('assignments').insert(withDefaults).select().single();
  if (error) throw new Error(`Failed to create assignment: ${error.message}`);
  return data;
}

async function update(id, changes) {
  const { data, error } = await supabase
    .from('assignments')
    .update(changes)
    .eq('id', id)
    .select()
    .maybeSingle();
  if (error) throw new Error(`Failed to update assignment: ${error.message}`);
  if (!data) throw new NotFoundError(`Assignment "${id}" not found`);
  return data;
}

async function remove(id) {
  const existing = await getById(id);
  const { error } = await supabase.from('assignments').delete().eq('id', id);
  if (error) throw new Error(`Failed to delete assignment: ${error.message}`);
  return existing;
}

module.exports = { getAll, getDueThisWeek, getById, create, update, remove };
