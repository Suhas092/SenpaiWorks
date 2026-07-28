/* ==========================================================================
   SenpaiWorks News Portal Script - Interactive Changelog Modal
   ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {
  const openBtn = document.getElementById('open-v2-modal-btn');
  const closeBtn = document.getElementById('close-v2-modal');
  const overlay = document.getElementById('v2-modal-overlay');

  if (openBtn && overlay) {
    openBtn.addEventListener('click', (e) => {
      e.preventDefault();
      overlay.classList.add('active');
      document.body.style.overflow = 'hidden'; // Prevent page scroll when modal is open
    });
  }

  if (closeBtn && overlay) {
    closeBtn.addEventListener('click', () => {
      overlay.classList.remove('active');
      document.body.style.overflow = ''; // Restore scroll
    });
  }

  if (overlay) {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.classList.remove('active');
        document.body.style.overflow = '';
      }
    });
  }
});
