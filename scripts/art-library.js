// ============================================================
//  SenpaiWorks - 2D World Art Library (Pinterest UI & Lightbox Zoom)
// ============================================================

// Legacy helper functions
function scrollDigitalArt(direction) {
  const container = document.getElementById('digital-art-scroll');
  if (!container) return;
  const card = container.querySelector('.trending-item');
  if (!card) return;
  const scrollAmount = card.offsetWidth + parseInt(getComputedStyle(container).gap || 0);
  container.scrollBy({ left: direction * scrollAmount, behavior: 'smooth' });
}

function scrollInsaneArt(direction) {
  const container = document.getElementById('insane-scroll');
  if (!container) return;
  const card = container.querySelector('.trending-item');
  if (!card) return;
  const scrollAmount = card.offsetWidth + parseInt(getComputedStyle(container).gap || 0);
  container.scrollBy({ left: direction * scrollAmount, behavior: 'smooth' });
}

function scrollPortraits(direction) {
  const container = document.getElementById('portrait-scroll');
  if (!container) return;
  const card = container.querySelector('.trending-item');
  if (!card) return;
  const scrollAmount = card.offsetWidth + parseInt(getComputedStyle(container).gap || 0);
  container.scrollBy({ left: direction * scrollAmount, behavior: 'smooth' });
}

function scrollcharcoal(direction) {
  const container = document.getElementById('charcoal-scroll');
  if (!container) return;
  const card = container.querySelector('.trending-item');
  if (!card) return;
  const scrollAmount = card.offsetWidth + parseInt(getComputedStyle(container).gap || 0);
  container.scrollBy({ left: direction * scrollAmount, behavior: 'smooth' });
}

// ── Helpers ────────────────────────────────────────────────
function safe(val) {
  return val ? val : "N/A";
}

function escapeHTML2D(str) {
  if (!str) return '';
  return String(str).replace(/[&<>'"]/g,
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  );
}

// ── Global State ────────────────────────────────────────────
let currentIndex2D = 0;
let modalImageList = [];
let originalPinterestItems = [];
let activeArtworkId = "";
let activeCardEl = null;

let activeCategory = 'all';
let visibleLimit = 0;

// Comment Pagination State
let currentCommentsList = [];
let commentsVisibleLimit = 5;

// Lightbox Zoom & Drag Pan State
let currentZoom = 1;
let panX = 0;
let panY = 0;
let isDraggingLightbox = false;
let dragStartX = 0;
let dragStartY = 0;
let initialPanX = 0;
let initialPanY = 0;

const MIN_ZOOM = 1;
const MAX_ZOOM = 4;
const ZOOM_STEP = 0.25;

function applyLightboxTransform(isDragging = false) {
  const lightboxImg = document.getElementById("lightbox-img");
  const zoomText = document.getElementById("zoom-level-text");

  if (lightboxImg) {
    lightboxImg.style.transition = isDragging ? "none" : "transform 0.2s ease-out";
    lightboxImg.style.transform = `translate(${panX}px, ${panY}px) scale(${currentZoom})`;
    lightboxImg.style.cursor = isDragging ? "grabbing" : "grab";
  }
  if (zoomText) {
    zoomText.textContent = `${Math.round(currentZoom * 100)}%`;
  }
}

function applyLightboxZoom(newZoom) {
  currentZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.round(newZoom * 100) / 100));
  if (currentZoom === 1) {
    panX = 0;
    panY = 0;
  }
  applyLightboxTransform(false);
}

function resetLightboxZoom() {
  currentZoom = 1;
  panX = 0;
  panY = 0;
  isDraggingLightbox = false;
  applyLightboxTransform(false);
}

// ── Calculate Grid Columns & Full Row Batch Sizes ────────────
function getGridCols() {
  const grid = document.getElementById("pinterest-grid");
  if (!grid) return 4;
  const isMobile = window.innerWidth <= 768;
  if (isMobile) return 1;

  const containerWidth = grid.clientWidth;
  if (!containerWidth) return 4;

  const gap = 20;
  const targetColWidth = 280;
  return Math.max(2, Math.floor((containerWidth + gap) / (targetColWidth + gap)));
}

function getInitialLimit() {
  const isMobile = window.innerWidth <= 768;
  if (isMobile) return 6;
  const cols = getGridCols();
  const desiredRows = 4; // Show 4 full rows initially on desktop so all artwork loads on page load!
  return cols * desiredRows;
}

