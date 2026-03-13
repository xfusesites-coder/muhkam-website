-- ============================================
-- Muhkam Website — Supabase Database Schema
-- Run this SQL in: Supabase Dashboard → SQL Editor
-- ============================================

-- 1. Site Settings (key-value store)
CREATE TABLE site_settings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL DEFAULT '{}',
  updated_at timestamptz DEFAULT now()
);

-- 2. Stats / Numbers
CREATE TABLE stats (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  key text UNIQUE NOT NULL,
  value integer NOT NULL DEFAULT 0,
  label_ar text NOT NULL DEFAULT '',
  label_en text NOT NULL DEFAULT '',
  suffix text NOT NULL DEFAULT '',
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- 3. Services
CREATE TABLE services (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title_ar text NOT NULL DEFAULT '',
  title_en text NOT NULL DEFAULT '',
  description_ar text NOT NULL DEFAULT '',
  description_en text NOT NULL DEFAULT '',
  icon text NOT NULL DEFAULT '',
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- 4. Portfolio / Projects
CREATE TABLE portfolio (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title_ar text NOT NULL DEFAULT '',
  title_en text NOT NULL DEFAULT '',
  description_ar text NOT NULL DEFAULT '',
  description_en text NOT NULL DEFAULT '',
  tag_ar text NOT NULL DEFAULT '',
  tag_en text NOT NULL DEFAULT '',
  image_url text NOT NULL DEFAULT '',
  project_link text NOT NULL DEFAULT '',
  technologies text[] DEFAULT '{}',
  featured boolean NOT NULL DEFAULT false,
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- 5. Team Members
CREATE TABLE team (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name_ar text NOT NULL DEFAULT '',
  name_en text NOT NULL DEFAULT '',
  role_ar text NOT NULL DEFAULT '',
  role_en text NOT NULL DEFAULT '',
  quote_ar text NOT NULL DEFAULT '',
  quote_en text NOT NULL DEFAULT '',
  initials varchar(3) NOT NULL DEFAULT '',
  image_url text NOT NULL DEFAULT '',
  linkedin text NOT NULL DEFAULT '',
  github text NOT NULL DEFAULT '',
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- 6. Testimonials
CREATE TABLE testimonials (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name_ar text NOT NULL DEFAULT '',
  name_en text NOT NULL DEFAULT '',
  position_ar text NOT NULL DEFAULT '',
  position_en text NOT NULL DEFAULT '',
  quote_ar text NOT NULL DEFAULT '',
  quote_en text NOT NULL DEFAULT '',
  initials varchar(3) NOT NULL DEFAULT '',
  image_url text NOT NULL DEFAULT '',
  rating smallint NOT NULL DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- 7. Offers / Pricing
CREATE TABLE offers (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title_ar text NOT NULL DEFAULT '',
  title_en text NOT NULL DEFAULT '',
  description_ar text NOT NULL DEFAULT '',
  description_en text NOT NULL DEFAULT '',
  price_ar text NOT NULL DEFAULT '',
  price_en text NOT NULL DEFAULT '',
  icon text NOT NULL DEFAULT '',
  badge_ar text NOT NULL DEFAULT '',
  badge_en text NOT NULL DEFAULT '',
  features_ar text[] DEFAULT '{}',
  features_en text[] DEFAULT '{}',
  popular boolean NOT NULL DEFAULT false,
  cta_type text NOT NULL DEFAULT 'whatsapp' CHECK (cta_type IN ('whatsapp', 'custom_link')),
  cta_link text NOT NULL DEFAULT '',
  cta_message text NOT NULL DEFAULT '',
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- 8. FAQ
CREATE TABLE faq (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  question_ar text NOT NULL DEFAULT '',
  question_en text NOT NULL DEFAULT '',
  answer_ar text NOT NULL DEFAULT '',
  answer_en text NOT NULL DEFAULT '',
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- 9. Contact Submissions
CREATE TABLE contact_submissions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL,
  company text DEFAULT '',
  message text NOT NULL,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'read', 'replied', 'archived')),
  admin_notes text DEFAULT '',
  ip_address text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  read_at timestamptz
);

-- ============================================
-- Row Level Security (RLS)
-- ============================================

ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio ENABLE ROW LEVEL SECURITY;
ALTER TABLE team ENABLE ROW LEVEL SECURITY;
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE faq ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;

-- Public READ policies (anyone can read active items)
CREATE POLICY "Public read site_settings" ON site_settings FOR SELECT USING (true);
CREATE POLICY "Public read stats" ON stats FOR SELECT USING (true);
CREATE POLICY "Public read services" ON services FOR SELECT TO anon USING (is_active = true);
CREATE POLICY "Public read portfolio" ON portfolio FOR SELECT TO anon USING (is_active = true);
CREATE POLICY "Public read team" ON team FOR SELECT TO anon USING (is_active = true);
CREATE POLICY "Public read testimonials" ON testimonials FOR SELECT TO anon USING (is_active = true);
CREATE POLICY "Public read offers" ON offers FOR SELECT TO anon USING (is_active = true);
CREATE POLICY "Public read faq" ON faq FOR SELECT TO anon USING (is_active = true);

-- Public INSERT on contact_submissions (visitors can submit)
CREATE POLICY "Public insert contact" ON contact_submissions FOR INSERT TO anon WITH CHECK (true);

-- Service role full access (for admin API)
CREATE POLICY "Service role full access site_settings" ON site_settings FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access stats" ON stats FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access services" ON services FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access portfolio" ON portfolio FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access team" ON team FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access testimonials" ON testimonials FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access offers" ON offers FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access faq" ON faq FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access contact" ON contact_submissions FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Authenticated role full access (for admin via Supabase auth or service key)
CREATE POLICY "Auth full access site_settings" ON site_settings FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth full access stats" ON stats FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth full access services" ON services FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth full access portfolio" ON portfolio FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth full access team" ON team FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth full access testimonials" ON testimonials FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth full access offers" ON offers FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth full access faq" ON faq FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth full access contact" ON contact_submissions FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================
-- Storage Buckets
-- ============================================
-- Run these in Supabase Dashboard → Storage → Create bucket:
-- 1. portfolio (public)
-- 2. team (public)
-- 3. testimonials (public)
-- 4. misc (public)

-- Storage policies (run after creating buckets):
INSERT INTO storage.buckets (id, name, public) VALUES ('portfolio', 'portfolio', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('team', 'team', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('testimonials', 'testimonials', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('misc', 'misc', true) ON CONFLICT DO NOTHING;

-- Allow public read on all storage buckets
CREATE POLICY "Public read portfolio storage" ON storage.objects FOR SELECT TO anon USING (bucket_id IN ('portfolio', 'team', 'testimonials', 'misc'));

-- Allow service_role to upload/delete
CREATE POLICY "Service upload storage" ON storage.objects FOR INSERT TO service_role WITH CHECK (bucket_id IN ('portfolio', 'team', 'testimonials', 'misc'));
CREATE POLICY "Service delete storage" ON storage.objects FOR DELETE TO service_role USING (bucket_id IN ('portfolio', 'team', 'testimonials', 'misc'));
CREATE POLICY "Service update storage" ON storage.objects FOR UPDATE TO service_role USING (bucket_id IN ('portfolio', 'team', 'testimonials', 'misc'));

-- ============================================
-- Updated_at trigger
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER site_settings_updated_at BEFORE UPDATE ON site_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at();
