function scrollDigitalArt(direction: number): void {
  const container = document.getElementById('digital-art-scroll');
  if (!container) return;
  const card = container.querySelector('.trending-item') as HTMLElement | null;
  if (!card) return;
  const scrollAmount = card.offsetWidth + parseInt(getComputedStyle(container).gap || '0');
  container.scrollBy({ left: direction * scrollAmount, behavior: 'smooth' });
}

function scrollInsaneArt(direction: number): void {
  const container = document.getElementById('insane-scroll');
  if (!container) return;
  const card = container.querySelector('.trending-item') as HTMLElement | null;
  if (!card) return;
  const scrollAmount = card.offsetWidth + parseInt(getComputedStyle(container).gap || '0');
  container.scrollBy({ left: direction * scrollAmount, behavior: 'smooth' });
}

function scrollPortraits(direction: number): void {
  const container = document.getElementById('portrait-scroll');
  if (!container) return;
  const card = container.querySelector('.trending-item') as HTMLElement | null;
  if (!card) return;
  const scrollAmount = card.offsetWidth + parseInt(getComputedStyle(container).gap || '0');
  container.scrollBy({ left: direction * scrollAmount, behavior: 'smooth' });
}

function scrollcharcoal(direction: number): void {
  const container = document.getElementById('charcoal-scroll');
  if (!container) return;
  const card = container.querySelector('.trending-item') as HTMLElement | null;
  if (!card) return;
  const scrollAmount = card.offsetWidth + parseInt(getComputedStyle(container).gap || '0');
  container.scrollBy({ left: direction * scrollAmount, behavior: 'smooth' });
}

function scrollLogos(direction: number): void {
  const container = document.getElementById('logo-scroll');
  if (!container) return;
  const card = container.querySelector('.trending-item') as HTMLElement | null;
  if (!card) return;
  const scrollAmount = card.offsetWidth + parseInt(getComputedStyle(container).gap || '0');
  container.scrollBy({ left: direction * scrollAmount, behavior: 'smooth' });
}

function formatCompactNumber(num: number | string): string {
  const n = typeof num === 'number' ? num : parseInt(num, 10);
  if (isNaN(n) || n <= 0) return '0';
  if (n >= 1000000) {
    const val = n / 1000000;
    return (val % 1 === 0 ? val.toFixed(0) : val.toFixed(1)) + 'M';
  }
  if (n >= 1000) {
    const val = n / 1000;
    return (val % 1 === 0 ? val.toFixed(0) : val.toFixed(1)) + 'k';
  }
  return n.toString();
}

