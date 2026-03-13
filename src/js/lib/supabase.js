/**
 * Muhkam — Supabase Client
 * Shared client for the main website (public reads with anon key)
 */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('[Muhkam] Supabase not configured — falling back to local JSON data');
}

export const supabase = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

/**
 * Fetch rows from a Supabase table, sorted by display_order.
 * Falls back to local JSON if Supabase is not configured.
 */
export async function fetchTable(table, { fallbackUrl, listKey, orderCol = 'display_order' } = {}) {
  // Try Supabase first
  if (supabase) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .order(orderCol, { ascending: true });

    if (!error && data && data.length) return data;
    if (error) console.warn(`[Muhkam] Supabase ${table} error:`, error.message);
  }

  // Fallback to local JSON files
  if (fallbackUrl) {
    try {
      const res = await fetch(fallbackUrl);
      if (res.ok) {
        const json = await res.json();
        const items = json[listKey] || json.items || json.members || json.projects || json.offers || [];
        return Array.isArray(items) ? items.sort((a, b) => (a.order || a.display_order || 0) - (b.order || b.display_order || 0)) : [];
      }
    } catch { /* fallback failed */ }
  }

  return [];
}

/**
 * Fetch a single setting value from site_settings table.
 */
export async function fetchSetting(key) {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('site_settings')
    .select('value')
    .eq('key', key)
    .single();
  if (error || !data) return null;
  return data.value;
}

/**
 * Fetch all settings as a key-value object.
 */
export async function fetchAllSettings() {
  if (!supabase) return {};
  const { data, error } = await supabase
    .from('site_settings')
    .select('key, value');
  if (error || !data) return {};
  const settings = {};
  data.forEach(row => { settings[row.key] = row.value; });
  return settings;
}
