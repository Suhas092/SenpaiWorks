document.addEventListener('DOMContentLoaded', function() {
  fetch('drawer.html?v=' + new Date().getTime())
    .then(res => res.text())
    .then(html => {
      const drawerContainer = document.getElementById('drawer-container');
      if (drawerContainer) {
        drawerContainer.innerHTML = html;
      }

      const drawer = document.getElementById('top-drawer');
      const items = drawer ? drawer.querySelectorAll<HTMLElement>('.drawer-item') : null;
      const previewImg = drawer ? drawer.querySelector<HTMLImageElement>('#drawer-img-preview') : null;

      // Drawer hover preview
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

  // Global event delegation for drawer toggle and closing
  function openDrawer(logoBtn: HTMLImageElement | null, drawer: HTMLElement | null) {
    if (drawer) drawer.classList.add('open');
    document.body.style.overflow = 'hidden';
    const hc = document.querySelector('.header-container');
    if (hc) hc.classList.add('drawer-open');
  }

  function closeDrawer(logoBtn: HTMLImageElement | null, drawer: HTMLElement | null) {
    if (drawer) drawer.classList.remove('open');
    document.body.style.overflow = '';
    const hc = document.querySelector('.header-container');
    if (hc) hc.classList.remove('drawer-open');
  }

  // Toggle drawer on logo click
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    const logoBtn = target.closest('#logo-button') as HTMLImageElement | null;
    const drawer = document.getElementById('top-drawer');
    
    if (logoBtn) {
      if (drawer) {
        if (drawer.classList.contains('open')) {
          closeDrawer(logoBtn, drawer);
        } else {
          openDrawer(logoBtn, drawer);
        }
      }
    } else if (target.closest('#drawer-close-btn')) {
      closeDrawer(document.getElementById('logo-button') as HTMLImageElement | null, drawer);
    } else if (drawer && target === drawer) {
      closeDrawer(document.getElementById('logo-button') as HTMLImageElement | null, drawer);
    }
  });

  // Close on Esc key
  document.addEventListener('keydown', (e: KeyboardEvent) => {
    const drawer = document.getElementById('top-drawer');
    if (drawer && drawer.classList.contains('open') && e.key === 'Escape') {
      const logoBtn = document.getElementById('logo-button') as HTMLImageElement | null;
      closeDrawer(logoBtn, drawer);
    }
  });
});