document.addEventListener('DOMContentLoaded', function() {
  try {
    const slides = document.querySelectorAll('.slide');
    const slideWrapper = document.querySelector('.slide-wrapper');
    const scrollButtons = document.querySelectorAll('.scroll-btn');
    let currentIndex = 0;
    let slideInterval: number;
    
    if (slides.length === 0 || !slideWrapper) return;
    
    // Initialize first slide
    slides[currentIndex].classList.add('active');
    
    // Auto-advance every 5 seconds (keep this)
    function startSlideShow() {
      slideInterval = window.setInterval(() => {
        goToSlide((currentIndex + 1) % slides.length, true); // true = auto transition
      }, 5000);
    }
    
    // Transition handler
    function goToSlide(index: number, isAutoTransition = false) {
      const transitionTime = isAutoTransition ? '0.5s' : '0s';
      
      // Apply instant transition for manual clicks
      document.documentElement.style.setProperty('--transition-time', transitionTime);
      
      slides[currentIndex].classList.remove('active');
      currentIndex = index;
      slides[currentIndex].classList.add('active');
      
      // Scroll behavior
      if (slideWrapper) {
        slideWrapper.scrollTo({
          left: currentIndex * slideWrapper.clientWidth,
          behavior: isAutoTransition ? 'smooth' : 'auto'
        });
      }
      
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
  } catch (err) {
    console.warn("Slideshow initialization skipped or failed:", err);
  }
});

// ============================================================
//  3-Column Pinterest Layout â€“ Gallery Interactions
// ============================================================

// Util: fallback for missing data
function safe(val: string | undefined | null): string {
  return val ? val : "N/A";
}
const pinPageLayout = document.getElementById('pin-page-layout');
const detailImg     = document.getElementById('detail-main-img') as HTMLImageElement | null;
const detailCharName  = document.getElementById('detail-charname');
const detailDescription = document.getElementById('detail-description');

let currentIndex2D = 0;
let modalImageList: HTMLImageElement[] = [];
let originalPinterestItems: HTMLElement[] = [];
let activeArtworkId = "";
let activeCardEl: HTMLElement | null = null; // the currently selected .pinterest-item

// ── Absolute Positioning Masonry Layout ──────────────────────
function layoutMasonry() {
  const grid = document.getElementById("pinterest-grid");
  const layout = document.getElementById("pin-page-layout");

  if (!grid || !layout) return;

  const isMobile = window.innerWidth <= 768;

  if (isMobile) {
    const items = grid.querySelectorAll<HTMLElement>(".pinterest-item");
    items.forEach(item => {
      item.style.position = "";
      item.style.width = "";
      item.style.left = "";
      item.style.top = "";
    });
    grid.style.height = "";
    return;
  }

  const containerWidth = grid.clientWidth;
  if (!containerWidth) return;

  const gap = 20;
  const targetColWidth = 280;
  const numCols = Math.max(2, Math.floor((containerWidth + gap) / (targetColWidth + gap)));
  const colWidth = Math.floor((containerWidth - (numCols - 1) * gap) / numCols);

  const colHeights: number[] = new Array(numCols).fill(0);
  const items = Array.from(grid.querySelectorAll<HTMLElement>(".pinterest-item"));

  items.forEach(item => {
    if (item.style.display === "none") return;

    let minCol = 0;
    let minHeight = colHeights[0];
    for (let i = 1; i < numCols; i++) {
      if (colHeights[i] < minHeight) {
        minHeight = colHeights[i];
        minCol = i;
      }
    }

    item.style.position = "absolute";
    item.style.width = `${colWidth}px`;
    item.style.left = `${minCol * (colWidth + gap)}px`;
    item.style.top = `${minHeight}px`;

    const itemHeight = item.offsetHeight || 300;
    colHeights[minCol] += itemHeight + gap;
  });

  const maxHeight = Math.max(...colHeights);
  grid.style.height = `${maxHeight}px`;
}

async function fetchAndRenderDatabaseArtworks(grid: HTMLElement): Promise<void> {
  try {
    const res = await fetch("http://localhost:5000/api/artworks");
    if (!res.ok) throw new Error("Failed to fetch artworks");
    const artworks = await res.json();
    
    artworks.forEach((art: any) => {
      const item = document.createElement("div");
      item.className = "pinterest-item";
      item.setAttribute("data-category", art.category);
      item.setAttribute("data-charname", art.charname);
      item.setAttribute("data-source", art.source);
      item.setAttribute("data-sex", art.sex || "Female");
      item.setAttribute("data-artstyle", art.artstyle || "Digital Art");
      item.setAttribute("data-software", art.software || "Photoshop");
      item.setAttribute("data-description", art.description || "");

      item.innerHTML = `
        <img src="${escapeHTML2D(art.img)}" alt="${escapeHTML2D(art.charname)}" />
        <div class="pinterest-info">
          <p class="pinterest-title">${escapeHTML2D(art.charname)}</p>
          <p class="pinterest-category">${escapeHTML2D(art.category.replace("-", " ").replace(/\b\w/g, c => c.toUpperCase()))}</p>
        </div>
      `;
      grid.insertBefore(item, grid.firstChild);
    });
  } catch (err) {
    console.warn("Backend API unavailable, displaying static artworks only:", err);
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  const grid = document.getElementById("pinterest-grid");
  if (grid) {
    await fetchAndRenderDatabaseArtworks(grid);
    originalPinterestItems = Array.from(grid.querySelectorAll<HTMLElement>(".pinterest-item"));
  }

  // Build the modal image list from items in document order
  modalImageList = originalPinterestItems.map(item => item.querySelector('img') as HTMLImageElement);

  // Attach click listeners to every card
  originalPinterestItems.forEach((item) => {
    item.addEventListener('click', () => {
      const img = item.querySelector('img') as HTMLImageElement | null;
      if (!img) return;

      currentIndex2D = modalImageList.indexOf(img);
      
      const wrapper = document.getElementById("pin-detail-card-wrapper");
      const overlay = document.getElementById("page-refresh-overlay");
      if (overlay) {
        overlay.classList.add("active");
        setTimeout(() => {
          openDetailCard(img, item);
          if (wrapper) {
            wrapper.scrollIntoView({ behavior: "auto", block: "start" });
          } else {
            window.scrollTo({ top: 0, behavior: "auto" });
          }
          setTimeout(() => {
            overlay.classList.remove("active");
          }, 150);
        }, 300);
      } else {
        openDetailCard(img, item);
        if (wrapper) {
          wrapper.scrollIntoView({ behavior: "smooth", block: "start" });
        } else {
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      }
    });
  });

  initDetailCardListeners();

  // Close details panel listener
  const closeBtn = document.getElementById("detail-close-btn");
  if (closeBtn && pinPageLayout) {
    closeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      pinPageLayout.classList.remove("detail-open");
      if (activeCardEl) {
        activeCardEl.classList.remove("is-active");
        activeCardEl = null;
      }
      layoutMasonry();
    });
  }

  // Category filter buttons
  const filterBtns = document.querySelectorAll<HTMLButtonElement>('.filter-btn');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const filter = btn.dataset.filter || 'all';
      originalPinterestItems.forEach(item => {
        const match = filter === 'all' || item.dataset.category === filter;
        (item as HTMLElement).style.display = match ? '' : 'none';
      });
      // Recalculate layout after filtering
      layoutMasonry();
    });
  });

  // Calculate layout on resize, load, and for every image loading
  window.addEventListener('resize', () => layoutMasonry());
  window.addEventListener('load', () => layoutMasonry());

  if (grid) {
    const imgs = grid.querySelectorAll('img');
    imgs.forEach(img => {
      img.addEventListener('load', () => layoutMasonry());
    });
  }

  // Initial call
  setTimeout(() => layoutMasonry(), 100);
});

