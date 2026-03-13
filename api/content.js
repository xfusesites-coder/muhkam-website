import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { verifyToken } from './auth.js';
import { createClient } from '@supabase/supabase-js';

const DATA_DIR = join(process.cwd(), 'data');
const ALLOWED_TYPES = ['testimonials', 'team', 'portfolio', 'offers', 'contact_submissions'];
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'https://muhkam.com').split(',').map(s => s.trim());

/* ─── Supabase client (service role for writes) ─── */
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

/* ─── Field mapping: camelCase (API) ↔ snake_case (Supabase) ─── */
const FIELD_MAP = {
  testimonials: {
    toDb: { nameEn: 'name_en', nameAr: 'name_ar', positionEn: 'position_en', positionAr: 'position_ar', quoteEn: 'quote_en', quoteAr: 'quote_ar', order: 'display_order', imageUrl: 'image_url' },
    toApi: { name_en: 'nameEn', name_ar: 'nameAr', position_en: 'positionEn', position_ar: 'positionAr', quote_en: 'quoteEn', quote_ar: 'quoteAr', display_order: 'order', image_url: 'imageUrl', is_active: null },
  },
  team: {
    toDb: { nameEn: 'name_en', nameAr: 'name_ar', roleEn: 'role_en', roleAr: 'role_ar', quoteEn: 'quote_en', quoteAr: 'quote_ar', image: 'image_url', imageUrl: 'image_url', order: 'display_order' },
    toApi: { name_en: 'nameEn', name_ar: 'nameAr', role_en: 'roleEn', role_ar: 'roleAr', quote_en: 'quoteEn', quote_ar: 'quoteAr', image_url: 'image', display_order: 'order', is_active: null },
  },
  portfolio: {
    toDb: { titleEn: 'title_en', titleAr: 'title_ar', descriptionEn: 'description_en', descriptionAr: 'description_ar', tagEn: 'tag_en', tagAr: 'tag_ar', image: 'image_url', imageUrl: 'image_url', link: 'project_link', order: 'display_order' },
    toApi: { title_en: 'titleEn', title_ar: 'titleAr', description_en: 'descriptionEn', description_ar: 'descriptionAr', tag_en: 'tagEn', tag_ar: 'tagAr', image_url: 'image', project_link: 'link', display_order: 'order', is_active: null },
  },
  offers: {
    toDb: { titleEn: 'title_en', titleAr: 'title_ar', descriptionEn: 'description_en', descriptionAr: 'description_ar', priceEn: 'price_en', priceAr: 'price_ar', badgeEn: 'badge_en', badgeAr: 'badge_ar', featuresEn: 'features_en', featuresAr: 'features_ar', ctaType: 'cta_type', ctaValue: 'cta_value', order: 'display_order' },
    toApi: { title_en: 'titleEn', title_ar: 'titleAr', description_en: 'descriptionEn', description_ar: 'descriptionAr', price_en: 'priceEn', price_ar: 'priceAr', badge_en: 'badgeEn', badge_ar: 'badgeAr', features_en: 'featuresEn', features_ar: 'featuresAr', cta_type: 'ctaType', cta_value: 'ctaValue', display_order: 'order', is_active: null },
  },
  contact_submissions: {
    toDb: {},
    toApi: { created_at: 'createdAt' },
  },
};

function mapToDb(item, type) {
  const map = FIELD_MAP[type]?.toDb || {};
  const result = {};
  for (const [key, val] of Object.entries(item)) {
    if (key === 'id') continue;
    result[map[key] || key] = val;
  }
  return result;
}

function mapToApi(row, type) {
  const map = FIELD_MAP[type]?.toApi || {};
  const result = {};
  for (const [key, val] of Object.entries(row)) {
    if (map[key] === null) continue; // skip fields like is_active
    if (key === 'created_at' || key === 'updated_at') continue;
    result[map[key] || key] = val;
  }
  return result;
}

function getDataPath(type) {
  return join(DATA_DIR, `${type}.json`);
}

function readData(type) {
  const filePath = getDataPath(type);
  if (!existsSync(filePath)) return null;
  return JSON.parse(readFileSync(filePath, 'utf-8'));
}

function writeData(type, data) {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(getDataPath(type), JSON.stringify(data, null, 2), 'utf-8');
}

function sanitizeString(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').trim().slice(0, 2000);
}

function sanitizeStringArray(arr) {
  if (!Array.isArray(arr)) return [];
  return arr.filter(s => typeof s === 'string').map(s => sanitizeString(s)).slice(0, 50);
}

