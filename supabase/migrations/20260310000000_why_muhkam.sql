-- ============================================
-- Why Muhkam — Orbital Ring Benefits
-- ============================================

CREATE TABLE why_muhkam (
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
ALTER TABLE why_muhkam ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read why_muhkam" ON why_muhkam FOR SELECT TO anon USING (is_active = true);
CREATE POLICY "Service role full access why_muhkam" ON why_muhkam FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Auth full access why_muhkam" ON why_muhkam FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Seed data (6 benefits)
INSERT INTO why_muhkam (title_ar, title_en, description_ar, description_en, icon_svg, accent_color, display_order) VALUES
(
  'جودة بلا تنازل',
  'Uncompromising Quality',
  'كل سطر كود يُكتب بمعايير عالمية. نراجع، نختبر، ونتأكد إن المنتج يشتغل بكفاءة ١٠٠٪.',
  'Every line of code meets global standards. We review, test, and ensure 100% performance.',
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>',
  '#3B82F6',
  1
),
(
  'سرعة التسليم',
  'Lightning Delivery',
  'مواعيد تسليم مضبوطة. Sprint-based workflow يضمن إنك تشوف تقدم حقيقي كل أسبوع.',
  'Reliable deadlines. Sprint-based workflow ensures you see real progress every week.',
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>',
  '#F59E0B',
  2
),
(
  'دعم مستمر',
  '24/7 Support',
  'فريق دعم متاح دايمًا. مش بس بنسلم المشروع — بنفضل جنبك بعد الإطلاق.',
  'Our support team is always available. We don''t just deliver — we stay by your side post-launch.',
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"/></svg>',
  '#10B981',
  3
),
(
  'تقنيات حديثة',
  'Cutting-Edge Tech',
  'نستخدم أحدث التقنيات: React, Flutter, Node.js, AI — علشان منتجك يكون جاهز للمستقبل.',
  'We use the latest tech: React, Flutter, Node.js, AI — so your product is future-proof.',
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>',
  '#8B5CF6',
  4
),
(
  'أسعار شفافة',
  'Transparent Pricing',
  'لا مفاجآت ولا تكاليف مخفية. تعرف بالظبط هتدفع كام قبل ما نبدأ.',
  'No surprises or hidden costs. Know exactly what you''ll pay before we start.',
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>',
  '#EC4899',
  5
),
(
  'نتائج مُثبتة',
  'Proven Results',
  '+47 مشروع ناجح و+30 عميل سعيد. شهاداتهم تتكلم عننا.',
  '47+ successful projects and 30+ happy clients. Their testimonials speak for us.',
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/></svg>',
  '#F43F5E',
  6
);