// ── HTML escape helper ──────────────────────────────────────
function escapeHTML2D(str: string): string {
  return str.replace(/[&<>'"]/g,
    tag => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[tag] || tag)
  );
}

// ── Seed Helpers for Offline Mock Data ──────────────────────
function getBaseLikesCount(artworkId: string): number {
  let hash = 0;
  for (let i = 0; i < artworkId.length; i++) {
    hash = artworkId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash % 15) + 3; // base likes between 3 and 17
}

function getInitialComments(artworkId: string): any[] {
  const charname = artworkId.replace("2d_", "").replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
  if (artworkId.includes("kaori")) {
    return [
      { username: "AnimeFan", text: "Her expression is so emotional! Truly captures the spirit of the show.", createdAt: new Date(Date.now() - 3600000 * 2).toISOString() },
      { username: "MusicLover", text: "Beautiful violin details, love this art style!", createdAt: new Date(Date.now() - 3600000 * 24).toISOString() }
    ];
  }
  if (artworkId.includes("zoro")) {
    return [
      { username: "Swordsman", text: "Three-sword style is legendary. Awesome hatching on the swords!", createdAt: new Date(Date.now() - 3600000 * 5).toISOString() }
    ];
  }
  if (artworkId.includes("miku")) {
    return [
      { username: "NakanoFan", text: "Best girl Miku! The headphones and shading are perfect.", createdAt: new Date(Date.now() - 3600000 * 8).toISOString() }
    ];
  }
  return [
    { username: "Guest", text: `Stunning artwork of ${charname}! Very clean lines.`, createdAt: new Date(Date.now() - 3600000 * 12).toISOString() }
  ];
}

