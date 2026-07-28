document.addEventListener('DOMContentLoaded', function () {
  const section = document.querySelector('.sh-section');
  if (!section) return;

  const slides = Array.from(section.querySelectorAll('.sh-slide'));
  const dots = Array.from(section.querySelectorAll('.sh-dot'));
  const prevBtn = section.querySelector('.sh-arrow-left');
  const nextBtn = section.querySelector('.sh-arrow-right');

  let currentIdx = 0;
  let timer = null;
  const slideInterval = 5000; // Change slides every 5 seconds

  function showSlide(index) {
    // Reset timer
    stopAutoPlay();

    // Clamp index
    if (index >= slides.length) index = 0;
    if (index < 0) index = slides.length - 1;

    // Toggle active classes on slides
    slides.forEach((slide, i) => {
      if (i === index) {
        slide.classList.add('active');
      } else {
        slide.classList.remove('active');
      }
    });

    // Toggle active classes on dots
    dots.forEach((dot, i) => {
      if (i === index) {
        dot.classList.add('active');
      } else {
        dot.classList.remove('active');
      }
    });

    currentIdx = index;
    startAutoPlay();
  }

  function nextSlide() {
    showSlide(currentIdx + 1);
  }

  function prevSlide() {
    showSlide(currentIdx - 1);
  }

  function startAutoPlay() {
    timer = setInterval(nextSlide, slideInterval);
  }

  function stopAutoPlay() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }

  // Bind clicks
  if (prevBtn) prevBtn.addEventListener('click', prevSlide);
  if (nextBtn) nextBtn.addEventListener('click', nextSlide);

  dots.forEach(dot => {
    dot.addEventListener('click', () => {
      const targetIdx = parseInt(dot.getAttribute('data-slide'), 10);
      showSlide(targetIdx);
    });
  });

  // Hover parallax background shift effect for active slide's background
  let rafId = null;
  let mouseX = 0, mouseY = 0;

  function onMove(e) {
    const rect = section.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    mouseX = (x - 0.5) * 2;
    mouseY = (y - 0.5) * 2;
    if (!rafId) rafId = requestAnimationFrame(updateParallax);
  }

  function updateParallax() {
    rafId = null;
    const activeBg = section.querySelector('.sh-slide.active .sh-slide-bg');
    if (activeBg && window.innerWidth > 900) {
      const shiftX = mouseX * -15;
      const shiftY = mouseY * -10;
      // Offset translation to add onto slider position
      activeBg.style.transform = `translate3d(calc(${shiftX}px), ${shiftY}px, 0)`;
    }
  }

  const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  if (!isTouch) {
    section.addEventListener('mousemove', onMove);
    section.addEventListener('mouseleave', () => {
      mouseX = 0; mouseY = 0;
      if (!rafId) rafId = requestAnimationFrame(updateParallax);
    });
  }

  // Start autoplay initially
  startAutoPlay();
});
