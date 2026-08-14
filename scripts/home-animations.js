/**
 * SENPAIWORKS - Premium Home Page Animations & Transitions Engine
 * Optimized for Desktop & Mobile with Bulletproof Fallbacks.
 */

(function () {
  'use strict';

  function runAnimationEngine() {
    initPageTransitions();
    initScrollObserver();
    initHeroAnimations();
    initInteractiveTilt();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runAnimationEngine);
  } else {
    runAnimationEngine();
  }

  /**
   * Page Entrance & Exit Smooth Transition Overlay
   */
  function initPageTransitions() {
    // Ensure curtain exists
    let curtain = document.querySelector('.page-transition-curtain');
    if (!curtain) {
      curtain = document.createElement('div');
      curtain.className = 'page-transition-curtain';
      document.body.appendChild(curtain);
    }

    // Instantly remove curtain overlay after short delay
    const revealPage = () => {
      document.body.classList.add('page-loaded');
    };

    requestAnimationFrame(revealPage);
    setTimeout(revealPage, 200);

    // Intercept internal links for smooth exit
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a');
      if (!link) return;

      const href = link.getAttribute('href');
      const target = link.getAttribute('target');

      if (!href || href.startsWith('#') || href.startsWith('javascript:') || href.startsWith('mailto:') || target === '_blank') {
        return;
      }

      e.preventDefault();
      if (curtain) {
        curtain.classList.add('is-exiting');
        setTimeout(() => {
          window.location.href = href;
        }, 280);
      } else {
        window.location.href = href;
      }
    });

    window.addEventListener('pageshow', (event) => {
      if (event.persisted) {
        if (curtain) curtain.classList.remove('is-exiting');
        document.body.classList.add('page-loaded');
      }
    });
  }

  /**
   * Scroll-Triggered Reveal Animations using IntersectionObserver
   */
  function initScrollObserver() {
    const isMobile = window.innerWidth <= 768 || ('ontouchstart' in window);
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const revealSelector = '.reveal-on-scroll, .reveal-slide-up, .reveal-scale, .reveal-stagger, .gateway-portal-card, .pipeline-card, .grid-card, .rec-list-item, .movie-card, .community-intro-card, .merch-feature-card, .suzens-showcase-section, .whats-happening-feature, .recommended-column, .merch-review, .movies-section, .merch-section, .index-cta-box';

    const revealElements = document.querySelectorAll(revealSelector);

    // Reduced motion or fallback
    if (prefersReducedMotion) {
      revealElements.forEach(el => el.classList.add('is-revealed'));
      return;
    }

    // Safety Net: Instantly reveal anything currently visible in viewport
    revealElements.forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight + 100) {
        el.classList.add('is-revealed');
      }

      if (!el.classList.contains('reveal-on-scroll') && !el.classList.contains('reveal-slide-up') && !el.classList.contains('reveal-scale')) {
        el.classList.add('reveal-slide-up');
      }

      if (el.parentElement && (el.parentElement.classList.contains('gateway-grid-6') || el.parentElement.classList.contains('pipeline-grid') || el.parentElement.classList.contains('merch-grid'))) {
        const childIndex = Array.from(el.parentElement.children).indexOf(el);
        el.style.transitionDelay = `${(childIndex % 6) * (isMobile ? 0.04 : 0.08)}s`;
      }
    });

    if (!('IntersectionObserver' in window)) {
      revealElements.forEach(el => el.classList.add('is-revealed'));
      return;
    }

    const observerOptions = {
      root: null,
      rootMargin: isMobile ? '0px 0px 100px 0px' : '0px 0px -40px 0px',
      threshold: isMobile ? 0.01 : 0.08
    };

    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const target = entry.target;
          target.classList.add('is-revealed');
          obs.unobserve(target);
        }
      });
    }, observerOptions);

    revealElements.forEach(el => observer.observe(el));

    // Global Safety Timeout: Force all elements to reveal after 800ms so screen is NEVER blank
    setTimeout(() => {
      revealElements.forEach(el => el.classList.add('is-revealed'));
      document.body.classList.add('page-loaded');
    }, 800);
  }

  /**
   * Hero Entrance Animation Sequence
   */
  function initHeroAnimations() {
    const heroElements = document.querySelectorAll('.video-overlay-logo, .video-logo-wrapper, .video-overlay-description, .hero-actions-row, .slideshow-container .hero-content');
    heroElements.forEach((el, i) => {
      el.classList.add('hero-reveal-element');
      el.style.animationDelay = `${0.1 + i * 0.12}s`;
    });
  }

  /**
   * Dynamic 3D Card Hover Parallax / Tilt Effect
   */
  function initInteractiveTilt() {
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0 || window.innerWidth <= 768) return;

    const tiltCards = document.querySelectorAll('.interactive-tilt, .gateway-portal-card, .merch-feature-card');
    tiltCards.forEach(card => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotateX = ((y - centerY) / centerY) * -4;
        const rotateY = ((x - centerX) / centerX) * 4;

        card.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateY(-6px) scale(1.02)`;
      });

      card.addEventListener('mouseleave', () => {
        card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px) scale(1)';
      });
    });
  }

})();
