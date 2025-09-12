document.addEventListener('DOMContentLoaded', function() {
  fetch('drawer.html')
    .then(res => res.text())
    .then(html => {
      document.getElementById('drawer-container').innerHTML = html;

      const drawer = document.getElementById('top-drawer');
      const closeBtn = document.getElementById('drawer-close-btn');
      const items = drawer.querySelectorAll('.drawer-item');
      const previewImg = drawer.querySelector('#drawer-img-preview');
      const logoBtn = document.getElementById('logo-button'); // Your logo <img>

      // IMPORTANT: Store the original image source on first script load
      const originalLogoSrc = logoBtn.src;
      const altLogoSrc = 'https://res.cloudinary.com/dmzchsqms/image/upload/f_auto,q_auto/w_600/v1757630848/chronos_plays_fl47xm.webp';

      // Drawer open/close logic with logo image swap
      function openDrawer() {
        drawer.classList.add('show');
        document.body.style.overflow = 'hidden';
        logoBtn.src = altLogoSrc;
      }
      function closeDrawer() {
        drawer.classList.remove('show');
        document.body.style.overflow = '';
        logoBtn.src = originalLogoSrc;
      }

      // Toggle drawer on logo click
      if (logoBtn) {
        logoBtn.addEventListener('click', () => {
          if (drawer.classList.contains('show')) {
            closeDrawer();
          } else {
            openDrawer();
          }
        });
      }

      // Close logic (button, esc, click outside)
      if (closeBtn) {
        closeBtn.addEventListener('click', closeDrawer);
      }
      document.addEventListener('keydown', (e) => {
        if (drawer.classList.contains('show') && e.key === 'Escape') {
          closeDrawer();
        }
      });
      drawer.addEventListener('click', (e) => {
        if (e.target === drawer) {
          closeDrawer();
        }
      });

      // Drawer hover preview (if used)
      if (items && previewImg) {
        items.forEach(item => {
          item.addEventListener('mouseenter', () => {
            const imgUrl = item.getAttribute('data-img');
            if (imgUrl) {
              previewImg.classList.remove('active');
              setTimeout(() => {
                previewImg.src = imgUrl;
                previewImg.classList.add('active');
              }, 12);
            }
          });
        });
      }
    });
});
