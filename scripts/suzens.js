// ============================================================
//  SenpaiWorks — Suzens Virtual K-Pop Band Showcase Script
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
  // ── Virtual Member Character Dossier Data ───────────────────
  const memberData = {
    suzana: {
      name: "SUZANA",
      roleBadge: "LEADER · MAIN VOCALIST · THE ELECTRIC SPARK",
      title: '"The Radiant Center"',
      img: "assets/suzana all out.png",
      birthday: "Leader & Main Vocal ⚡",
      desc: "Charismatic, fiery, and possessing explosive vocal range, Suzana is the leader and heart of Suzens. She commands the virtual stage with unapologetic energy, crafting anthemic melodies that bridge the boundary between code and raw emotion.",
      instrument: "Custom Cyber Stratocaster & High-Octane Vocals",
      vocal: "Dynamic Belting Pop & High-Speed Cyber-Rock",
      color: '<i class="fa-solid fa-circle" style="color: #ff2a75;"></i> Neon Crimson (#FF2A75)',
      quote: '"We are breaking the boundary between virtual code and real human emotion!"'
    },
    tiara: {
      name: "TIARA",
      roleBadge: "LEAD SYNTH & GUITAR · SOUND ARCHITECT · PRODIGY",
      title: '"The Holographic Melody Maker"',
      img: "assets/tiara all out.png",
      birthday: "Lead Guitar & Synth 💎",
      desc: "A prodigy sound designer and lead guitarist in the virtual sphere, Tiara infuses high-speed neo-classical guitar riffs with neon cyber-pop textures, giving Suzens their futuristic signature sonic identity.",
      instrument: "Custom 7-String Cyber Axe & Synthesizer Keyblade",
      vocal: "Harmonic Cyber-Vox & Vocal Processing",
      color: '<i class="fa-solid fa-circle" style="color: #00f0ff;"></i> Cyan Electric (#00F0FF)',
      quote: '"Every chord is calculated to resonate directly inside your soul."'
    },
    remi: {
      name: "REMI",
      roleBadge: "BEATMASTER · DRUMS & BASS · MOOD MAKER",
      title: '"The Kinetic Rhythm Demon"',
      img: "assets/remi all out.png",
      birthday: "Beatmaster & Drums 🥁",
      desc: "Explosive, hyper, and full of chaotic charisma, Remi is the powerhouse heartbeat of Suzens. Her crushing acoustic-digital hybrid drum patterns and 808s drive the adrenaline of every beat drop.",
      instrument: "Roland Cyber-V Kinetic Drum Pads Rig",
      vocal: "Rhythmic Hype & Screaming Backing Vocals",
      color: '<i class="fa-solid fa-circle" style="color: #9d4edd;"></i> Neon Violet (#9D4EDD)',
      quote: '"When my beat drops, even virtual reality trembles!"'
    },
    ayana: {
      name: "AYANA",
      roleBadge: "VISUAL CENTER · BASSIST · SUB-VOCAL & RAP",
      title: '"The Cyber Siren"',
      img: "assets/ayana all out.png",
      birthday: "Visual Center & Bass 🌙",
      desc: "Ethereal, mysterious, and effortlessly captivating, Ayana anchors the low frequencies with deep pulsating sub-basslines while delivering sharp rap verses as the visual centerpiece of Suzens.",
      instrument: "Active 4-String Sub-Harmonic Cyber Bass",
      vocal: "Sub-Vocal Harmony & Fast Cyber Rap Delivery",
      color: '<i class="fa-solid fa-circle" style="color: #ffaa00;"></i> Amber Gold (#FFAA00)',
      quote: '"Under the neon lights, our rhythm comes alive in the shadows."'
    }
  };

  // ── Member Tab Switcher Logic ──────────────────────────────
  const tabBtns = document.querySelectorAll(".sz-tab-btn");
  const charImg = document.getElementById("sz-char-img");
  const charRoleBadge = document.getElementById("sz-char-role-badge");
  const charName = document.getElementById("sz-char-name");
  const charTitle = document.getElementById("sz-char-title");
  const charDesc = document.getElementById("sz-char-desc");
  const charBirthday = document.getElementById("sz-char-birthday");
  const charInstrument = document.getElementById("sz-char-instrument");
  const charVocal = document.getElementById("sz-char-vocal");
  const charColor = document.getElementById("sz-char-color");
  const charQuote = document.getElementById("sz-char-quote");

  tabBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const memberKey = btn.getAttribute("data-member");
      const data = memberData[memberKey];
      if (!data) return;

      // Active tab styling
      tabBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      // Smooth fade transition
      if (charImg) {
        charImg.style.opacity = "0";
        charImg.style.transform = "scale(0.95)";
      }

      setTimeout(() => {
        if (charImg) {
          charImg.src = data.img;
          charImg.alt = `${data.name} Full Character Photo`;
          charImg.style.opacity = "1";
          charImg.style.transform = "scale(1)";
        }
        if (charRoleBadge) charRoleBadge.textContent = data.roleBadge;
        if (charName) charName.textContent = data.name;
        if (charTitle) charTitle.textContent = data.title;
        if (charDesc) charDesc.textContent = data.desc;
        if (charBirthday) charBirthday.textContent = data.birthday;
        if (charInstrument) charInstrument.textContent = data.instrument;
        if (charVocal) charVocal.textContent = data.vocal;
        if (charColor) charColor.innerHTML = data.color;
        if (charQuote) charQuote.textContent = data.quote;
      }, 200);
    });
  });

  // ── Debut Teaser Countdown Timer (Targeting Next Teaser Drop) ─
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

  // ── Audio Player Play/Pause Simulator Toggle ────────────────
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

  // ── Fan Modal Handlers ──────────────────────────────────────
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
      alert("Welcome to the Suzenites Fan Club! You'll receive exclusive teaser updates and early audio drops.");
      if (fanModal) fanModal.style.display = "none";
      fanForm.reset();
    });
  }
});
