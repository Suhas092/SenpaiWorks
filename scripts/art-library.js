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

// ── State & Helpers ─────────────────────────────────────────
let activeReplyParentId = null;

function getCurrentUserKey() {
  try {
    const raw = localStorage.getItem("currentUser");
    if (!raw) return "";
    const user = JSON.parse(raw);
    return user ? (user.username || user.email || "") : "";
  } catch (e) {
    return "";
  }
}

function formatCompactNumber(num) {
  const n = parseInt(num, 10);
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
let detailViewHistory = [];

// Comment Pagination State
let currentCommentsList = [];
let commentsVisibleLimit = 15;

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

// ── Absolute Positioning Masonry Layout (With Pinterest Preview Panel) ──────
function layoutMasonry() {
  const grid = document.getElementById("pinterest-grid");
  const layout = document.getElementById("pin-page-layout");
  if (!grid || !layout) return;

  const isMobile = window.innerWidth <= 768;
  const detailOpen = layout.classList.contains("detail-open");
  const detailWrapper = document.getElementById("pin-detail-card-wrapper");
  const cardBody = document.getElementById("detail-card-body");
  const isCommentsOpen = cardBody && cardBody.classList.contains("comments-open");
  const mainCol = document.querySelector(".detail-main-col");
  const commentsCol = document.getElementById("detail-comments-container");

  const containerWidth = grid.clientWidth;
  if (!containerWidth) return;

  const gap = isMobile ? 12 : 20;
  const targetColWidth = 280;

  // Column width comes from the grid FIRST — everything else is built from this.
  const fullCols = isMobile
    ? 2
    : Math.max(3, Math.floor((containerWidth + gap) / (targetColWidth + gap)));
  const colWidth = Math.floor((containerWidth - (fullCols - 1) * gap) / fullCols);

  let panelWidth = 0;
  let panelHeight = 0;

  if (detailOpen && detailWrapper) {
    detailWrapper.style.display = "block";
    detailWrapper.style.position = "absolute";
    detailWrapper.style.left = "0px";
    detailWrapper.style.top = "0px";

    if (isMobile) {
      panelWidth = containerWidth;
      if (mainCol) {
        mainCol.style.width = "100%";
        mainCol.style.maxWidth = "100%";
        mainCol.style.flex = "1 1 100%";
      }
    } else if (isCommentsOpen) {
      // Total panel width spans 3 thumbnail columns.
      // Subtract 2px for 1px panel border on left & right so content stays inside panel border.
      panelWidth = colWidth * 3 + gap * 2;
      const innerWidth = panelWidth - 2;
      const halfWidth = Math.floor((innerWidth - gap) / 2);
      const commentsWidth = innerWidth - gap - halfWidth;

      if (mainCol) {
        mainCol.style.width = `${halfWidth}px`;
        mainCol.style.maxWidth = `${halfWidth}px`;
        mainCol.style.flex = `0 0 ${halfWidth}px`;
      }
      if (commentsCol) {
        commentsCol.style.width = `${commentsWidth}px`;
        commentsCol.style.maxWidth = `${commentsWidth}px`;
        commentsCol.style.flex = `0 0 ${commentsWidth}px`;
      }
    } else {
      // Panel spans 2 thumbnail columns.
      // Fill 100% of panel inner width so mainCol fits inside the 1px border without overflowing right edge.
      panelWidth = colWidth * 2 + gap;
      if (mainCol) {
        mainCol.style.width = "100%";
        mainCol.style.maxWidth = "100%";
        mainCol.style.flex = "1 1 100%";
      }
    }

    detailWrapper.style.width = `${panelWidth}px`;
    const topBar = document.querySelector(".detail-top-bar");
    const topBarHeight = topBar ? topBar.offsetHeight : 60;
    
    const imageContainer = document.querySelector(".detail-image-container");
    const infoSection = document.querySelector(".detail-info-section");
    const imgHeight = imageContainer ? imageContainer.offsetHeight : 0;
    const infoHeight = infoSection ? infoSection.offsetHeight : 0;
    const naturalMainColHeight = (imgHeight > 0 || infoHeight > 0) ? (imgHeight + infoHeight) : (mainCol ? mainCol.offsetHeight : 0);

    if (isCommentsOpen && !isMobile && naturalMainColHeight > 0) {
      if (commentsCol) {
        commentsCol.style.height = `${naturalMainColHeight}px`;
        commentsCol.style.maxHeight = `${naturalMainColHeight}px`;

        const headerRow = commentsCol.querySelector(".comment-header-row");
        const commentForm = commentsCol.querySelector(".comment-form");
        const commentsList = document.getElementById("detail-comments-list");
        const headerH = headerRow ? headerRow.offsetHeight : 36;
        const formH = commentForm ? commentForm.offsetHeight : 48;
        const listMaxH = Math.max(80, naturalMainColHeight - headerH - formH - 54);

        if (commentsList) {
          commentsList.style.height = `${listMaxH}px`;
          commentsList.style.maxHeight = `${listMaxH}px`;
          commentsList.style.overflowY = "auto";
        }
      }
    } else if (commentsCol) {
      commentsCol.style.height = "";
      commentsCol.style.maxHeight = "";
      const commentsList = document.getElementById("detail-comments-list");
      if (commentsList) {
        commentsList.style.height = "";
        commentsList.style.maxHeight = "";
      }
    }

    panelHeight = (naturalMainColHeight > 0 ? topBarHeight + naturalMainColHeight : detailWrapper.offsetHeight) || (isMobile ? 500 : 650);
  } else if (detailWrapper) {
    detailWrapper.style.display = "none";
  }

  const reservedWidth = (detailOpen && !isMobile) ? panelWidth + gap : 0;
  const availableWidth = Math.max(0, containerWidth - reservedWidth);

  const besideColsCount = isMobile
    ? 2
    : Math.max(1, Math.floor((availableWidth + gap) / (colWidth + gap)));

  const leftColsCount = reservedWidth > 0
    ? Math.round(reservedWidth / (colWidth + gap))
    : 0;

  const totalCols = leftColsCount + besideColsCount;
  const colHeights = new Array(totalCols).fill(0);

  if (detailOpen && isMobile) {
    // On mobile the panel stacks above in normal document flow,
    // so every column needs its top reserved by the panel's height.
    for (let i = 0; i < totalCols; i++) {
      colHeights[i] = panelHeight + gap;
    }
  } else {
    for (let i = 0; i < leftColsCount; i++) {
      colHeights[i] = panelHeight + gap;
    }
  }

  function colX(index) {
    if (index < leftColsCount) return index * (colWidth + gap);
    const besideIndex = index - leftColsCount;
    return reservedWidth + besideIndex * (colWidth + gap);
  }

  const items = Array.from(grid.querySelectorAll(".pinterest-item"));
  items.forEach(item => {
    if (item.style.display === "none" || item === activeCardEl) return;

    let minCol = 0;
    let minHeight = colHeights[0];
    for (let i = 1; i < totalCols; i++) {
      if (colHeights[i] < minHeight) {
        minHeight = colHeights[i];
        minCol = i;
      }
    }

    item.style.position = "absolute";
    item.style.width = `${colWidth}px`;
    item.style.left = `${colX(minCol)}px`;
    item.style.top = `${minHeight}px`;

    const itemHeight = item.offsetHeight || 320;
    colHeights[minCol] += itemHeight + gap;
  });

  const maxHeight = colHeights.length ? Math.max(...colHeights) : 0;
  grid.style.height = `${maxHeight}px`;
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// ── Update Visibility & Fill Empty Spaces ──────
function updateVisibleItems() {
  const grid = document.getElementById("pinterest-grid");
  if (!grid) return;

  if (activeCategory === 'all') {
    const items = Array.from(grid.querySelectorAll(".pinterest-item"));
    shuffleArray(items);
    items.forEach(item => grid.appendChild(item));
  }

  const items = Array.from(grid.querySelectorAll(".pinterest-item"));

  items.forEach(item => {
    const itemCat = item.getAttribute("data-category") || "";
    const matchCategory = activeCategory === 'all' || itemCat === activeCategory;

    if (matchCategory) {
      if (item === activeCardEl) {
        item.style.display = 'none'; // Temporarily removed from collection while open in detail view
      } else {
        item.style.display = '';
      }
    } else {
      item.style.display = 'none';
    }
  });

  layoutMasonry();
}

// ── Non-Blocking Fast API Fetch Handler ──────────────────────
async function fetchAndRenderDatabaseArtworks(grid) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

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
function openDetailCard(img, cardEl, addToHistory = true) {
  const previousCardEl = activeCardEl; // capture BEFORE it gets reassigned below
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

  // Ensure comments column drawer is strictly closed by default until comment icon is clicked
  const cardBody = document.getElementById("detail-card-body");
  if (cardBody) {
    cardBody.classList.remove("comments-open");
  }
  commentsVisibleLimit = 15;

  const detailImg = document.getElementById('detail-main-img');
  if (detailImg) {
    const handleImgLoad = () => {
      layoutMasonry();
    };

    if (detailImg.src && detailImg.src !== img.src) {
      detailImg.classList.add('changing');
      setTimeout(() => {
        detailImg.onload = handleImgLoad;
        detailImg.src = img.src;
        detailImg.alt = img.alt || '';
        detailImg.classList.remove('changing');
        if (detailImg.complete) handleImgLoad();
      }, 150);
    } else {
      detailImg.onload = handleImgLoad;
      detailImg.src = img.src;
      detailImg.alt = img.alt || '';
      if (detailImg.complete) handleImgLoad();
    }
  }

  const parent = cardEl || img.closest('.pinterest-item');
  if (!parent) return;

  const charName = parent.getAttribute("data-charname") || "";
  const category = parent.getAttribute("data-category") || "";
  const artstyle = parent.getAttribute("data-artstyle") || "";
  const description = parent.getAttribute("data-description") || "";

  const detailCharName = document.getElementById('detail-charname');
  const detailDescription = document.getElementById('detail-description');
  const detailCategoryBadge = document.getElementById('detail-category-badge');

  if (detailCharName) detailCharName.textContent = safe(charName);
  if (detailDescription) detailDescription.textContent = safe(description);
  if (detailCategoryBadge) {
    const rawCat = category || artstyle || "Digital Art";
    detailCategoryBadge.textContent = safe(rawCat.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase()));
    detailCategoryBadge.style.display = "inline-flex";
  }

  // Sync Interested state UI for active artwork card
  const artworkId = "2d_" + charName.toLowerCase().replace(/[^a-z0-9]/g, "_");
  updateInterestedUI(isArtworkInterested(artworkId));

  // Restore previously active card to grid collection before hiding current open card
  if (activeCardEl && activeCardEl !== parent) {
    activeCardEl.style.display = '';
    activeCardEl.classList.remove('is-active');
  }

  // Push the artwork we're navigating away FROM onto the history stack,
  // so the back arrow can return to it later.
  if (addToHistory && previousCardEl && previousCardEl !== parent) {
    detailViewHistory.push(previousCardEl);
  }

  // Remove current image from grid collection while open in detail modal view
  parent.style.display = 'none';
  parent.classList.add('is-active');
  activeCardEl = parent;

  loadDetailInteractions(artworkId);
  initDetailCardListeners();

  // Re-run updateVisibleItems to layout 2-column wide detail panel & remaining items
  updateVisibleItems();
  
  // Fast follow-up layout refresh for smooth animation positioning
  setTimeout(() => layoutMasonry(), 50);
  setTimeout(() => layoutMasonry(), 200);

  // Smooth scroll page to show the open detail card preview screen
  const wrapper = document.getElementById("pin-detail-card-wrapper");
  if (wrapper) {
    setTimeout(() => {
      const isMobileNow = window.innerWidth <= 768;
      // Mobile header is shorter (46px) than desktop (76px) — use a
      // matching offset so the category bar doesn't peek out above the panel.
      const headerOffset = isMobileNow ? 46 : 85;
      const elementPosition = wrapper.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      window.scrollTo({
        top: Math.max(0, offsetPosition),
        behavior: "smooth"
      });
    }, 80);
  }
}

function goToPreviousDetailView() {
  if (detailViewHistory.length === 0) {
    return false; // nothing to go back to
  }
  const prevCard = detailViewHistory.pop();
  const img = prevCard.querySelector('img');
  if (img) {
    openDetailCard(img, prevCard, false); // false = don't re-push this navigation
    return true;
  }
  return false;
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

  // Strict check: Keep comments column drawer closed unless explicitly opened by user
  const cardBody = document.getElementById("detail-card-body");
  if (cardBody && !cardBody.classList.contains("comments-open")) {
    cardBody.classList.remove("comments-open");
  }

  const likeIcon = document.getElementById("detail-like-icon");
  const likeCount = document.getElementById("detail-like-count");
  const mobileLikeIcon = document.getElementById("mobile-detail-like-icon");
  const mobileLikeCount = document.getElementById("mobile-detail-like-count");

  const votedKey = `liked_artwork_${artworkId}`;
  const isLiked = localStorage.getItem(votedKey) === 'true';

  [likeIcon, mobileLikeIcon].forEach(icon => {
    if (icon) {
      if (isLiked) {
        icon.className = "fa-solid fa-heart";
        icon.style.color = "#ef4444";
      } else {
        icon.className = "fa-regular fa-heart";
        icon.style.color = "#111111";
      }
    }
  });

  let rawCount = 0;

  try {
    const userKey = getCurrentUserKey();
    const fetchUrl = `http://localhost:5000/api/anime/likes?animeId=${artworkId}` + (userKey ? `&userKey=${encodeURIComponent(userKey)}` : '');
    const res = await fetch(fetchUrl, {
      credentials: 'include'
    });
    if (res.ok) {
      const data = await res.json();
      rawCount = typeof data.count === 'number' ? data.count : parseInt(data.count || 0, 10);
      localStorage.setItem(`mock_likes_count_${artworkId}`, rawCount.toString());
      if (typeof data.userHasLiked === 'boolean') {
        updateLikedUI(data.userHasLiked);
      }
    } else {
      throw new Error("HTTP error");
    }
  } catch (err) {
    let count = localStorage.getItem(`mock_likes_count_${artworkId}`);
    if (count === null) {
      count = getBaseLikesCount(artworkId).toString();
      localStorage.setItem(`mock_likes_count_${artworkId}`, count);
    }
    rawCount = parseInt(count || 0, 10);
  }

  const formattedCount = formatCompactNumber(rawCount);
  if (likeCount) likeCount.textContent = formattedCount;
  if (mobileLikeCount) mobileLikeCount.textContent = formattedCount;

  try {
    const userKey = getCurrentUserKey();
    const commentsUrl = `http://localhost:5000/api/anime/comments?animeId=${artworkId}` + (userKey ? `&userKey=${encodeURIComponent(userKey)}` : '');
    const res = await fetch(commentsUrl, { credentials: 'include' });
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

function showAuthRequiredModal(actionText) {
  let modalOverlay = document.getElementById("auth-modal-overlay");
  if (!modalOverlay) {
    modalOverlay = document.createElement("div");
    modalOverlay.id = "auth-modal-overlay";
    modalOverlay.className = "auth-modal-overlay";
    modalOverlay.innerHTML = `
      <div class="auth-modal-card">
        <div class="auth-modal-icon">
          <i class="fa-solid fa-lock"></i>
        </div>
        <h3 class="auth-modal-title">Sign In Required</h3>
        <p class="auth-modal-text" id="auth-modal-text">Please sign in or create an account to continue.</p>
        <div class="auth-modal-actions">
          <button type="button" class="auth-modal-btn cancel" id="auth-modal-cancel-btn">Cancel</button>
          <a href="login.html" class="auth-modal-btn confirm">Sign In</a>
        </div>
      </div>
    `;
    document.body.appendChild(modalOverlay);

    const cancelBtn = modalOverlay.querySelector("#auth-modal-cancel-btn");
    if (cancelBtn) {
      cancelBtn.addEventListener("click", () => {
        modalOverlay.classList.remove("active");
      });
    }

    modalOverlay.addEventListener("click", (e) => {
      if (e.target === modalOverlay) {
        modalOverlay.classList.remove("active");
      }
    });
  }

  const textEl = modalOverlay.querySelector("#auth-modal-text");
  if (textEl && actionText) {
    textEl.textContent = `Please sign in or create an account to ${actionText}.`;
  }

  modalOverlay.classList.add("active");
}

function formatCommentTimeAgo(dateInput) {
  const date = new Date(dateInput || Date.now());
  const now = new Date();
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (isNaN(diffSec) || diffSec < 60) return 'Just now';
  if (diffMin < 60) return `${diffMin}m`;
  if (diffHr < 24) return `${diffHr}h`;
  if (diffDay < 7) return `${diffDay}d`;
  if (diffDay < 30) return `${Math.floor(diffDay / 7)}w`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function formatCommentTextHTML(text) {
  if (!text) return '';
  const escaped = escapeHTML2D(text);
  return escaped.replace(/@([A-Za-z0-9_\-\. ]+?)(?=\s|$|[.,!?])/g, (match) => {
    return `<span class="comment-mention-tag">${match}</span>`;
  });
}

function renderSingleCommentHTML(c, isChild = false) {
  const timeAgoStr = formatCommentTimeAgo(c.createdAt);
  const initial = c.username ? c.username.charAt(0).toUpperCase() : '?';
  const isLiked = Boolean(c.userHasLiked);
  const likeCount = c.likeCount || 0;

  const avatarHTML = c.userAvatar
    ? `<img src="${escapeHTML2D(c.userAvatar)}" class="detail-comment-avatar-img" alt="${escapeHTML2D(c.username)}" onerror="this.outerHTML='<div class=\\'detail-comment-avatar\\' style=\\'background:#000000;color:#ffffff;\\'>${initial}</div>'" />`
    : `<div class="detail-comment-avatar" style="background:#000000;color:#ffffff;">${initial}</div>`;

  const hasReplies = c.replies && c.replies.length > 0;
  const replyCount = hasReplies ? c.replies.length : 0;

  const repliesHTML = hasReplies
    ? `
      <button type="button" class="comment-replies-toggle-btn" data-comment-id="${c.id}">
        <span class="view-replies-line"></span>
        <span class="view-replies-text">View replies (${replyCount})</span>
      </button>
      <div class="comment-replies-container collapsed" id="replies-container-${c.id}" data-count="${replyCount}">
        ${c.replies.map(child => renderSingleCommentHTML(child, true)).join('')}
      </div>
    `
    : '';

  const currentUser = localStorage.getItem("currentUser") ? JSON.parse(localStorage.getItem("currentUser")) : null;
  const currentUsername = currentUser ? (currentUser.username || currentUser.email || currentUser.name || "").toLowerCase().trim() : "";
  const commentUsername = (c.username || "").toLowerCase().trim();
  const commentUserKey = (c.userKey || "").toLowerCase().trim();

  const isMyComment = Boolean(currentUser && (
    (currentUsername && commentUsername === currentUsername) ||
    (currentUsername && commentUserKey === currentUsername) ||
    (currentUser.email && commentUserKey === currentUser.email.toLowerCase().trim()) ||
    (currentUser.username && commentUsername === currentUser.username.toLowerCase().trim())
  ));

  const commentOptionsHTML = isMyComment
    ? `
      <button type="button" class="comment-dropdown-item comment-edit-btn" data-comment-id="${c.id}" data-text="${escapeHTML2D(c.text)}"><i class="fa-solid fa-pen-to-square"></i> Edit</button>
      <button type="button" class="comment-dropdown-item comment-delete-btn danger" data-comment-id="${c.id}"><i class="fa-solid fa-trash-can"></i> Delete</button>
    `
    : `
      <button type="button" class="comment-dropdown-item comment-report-btn" data-comment-id="${c.id}"><i class="fa-regular fa-flag"></i> Report</button>
      <button type="button" class="comment-dropdown-item comment-block-btn danger" data-username="${escapeHTML2D(c.username)}"><i class="fa-solid fa-user-slash"></i> Block</button>
    `;

  return `
    <div class="detail-comment-item-box" data-comment-id="${c.id}" data-username="${escapeHTML2D(c.username)}">
      ${avatarHTML}
      <div class="detail-comment-body" style="flex: 1;">
        
        <!-- Top Row: Username + Heart Icon & 3-Dot Menu on Far Right -->
        <div class="comment-top-row">
          <span class="detail-comment-username">${escapeHTML2D(c.username)}</span>
          <div class="comment-top-right-actions">
            <button type="button" class="comment-like-btn ${isLiked ? 'liked' : ''}" data-comment-id="${c.id}" aria-label="Like comment">
              <i class="${isLiked ? 'fa-solid' : 'fa-regular'} fa-heart"></i>
            </button>
            <div class="comment-options-wrapper">
              <button type="button" class="comment-options-btn" aria-label="More options"><i class="fa-solid fa-ellipsis-vertical"></i></button>
              <div class="comment-options-dropdown">
                ${commentOptionsHTML}
              </div>
            </div>
          </div>
        </div>

        <!-- Second Row: Comment Text (Below Username) -->
        <div class="comment-text-row">
          <p class="detail-comment-text">${formatCommentTextHTML(c.text)}</p>
        </div>

        <!-- Third Row: TimeAgo | Likes Label | Reply -->
        <div class="comment-sub-row">
          <span class="comment-time-ago">${timeAgoStr}</span>
          ${likeCount > 0 ? `<span class="comment-likes-label">${formatCompactNumber(likeCount)} ${likeCount === 1 ? 'like' : 'likes'}</span>` : ''}
          <button type="button" class="comment-action-btn comment-reply-toggle-btn" data-comment-id="${c.id}" data-username="${escapeHTML2D(c.username)}">Reply</button>
        </div>

        <!-- Fourth Row: Inline Reply Box -->
        <div class="comment-reply-box" id="reply-box-${c.id}">
          <input type="text" class="comment-reply-input" id="reply-input-${c.id}" value="@${escapeHTML2D(c.username)} " placeholder="Write a reply..." />
          <button type="button" class="comment-reply-submit-btn" data-comment-id="${c.id}" data-username="${escapeHTML2D(c.username)}">Reply</button>
        </div>

        <!-- Instagram-style View Replies Toggle Line -->
        ${repliesHTML}
      </div>
    </div>
  `;
}

function renderCommentsList(comments) {
  currentCommentsList = Array.isArray(comments) ? comments : (comments ? comments.comments || [] : []);

  const commentsList = document.getElementById("detail-comments-list");
  const commentsCountLabel = document.getElementById("detail-comments-count-label");
  const commentsShortcutCount = document.getElementById("detail-comments-shortcut-count");
  const mobileCommentsShortcutCount = document.getElementById("mobile-detail-comments-shortcut-count");
  const loadMoreCommentsBtn = document.getElementById("load-more-comments-btn");
  const commentForm = document.getElementById("detail-comment-form");

  const totalCount = currentCommentsList.length;
  if (commentsCountLabel) commentsCountLabel.textContent = `${totalCount}`;
  if (commentsShortcutCount) commentsShortcutCount.textContent = `${totalCount}`;
  if (mobileCommentsShortcutCount) mobileCommentsShortcutCount.textContent = `${totalCount}`;

  // Auth check for commenting
  const currentUser = localStorage.getItem("currentUser") ? JSON.parse(localStorage.getItem("currentUser")) : null;
  let authPromptBox = document.getElementById("detail-comment-auth-prompt");

  if (!currentUser) {
    if (commentForm) commentForm.style.display = "none";
    if (!authPromptBox) {
      authPromptBox = document.createElement("div");
      authPromptBox.id = "detail-comment-auth-prompt";
      authPromptBox.style.cssText = "background: rgba(2, 132, 199, 0.05); border: 1.5px dashed rgba(2, 132, 199, 0.3); border-radius: 12px; padding: 14px; text-align: center; margin: 12px 0 16px 0; font-family: 'Plus Jakarta Sans', sans-serif;";
      authPromptBox.innerHTML = `
        <div style="font-size: 0.88rem; font-weight: 700; color: #0f172a; margin-bottom: 8px;">
          <i class="fa-solid fa-lock" style="color: #0284c7;"></i> Sign in to leave a comment
        </div>
        <a href="login.html" style="display: inline-block; background: #0f172a; color: #ffffff; padding: 6px 18px; border-radius: 20px; font-weight: 700; font-size: 0.8rem; text-decoration: none; box-shadow: 0 4px 12px rgba(15,23,42,0.15);">
          Sign In to Comment
        </a>
      `;
      if (commentForm && commentForm.parentNode) {
        commentForm.parentNode.insertBefore(authPromptBox, commentForm);
      }
    } else {
      authPromptBox.style.display = "block";
    }
  } else {
    if (commentForm) commentForm.style.display = "block";
    if (authPromptBox) authPromptBox.style.display = "none";
  }

  if (!commentsList) return;

  if (totalCount === 0) {
    commentsList.innerHTML = `<p style="color:#aaa;font-style:italic;font-size:0.8rem;margin:0">No comments yet.</p>`;
    if (loadMoreCommentsBtn) loadMoreCommentsBtn.style.display = "none";
  } else {
    const visibleComments = currentCommentsList.slice(0, commentsVisibleLimit);
    commentsList.innerHTML = visibleComments.map(c => renderSingleCommentHTML(c)).join("");

    if (loadMoreCommentsBtn) {
      if (totalCount > commentsVisibleLimit) {
        loadMoreCommentsBtn.style.display = "inline-flex";
      } else {
        loadMoreCommentsBtn.style.display = "none";
      }
    }

    // Attach interactive event listeners for Social Actions
    attachCommentSocialListeners(commentsList);
  }

  layoutMasonry();
  requestAnimationFrame(() => {
    layoutMasonry();
  });
}

function attachCommentSocialListeners(container) {
  // 1. Comment Liking (Supports both Guests & Logged-in Users)
  container.querySelectorAll(".comment-like-btn").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      e.preventDefault();
      e.stopPropagation();

      const currentUser = localStorage.getItem("currentUser") ? JSON.parse(localStorage.getItem("currentUser")) : null;
      const commentId = btn.dataset.commentId;
      const isLiked = btn.classList.contains("liked");
      const action = isLiked ? 'unlike' : 'like';
      const userKey = currentUser ? (currentUser.username || currentUser.email) : '';

      // Optimistic UI update
      const icon = btn.querySelector("i");
      const countSpan = btn.querySelector(".comment-like-count");
      btn.classList.toggle("liked");
      if (icon) icon.className = !isLiked ? "fa-solid fa-heart" : "fa-regular fa-heart";

      try {
        const res = await fetch(`http://localhost:5000/api/anime/comments/like`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: 'include',
          body: JSON.stringify({ commentId, userKey, action })
        });
        if (res.ok) {
          const data = await res.json();
          if (countSpan) {
            countSpan.textContent = data.likeCount > 0 ? formatCompactNumber(data.likeCount) : '';
          }
        }
      } catch (err) {
        console.warn("Error liking comment:", err);
      }
    });
  });

  // 2. Reply Toggle Button (Opens inline reply box under comment)
  container.querySelectorAll(".comment-reply-toggle-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();

      const currentUser = localStorage.getItem("currentUser") ? JSON.parse(localStorage.getItem("currentUser")) : null;
      if (!currentUser) {
        showAuthRequiredModal("reply to comments");
        return;
      }

      const commentId = btn.dataset.commentId;
      const targetUsername = btn.dataset.username;
      activeReplyParentId = commentId;

      const replyBox = document.getElementById(`reply-box-${commentId}`);
      if (replyBox) {
        replyBox.classList.toggle("active");
        if (replyBox.classList.contains("active")) {
          const input = replyBox.querySelector(".comment-reply-input");
          if (input) {
            if (!input.value.trim()) input.value = `@${targetUsername} `;
            input.focus();
            const len = input.value.length;
            input.setSelectionRange(len, len);
          }
        }
      }

      // Also sync top input box
      const textInput = document.getElementById("detail-comment-text");
      if (textInput) {
        textInput.value = `@${targetUsername} `;
      }
    });
  });

  // 3. Submit Inline Reply Button
  container.querySelectorAll(".comment-reply-submit-btn").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      e.preventDefault();
      e.stopPropagation();

      const currentUser = localStorage.getItem("currentUser") ? JSON.parse(localStorage.getItem("currentUser")) : null;
      if (!currentUser) {
        showAuthRequiredModal("post replies");
        return;
      }

      const parentId = btn.dataset.commentId;
      const replyBox = document.getElementById(`reply-box-${parentId}`);
      const input = replyBox ? replyBox.querySelector(".comment-reply-input") : null;
      const text = input ? input.value.trim() : '';
      const targetArtworkId = activeArtworkId || document.getElementById("detail-comments-container")?.dataset.artworkId || "2d_artwork";

      if (!text) return;

      btn.disabled = true;
      const authorName = (currentUser.name && currentUser.name.trim()) || 
                         (currentUser.firstName ? `${currentUser.firstName} ${currentUser.lastName || ''}`.trim() : '') || 
                         (currentUser.username && currentUser.username.trim()) || 
                         (currentUser.email ? currentUser.email.split('@')[0] : '') || 
                         "Member";
      const userKey = currentUser.username || currentUser.email || authorName;
      const userAvatar = currentUser.avatar || null;

      const payload = {
        animeId: targetArtworkId,
        username: authorName,
        userKey,
        text,
        parentId: parseInt(parentId, 10)
      };

      try {
        const res = await fetch(`http://localhost:5000/api/anime/comments`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: 'include',
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          if (input) input.value = "";
          if (replyBox) replyBox.classList.remove("active");
          await loadDetailInteractions(targetArtworkId);
        } else {
          appendLocalCommentFallback(targetArtworkId, authorName, text, parentId, userAvatar);
          if (input) input.value = "";
          if (replyBox) replyBox.classList.remove("active");
        }
      } catch (err) {
        console.warn("Error submitting inline reply, performing local fallback:", err);
        appendLocalCommentFallback(targetArtworkId, authorName, text, parentId, userAvatar);
        if (input) input.value = "";
        if (replyBox) replyBox.classList.remove("active");
      } finally {
        btn.disabled = false;
      }
    });
  });

  // 4. Toggle Reply Container (Instagram View Replies Toggle)
  container.querySelectorAll(".comment-replies-toggle-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();

      const commentId = btn.dataset.commentId;
      const repliesContainer = document.getElementById(`replies-container-${commentId}`);
      if (repliesContainer) {
        repliesContainer.classList.toggle("collapsed");
        const isCollapsed = repliesContainer.classList.contains("collapsed");
        const count = repliesContainer.dataset.count || '';
        const textSpan = btn.querySelector(".view-replies-text");
        if (textSpan) {
          textSpan.textContent = isCollapsed ? `View replies (${count})` : `Hide replies`;
        }
      }
    });
  });

  // 5. Three-Dot Options Dropdown Toggle
  container.querySelectorAll(".comment-options-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const dropdown = btn.nextElementSibling;
      // Close other open dropdowns
      document.querySelectorAll(".comment-options-dropdown.active").forEach(d => {
        if (d !== dropdown) d.classList.remove("active");
      });
      if (dropdown) dropdown.classList.toggle("active");
    });
  });

  document.addEventListener("click", () => {
    document.querySelectorAll(".comment-options-dropdown.active").forEach(d => d.classList.remove("active"));
  });

  // 6. Report Comment Button
  container.querySelectorAll(".comment-report-btn").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      e.preventDefault();
      e.stopPropagation();

      const currentUser = localStorage.getItem("currentUser") ? JSON.parse(localStorage.getItem("currentUser")) : null;
      const userKey = currentUser ? (currentUser.username || currentUser.email) : 'guest';
      const commentId = btn.dataset.commentId;

      const reason = prompt("Report Comment:\nPlease enter a reason (e.g. Spam, Harassment, Inappropriate text):", "Inappropriate content");
      if (reason === null) return;

      try {
        const res = await fetch(`http://localhost:5000/api/anime/comments/report`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: 'include',
          body: JSON.stringify({ commentId, reason, userKey })
        });
        const data = await res.json();
        alert(data.message || "Thank you! Comment reported.");
      } catch (err) {
        console.warn("Error reporting comment:", err);
      }
    });
  });

  // 7. Block User Button
  container.querySelectorAll(".comment-block-btn").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      e.preventDefault();
      e.stopPropagation();

      const currentUser = localStorage.getItem("currentUser") ? JSON.parse(localStorage.getItem("currentUser")) : null;
      if (!currentUser) {
        showAuthRequiredModal("block users");
        return;
      }

      const blockedUserKey = btn.dataset.username;
      const userKey = currentUser.username || currentUser.email;

      if (!confirm(`Are you sure you want to block @${blockedUserKey}? Their comments will be hidden for you.`)) {
        return;
      }

      try {
        const res = await fetch(`http://localhost:5000/api/users/block`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: 'include',
          body: JSON.stringify({ userKey, blockedUserKey })
        });
        const data = await res.json();
        alert(data.message || `@${blockedUserKey} blocked.`);
        await loadDetailInteractions(activeArtworkId);
      } catch (err) {
        console.warn("Error blocking user:", err);
      }
    });
  });

  // 8. Edit Comment Button
  container.querySelectorAll(".comment-edit-btn").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      e.preventDefault();
      e.stopPropagation();

      const commentId = btn.dataset.commentId;
      const oldText = btn.dataset.text || "";
      const commentItem = btn.closest(".detail-comment-item-box");
      const textRow = commentItem ? commentItem.querySelector(".comment-text-row") : null;

      if (!textRow) return;
      if (textRow.querySelector(".inline-comment-edit-form")) return;

      const originalHTML = textRow.innerHTML;
      textRow.innerHTML = `
        <div class="inline-comment-edit-form" style="margin-top: 6px;">
          <input type="text" class="inline-edit-input" value="${escapeHTML2D(oldText)}" style="width:100%; padding:6px 10px; border-radius:10px; border:1px solid #cbd5e1; font-size:0.85rem; outline:none; box-sizing:border-box;" />
          <div style="display:flex; gap:6px; margin-top:6px; justify-content:flex-end;">
            <button type="button" class="inline-edit-cancel-btn" style="background:#f1f5f9; color:#475569; border:none; border-radius:8px; padding:4px 10px; font-size:0.78rem; font-weight:700; cursor:pointer;">Cancel</button>
            <button type="button" class="inline-edit-save-btn" style="background:#0284c7; color:#fff; border:none; border-radius:8px; padding:4px 12px; font-size:0.78rem; font-weight:700; cursor:pointer;">Save</button>
          </div>
        </div>
      `;

      const input = textRow.querySelector(".inline-edit-input");
      const cancelBtn = textRow.querySelector(".inline-edit-cancel-btn");
      const saveBtn = textRow.querySelector(".inline-edit-save-btn");

      if (input) {
        input.focus();
        const len = input.value.length;
        input.setSelectionRange(len, len);
      }

      if (cancelBtn) {
        cancelBtn.addEventListener("click", (ev) => {
          ev.preventDefault();
          textRow.innerHTML = originalHTML;
        });
      }

      if (saveBtn) {
        saveBtn.addEventListener("click", async (ev) => {
          ev.preventDefault();
          const newText = input ? input.value.trim() : '';
          if (!newText) return;

          const currentUser = localStorage.getItem("currentUser") ? JSON.parse(localStorage.getItem("currentUser")) : null;
          const userKey = currentUser ? (currentUser.username || currentUser.email) : '';
          const targetArtworkId = activeArtworkId || "2d_artwork";

          try {
            const res = await fetch(`http://localhost:5000/api/anime/comments/edit`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: 'include',
              body: JSON.stringify({ commentId, text: newText, userKey })
            });
            if (res.ok) {
              showArtToast("Comment updated!", "fa-solid fa-pen-to-square");
            } else {
              updateLocalCommentText(targetArtworkId, commentId, newText);
              showArtToast("Comment updated!", "fa-solid fa-pen-to-square");
            }
          } catch (err) {
            updateLocalCommentText(targetArtworkId, commentId, newText);
            showArtToast("Comment updated!", "fa-solid fa-pen-to-square");
          } finally {
            await loadDetailInteractions(targetArtworkId);
          }
        });
      }
    });
  });

  // 9. Delete Comment Button
  container.querySelectorAll(".comment-delete-btn").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      e.preventDefault();
      e.stopPropagation();

      const commentId = btn.dataset.commentId;
      if (!confirm("Are you sure you want to delete this comment?")) return;

      const currentUser = localStorage.getItem("currentUser") ? JSON.parse(localStorage.getItem("currentUser")) : null;
      const userKey = currentUser ? (currentUser.username || currentUser.email) : '';
      const targetArtworkId = activeArtworkId || "2d_artwork";

      try {
        const res = await fetch(`http://localhost:5000/api/anime/comments/delete`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: 'include',
          body: JSON.stringify({ commentId, userKey })
        });
        if (res.ok) {
          showArtToast("Comment deleted", "fa-solid fa-trash-can");
        } else {
          deleteLocalComment(targetArtworkId, commentId);
          showArtToast("Comment deleted", "fa-solid fa-trash-can");
        }
      } catch (err) {
        deleteLocalComment(targetArtworkId, commentId);
        showArtToast("Comment deleted", "fa-solid fa-trash-can");
      } finally {
        await loadDetailInteractions(targetArtworkId);
      }
    });
  });
}

