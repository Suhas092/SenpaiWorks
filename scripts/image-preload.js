/**
 * Critical Image Preloader
 * Preloads hero and initial images for instant display
 * Should be placed in <head> for maximum priority
 */

(function () {
  // Extract and preload eager loading images immediately
  const preloadImages = () => {
    const images = document.querySelectorAll('img[loading="eager"]');
    let count = 0;
    
    images.forEach((img) => {
      if (count >= 8 || !img.src || img.src.startsWith('data:')) return;
      
      // Create preload link in head
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = img.src;
      
      // Add fetchpriority hint for highest priority
      if ('fetchPriority' in link) {
        link.fetchPriority = 'high';
      }
      
      document.head.appendChild(link);
      count++;
    });
  };

  // Run preload immediately
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', preloadImages);
  } else {
    preloadImages();
  }

  // Also preload on window load to catch any missed images
  window.addEventListener('load', preloadImages);
})();
