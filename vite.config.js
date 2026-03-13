import { defineConfig } from 'vite';
import { resolve } from 'path';
import { cpSync, existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { createHmac, timingSafeEqual } from 'crypto';
import 'dotenv/config';

function copyDataPlugin() {
  return {
    name: 'copy-data',
    closeBundle() {
      if (existsSync('data')) {
        cpSync('data', 'dist/data', { recursive: true });
      }
    },
  };
}

/* ─── Dev API middleware ─── */
function devApiPlugin() {
  const JWT_SECRET = 'muhkam-dev-secret';
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'muhkam2024';
  const ALLOWED_TYPES = ['testimonials', 'team', 'portfolio', 'offers', 'contact_submissions'];

  /* ── Supabase client (service role for dev API) ── */
  let _supabase = null;
  async function getSupabase() {
    if (_supabase !== undefined && _supabase !== null) return _supabase;
    const url = process.env.VITE_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) { _supabase = null; return null; }
    try {
      const { createClient } = await import('@supabase/supabase-js');
      _supabase = createClient(url, key);
      return _supabase;
    } catch { _supabase = null; return null; }
  }

  /* ── Field mapping: camelCase (API) ↔ snake_case (Supabase) ── */
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
      toDb: { titleEn: 'title_en', titleAr: 'title_ar', descriptionEn: 'description_en', descriptionAr: 'description_ar', priceEn: 'price_en', priceAr: 'price_ar', badgeEn: 'badge_en', badgeAr: 'badge_ar', featuresEn: 'features_en', featuresAr: 'features_ar', order: 'display_order' },
      toApi: { title_en: 'titleEn', title_ar: 'titleAr', description_en: 'descriptionEn', description_ar: 'descriptionAr', price_en: 'priceEn', price_ar: 'priceAr', badge_en: 'badgeEn', badge_ar: 'badgeAr', features_en: 'featuresEn', features_ar: 'featuresAr', display_order: 'order', is_active: null },
    },
    contact_submissions: {
      toDb: {},
      toApi: { created_at: 'createdAt' },
    },
  };

  function mapToApi(row, type) {
    const map = FIELD_MAP[type]?.toApi || {};
    const result = {};
    for (const [key, val] of Object.entries(row)) {
      if (map[key] === null) continue;
      result[map[key] || key] = val;
    }
    return result;
  }

  function mapToDb(item, type) {
    const map = FIELD_MAP[type]?.toDb || {};
    const result = {};
    for (const [key, val] of Object.entries(item)) {
      if (key === 'id') continue;
      result[map[key] || key] = val;
    }
    return result;
  }

  function sign(payload) {
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const body = Buffer.from(JSON.stringify({ ...payload, iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 86400 })).toString('base64url');
    const sig = createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url');
    return `${header}.${body}.${sig}`;
  }

  function verify(token) {
    try {
      const [header, body, sig] = token.split('.');
      const expected = createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url');
      if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
      const payload = JSON.parse(Buffer.from(body, 'base64url').toString());
      if (payload.exp < Date.now() / 1000) return null;
      return payload;
    } catch { return null; }
  }

  function dataPath(type) { return join(process.cwd(), 'data', `${type}.json`); }
  function readData(type) {
    const p = dataPath(type);
    return existsSync(p) ? JSON.parse(readFileSync(p, 'utf-8')) : null;
  }
  function saveData(type, data) {
    const dir = join(process.cwd(), 'data');
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    writeFileSync(dataPath(type), JSON.stringify(data, null, 2), 'utf-8');
  }
  function listKey(type) {
    if (type === 'team') return 'members';
    if (type === 'portfolio') return 'projects';
    if (type === 'offers') return 'offers';
    if (type === 'contact_submissions') return 'messages';
    return 'items';
  }
  function defaultData(type) { return { [listKey(type)]: [] }; }

  function sanitize(str) { return typeof str !== 'string' ? '' : str.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').trim().slice(0, 2000); }
  function sanitizeItem(item, type) {
    const s = {};
    if (type === 'testimonials') {
      s.id = sanitize(item.id || `t${Date.now()}`); s.nameEn = sanitize(item.nameEn); s.nameAr = sanitize(item.nameAr);
      s.initials = sanitize(item.initials).slice(0, 3); s.positionEn = sanitize(item.positionEn); s.positionAr = sanitize(item.positionAr);
      s.quoteEn = sanitize(item.quoteEn); s.quoteAr = sanitize(item.quoteAr);
      s.rating = Math.min(5, Math.max(1, parseInt(item.rating) || 5)); s.order = parseInt(item.order) || 0;
    } else if (type === 'team') {
      s.id = sanitize(item.id || `m${Date.now()}`); s.initials = sanitize(item.initials).slice(0, 3);
      s.nameEn = sanitize(item.nameEn); s.nameAr = sanitize(item.nameAr);
      s.roleEn = sanitize(item.roleEn); s.roleAr = sanitize(item.roleAr);
      s.quoteEn = sanitize(item.quoteEn); s.quoteAr = sanitize(item.quoteAr);
      s.linkedin = sanitize(item.linkedin).slice(0, 500); s.github = sanitize(item.github).slice(0, 500);
      s.order = parseInt(item.order) || 0;
    } else if (type === 'portfolio') {
      s.id = sanitize(item.id || `p${Date.now()}`); s.titleEn = sanitize(item.titleEn); s.titleAr = sanitize(item.titleAr);
      s.descriptionEn = sanitize(item.descriptionEn); s.descriptionAr = sanitize(item.descriptionAr);
      s.tagEn = sanitize(item.tagEn); s.tagAr = sanitize(item.tagAr);
      s.image = sanitize(item.image).slice(0, 500); s.link = sanitize(item.link).slice(0, 500);
      s.featured = Boolean(item.featured); s.order = parseInt(item.order) || 0;
    }
    return s;
  }

  function json(res, status, data) {
    res.writeHead(status, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
    res.end(JSON.stringify(data));
  }

  return {
    name: 'dev-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        // CORS preflight
        if (req.method === 'OPTIONS' && req.url.startsWith('/api/')) {
          res.writeHead(200, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          });
          return res.end();
        }

        // ── Auth endpoint ──
        if (req.url === '/api/auth' && req.method === 'POST') {
          let body = '';
          req.on('data', c => body += c);
          req.on('end', () => {
            try {
              const { password } = JSON.parse(body);
              if (!password) return json(res, 400, { error: 'Password required' });
              const a = Buffer.from(password);
              const b = Buffer.from(ADMIN_PASSWORD);
              if (a.length !== b.length || !timingSafeEqual(a, b)) return json(res, 401, { error: 'Invalid password' });
              return json(res, 200, { token: sign({ role: 'admin' }) });
            } catch { return json(res, 500, { error: 'Server error' }); }
          });
          return;
        }

        // ── Contact form endpoint ──
        if (req.url === '/api/contact' && req.method === 'POST') {
          let body = '';
          req.on('data', c => body += c);
          req.on('end', async () => {
            try {
              const { name, email, message, _honey } = JSON.parse(body);
              if (_honey) return json(res, 200, { message: 'OK' }); // honeypot
              if (!name || !email || !message) return json(res, 400, { error: 'Missing fields' });

              const sb = await getSupabase();
              if (sb) {
                await sb.from('contact_submissions').insert({
                  name: sanitize(name), email: sanitize(email), message: sanitize(message).slice(0, 5000), status: 'new',
                });
              }
              return json(res, 200, { message: 'تم الإرسال بنجاح' });
            } catch { return json(res, 500, { error: 'Server error' }); }
          });
          return;
        }

        // ── Content endpoint ──
        if (req.url.startsWith('/api/content')) {
          const url = new URL(req.url, 'http://localhost');
          const type = url.searchParams.get('type');
          const id = url.searchParams.get('id');

          if (!type || !ALLOWED_TYPES.includes(type)) return json(res, 400, { error: 'Invalid type' });

          // Auth check helper
          const authCheck = () => {
            const auth = req.headers.authorization;
            if (!auth || !auth.startsWith('Bearer ')) return false;
            return !!verify(auth.slice(7));
          };

          // GET
          if (req.method === 'GET') {
            // contact_submissions requires auth
            if (type === 'contact_submissions' && !authCheck()) return json(res, 401, { error: 'Auth required' });

            const sb = await getSupabase();
            if (sb) {
              const orderCol = type === 'contact_submissions' ? 'created_at' : 'display_order';
              const ascending = type !== 'contact_submissions';
              const { data: rows, error } = await sb.from(type).select('*').order(orderCol, { ascending });
              if (!error && rows) {
                const key = listKey(type);
                const mapped = rows.map(r => mapToApi(r, type));
                return json(res, 200, { [key]: mapped });
              }
            }
            // JSON fallback (not for contact_submissions)
            if (type !== 'contact_submissions') {
              const data = readData(type);
              return data ? json(res, 200, data) : json(res, 200, { [listKey(type)]: [] });
            }
            return json(res, 200, { messages: [] });
          }

          // Auth check for writes
          if (!authCheck()) return json(res, 401, { error: 'Auth required' });

          // POST not allowed for contact_submissions via admin
          if (req.method === 'POST' && type === 'contact_submissions') return json(res, 405, { error: 'Use contact form' });

          let body = '';
          req.on('data', c => body += c);
          req.on('end', async () => {
            try {
              const payload = body ? JSON.parse(body) : {};
              const sb = await getSupabase();

              if (req.method === 'POST') {
                if (sb) {
                  const dbRow = mapToDb(payload, type);
                  dbRow.is_active = true;
                  const { data: inserted, error } = await sb.from(type).insert(dbRow).select().single();
                  if (!error && inserted) return json(res, 201, { item: mapToApi(inserted, type), message: 'Added' });
                }
                // JSON fallback
                const data = readData(type) || defaultData(type);
                const key = listKey(type);
                const item = sanitizeItem(payload, type);
                if (!item.id || data[key].some(i => i.id === item.id)) item.id = `${type.charAt(0)}${Date.now()}`;
                item.order = data[key].length + 1;
                data[key].push(item);
                saveData(type, data);
                return json(res, 201, { item, message: 'Added' });
              }

              if (req.method === 'PUT') {
                // contact_submissions: only status update
                if (type === 'contact_submissions' && id && sb) {
                  const { status } = payload;
                  if (!['new', 'read', 'replied'].includes(status)) return json(res, 400, { error: 'Invalid status' });
                  const { error } = await sb.from(type).update({ status }).eq('id', id);
                  if (!error) return json(res, 200, { message: 'Updated' });
                  return json(res, 500, { error: error.message });
                }

                // Reorder
                if (payload.order && Array.isArray(payload.order) && sb) {
                  for (let i = 0; i < payload.order.length; i++) {
                    await sb.from(type).update({ display_order: i + 1 }).eq('id', payload.order[i]);
                  }
                  return json(res, 200, { message: 'Reordered' });
                }

                if (!id) return json(res, 400, { error: 'ID required' });

                if (sb) {
                  const dbRow = mapToDb(payload, type);
                  const { data: updated, error } = await sb.from(type).update(dbRow).eq('id', id).select().single();
                  if (!error && updated) return json(res, 200, { item: mapToApi(updated, type), message: 'Updated' });
                }

                // JSON fallback
                const data = readData(type) || defaultData(type);
                const key = listKey(type);
                const idx = data[key].findIndex(x => x.id === id);
                if (idx === -1) return json(res, 404, { error: 'Not found' });
                const item = sanitizeItem({ ...data[key][idx], ...payload }, type);
                item.id = id;
                data[key][idx] = item;
                saveData(type, data);
                return json(res, 200, { item, message: 'Updated' });
              }

              if (req.method === 'DELETE') {
                if (!id) return json(res, 400, { error: 'ID required' });

                if (sb) {
                  const { error } = await sb.from(type).delete().eq('id', id);
                  if (!error) return json(res, 200, { message: 'Deleted' });
                }

                // JSON fallback
                const data = readData(type) || defaultData(type);
                const key = listKey(type);
                const idx = data[key].findIndex(x => x.id === id);
                if (idx === -1) return json(res, 404, { error: 'Not found' });
                data[key].splice(idx, 1);
                data[key].forEach((x, i) => { x.order = i + 1; });
                saveData(type, data);
                return json(res, 200, { message: 'Deleted' });
              }

              return json(res, 405, { error: 'Method not allowed' });
            } catch (e) { return json(res, 500, { error: 'Server error' }); }
          });
          return;
        }

        next();
      });
    },
  };
}

export default defineConfig({
  root: './',
  publicDir: 'public',
  plugins: [devApiPlugin(), copyDataPlugin()],
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    minify: 'terser',
    terserOptions: {
      compress: { drop_console: true, drop_debugger: true },
    },
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        admin: resolve(__dirname, 'admin/index.html'),
      },
      output: {
        entryFileNames: 'assets/js/[name].[hash].js',
        chunkFileNames: 'assets/js/[name].[hash].js',
        assetFileNames: (info) => {
          if (/\.css$/.test(info.name)) return 'assets/css/[name].[hash].[ext]';
          if (/\.(woff2?)$/.test(info.name)) return 'assets/fonts/[name].[ext]';
          if (/\.(png|jpe?g|webp|svg|gif)$/.test(info.name)) return 'assets/images/[name].[hash].[ext]';
          return 'assets/[name].[hash].[ext]';
        },
      },
    },
    reportCompressedSize: true,
    sourcemap: false,
  },
  css: {
    postcss: './postcss.config.js',
  },
  server: {
    port: 3000,
    open: true,
  },
  test: {
    include: ['tests/**/*.test.js'],
  },
});