function sanitizeItem(item, type) {
  const s = {};
  if (type === 'testimonials') {
    s.id = sanitizeString(item.id || `t${Date.now()}`);
    s.nameEn = sanitizeString(item.nameEn); s.nameAr = sanitizeString(item.nameAr);
    s.initials = sanitizeString(item.initials).slice(0, 3);
    s.positionEn = sanitizeString(item.positionEn); s.positionAr = sanitizeString(item.positionAr);
    s.quoteEn = sanitizeString(item.quoteEn); s.quoteAr = sanitizeString(item.quoteAr);
    s.rating = Math.min(5, Math.max(1, parseInt(item.rating) || 5));
    s.order = parseInt(item.order) || 0;
  } else if (type === 'team') {
    s.id = sanitizeString(item.id || `m${Date.now()}`);
    s.initials = sanitizeString(item.initials).slice(0, 3);
    s.nameEn = sanitizeString(item.nameEn); s.nameAr = sanitizeString(item.nameAr);
    s.roleEn = sanitizeString(item.roleEn); s.roleAr = sanitizeString(item.roleAr);
    s.quoteEn = sanitizeString(item.quoteEn); s.quoteAr = sanitizeString(item.quoteAr);
    s.linkedin = sanitizeString(item.linkedin).slice(0, 500);
    s.github = sanitizeString(item.github).slice(0, 500);
    s.image = sanitizeString(item.image).slice(0, 500);
    s.order = parseInt(item.order) || 0;
  } else if (type === 'portfolio') {
    s.id = sanitizeString(item.id || `p${Date.now()}`);
    s.titleEn = sanitizeString(item.titleEn); s.titleAr = sanitizeString(item.titleAr);
    s.descriptionEn = sanitizeString(item.descriptionEn); s.descriptionAr = sanitizeString(item.descriptionAr);
    s.tagEn = sanitizeString(item.tagEn); s.tagAr = sanitizeString(item.tagAr);
    s.image = sanitizeString(item.image).slice(0, 500);
    s.link = sanitizeString(item.link).slice(0, 500);
    s.featured = Boolean(item.featured);
    s.order = parseInt(item.order) || 0;
  } else if (type === 'offers') {
    s.id = sanitizeString(item.id || `o${Date.now()}`);
    s.icon = sanitizeString(item.icon).slice(0, 10);
    s.titleEn = sanitizeString(item.titleEn); s.titleAr = sanitizeString(item.titleAr);
    s.descriptionEn = sanitizeString(item.descriptionEn); s.descriptionAr = sanitizeString(item.descriptionAr);
    s.priceEn = sanitizeString(item.priceEn).slice(0, 100); s.priceAr = sanitizeString(item.priceAr).slice(0, 100);
    s.badgeEn = sanitizeString(item.badgeEn).slice(0, 100); s.badgeAr = sanitizeString(item.badgeAr).slice(0, 100);
    s.featuresEn = sanitizeStringArray(item.featuresEn);
    s.featuresAr = sanitizeStringArray(item.featuresAr);
    s.popular = Boolean(item.popular);
    s.order = parseInt(item.order) || 0;
  }
  return s;
}

function getListKey(type) {
  if (type === 'team') return 'members';
  if (type === 'portfolio') return 'projects';
  if (type === 'offers') return 'offers';
  if (type === 'contact_submissions') return 'messages';
  return 'items';
}

function getDefaultData(type) {
  return { [getListKey(type)]: [] };
}

function getCorsOrigin(req) {
  const origin = req.headers.origin || req.headers.referer || '';
  if (ALLOWED_ORIGINS.includes('*') || ALLOWED_ORIGINS.some(o => origin.startsWith(o))) return origin;
  return ALLOWED_ORIGINS[0];
}