function updateLocalCommentText(artworkId, commentId, newText) {
  try {
    const raw = localStorage.getItem(`mock_comments_${artworkId}`);
    if (!raw) return;
    let comments = JSON.parse(raw);

    const updateInArray = (arr) => {
      for (let item of arr) {
        if (item.id == commentId) {
          item.text = newText;
          return true;
        }
        if (item.replies && item.replies.length > 0) {
          if (updateInArray(item.replies)) return true;
        }
      }
      return false;
    };

    updateInArray(comments);
    localStorage.setItem(`mock_comments_${artworkId}`, JSON.stringify(comments));
  } catch (e) { }
}

function deleteLocalComment(artworkId, commentId) {
  try {
    const raw = localStorage.getItem(`mock_comments_${artworkId}`);
    if (!raw) return;
    let comments = JSON.parse(raw);

    const deleteFromArray = (arr) => {
      const idx = arr.findIndex(item => item.id == commentId);
      if (idx !== -1) {
        arr.splice(idx, 1);
        return true;
      }
      for (let item of arr) {
        if (item.replies && item.replies.length > 0) {
          if (deleteFromArray(item.replies)) return true;
        }
      }
      return false;
    };

    deleteFromArray(comments);
    localStorage.setItem(`mock_comments_${artworkId}`, JSON.stringify(comments));
  } catch (e) { }
}

