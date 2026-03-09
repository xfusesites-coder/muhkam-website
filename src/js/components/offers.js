/**
 * Xfuse — Offers Section Dynamic Loader
 * Loads pricing cards from Supabase → fallback to /data/offers.json
 */
import { fetchTable, fetchSetting } from '../lib/supabase.js';

function buildOfferCardHTML(offer, whatsappNumber) {
  const popularClass = offer.popular ? ' offers__card--popular' : '';
  const btnClass = offer.popular ? 'btn-primary' : 'btn-secondary';

  let badgeHTML = '';
  if (offer.badgeEn || offer.badgeAr) {
    badgeHTML = `
      <div class="offers__card-badge" data-lang="en">${offer.badgeEn}</div>
      <div class="offers__card-badge" data-lang="ar">${offer.badgeAr}</div>`;
  }

  const featuresEn = (offer.features_en || offer.featuresEn || [])
    .map(f => `<li data-lang="en">✓ ${f}</li>`).join('');
  const featuresAr = (offer.features_ar || offer.featuresAr || [])
    .map(f => `<li data-lang="ar">✓ ${f}</li>`).join('');

  // Parse price amount from string like "1,000 EGP" or "1,000 جنيه"
  const priceEn = offer.price_en || offer.priceEn || '';
  const priceAr = offer.price_ar || offer.priceAr || '';
  const amountMatch = priceEn.match(/[\d,]+/) || priceAr.match(/[\d,]+/);
  const amount = amountMatch ? amountMatch[0] : '';

  // CTA link
  let ctaHrefEn, ctaHrefAr;
  if (offer.cta_type === 'custom_link' && offer.cta_link) {
    ctaHrefEn = offer.cta_link;
    ctaHrefAr = offer.cta_link;
  } else {
    const msg = offer.cta_message || `مرحباً، أنا مهتم بباقة ${offer.title_ar || offer.titleAr}`;
    const waNum = whatsappNumber || '201029010778';
    ctaHrefEn = `https://wa.me/${waNum}?text=${encodeURIComponent(msg)}`;
    ctaHrefAr = ctaHrefEn;
  }

  return `<div class="offers__card${popularClass}">
    ${badgeHTML}
    <div class="offers__card-icon">${offer.icon}</div>
    <h3 class="offers__card-title" data-lang="en">${offer.title_en || offer.titleEn || ''}</h3>
    <h3 class="offers__card-title" data-lang="ar">${offer.title_ar || offer.titleAr || ''}</h3>
    <div class="offers__card-price">
      <span class="offers__price-amount">${amount}</span>
      <span class="offers__price-currency" data-lang="en">EGP</span>
      <span class="offers__price-currency" data-lang="ar">ج.م</span>
    </div>
    <ul class="offers__card-features">
      ${featuresEn}
      ${featuresAr}
    </ul>
    <a href="${ctaHrefEn}" class="offers__card-cta btn ${btnClass} magnetic" data-lang="en" target="_blank" rel="noopener noreferrer">Get Started</a>
    <a href="${ctaHrefAr}" class="offers__card-cta btn ${btnClass} magnetic" data-lang="ar" target="_blank" rel="noopener noreferrer">ابدأ دلوقتي</a>
  </div>`;
}

export async function loadOffers() {
  const grid = document.querySelector('.offers__grid');
  if (!grid) return;

  try {
    const [offers, whatsappNumber] = await Promise.all([
      fetchTable('offers', {
        fallbackUrl: '/data/offers.json',
        listKey: 'offers',
      }),
      fetchSetting('whatsapp_number').then(v => {
        // v might be a JSON string or null
        if (typeof v === 'string') {
          try { return JSON.parse(v); } catch { return v; }
        }
        return null;
      }),
    ]);

    if (offers.length) {
      const waNum = whatsappNumber || '201029010778';
      grid.innerHTML = offers.map(o => buildOfferCardHTML(o, waNum)).join('');
    }
  } catch {
    // fallback: keep existing HTML
  }
}
