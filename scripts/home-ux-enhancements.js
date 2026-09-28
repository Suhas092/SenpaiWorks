/**
 * SenpaiWorks Mobile & UX Enhancement Script
 * Handles: News accordion toggle, touch-device pause, loading skeletons
 * scripts/home-ux-enhancements.js
 */

(function () {
  "use strict";

  // ═════════════════════════════════════════════════════════════════
  // ISSUE #9: Mobile News Accordion Toggle
  // ═════════════════════════════════════════════════════════════════

  function initNewsAccordion() {
    const recList = document.getElementById("home-rec-list");
    if (!recList) return;

    // Only add toggle on mobile (768px or less)
    if (window.innerWidth <= 768) {
      // Create toggle button
      const toggleBtn = document.createElement("button");
      toggleBtn.className = "rec-list-toggle-btn";
      toggleBtn.type = "button";
      toggleBtn.setAttribute("aria-label", "Show more news");
      toggleBtn.innerHTML = '<span>Show More News</span><i class="fa-solid fa-chevron-down"></i>';

      // Insert button after recList
      recList.parentNode.insertBefore(toggleBtn, recList.nextSibling);

      // Toggle functionality
      toggleBtn.addEventListener("click", () => {
        recList.classList.toggle("expanded");
        const isExpanded = recList.classList.contains("expanded");
        toggleBtn.classList.toggle("expanded");
        toggleBtn.setAttribute("aria-label", isExpanded ? "Show less news" : "Show more news");
        toggleBtn.innerHTML = isExpanded
          ? '<span>Show Less News</span><i class="fa-solid fa-chevron-up"></i>'
          : '<span>Show More News</span><i class="fa-solid fa-chevron-down"></i>';
      });
    }
  }

  // ═════════════════════════════════════════════════════════════════
  // ISSUE #11: Hero Slideshow Touch Device Pause/Play
  // ═════════════════════════════════════════════════════════════════

  function initTouchPauseForSlideshow() {
    const slideshowContainer = document.querySelector(".slideshow-container");
    const playPauseBtn = document.querySelector(".slideshow-play-pause-btn");
    if (!slideshowContainer || !playPauseBtn) return;

    let isPaused = false;
    let touchStart = { x: 0, y: 0 };

    // Detect if device supports touch
    const isTouchDevice = () => {
      return (
        (typeof window !== "undefined" && ("ontouchstart" in window)) ||
        (typeof navigator !== "undefined" && navigator.maxTouchPoints > 0) ||
        (typeof navigator !== "undefined" && navigator.msMaxTouchPoints > 0)
      );
    };

    if (!isTouchDevice()) return; // Skip on non-touch devices

    // Pause on touch start (user interaction)
    slideshowContainer.addEventListener("touchstart", (e) => {
      touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      if (!isPaused) {
        isPaused = true;
        slideshowContainer.classList.add("touch-paused");
        playPauseBtn.setAttribute("aria-label", "Play slideshow");
        playPauseBtn.setAttribute("title", "Play slideshow");

        // Update button visual state if needed
        if (!slideshowContainer.classList.contains("paused")) {
          slideshowContainer.classList.add("paused");
        }
      }
    }, { passive: true });

    // Auto-resume after 8 seconds of inactivity
    let resumeTimeout;
    const scheduleAutoResume = () => {
      clearTimeout(resumeTimeout);
      resumeTimeout = setTimeout(() => {
        if (isPaused) {
          isPaused = false;
          slideshowContainer.classList.remove("touch-paused");
          slideshowContainer.classList.remove("paused");
          playPauseBtn.setAttribute("aria-label", "Pause slideshow");
          playPauseBtn.setAttribute("title", "Pause slideshow");
        }
      }, 8000);
    };

    slideshowContainer.addEventListener("touchend", scheduleAutoResume, { passive: true });
    slideshowContainer.addEventListener("touchmove", scheduleAutoResume, { passive: true });

    // Clear timeout on manual play/pause
    playPauseBtn.addEventListener("click", () => {
      clearTimeout(resumeTimeout);
      isPaused = !isPaused;
    });
  }

  // ═════════════════════════════════════════════════════════════════
  // Initialize on Page Load
  // ═════════════════════════════════════════════════════════════════

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      initNewsAccordion();
      initTouchPauseForSlideshow();
    });
  } else {
    initNewsAccordion();
    initTouchPauseForSlideshow();
  }

  // Re-init accordion on window resize (responsive)
  let resizeTimeout;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      const existingBtn = document.querySelector(".rec-list-toggle-btn");
      const isMobile = window.innerWidth <= 768;

      if (isMobile && !existingBtn) {
        // Resize to mobile: init accordion
        initNewsAccordion();
      } else if (!isMobile && existingBtn) {
        // Resize to desktop: remove accordion button
        existingBtn.remove();
        const recList = document.getElementById("home-rec-list");
        if (recList) {
          recList.classList.remove("expanded");
        }
      }
    }, 200);
  });
})();
