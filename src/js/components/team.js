/**
 * Muhkam — Team Section
 * Dynamically rebuilds team member cards from Supabase data
 * Loads data from Supabase → fallback to /data/team.json → fallback to static HTML
 */
import { isDesktop, prefersReducedMotion } from '../core/utils.js';
import { fetchTable } from '../lib/supabase.js';

function escHtml(s) {
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

function buildMemberHTML(m) {
  const imgSrc = m.imageUrl || '';
  return `<div class="scene5__member" data-member="${escHtml(m.id)}">
    <div class="scene5__card">
      <div class="scene5__card-front">
        <div class="scene5__avatar">
          ${imgSrc ? `<img src="${escHtml(imgSrc)}" alt="${escHtml(m.nameEn)}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">` : ''}
          <span class="scene5__initials" ${imgSrc ? 'style="display:none"' : ''}>${escHtml(m.initials)}</span>
        </div>
        <h3 class="scene5__name" data-lang="en">${escHtml(m.nameEn)}</h3>
        <h3 class="scene5__name" data-lang="ar">${escHtml(m.nameAr)}</h3>
        <p class="scene5__role" data-lang="en">${escHtml(m.roleEn)}</p>
        <p class="scene5__role" data-lang="ar">${escHtml(m.roleAr)}</p>
      </div>
    </div>
    <blockquote class="scene5__quote">
      <span data-lang="en">"${escHtml(m.quoteEn)}"</span>
      <span data-lang="ar">"${escHtml(m.quoteAr)}"</span>
    </blockquote>
  </div>`;
}

export async function initTeam() {
  const membersContainer = document.querySelector('.scene5__members');
  if (!membersContainer) return;

  try {
    const members = await fetchTable('team', {
      fallbackUrl: '/data/team.json',
      listKey: 'members',
    });
    if (members.length) {
      const mapped = members.map(m => ({
        id: m.id || m.initials?.toLowerCase() || '',
        initials: m.initials || '',
        nameEn: m.name_en || m.nameEn || '',
        nameAr: m.name_ar || m.nameAr || '',
        roleEn: m.role_en || m.roleEn || '',
        roleAr: m.role_ar || m.roleAr || '',
        quoteEn: m.quote_en || m.quoteEn || '',
        quoteAr: m.quote_ar || m.quoteAr || '',
        imageUrl: m.image_url || m.image || '',
      }));
      membersContainer.innerHTML = mapped.map(buildMemberHTML).join('');
    }
  } catch {
    // fallback: keep existing static HTML
  }
}