// ── Art Toast Notification Helper ────────────────────────────
function showArtToast(message, iconClass = 'fa-solid fa-circle-check') {
  const toast = document.getElementById("art-toast-notification");
  const icon = document.getElementById("toast-icon");
  const msg = document.getElementById("toast-message");
  if (!toast || !msg) return;

  msg.textContent = message;
  if (icon) icon.className = iconClass;

  toast.classList.add("active");
  if (window.artToastTimeout) clearTimeout(window.artToastTimeout);
  window.artToastTimeout = setTimeout(() => {
    toast.classList.remove("active");
  }, 3000);
}

// ── Interested Preference Logic ──────────────────────────────
function isArtworkInterested(artworkId) {
  if (!artworkId) return false;
  try {
    const raw = localStorage.getItem("senpai_interested_artworks");
    if (!raw) return false;
    const data = JSON.parse(raw);
    return !!data[artworkId];
  } catch (e) {
    return false;
  }
}

function updateInterestedUI(isInterested) {
  const optBtns = [
    { btn: document.getElementById("option-interested-btn"), icon: document.getElementById("option-interested-icon"), text: document.getElementById("option-interested-text") },
    { btn: document.getElementById("mobile-option-interested-btn"), icon: document.getElementById("mobile-option-interested-icon"), text: document.getElementById("mobile-option-interested-text") },
    { btn: document.getElementById("modal-interested-btn"), icon: document.getElementById("modal-interested-icon"), text: document.getElementById("modal-interested-text") }
  ];

  optBtns.forEach(({ btn, icon, text }) => {
    if (!btn) return;
    if (isInterested) {
      btn.classList.add("is-interested");
      if (icon) icon.className = "fa-solid fa-star";
      if (text) text.textContent = "Interested ✓";
    } else {
      btn.classList.remove("is-interested");
      if (icon) icon.className = "fa-regular fa-star";
      if (text) text.textContent = "Interested";
    }
  });
}

