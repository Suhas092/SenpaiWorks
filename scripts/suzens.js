// ============================================================
//  SenpaiWorks — Suzens Virtual Idol Group Interactive Script
//  Luxury K-Pop Visual Showcase & 3D Slanted Card Deck
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
  // ── 1. Hero Slide Background Video Controls (Icon-only) ──────
  const heroVideo = document.getElementById("sz-hero-bg-video");
  const heroAudioBtn = document.getElementById("sz-hero-audio-btn");
  const heroAudioIcon = document.getElementById("sz-hero-audio-icon");

  if (heroVideo) {
    heroVideo.play().catch(() => {
      document.body.addEventListener("click", () => heroVideo.play(), { once: true });
    });

    if (heroAudioBtn && heroAudioIcon) {
      heroAudioBtn.addEventListener("click", () => {
        heroVideo.muted = !heroVideo.muted;
        if (heroVideo.muted) {
          heroAudioIcon.className = "fa-solid fa-volume-xmark";
          heroAudioBtn.title = "Unmute Video";
        } else {
          heroAudioIcon.className = "fa-solid fa-volume-high";
          heroAudioBtn.title = "Mute Video";
          heroVideo.play().catch(() => {});
        }
      });
    }
  }

  // ── 2. Full-Bleed Concert Video Controls (10s Loop) ─────────
  const concertVideo = document.getElementById("sz-concert-video");
  const concertAudioBtn = document.getElementById("sz-audio-toggle");
  const concertAudioIcon = document.getElementById("sz-audio-icon");
  const concertAudioText = document.getElementById("sz-audio-text");

  if (concertVideo) {
    const LOOP_START_SEC = 10.0;
    const LOOP_END_SEC = 22.8;

    const initConcert = () => {
      try {
        concertVideo.currentTime = LOOP_START_SEC;
        concertVideo.play().catch(() => {});
      } catch (e) {}
    };

    concertVideo.addEventListener("loadedmetadata", initConcert);
    initConcert();

    concertVideo.addEventListener("timeupdate", () => {
      if (concertVideo.currentTime >= LOOP_END_SEC || concertVideo.currentTime < LOOP_START_SEC - 0.5) {
        concertVideo.currentTime = LOOP_START_SEC;
        concertVideo.play().catch(() => {});
      }
    });

    concertVideo.addEventListener("ended", () => {
      concertVideo.currentTime = LOOP_START_SEC;
      concertVideo.play().catch(() => {});
    });

    if (concertAudioBtn) {
      concertAudioBtn.addEventListener("click", () => {
        concertVideo.muted = !concertVideo.muted;
        if (concertVideo.muted) {
          concertAudioIcon.className = "fa-solid fa-volume-xmark";
          if (concertAudioText) concertAudioText.textContent = "Unmute Crowd Audio";
        } else {
          concertAudioIcon.className = "fa-solid fa-volume-high";
          if (concertAudioText) concertAudioText.textContent = "Mute Stage Audio";
          concertVideo.play().catch(() => {});
        }
      });
    }
  }

  // ── 3. Starring Members: 3D Slanted Card Deck (From Home Page) ─
  const members = [
    {
      name: "SUZANA",
      subtitle: "of SUZENS",
      role: "LEADER · MAIN VOCALIST",
      description: "The heart and voice of SUZENS. Suzana leads the group with grace and power, her crystalline vocals anchoring the group's sonic identity. Bold, determined, and deeply passionate about music.",
      image: "assets/suzana all out.png",
      color1: "#ff3366",
      color2: "#e11d48",
      glowColor: "rgba(255, 51, 102, 0.32)",
      shadowColor: "rgba(255, 51, 102, 0.45)"
    },
    {
      name: "TIARA",
      subtitle: "of SUZENS",
      role: "MAIN RAPPER · LEAD GUITARIST",
      description: "Raw energy and rhythm personified. Tiara's razor-sharp delivery and explosive stage presence make her the electrifying force at the center of every SUZENS performance. Fearless and unstoppable.",
      image: "assets/tiara all out.png",
      color1: "#00f0ff",
      color2: "#0088ff",
      glowColor: "rgba(0, 240, 255, 0.32)",
      shadowColor: "rgba(0, 240, 255, 0.45)"
    },
    {
      name: "REMI",
      subtitle: "of SUZENS",
      role: "MAIN DANCER · BEATMASTER",
      description: "The youngest and most spirited member. Remi's dance style blends fluid contemporary movement with sharp K-pop precision. Her cheerful energy is the emotional soul of the group.",
      image: "assets/remi all out.png",
      color1: "#9d4edd",
      color2: "#7928ca",
      glowColor: "rgba(157, 78, 221, 0.32)",
      shadowColor: "rgba(157, 78, 221, 0.45)"
    },
    {
      name: "AYANA",
      subtitle: "of SUZENS",
      role: "VISUAL · SUB VOCALIST",
      description: "Ethereal and magnetic. Ayana is the visual centrepiece of SUZENS — her striking presence and soft harmonic layers add depth and mystery to the group's signature sound.",
      image: "assets/ayana all out.png",
      color1: "#ff3366",
      color2: "#ffaa00",
      glowColor: "rgba(255, 51, 102, 0.32)",
      shadowColor: "rgba(255, 51, 102, 0.45)"
    }
  ];

  const cards = document.querySelectorAll(".showcase-card");
  const detailsEl = document.querySelector(".showcase-details");
  const nameEl = document.getElementById("showcase-member-name");
  const roleEl = document.getElementById("showcase-member-role");
  const descEl = document.getElementById("showcase-member-desc");
  const counterEl = document.getElementById("showcase-member-counter");

  let activeIdx = 3; // Start with AYANA (index 3) as active center card
  let autoPlayTimer = null;

  function updateShowcase(nextIdx, direction = 1) {
    activeIdx = nextIdx;
    const data = members[activeIdx];
    if (!data) return;

    // Update showcase CSS variables for character-specific colors
    const sectionEl = document.querySelector(".suzens-showcase-section");
    if (sectionEl) {
      sectionEl.style.setProperty("--active-color-1", data.color1);
      sectionEl.style.setProperty("--active-color-2", data.color2);
      sectionEl.style.setProperty("--active-glow", data.glowColor);
      sectionEl.style.setProperty("--active-shadow", data.shadowColor);
    }

    // 1. Text Details Fade/Slide Transition
    if (detailsEl) {
      detailsEl.classList.add("fade-out");
    }

    setTimeout(() => {
      if (nameEl) nameEl.textContent = data.name;
      if (roleEl) roleEl.textContent = data.role;
      if (descEl) descEl.textContent = data.description;
      if (counterEl) counterEl.textContent = `0${activeIdx + 1} / 04`;

      if (detailsEl) {
        detailsEl.classList.remove("fade-out");
      }
    }, 400);

    // 2. Card 3D Carousel Transition Logic
    cards.forEach((card) => {
      const idx = parseInt(card.getAttribute("data-index"), 10);

      if (idx === activeIdx) {
        card.className = "showcase-card pos-center";
      } else if (idx === (activeIdx - 1 + 4) % 4) {
        if (direction === -1 && card.classList.contains("pos-hidden-right")) {
          card.style.transition = "none";
          card.className = "showcase-card pos-hidden-left";
          card.offsetHeight;
          card.style.transition = "";
        }
        card.className = "showcase-card pos-left";
      } else if (idx === (activeIdx + 1) % 4) {
        if (direction === 1 && card.classList.contains("pos-hidden-left")) {
          card.style.transition = "none";
          card.className = "showcase-card pos-hidden-right";
          card.offsetHeight;
          card.style.transition = "";
        }
        card.className = "showcase-card pos-right";
      } else if (idx === (activeIdx + 2) % 4) {
        if (direction === 1) {
          card.className = "showcase-card pos-hidden-left";
        } else {
          card.className = "showcase-card pos-hidden-right";
        }
      }
    });
  }

  // Card click event listeners
  cards.forEach((card) => {
    card.addEventListener("click", () => {
      const idx = parseInt(card.getAttribute("data-index"), 10);
      if (card.classList.contains("pos-left")) {
        updateShowcase(idx, -1);
        resetAutoPlay();
      } else if (card.classList.contains("pos-right")) {
        updateShowcase(idx, 1);
        resetAutoPlay();
      }
    });
  });

  // Autoplay function (triggers next member every 4 seconds)
  function startAutoPlay() {
    autoPlayTimer = setInterval(() => {
      const nextIdx = (activeIdx + 1) % 4;
      updateShowcase(nextIdx, 1);
    }, 4500);
  }

  function resetAutoPlay() {
    if (autoPlayTimer) clearInterval(autoPlayTimer);
    startAutoPlay();
  }

  // Drag & Swipe Navigation
  const cardsWrapper = document.querySelector(".showcase-cards-wrapper");
  if (cardsWrapper) {
    let startX = 0;
    let isDragging = false;

    cardsWrapper.addEventListener("mousedown", (e) => {
      isDragging = true;
      startX = e.clientX;
    });

    window.addEventListener("mouseup", (e) => {
      if (!isDragging) return;
      isDragging = false;
      const diffX = e.clientX - startX;
      if (diffX > 50) {
        updateShowcase((activeIdx - 1 + 4) % 4, -1);
        resetAutoPlay();
      } else if (diffX < -50) {
        updateShowcase((activeIdx + 1) % 4, 1);
        resetAutoPlay();
      }
    });

    cardsWrapper.addEventListener("touchstart", (e) => {
      startX = e.touches[0].clientX;
    }, { passive: true });

    cardsWrapper.addEventListener("touchend", (e) => {
      const diffX = e.changedTouches[0].clientX - startX;
      if (diffX > 50) {
        updateShowcase((activeIdx - 1 + 4) % 4, -1);
        resetAutoPlay();
      } else if (diffX < -50) {
        updateShowcase((activeIdx + 1) % 4, 1);
        resetAutoPlay();
      }
    }, { passive: true });
  }

  startAutoPlay();

  // ── 4. Audio Stem Simulator Toggle ───────────────────────────
  const playBtns = document.querySelectorAll(".sz-play-btn");
  playBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const icon = btn.querySelector("i");
      if (icon.classList.contains("fa-play")) {
        icon.className = "fa-solid fa-pause";
      } else {
        icon.className = "fa-solid fa-play";
      }
    });
  });

  // ── 5. Fan Modal Handlers ────────────────────────────────────
  const fanModal = document.getElementById("sz-fan-modal");
  const modalClose = document.getElementById("sz-modal-close");
  const fanForm = document.getElementById("sz-fan-form");

  window.openFanModal = function () {
    if (fanModal) {
      fanModal.style.display = "flex";
    }
  };

  if (modalClose) {
    modalClose.addEventListener("click", () => {
      if (fanModal) fanModal.style.display = "none";
    });
  }

  if (fanModal) {
    fanModal.addEventListener("click", (e) => {
      if (e.target === fanModal) fanModal.style.display = "none";
    });
  }

  if (fanForm) {
    fanForm.addEventListener("submit", (e) => {
      e.preventDefault();
      alert("Welcome to the Suzenites Fan Club! Your VIP Pre-Debut pass is active.");
      if (fanModal) fanModal.style.display = "none";
      fanForm.reset();
    });
  }
});
