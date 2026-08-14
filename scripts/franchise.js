/* ============================================
   SENPAIWORKS GOT FRANCHISE — INTERACTIVE ENGINE
   Features: Scroll Reveals, Ambient Embers Canvas,
   3D Card Tilt, Web Audio Synth, Stat Meter Animations,
   and Royal Fealty Certificate Modal.
   ============================================ */

(function () {
  'use strict';

  // --- AUDIO SYNTHESIZER (Web Audio API) ---
  class RealmAudioSynth {
    constructor() {
      this.ctx = null;
      this.enabled = true;
    }

    init() {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) this.ctx = new AudioCtx();
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    }

    playChime() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      try {
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, now); // D5
        osc.frequency.exponentialRampToValueAtTime(1174.66, now + 0.3); // D6

        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.5);
      } catch (e) { }
    }

    playSwordShing() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      try {
        const now = this.ctx.currentTime;
        // White noise node for metallic friction
        const bufferSize = this.ctx.sampleRate * 0.25;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(2500, now);
        filter.frequency.exponentialRampToValueAtTime(7000, now + 0.2);
        filter.Q.value = 4;

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        noise.start(now);
        noise.stop(now + 0.25);
      } catch (e) { }
    }

    playRoyalTrumpet() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      try {
        const now = this.ctx.currentTime;
        const notes = [440, 554.37, 659.25, 880]; // A4, C#5, E5, A5
        notes.forEach((freq, idx) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          const startTime = now + idx * 0.12;

          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(freq, startTime);

          gain.gain.setValueAtTime(0.12, startTime);
          gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.4);

          osc.connect(gain);
          gain.connect(this.ctx.destination);

          osc.start(startTime);
          osc.stop(startTime + 0.4);
        });
      } catch (e) { }
    }
  }

  const audioSynth = new RealmAudioSynth();
  window.realmAudioSynth = audioSynth;

  // --- AMBIENT EMBER PARTICLES CANVAS ---
  function initEmberCanvas() {
    const canvas = document.getElementById('aes-ember-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    let lastScrollY = window.scrollY;
    let scrollSpeed = 0;

    window.addEventListener('resize', () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    });

    const particles = [];
    const maxParticles = Math.min(60, Math.floor(width / 25));

    for (let i = 0; i < maxParticles; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 2.2 + 0.8,
        color: Math.random() > 0.4 ? 'rgba(212, 175, 55, ' : 'rgba(239, 68, 68, ',
        alpha: Math.random() * 0.7 + 0.2,
        vx: (Math.random() - 0.5) * 0.6,
        vy: -Math.random() * 1.2 - 0.5,
        pulseSpeed: Math.random() * 0.03 + 0.01,
      });
    }

    function render() {
      ctx.clearRect(0, 0, width, height);

      const currentScrollY = window.scrollY;
      scrollSpeed = (currentScrollY - lastScrollY) * 0.15;
      lastScrollY = currentScrollY;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.y += p.vy - Math.abs(scrollSpeed * 0.4);
        p.x += p.vx + Math.sin(p.y * 0.01) * 0.4;
        p.alpha += Math.sin(Date.now() * p.pulseSpeed) * 0.005;

        if (p.alpha < 0.1) p.alpha = 0.1;
        if (p.alpha > 0.85) p.alpha = 0.85;

        if (p.y < -10 || p.x < -10 || p.x > width + 10) {
          p.y = height + 10;
          p.x = Math.random() * width;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color + p.alpha + ')';
        ctx.shadowBlur = 10;
        ctx.shadowColor = p.color.includes('212') ? '#d4af37' : '#ef4444';
        ctx.fill();
      }

      requestAnimationFrame(render);
    }

    render();
  }

  // --- SCROLL PROGRESS BAR & REVEAL OBSERVER ---
  function initScrollSystem() {
    const progressBar = document.getElementById('aes-scroll-progress');
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.aes-dock-link');

    function updateProgress() {
      const winScroll = document.documentElement.scrollTop || document.body.scrollTop;
      const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scrolled = (winScroll / height) * 100;
      if (progressBar) progressBar.style.width = scrolled + '%';

      // Update active dock link
      let currentSectionId = '';
      sections.forEach((sec) => {
        const top = sec.offsetTop - 150;
        const bottom = top + sec.offsetHeight;
        if (winScroll >= top && winScroll < bottom) {
          currentSectionId = sec.getAttribute('id');
        }
      });

      if (currentSectionId) {
        navLinks.forEach((link) => {
          link.classList.toggle('active', link.getAttribute('href') === '#' + currentSectionId);
        });
      }
    }

    window.addEventListener('scroll', updateProgress, { passive: true });
    updateProgress();

    // IntersectionObserver for elements with [data-reveal]
    const revealElements = document.querySelectorAll('[data-reveal]');
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');

            // If entry contains stat meters, trigger bar fill
            const meters = entry.target.querySelectorAll('.aes-stat-meter-fill');
            meters.forEach((meter) => {
              const targetWidth = meter.getAttribute('data-target-width') || '100%';
              meter.style.width = targetWidth;
            });

            // Trigger counter animation if element has counter
            const counters = entry.target.querySelectorAll('.aes-counter-val');
            counters.forEach((cnt) => {
              if (!cnt.dataset.started) {
                cnt.dataset.started = 'true';
                animateCounter(cnt);
              }
            });
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -50px 0px' }
    );

    revealElements.forEach((el) => revealObserver.observe(el));
  }

  function animateCounter(el) {
    const target = parseInt(el.getAttribute('data-target') || '0', 10);
    const suffix = el.getAttribute('data-suffix') || '';
    if (isNaN(target) || target === 0) return;

    let start = 0;
    const duration = 1500;
    const startTime = performance.now();

    function step(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(easeOut * target);

      el.textContent = current.toLocaleString() + suffix;
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        el.textContent = target.toLocaleString() + suffix;
      }
    }

    requestAnimationFrame(step);
  }

  // --- 3D CARD TILT & SPECULAR GLARE EFFECT ---
  function init3DTilt() {
    const tiltCards = document.querySelectorAll('.aes-house-card, .aes-ruler-full-card, .aes-champ-card');

    tiltCards.forEach((card) => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotateX = ((y - centerY) / centerY) * -8;
        const rotateY = ((x - centerX) / centerX) * 8;

        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-6px)`;

        // Dynamic specular sheen reflection
        let glare = card.querySelector('.aes-card-glare');
        if (!glare) {
          glare = document.createElement('div');
          glare.className = 'aes-card-glare';
          card.appendChild(glare);
        }
        glare.style.background = `radial-gradient(circle at ${x}px ${y}px, rgba(255,255,255,0.18) 0%, transparent 60%)`;
      });

      card.addEventListener('mouseleave', () => {
        card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px)';
        const glare = card.querySelector('.aes-card-glare');
        if (glare) glare.style.background = 'none';
      });

      card.addEventListener('mouseenter', () => {
        audioSynth.playSwordShing();
      });
    });
  }

  // --- ROYAL FEALTY OATH MODAL SYSTEM ---
  function pledgeHouseCustom(houseName, houseMotto, houseColor, houseIcon) {
    audioSynth.playRoyalTrumpet();

    // Trigger Screen Flash Particle FX
    createParticleBurst();

    let modal = document.getElementById('aes-oath-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'aes-oath-modal';
      modal.className = 'aes-modal-overlay';
      modal.innerHTML = `
        <div class="aes-modal-content">
          <button class="aes-modal-close" onclick="closeOathModal()"><i class="fa-solid fa-xmark"></i></button>
          <div class="aes-certificate">
            <div class="aes-cert-border"></div>
            <div class="aes-cert-header">
              <i class="fa-solid fa-crown aes-cert-crown"></i>
              <h2>ROYAL DECREE OF FEALTY</h2>
              <p class="aes-cert-sub">BY GRACE OF THE FIVE REALMS OF WESTEROS</p>
            </div>
            <div class="aes-cert-body">
              <div class="aes-cert-sigil-icon" id="modal-house-icon"><i class="fa-solid fa-dragon"></i></div>
              <h3 id="modal-house-title">House Suzana Targaryen</h3>
              <p class="aes-cert-motto" id="modal-house-motto">"FIRE AND BLOOD"</p>
              <div class="aes-cert-divider"></div>
              <p class="aes-cert-text">
                Be it known to all Lords, Knights, and Dragon Vanguard across the kingdom that you have sworn an unbreakable oath of fealty to the Great House. Your sword is bound to the high monarch's crown for eternity.
              </p>
              <div class="aes-cert-badge-row">
                <div class="aes-cert-badge">
                  <span>RANK</span>
                  <strong>High Champion</strong>
                </div>
                <div class="aes-cert-badge">
                  <span>REALM DECREE</span>
                  <strong>#GOT-${Math.floor(1000 + Math.random() * 9000)}</strong>
                </div>
                <div class="aes-cert-badge">
                  <span>VALYRIAN SEAL</span>
                  <strong style="color: #ffd700;">Verified <i class="fa-solid fa-circle-check"></i></strong>
                </div>
              </div>
            </div>
            <div class="aes-cert-footer">
              <button class="aes-btn aes-btn-gold" onclick="closeOathModal()">
                <i class="fa-solid fa-shield-halved"></i> CLAIM YOUR SEAL
              </button>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
    }

    const iconEl = modal.querySelector('#modal-house-icon');
    const titleEl = modal.querySelector('#modal-house-title');
    const mottoEl = modal.querySelector('#modal-house-motto');

    if (iconEl) iconEl.innerHTML = `<i class="fa-solid ${houseIcon || 'fa-shield-halved'}"></i>`;
    if (titleEl) {
      titleEl.textContent = houseName;
      titleEl.style.color = houseColor || '#ffd700';
    }
    if (mottoEl) mottoEl.textContent = `"${houseMotto}"`;

    setTimeout(() => modal.classList.add('active'), 50);
  }

  window.pledgeHouseCustom = pledgeHouseCustom;

  window.closeOathModal = function () {
    const modal = document.getElementById('aes-oath-modal');
    if (modal) modal.classList.remove('active');
  };

  function createParticleBurst() {
    const container = document.createElement('div');
    container.className = 'aes-particle-burst-layer';
    document.body.appendChild(container);

    const colors = ['#ffd700', '#d4af37', '#ef4444', '#3b82f6', '#10b981'];

    for (let i = 0; i < 40; i++) {
      const p = document.createElement('div');
      p.className = 'aes-burst-particle';
      const color = colors[Math.floor(Math.random() * colors.length)];
      const size = Math.random() * 8 + 4;

      p.style.width = `${size}px`;
      p.style.height = `${size}px`;
      p.style.background = color;
      p.style.left = '50vw';
      p.style.top = '50vh';

      const angle = Math.random() * Math.PI * 2;
      const velocity = Math.random() * 350 + 100;
      const tx = Math.cos(angle) * velocity;
      const ty = Math.sin(angle) * velocity;

      p.style.transform = `translate(0, 0) scale(1)`;

      container.appendChild(p);

      requestAnimationFrame(() => {
        p.style.transition = 'transform 0.8s cubic-bezier(0.1, 0.8, 0.2, 1), opacity 0.8s ease';
        p.style.transform = `translate(${tx}px, ${ty}px) scale(0)`;
        p.style.opacity = '0';
      });
    }

    setTimeout(() => {
      container.remove();
    }, 900);
  }

  // --- AUDIO TOGGLE BUTTON LOGIC ---
  function initAudioToggle() {
    const toggleBtn = document.getElementById('aes-sound-toggle');
    if (!toggleBtn) return;

    toggleBtn.addEventListener('click', () => {
      audioSynth.enabled = !audioSynth.enabled;
      if (audioSynth.enabled) {
        audioSynth.init();
        audioSynth.playChime();
        toggleBtn.classList.add('sound-on');
        toggleBtn.classList.remove('sound-off');
        toggleBtn.setAttribute('title', 'Audio FX: ON');
        toggleBtn.innerHTML = '<i class="fa-solid fa-volume-high"></i>';
      } else {
        toggleBtn.classList.add('sound-off');
        toggleBtn.classList.remove('sound-on');
        toggleBtn.setAttribute('title', 'Audio FX: OFF');
        toggleBtn.innerHTML = '<i class="fa-solid fa-volume-xmark"></i>';
      }
    });
  }

  // --- HERO VIDEO AUTOPLAY HELPER ---
  function initHeroVideo() {
    const video = document.querySelector('.aes-hero-video');
    if (video) {
      const promise = video.play();
      if (promise !== undefined) {
        promise.catch(() => {
          const playVideo = () => {
            video.play();
            window.removeEventListener('click', playVideo);
            window.removeEventListener('touchstart', playVideo);
            window.removeEventListener('scroll', playVideo);
          };
          window.addEventListener('click', playVideo, { once: true });
          window.addEventListener('touchstart', playVideo, { once: true });
          window.addEventListener('scroll', playVideo, { once: true });
        });
      }
    }
  }

  // DOM CONTENT LOADED INITIALIZATION
  document.addEventListener('DOMContentLoaded', () => {
    initHeroVideo();
    initEmberCanvas();
    initScrollSystem();
    init3DTilt();
    initAudioToggle();
  });
})();