function toggleArtworkInterested(artworkId, categoryName) {
  if (!artworkId) return;
  let interestedMap = {};
  try {
    const raw = localStorage.getItem("senpai_interested_artworks");
    if (raw) interestedMap = JSON.parse(raw) || {};
  } catch (e) { }

  const currentState = !!interestedMap[artworkId];
  const newState = !currentState;
  interestedMap[artworkId] = newState;

  localStorage.setItem("senpai_interested_artworks", JSON.stringify(interestedMap));

  try {
    let catPrefs = JSON.parse(localStorage.getItem("senpai_interested_categories") || "{}");
    const catKey = (categoryName || "general").toLowerCase();
    catPrefs[catKey] = (catPrefs[catKey] || 0) + (newState ? 1 : -1);
    if (catPrefs[catKey] < 0) catPrefs[catKey] = 0;
    localStorage.setItem("senpai_interested_categories", JSON.stringify(catPrefs));
  } catch (e) { }

  updateInterestedUI(newState);

  const charName = document.getElementById("detail-charname")?.textContent || "this artwork";
  if (newState) {
    showArtToast(`✨ Marked as Interested! We'll recommend more ${categoryName || 'similar'} art to you.`, 'fa-solid fa-star');
  } else {
    showArtToast(`Removed "${charName}" from your Interested art preferences.`, 'fa-solid fa-circle-info');
  }
}

