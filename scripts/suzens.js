// ============================================================
//  SenpaiWorks — Suzens Virtual Idol Group Script
//  Luxury K-Pop Visual Showcase & Media Controllers
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
  // ── 1. Hero Slide Background Video Controls ─────────────────
  const heroVideo = document.getElementById("sz-hero-bg-video");
  const heroAudioBtn = document.getElementById("sz-hero-audio-btn");
  const heroAudioIcon = document.getElementById("sz-hero-audio-icon");
  const heroAudioText = document.getElementById("sz-hero-audio-text");

  if (heroVideo) {
    heroVideo.play().catch(() => {
      document.body.addEventListener("click", () => heroVideo.play(), { once: true });
    });

    if (heroAudioBtn) {
      heroAudioBtn.addEventListener("click", () => {
        heroVideo.muted = !heroVideo.muted;
        if (heroVideo.muted) {
          heroAudioIcon.className = "fa-solid fa-volume-xmark";
          heroAudioText.textContent = "Unmute Video";
        } else {
          heroAudioIcon.className = "fa-solid fa-volume-high";
          heroAudioText.textContent = "Mute Video";
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
          concertAudioText.textContent = "Unmute Crowd Audio";
        } else {
          concertAudioIcon.className = "fa-solid fa-volume-high";
          concertAudioText.textContent = "Mute Stage Audio";
          concertVideo.play().catch(() => {});
        }
      });
    }
  }

  // ── 3. Starring Members Showcase Data & Logic ───────────────
  const starringData = {
    suzana: {
      num: "01",
      name: "SUZANA",
      badge: "LEADER · MAIN VOCALIST",
      title: '"The Radiant Center"',
      bigImg: "assets/suzana all out.png",
      desc: "Charismatic, fierce, and carrying an expansive vocal range. Suzana commands center stage with passion, delivering unforgettable melodies that define the group's sonic heart.",
      position: "Leader / Main Vocal",
      gear: "Custom Cyber Stratocaster",
      vocal: "Power Belting & Melodic Pop"
    },
    tiara: {
      num: "02",
      name: "TIARA",
      badge: "LEAD GUITARIST · SYNTH SOUND DESIGN",
      title: '"The Holographic Melody Maker"',
      bigImg: "assets/tiara all out.png",
      desc: "A sound architect in the digital sphere, Tiara weaves intricate guitar solos with rich synthesizer textures, defining Suzens signature futuristic soundscape.",
      position: "Lead Guitarist / Sound Design",
      gear: "7-String Cyber Axe & Synthesizer",
      vocal: "Harmonic Backing & Synth Vocal"
    },
    remi: {
      num: "03",
      name: "REMI",
      badge: "BEATMASTER · DRUMS & PERCUSSION",
      title: '"The Kinetic Rhythm Powerhouse"',
      bigImg: "assets/remi all out.png",
      desc: "Explosive, hyper, and full of charisma, Remi anchors the rhythmic drive of Suzens. Her hybrid digital-acoustic drum patterns deliver dynamic stage impact.",
      position: "Drums & Sub-Bass Percussion",
      gear: "Kinetic V-Drum Rig",
      vocal: "Hype Vocals & Dynamic Ad-libs"
    },
    ayana: {
      num: "04",
      name: "AYANA",
      badge: "VISUAL CENTER · BASSIST · SUB-VOCAL",
      title: '"The Midnight Siren"',
      bigImg: "assets/ayana all out.png",
      desc: "Ethereal, magnetic, and effortlessly captivating, Ayana grounds the lower harmonies with deep pulsating basslines while shining as the group's visual anchor.",
      position: "Visual Center / Bass & Rap",
      gear: "Sub-Harmonic 4-String Bass",
      vocal: "Sub-Vocal Harmony & Fast Rap Flow"
    }
  };

  const memberKeys = ["suzana", "tiara", "remi", "ayana"];
  let currentIndex = 0;
  let autoCycleInterval = null;
  let isAutoCycling = true;

  // DOM Elements
  const bigImg = document.getElementById("sz-starring-big-img");
  const numTag = document.getElementById("sz-starring-num");
  const namePill = document.getElementById("sz-starring-name-pill");
  const roleBadge = document.getElementById("sz-starring-role-badge");
  const nameEl = document.getElementById("sz-starring-name");
  const titleEl = document.getElementById("sz-starring-title");
  const descEl = document.getElementById("sz-starring-desc");
  const specPosition = document.getElementById("sz-spec-position");
  const specGear = document.getElementById("sz-spec-gear");
  const specVocal = document.getElementById("sz-spec-vocal");
  const thumbCards = document.querySelectorAll(".sz-member-thumb-card");
  const cycleToggleBtn = document.getElementById("sz-cycle-toggle-btn");

  function setStarringMember(key, isManual = false) {
    const data = starringData[key];
    if (!data) return;

    currentIndex = memberKeys.indexOf(key);

    // Update active thumbnail scaling
    thumbCards.forEach((card) => {
      if (card.getAttribute("data-member") === key) {
        card.classList.add("active");
      } else {
        card.classList.remove("active");
      }
    });

    // Animate Big Starring Image
    if (bigImg) {
      bigImg.style.opacity = "0";
      bigImg.style.transform = "scale(0.94) translateY(12px)";

      setTimeout(() => {
        bigImg.src = data.bigImg;
        bigImg.alt = `${data.name} Starring Idol`;
        bigImg.style.opacity = "1";
        bigImg.style.transform = "scale(1) translateY(0)";
      }, 200);
    }

    // Update Text Details
    if (numTag) numTag.textContent = data.num;
    if (namePill) namePill.textContent = data.name;
    if (roleBadge) roleBadge.textContent = data.badge;
    if (nameEl) nameEl.textContent = data.name;
    if (titleEl) titleEl.textContent = data.title;
    if (descEl) descEl.textContent = data.desc;
    if (specPosition) specPosition.textContent = data.position;
    if (specGear) specGear.textContent = data.gear;
    if (specVocal) specVocal.textContent = data.vocal;

    if (isManual && isAutoCycling) {
      resetCycleTimer();
    }
  }

  // Thumb card clicks
  thumbCards.forEach((card) => {
    card.addEventListener("click", () => {
      const key = card.getAttribute("data-member");
      setStarringMember(key, true);
    });
  });

  // Auto-Cycle Rotator
  function startCycleTimer() {
    autoCycleInterval = setInterval(() => {
      currentIndex = (currentIndex + 1) % memberKeys.length;
      setStarringMember(memberKeys[currentIndex], false);
    }, 4500);
  }

  function resetCycleTimer() {
    if (autoCycleInterval) clearInterval(autoCycleInterval);
    if (isAutoCycling) startCycleTimer();
  }

  if (cycleToggleBtn) {
    cycleToggleBtn.addEventListener("click", () => {
      isAutoCycling = !isAutoCycling;
      if (isAutoCycling) {
        cycleToggleBtn.innerHTML = '<i class="fa-solid fa-rotate"></i> <span>Auto Cycle</span>';
        cycleToggleBtn.style.color = "#ffffff";
        startCycleTimer();
      } else {
        cycleToggleBtn.innerHTML = '<i class="fa-solid fa-pause"></i> <span>Paused</span>';
        cycleToggleBtn.style.color = "#9e9ea7";
        if (autoCycleInterval) clearInterval(autoCycleInterval);
      }
    });
  }

  startCycleTimer();

  // ── 4. Transparent Hero Countdown Timer ──────────────────────
  function getNextTeaserDropTimestamp() {
    const now = new Date();
    let targetYear = now.getFullYear();
    const thisYearTarget = new Date(`${targetYear}-02-09T20:00:00+09:00`).getTime();
    if (thisYearTarget > now.getTime()) {
      return thisYearTarget;
    }
    return new Date(`${targetYear + 1}-02-09T20:00:00+09:00`).getTime();
  }

  function updateCountdown() {
    const cdDays = document.getElementById("cd-days");
    const cdHours = document.getElementById("cd-hours");
    const cdMins = document.getElementById("cd-mins");
    const cdSecs = document.getElementById("cd-secs");

    if (!cdDays) return;

    const targetDate = getNextTeaserDropTimestamp();
    const now = new Date().getTime();
    const diff = targetDate - now;

    if (diff <= 0) {
      cdDays.textContent = "00";
      cdHours.textContent = "00";
      cdMins.textContent = "00";
      cdSecs.textContent = "00";
      return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((diff % (1000 * 60)) / 1000);

    cdDays.textContent = String(days).padStart(2, "0");
    cdHours.textContent = String(hours).padStart(2, "0");
    cdMins.textContent = String(mins).padStart(2, "0");
    cdSecs.textContent = String(secs).padStart(2, "0");
  }

  setInterval(updateCountdown, 1000);
  updateCountdown();

  // ── 5. Audio Stem Simulator Toggle ───────────────────────────
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

  // ── 6. Fan Modal Handlers ────────────────────────────────────
  const fanModal = document.getElementById("sz-fan-modal");
  const modalClose = document.getElementById("sz-modal-close");
  const fanForm = document.getElementById("sz-fan-form");

  window.openFanModal = function () {
    if (fanModal) fanModal.style.display = "flex";
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
