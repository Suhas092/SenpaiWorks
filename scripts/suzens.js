// ============================================================
//  SenpaiWorks — Suzens Page Interactive Script
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
  // ── Band Member Character Data ─────────────────────────────
  const memberData = {
    suzana: {
      name: "SUZANA",
      roleBadge: "LEAD VOCALIST & BAND LEADER",
      title: '"The Electric Spark"',
      img: "assets/suzana all out.png",
      desc: "Charismatic, fierce, and possessing raw vocal power, Suzana is the heartbeat of Suzens. She crafts infectious melodies and commands the stage with explosive high notes during live holographic performances.",
      instrument: "Custom Cyber Fender Stratocaster & Vocals",
      vocal: "High Octane J-Rock & Emotional Melodic Pop",
      color: '<i class="fa-solid fa-circle" style="color: #ff2a75;"></i> Neon Crimson (#FF2A75)',
      quote: '"Our music isn\'t just sound — it\'s a pulse that connects the real and virtual dimensions!"'
    },
    tiara: {
      name: "TIARA",
      roleBadge: "LEAD GUITARIST & SYNTH ARRANGER",
      title: '"The Holographic Virtuoso"',
      img: "assets/tiara all out.png",
      desc: "A prodigy sound engineer and lead guitarist, Tiara blends fast neo-classical guitar solos with futuristic synth basslines that give Suzens their futuristic cyber-rock edge.",
      instrument: "Ibanez 7-String Custom Cyber Axe",
      vocal: "Harmonic Backing & Cyber Synth Vox",
      color: '<i class="fa-solid fa-circle" style="color: #00f0ff;"></i> Cyan Electric (#00F0FF)',
      quote: '"Every chord is calculated to resonate directly inside your soul."'
    },
    remi: {
      name: "REMI",
      roleBadge: "DRUMMER & PERCUSSIONIST",
      title: '"The Kinetic Beatmaster"',
      img: "assets/remi all out.png",
      desc: "Energetic and relentless, Remi drives the high-bpm tempo behind every Suzens track. Her live acoustic-digital hybrid drum sets deliver pounding kinetic energy to the metaverse stage.",
      instrument: "Roland Cyber-V-Drums & Percussion Rig",
      vocal: "Rhythmic Hype & Screaming Backing",
      color: '<i class="fa-solid fa-circle" style="color: #9d4edd;"></i> Neon Violet (#9D4EDD)',
      quote: '"When the beat drops, all dimensions sync to our rhythm!"'
    },
    ayana: {
      name: "AYANA",
      roleBadge: "BASSIST & VISUAL CENTER",
      title: '"The Midnight Siren"',
      img: "assets/ayana all out.png",
      desc: "Ethereal and magnetic, Ayana holds down the deep bass groove while serving as the visual centerpiece of Suzens. Her low-end basslines provide atmospheric weight to their songs.",
      instrument: "4-String Active Cyber Bass",
      vocal: "Sub-Vocal Harmony & Low Acoustic Layers",
      color: '<i class="fa-solid fa-circle" style="color: #ffaa00;"></i> Amber Gold (#FFAA00)',
      quote: '"Under the neon lights, we create memories that transcend time."'
    }
  };

  // ── Member Tab Switcher Logic ──────────────────────────────
  const tabBtns = document.querySelectorAll(".sz-tab-btn");
  const charImg = document.getElementById("sz-char-img");
  const charRoleBadge = document.getElementById("sz-char-role-badge");
  const charName = document.getElementById("sz-char-name");
  const charTitle = document.getElementById("sz-char-title");
  const charDesc = document.getElementById("sz-char-desc");
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
        if (charInstrument) charInstrument.textContent = data.instrument;
        if (charVocal) charVocal.textContent = data.vocal;
        if (charColor) charColor.innerHTML = data.color;
        if (charQuote) charQuote.textContent = data.quote;
      }, 200);
    });
  });

  // ── Concert Event Live Countdown Timer ──────────────────────
  function updateCountdown() {
    const cdDays = document.getElementById("cd-days");
    const cdHours = document.getElementById("cd-hours");
    const cdMins = document.getElementById("cd-mins");
    const cdSecs = document.getElementById("cd-secs");

    if (!cdDays) return;

    // Target event date: Aug 28, 2026
    const targetDate = new Date("2026-08-28T20:00:00+09:00").getTime();
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

  // ── Ticket Modal Handlers ────────────────────────────────────
  const modal = document.getElementById("sz-ticket-modal");
  const modalClose = document.getElementById("sz-modal-close");
  const modalVenueName = document.getElementById("sz-modal-venue-name");
  const ticketForm = document.getElementById("sz-ticket-form");

  window.openTicketModal = function (venueName) {
    if (modal) {
      if (modalVenueName) modalVenueName.textContent = venueName || "Tokyo Cyberdome";
      modal.style.display = "flex";
    }
  };

  if (modalClose) {
    modalClose.addEventListener("click", () => {
      if (modal) modal.style.display = "none";
    });
  }

  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) modal.style.display = "none";
    });
  }

  if (ticketForm) {
    ticketForm.addEventListener("submit", (e) => {
      e.preventDefault();
      alert("Ticket Reservation Confirmed! Check your email for details.");
      if (modal) modal.style.display = "none";
    });
  }
});