// ── Download Image Helper ────────────────────────────────────
function downloadCurrentArtwork() {
  const img = document.getElementById("detail-main-img");
  const charName = document.getElementById("detail-charname")?.textContent || "";
  if (!img || !img.src) return;

  const fileName = (charName ? charName.toLowerCase().replace(/[^a-z0-9]/g, '_') : 'senpaiworks_artwork') + '.jpg';
  const a = document.createElement("a");
  a.href = img.src;
  a.download = fileName;
  a.target = "_blank";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  showArtToast(`Downloading high quality artwork image...`, 'fa-solid fa-download');
}

// ── About Art Modal ──────────────────────────────────────────
function openAboutArtModal() {
  const modal = document.getElementById("about-art-modal");
  if (!modal) return;

  const img = document.getElementById("detail-main-img");
  const charName = document.getElementById("detail-charname")?.textContent || "Artwork Details";
  const description = document.getElementById("detail-description")?.textContent || "No description available.";
  const categoryBadge = document.getElementById("detail-category-badge")?.textContent || "Digital Art";

  const modalImg = document.getElementById("about-art-img");
  const modalTitle = document.getElementById("about-art-title");
  const modalCategory = document.getElementById("about-art-category");
  const modalStyle = document.getElementById("about-art-style");
  const modalResolution = document.getElementById("about-art-resolution");
  const modalDesc = document.getElementById("about-art-desc");

  if (modalImg && img) modalImg.src = img.src;
  if (modalTitle) modalTitle.textContent = charName;
  if (modalCategory) modalCategory.textContent = categoryBadge;
  if (modalStyle) modalStyle.textContent = categoryBadge.includes("Charcoal") ? "Charcoal & Pencil" : categoryBadge.includes("Color") ? "Color Pencil" : "Digital Anime Illustration";
  if (modalResolution) modalResolution.textContent = "High Resolution (HD)";
  if (modalDesc) modalDesc.textContent = description;

  const isInterested = activeArtworkId ? isArtworkInterested(activeArtworkId) : false;
  updateInterestedUI(isInterested);

  modal.classList.add("active");
}