// ── Open artwork detail (main function) ────────────────────
function openDetailCard(img: HTMLImageElement, cardEl?: HTMLElement) {
  // 1. Show the sticky columns
  if (pinPageLayout) {
    pinPageLayout.classList.add('detail-open');
  }

  // Trigger card refresh animation
  const detailPanel = document.getElementById("detail-card-panel");
  if (detailPanel) {
    detailPanel.classList.remove("refreshing");
    void detailPanel.offsetWidth; // force reflow
    detailPanel.classList.add("refreshing");
  }

  // 2. Fade-swap the artwork image
  if (detailImg) {
    if (detailImg.src && detailImg.src !== img.src) {
      detailImg.classList.add('changing');
      setTimeout(() => {
        detailImg.src = img.src;
        detailImg.alt = img.alt;
        detailImg.classList.remove('changing');
      }, 150);
    } else {
      detailImg.src = img.src;
      detailImg.alt = img.alt;
    }
  }

  // 3. Populate details
  const parent = cardEl || (img.closest('.pinterest-item') as HTMLElement | null);
  if (!parent) return;

  const charName = parent.getAttribute("data-charname") || "";
  const source = parent.getAttribute("data-source") || "";
  const sex = parent.getAttribute("data-sex") || "";
  const artstyle = parent.getAttribute("data-artstyle") || "";
  const software = parent.getAttribute("data-software") || "";
  const description = parent.getAttribute("data-description") || "";

  if (detailCharName) detailCharName.textContent = safe(charName);
  if (detailDescription) detailDescription.textContent = safe(description);

  const likeText = document.getElementById("detail-like-text");
  if (likeText) {
    likeText.textContent = charName ? `Like ${charName}` : "Like";
  }

  const badgesContainer = document.getElementById("detail-badges-container");
  if (badgesContainer) {
    badgesContainer.innerHTML = `
      <div class="metadata-badge">Franchise: <span>${safe(source)}</span></div>
      <div class="metadata-badge">Gender: <span>${safe(sex)}</span></div>
      <div class="metadata-badge">Style: <span>${safe(artstyle)}</span></div>
      <div class="metadata-badge">Software: <span>${safe(software)}</span></div>
    `;
  }

  // 4. Highlight the active card – remove old, add new
  if (activeCardEl && activeCardEl !== parent) {
    activeCardEl.classList.remove('is-active');
  }
  parent.classList.add('is-active');
  // Brief click pulse animation
  parent.classList.add('clicking');
  setTimeout(() => parent.classList.remove('clicking'), 200);
  activeCardEl = parent;

  // 5. Load likes & comments
  const artworkId = "2d_" + charName.toLowerCase().replace(/[^a-z0-9]/g, "_");
  loadDetailInteractions(artworkId);

  // Recalculate masonry layout so feed starts below the newly loaded card
  // Give it a tiny delay for DOM rendering
  setTimeout(() => {
    layoutMasonry();
  }, 10);
}

// ── Navigate to image by index (arrow keys / swipe) ────────
function showDetailImageAt(idx: number) {
  if (modalImageList.length === 0) return;
  if (idx < 0) idx = modalImageList.length - 1;
  if (idx >= modalImageList.length) idx = 0;
  currentIndex2D = idx;
  const targetImg = modalImageList[currentIndex2D];
  const targetCard = originalPinterestItems[currentIndex2D];
    commentsList.innerHTML = `<p style="color:#aaa;font-style:italic;font-size:0.8rem;margin:0">No comments yet.</p>`;
  } else {
    commentsList.innerHTML = comments.map(c => {
      const dateStr = new Date(c.createdAt).toLocaleDateString(undefined, {
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
      });
      const initial = c.username ? c.username.charAt(0).toUpperCase() : '?';
      return `
        <div class="detail-comment-item-box">
          <div class="detail-comment-avatar">${initial}</div>
          <div class="detail-comment-body">
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:2px;">
              <span class="detail-comment-username">${escapeHTML2D(c.username)}</span>
              <span class="detail-comment-date">${dateStr}</span>
            </div>
            <p class="detail-comment-text">${escapeHTML2D(c.text)}</p>
          </div>
        </div>
      `;
    }).join("");
  }
  layoutMasonry();
}

