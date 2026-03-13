/**
 * Muhkam — Refresh Supabase data from local JSON files
 * Deletes existing data and re-inserts from updated JSON files
 * Run: node scripts/refresh-supabase.js
 */
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Missing env vars: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
const dataDir = join(process.cwd(), 'data');

function readJSON(filename) {
  const path = join(dataDir, filename);
  if (!existsSync(path)) return null;
  return JSON.parse(readFileSync(path, 'utf-8'));
}

async function refreshTable(tableName, rows) {
  // Delete all existing rows (UUID-compatible)
  const { error: delError } = await supabase.from(tableName).delete().not('id', 'is', null);
  if (delError) {
    console.warn(`⚠️  Could not clear ${tableName}: ${delError.message}`);
  }
  
  // Insert new rows
  const { error: insError } = await supabase.from(tableName).insert(rows);
  if (insError) {
    console.error(`❌ ${tableName}: ${insError.message}`);
    return false;
  }
  console.log(`✅ ${tableName}: ${rows.length} rows refreshed`);
  return true;
}

async function refreshTeam() {
  const json = readJSON('team.json');
  if (!json?.members?.length) return console.log('⏭️  No team data');

  const rows = json.members.map(m => ({
    name_ar: m.nameAr || '',
    name_en: m.nameEn || '',
    role_ar: m.roleAr || '',
    role_en: m.roleEn || '',
    quote_ar: m.quoteAr || '',
    quote_en: m.quoteEn || '',
    initials: m.initials || '',
    image_url: m.image || '',
    linkedin: m.linkedin || '',
    github: m.github || '',
    display_order: m.order || 0,
    is_active: true,
  }));

  await refreshTable('team', rows);
}

async function refreshTestimonials() {
  const json = readJSON('testimonials.json');
  if (!json?.items?.length) return console.log('⏭️  No testimonials data');

  const rows = json.items.map(t => ({
    name_ar: t.nameAr || '',
    name_en: t.nameEn || '',
    position_ar: t.positionAr || '',
    position_en: t.positionEn || '',
    quote_ar: t.quoteAr || '',
    quote_en: t.quoteEn || '',
    initials: t.initials || '',
    image_url: '',
    rating: t.rating || 5,
    display_order: t.order || 0,
    is_active: true,
  }));

  await refreshTable('testimonials', rows);
}

async function refreshOffers() {
  const json = readJSON('offers.json');
  if (!json?.offers?.length) return console.log('⏭️  No offers data');

  const rows = json.offers.map(o => ({
    title_ar: o.titleAr || '',
    title_en: o.titleEn || '',
    description_ar: o.descriptionAr || '',
    description_en: o.descriptionEn || '',
    price_ar: o.priceAr || '',
    price_en: o.priceEn || '',
    icon: o.icon || '',
    badge_ar: o.badgeAr || '',
    badge_en: o.badgeEn || '',
    features_ar: o.featuresAr || [],
    features_en: o.featuresEn || [],
    popular: o.popular || false,
    cta_type: 'whatsapp',
    cta_link: '',
    cta_message: '',
    display_order: o.order || 0,
    is_active: true,
  }));

  await refreshTable('offers', rows);
}

async function refreshPortfolio() {
  const json = readJSON('portfolio.json');
  if (!json?.projects?.length) return console.log('⏭️  No portfolio data');

  const rows = json.projects.map(p => ({
    title_ar: p.titleAr || '',
    title_en: p.titleEn || '',
    description_ar: p.descriptionAr || '',
    description_en: p.descriptionEn || '',
    tag_ar: p.tagAr || '',
    tag_en: p.tagEn || '',
    image_url: p.image || '',
    project_link: p.link || '',
    technologies: [],
    featured: p.featured || false,
    display_order: p.order || 0,
    is_active: true,
  }));

  await refreshTable('portfolio', rows);
}

async function main() {
  console.log('🔄 Refreshing Supabase data from local JSON files...\n');

  await refreshTeam();
  await refreshTestimonials();
  await refreshOffers();
  await refreshPortfolio();

  console.log('\n✅ Done! Refresh the website to see updated data.');
}

main().catch(console.error);