function getBatchSize() {
  const isMobile = window.innerWidth <= 768;
  if (isMobile) return 4;
  const cols = getGridCols();
  return cols * 2;
}

// ── Absolute Positioning Masonry Layout (With 2-Column Wide Pinterest Preview Panel) ──────
function layoutMasonry() {
  const grid = document.getElementById("pinterest-grid");
  const layout = document.getElementById("pin-page-layout");

  if (!grid || !layout) return;

  const isMobile = window.innerWidth <= 768;
  const detailOpen = layout.classList.contains("detail-open");
  const detailWrapper = document.getElementById("pin-detail-card-wrapper");

  if (isMobile) {
    if (detailWrapper) {
      if (detailOpen) {
        detailWrapper.style.position = "relative";
        detailWrapper.style.width = "100%";
        detailWrapper.style.left = "auto";
        detailWrapper.style.top = "auto";
        detailWrapper.style.display = "block";
      } else {
        detailWrapper.style.display = "none";
      }
    }
    const items = grid.querySelectorAll(".pinterest-item");
    items.forEach(item => {
      if (item === activeCardEl) {
        item.style.display = "none";
        return;
      }
      item.style.position = "relative";
      item.style.width = "100%";
      item.style.left = "auto";
      item.style.top = "auto";
      if (item.style.display !== 'none') {
        item.style.display = "";
      }
    });
    grid.style.height = "auto";
    return;
  }

  const containerWidth = grid.clientWidth;
  if (!containerWidth) return;

  const gap = 20;
  const targetColWidth = 280;
  const numCols = Math.max(2, Math.floor((containerWidth + gap) / (targetColWidth + gap)));
  const colWidth = Math.floor((containerWidth - (numCols - 1) * gap) / numCols);

  const colHeights = new Array(numCols).fill(0);

  // Position 2-Column Wide Detail Preview Panel at Top-Left if active
  if (detailOpen && detailWrapper) {
    detailWrapper.style.display = "block";
    const spanCols = Math.min(2, numCols);
    const detailWidth = colWidth * spanCols + gap * (spanCols - 1);

    detailWrapper.style.position = "absolute";
    detailWrapper.style.width = `${detailWidth}px`;
    detailWrapper.style.left = `0px`;
    detailWrapper.style.top = `0px`;

    const detailHeight = detailWrapper.offsetHeight || 650;
    for (let c = 0; c < spanCols; c++) {
      colHeights[c] = detailHeight + gap;
    }
  } else if (detailWrapper) {
    detailWrapper.style.display = "none";
  }

  // Position All Unselected Artwork Items (Flowing to Right & Below Detail Panel)
  const items = Array.from(grid.querySelectorAll(".pinterest-item"));

  items.forEach(item => {
    // Skip if card is open in detail panel or hidden by filter
    if (item.style.display === "none" || item === activeCardEl) return;

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

    const itemHeight = item.offsetHeight || 320;
    colHeights[minCol] += itemHeight + gap;
  });

  const maxHeight = Math.max(...colHeights);
  grid.style.height = `${maxHeight}px`;
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// ── Update Pagination, Visibility & Fill Empty Spaces ──────
function updateVisibleItems() {
  const grid = document.getElementById("pinterest-grid");
  if (!grid) return;

  if (activeCategory === 'all') {
    const items = Array.from(grid.querySelectorAll(".pinterest-item"));
    shuffleArray(items);
    items.forEach(item => grid.appendChild(item));
  }

  if (!visibleLimit) {
    visibleLimit = getInitialLimit();
  }

  const items = Array.from(grid.querySelectorAll(".pinterest-item"));
  let matchingCount = 0;
  let displayedCount = 0;

  items.forEach(item => {
    const itemCat = item.getAttribute("data-category") || "";
    const matchCategory = activeCategory === 'all' || itemCat === activeCategory;

    if (matchCategory) {
      matchingCount++;
      if (item === activeCardEl) {
        item.style.display = 'none'; // Temporarily removed from collection while open in detail view
      } else if (displayedCount < visibleLimit) {
        item.style.display = '';
        displayedCount++;
      } else {
        item.style.display = 'none';
      }
    } else {
      item.style.display = 'none';
    }
  });

  layoutMasonry();

  const loadMoreContainer = document.getElementById("load-more-container");
  const loadMoreBtn = document.getElementById("load-more-btn");

  if (loadMoreContainer && loadMoreBtn) {
    const initialLimit = getInitialLimit();
    const btnSpan = loadMoreBtn.querySelector('span');
    const btnIcon = loadMoreBtn.querySelector('i');

    if (matchingCount <= initialLimit) {
      loadMoreContainer.style.display = 'none';
    } else {
      loadMoreContainer.style.display = 'flex';
      loadMoreBtn.style.display = 'inline-flex';

      if (visibleLimit >= matchingCount) {
        if (btnSpan) btnSpan.textContent = 'Show Less';
        if (btnIcon) btnIcon.className = 'fa-solid fa-chevron-up';
        loadMoreBtn.setAttribute('data-state', 'show-less');
      } else {
        if (btnSpan) btnSpan.textContent = 'Load More Artworks';
        if (btnIcon) btnIcon.className = 'fa-solid fa-chevron-down';
        loadMoreBtn.setAttribute('data-state', 'load-more');
      }
    }
  }
}

// ── Non-Blocking Fast API Fetch Handler ──────────────────────
async function fetchAndRenderDatabaseArtworks(grid) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 500);

    const res = await fetch("http://localhost:5000/api/artworks", { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!res.ok) throw new Error("Failed to fetch artworks");
    const artworks = await res.json();

    artworks.forEach((art) => {
      const item = document.createElement("div");
      item.className = "pinterest-item";
      item.setAttribute("data-category", art.category);
      item.setAttribute("data-charname", art.charname);
      item.setAttribute("data-source", art.source);
      item.setAttribute("data-sex", art.sex || "Female");
      item.setAttribute("data-artstyle", art.artstyle || "Digital Art");
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

    updateVisibleItems();
  } catch (err) {
    // Fail silently
  }
}

// ── Open Artwork Detail Card Modal ──────────────────────────
function openDetailCard(img, cardEl) {
  const pinPageLayout = document.getElementById('pin-page-layout');
  if (pinPageLayout) {
    pinPageLayout.classList.add('detail-open');
  }

  const detailPanel = document.getElementById("detail-card-panel");
  if (detailPanel) {
    detailPanel.classList.remove("refreshing");
    void detailPanel.offsetWidth;
    detailPanel.classList.add("refreshing");
  }

  // Ensure comments section is hidden by default when opening a new artwork card
  const commentsContainer = document.getElementById("detail-comments-container");
  if (commentsContainer) {
    commentsContainer.style.display = "none";
  }
  commentsVisibleLimit = 5;

  const detailImg = document.getElementById('detail-main-img');
  if (detailImg) {
    if (detailImg.src && detailImg.src !== img.src) {
      detailImg.classList.add('changing');
      setTimeout(() => {
        detailImg.src = img.src;
        detailImg.alt = img.alt || '';
        detailImg.classList.remove('changing');
      }, 150);
    } else {
      detailImg.src = img.src;
      detailImg.alt = img.alt || '';
    }
  }

  const parent = cardEl || img.closest('.pinterest-item');
  if (!parent) return;

  const charName = parent.getAttribute("data-charname") || "";
  const source = parent.getAttribute("data-source") || "";
  const sex = parent.getAttribute("data-sex") || "";
  const artstyle = parent.getAttribute("data-artstyle") || "";
  const description = parent.getAttribute("data-description") || "";

  const detailCharName = document.getElementById('detail-charname');
  const detailDescription = document.getElementById('detail-description');
  if (detailCharName) detailCharName.textContent = safe(charName);
  if (detailDescription) detailDescription.textContent = safe(description);

  // Set Download Button Link & File Attribute
  const downloadBtn = document.getElementById('detail-download-btn');
  if (downloadBtn) {
    downloadBtn.href = img.src;
    const fileName = (charName ? charName.toLowerCase().replace(/[^a-z0-9]/g, '_') : 'senpaiworks_artwork') + '.jpg';
    downloadBtn.setAttribute('download', fileName);
  }

  // Specifications Metadata (Clean blue styling, no red)
  const badgesContainer = document.getElementById("detail-badges-container");
  if (badgesContainer) {
    badgesContainer.innerHTML = `
      <div class="metadata-badge">Franchise: <span>${safe(source)}</span></div>
      <div class="metadata-badge">Gender: <span>${safe(sex)}</span></div>
      <div class="metadata-badge">Style: <span>${safe(artstyle)}</span></div>
    `;
  }

  // Restore previously active card to grid collection before hiding current open card
  if (activeCardEl && activeCardEl !== parent) {
    activeCardEl.style.display = '';
    activeCardEl.classList.remove('is-active');
  }

  // Remove current image from grid collection while open in detail modal view
  parent.style.display = 'none';
  parent.classList.add('is-active');
  activeCardEl = parent;

  const artworkId = "2d_" + charName.toLowerCase().replace(/[^a-z0-9]/g, "_");
  loadDetailInteractions(artworkId);

  // Re-run updateVisibleItems to layout 2-column wide detail panel & remaining items
  updateVisibleItems();
  
  // Fast follow-up layout refresh for smooth animation positioning
  setTimeout(() => layoutMasonry(), 50);
  setTimeout(() => layoutMasonry(), 200);

  // Smooth scroll page to show the open detail card preview screen
  const wrapper = document.getElementById("pin-detail-card-wrapper");
  if (wrapper) {
    setTimeout(() => {
      const headerOffset = 85;
      const elementPosition = wrapper.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      window.scrollTo({
        top: Math.max(0, offsetPosition),
        behavior: "smooth"
      });
    }, 80);
  }
}

// ── Offline / Mock Seed Helpers ──────────────────────────────
function getBaseLikesCount(artworkId) {
  let hash = 0;
  for (let i = 0; i < artworkId.length; i++) {
    hash = artworkId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash % 15) + 3;
}

function getInitialComments(artworkId) {
  const charname = artworkId.replace("2d_", "").replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
  if (artworkId.includes("kaori")) {
    return [
      { username: "AnimeFan", text: "Her expression is so emotional! Truly captures the spirit of the show.", createdAt: new Date(Date.now() - 3600000 * 2).toISOString() },
      { username: "MusicLover", text: "Beautiful violin details, love this art style!", createdAt: new Date(Date.now() - 3600000 * 24).toISOString() },
      { username: "ArtStudent", text: "The lighting gradient on Kaori's hair is breathtaking.", createdAt: new Date(Date.now() - 3600000 * 30).toISOString() },
      { username: "Violinist", text: "Super accurate posture on the violin grip!", createdAt: new Date(Date.now() - 3600000 * 45).toISOString() },
      { username: "SenpaiFan", text: "One of my absolute favorite prints from SenpaiWorks.", createdAt: new Date(Date.now() - 3600000 * 60).toISOString() },
      { username: "Kousei", text: "Music speaks louder than words.", createdAt: new Date(Date.now() - 3600000 * 90).toISOString() }
    ];
  }
  if (artworkId.includes("zoro")) {
    return [
      { username: "Swordsman", text: "Three-sword style is legendary. Awesome hatching on the swords!", createdAt: new Date(Date.now() - 3600000 * 5).toISOString() },
      { username: "PirateKing", text: "The green aura looks so epic!", createdAt: new Date(Date.now() - 3600000 * 12).toISOString() },
      { username: "MangaReader", text: "Cleanest Zoro artwork on the web.", createdAt: new Date(Date.now() - 3600000 * 18).toISOString() },
      { username: "WanoArc", text: "King of Hell form when?", createdAt: new Date(Date.now() - 3600000 * 24).toISOString() },
      { username: "StrawHat", text: "Nothing happened...", createdAt: new Date(Date.now() - 3600000 * 36).toISOString() },
      { username: "OnePieceFan", text: "Needs 10 stars!", createdAt: new Date(Date.now() - 3600000 * 48).toISOString() }
    ];
  }
  if (artworkId.includes("miku")) {
    return [
      { username: "NakanoFan", text: "Best girl Miku! The headphones and shading are perfect.", createdAt: new Date(Date.now() - 3600000 * 8).toISOString() },
      { username: "Quintuplets", text: "Team Miku forever!", createdAt: new Date(Date.now() - 3600000 * 16).toISOString() },
      { username: "MatchaLover", text: "The soft color palette is amazing.", createdAt: new Date(Date.now() - 3600000 * 22).toISOString() },
      { username: "AnimeWaifu", text: "Ordered this print immediately!", createdAt: new Date(Date.now() - 3600000 * 32).toISOString() },
      { username: "Otaku33", text: "So cute and elegant.", createdAt: new Date(Date.now() - 3600000 * 40).toISOString() },
      { username: "Suhas", text: "Outstanding depth on the background lighting.", createdAt: new Date(Date.now() - 3600000 * 50).toISOString() }
    ];
  }
  return [
    { username: "Guest", text: `Stunning artwork of ${charname}! Very clean lines.`, createdAt: new Date(Date.now() - 3600000 * 12).toISOString() },
    { username: "Collector", text: "High quality piece for any anime room.", createdAt: new Date(Date.now() - 3600000 * 20).toISOString() },
    { username: "StudioMember", text: "Love the contrast and brush technique.", createdAt: new Date(Date.now() - 3600000 * 28).toISOString() },
    { username: "ProArtist", text: "Dynamic pose and excellent balance.", createdAt: new Date(Date.now() - 3600000 * 35).toISOString() },
    { username: "SenpaiSupporter", text: "SenpaiWorks never disappoints!", createdAt: new Date(Date.now() - 3600000 * 50).toISOString() },
    { username: "VibeChecker", text: "10/10 aesthetic.", createdAt: new Date(Date.now() - 3600000 * 70).toISOString() }
  ];
}

// ── Fetch & Render Likes and Comments ──────────────────────
async function loadDetailInteractions(artworkId) {
  activeArtworkId = artworkId;
  const likeBtn = document.getElementById("detail-like-btn");
  const likeIcon = document.getElementById("detail-like-icon");
  const likeCount = document.getElementById("detail-like-count");

  if (!likeCount) return;

  const votedKey = `liked_artwork_${artworkId}`;
  const isLiked = localStorage.getItem(votedKey) === 'true';
  if (likeIcon) {
    if (isLiked) {
      likeIcon.className = "fa-solid fa-heart";
      likeIcon.style.color = "#ef4444"; // Red when liked
    } else {
      likeIcon.className = "fa-regular fa-heart";
      likeIcon.style.color = "#111111";
    }
  }

  try {
    const res = await fetch(`http://localhost:5000/api/anime/likes?animeId=${artworkId}`);
    if (res.ok) {
      const data = await res.json();
      likeCount.textContent = data.count.toString();
      localStorage.setItem(`mock_likes_count_${artworkId}`, data.count.toString());
    } else {
      throw new Error("HTTP error");
    }
  } catch (err) {
    let count = localStorage.getItem(`mock_likes_count_${artworkId}`);
    if (count === null) {
      count = getBaseLikesCount(artworkId).toString();
      localStorage.setItem(`mock_likes_count_${artworkId}`, count);
    }
    likeCount.textContent = count;
  }

  try {
    const res = await fetch(`http://localhost:5000/api/anime/comments?animeId=${artworkId}`);
    if (res.ok) {
      const comments = await res.json();
      localStorage.setItem(`mock_comments_${artworkId}`, JSON.stringify(comments));
      renderCommentsList(comments);
    } else {
      throw new Error("HTTP error");
    }
  } catch (err) {
    let commentsRaw = localStorage.getItem(`mock_comments_${artworkId}`);
    let comments = [];
    if (commentsRaw) {
      try { comments = JSON.parse(commentsRaw); } catch (e) { }
    } else {
      comments = getInitialComments(artworkId);
      localStorage.setItem(`mock_comments_${artworkId}`, JSON.stringify(comments));
    }
    renderCommentsList(comments);
  }
}

function renderCommentsList(comments) {
  currentCommentsList = comments || [];

  const commentsList = document.getElementById("detail-comments-list");
  const commentsCountLabel = document.getElementById("detail-comments-count-label");
  const commentsShortcutCount = document.getElementById("detail-comments-shortcut-count");
  const loadMoreCommentsBtn = document.getElementById("load-more-comments-btn");

  const totalCount = currentCommentsList.length;
  if (commentsCountLabel) commentsCountLabel.textContent = `${totalCount}`;
  if (commentsShortcutCount) commentsShortcutCount.textContent = `${totalCount}`;

  if (!commentsList) return;

  if (totalCount === 0) {
    commentsList.innerHTML = `<p style="color:#aaa;font-style:italic;font-size:0.8rem;margin:0">No comments yet.</p>`;
    if (loadMoreCommentsBtn) loadMoreCommentsBtn.style.display = "none";
  } else {
    const visibleComments = currentCommentsList.slice(0, commentsVisibleLimit);
    commentsList.innerHTML = visibleComments.map(c => {
      const dateStr = new Date(c.createdAt || Date.now()).toLocaleDateString(undefined, {
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

    if (loadMoreCommentsBtn) {
      if (totalCount > commentsVisibleLimit) {
        loadMoreCommentsBtn.style.display = "inline-flex";
      } else {
        loadMoreCommentsBtn.style.display = "none";
      }
    }
  }

  layoutMasonry();
}

function initDetailCardListeners() {
  const likeBtn = document.getElementById("detail-like-btn");
  const likeIcon = document.getElementById("detail-like-icon");
  const likeCount = document.getElementById("detail-like-count");
  const commentForm = document.getElementById("detail-comment-form");
  const textInput = document.getElementById("detail-comment-text");
  const shareBtn = document.getElementById("detail-share-btn");

  const commentShortcutBtn = document.getElementById("detail-comment-shortcut-btn");
  const commentsContainer = document.getElementById("detail-comments-container");
  const loadMoreCommentsBtn = document.getElementById("load-more-comments-btn");

  // Toggle comments drawer when comment icon button is clicked
  if (commentShortcutBtn && commentsContainer) {
    commentShortcutBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const isHidden = getComputedStyle(commentsContainer).display === "none";
      if (isHidden) {
        commentsContainer.style.display = "block";
        commentsVisibleLimit = 5;
        renderCommentsList(currentCommentsList);
        setTimeout(() => {
          commentsContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          layoutMasonry();
        }, 60);
      } else {
        commentsContainer.style.display = "none";
        setTimeout(() => layoutMasonry(), 60);
      }
    });
  }

  // Load More Comments button handler
  if (loadMoreCommentsBtn) {
    loadMoreCommentsBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      commentsVisibleLimit += 5;
      renderCommentsList(currentCommentsList);
    });
  }

  // Interactive Emoji Picker Handler
  const emojiBtn = document.getElementById("comment-emoji-btn");
  const emojiPicker = document.getElementById("emoji-picker-box");
  if (emojiBtn && emojiPicker && textInput) {
    emojiBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const isHidden = getComputedStyle(emojiPicker).display === "none";
      emojiPicker.style.display = isHidden ? "block" : "none";
    });

    emojiPicker.querySelectorAll(".emoji-item").forEach(item => {
      item.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        const emoji = item.textContent;
        textInput.value += emoji;
        textInput.focus();
        emojiPicker.style.display = "none";
      });
    });

    document.addEventListener("click", (e) => {
      if (emojiPicker && !emojiPicker.contains(e.target) && e.target !== emojiBtn) {
        emojiPicker.style.display = "none";
      }
    });
  }

  if (likeBtn && likeIcon && likeCount) {
    likeBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (!activeArtworkId) return;

      const votedKey = `liked_artwork_${activeArtworkId}`;
      const isLiked = localStorage.getItem(votedKey) === 'true';
      const action = isLiked ? 'unlike' : 'like';

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

  // Web Share API Handler for WhatsApp / Instagram / Social Media Sharing
  if (shareBtn) {
    shareBtn.addEventListener("click", async (e) => {
      e.stopPropagation();
      const charName = document.getElementById("detail-charname")?.textContent || "Artwork";
      const shareUrl = window.location.href;
      const shareTitle = `SenpaiWorks - ${charName}`;
      const shareText = `Check out this artwork of ${charName} on SenpaiWorks!`;

      if (navigator.share) {
        try {
          await navigator.share({
            title: shareTitle,
            text: shareText,
            url: shareUrl
          });
        } catch (err) { }
      } else {
        try {
          await navigator.clipboard.writeText(shareUrl);
          alert("Artwork link copied to clipboard!");
        } catch (err) {
          alert(`Share link: ${shareUrl}`);
        }
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
        let commentsRaw = localStorage.getItem(`mock_comments_${activeArtworkId}`);
        let comments = [];
        if (commentsRaw) {
          try { comments = JSON.parse(commentsRaw); } catch (e) { }
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

        renderCommentsList(comments);
      }
    });
  }
}

function updateLikedUI(isLiked) {
  const likeIcon = document.getElementById("detail-like-icon");
  if (!likeIcon) return;
  const votedKey = `liked_artwork_${activeArtworkId}`;
  if (isLiked) {
    likeIcon.className = "fa-solid fa-heart";
    likeIcon.style.color = "#ef4444"; // Red when liked
    localStorage.setItem(votedKey, 'true');
  } else {
    likeIcon.className = "fa-regular fa-heart";
    likeIcon.style.color = "#111111";
    localStorage.removeItem(votedKey);
  }
}

function initCardListeners() {
  originalPinterestItems.forEach((item) => {
    if (item.dataset.hasListener) return;
    item.dataset.hasListener = "true";
    item.addEventListener('click', () => {
      const img = item.querySelector('img');
      if (!img) return;

      currentIndex2D = modalImageList.indexOf(img);
      openDetailCard(img, item);
    });
  });
}

// ── DOM Initialization ──────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  // Slideshow safety check
  const slides = document.querySelectorAll('.slide');
  const slideWrapper = document.querySelector('.slide-wrapper');
  if (slides.length > 0 && slideWrapper) {
    let currentIndex = 0;
    slides[currentIndex].classList.add('active');
    setInterval(() => {
      slides[currentIndex].classList.remove('active');
      currentIndex = (currentIndex + 1) % slides.length;
      slides[currentIndex].classList.add('active');
      slideWrapper.scrollTo({ left: currentIndex * slideWrapper.clientWidth, behavior: 'smooth' });
    }, 5000);
  }

  // Pinterest Grid Initialization
  const grid = document.getElementById("pinterest-grid");
  const pinPageLayout = document.getElementById("pin-page-layout");

  if (grid) {
    originalPinterestItems = Array.from(grid.querySelectorAll(".pinterest-item"));
    modalImageList = originalPinterestItems.map(item => item.querySelector('img'));

    initCardListeners();

    visibleLimit = getInitialLimit();
    updateVisibleItems();

    fetchAndRenderDatabaseArtworks(grid).then(() => {
      originalPinterestItems = Array.from(grid.querySelectorAll(".pinterest-item"));
      modalImageList = originalPinterestItems.map(item => item.querySelector('img'));
      initCardListeners();
      updateVisibleItems();
    });

    const imgs = grid.querySelectorAll('img');
    imgs.forEach(img => {
      if (!img.complete) {
        img.addEventListener('load', () => layoutMasonry());
        img.addEventListener('error', () => {
          layoutMasonry();
        });
      }
    });
  }

  // Load More / Show Less Button Listener
  const loadMoreBtn = document.getElementById("load-more-btn");
  if (loadMoreBtn) {
    loadMoreBtn.addEventListener("click", () => {
      const state = loadMoreBtn.getAttribute('data-state');
      if (state === 'show-less') {
        visibleLimit = getInitialLimit();
        updateVisibleItems();
        const gridContainer = document.getElementById("pinterest-grid");
        if (gridContainer) {
          gridContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      } else {
        visibleLimit += getBatchSize();
        updateVisibleItems();
      }
    });
  }

  initDetailCardListeners();

  // Close details panel listener
  const backBtn = document.getElementById("detail-back-btn");
  const closeBtn = document.getElementById("detail-close-btn");
  const detailWrapper = document.getElementById("pin-detail-card-wrapper");

  const closePanel = (e) => {
    if (e) e.stopPropagation();
    if (pinPageLayout) pinPageLayout.classList.remove("detail-open");
    if (activeCardEl) {
      activeCardEl.style.display = '';
      activeCardEl.classList.remove("is-active");
      activeCardEl = null;
    }
    updateVisibleItems();
  };

  if (backBtn) backBtn.addEventListener("click", closePanel);
  if (closeBtn) closeBtn.addEventListener("click", closePanel);

  // Enlarge Lightbox Modal & Zoom Controls Event Handlers
  const enlargeBtn = document.getElementById("enlarge-img-btn");
  const lightboxModal = document.getElementById("image-lightbox-modal");
  const lightboxImg = document.getElementById("lightbox-img");
  const lightboxCloseBtn = document.getElementById("lightbox-close-btn");

  const zoomInBtn = document.getElementById("zoom-in-btn");
  const zoomOutBtn = document.getElementById("zoom-out-btn");
  const zoomResetBtn = document.getElementById("zoom-reset-btn");

  if (enlargeBtn && lightboxModal && lightboxImg) {
    enlargeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const detailImg = document.getElementById("detail-main-img");
      if (detailImg && detailImg.src) {
        lightboxImg.src = detailImg.src;
        lightboxImg.alt = detailImg.alt || "Enlarged Artwork";
        resetLightboxZoom();
        lightboxModal.classList.add("active");
      }
    });
  }

  if (zoomInBtn) zoomInBtn.addEventListener("click", (e) => { e.stopPropagation(); applyLightboxZoom(currentZoom + ZOOM_STEP); });
  if (zoomOutBtn) zoomOutBtn.addEventListener("click", (e) => { e.stopPropagation(); applyLightboxZoom(currentZoom - ZOOM_STEP); });
  if (zoomResetBtn) zoomResetBtn.addEventListener("click", (e) => { e.stopPropagation(); resetLightboxZoom(); });

  // Lightbox Canvas Mouse Drag / Pan Logic
  if (lightboxModal && lightboxImg) {
    lightboxImg.addEventListener("dragstart", (e) => e.preventDefault());

    const handleDragStart = (clientX, clientY) => {
      isDraggingLightbox = true;
      dragStartX = clientX;
      dragStartY = clientY;
      initialPanX = panX;
      initialPanY = panY;
      applyLightboxTransform(true);
    };

    const handleDragMove = (clientX, clientY) => {
      if (!isDraggingLightbox) return;
      const deltaX = clientX - dragStartX;
      const deltaY = clientY - dragStartY;
      panX = initialPanX + deltaX;
      panY = initialPanY + deltaY;
      applyLightboxTransform(true);
    };

    const handleDragEnd = () => {
      if (isDraggingLightbox) {
        isDraggingLightbox = false;
        applyLightboxTransform(false);
      }
    };

    // Mouse events
    lightboxImg.addEventListener("mousedown", (e) => {
      if (e.button !== 0) return; // Only left click drag
      e.preventDefault();
      e.stopPropagation();
      handleDragStart(e.clientX, e.clientY);
    });

    window.addEventListener("mousemove", (e) => {
      if (isDraggingLightbox) {
        e.preventDefault();
        handleDragMove(e.clientX, e.clientY);
      }
    });

    window.addEventListener("mouseup", () => {
      handleDragEnd();
    });

    // Touch events for mobile/tablet canvas dragging
    lightboxImg.addEventListener("touchstart", (e) => {
      if (e.touches.length === 1) {
        handleDragStart(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: true });

    window.addEventListener("touchmove", (e) => {
      if (isDraggingLightbox && e.touches.length === 1) {
        handleDragMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: true });

    window.addEventListener("touchend", () => {
      handleDragEnd();
    });
  }

  // Mouse Wheel Zoom Listener
  if (lightboxModal) {
    lightboxModal.addEventListener("wheel", (e) => {
      if (!lightboxModal.classList.contains("active")) return;
      e.preventDefault();
      if (e.deltaY < 0) {
        applyLightboxZoom(currentZoom + 0.15);
      } else {
        applyLightboxZoom(currentZoom - 0.15);
      }
    }, { passive: false });
  }

  const closeLightbox = () => {
    if (lightboxModal) {
      lightboxModal.classList.remove("active");
      resetLightboxZoom();
    }
  };

  if (lightboxCloseBtn) lightboxCloseBtn.addEventListener("click", closeLightbox);
  if (lightboxModal) {
    lightboxModal.addEventListener("click", (e) => {
      if ((e.target === lightboxModal || e.target.classList.contains("lightbox-content")) && !isDraggingLightbox) {
        closeLightbox();
      }
    });
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (lightboxModal && lightboxModal.classList.contains("active")) {
        closeLightbox();
      } else if (pinPageLayout && pinPageLayout.classList.contains("detail-open")) {
        closePanel();
      }
    }
  });

  // Category filter buttons
  const filterBtns = document.querySelectorAll('.filter-btn');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeCategory = btn.dataset.filter || 'all';
      visibleLimit = getInitialLimit();
      updateVisibleItems();
    });
  });

  // Auto-filter by URL hash if present (e.g. #digital-portrait, #insane-artwork)
  const hashCategory = window.location.hash.replace('#', '');
  if (hashCategory) {
    const targetFilterBtn = document.querySelector(`.filter-btn[data-filter="${hashCategory}"]`);
    if (targetFilterBtn) {
      setTimeout(() => targetFilterBtn.click(), 50);
    }
  }

  // Calculate layout on resize
  window.addEventListener('resize', () => {
    updateVisibleItems();
  });

  window.addEventListener('load', () => layoutMasonry());

  // Fast layout refresh sequence for immediate image rendering
  [10, 50, 150, 300, 600, 1000].forEach(delay => {
    setTimeout(() => layoutMasonry(), delay);
  });
});