function closeAboutArtModal() {
  const modal = document.getElementById("about-art-modal");
  if (modal) modal.classList.remove("active");
}

function initDetailCardListeners() {
  const likeBtns = [document.getElementById("detail-like-btn"), document.getElementById("mobile-detail-like-btn")].filter(Boolean);
  const commentForm = document.getElementById("detail-comment-form");
  const textInput = document.getElementById("detail-comment-text");
  const shareBtns = [document.getElementById("detail-share-btn"), document.getElementById("mobile-detail-share-btn")].filter(Boolean);

  const commentShortcutBtns = [document.getElementById("detail-comment-shortcut-btn"), document.getElementById("mobile-detail-comment-shortcut-btn")].filter(Boolean);
  const commentsContainer = document.getElementById("detail-comments-container");
  const loadMoreCommentsBtn = document.getElementById("load-more-comments-btn");

  // 3-Dot Dropdown Toggles
  const moreBtns = [
    { btn: document.getElementById("detail-more-btn"), dropdown: document.getElementById("detail-more-dropdown") },
    { btn: document.getElementById("mobile-detail-more-btn"), dropdown: document.getElementById("mobile-detail-more-dropdown") }
  ];

  moreBtns.forEach(({ btn, dropdown }) => {
    if (btn && dropdown && !btn.dataset.hasListener) {
      btn.dataset.hasListener = "true";
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        document.querySelectorAll(".art-dropdown-menu.active").forEach(d => {
          if (d !== dropdown) d.classList.remove("active");
        });
        dropdown.classList.toggle("active");
      });
    }
  });

  // Global click dismiss for 3-dot dropdowns
  if (!window.hasDropdownDismissListener) {
    window.hasDropdownDismissListener = true;
    document.addEventListener("click", (e) => {
      if (!e.target.closest(".top-bar-dropdown-wrapper")) {
        document.querySelectorAll(".art-dropdown-menu.active").forEach(d => d.classList.remove("active"));
      }
    });
  }

  // Download Option Listeners
  [document.getElementById("option-download-btn"), document.getElementById("mobile-option-download-btn"), document.getElementById("modal-download-btn")].forEach(btn => {
    if (btn && !btn.dataset.hasListener) {
      btn.dataset.hasListener = "true";
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        document.querySelectorAll(".art-dropdown-menu.active").forEach(d => d.classList.remove("active"));
        downloadCurrentArtwork();
      });
    }
  });

  // About This Art Option Listeners
  [document.getElementById("option-about-btn"), document.getElementById("mobile-option-about-btn")].forEach(btn => {
    if (btn && !btn.dataset.hasListener) {
      btn.dataset.hasListener = "true";
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        document.querySelectorAll(".art-dropdown-menu.active").forEach(d => d.classList.remove("active"));
        openAboutArtModal();
      });
    }
  });

  // Interested Option Listeners
  [document.getElementById("option-interested-btn"), document.getElementById("mobile-option-interested-btn"), document.getElementById("modal-interested-btn")].forEach(btn => {
    if (btn && !btn.dataset.hasListener) {
      btn.dataset.hasListener = "true";
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        const catBadge = document.getElementById("detail-category-badge")?.textContent || "Digital Art";
        toggleArtworkInterested(activeArtworkId, catBadge);
      });
    }
  });

  // Share Option Listeners
  [document.getElementById("option-share-btn"), document.getElementById("mobile-option-share-btn")].forEach(btn => {
    if (btn && !btn.dataset.hasListener) {
      btn.dataset.hasListener = "true";
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        document.querySelectorAll(".art-dropdown-menu.active").forEach(d => d.classList.remove("active"));
        const shareBtn = document.getElementById("detail-share-btn") || btn;
        const charName = document.getElementById("detail-charname")?.textContent || "Artwork";
        const shareUrl = window.location.href;
        const shareTitle = `SenpaiWorks - ${charName}`;
        const shareText = `Check out this artwork of ${charName} on SenpaiWorks!`;
        if (window.toggleSharePopover) {
          window.toggleSharePopover(shareBtn, shareTitle, shareText, shareUrl);
        } else {
          navigator.clipboard.writeText(shareUrl);
          showArtToast("Artwork link copied to clipboard!", "fa-solid fa-link");
        }
      });
    }
  });

  // View Fullscreen / Enlarge Option Listeners
  [document.getElementById("option-enlarge-btn"), document.getElementById("mobile-option-enlarge-btn")].forEach(btn => {
    if (btn && !btn.dataset.hasListener) {
      btn.dataset.hasListener = "true";
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        document.querySelectorAll(".art-dropdown-menu.active").forEach(d => d.classList.remove("active"));
        const enlargeBtn = document.getElementById("enlarge-img-btn");
        if (enlargeBtn) enlargeBtn.click();
      });
    }
  });

  // About Art Modal Close Listeners
  const modalCloseBtn = document.getElementById("about-art-modal-close");
  const modalOverlay = document.getElementById("about-art-modal");
  if (modalCloseBtn && !modalCloseBtn.dataset.hasListener) {
    modalCloseBtn.dataset.hasListener = "true";
    modalCloseBtn.addEventListener("click", closeAboutArtModal);
  }
  if (modalOverlay && !modalOverlay.dataset.hasListener) {
    modalOverlay.dataset.hasListener = "true";
    modalOverlay.addEventListener("click", (e) => {
      if (e.target === modalOverlay) closeAboutArtModal();
    });
  }

  // Toggle comments column drawer when comment icon button is clicked
  commentShortcutBtns.forEach(btn => {
    if (btn && !btn.dataset.hasListener) {
      btn.dataset.hasListener = "true";
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();

        const cardBody = document.getElementById("detail-card-body");
        if (cardBody) {
          const isOpen = cardBody.classList.contains("comments-open");
          if (!isOpen) {
            cardBody.classList.add("comments-open");
            commentsVisibleLimit = 15;
            layoutMasonry();
            renderCommentsList(currentCommentsList);
            requestAnimationFrame(() => layoutMasonry());
          } else {
            cardBody.classList.remove("comments-open");
            layoutMasonry();
          }
        }
      });
    }
  });

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

  likeBtns.forEach(btn => {
    if (btn && !btn.dataset.hasListener) {
      btn.dataset.hasListener = "true";
      btn.addEventListener("click", async (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (!activeArtworkId) return false;

        const votedKey = `liked_artwork_${activeArtworkId}`;
        const currentlyLiked = localStorage.getItem(votedKey) === 'true';
        const action = currentlyLiked ? 'unlike' : 'like';

        const newLikedState = !currentlyLiked;
        updateLikedUI(newLikedState);

        const countEl = document.getElementById("detail-like-count");
        const mobileCountEl = document.getElementById("mobile-detail-like-count");

        try {
          const userKey = getCurrentUserKey();
          const res = await fetch(`http://localhost:5000/api/anime/likes`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: 'include',
            body: JSON.stringify({ animeId: activeArtworkId, action, userKey })
          });
          if (res.ok) {
            const data = await res.json();
            if (data && typeof data.count === 'number') {
              const formatted = formatCompactNumber(data.count);
              if (countEl) countEl.textContent = formatted;
              if (mobileCountEl) mobileCountEl.textContent = formatted;
              localStorage.setItem(`mock_likes_count_${activeArtworkId}`, data.count.toString());
              if (typeof data.userHasLiked === 'boolean') {
                updateLikedUI(data.userHasLiked);
              }
            }
          }
        } catch (err) {
          console.warn("Backend like sync warning (saved locally):", err);
          let currentNum = parseInt(localStorage.getItem(`mock_likes_count_${activeArtworkId}`) || "0", 10);
          currentNum = newLikedState ? currentNum + 1 : Math.max(0, currentNum - 1);
          const formatted = formatCompactNumber(currentNum);
          if (countEl) countEl.textContent = formatted;
          if (mobileCountEl) mobileCountEl.textContent = formatted;
          localStorage.setItem(`mock_likes_count_${activeArtworkId}`, currentNum.toString());
        }

        return false;
      });
    }
  });

  // Popover Share Card Handler (Positioned right below the share button)
  shareBtns.forEach(btn => {
    if (btn && !btn.dataset.hasShareListener) {
      btn.dataset.hasShareListener = "true";
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        const charName = document.getElementById("detail-charname")?.textContent || "Artwork";
        const shareUrl = window.location.href;
        const shareTitle = `SenpaiWorks - ${charName}`;
        const shareText = `Check out this artwork of ${charName} on SenpaiWorks!`;

        window.toggleSharePopover(btn, shareTitle, shareText, shareUrl);
      });
    }
  });

