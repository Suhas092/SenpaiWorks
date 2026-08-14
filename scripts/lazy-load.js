/**
 * SenpaiWorks 2.0 Global Image Lazy Loading Engine
 * Automatically enforces native lazy loading and async decoding on all images.
 */
(function () {
  function applyLazyLoading(img) {
    if (!img || img.dataset.eager === "true") return;
    
    if (!img.hasAttribute("loading")) {
      img.setAttribute("loading", "lazy");
    }
    if (!img.hasAttribute("decoding")) {
      img.setAttribute("decoding", "async");
    }
  }

  // Process existing images
  function initLazyLoading() {
    var images = document.querySelectorAll("img");
    for (var i = 0; i < images.length; i++) {
      applyLazyLoading(images[i]);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initLazyLoading);
  } else {
    initLazyLoading();
  }

  // Observe dynamically added images (e.g. infinite scroll, search, store grids)
  if ("MutationObserver" in window) {
    var observer = new MutationObserver(function (mutations) {
      mutations.forEach(function (mutation) {
        mutation.addedNodes.forEach(function (node) {
          if (node.nodeType === 1) {
            if (node.tagName === "IMG") {
              applyLazyLoading(node);
            } else if (node.querySelectorAll) {
              var imgs = node.querySelectorAll("img");
              for (var j = 0; j < imgs.length; j++) {
                applyLazyLoading(imgs[j]);
              }
            }
          }
        });
      });
    });

    observer.observe(document.body || document.documentElement, {
      childList: true,
      subtree: true,
    });
  }
})();
