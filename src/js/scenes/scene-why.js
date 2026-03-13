/**
 * Scene: Why Muhkam — Orbital Ring
 *
 * Scroll-driven orbital ring where 6 benefit cards orbit
 * around a center heading. Uses GSAP ScrollTrigger with
 * pin + scrub for smooth scroll control.
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
 * Position N items evenly around a circle.
 * Returns array of {x, y, angle} in degrees.
 */
function getOrbitPositions(count, radius) {
  const positions = [];
  const startAngle = -90; // Start from top (12 o'clock)
  for (let i = 0; i < count; i++) {
    const angleDeg = startAngle + (360 / count) * i;
    const angleRad = (angleDeg * Math.PI) / 180;
    positions.push({
      x: Math.cos(angleRad) * radius,
      y: Math.sin(angleRad) * radius,
      angle: angleDeg,
    });
  }
  return positions;
}

/**
 * Draw constellation lines from center to each card position.
 */
function drawConstellationLines(svgEl, positions, containerSize) {
  svgEl.innerHTML = '';
  const svgScale = 700 / containerSize; // Map to viewBox 700x700

  positions.forEach((pos, i) => {
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', 350);
    line.setAttribute('y1', 350);
    line.setAttribute('x2', 350 + pos.x * svgScale);
    line.setAttribute('y2', 350 + pos.y * svgScale);
    line.setAttribute('data-index', i);
    line.classList.add('why__constellation-line');
    svgEl.appendChild(line);
  });
}

/**
 * Create card DOM element from data item.
 */
function createCardElement(item, index, position) {
  const card = document.createElement('article');
  card.className = 'why__card';
  card.setAttribute('role', 'listitem');
  card.setAttribute('data-index', index);
  card.style.setProperty('--card-color', item.accent_color || '#3B82F6');
  card.style.setProperty('--card-angle', `${position.angle}deg`);

  card.innerHTML = `
    <div class="why__card-inner">
      <div class="why__card-icon" aria-hidden="true">${sanitizeSvg(item.icon_svg)}</div>
      <h3 class="why__card-title" data-lang="en">${escHtml(item.title_en)}</h3>
      <h3 class="why__card-title" data-lang="ar">${escHtml(item.title_ar)}</h3>
      <p class="why__card-desc" data-lang="en">${escHtml(item.description_en)}</p>
      <p class="why__card-desc" data-lang="ar">${escHtml(item.description_ar)}</p>
    </div>
    <div class="why__card-glow" aria-hidden="true"></div>
  `;

  return card;
}

/**
 * Create navigation dots.
 */
function createDots(container, count) {
  container.innerHTML = '';
  for (let i = 0; i < count; i++) {
    const dot = document.createElement('button');
    dot.className = 'why__dot';
    dot.setAttribute('role', 'tab');
    dot.setAttribute('aria-label', `Benefit ${i + 1}`);
    dot.setAttribute('data-index', i);
    if (i === 0) dot.classList.add('is-active');
    container.appendChild(dot);
  }
}

// ==========================
// ACTIVE CARD MANAGEMENT
// ==========================

let currentActive = -1;

function setActiveCard(index, cards, detailPanel, dots, items, constellationLines) {
  if (index === currentActive) return;
  currentActive = index;

  const lang = document.documentElement.lang || 'ar';

  cards.forEach((card, i) => {
    card.classList.toggle('is-active', i === index);
  });

  dots.forEach((dot, i) => {
    dot.classList.toggle('is-active', i === index);
  });

  if (constellationLines) {
    constellationLines.forEach((line, i) => {
      line.classList.toggle('active', i === index);
    });
  }

  // Update detail panel with crossfade
  const item = items[index];
  if (detailPanel && item) {
    const icon = detailPanel.querySelector('.why__detail-icon');
    const title = detailPanel.querySelector('.why__detail-title');
    const desc = detailPanel.querySelector('.why__detail-desc');

    gsap.to(detailPanel, {
      opacity: 0,
      x: 10,
      duration: 0.2,
      ease: 'power2.in',
      onComplete: () => {
        if (icon) icon.innerHTML = sanitizeSvg(item.icon_svg);
        if (title) title.textContent = lang === 'ar' ? item.title_ar : item.title_en;
        if (desc) desc.textContent = lang === 'ar' ? item.description_ar : item.description_en;
        if (icon) icon.style.color = item.accent_color || '#3B82F6';

        gsap.to(detailPanel, {
          opacity: 1,
          x: 0,
          duration: 0.3,
          ease: 'power2.out',
        });
      },
    });
  }
}

