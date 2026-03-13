-- ================================================
-- Process Steps — "How We Work" timeline
-- ================================================
CREATE TABLE IF NOT EXISTS process_steps (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title_ar text NOT NULL DEFAULT '',
  title_en text NOT NULL DEFAULT '',
  description_ar text NOT NULL DEFAULT '',
  description_en text NOT NULL DEFAULT '',
  icon_svg text NOT NULL DEFAULT '',
  accent_color text NOT NULL DEFAULT '#3B82F6',
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE process_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read active process steps"
  ON process_steps FOR SELECT TO anon
  USING (is_active = true);

CREATE POLICY "Service role full access to process steps"
  ON process_steps FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated full access to process steps"
  ON process_steps FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- Seed data
INSERT INTO process_steps (title_ar, title_en, description_ar, description_en, icon_svg, accent_color, display_order) VALUES
(
  'الاكتشاف',
  'Discovery',
  'بنسمعك. بنفهم شغلك والمستخدمين بتوعك وأهدافك. بدون افتراضات.',
  'We listen. Understand your business, your users, and your goals. No assumptions.',
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>',
  '#3B82F6',
  1
),
(
  'الاستراتيجية والتصميم',
  'Strategy & Design',
  'Wireframes وبروتوتايب وخريطة منتج واضحة. بتشوف الحاجة قبل ما نبنيها.',
  'Wireframes, prototypes, and a clear product roadmap. You see it before we build it.',
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v8l4-2"/><circle cx="12" cy="14" r="8"/></svg>',
  '#8B5CF6',
  2
),
(
  'التطوير',
  'Development',
  'سبرينتات Agile مع عروض أسبوعية. دايماً في الصورة، مفيش مفاجآت.',
  'Agile sprints with weekly demos. You''re always in the loop, never in the dark.',
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>',
  '#EC4899',
  3
),
(
  'الاختبار والجودة',
  'Testing & QA',
  'اختبار دقيق على أجهزة حقيقية. بنكسرها عشان المستخدمين مش يحتاجوا يعملوا كده.',
  'Rigorous testing on real devices. We break it so your users don''t have to.',
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 12l2 2 4-4"/><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/></svg>',
  '#10B981',
  4
),
(
  'الإطلاق والدعم',
  'Launch & Support',
  'تشغيل سلس ومتابعة بعد الإطلاق. بنفضل معاك لحد ما كل حاجة تمشي زي الساعة.',
  'Smooth deployment and post-launch monitoring. We stay until everything runs perfectly.',
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 00-2.91-.09z"/><path d="m12 15-3-3a22 22 0 012-3.95A12.88 12.88 0 0122 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 01-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg>',
  '#F59E0B',
  5
);
