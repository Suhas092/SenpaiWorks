/* ==========================================================================
   Suzens Showcase Section - Premium Luxury Carousel Logic
   ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {
  // Members data array with character-specific luxury color palettes (set to purple for everyone)
  const members = [
    {
      name: "SUZANA",
      subtitle: "of SUZENS",
      role: "LEADER · MAIN VOCALIST",
      description: "The heart and voice of SUZENS. Suzana leads the group with grace and power, her crystalline vocals anchoring the group's sonic identity. Bold, determined, and deeply passionate about music.",
      image: "assets/suzana.png",
      color1: "#b76bff", // Purple
      color2: "#6e3eff",
      glowColor: "rgba(183, 107, 255, 0.32)",
      shadowColor: "rgba(183, 107, 255, 0.45)"
    },
    {
      name: "TIARA",
      subtitle: "of SUZENS",
      role: "MAIN RAPPER · LEAD DANCER",
      description: "Raw energy and rhythm personified. Tiara's razor-sharp delivery and explosive stage presence make her the electrifying force at the center of every SUZENS performance. Fearless and unstoppable.",
      image: "assets/Tiara.png",
      color1: "#b76bff", // Purple
      color2: "#6e3eff",
      glowColor: "rgba(183, 107, 255, 0.32)",
      shadowColor: "rgba(183, 107, 255, 0.45)"
    },
    {
      name: "REMI",
      subtitle: "of SUZENS",
      role: "MAIN DANCER · MAKNAE",
      description: "The youngest and most spirited member. Remi's dance style blends fluid contemporary movement with sharp K-pop precision. Her cheerful energy is the emotional soul of the group.",
      image: "assets/Remi.png",
      color1: "#b76bff", // Purple
      color2: "#6e3eff",
      glowColor: "rgba(183, 107, 255, 0.32)",
      shadowColor: "rgba(183, 107, 255, 0.45)"
    },
    {
      name: "AYANA",
      subtitle: "of SUZENS",
      role: "VISUAL · SUB VOCALIST",
      description: "Ethereal and magnetic. Ayana is the visual centrepiece of SUZENS — her striking presence and soft harmonic layers add depth and mystery to the group's signature sound.",
      image: "assets/Ayana.png",
      color1: "#b76bff", // Purple
      color2: "#6e3eff",
      glowColor: "rgba(183, 107, 255, 0.32)",
      shadowColor: "rgba(183, 107, 255, 0.45)"
    }
  ];

  const cards = document.querySelectorAll('.showcase-card');
  const detailsEl = document.querySelector('.showcase-details');
  const nameEl = document.getElementById('showcase-member-name');
  const roleEl = document.getElementById('showcase-member-role');
  const descEl = document.getElementById('showcase-member-desc');
  const counterEl = document.getElementById('showcase-member-counter');

  let activeIdx = 3; // Start with AYANA (index 3) as active center card
  let autoPlayTimer = null;

  // Update text values and card layout positions smoothly
  function updateShowcase(nextIdx, direction = 1) {
    activeIdx = nextIdx;
    const data = members[activeIdx];

    // Update showcase CSS variables for character-specific colors
    const sectionEl = document.querySelector('.suzens-showcase-section');
    if (sectionEl) {
      sectionEl.style.setProperty('--active-color-1', data.color1);
      sectionEl.style.setProperty('--active-color-2', data.color2);
      sectionEl.style.setProperty('--active-glow', data.glowColor);
      sectionEl.style.setProperty('--active-shadow', data.shadowColor);
    }

    // 1. Text Details Fade/Slide Transition
    if (detailsEl) {
      detailsEl.classList.add('fade-out');
    }

    setTimeout(() => {
      if (nameEl) nameEl.textContent = data.name;
      if (roleEl) roleEl.textContent = data.role;
      if (descEl) descEl.textContent = data.description;
      if (counterEl) counterEl.textContent = `0${activeIdx + 1} / 04`;

      if (detailsEl) {
        detailsEl.classList.remove('fade-out');
      }
    }, 400);

    // 2. Card 3D Carousel Transition Logic
    cards.forEach((card) => {
      const idx = parseInt(card.getAttribute('data-index'), 10);

      if (idx === activeIdx) {
        // Set Center Card
        card.className = 'showcase-card pos-center';
      } else if (idx === (activeIdx - 1 + 4) % 4) {
        // Set Left Card
        // If moving backward, ensure the card starts hidden-left so it transitions in from the left
        if (direction === -1 && card.classList.contains('pos-hidden-right')) {
          card.style.transition = 'none';
          card.className = 'showcase-card pos-hidden-left';
          card.offsetHeight; // Force reflow
          card.style.transition = '';
        }
        card.className = 'showcase-card pos-left';
      } else if (idx === (activeIdx + 1) % 4) {
        // Set Right Card
        // If moving forward, ensure the card starts hidden-right so it transitions in from the right
        if (direction === 1 && card.classList.contains('pos-hidden-left')) {
          card.style.transition = 'none';
          card.className = 'showcase-card pos-hidden-right';
          card.offsetHeight; // Force reflow
          card.style.transition = '';
        }
        card.className = 'showcase-card pos-right';
      } else if (idx === (activeIdx + 2) % 4) {
        // Set Hidden Card (left or right depending on movement direction to prevent full screen slide-across)
        if (direction === 1) {
          card.className = 'showcase-card pos-hidden-left';
        } else {
          card.className = 'showcase-card pos-hidden-right';
        }
      }
    });
  }

  // Card click event listeners
  cards.forEach((card) => {
    card.addEventListener('click', () => {
      const idx = parseInt(card.getAttribute('data-index'), 10);
      if (card.classList.contains('pos-left')) {
        updateShowcase(idx, -1);
        resetAutoPlay();
      } else if (card.classList.contains('pos-right')) {
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
    }, 4000);
  }

  function resetAutoPlay() {
    clearInterval(autoPlayTimer);
    startAutoPlay();
  }

  // Drag & Touch Swipe side scroll functionality for 3D Showcase
  const cardsWrapper = document.querySelector('.showcase-cards-wrapper');
  const showcaseContainer = document.querySelector('.suzens-showcase-section');
  const dragTarget = cardsWrapper || showcaseContainer;

  if (dragTarget) {
    let isDragging = false;
    let startX = 0;
    let currentX = 0;
    let hasMoved = false;

    function getClientX(e) {
      return e.touches && e.touches.length > 0 ? e.touches[0].clientX : e.clientX;
    }

    function handleDragStart(e) {
      if (e.target.closest('.explore-suzens-btn')) return;

      isDragging = true;
      hasMoved = false;
      startX = getClientX(e);
      currentX = startX;
      if (cardsWrapper) cardsWrapper.classList.add('is-dragging');
    }

    function handleDragMove(e) {
      if (!isDragging) return;
      currentX = getClientX(e);
      const deltaX = currentX - startX;
      if (Math.abs(deltaX) > 10) {
        hasMoved = true;
      }
    }

    function handleDragEnd() {
      if (!isDragging) return;
      if (cardsWrapper) cardsWrapper.classList.remove('is-dragging');
      const deltaX = currentX - startX;

      if (hasMoved && Math.abs(deltaX) > 40) {
        if (deltaX < 0) {
          // Dragged left -> Next member
          const nextIdx = (activeIdx + 1) % 4;
          updateShowcase(nextIdx, 1);
          resetAutoPlay();
        } else {
          // Dragged right -> Previous member
          const prevIdx = (activeIdx - 1 + 4) % 4;
          updateShowcase(prevIdx, -1);
          resetAutoPlay();
        }
      }

      isDragging = false;
      setTimeout(() => {
        hasMoved = false;
      }, 50);
    }

    if (cardsWrapper) {
      cardsWrapper.addEventListener('click', (e) => {
        if (hasMoved) {
          e.preventDefault();
          e.stopPropagation();
        }
      }, true);
    }

    dragTarget.addEventListener('mousedown', handleDragStart);
    dragTarget.addEventListener('mousemove', handleDragMove);
    dragTarget.addEventListener('mouseup', handleDragEnd);
    dragTarget.addEventListener('mouseleave', handleDragEnd);

    dragTarget.addEventListener('touchstart', handleDragStart, { passive: true });
    dragTarget.addEventListener('touchmove', handleDragMove, { passive: true });
    dragTarget.addEventListener('touchend', handleDragEnd);
    dragTarget.addEventListener('touchcancel', handleDragEnd);
  }

  // Initialize carousel on AYANA
  updateShowcase(activeIdx, 1);
  startAutoPlay();
});
