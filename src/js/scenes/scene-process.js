/**
 * Scene: Our Process — Animated Timeline
 *
 * Scroll-driven horizontal timeline (vertical on mobile) showing
 * the 5-step process. Uses GSAP ScrollTrigger with pin + scrub.
 */

import { fetchTable } from '../lib/supabase.js';
import { prefersReducedMotion } from '../core/utils.js';
import { refreshLanguage } from '../core/language.js';

// ==========================
// HELPERS
// ==========================

function escHtml(s) {
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

function sanitizeSvg(svgStr) {
  if (!svgStr) return '';
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgStr, 'image/svg+xml');
  const svg = doc.querySelector('svg');
  if (!svg) return '';
  svg.querySelectorAll('script').forEach(el => el.remove());
  svg.querySelectorAll('*').forEach(el => {
    [...el.attributes].forEach(attr => {
      if (attr.name.startsWith('on')) el.removeAttribute(attr.name);
    });
  });
  return svg.outerHTML;
}

/**
 * Create a step DOM element from data.
 */
function createStepElement(item, index) {
  const step = document.createElement('div');
  step.className = 'process__step';
  step.setAttribute('role', 'listitem');
  step.style.setProperty('--step-color', item.accent_color || '#3B82F6');

  step.innerHTML = `
    <span class="process__badge">${index + 1}</span>
    <div class="process__dot" data-step="${index + 1}">
      ${sanitizeSvg(item.icon_svg)}
    </div>
    <h3 class="process__title">
      <span data-lang="en">${escHtml(item.title_en)}</span>
      <span data-lang="ar">${escHtml(item.title_ar)}</span>
    </h3>
    <p class="process__desc">
      <span data-lang="en">${escHtml(item.description_en)}</span>
      <span data-lang="ar">${escHtml(item.description_ar)}</span>
    </p>
  `;

  return step;
}

// ==========================
// MAIN INIT
// ==========================

export async function initSceneProcess() {
  if (prefersReducedMotion() || typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

  const scene = document.getElementById('scene-process');
  if (!scene) return;

  // ---- Fetch data ----
  const items = await fetchTable('process_steps', {
    fallbackUrl: '/data/process-steps.json',
    listKey: 'items',
    orderCol: 'display_order',
  });

  if (!items.length) return;

  // ---- DOM elements ----
  const timeline = scene.querySelector('.process__timeline');
  const lineFill = scene.querySelector('.process__line-fill');
  const cta = scene.querySelector('.process__cta');

  if (!timeline || !lineFill) return;

  // ---- Build steps dynamically ----
  const steps = [];
  const dots = [];

  items.forEach((item, i) => {
    const step = createStepElement(item, i);
    timeline.appendChild(step);
    steps.push(step);
    dots.push(step.querySelector('.process__dot'));
  });

  refreshLanguage();

  // ---- Detect mobile ----
  const isMobile = window.matchMedia('(max-width: 768px)').matches;

  // ---- Set initial GSAP state (hidden) ----
  const headerEls = scene.querySelectorAll('.process__header .section-label, .process__header .section-title, .process__header .section-desc');
  gsap.set(headerEls, { opacity: 0, y: 30 });
  gsap.set(scene.querySelector('.process__line'), { opacity: 0 });
  gsap.set(dots, { scale: 0, opacity: 0 });
  steps.forEach(step => {
    gsap.set(step.querySelector('.process__title'), { opacity: 0, y: 15 });
    gsap.set(step.querySelector('.process__desc'), { opacity: 0, y: 15 });
    const badge = step.querySelector('.process__badge');
    if (badge) gsap.set(badge, { scale: 0 });
  });
  if (cta) gsap.set(cta, { opacity: 0, y: 30 });

  // ---- Build GSAP Timeline ----
  const stepCount = items.length;

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: scene,
      start: 'top top',
      end: `+=${stepCount * 80}%`,
      pin: true,
      pinSpacing: true,
      scrub: 0.5,
      anticipatePin: 1,
      id: 'scene-process',
      snap: {
        snapTo: 1 / (stepCount + 1),
        duration: { min: 0.15, max: 0.4 },
        delay: 0.1,
        ease: 'power1.inOut',
      },
      onEnter: () => {
        document.body.setAttribute('data-scene', 'process');
        scene.classList.add('scene--active');
      },
      onLeave: () => scene.classList.remove('scene--active'),
      onEnterBack: () => {
        document.body.setAttribute('data-scene', 'process');
        scene.classList.add('scene--active');
      },
      onLeaveBack: () => scene.classList.remove('scene--active'),
    },
  });

  // ---- Phase 1: Entrance (0% → 15%) ----
  tl.to(headerEls,
    { opacity: 1, y: 0, duration: 0.06, stagger: 0.02, ease: 'power2.out' },
    0
  );

  tl.to(scene.querySelector('.process__line'),
    { opacity: 1, duration: 0.03, ease: 'power2.out' },
    0.04
  );

  // Stagger dots entrance
  dots.forEach((dot, i) => {
    tl.to(dot,
      { scale: 1, opacity: 1, duration: 0.02, ease: 'back.out(1.4)' },
      0.06 + i * 0.015
    );
  });

  // ---- Phase 2: Line fill + step activation (15% → 85%) ----
  const phaseStart = 0.15;
  const phaseEnd = 0.85;
  const phaseDuration = phaseEnd - phaseStart;
  const stepDuration = phaseDuration / stepCount;

  steps.forEach((step, i) => {
    const stepTime = phaseStart + i * stepDuration;
    const fillProgress = (i + 1) / stepCount;

    // Fill line to this step
    tl.to(lineFill, {
      [isMobile ? 'scaleY' : 'scaleX']: fillProgress,
      duration: stepDuration * 0.6,
      ease: 'power1.inOut',
    }, stepTime);

    // Activate dot
    tl.to(dots[i], {
      onStart: () => dots[i].classList.add('active'),
      duration: 0.01,
    }, stepTime + stepDuration * 0.3);

    // Reveal step content
    const title = step.querySelector('.process__title');
    const desc = step.querySelector('.process__desc');
    const badge = step.querySelector('.process__badge');

    tl.to(title,
      { y: 0, opacity: 1, duration: stepDuration * 0.4, ease: 'power2.out' },
      stepTime + stepDuration * 0.25
    );

    tl.to(desc,
      { y: 0, opacity: 1, duration: stepDuration * 0.4, ease: 'power2.out' },
      stepTime + stepDuration * 0.35
    );

    if (badge) {
      tl.to(badge,
        { scale: 1, duration: stepDuration * 0.3, ease: 'back.out(2)' },
        stepTime + stepDuration * 0.2
      );
    }
  });

  // ---- Phase 3: CTA entrance (85% → 95%) ----
  if (cta) {
    tl.to(cta,
      { y: 0, opacity: 1, duration: 0.08, ease: 'power2.out' },
      0.87
    );
  }
}
