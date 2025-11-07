// js/main.js
// Contact modal for Contact buttons (WhatsApp / Call / Email)
// Replace previous main.js file with this improved version.

// Helper - remove non-digit characters, keep digits only
function cleanPhone(phone = '') {
  return String(phone).replace(/[^0-9]/g, '');
}

// Build wa.me link. NOTE: the phone number should include country code (e.g. 2567XXXXXXXX).
function buildWhatsAppLink(phone, text = '') {
  const cleaned = cleanPhone(phone);
  if (!cleaned) return null;
  const base = 'https://wa.me/';
  // Encode text; empty text is allowed
  return base + cleaned + (text ? '?text=' + encodeURIComponent(text) : '');
}

// Open url in a new tab safely
function openInNewTab(url) {
  if (!url) return;
  window.open(url, '_blank', 'noopener,noreferrer');
}

// Create and show the contact modal
function showContactModal({ phone, email, label = 'Contact' } = {}) {
  // Remove existing modal if present
  const existing = document.getElementById('contact-modal');
  if (existing) existing.remove();

  // Modal container
  const modal = document.createElement('div');
  modal.id = 'contact-modal';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.className = 'contact-modal';

  // Buttons disabled state if info missing
  const hasPhone = !!phone && !!cleanPhone(phone);
  const hasEmail = !!email && email.trim() !== '';

  modal.innerHTML = `
    <div class="contact-modal-inner" role="document">
      <button class="modal-close" aria-label="Close contact options">×</button>
      <h3 class="modal-title">Contact — ${escapeHtml(label)}</h3>
      <div class="modal-info">
        ${hasPhone ? `<p><strong>Phone:</strong> ${escapeHtml(phone)}</p>` : `<p><strong>Phone:</strong> Not provided</p>`}
        ${hasEmail ? `<p><strong>Email:</strong> ${escapeHtml(email)}</p>` : `<p><strong>Email:</strong> Not provided</p>`}
      </div>
      <div class="modal-actions">
        <button class="btn wa-btn" ${hasPhone ? '' : 'disabled'}>Message on WhatsApp</button>
        <button class="btn call-btn" ${hasPhone ? '' : 'disabled'}>Call</button>
        <button class="btn email-btn" ${hasEmail ? '' : 'disabled'}>Email</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Add minimal styles if not present so modal is usable immediately
  if (!document.getElementById('contact-modal-styles')) {
    const style = document.createElement('style');
    style.id = 'contact-modal-styles';
    style.textContent = `
      .contact-modal { position: fixed; inset: 0; display:flex; align-items:center; justify-content:center; background: rgba(0,0,0,0.35); z-index: 9999; padding: 16px; }
      .contact-modal-inner { background: #fff; padding: 18px; border-radius: 8px; width: 360px; max-width: 100%; box-shadow: 0 8px 24px rgba(0,0,0,0.2); font-family: Arial, sans-serif; }
      .modal-close { float: right; border: none; background: transparent; font-size: 20px; cursor: pointer; }
      .modal-title { margin: 0 0 8px 0; color: #1e4da1; }
      .modal-info p { margin: 6px 0; color: #333; font-size: 14px; }
      .modal-actions { display:flex; flex-direction:column; gap:8px; margin-top:12px; }
      .modal-actions .btn { padding:10px; border-radius:6px; border:none; cursor:pointer; font-weight:600; }
      .wa-btn { background:#25D366; color:#fff; }
      .call-btn { background:#1e4da1; color:#fff; }
      .email-btn { background:#f0a500; color:#fff; }
      .btn[disabled] { opacity: 0.6; cursor: not-allowed; }
    `;
    document.head.appendChild(style);
  }

  // Element refs
  const closeBtn = modal.querySelector('.modal-close');
  const waBtn = modal.querySelector('.wa-btn');
  const callBtn = modal.querySelector('.call-btn');
  const emailBtn = modal.querySelector('.email-btn');

  // Actions
  closeBtn.addEventListener('click', () => modal.remove());
  waBtn.addEventListener('click', () => {
    if (!hasPhone) return;
    const waLink = buildWhatsAppLink(phone, `Hello ${label}, I got your contact from the School website.`);
    if (waLink) openInNewTab(waLink);
  });
  callBtn.addEventListener('click', () => {
    if (!hasPhone) return;
    // Use cleaned phone for tel:
    const tel = 'tel:' + cleanPhone(phone);
    window.location.href = tel;
  });
  emailBtn.addEventListener('click', () => {
    if (!hasEmail) return;
    window.location.href = 'mailto:' + encodeURIComponent(email);
  });

  // Close when clicking outside inner dialog
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.remove();
  });

  // Keyboard accessibility: Esc to close
  function onKey(e) {
    if (e.key === 'Escape') modal.remove();
  }
  document.addEventListener('keydown', onKey);

  // Remove event listener when modal removed
  const observer = new MutationObserver(() => {
    if (!document.getElementById('contact-modal')) {
      document.removeEventListener('keydown', onKey);
      observer.disconnect();
    }
  });
  observer.observe(document.body, { childList: true, subtree: false });

  // Focus the first enabled button
  const firstEnabled = modal.querySelector('.modal-actions .btn:not([disabled])');
  if (firstEnabled) firstEnabled.focus();
}

// Utility: escape HTML for safe insertion of label/values
function escapeHtml(str) {
  return String(str || '').replace(/[&<>"']/g, (m) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}

// Attach click handlers to all contact buttons (delegation-friendly)
function attachContactHandlers() {
  // buttons with class .contact-btn inside cards that have data-phone/data-email attributes
  const buttons = document.querySelectorAll('.contact-btn');

  buttons.forEach(btn => {
    btn.addEventListener('click', function (e) {
      const card = btn.closest('[data-phone], [data-email]') || btn.parentElement;
      if (!card) {
        // fallback: try reading data attributes on the button itself
        const phone = btn.dataset.phone || null;
        const email = btn.dataset.email || null;
        const label = btn.dataset.label || btn.textContent || 'Contact';
        return showContactModal({ phone, email, label });
      }
      const phone = card.getAttribute('data-phone') || null;
      const email = card.getAttribute('data-email') || null;
      const label = card.getAttribute('data-label') || card.querySelector('h3')?.innerText || btn.dataset.label || 'Contact';
      showContactModal({ phone, email, label });
    });
  });
}

// Auto-run on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
  attachContactHandlers();
});
