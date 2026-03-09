/**
 * Xfuse — Stats Section Dynamic Loader
 * Loads stats from Supabase → fallback to data-target attributes in HTML
 */
import { fetchTable } from '../lib/supabase.js';

export async function loadStats() {
  const statsContainer = document.querySelector('.scene1__stats');
  if (!statsContainer) return;

  try {
    const stats = await fetchTable('stats', { orderCol: 'display_order' });
    if (!stats.length) return; // keep hardcoded HTML

    statsContainer.innerHTML = stats.map(s => `
      <div class="scene1__stat">
        <span class="scene1__stat-number" data-target="${s.value}">0</span><span class="scene1__stat-plus">${s.suffix}</span>
        <span class="scene1__stat-label" data-lang="en">${s.label_en}</span>
        <span class="scene1__stat-label" data-lang="ar">${s.label_ar}</span>
      </div>
    `).join('');
  } catch {
    // fallback: keep existing HTML with data-target attributes
  }
}
