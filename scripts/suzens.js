// ============================================================
//  SenpaiWorks — Suzens Virtual Idol Band Interactive Script
//  High-Octane Dynamic K-Pop Visual Showcase & Stage Loops
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
  // ── 1. Hero & Concert Video Controllers ──────────────────────
  const heroVideo = document.getElementById("sz-hero-bg-video");
  const concertVideo = document.getElementById("sz-concert-video");
  const audioToggleBtn = document.getElementById("sz-audio-toggle");
  const audioIcon = document.getElementById("sz-audio-icon");
  const audioText = document.getElementById("sz-audio-text");

  // Ensure hero video plays continuously
  if (heroVideo) {
    heroVideo.play().catch(() => {
      // Autoplay fallback with user interaction
      document.body.addEventListener("click", () => heroVideo.play(), { once: true });
    });
  }

  // Concert Video: Start at 10 seconds and loop seamlessly between 10s and 23s
  if (concertVideo) {
    const LOOP_START_SEC = 10.0;
    const LOOP_END_SEC = 22.8;

    const initConcertVideo = () => {
      try {
        concertVideo.currentTime = LOOP_START_SEC;
        concertVideo.play().catch(() => {});
      } catch (e) {}
    };

    concertVideo.addEventListener("loadedmetadata", initConcertVideo);
    initConcertVideo();

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

    // Audio Toggle for Concert Arena Sound
    if (audioToggleBtn) {
      audioToggleBtn.addEventListener("click", () => {
        concertVideo.muted = !concertVideo.muted;
        if (concertVideo.muted) {
          audioIcon.className = "fa-solid fa-volume-xmark";
          audioText.textContent = "Unmute Crowd Audio";
        } else {
          audioIcon.className = "fa-solid fa-volume-high";
          audioText.textContent = "Mute Stage Audio";
          concertVideo.play().catch(() => {});
        }
      });
    }
  }

  // ── 2. Member Character Dossiers & Stage Data ────────────────
  const memberData = {
    suzana: {
      name: "SUZANA",
      num: "01",
      roleBadge: "LEADER · MAIN VOCALIST · THE ELECTRIC SPARK",
      title: '"The Radiant Center"',
      img: "assets/suzana all out.png",
      desc: "Charismatic, fierce, and possessing an explosive vocal range. Suzana commands the virtual stage with unapologetic energy, crafting anthemic melodies that connect code to raw human emotion.",
      gear: "Custom Cyber Stratocaster",
      gearIcon: "fa-guitar",
      color: "#ff2a75",
      vocalPercent: "98%",
      syncPercent: "95%",
      powerPercent: "96%"
    },
    tiara: {
      name: "TIARA",
      num: "02",
      roleBadge: "LEAD SYNTH & GUITAR · SOUND ARCHITECT · PRODIGY",
      title: '"The Holographic Melody Maker"',
      img: "assets/tiara all out.png",
      desc: "A prodigy sound designer in the virtual sphere, Tiara infuses high-speed neo-classical guitar riffs with neon cyber-pop textures, defining Suzens' futuristic signature sonic core.",
      gear: "7-String Cyber Axe & Keyblade Synth",
      gearIcon: "fa-bolt",
      color: "#00f0ff",
      vocalPercent: "88%",
      syncPercent: "99%",
      powerPercent: "94%"
    },
    remi: {
      name: "REMI",
      num: "03",
      roleBadge: "BEATMASTER · DRUMS & BASS · MOOD MAKER",
      title: '"The Kinetic Rhythm Demon"',
      img: "assets/remi all out.png",
      desc: "Explosive, hyper, and full of chaotic charisma, Remi is the powerhouse heartbeat of Suzens. Her crushing acoustic-digital drum patterns and 808s drive the adrenaline of every live drop.",
      gear: "Cyber-V Kinetic Drum Pads Rig",
      gearIcon: "fa-drum",
      color: "#9d4edd",
      vocalPercent: "84%",
      syncPercent: "92%",
      powerPercent: "99%"
    },
    ayana: {
      name: "AYANA",
      num: "04",
      roleBadge: "VISUAL CENTER · BASSIST · SUB-VOCAL & RAP",
      title: '"The Cyber Siren"',
      img: "assets/ayana all out.png",
      desc: "Ethereal, mysterious, and effortlessly magnetic, Ayana anchors the low frequencies with deep pulsating sub-basslines while delivering sharp rap verses as the visual centerpiece.",
      gear: "Sub-Harmonic 4-String Bass",
      gearIcon: "fa-moon",
      color: "#ffaa00",
      vocalPercent: "91%",
      syncPercent: "97%",
      powerPercent: "90%"
    }
  };

  const memberKeys = ["suzana", "tiara", "remi", "ayana"];
  let currentMemberIdx = 0;
  let autoCycleInterval = null;
  let isAutoCycling = true;

  // DOM Elements for Spotlight Stage
  const spotlightContainer = document.getElementById("sz-stage-spotlight");
  const spotlightImg = document.getElementById("sz-spotlight-img");
  const spotlightBadge = document.getElementById("sz-spotlight-badge");
  const spotlightName = document.getElementById("sz-spotlight-name");
  const spotlightTitle = document.getElementById("sz-spotlight-title");
  const spotlightDesc = document.getElementById("sz-spotlight-desc");
  const spotlightGear = document.getElementById("sz-gear-text");
  const spotlightGearIcon = document.querySelector("#sz-gear-pill i");
  const gaugeVocal = document.getElementById("gauge-vocal");
  const fillVocal = document.getElementById("fill-vocal");
  const gaugeSync = document.getElementById("gauge-sync");
  const fillSync = document.getElementById("fill-sync");
  const gaugePower = document.getElementById("gauge-power");
  const fillPower = document.getElementById("fill-power");
  const pods = document.querySelectorAll(".sz-member-pod");
  const autoToggle = document.getElementById("sz-autoplay-toggle");

  function switchMember(key, isManual = false) {
    const data = memberData[key];
    if (!data) return;

    currentMemberIdx = memberKeys.indexOf(key);

    // Active class on pods
    pods.forEach((p) => {
      if (p.getAttribute("data-member") === key) {
        p.classList.add("active");
      } else {
        p.classList.remove("active");
      }
    });

    // Spotlight image animation
    if (spotlightImg) {
      spotlightImg.style.opacity = "0";
      spotlightImg.style.transform = "scale(0.92) translateY(10px)";

      setTimeout(() => {
        spotlightImg.src = data.img;
        spotlightImg.alt = `${data.name} 3D Virtual Idol`;
        spotlightImg.style.opacity = "1";
        spotlightImg.style.transform = "scale(1) translateY(0)";
      }, 200);
    }

    // Update text and gauges
    if (spotlightBadge) {
      spotlightBadge.textContent = data.roleBadge;
      spotlightBadge.style.color = data.color;
      spotlightBadge.style.borderColor = data.color;
    }
    if (spotlightName) spotlightName.textContent = data.name;
    if (spotlightTitle) {
      spotlightTitle.textContent = data.title;
      spotlightTitle.style.color = data.color;
    }
    if (spotlightDesc) spotlightDesc.textContent = data.desc;
    if (spotlightGear) spotlightGear.textContent = data.gear;
    if (spotlightGearIcon) spotlightGearIcon.className = `fa-solid ${data.gearIcon}`;

    // Update Gauges
    if (gaugeVocal && fillVocal) {
      gaugeVocal.textContent = data.vocalPercent;
      fillVocal.style.width = data.vocalPercent;
    }
    if (gaugeSync && fillSync) {
      gaugeSync.textContent = data.syncPercent;
      fillSync.style.width = data.syncPercent;
    }
    if (gaugePower && fillPower) {
      gaugePower.textContent = data.powerPercent;
      fillPower.style.width = data.powerPercent;
    }

    // Dynamic accent glow around spotlight
    if (spotlightContainer) {
      spotlightContainer.style.boxShadow = `0 24px 60px rgba(0,0,0,0.5), 0 0 40px ${data.color}25`;
    }

    // If clicked manually, pause cycle briefly
    if (isManual && isAutoCycling) {
      resetAutoCycle();
    }
  }

  // Pod click listener
  pods.forEach((pod) => {
    pod.addEventListener("click", () => {
      const key = pod.getAttribute("data-member");
      switchMember(key, true);
    });
  });

  // Auto-Cycle Rotator Logic
  function startAutoCycle() {
    autoCycleInterval = setInterval(() => {
      currentMemberIdx = (currentMemberIdx + 1) % memberKeys.length;
      switchMember(memberKeys[currentMemberIdx], false);
    }, 4500);
  }

  function resetAutoCycle() {
    if (autoCycleInterval) clearInterval(autoCycleInterval);
    if (isAutoCycling) startAutoCycle();
  }

  if (autoToggle) {
    autoToggle.addEventListener("click", () => {
      isAutoCycling = !isAutoCycling;
      if (isAutoCycling) {
        autoToggle.innerHTML = '<i class="fa-solid fa-play"></i> Auto Cycle';
        autoToggle.style.color = "#00f0ff";
        startAutoCycle();
      } else {
        autoToggle.innerHTML = '<i class="fa-solid fa-pause"></i> Paused';
        autoToggle.style.color = "#9898ad";
        if (autoCycleInterval) clearInterval(autoCycleInterval);
      }
    });
  }

  // Start initial cycle
  startAutoCycle();

  // Interactive 3D Perspective Tilt on Mouse Movement for Spotlight Card
  if (spotlightContainer && window.innerWidth > 992) {
    spotlightContainer.addEventListener("mousemove", (e) => {
      const rect = spotlightContainer.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      const tiltX = (y / rect.height) * -8;
      const tiltY = (x / rect.width) * 8;
      spotlightContainer.style.transform = `perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`;
    });

    spotlightContainer.addEventListener("mouseleave", () => {
      spotlightContainer.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg)";
    });
  }

  // ── 3. Debut Teaser Countdown Timer ──────────────────────────
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

  // ── 4. Audio Stem Player Simulator ───────────────────────────
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

  // ── 5. Fan Pass Modal Handlers ───────────────────────────────
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
