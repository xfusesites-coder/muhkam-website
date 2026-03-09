/**
 * Xfuse — Testimonials Section
 * Dynamically rebuilds testimonial cards from Supabase data
 * Loads data from Supabase → fallback to /data/testimonials.json → fallback to static HTML
 */
import { fetchTable } from '../lib/supabase.js';

function escHtml(s) {
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

function generateStarsHTML(count) {
  const star = '<svg class="scene6__star" viewBox="0 0 24 24" width="16" height="16"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="url(#star-grad)"/></svg>';
  return star.repeat(count);
}

function buildTestimonialHTML(t) {
  return `<div class="scene6__testimonial">
    <div class="scene6__signal" aria-hidden="true"></div>
    <div class="scene6__card">
      <div class="scene6__stars">${generateStarsHTML(t.rating || 5)}</div>
      <blockquote data-lang="en">"${escHtml(t.quoteEn)}"</blockquote>
      <blockquote data-lang="ar">"${escHtml(t.quoteAr)}"</blockquote>
      <div class="scene6__author">
        <span class="scene6__author-name">${escHtml(t.nameEn)}</span>
        <span class="scene6__author-role" data-lang="en">${escHtml(t.positionEn)}</span>
        <span class="scene6__author-role" data-lang="ar">${escHtml(t.positionAr)}</span>
      </div>
    </div>
  </div>`;
}

export async function initTestimonials() {
  const container = document.querySelector('.scene6__testimonials');
  if (!container) return;

  try {
    const items = await fetchTable('testimonials', {
      fallbackUrl: '/data/testimonials.json',
      listKey: 'items',
    });
    if (items.length) {
      const mapped = items.map(t => ({
        nameEn: t.name_en || t.nameEn || '',
        nameAr: t.name_ar || t.nameAr || '',
        positionEn: t.position_en || t.positionEn || '',
        positionAr: t.position_ar || t.positionAr || '',
        quoteEn: t.quote_en || t.quoteEn || '',
        quoteAr: t.quote_ar || t.quoteAr || '',
        initials: t.initials || '',
        rating: t.rating || 5,
      }));
      container.innerHTML = mapped.map(buildTestimonialHTML).join('');
    }
  } catch {
    // fallback: keep existing static HTML
  }
}