export default async function handler(req, res) {
  const corsOrigin = getCorsOrigin(req);
  res.setHeader('Access-Control-Allow-Origin', corsOrigin);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { type, id } = req.query || {};

  if (!type || !ALLOWED_TYPES.includes(type)) {
    return res.status(400).json({ error: `Invalid type. Must be one of: ${ALLOWED_TYPES.join(', ')}` });
  }

  /* ─── GET (public for content, auth-required for messages) ─── */
  if (req.method === 'GET') {
    // Contact submissions require auth
    if (type === 'contact_submissions') {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      const payload = await verifyToken(authHeader.slice(7));
      if (!payload) return res.status(401).json({ error: 'Invalid or expired token' });

      if (supabase) {
        const { data: rows, error } = await supabase
          .from('contact_submissions')
          .select('*')
          .order('created_at', { ascending: false });
        if (error) return res.status(500).json({ error: 'Database error' });
        const items = (rows || []).map(r => mapToApi(r, type));
        return res.status(200).json({ messages: items });
      }
      return res.status(200).json({ messages: [] });
    }

    if (supabase) {
      let query = supabase.from(type).select('*');
      if (type === 'contact_submissions') {
        query = query.order('created_at', { ascending: false });
      } else {
        query = query.eq('is_active', true).order('display_order', { ascending: true });
      }
      const { data: rows, error } = await query;
      if (error) return res.status(500).json({ error: 'Database error' });
      const listKey = getListKey(type);
      const items = (rows || []).map(r => mapToApi(r, type));
      res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=60');
      return res.status(200).json({ [listKey]: items });
    }
    const data = readData(type);
    if (!data) return res.status(404).json({ error: 'Data not found' });
    res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=60');
    return res.status(200).json(data);
  }

  /* ─── Auth check for writes ─── */
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  const payload = await verifyToken(authHeader.slice(7));
  if (!payload) return res.status(401).json({ error: 'Invalid or expired token' });

  /* ─── POST (create) ─── */
  if (req.method === 'POST') {
    if (type === 'contact_submissions') {
      return res.status(405).json({ error: 'Messages are created via the contact form only' });
    }
    const item = req.body;
    if (!item || typeof item !== 'object') return res.status(400).json({ error: 'Invalid item data' });
    const sanitized = sanitizeItem(item, type);

    if (supabase) {
      const dbItem = mapToDb(sanitized, type);
      delete dbItem.id;
      const { data: inserted, error } = await supabase.from(type).insert(dbItem).select().single();
      if (error) return res.status(500).json({ error: 'Database insert error' });
      return res.status(201).json({ item: mapToApi(inserted, type), message: 'Item added successfully' });
    }

    const data = readData(type) || getDefaultData(type);
    const listKey = getListKey(type);
    if (!sanitized.id || data[listKey].some(i => i.id === sanitized.id)) {
      sanitized.id = `${type.charAt(0)}${Date.now()}`;
    }
    sanitized.order = data[listKey].length + 1;
    data[listKey].push(sanitized);
    writeData(type, data);
    return res.status(201).json({ item: sanitized, message: 'Item added successfully' });
  }

  /* ─── PUT (update/reorder) ─── */
  if (req.method === 'PUT') {
    // Contact submissions: only status update allowed
    if (type === 'contact_submissions') {
      if (!id) return res.status(400).json({ error: 'Message ID is required' });
      const validStatuses = ['new', 'read', 'replied'];
      const status = req.body?.status;
      if (!status || !validStatuses.includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
      }
      if (supabase) {
        const { error } = await supabase.from('contact_submissions').update({ status }).eq('id', id);
        if (error) return res.status(500).json({ error: 'Database update error' });
        return res.status(200).json({ message: 'Status updated' });
      }
      return res.status(200).json({ message: 'Status updated' });
    }

    if (req.body.order && Array.isArray(req.body.order)) {
      if (supabase) {
        const updates = req.body.order.map((itemId, i) =>
          supabase.from(type).update({ display_order: i + 1 }).eq('id', itemId)
        );
        await Promise.all(updates);
        return res.status(200).json({ message: 'Order updated successfully' });
      }
      const data = readData(type) || getDefaultData(type);
      const listKey = getListKey(type);
      const reordered = [];
      for (let i = 0; i < req.body.order.length; i++) {
        const found = data[listKey].find(item => item.id === req.body.order[i]);
        if (found) { found.order = i + 1; reordered.push(found); }
      }
      data[listKey] = reordered;
      writeData(type, data);
      return res.status(200).json({ message: 'Order updated successfully' });
    }
    if (!id) return res.status(400).json({ error: 'Item ID is required for update' });

    if (supabase) {
      const sanitized = sanitizeItem(req.body, type);
      const dbItem = mapToDb(sanitized, type);
      const { data: updated, error } = await supabase.from(type).update(dbItem).eq('id', id).select().single();
      if (error) return res.status(500).json({ error: 'Database update error' });
      if (!updated) return res.status(404).json({ error: 'Item not found' });
      return res.status(200).json({ item: mapToApi(updated, type), message: 'Item updated successfully' });
    }

    const data = readData(type) || getDefaultData(type);
    const listKey = getListKey(type);
    const index = data[listKey].findIndex(item => item.id === id);
    if (index === -1) return res.status(404).json({ error: 'Item not found' });
    const sanitized = sanitizeItem({ ...data[listKey][index], ...req.body }, type);
    sanitized.id = id;
    data[listKey][index] = sanitized;
    writeData(type, data);
    return res.status(200).json({ item: sanitized, message: 'Item updated successfully' });
  }

  /* ─── DELETE ─── */
  if (req.method === 'DELETE') {
    if (!id) return res.status(400).json({ error: 'Item ID is required for delete' });

    if (supabase) {
      const { error } = await supabase.from(type).delete().eq('id', id);
      if (error) return res.status(500).json({ error: 'Database delete error' });
      return res.status(200).json({ message: 'Item deleted successfully' });
    }

    const data = readData(type) || getDefaultData(type);
    const listKey = getListKey(type);
    const index = data[listKey].findIndex(item => item.id === id);
    if (index === -1) return res.status(404).json({ error: 'Item not found' });
    data[listKey].splice(index, 1);
    data[listKey].forEach((item, i) => { item.order = i + 1; });
    writeData(type, data);
    return res.status(200).json({ message: 'Item deleted successfully' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
