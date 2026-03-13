/**
 * Muhkam — Migrate JSON data to Supabase
 * Run: node scripts/migrate-to-supabase.js
 * 
 * Required env vars: VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
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

async function migratePortfolio() {
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

  const { error } = await supabase.from('portfolio').insert(rows);
  if (error) console.error('❌ Portfolio:', error.message);
  else console.log(`✅ Portfolio: ${rows.length} projects migrated`);
}

async function migrateTeam() {
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

  const { error } = await supabase.from('team').insert(rows);
  if (error) console.error('❌ Team:', error.message);
  else console.log(`✅ Team: ${rows.length} members migrated`);
}

async function migrateTestimonials() {
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

  const { error } = await supabase.from('testimonials').insert(rows);
  if (error) console.error('❌ Testimonials:', error.message);
  else console.log(`✅ Testimonials: ${rows.length} items migrated`);
}

async function migrateOffers() {
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

  const { error } = await supabase.from('offers').insert(rows);
  if (error) console.error('❌ Offers:', error.message);
  else console.log(`✅ Offers: ${rows.length} offers migrated`);

  // Migrate WhatsApp settings
  if (json.whatsappNumber) {
    await supabase.from('site_settings').upsert({
      key: 'whatsapp_number',
      value: JSON.stringify(json.whatsappNumber),
    }, { onConflict: 'key' });
  }
}

async function migrateStats() {
  const stats = [
    { key: 'projects_count', value: 47, label_ar: 'مشروع', label_en: 'Projects', suffix: '+', display_order: 1 },
    { key: 'years_count', value: 10, label_ar: 'سنوات خبرة', label_en: 'Years', suffix: '+', display_order: 2 },
    { key: 'clients_count', value: 32, label_ar: 'عميل', label_en: 'Clients', suffix: '+', display_order: 3 },
    { key: 'ontime_percent', value: 95, label_ar: 'في الموعد', label_en: 'On Time', suffix: '%', display_order: 4 },
  ];

  const { error } = await supabase.from('stats').insert(stats);
  if (error) console.error('❌ Stats:', error.message);
  else console.log('✅ Stats: 4 stats migrated');
}

async function migrateServices() {
  const services = [
    {
      title_ar: 'تطبيقات موبايل', title_en: 'Mobile Apps',
      description_ar: 'تطبيق واحد للآيفون والأندرويد', description_en: 'Cross-platform with Flutter',
      icon: 'mobile', display_order: 1, is_active: true,
    },
    {
      title_ar: 'منصات ويب', title_en: 'Web Platforms',
      description_ar: 'مواقع سريعة وحديثة', description_en: 'React & Next.js',
      icon: 'web', display_order: 2, is_active: true,
    },
    {
      title_ar: 'أنظمة مؤسسات', title_en: 'Enterprise Systems',
      description_ar: 'لوحات تحكم وتشغيل أوتوماتيكي', description_en: 'Dashboards & automation',
      icon: 'enterprise', display_order: 3, is_active: true,
    },
    {
      title_ar: 'هوية رقمية', title_en: 'Digital Branding',
      description_ar: 'تصميم هوية شركتك الرقمية', description_en: 'UI/UX & brand strategy',
      icon: 'branding', display_order: 4, is_active: true,
    },
  ];

  const { error } = await supabase.from('services').insert(services);
  if (error) console.error('❌ Services:', error.message);
  else console.log('✅ Services: 4 services migrated');
}

async function migrateFAQ() {
  const faqs = [
    {
      question_ar: 'المشروع بياخد وقت قد إيه؟', question_en: 'How long does a project take?',
      answer_ar: 'المشاريع البسيطة 2-4 أسابيع. التطبيقات والأنظمة 6-12 أسبوع. بنتفق على الجدول قبل ما نبدأ.',
      answer_en: 'Simple projects take 2-4 weeks. Apps and systems take 6-12 weeks. We agree on the timeline before starting.',
      display_order: 1, is_active: true,
    },
    {
      question_ar: 'لو مش عاجبني التصميم؟', question_en: 'What if I don\'t like the design?',
      answer_ar: 'بنعرضلك التصميم قبل ما نبدأ البرمجة. عندك 3 جولات تعديل مجانية.',
      answer_en: 'We show you the design before coding starts. You get 3 free revision rounds.',
      display_order: 2, is_active: true,
    },
    {
      question_ar: 'الدفع بيبقى إزاي؟', question_en: 'How does payment work?',
      answer_ar: '40% مقدم + 30% عند اعتماد التصميم + 30% عند التسليم. بنقبل فودافون كاش وإنستاباي وتحويل بنكي.',
      answer_en: '40% upfront + 30% on design approval + 30% on delivery. We accept Vodafone Cash, InstaPay, and bank transfer.',
      display_order: 3, is_active: true,
    },
    {
      question_ar: 'بعد التسليم مين بيصلح لو في مشكلة؟', question_en: 'Who handles support after launch?',
      answer_ar: '6 شهور صيانة ودعم مجاني بعد التسليم. وبعدها باقات صيانة شهرية بأسعار خفيفة.',
      answer_en: '6 months of free maintenance and support after delivery. After that, affordable monthly plans.',
      display_order: 4, is_active: true,
    },
    {
      question_ar: 'أنا مش فاهم في التقنية — ده هيكون مشكلة؟', question_en: 'I\'m not technical — is that a problem?',
      answer_ar: 'بالعكس! معظم عملائنا مش تقنيين. بنشرحلك كل حاجة ببساطة وبنوريك النتيجة خطوة بخطوة.',
      answer_en: 'Not at all! Most of our clients aren\'t technical. We explain everything simply and show you results step by step.',
      display_order: 5, is_active: true,
    },
    {
      question_ar: 'أقدر أعدّل المحتوى بنفسي؟', question_en: 'Can I update the content myself?',
      answer_ar: 'أيوه! بنوفرلك لوحة تحكم سهلة تقدر تعدّل منها المحتوى والصور والأسعار بدون أي كود.',
      answer_en: 'Yes! We provide an easy admin dashboard where you can update content, images, and prices without any coding.',
      display_order: 6, is_active: true,
    },
  ];

  const { error } = await supabase.from('faq').insert(faqs);
  if (error) console.error('❌ FAQ:', error.message);
  else console.log('✅ FAQ: 6 questions migrated');
}

async function migrateSettings() {
  const settings = [
    { key: 'whatsapp_number', value: JSON.stringify('201029010778') },
    { key: 'whatsapp_message', value: JSON.stringify('مرحباً، أنا مهتم بخدماتكم') },
    { key: 'contact_email', value: JSON.stringify('hello@Muhkam.dev') },
    { key: 'hero_content', value: JSON.stringify({
      titleAr: 'نحول أفكارك\nلحقيقة رقمية',
      titleEn: 'We turn ideas into\ndigital reality',
      descAr: 'تطبيقات موبايل · منصات ويب · أنظمة مؤسسات',
      descEn: 'Mobile apps · Web platforms · Enterprise systems',
      labelAr: 'استوديو حلول رقمية',
      labelEn: 'Digital Solutions Studio',
    })},
    { key: 'custom_cta', value: JSON.stringify({
      titleAr: 'مشروع مخصص؟',
      titleEn: 'Custom Project?',
      descAr: 'تطبيقات ومنصات وأنظمة مخصصة — السعر حسب الطلب.',
      descEn: 'Apps, platforms, and systems built to your exact needs. Get a custom quote.',
    })},
  ];

  for (const s of settings) {
    const { error } = await supabase.from('site_settings').upsert(s, { onConflict: 'key' });
    if (error) console.error(`❌ Setting ${s.key}:`, error.message);
  }
  console.log('✅ Settings: migrated');
}

async function main() {
  console.log('🚀 Starting migration to Supabase...\n');

  await migrateStats();
  await migrateServices();
  await migratePortfolio();
  await migrateTeam();
  await migrateTestimonials();
  await migrateOffers();
  await migrateFAQ();
  await migrateSettings();

  console.log('\n🎉 Migration complete!');
}

main().catch(err => {
  console.error('💥 Migration failed:', err);
  process.exit(1);
});