// ==========================
// PARTICLES
// ==========================

function initParticles(canvas) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  let animFrameId;
  const particles = [];
  const PARTICLE_COUNT = 40;

  function resize() {
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
  }

  function createParticle() {
    return {
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 2 + 0.5,
      speedX: (Math.random() - 0.5) * 0.3,
      speedY: (Math.random() - 0.5) * 0.3,
      opacity: Math.random() * 0.5 + 0.1,
    };
  }

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    particles.forEach((p) => {
      p.x += p.speedX;
      p.y += p.speedY;

      if (p.x < 0) p.x = canvas.width;
      if (p.x > canvas.width) p.x = 0;
      if (p.y < 0) p.y = canvas.height;
      if (p.y > canvas.height) p.y = 0;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(59, 130, 246, ${p.opacity})`;
      ctx.fill();
    });

    animFrameId = requestAnimationFrame(animate);
  }

  resize();
  window.addEventListener('resize', resize);

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    particles.push(createParticle());
  }

  animate();

  return () => {
    cancelAnimationFrame(animFrameId);
    window.removeEventListener('resize', resize);
  };
}

// ==========================
// MAIN INIT
// ==========================

export async function initSceneWhy() {
  if (prefersReducedMotion() || typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

  const scene = document.getElementById('scene-why');
  if (!scene) return;

  // ---- Fetch data ----
  const items = await fetchTable('why_muhkam', {
    fallbackUrl: '/data/why-muhkam.json',
    listKey: 'items',
    orderCol: 'display_order',
  });

  if (!items.length) return;

  // ---- DOM elements ----
  const container = scene.querySelector('.why__orbit-container');
  const ring = scene.querySelector('.why__ring');
  const cardsWrapper = scene.querySelector('.why__cards-wrapper');
  const constellation = scene.querySelector('.why__constellation');
  const detailPanel = scene.querySelector('.why__detail');
  const dotsContainer = scene.querySelector('.why__dots');
  const canvas = scene.querySelector('.why__particles');

  if (!container || !cardsWrapper) return;

  // ---- Calculate orbit geometry ----
  const containerSize = container.offsetWidth;
  const radius = containerSize * 0.44;
  const positions = getOrbitPositions(items.length, radius);

  // ---- Create card elements ----
  const cards = [];
  // Calculate card half-width based on container size for centering
  const cardWidth = Math.max(45, Math.min(65, containerSize * 0.11));
  items.forEach((item, i) => {
    const card = createCardElement(item, i, positions[i]);
    card.style.left = `calc(50% + ${positions[i].x}px - ${cardWidth}px)`;
    card.style.top = `calc(50% + ${positions[i].y}px - ${cardWidth * 0.7}px)`;
    cardsWrapper.appendChild(card);
    cards.push(card);
  });

  refreshLanguage();

  // ---- Constellation lines ----
  if (constellation) {
    drawConstellationLines(constellation, positions, containerSize);
  }

  // ---- Navigation dots ----
  if (dotsContainer) {
    createDots(dotsContainer, items.length);
  }

  // ---- Particles background ----
  let cleanupParticles;
  if (canvas) {
    cleanupParticles = initParticles(canvas);
  }

  // ---- Build GSAP Timeline ----
  const cardCount = items.length;
  const totalRotation = 360;

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: scene,
      start: 'top top',
      end: `+=${cardCount * 100}%`,
      pin: true,
      pinSpacing: true,
      scrub: 1,
      anticipatePin: 1,
      id: 'scene-why',
      snap: {
        snapTo: 1 / cardCount,
        duration: { min: 0.2, max: 0.5 },
        delay: 0.1,
        ease: 'power1.inOut',
      },
      onEnter: () => {
        document.body.setAttribute('data-scene', 'why');
        scene.classList.add('scene--active');
      },
      onLeave: () => scene.classList.remove('scene--active'),
      onEnterBack: () => {
        document.body.setAttribute('data-scene', 'why');
        scene.classList.add('scene--active');
      },
      onLeaveBack: () => scene.classList.remove('scene--active'),
      onUpdate: (self) => {
        const progress = self.progress;
        const activeIndex = Math.min(
          Math.floor(progress * cardCount),
          cardCount - 1
        );

        const dots = dotsContainer ? [...dotsContainer.querySelectorAll('.why__dot')] : [];
        const constellationLines = constellation
          ? [...constellation.querySelectorAll('line')]
          : [];
        setActiveCard(activeIndex, cards, detailPanel, dots, items, constellationLines);


      },
    },
  });

  // ---- Phase 1: Entrance (0% → 15%) ----
  const titles = scene.querySelectorAll('.why__title, .why__subtitle');
  tl.fromTo(titles,
    { opacity: 0, y: 30 },
    { opacity: 1, y: 0, duration: 0.05, stagger: 0.02, ease: 'power2.out' },
    0
  );

  if (ring) {
    tl.fromTo(ring,
      { opacity: 0, scale: 0.6 },
      { opacity: 1, scale: 1, duration: 0.08, ease: 'back.out(1.2)' },
      0.03
    );
  }

  cards.forEach((card, i) => {
    const startTime = 0.05 + i * 0.015;
    tl.fromTo(card,
      { scale: 0, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.02, ease: 'back.out(1.4)' },
      startTime
    );
  });

  if (detailPanel) {
    tl.fromTo(detailPanel,
      { opacity: 0, x: 30 },
      { opacity: 1, x: 0, duration: 0.04, ease: 'power2.out' },
      0.12
    );
  }

  // ---- Phase 2: Orbit rotation (15% → 85%) ----
  tl.to(cardsWrapper,
    { rotation: totalRotation, duration: 0.7, ease: 'none' },
    0.15
  );

  // Counter-rotate each card inner so text stays upright
  cards.forEach((card) => {
    const inner = card.querySelector('.why__card-inner');
    if (inner) {
      tl.to(inner,
        { rotation: -totalRotation, duration: 0.7, ease: 'none' },
        0.15
      );
    }
  });

  if (ring) {
    tl.to(ring,
      { rotation: -60, duration: 0.7, ease: 'none' },
      0.15
    );
  }

  // ---- Phase 3: Exit (85% → 100%) ----
  tl.to(cards,
    { scale: 0, opacity: 0, duration: 0.08, stagger: 0.01, ease: 'power2.in' },
    0.88
  );

  if (ring) {
    tl.to(ring,
      { opacity: 0, scale: 1.3, duration: 0.08, ease: 'power2.in' },
      0.90
    );
  }

  tl.to(titles,
    { opacity: 0, y: -30, duration: 0.05, ease: 'power2.in' },
    0.92
  );

  if (detailPanel) {
    tl.to(detailPanel,
      { opacity: 0, x: -20, duration: 0.04, ease: 'power2.in' },
      0.92
    );
  }

  // ---- Click-to-snap: clicking a card scrolls to that card's position ----
  function scrollToCard(index) {
    const st = ScrollTrigger.getById('scene-why');
    if (!st) return;
    // Each card occupies 1/cardCount of the progress in phase 2 (15%-85%)
    const phaseStart = 0.15;
    const phaseEnd = 0.85;
    const cardProgress = phaseStart + ((phaseEnd - phaseStart) / cardCount) * (index + 0.5);
    const targetScroll = st.start + (st.end - st.start) * cardProgress;

    // Use GSAP tween on scroll for smooth snapping
    gsap.to({ val: window.scrollY }, {
      val: targetScroll,
      duration: 0.8,
      ease: 'power2.inOut',
      onUpdate: function () {
        window.scrollTo(0, this.targets()[0].val);
      },
    });
  }

  cards.forEach((card, i) => {
    card.addEventListener('click', () => scrollToCard(i));
  });

  // Dot click also snaps to card
  if (dotsContainer) {
    dotsContainer.addEventListener('click', (e) => {
      const dot = e.target.closest('.why__dot');
      if (!dot) return;
      const index = parseInt(dot.getAttribute('data-index'), 10);
      if (!isNaN(index)) scrollToCard(index);
    });
  }
}
