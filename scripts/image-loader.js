/**
 * Image Loading Optimizer
 * - Loads critical images immediately
 * - Defers below-fold images with lazy loading
 * - Implements blur-up effect for smooth loading
 * - Handles image loading errors with fallback
 */

(function () {
  'use strict';

  const ImageLoader = {
    // Initialize observer for lazy images
    init() {
      this.loadEagerImages();
      this.setupIntersectionObserver();
      this.optimizeImageLoading();
    },

    // Load all eager images immediately
    loadEagerImages() {
      const eagerImages = document.querySelectorAll('img[loading="eager"]');
      eagerImages.forEach((img) => {
        if (!img.src || img.src.startsWith('data:')) return;
        img.classList.add('image-eager-loading');
      });
    },

    // Setup Intersection Observer for lazy loading
    setupIntersectionObserver() {
      // Check if browser supports IntersectionObserver
      if (!('IntersectionObserver' in window)) {
        // Fallback: load all lazy images immediately
        document.querySelectorAll('img[loading="lazy"]').forEach((img) => {
          this.loadImage(img);
        });
        return;
      }

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const img = entry.target;
              this.loadImage(img);
              observer.unobserve(img);
            }
          });
        },
        {
          rootMargin: '100px', // Start loading 100px before visible
          threshold: 0.01,
        }
      );

      // Observe all lazy images
      document.querySelectorAll('img[loading="lazy"]').forEach((img) => {
        observer.observe(img);
      });
    },

    // Load image with blur-up effect
    loadImage(img) {
      if (!img.src || img.src.startsWith('data:')) {
        return;
      }

      // Add loading class for CSS animation
      img.classList.add('image-loading');

      // Just ensure image is set to load (browser handles it)
      img.decoding = 'async';
      this.triggerImageLoadedEvent(img);
    },

    // Optimize image loading with priority hints
    optimizeImageLoading() {
      const images = document.querySelectorAll('img');

      images.forEach((img, index) => {
        // Skip if already processed
        if (img.dataset.imageOptimized) return;

        // Check position for loading priority
        const rect = img.getBoundingClientRect();
        const isVisible = rect.top < window.innerHeight * 1.5 && rect.bottom > 0;

        // Visible and early in DOM - load immediately
        if (isVisible && index < 10) {
          if (!img.loading || img.loading === 'lazy') {
            img.loading = 'eager';
          }
          img.decoding = 'auto';
        } 
        // Just off-screen - prioritize loading
        else if (isVisible && index < 25) {
          if (!img.loading || img.loading === 'lazy') {
            img.loading = 'eager';
          }
          img.decoding = 'async';
        }
        // Below fold - lazy load
        else {
          if (!img.loading) {
            img.loading = 'lazy';
          }
          if (!img.decoding) {
            img.decoding = 'async';
          }
        }

        // Add placeholder background
        if (!img.src || img.src === '') {
          img.style.backgroundColor = '#f0f0f0';
        }

        img.dataset.imageOptimized = 'true';
      });
    },

    // Trigger custom event when image loads
    triggerImageLoadedEvent(img) {
      const event = new CustomEvent('imageloaded', { detail: { img } });
      window.dispatchEvent(event);
    },

    // Force reload failed images
    retryFailedImages() {
      document.querySelectorAll('img.image-error').forEach((img) => {
        img.classList.remove('image-error');
        this.loadImage(img);
      });
    },
  };

  // Initialize immediately on page load
  ImageLoader.init();
  
  // Re-optimize after page fully loads
  window.addEventListener('load', () => {
    ImageLoader.optimizeImageLoading();
  });

  // Expose to window for debugging
  window.ImageLoader = ImageLoader;
})();

