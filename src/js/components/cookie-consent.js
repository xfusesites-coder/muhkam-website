/**
 * Cookie Consent Banner
 *
 * Shows a GDPR-compliant cookie consent banner on first visit.
 * Stores user preference in localStorage. No cookies are set
 * until the user explicitly accepts.
 */

const STORAGE_KEY = 'muhkam_cookie_consent';

export function initCookieConsent() {
  // Already answered — don't show
  if (localStorage.getItem(STORAGE_KEY)) return;

  const banner = document.getElementById('cookie-consent');
  if (!banner) return;

  const acceptBtn = banner.querySelector('[data-cookie-accept]');
  const declineBtn = banner.querySelector('[data-cookie-decline]');

  // Show banner after a short delay so it doesn't compete with page load
  setTimeout(() => banner.classList.add('is-visible'), 1500);

  function dismiss(choice) {
    localStorage.setItem(STORAGE_KEY, choice);
    banner.classList.remove('is-visible');
    // Remove from DOM after animation
    banner.addEventListener('transitionend', () => banner.remove(), { once: true });
  }

  if (acceptBtn) acceptBtn.addEventListener('click', () => dismiss('accepted'));
  if (declineBtn) declineBtn.addEventListener('click', () => dismiss('declined'));
}