function appendLocalCommentFallback(artworkId, username, text, parentId, userAvatar) {
  const newComment = {
    id: Date.now(),
    animeId: artworkId,
    username,
    userAvatar: userAvatar || null,
    text,
    parentId: parentId ? parseInt(parentId, 10) : null,
    createdAt: new Date().toISOString(),
    likeCount: 0,
    userHasLiked: false,
    replies: []
  };

  let comments = [];
  try {
    const raw = localStorage.getItem(`mock_comments_${artworkId}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      comments = Array.isArray(parsed) ? parsed : (parsed.comments || []);
    }
  } catch (e) { }

  if (!newComment.parentId) {
    comments.unshift(newComment);
  } else {
    const parent = comments.find(c => c.id === newComment.parentId);
    if (parent) {
      if (!parent.replies) parent.replies = [];
      parent.replies.push(newComment);
    } else {
      comments.unshift(newComment);
    }
  }

  localStorage.setItem(`mock_comments_${artworkId}`, JSON.stringify(comments));
  renderCommentsList(comments);
}

  if (commentForm && textInput && !commentForm.dataset.hasSubmitListener) {
    commentForm.dataset.hasSubmitListener = "true";

    let isSubmittingComment = false;

    commentForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      e.stopPropagation();

      const currentUser = localStorage.getItem("currentUser") ? JSON.parse(localStorage.getItem("currentUser")) : null;
      if (!currentUser) {
        showAuthRequiredModal("leave a comment");
        return;
      }

      if (isSubmittingComment) return;

      const text = textInput.value.trim();
      const targetArtworkId = activeArtworkId || document.getElementById("detail-comments-container")?.dataset.artworkId || "2d_artwork";
      if (!text) return;

      isSubmittingComment = true;
      const submitBtn = commentForm.querySelector("button[type='submit']");
      if (submitBtn) submitBtn.disabled = true;

      const authorName = (currentUser.name && currentUser.name.trim()) || 
                         (currentUser.firstName ? `${currentUser.firstName} ${currentUser.lastName || ''}`.trim() : '') || 
                         (currentUser.username && currentUser.username.trim()) || 
                         (currentUser.email ? currentUser.email.split('@')[0] : '') || 
                         "Member";
      const userKey = currentUser.username || currentUser.email || authorName;
      const userAvatar = currentUser.avatar || null;

      const payload = {
        animeId: targetArtworkId,
        username: authorName,
        userKey,
        text,
        ...(activeReplyParentId && text.startsWith('@') && { parentId: activeReplyParentId })
      };

      try {
        const res = await fetch(`http://localhost:5000/api/anime/comments`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: 'include',
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          textInput.value = "";
          activeReplyParentId = null;
          await loadDetailInteractions(targetArtworkId);
        } else {
          const errData = await res.json().catch(() => ({}));
          if (res.status === 401) {
            showAuthRequiredModal("leave a comment");
            return;
          }
          appendLocalCommentFallback(targetArtworkId, authorName, text, activeReplyParentId, userAvatar);
          textInput.value = "";
          activeReplyParentId = null;
        }
      } catch (err) {
        console.warn("Backend comment sync error, performing local update:", err);
        appendLocalCommentFallback(targetArtworkId, authorName, text, activeReplyParentId, userAvatar);
        textInput.value = "";
        activeReplyParentId = null;
      } finally {
        isSubmittingComment = false;
        if (submitBtn) submitBtn.disabled = false;
      }
    });
  }
}

// ── Popover Share Card Directly Below Share Button ──────────────────────────────
window.toggleSharePopover = function(btn, shareTitle, shareText, shareUrl) {
  let existingPopover = document.getElementById("art-share-popover-card");
  if (existingPopover) {
    existingPopover.remove();
    return;
  }

  const rect = btn.getBoundingClientRect();
  const popover = document.createElement("div");
  popover.id = "art-share-popover-card";

  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedText = encodeURIComponent(shareText);

  const topPos = rect.bottom + window.scrollY + 10;
  const leftPos = Math.max(10, rect.left + window.scrollX + (rect.width / 2) - 180);

  popover.style.cssText = `
    position: absolute;
    top: ${topPos}px;
    left: ${leftPos}px;
    background: #ffffff;
    color: #0f172a;
    padding: 18px;
    border-radius: 20px;
    box-shadow: 0 16px 40px rgba(15, 23, 42, 0.25);
    z-index: 999999;
    width: 360px;
    max-width: 90vw;
    border: 1px solid #e2e8f0;
    font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;
    box-sizing: border-box;
  `;

  popover.innerHTML = `
    <!-- Upward Caret Pointer -->
    <div style="position: absolute; top: -7px; right: 24px; width: 12px; height: 12px; background: #ffffff; border-left: 1px solid #e2e8f0; border-top: 1px solid #e2e8f0; transform: rotate(45deg);"></div>

    <!-- Header Row -->
    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; padding: 0 4px;">
      <div style="font-weight: 800; font-size: 1.05rem; color: #000000;">
        Share
      </div>
      <button type="button" onclick="document.getElementById('art-share-popover-card')?.remove()" style="background: none; border: none; color: #64748b; font-size: 1.2rem; cursor: pointer; padding: 0; line-height: 1;">&times;</button>
    </div>

    <!-- Apps Grid (4 columns, 2 rows) -->
    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px 10px; margin-bottom: 16px;">
      
      <!-- 1. Copy link -->
      <div onclick="window.copyShareLinkToClipboard('${shareUrl}')" style="display: flex; flex-direction: column; align-items: center; gap: 6px; cursor: pointer;">
        <div id="share-copy-icon-bg" style="width: 50px; height: 50px; border-radius: 16px; background: #e5e5e0; display: flex; align-items: center; justify-content: center; font-size: 1.3rem; color: #0f172a; transition: all 0.2s ease;">
          <i id="share-copy-icon" class="fa-solid fa-link"></i>
        </div>
        <span id="share-copy-label" style="font-size: 0.74rem; font-weight: 600; color: #000000; text-align: center; line-height: 1.2;">Copy link</span>
      </div>

      <!-- 2. WhatsApp -->
      <a href="https://api.whatsapp.com/send?text=${encodedText}%20${encodedUrl}" target="_blank" rel="noopener" style="display: flex; flex-direction: column; align-items: center; gap: 6px; text-decoration: none;">
        <div style="width: 50px; height: 50px; border-radius: 50%; background: #25d366; color: #ffffff; display: flex; align-items: center; justify-content: center; font-size: 1.5rem;">
          <i class="fa-brands fa-whatsapp"></i>
        </div>
        <span style="font-size: 0.74rem; font-weight: 600; color: #000000; text-align: center;">WhatsApp</span>
      </a>

      <!-- 3. Instagram -->
      <div onclick="window.copyInstagramLink('${shareUrl}')" style="display: flex; flex-direction: column; align-items: center; gap: 6px; cursor: pointer;">
        <div style="width: 50px; height: 50px; border-radius: 50%; background: linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%); color: #ffffff; display: flex; align-items: center; justify-content: center; font-size: 1.4rem;">
          <i class="fa-brands fa-instagram"></i>
        </div>
        <span style="font-size: 0.74rem; font-weight: 600; color: #000000; text-align: center;">Instagram</span>
      </div>

      <!-- 4. Facebook -->
      <a href="https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}" target="_blank" rel="noopener" style="display: flex; flex-direction: column; align-items: center; gap: 6px; text-decoration: none;">
        <div style="width: 50px; height: 50px; border-radius: 50%; background: #1877f2; color: #ffffff; display: flex; align-items: center; justify-content: center; font-size: 1.4rem;">
          <i class="fa-brands fa-facebook-f"></i>
        </div>
        <span style="font-size: 0.74rem; font-weight: 600; color: #000000; text-align: center;">Facebook</span>
      </a>

      <!-- 5. X (Twitter) - Soft white/gray circle background with dark X icon -->
      <a href="https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}" target="_blank" rel="noopener" style="display: flex; flex-direction: column; align-items: center; gap: 6px; text-decoration: none;">
        <div style="width: 50px; height: 50px; border-radius: 50%; background: #f8fafc; color: #0f172a; border: 1.5px solid #cbd5e1; display: flex; align-items: center; justify-content: center; font-size: 1.3rem; box-shadow: 0 2px 6px rgba(0,0,0,0.06);">
          <i class="fa-brands fa-x-twitter"></i>
        </div>
        <span style="font-size: 0.74rem; font-weight: 600; color: #000000; text-align: center;">X</span>
      </a>

      <!-- 6. Telegram -->
      <a href="https://t.me/share/url?url=${encodedUrl}&text=${encodedText}" target="_blank" rel="noopener" style="display: flex; flex-direction: column; align-items: center; gap: 6px; text-decoration: none;">
        <div style="width: 50px; height: 50px; border-radius: 50%; background: #0284c7; color: #ffffff; display: flex; align-items: center; justify-content: center; font-size: 1.35rem;">
          <i class="fa-brands fa-telegram"></i>
        </div>
        <span style="font-size: 0.74rem; font-weight: 600; color: #000000; text-align: center;">Telegram</span>
      </a>

      <!-- 7. Reddit -->
      <a href="https://reddit.com/submit?url=${encodedUrl}&title=${encodedText}" target="_blank" rel="noopener" style="display: flex; flex-direction: column; align-items: center; gap: 6px; text-decoration: none;">
        <div style="width: 50px; height: 50px; border-radius: 50%; background: #ff4500; color: #ffffff; display: flex; align-items: center; justify-content: center; font-size: 1.4rem;">
          <i class="fa-brands fa-reddit-alien"></i>
        </div>
        <span style="font-size: 0.74rem; font-weight: 600; color: #000000; text-align: center;">Reddit</span>
      </a>

      <!-- 8. Pinterest -->
      <a href="https://pinterest.com/pin/create/button/?url=${encodedUrl}&description=${encodedText}" target="_blank" rel="noopener" style="display: flex; flex-direction: column; align-items: center; gap: 6px; text-decoration: none;">
        <div style="width: 50px; height: 50px; border-radius: 50%; background: #e60023; color: #ffffff; display: flex; align-items: center; justify-content: center; font-size: 1.35rem;">
          <i class="fa-brands fa-pinterest-p"></i>
        </div>
        <span style="font-size: 0.74rem; font-weight: 600; color: #000000; text-align: center;">Pinterest</span>
      </a>

    </div>

    <!-- Link Input Bar -->
    <div style="display: flex; align-items: center; gap: 8px; background: #f8fafc; border: 1.5px solid #cbd5e1; padding: 4px 6px 4px 12px; border-radius: 12px; margin-top: 6px;">
      <input type="text" readonly value="${shareUrl}" id="art-share-link-input" style="border: none; background: transparent; width: 100%; font-size: 0.8rem; color: #475569; outline: none; font-family: monospace;">
      <button type="button" id="btn-copy-art-link-bar" onclick="window.copyShareLinkToClipboard('${shareUrl}')" style="background: #0f172a; color: #ffffff; border: none; padding: 6px 14px; border-radius: 8px; font-weight: 700; font-size: 0.78rem; cursor: pointer; white-space: nowrap; transition: all 0.2s ease;">
        <i class="fa-solid fa-copy"></i> Copy
      </button>
    </div>
  `;

  document.body.appendChild(popover);

  setTimeout(() => {
    const clickOutsideHandler = (e) => {
      if (popover && !popover.contains(e.target) && !btn.contains(e.target)) {
        popover.remove();
        document.removeEventListener("click", clickOutsideHandler);
      }
    };
    document.addEventListener("click", clickOutsideHandler);
  }, 50);
};