// ── Event listeners for Like button & Comment form ─────────
function initDetailCardListeners() {
  const likeBtn   = document.getElementById("detail-like-btn");
  const likeIcon  = document.getElementById("detail-like-icon");
  const likeCount = document.getElementById("detail-like-count");
  const commentForm  = document.getElementById("detail-comment-form") as HTMLFormElement | null;
  const textInput    = document.getElementById("detail-comment-text") as HTMLInputElement | null;

  if (likeBtn && likeIcon && likeCount) {
    likeBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (!activeArtworkId) return;

      const votedKey = `liked_artwork_${activeArtworkId}`;
      const isLiked  = localStorage.getItem(votedKey) === 'true';
      const action   = isLiked ? 'unlike' : 'like';

      try {
        const res = await fetch(`http://localhost:5000/api/anime/likes`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ animeId: activeArtworkId, action })
        });
        if (res.ok) {
          const data = await res.json();
          likeCount.textContent = data.count.toString();
          localStorage.setItem(`mock_likes_count_${activeArtworkId}`, data.count.toString());
          updateLikedUI(action === 'like');
        } else {
          throw new Error("HTTP error");
        }
      } catch (err) {
        console.warn("Backend unavailable, falling back to localStorage liked update:", err);
        const baseLikes = getBaseLikesCount(activeArtworkId);
        let count = parseInt(localStorage.getItem(`mock_likes_count_${activeArtworkId}`) || baseLikes.toString());
        if (action === 'like') {
          count += 1;
          updateLikedUI(true);
        } else {
          count = Math.max(0, count - 1);
          updateLikedUI(false);
        }
        localStorage.setItem(`mock_likes_count_${activeArtworkId}`, count.toString());
        likeCount.textContent = count.toString();
      }
    });
  }

  if (commentForm && textInput) {
    commentForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      e.stopPropagation();
      const text = textInput.value.trim();
      if (!text || !activeArtworkId) return;

      try {
        const res = await fetch(`http://localhost:5000/api/anime/comments`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ animeId: activeArtworkId, username: "Anonymous", text })
        });
        if (res.ok) {
          textInput.value = "";
          loadDetailInteractions(activeArtworkId);
        } else {
          throw new Error("HTTP error");
        }
      } catch (err) {
        console.warn("Backend unavailable, falling back to localStorage comment post:", err);
        let commentsRaw = localStorage.getItem(`mock_comments_${activeArtworkId}`);
        let comments: any[] = [];
        if (commentsRaw) {
          try { comments = JSON.parse(commentsRaw); } catch(e) {}
        } else {
          comments = getInitialComments(activeArtworkId);
        }
        const newComment = {
          username: "Anonymous",
          text: text,
          createdAt: new Date().toISOString()
        };
        comments.unshift(newComment);
        localStorage.setItem(`mock_comments_${activeArtworkId}`, JSON.stringify(comments));
        textInput.value = "";
        
        // Update label and render
        const commentsCountLabel = document.getElementById("detail-comments-count-label");
        if (commentsCountLabel) {
          commentsCountLabel.textContent = `${comments.length}`;
        }
        renderCommentsList(comments);
      }
    });
  }
}

function updateLikedUI(isLiked: boolean) {
  const likeBtn   = document.getElementById("detail-like-btn");
  const likeIcon  = document.getElementById("detail-like-icon");
  if (!likeBtn || !likeIcon) return;
  const votedKey = `liked_artwork_${activeArtworkId}`;
  if (isLiked) {
    likeBtn.style.borderColor = "#ff4d4d";
    likeBtn.style.color = "#ff4d4d";
    likeIcon.className = "fa-solid fa-heart";
    likeIcon.style.color = "#ff4d4d";
    localStorage.setItem(votedKey, 'true');
  } else {
    likeBtn.style.borderColor = "rgba(0,0,0,0.1)";
    likeBtn.style.color = "#333";
    likeIcon.className = "fa-regular fa-heart";
    likeIcon.style.color = "#333";
    localStorage.removeItem(votedKey);
  }
}
