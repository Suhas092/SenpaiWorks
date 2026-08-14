function initDrawer() {
  const container = document.getElementById('drawer-container');
  if (!container) return false;

  if (container.hasAttribute('data-drawer-initialized')) return true;
  container.setAttribute('data-drawer-initialized', 'true');

  fetch('drawer.html?v=' + new Date().getTime())
    .then(res => res.text())
    .then(html => {
      container.innerHTML = html;

      const drawer = document.getElementById('top-drawer');
      const overlay = document.getElementById('drawer-overlay');
      const closeBtn = document.getElementById('drawer-close-btn');

      // Showcase Card Elements
      const img1 = document.getElementById('drawer-img-1');
      const title1 = document.getElementById('drawer-title-1');
      const desc1 = document.getElementById('drawer-desc-1');

      const img2 = document.getElementById('drawer-img-2');
      const title2 = document.getElementById('drawer-title-2');
      const desc2 = document.getElementById('drawer-desc-2');

      // Drawer open/close logic with dark backdrop overlay
      window.openDrawer = function() {
        const d = document.getElementById('top-drawer');
        const o = document.getElementById('drawer-overlay');
        if (d) d.classList.add('open');
        if (o) o.classList.add('open');
        document.body.style.overflow = 'hidden';
        var hc = document.querySelector('.header-container');
        if (hc) hc.classList.add('drawer-open');
      };

      window.closeDrawer = function() {
        const d = document.getElementById('top-drawer');
        const o = document.getElementById('drawer-overlay');
        if (d) d.classList.remove('open');
        if (o) o.classList.remove('open');
        document.body.style.overflow = '';
        var hc = document.querySelector('.header-container');
        if (hc) hc.classList.remove('drawer-open');
      };

      window.toggleDrawer = function() {
        const d = document.getElementById('top-drawer');
        if (d && d.classList.contains('open')) {
          window.closeDrawer();
        } else {
          window.openDrawer();
        }
      };

      // Close logic: Close button, Escape key, and clicking outside on overlay
      if (closeBtn) {
        closeBtn.addEventListener('click', window.closeDrawer);
      }
      if (overlay) {
        overlay.addEventListener('click', window.closeDrawer);
      }
      document.addEventListener('keydown', (e) => {
        const d = document.getElementById('top-drawer');
        if (d && d.classList.contains('open') && e.key === 'Escape') {
          window.closeDrawer();
        }
      });

      // Dynamic Image Swap on Sub-Options (.drawer-item) and Single Links
      function swapImages(elem) {
        if (!elem) return;
        const newImg1 = elem.getAttribute('data-img1');
        const newTitle1 = elem.getAttribute('data-title1');
        const newDesc1 = elem.getAttribute('data-desc1');

        let newImg2 = elem.getAttribute('data-img2');
        let newTitle2 = elem.getAttribute('data-title2');
        let newDesc2 = elem.getAttribute('data-desc2');

        // Dynamic fallback for Card 2 if not explicitly specified on item
        if (!newImg2 && newImg1) {
          if (newImg1.includes('deadpool')) {
            newImg2 = 'https://res.cloudinary.com/dmzchsqms/image/upload/f_auto,q_auto/w_600/v1757630848/rem_happy_evhesz.webp';
            newTitle2 = 'Character Rig Assets';
            newDesc2 = 'Download production-ready 3D character rigs with facial blendshapes.';
          } else if (newImg1.includes('rem_happy')) {
            newImg2 = 'https://res.cloudinary.com/dmzchsqms/image/upload/f_auto,q_auto/w_600/v1757630848/chronos_plays_fl47xm.webp';
            newTitle2 = 'VFX Action Sequence';
            newDesc2 = '6 months of animation work, cloth simulations, and particle FX.';
          } else {
            newImg2 = 'https://res.cloudinary.com/dmzchsqms/image/upload/f_auto,q_auto/w_600/v1757630827/deadpool_poster_krntp0.webp';
            newTitle2 = 'Deadpool VFX Breakdown';
            newDesc2 = 'Blender EEVEE toon shader node setup and fight scene choreography.';
          }
        }

        if (img1 && newImg1) {
          img1.style.opacity = '0.3';
          setTimeout(() => {
            img1.src = newImg1;
            if (title1) title1.textContent = newTitle1;
            if (desc1) desc1.textContent = newDesc1;
            img1.style.opacity = '1';
          }, 100);
        }

        if (img2 && newImg2) {
          img2.style.opacity = '0.3';
          setTimeout(() => {
            img2.src = newImg2;
            if (title2) title2.textContent = newTitle2;
            if (desc2) desc2.textContent = newDesc2;
            img2.style.opacity = '1';
          }, 100);
        }
      }

      // Hover preview image swapping for drawer items & titles
      const drawerItems = drawer ? drawer.querySelectorAll('.drawer-item, .drawer-group-title') : [];
      drawerItems.forEach(item => {
        item.addEventListener('mouseenter', () => swapImages(item));
      });

      // Explicit link navigation handler for ALL links inside drawer (Sub-options & Feature Cards)
      const subLinks = drawer ? drawer.querySelectorAll('.drawer-item, .drawer-feature-card, .drawer-brand-logo') : [];
      subLinks.forEach(link => {
        link.addEventListener('click', (e) => {
          const href = link.getAttribute('href');
          if (href && href !== '#' && !href.startsWith('javascript:')) {
            e.preventDefault();
            e.stopPropagation();
            window.closeDrawer();
            setTimeout(() => {
              window.location.href = href;
            }, 20);
          }
        });
      });

      // Category Title Redirection & Chevron Accordion Toggle
      const drawerGroups = drawer ? drawer.querySelectorAll('.drawer-group') : [];
      drawerGroups.forEach(group => {
        const titleLink = group.querySelector('.drawer-group-title');
        const accordionIcon = group.querySelector('.drawer-accordion-icon');

        // 1. Tapping title text (HOME, NEWS, ART LIBRARY, etc.) redirects directly to page
        if (titleLink) {
          titleLink.addEventListener('click', (e) => {
            const href = titleLink.getAttribute('href');
            if (href && href !== '#' && !href.startsWith('javascript:')) {
              e.preventDefault();
              e.stopPropagation();
              window.closeDrawer();
              setTimeout(() => {
                window.location.href = href;
              }, 20);
            }
          });
        }

        // 2. Tapping chevron dropdown arrow toggles sub-options accordion
        if (accordionIcon) {
          accordionIcon.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();

            const isActive = group.classList.contains('active');

            // Collapse other open groups for clean single-accordion UI
            drawerGroups.forEach(otherGroup => {
              if (otherGroup !== group) {
                otherGroup.classList.remove('active');
              }
            });

            if (isActive) {
              group.classList.remove('active');
            } else {
              group.classList.add('active');
            }
          });
        }
      });
    })
    .catch(err => console.error('Error loading drawer:', err));

  return true;
}

// Global Event Delegation for header logo button
document.addEventListener('click', function(e) {
  var logo = e.target.closest('#logo-button');
  if (logo) {
    e.preventDefault();
    e.stopPropagation();

    const drawer = document.getElementById('top-drawer');
    if (!drawer) {
      initDrawer();
      setTimeout(() => {
        if (typeof window.openDrawer === 'function') window.openDrawer();
      }, 250);
    } else {
      if (typeof window.toggleDrawer === 'function') {
        window.toggleDrawer();
      }
    }
  }
});

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  if (!initDrawer()) {
    const interval = setInterval(() => {
      if (initDrawer()) {
        clearInterval(interval);
      }
    }, 100);
    setTimeout(() => clearInterval(interval), 5000);
  }
});