window.copyShareLinkToClipboard = function(url) {
  navigator.clipboard.writeText(url).then(() => {
    const label = document.getElementById("share-copy-label");
    const iconBg = document.getElementById("share-copy-icon-bg");
    const icon = document.getElementById("share-copy-icon");
    const barBtn = document.getElementById("btn-copy-art-link-bar");

    if (label) {
      label.innerHTML = `<i class="fa-solid fa-check" style="color: #059669;"></i> Link copied!`;
      label.style.color = "#059669";
      label.style.fontWeight = "700";
    }

    if (iconBg) {
      iconBg.style.background = "#dcfce7";
      iconBg.style.color = "#059669";
    }
    if (icon) {
      icon.className = "fa-solid fa-check";
    }

    if (barBtn) {
      barBtn.style.background = "#059669";
      barBtn.innerHTML = `<i class="fa-solid fa-check"></i> Copied!`;
    }

    setTimeout(() => {
      if (label) {
        label.textContent = "Copy link";
        label.style.color = "#000000";
        label.style.fontWeight = "600";
      }
      if (iconBg) {
        iconBg.style.background = "#e5e5e0";
        iconBg.style.color = "#0f172a";
      }
      if (icon) {
        icon.className = "fa-solid fa-link";
      }
      if (barBtn) {
        barBtn.style.background = "#0f172a";
        barBtn.innerHTML = `<i class="fa-solid fa-copy"></i> Copy`;
      }
    }, 2500);
  });
};

window.copyInstagramLink = function(url) {
  window.copyShareLinkToClipboard(url);
  alert("Artwork link copied to clipboard! You can now paste it directly into your Instagram Story or Direct Message.");
};

window.closeShareModal = function() {
  const modal = document.getElementById("art-share-modal-overlay");
  if (modal) modal.remove();
};

window.copyShareLinkToClipboard = function() {
  const input = document.getElementById("art-share-link-input");
  const btn = document.getElementById("btn-copy-art-link");
  if (input) {
    navigator.clipboard.writeText(input.value).then(() => {
      if (btn) {
        btn.style.background = "#059669";
        btn.innerHTML = `<i class="fa-solid fa-check"></i> Copied!`;
        setTimeout(() => {
          btn.style.background = "#0f172a";
          btn.innerHTML = `<i class="fa-solid fa-copy"></i> Copy`;
        }, 2000);
      }
    });
  }
};

window.copyInstagramLink = function(url) {
  navigator.clipboard.writeText(url).then(() => {
    alert("Artwork link copied to clipboard! You can now paste it directly into your Instagram Story or Direct Message.");
  });
};

function updateLikedUI(isLiked) {
  const likeIcon = document.getElementById("detail-like-icon");
  const mobileLikeIcon = document.getElementById("mobile-detail-like-icon");
  const votedKey = `liked_artwork_${activeArtworkId}`;

  [likeIcon, mobileLikeIcon].forEach(icon => {
    if (icon) {
      if (isLiked) {
        icon.className = "fa-solid fa-heart";
        icon.style.color = "#ef4444";
      } else {
        icon.className = "fa-regular fa-heart";
        icon.style.color = "#111111";
      }
    }
  });

  if (isLiked) {
    localStorage.setItem(votedKey, 'true');
  } else {
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
    initDetailCardListeners();

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



  initDetailCardListeners();

  // Close details panel listener
  const backBtn = document.getElementById("detail-back-btn");
  const closeBtn = document.getElementById("detail-close-btn");
  const detailWrapper = document.getElementById("pin-detail-card-wrapper");

  const closePanel = (e) => {
    if (e) e.stopPropagation();
    if (pinPageLayout) pinPageLayout.classList.remove("detail-open");
    detailViewHistory = []; // fresh stack next time panel opens
    if (activeCardEl) {
      activeCardEl.style.display = '';
      activeCardEl.classList.remove("is-active");
      activeCardEl = null;
    }
    updateVisibleItems();

    // Always land at the same spot: just below the category filter bar,
    // instead of scrolling to wherever the last thumbnail ended up.
    setTimeout(() => {
      const filterBar = document.querySelector('.category-filter-bar');
      const target = filterBar || pinPageLayout;
      if (target) {
        const headerOffset = window.innerWidth <= 768 ? 46 : 76;
        const elementPosition = target.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
        window.scrollTo({
          top: Math.max(0, offsetPosition),
          behavior: "smooth"
        });
      }
    }, 50);
  };

  const handleBackArrowClick = (e) => {
    if (e) e.stopPropagation();
    const wentBack = goToPreviousDetailView();
    if (!wentBack) {
      closePanel(e);
    }
  };

  if (backBtn) backBtn.addEventListener("click", handleBackArrowClick);
  if (closeBtn) closeBtn.addEventListener("click", handleBackArrowClick);

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
      if (typeof closePanel === 'function') closePanel();
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
