/**
 * Muhkam — FAQ Section Dynamic Loader
 * Loads FAQ from Supabase → fallback to hardcoded HTML
 */
import { fetchTable } from '../lib/supabase.js';

function buildFaqItemHTML(item) {
  return `<details class="faq__item">
    <summary class="faq__question">
      <span data-lang="en">${item.question_en || item.questionEn || ''}</span>
      <span data-lang="ar">${item.question_ar || item.questionAr || ''}</span>
      <svg class="faq__chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><path d="M6 9l6 6 6-6"/></svg>
    </summary>
    <div class="faq__answer">
      <p data-lang="en">${item.answer_en || item.answerEn || ''}</p>
      <p data-lang="ar">${item.answer_ar || item.answerAr || ''}</p>
    </div>
  </details>`;
}

export async function loadFaq() {
  const list = document.querySelector('.faq__list');
  if (!list) return;

  try {
    const items = await fetchTable('faq', { orderCol: 'display_order' });
    if (items.length) {
      list.innerHTML = items.map(buildFaqItemHTML).join('');
    }
  } catch {
    // fallback: keep existing hardcoded HTML
  }
}
