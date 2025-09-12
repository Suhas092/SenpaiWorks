function scrollDigitalArt(direction) {
  const container = document.getElementById('digital-art-scroll');
  const card = container.querySelector('.trending-item');
  if (!card) return;
  const scrollAmount = card.offsetWidth + parseInt(getComputedStyle(container).gap || 0);
  container.scrollBy({ left: direction * scrollAmount, behavior: 'smooth' });
}

function scrollInsaneArt(direction) {
  const container = document.getElementById('insane-scroll');
  const card = container.querySelector('.trending-item');
  if (!card) return;
  const scrollAmount = card.offsetWidth + parseInt(getComputedStyle(container).gap || 0);
  container.scrollBy({ left: direction * scrollAmount, behavior: 'smooth' });
}

function scrollPortraits(direction) {
  const container = document.getElementById('portrait-scroll');
  const card = container.querySelector('.trending-item');
  if (!card) return;
  const scrollAmount = card.offsetWidth + parseInt(getComputedStyle(container).gap || 0);
  container.scrollBy({ left: direction * scrollAmount, behavior: 'smooth' });
}

function scrollcharcoal(direction) {
  const container = document.getElementById('charcoal-scroll');
  const card = container.querySelector('.trending-item');
  if (!card) return;
  const scrollAmount = card.offsetWidth + parseInt(getComputedStyle(container).gap || 0);
  container.scrollBy({ left: direction * scrollAmount, behavior: 'smooth' });
}

function scrollLogos(direction) {
  const container = document.getElementById('logo-scroll');
  const card = container.querySelector('.trending-item');
  if (!card) return;
  const scrollAmount = card.offsetWidth + parseInt(getComputedStyle(container).gap || 0);
  container.scrollBy({ left: direction * scrollAmount, behavior: 'smooth' });
}









document.addEventListener('DOMContentLoaded', function() {
  const slides = document.querySelectorAll('.slide');
  const slideWrapper = document.querySelector('.slide-wrapper');
  const scrollButtons = document.querySelectorAll('.scroll-btn');
  let currentIndex = 0;
  let slideInterval;
  
  // Initialize first slide
  slides[currentIndex].classList.add('active');
  
  // Auto-advance every 5 seconds (keep this)
  function startSlideShow() {
    slideInterval = setInterval(() => {
      goToSlide((currentIndex + 1) % slides.length, true); // true = auto transition
    }, 5000);
  }
  
  // Transition handler
  function goToSlide(index, isAutoTransition = false) {
    // Only animate for auto transitions
    const transitionTime = isAutoTransition ? '0.5s' : '0s';
    
    // Apply instant transition for manual clicks
    document.documentElement.style.setProperty('--transition-time', transitionTime);
    
    slides[currentIndex].classList.remove('active');
    currentIndex = index;
    slides[currentIndex].classList.add('active');
    
    // Scroll behavior
    slideWrapper.scrollTo({
      left: currentIndex * slideWrapper.clientWidth,
      behavior: isAutoTransition ? 'smooth' : 'auto'
    });
    
    // Reset timer on manual click
    if (!isAutoTransition) {
      clearInterval(slideInterval);
      startSlideShow();
    }
  }
  
  // Button controls
  scrollButtons.forEach(button => {
    button.addEventListener('click', () => {
      const direction = button.classList.contains('left') ? -1 : 1;
      goToSlide((currentIndex + direction + slides.length) % slides.length);
    });
  });
  
  // Start the slideshow
  startSlideShow();
});



// Util: fallback for missing data
function safe(val) {
  return val ? val : "N/A";
}

const modal = document.getElementById('image-modal');
const modalImg = document.getElementById('modal-img');
const modalCharName = document.getElementById('modal-charname');
const modalName = document.getElementById('modal-name'); // Franchise / Source
const modalSex = document.getElementById('modal-sex');
const modalArtStyle = document.getElementById('modal-artstyle');
const modalSoftware = document.getElementById('modal-software');
const modalSource = document.getElementById('modal-source');
const modalClose = document.getElementById('modal-close');
const modalPrev = document.getElementById('modal-prev');
const modalNext = document.getElementById('modal-next');

let currentGallery = [];
let currentIndex = 0;

// Find all .trending-item img in all scrollers
const allImages = Array.from(document.querySelectorAll('.trending-item img'));

// Store original references for navigation
let modalImageList = [];

allImages.forEach((img, idx) => {
  img.addEventListener('click', (e) => {
    const parentContainer = img.closest('.trending-scroll-container');
    modalImageList = Array.from(parentContainer.querySelectorAll('.trending-item img'));
    currentIndex = modalImageList.indexOf(img);
    openModalWithImage(modalImageList[currentIndex]);
  });
});

function openModalWithImage(img) {
  modal.classList.add('active');
  modalImg.src = img.src;
  modalImg.alt = img.alt;

  const parent = img.closest('.trending-item');

  modalCharName.textContent = safe(parent.dataset.charname);
  modalName.textContent = safe(parent.dataset.source);  // Franchise / Source
  modalSex.textContent = safe(parent.dataset.sex);
  modalArtStyle.textContent = safe(parent.dataset.artstyle);
  modalSoftware.textContent = safe(parent.dataset.software);
  modalSource.textContent = safe(parent.dataset.description);
}

function showModalImageAt(idx) {
  if (modalImageList.length === 0) return;
  if (idx < 0) idx = modalImageList.length - 1;
  if (idx >= modalImageList.length) idx = 0;
  currentIndex = idx;
  openModalWithImage(modalImageList[currentIndex]);
}

// Navigation and closing
modalPrev.addEventListener('click', () => showModalImageAt(currentIndex - 1));
modalNext.addEventListener('click', () => showModalImageAt(currentIndex + 1));
modalClose.addEventListener('click', () => modal.classList.remove('active'));
modal.addEventListener('click', e => {
  if (e.target === modal) modal.classList.remove('active');
});
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape' && modal.classList.contains('active')) {
    modal.classList.remove('active');
  }
});





