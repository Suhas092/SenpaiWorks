// ============================================================
//  SenpaiWorks - 2D World Art Library (Pinterest UI & Lightbox Zoom)
// ============================================================


// ── State & Helpers ─────────────────────────────────────────
let activeArtworkId = null;
let activeReplyParentId = null;
let activeEditingCommentId = null;
let pendingReportCommentId = null;
let pendingBlockUsername = null;

function setEditingComment(commentId, text) {
  cancelReplyingToComment();
  activeEditingCommentId = commentId;

  const input = document.getElementById("detail-comment-text");
  const indicator = document.getElementById("edit-comment-indicator");

  if (indicator) {
    indicator.classList.add("active");
    indicator.style.display = "flex";
  }
  if (input) {
    input.value = text || "";
    input.placeholder = "Edit your comment...";
    input.focus();
    const len = input.value.length;
    input.setSelectionRange(len, len);
  }
}

function cancelEditingComment() {
  activeEditingCommentId = null;
  const input = document.getElementById("detail-comment-text");
  const indicator = document.getElementById("edit-comment-indicator");
  if (indicator) {
    indicator.classList.remove("active");
    indicator.style.display = "none";
  }
  if (input) {
    input.value = "";
    input.placeholder = "Add a comment to start the conversation...";
  }
}

function setReplyingToComment(commentId, username) {
  cancelEditingComment();
  activeReplyParentId = parseInt(commentId, 10);

  const indicator = document.getElementById("reply-comment-indicator");
  const targetUserEl = document.getElementById("reply-target-username");
  const input = document.getElementById("detail-comment-text");

  if (targetUserEl) targetUserEl.textContent = `@${username}`;
  if (indicator) {
    indicator.classList.add("active");
    indicator.style.display = "flex";
  }

  if (input) {
    input.placeholder = `Reply to @${username}...`;
    input.value = `@${username} `;
    input.focus();
    const len = input.value.length;
    input.setSelectionRange(len, len);
  }
}

function cancelReplyingToComment() {
  activeReplyParentId = null;
  const indicator = document.getElementById("reply-comment-indicator");
  const input = document.getElementById("detail-comment-text");
  if (indicator) {
    indicator.classList.remove("active");
    indicator.style.display = "none";
  }
  if (input) {
    if (input.value.startsWith('@')) input.value = "";
    input.placeholder = "Add a comment to start the conversation...";
  }
}

function openReportDialog(commentId) {
  pendingReportCommentId = commentId;
  const modal = document.getElementById("report-dialog-overlay");
  if (modal) modal.classList.add("active");
}

function closeReportDialog() {
  pendingReportCommentId = null;
  const modal = document.getElementById("report-dialog-overlay");
  if (modal) modal.classList.remove("active");
}

function openBlockDialog(username) {
  pendingBlockUsername = username;
  const modal = document.getElementById("block-dialog-overlay");
  const title = document.getElementById("block-dialog-title");
  if (title) title.textContent = `Block @${username}?`;
  if (modal) modal.classList.add("active");
}

function closeBlockDialog() {
  pendingBlockUsername = null;
  const modal = document.getElementById("block-dialog-overlay");
  if (modal) modal.classList.remove("active");
}

function getCurrentUser() {
  try {
    const raw = localStorage.getItem("currentUser");
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

function getAuthToken() {
  try {
    return localStorage.getItem("userToken") || sessionStorage.getItem("userToken") || "";
  } catch (e) {
    return "";
  }
}

function getCurrentUserKey() {
  const user = getCurrentUser();
  return user ? (user.username || user.email || "") : "";
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

let heroSearchQuery = "";

// ── Update Visibility & Fill Empty Spaces ──────
function updateVisibleItems() {
  const grid = document.getElementById("pinterest-grid");
  if (!grid) return;

  if (activeCategory === 'all' && !heroSearchQuery) {
    const items = Array.from(grid.querySelectorAll(".pinterest-item"));
    shuffleArray(items);
    items.forEach(item => grid.appendChild(item));
  }

  const items = Array.from(grid.querySelectorAll(".pinterest-item"));
  const cleanQuery = (heroSearchQuery || "").toLowerCase().trim();
  let visibleCount = 0;

  items.forEach(item => {
    const itemCat = item.getAttribute("data-category") || "";
    const charName = (item.getAttribute("data-charname") || item.querySelector(".pinterest-title")?.textContent || "").toLowerCase();
    const artist = (item.getAttribute("data-artist") || "").toLowerCase();
    const source = (item.getAttribute("data-source") || "").toLowerCase();

    const matchCategory = activeCategory === 'all' || itemCat === activeCategory;
    const matchSearch = !cleanQuery || charName.includes(cleanQuery) || artist.includes(cleanQuery) || source.includes(cleanQuery);

    if (matchCategory && matchSearch) {
      if (item === activeCardEl) {
        item.style.display = 'none'; // Temporarily removed from collection while open in detail view
      } else if (visibleLimit > 0 && visibleCount >= visibleLimit) {
        item.style.display = 'none';
      } else {
        item.style.display = '';
        visibleCount++;
      }

      if (cleanQuery && (charName.includes(cleanQuery) || artist.includes(cleanQuery) || source.includes(cleanQuery))) {
        item.classList.add("search-highlighted");
      } else {
        item.classList.remove("search-highlighted");
      }
    } else {
      item.style.display = 'none';
      item.classList.remove("search-highlighted");
    }
  });

  // Update the search results count badge
  const countBadge = document.getElementById("art-search-result-count");
  if (countBadge) {
    if (cleanQuery) {
      countBadge.textContent = visibleCount === 0
        ? "No results found"
        : `${visibleCount} result${visibleCount !== 1 ? 's' : ''} found`;
      countBadge.style.display = "block";
    } else {
      countBadge.style.display = "none";
    }
  }

  layoutMasonry();
}

// ── Non-Blocking Fast API Fetch Handler ──────────────────────
async function fetchAndRenderDatabaseArtworks(grid) {
  const renderList = (artworksList) => {
    artworksList.forEach((art) => {
      const item = document.createElement("div");
      item.className = "pinterest-item";
      item.setAttribute("data-db-id", art.id);
      item.setAttribute("data-downloads", art.downloadCount || 0);
      item.setAttribute("data-category", art.category);
      item.setAttribute("data-charname", art.charname);
      item.setAttribute("data-artist", art.artist || "SenpaiWorks Official");
      item.setAttribute("data-source", art.source || "SenpaiWorks Original");
      item.setAttribute("data-sex", art.sex || "Female");
      item.setAttribute("data-artstyle", art.artstyle || "Digital Art");
      item.setAttribute("data-software", art.software || "Photoshop");
      item.setAttribute("data-description", art.description || "");
      item.setAttribute("data-about-desc", art.aboutDesc || "");
      item.setAttribute("data-created-at", art.createdAt || "");

      item.innerHTML = `
        <img src="${escapeHTML2D(art.img)}" alt="${escapeHTML2D(art.charname)}" loading="lazy" />
        <div class="pinterest-info">
          <p class="pinterest-title">${escapeHTML2D(art.charname)}</p>
          <p class="pinterest-category">${escapeHTML2D(art.category.replace("-", " ").replace(/\b\w/g, c => c.toUpperCase()))}</p>
        </div>
      `;
      grid.insertBefore(item, grid.firstChild);
    });

    initPinterestHoverShareButtons();
    updateVisibleItems();
  };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const res = await fetch("/api/artworks", { signal: controller.signal, cache: "no-store" });
    clearTimeout(timeoutId);

    if (!res.ok) throw new Error("Failed to fetch artworks");
    const resData = await res.json();
    const artworks = Array.isArray(resData) ? resData : (resData.artworks || []);
    
    try {
      localStorage.setItem("cached_artworks", JSON.stringify(artworks));
    } catch(e) {}

    renderList(artworks);
  } catch (err) {
    console.warn("Backend API not reachable; falling back to cached artworks:", err.message);
    try {
      const stored = localStorage.getItem("cached_artworks");
      if (stored) {
        const artworks = JSON.parse(stored);
        renderList(artworks);
      }
    } catch(e) {}
  }
}

function initPinterestHoverShareButtons() {
  const items = document.querySelectorAll(".pinterest-item");
  items.forEach(item => {
    if (!item.querySelector(".pin-hover-share-btn")) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "pin-hover-share-btn";
      btn.title = "Share Artwork";
      btn.innerHTML = `<i class="fa-solid fa-arrow-up-from-bracket"></i>`;

      btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        const charName = item.getAttribute("data-charname") || item.querySelector(".pinterest-title")?.textContent || "Artwork";
        const shareUrl = window.location.href;
        const shareTitle = `SenpaiWorks - ${charName}`;
        const shareText = `Check out this artwork of ${charName} on SenpaiWorks!`;
        if (window.toggleSharePopover) {
          window.toggleSharePopover(btn, shareTitle, shareText, shareUrl);
        }
      });

      item.appendChild(btn);
    }
  });
}

// ── Open Artwork Detail Card Modal ──────────────────────────
function openDetailCard(img, cardEl, addToHistory = true) {
  const previousCardEl = activeCardEl; // capture BEFORE it gets reassigned below

  // When opening a card while a search is active, clear the search and
  // switch to the clicked item's full category so all thumbnails are visible
  if (heroSearchQuery) {
    const clickedParent = cardEl || img.closest('.pinterest-item');
    const clickedCat = clickedParent ? clickedParent.getAttribute("data-category") : null;

    heroSearchQuery = "";
    const heroInput = document.getElementById("art-hero-search-input");
    const heroClear = document.getElementById("art-hero-search-clear");
    const countBadge = document.getElementById("art-search-result-count");
    if (heroInput) heroInput.value = "";
    if (heroClear) heroClear.style.display = "none";
    if (countBadge) countBadge.style.display = "none";

    if (clickedCat) {
      activeCategory = clickedCat;
      const container = document.querySelector(".category-filter-bar");
      if (container) {
        container.querySelectorAll('.filter-btn').forEach(btn => {
          if (btn.dataset.filter === clickedCat) {
            btn.classList.add('active');
          } else {
            btn.classList.remove('active');
          }
        });
      }
    }
  }

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
  cancelEditingComment();
  cancelReplyingToComment();
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

  cancelReplyingToComment();
  cancelEditingComment();
  document.getElementById("art-emoji-picker-popover")?.classList.remove("active");

  loadDetailInteractions(artworkId);
  initDetailCardListeners();
  updateDownloadButtonStates();

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

// ── Fetch & Render Likes and Comments ──────────────────────
async function loadDetailInteractions(artworkId) {
  activeArtworkId = artworkId;

  const container = document.getElementById("detail-comments-container");
  if (container) {
    container.dataset.artworkId = artworkId;
  }

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

  if (!isUserSignedIn()) {
    // Logged-out: blank out both counts and show the lock card — no data exposed
    if (likeCount) likeCount.textContent = "";
    if (mobileLikeCount) mobileLikeCount.textContent = "";
    const commentsCountLabel = document.getElementById("detail-comments-count-label");
    const commentsShortcutCount = document.getElementById("detail-comments-shortcut-count");
    const mobileCommentsShortcutCount = document.getElementById("mobile-detail-comments-shortcut-count");
    if (commentsCountLabel) commentsCountLabel.textContent = "";
    if (commentsShortcutCount) commentsShortcutCount.textContent = "";
    if (mobileCommentsShortcutCount) mobileCommentsShortcutCount.textContent = "";
    renderCommentsList([]);
    return;
  }

  let rawCount = 0;

  try {
    const userKey = getCurrentUserKey();
    const fetchUrl = `/api/anime/likes?animeId=${artworkId}` + (userKey ? `&userKey=${encodeURIComponent(userKey)}` : '');
    const res = await fetch(fetchUrl, {
      credentials: 'include'
    });
    if (res.ok) {
      const data = await res.json();
      rawCount = typeof data.count === 'number' ? data.count : parseInt(data.count || 0, 10);
      if (typeof data.userHasLiked === 'boolean') {
        updateLikedUI(data.userHasLiked);
      }
    } else {
      rawCount = 0;
    }
  } catch (err) {
    rawCount = 0;
  }

  const formattedCount = formatCompactNumber(rawCount);
  if (likeCount) likeCount.textContent = formattedCount;
  if (mobileLikeCount) mobileLikeCount.textContent = formattedCount;

  try {
    const token = getAuthToken();
    const commentsUrl = `/api/anime/comments?animeId=${artworkId}`;
    const res = await fetch(commentsUrl, {
      credentials: 'include',
      headers: {
        ...(token ? { "Authorization": `Bearer ${token}` } : {})
      }
    });
    if (res.ok) {
      const data = await res.json();
      const comments = Array.isArray(data) ? data : (data.comments || []);
      renderCommentsList(comments);
    } else {
      renderCommentsList([]);
    }
  } catch (err) {
    renderCommentsList([]);
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

  const currentUser = getCurrentUser();
  const currentUsername = currentUser ? (currentUser.username || currentUser.email || currentUser.name || "").toLowerCase().trim() : "";
  const currentUserId = currentUser ? currentUser.id : null;
  const commentUsername = (c.username || "").toLowerCase().trim();
  const commentUserKey = (c.userKey || "").toLowerCase().trim();

  const isMyComment = Boolean(currentUser && (
    (c.userId && currentUserId && c.userId === currentUserId) ||
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
    <div class="detail-comment-item-box ${isChild ? 'is-reply-item' : ''}" data-comment-id="${c.id}" data-username="${escapeHTML2D(c.username)}">
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
          <span class="comment-likes-label" data-count="${likeCount}" style="${likeCount > 0 ? '' : 'display:none;'}">${formatCompactNumber(likeCount)} ${likeCount === 1 ? 'like' : 'likes'}</span>
          <button type="button" class="comment-action-btn comment-reply-toggle-btn" data-comment-id="${c.id}" data-username="${escapeHTML2D(c.username)}">Reply</button>
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
  if (isUserSignedIn()) {
    if (commentsCountLabel) commentsCountLabel.textContent = `${totalCount}`;
    if (commentsShortcutCount) commentsShortcutCount.textContent = `${totalCount}`;
    if (mobileCommentsShortcutCount) mobileCommentsShortcutCount.textContent = `${totalCount}`;
  }

  // Auth check for commenting and viewing comments
  const currentUser = getCurrentUser();

  if (!currentUser) {
    if (commentForm) commentForm.style.display = "none";
    const quickEmojiBar = document.getElementById("comment-quick-emojis-bar");
    if (quickEmojiBar) quickEmojiBar.style.display = "none";
    if (loadMoreCommentsBtn) loadMoreCommentsBtn.style.display = "none";
    if (commentsList) {
      commentsList.innerHTML = `
        <div class="comments-auth-lock-card" style="background: rgba(15, 23, 42, 0.03); border: 1.5px dashed rgba(15, 23, 42, 0.2); border-radius: 14px; padding: 28px 16px; text-align: center; margin: 12px 0;">
          <div style="width: 44px; height: 44px; background: rgba(15, 23, 42, 0.08); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 10px auto; color: #0f172a; font-size: 1.1rem;">
            <i class="fa-solid fa-lock"></i>
          </div>
          <h4 style="font-size: 0.95rem; font-weight: 700; color: #0f172a; margin: 0 0 6px 0;">Sign in to view comments</h4>
          <p style="font-size: 0.8rem; color: #64748b; margin: 0 0 14px 0; line-height: 1.4;">Comments are visible only to verified members.</p>
          <button type="button" onclick="showAuthRequiredModal('view and post comments')" style="background: #0f172a; color: #fff; border: none; border-radius: 20px; padding: 7px 20px; font-weight: 700; font-size: 0.82rem; cursor: pointer; transition: all 0.2s ease;">Sign In</button>
        </div>
      `;
    }
    layoutMasonry();
    return;
  }

  if (commentForm) commentForm.style.display = "flex";
  const quickEmojiBar = document.getElementById("comment-quick-emojis-bar");
  if (quickEmojiBar) quickEmojiBar.style.display = "flex";

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
  // 1. Comment Liking (Instant optimistic count & heart icon update on click)
  container.querySelectorAll(".comment-like-btn").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      e.preventDefault();
      e.stopPropagation();

      const currentUser = getCurrentUser();
      if (!currentUser) {
        showAuthRequiredModal("like comments");
        return;
      }

      const commentId = btn.dataset.commentId;
      const wasLiked = btn.classList.contains("liked");
      const action = wasLiked ? 'unlike' : 'like';

      // Instant optimistic UI update on heart icon
      const icon = btn.querySelector("i");
      btn.classList.toggle("liked", !wasLiked);
      if (icon) icon.className = !wasLiked ? "fa-solid fa-heart" : "fa-regular fa-heart";

      // Instant optimistic update on like count label
      const commentBox = btn.closest(".detail-comment-item-box");
      const countLabel = commentBox ? commentBox.querySelector(".comment-likes-label") : null;
      let currentCount = countLabel ? parseInt(countLabel.dataset.count || "0", 10) : 0;
      if (isNaN(currentCount)) currentCount = 0;

      const newCount = !wasLiked ? currentCount + 1 : Math.max(0, currentCount - 1);
      if (countLabel) {
        countLabel.dataset.count = newCount;
        countLabel.textContent = `${formatCompactNumber(newCount)} ${newCount === 1 ? 'like' : 'likes'}`;
        countLabel.style.display = newCount > 0 ? "inline" : "none";
      }

      try {
        const token = getAuthToken();
        const res = await fetch(`/api/anime/comments/like`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { "Authorization": `Bearer ${token}` } : {})
          },
          credentials: 'include',
          body: JSON.stringify({ commentId, action })
        });
        if (res.ok) {
          const data = await res.json();
          if (countLabel && typeof data.likeCount === 'number') {
            countLabel.dataset.count = data.likeCount;
            countLabel.textContent = `${formatCompactNumber(data.likeCount)} ${data.likeCount === 1 ? 'like' : 'likes'}`;
            countLabel.style.display = data.likeCount > 0 ? "inline" : "none";
          }
        } else if (res.status === 401) {
          btn.classList.toggle("liked", wasLiked);
          if (icon) icon.className = wasLiked ? "fa-solid fa-heart" : "fa-regular fa-heart";
          showAuthRequiredModal("like comments");
        }
      } catch (err) {
        console.warn("Error liking comment:", err);
      }
    });
  });

  // 2. Reply Toggle Button (Activates reply mode in the bottom conversation bar)
  container.querySelectorAll(".comment-reply-toggle-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();

      const currentUser = getCurrentUser();
      if (!currentUser) {
        showAuthRequiredModal("reply to comments");
        return;
      }

      const commentId = btn.dataset.commentId;
      const targetUsername = btn.dataset.username || "user";
      setReplyingToComment(commentId, targetUsername);
    });
  });

  // 3. Toggle Reply Container (Instagram View Replies Toggle)
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

  // 4. Three-Dot Options Dropdown Toggle
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

  // 5. Report Comment Button (Opens custom report modal)
  container.querySelectorAll(".comment-report-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      document.querySelectorAll(".comment-options-dropdown.active").forEach(d => d.classList.remove("active"));
      const commentId = btn.dataset.commentId;
      openReportDialog(commentId);
    });
  });

  // 6. Block User Button (Opens custom block confirmation modal)
  container.querySelectorAll(".comment-block-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      document.querySelectorAll(".comment-options-dropdown.active").forEach(d => d.classList.remove("active"));
      const blockedUserKey = btn.dataset.username;
      openBlockDialog(blockedUserKey);
    });
  });

  // 7. Edit Comment Button (Switches bottom conversation input into edit mode)
  container.querySelectorAll(".comment-edit-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();

      // Close open dropdown menus
      document.querySelectorAll(".comment-options-dropdown.active").forEach(d => d.classList.remove("active"));

      const commentId = btn.dataset.commentId;
      const oldText = btn.dataset.text || "";
      setEditingComment(commentId, oldText);
    });
  });

  // 8. Delete Comment Button (Instant deletion with smooth UI animation, no confirmation prompt)
  container.querySelectorAll(".comment-delete-btn").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      e.preventDefault();
      e.stopPropagation();

      const commentId = btn.dataset.commentId;
      const commentBox = btn.closest(".detail-comment-item-box");

      // Immediate UI deletion animation (no browser confirm popup)
      if (commentBox) {
        commentBox.classList.add("comment-deleting");
      }

      const currentUser = getCurrentUser();
      const targetArtworkId = activeArtworkId || document.getElementById("detail-comments-container")?.dataset.artworkId || "2d_artwork";

      try {
        const res = await fetch(`/api/anime/comments/delete`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(getAuthToken() ? { "Authorization": `Bearer ${getAuthToken()}` } : {})
          },
          credentials: 'include',
          body: JSON.stringify({ commentId })
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          showArtToast(errData.error || "Failed to delete comment");
          if (commentBox) commentBox.classList.remove("comment-deleting");
          return;
        }

        if (commentBox) {
          commentBox.style.maxHeight = commentBox.offsetHeight + "px";
          commentBox.style.overflow = "hidden";
          commentBox.style.transition = "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)";
          requestAnimationFrame(() => {
            commentBox.style.maxHeight = "0px";
            commentBox.style.opacity = "0";
            commentBox.style.paddingTop = "0px";
            commentBox.style.paddingBottom = "0px";
            commentBox.style.marginTop = "0px";
            commentBox.style.marginBottom = "0px";
          });

          setTimeout(() => {
            commentBox.remove();
            updateCommentCountsUI(-1);
          }, 320);
        }

        deleteLocalComment(targetArtworkId, commentId);
        showArtToast("Comment deleted");
      } catch (err) {
        console.warn("Delete comment error:", err);
        if (commentBox) {
          commentBox.remove();
          updateCommentCountsUI(-1);
        }
        deleteLocalComment(targetArtworkId, commentId);
        showArtToast("Comment deleted");
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

function updateCommentCountsUI(delta) {
  const countEls = [
    document.getElementById("detail-comments-count-label"),
    document.getElementById("detail-comments-shortcut-count"),
    document.getElementById("mobile-detail-comments-shortcut-count")
  ];
  countEls.forEach(el => {
    if (el) {
      const current = parseInt(el.textContent || "0", 10);
      const next = Math.max(0, current + delta);
      el.textContent = `${next}`;
    }
  });
}

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
  updateCommentCountsUI(1);
}

// ── Art Toast Notification Helper ────────────────────────────
function showArtToast(message, iconClass = null) {
  const toast = document.getElementById("art-toast-notification");
  const icon = document.getElementById("toast-icon");
  const msg = document.getElementById("toast-message");
  if (!toast || !msg) return;

  // Strip any emoji characters if present
  const cleanMsg = (message || '').replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '').trim();
  msg.textContent = cleanMsg;

  if (icon) {
    if (iconClass) {
      icon.className = iconClass;
      icon.style.display = "inline-block";
    } else {
      icon.style.display = "none";
    }
  }

  toast.classList.add("active");
  if (window.artToastTimeout) clearTimeout(window.artToastTimeout);
  window.artToastTimeout = setTimeout(() => {
    toast.classList.remove("active");
  }, 2500);
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

  // Sync Interest Count to Backend API
  fetch("/api/artworks/interest", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ artworkId, action: newState ? "interest" : "uninterest" })
  }).catch(() => { });

  const charName = document.getElementById("detail-charname")?.textContent || "this artwork";
  if (newState) {
    showArtToast("Marked as Interested");
  } else {
    showArtToast("Removed from Interested");
  }
}

function isUserSignedIn() {
  try {
    const raw = localStorage.getItem("currentUser") || sessionStorage.getItem("currentUser");
    if (!raw) return false;
    const u = JSON.parse(raw);
    return Boolean(u && (u.username || u.email || u.id || u.name));
  } catch (e) {
    return false;
  }
}

// ── Download Image Helper ────────────────────────────────────
function downloadCurrentArtwork() {
  if (!isUserSignedIn()) {
    showArtToast("Please sign in to download artwork images");
    return;
  }

  const img = document.getElementById("detail-main-img");
  const charName = document.getElementById("detail-charname")?.textContent || "";
  if (!img || !img.src) return;

  const dbId = activeCardEl ? activeCardEl.getAttribute("data-db-id") : null;
  if (dbId) {
    fetch(`/api/artworks/${dbId}/download`, { method: "POST" }).catch(() => { });
  }

  const fileName = (charName ? charName.toLowerCase().replace(/[^a-z0-9]/g, '_') : 'senpaiworks_artwork') + '.jpg';
  const a = document.createElement("a");
  a.href = img.src;
  a.download = fileName;
  a.target = "_blank";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  showArtToast("Downloading high quality artwork image...");
}

function updateDownloadButtonStates() {
  const signedIn = isUserSignedIn();
  const downloadBtns = [
    document.getElementById("option-download-btn"),
    document.getElementById("mobile-option-download-btn"),
    document.getElementById("modal-download-btn")
  ].filter(Boolean);

  downloadBtns.forEach(btn => {
    if (!signedIn) {
      btn.classList.add("disabled-download");
      btn.title = "Sign in required to download image";
    } else {
      btn.classList.remove("disabled-download");
      btn.title = "Download Image";
    }
  });
}

function setFieldOrHide(rowId, valId, val) {
  const row = document.getElementById(rowId);
  const valEl = document.getElementById(valId);
  const cleanVal = (val || "").trim();

  if (!row) return;

  if (cleanVal && cleanVal !== "N/A" && cleanVal !== "null" && cleanVal !== "undefined") {
    if (valEl) valEl.textContent = cleanVal;
    row.style.display = "";
  } else {
    row.style.display = "none";
  }
}

function openAboutArtModal() {
  const modal = document.getElementById("about-art-modal");
  if (!modal) return;

  const charName = document.getElementById("detail-charname")?.textContent || "Artwork Details";
  const description = activeCardEl ? (activeCardEl.getAttribute("data-description") || document.getElementById("detail-description")?.textContent || "") : (document.getElementById("detail-description")?.textContent || "");
  const categoryBadge = document.getElementById("detail-category-badge")?.textContent || "";

  const modalTitle = document.getElementById("about-art-title");

  const cardArtist = activeCardEl ? (activeCardEl.getAttribute("data-artist") || "") : "";
  const cardSource = activeCardEl ? (activeCardEl.getAttribute("data-source") || "") : "";
  const cardSex = activeCardEl ? (activeCardEl.getAttribute("data-sex") || "") : "";
  const cardArtstyle = activeCardEl ? (activeCardEl.getAttribute("data-artstyle") || "") : "";
  const cardAboutDesc = activeCardEl ? (activeCardEl.getAttribute("data-about-desc") || "") : "";
  const cardCreatedAt = activeCardEl ? (activeCardEl.getAttribute("data-created-at") || "") : "";

  let formattedDate = "";
  if (cardCreatedAt) {
    try {
      formattedDate = new Date(cardCreatedAt).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
    } catch (e) { }
  }

  if (modalTitle) modalTitle.textContent = charName;

  // Dynamically display field only if entered in admin, hide if empty/not entered
  setFieldOrHide("row-about-artist", "about-art-artist", cardArtist);
  setFieldOrHide("row-about-created-at", "about-art-created-at", formattedDate);
  setFieldOrHide("row-about-category", "about-art-category", categoryBadge);
  setFieldOrHide("row-about-style", "about-art-style", cardArtstyle);
  setFieldOrHide("row-about-source", "about-art-source", cardSource);
  setFieldOrHide("row-about-sex", "about-art-sex", cardSex);
  setFieldOrHide("row-about-desc", "about-art-desc", description);
  setFieldOrHide("row-about-about-desc", "about-art-about-desc", cardAboutDesc);

  const isInterested = activeArtworkId ? isArtworkInterested(activeArtworkId) : false;
  updateInterestedUI(isInterested);
  updateDownloadButtonStates();

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
          showArtToast("Artwork link copied to clipboard");
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

  // Full Emoji Picker Library Handler (emoji-picker-element)
  const emojiBtn = document.getElementById("comment-emoji-btn");
  const pickerPopover = document.getElementById("art-emoji-picker-popover");
  const pickerEl = document.getElementById("art-emoji-picker");
  const pickerCloseBtn = document.getElementById("art-emoji-picker-close");

  if (emojiBtn && pickerPopover) {
    if (!emojiBtn.dataset.hasPickerListener) {
      emojiBtn.dataset.hasPickerListener = "true";
      emojiBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        pickerPopover.classList.toggle("active");
      });
    }

    if (pickerCloseBtn && !pickerCloseBtn.dataset.hasListener) {
      pickerCloseBtn.dataset.hasListener = "true";
      pickerCloseBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        pickerPopover.classList.remove("active");
      });
    }

    if (pickerEl && !pickerEl.dataset.hasListener) {
      pickerEl.dataset.hasListener = "true";
      pickerEl.addEventListener("emoji-click", (e) => {
        const emoji = e.detail?.unicode || (e.detail?.emoji && e.detail.emoji.unicode) || "";
        if (emoji && textInput) {
          textInput.value += emoji;
          textInput.focus();
          const len = textInput.value.length;
          textInput.setSelectionRange(len, len);
        }
      });
    }

    if (!window.hasEmojiPickerDismissListener) {
      window.hasEmojiPickerDismissListener = true;
      document.addEventListener("click", (e) => {
        const pop = document.getElementById("art-emoji-picker-popover");
        const btn = document.getElementById("comment-emoji-btn");
        if (pop && pop.classList.contains("active")) {
          if (!pop.contains(e.target) && btn && !btn.contains(e.target)) {
            pop.classList.remove("active");
          }
        }
      });
    }
  }

  // Instagram-style Quick Emoji Reaction Bar Click Handlers
  document.querySelectorAll(".quick-emoji-btn").forEach(btn => {
    if (!btn.dataset.hasListener) {
      btn.dataset.hasListener = "true";
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        const emoji = btn.dataset.emoji || btn.textContent.trim();
        if (textInput) {
          textInput.value += emoji;
          textInput.focus();
          const len = textInput.value.length;
          textInput.setSelectionRange(len, len);
        }
      });
    }
  });

  likeBtns.forEach(btn => {
    if (btn && !btn.dataset.hasListener) {
      btn.dataset.hasListener = "true";
      btn.addEventListener("click", async (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (!activeArtworkId) return false;

        const currentUser = getCurrentUser();
        if (!currentUser) {
          showAuthRequiredModal("like artworks");
          return false;
        }

        const votedKey = `liked_artwork_${activeArtworkId}`;
        const currentlyLiked = localStorage.getItem(votedKey) === 'true';
        const action = currentlyLiked ? 'unlike' : 'like';

        const newLikedState = !currentlyLiked;
        updateLikedUI(newLikedState);

        const countEl = document.getElementById("detail-like-count");
        const mobileCountEl = document.getElementById("mobile-detail-like-count");

        try {
          const token = getAuthToken();
          const res = await fetch(`/api/anime/likes`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(token ? { "Authorization": `Bearer ${token}` } : {})
            },
            credentials: 'include',
            body: JSON.stringify({ animeId: activeArtworkId, action })
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
          } else if (res.status === 401) {
            updateLikedUI(currentlyLiked);
            showAuthRequiredModal("like artworks");
          }
        } catch (err) {
          console.warn("Backend like sync warning:", err);
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

  // Cancel Reply & Edit Comment Button Handlers
  const cancelReplyBtn = document.getElementById("cancel-reply-comment-btn");
  if (cancelReplyBtn && !cancelReplyBtn.dataset.hasListener) {
    cancelReplyBtn.dataset.hasListener = "true";
    cancelReplyBtn.addEventListener("click", (e) => {
      e.preventDefault();
      cancelReplyingToComment();
    });
  }

  const cancelEditBtn = document.getElementById("cancel-edit-comment-btn");
  if (cancelEditBtn && !cancelEditBtn.dataset.hasListener) {
    cancelEditBtn.dataset.hasListener = "true";
    cancelEditBtn.addEventListener("click", (e) => {
      e.preventDefault();
      cancelEditingComment();
    });
  }

  if (textInput && !textInput.dataset.hasEscListener) {
    textInput.dataset.hasEscListener = "true";
    textInput.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        if (activeEditingCommentId) cancelEditingComment();
        if (activeReplyParentId) cancelReplyingToComment();
      }
    });
  }

  // Report Dialog Actions
  const reportCancelBtn = document.getElementById("report-dialog-cancel-btn");
  const reportCloseBtn = document.getElementById("report-dialog-close-btn");
  const reportSubmitBtn = document.getElementById("report-dialog-submit-btn");
  const reportOverlay = document.getElementById("report-dialog-overlay");

  [reportCancelBtn, reportCloseBtn].forEach(b => {
    if (b && !b.dataset.hasListener) {
      b.dataset.hasListener = "true";
      b.addEventListener("click", (e) => { e.preventDefault(); closeReportDialog(); });
    }
  });
  if (reportOverlay && !reportOverlay.dataset.hasListener) {
    reportOverlay.dataset.hasListener = "true";
    reportOverlay.addEventListener("click", (e) => {
      if (e.target === reportOverlay) closeReportDialog();
    });
  }

  if (reportSubmitBtn && !reportSubmitBtn.dataset.hasListener) {
    reportSubmitBtn.dataset.hasListener = "true";
    reportSubmitBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      if (!pendingReportCommentId) return;

      const selected = document.querySelector('input[name="report_reason"]:checked');
      const reason = selected ? selected.value : 'Inappropriate content';
      const commentId = pendingReportCommentId;
      closeReportDialog();

      const currentUser = getCurrentUser();
      const userKey = currentUser ? (currentUser.username || currentUser.email) : 'guest';

      try {
        await fetch(`/api/anime/comments/report`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: 'include',
          body: JSON.stringify({ commentId, reason, userKey })
        });
        showArtToast("Comment reported");
      } catch (err) {
        showArtToast("Comment reported");
      }
    });
  }

  // Block Dialog Actions
  const blockCancelBtn = document.getElementById("block-dialog-cancel-btn");
  const blockCloseBtn = document.getElementById("block-dialog-close-btn");
  const blockConfirmBtn = document.getElementById("block-dialog-confirm-btn");
  const blockOverlay = document.getElementById("block-dialog-overlay");

  [blockCancelBtn, blockCloseBtn].forEach(b => {
    if (b && !b.dataset.hasListener) {
      b.dataset.hasListener = "true";
      b.addEventListener("click", (e) => { e.preventDefault(); closeBlockDialog(); });
    }
  });
  if (blockOverlay && !blockOverlay.dataset.hasListener) {
    blockOverlay.dataset.hasListener = "true";
    blockOverlay.addEventListener("click", (e) => {
      if (e.target === blockOverlay) closeBlockDialog();
    });
  }

  if (blockConfirmBtn && !blockConfirmBtn.dataset.hasListener) {
    blockConfirmBtn.dataset.hasListener = "true";
    blockConfirmBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      const currentUser = getCurrentUser();
      if (!currentUser) {
        closeBlockDialog();
        showAuthRequiredModal("block users");
        return;
      }

      if (!pendingBlockUsername) return;
      const blockedUserKey = pendingBlockUsername;
      const userKey = currentUser.username || currentUser.email;
      closeBlockDialog();

      try {
        await fetch(`/api/users/block`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: 'include',
          body: JSON.stringify({ userKey, blockedUserKey })
        });
        showArtToast(`@${blockedUserKey} blocked`);
        await loadDetailInteractions(activeArtworkId);
      } catch (err) {
        showArtToast(`@${blockedUserKey} blocked`);
        await loadDetailInteractions(activeArtworkId);
      }
    });
  }

  if (commentForm && textInput && !commentForm.dataset.hasSubmitListener) {
    commentForm.dataset.hasSubmitListener = "true";

    let isSubmittingComment = false;

    commentForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      e.stopPropagation();

      const currentUser = getCurrentUser();
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
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i>`;
      }

      const authorName = (currentUser.name && currentUser.name.trim()) ||
        (currentUser.firstName ? `${currentUser.firstName} ${currentUser.lastName || ''}`.trim() : '') ||
        (currentUser.username && currentUser.username.trim()) ||
        (currentUser.email ? currentUser.email.split('@')[0] : '') ||
        "Member";
      const userAvatar = currentUser.avatar || null;

      // Check if we are currently editing an existing comment
      if (activeEditingCommentId) {
        const editingId = activeEditingCommentId;
        cancelEditingComment();

        try {
          const res = await fetch(`/api/anime/comments/edit`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(getAuthToken() ? { "Authorization": `Bearer ${getAuthToken()}` } : {})
            },
            credentials: 'include',
            body: JSON.stringify({ commentId: editingId, text })
          });

          if (res.ok) {
            showArtToast("Comment updated");
            await loadDetailInteractions(targetArtworkId);
          } else {
            const errData = await res.json().catch(() => ({}));
            showArtToast(errData.error || "Failed to edit comment");
            if (res.status !== 403 && res.status !== 401) {
              updateLocalCommentText(targetArtworkId, editingId, text);
              await loadDetailInteractions(targetArtworkId);
            }
          }
        } catch (err) {
          console.warn("Backend comment edit error:", err);
          updateLocalCommentText(targetArtworkId, editingId, text);
          showArtToast("Comment updated");
          await loadDetailInteractions(targetArtworkId);
        } finally {
          isSubmittingComment = false;
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = `<i class="fa-solid fa-arrow-up"></i>`;
          }
        }
        return;
      }

      // Clear input immediately for normal new comment or reply
      textInput.value = "";
      const replyParent = activeReplyParentId;
      if (activeReplyParentId) {
        cancelReplyingToComment();
      }

      const payload = {
        animeId: targetArtworkId,
        text,
        ...(replyParent && { parentId: replyParent })
      };

      try {
        const res = await fetch(`/api/anime/comments`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(getAuthToken() ? { "Authorization": `Bearer ${getAuthToken()}` } : {})
          },
          credentials: 'include',
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          showArtToast(replyParent ? "Reply posted" : "Comment posted");
          await loadDetailInteractions(targetArtworkId);
        } else {
          const errData = await res.json().catch(() => ({}));
          if (res.status === 401) {
            showAuthRequiredModal("leave a comment");
            return;
          }
          if (res.status === 403) {
            showArtToast(errData.error || "Forbidden");
            return;
          }
          appendLocalCommentFallback(targetArtworkId, authorName, text, replyParent, userAvatar);
          showArtToast(replyParent ? "Reply posted" : "Comment posted");
        }
      } catch (err) {
        console.warn("Backend comment sync error, performing local update:", err);
        appendLocalCommentFallback(targetArtworkId, authorName, text, replyParent, userAvatar);
        showArtToast(replyParent ? "Reply posted" : "Comment posted");
      } finally {
        isSubmittingComment = false;
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = `<i class="fa-solid fa-arrow-up"></i>`;
        }
      }
    });
  }
}

// ── Popover Share Card Directly Below Share Button ──────────────────────────────
window.toggleSharePopover = function (btn, shareTitle, shareText, shareUrl) {
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

  const popoverWidth = 340;
  const viewportWidth = window.innerWidth;

  // Calculate left position centered under button & clamp strictly within viewport
  let leftPos = rect.left + window.scrollX + (rect.width / 2) - (popoverWidth / 2);
  const minLeft = window.scrollX + 16;
  const maxLeft = window.scrollX + viewportWidth - popoverWidth - 16;
  leftPos = Math.max(minLeft, Math.min(maxLeft, leftPos));

  const topPos = rect.bottom + window.scrollY + 10;

  // Dynamic caret pointer calculation pointing to trigger button center
  const btnCenterX = rect.left + window.scrollX + (rect.width / 2);
  const caretLeft = Math.max(20, Math.min(popoverWidth - 28, btnCenterX - leftPos));

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
    width: ${popoverWidth}px;
    max-width: calc(100vw - 32px);
    border: 1px solid #e2e8f0;
    font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;
    box-sizing: border-box;
  `;

  popover.innerHTML = `
    <!-- Dynamic Caret Pointer -->
    <div style="position: absolute; top: -7px; left: ${caretLeft}px; width: 12px; height: 12px; background: #ffffff; border-left: 1px solid #e2e8f0; border-top: 1px solid #e2e8f0; transform: rotate(45deg);"></div>

    <!-- Header Row -->
    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; padding: 0 4px;">
      <div style="font-weight: 800; font-size: 1.05rem; color: #000000;">
        Share
      </div>
      <button type="button" onclick="document.getElementById('art-share-popover-card')?.remove()" style="background: none; border: none; color: #64748b; font-size: 1.2rem; cursor: pointer; padding: 0; line-height: 1;">&times;</button>
    </div>

    <!-- Apps Grid -->
    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px 10px; margin-bottom: 16px;">
      
      <!-- 1. WhatsApp -->
      <a href="https://api.whatsapp.com/send?text=${encodedText}%20${encodedUrl}" target="_blank" rel="noopener" style="display: flex; flex-direction: column; align-items: center; gap: 6px; text-decoration: none;">
        <div style="width: 50px; height: 50px; border-radius: 50%; background: #25d366; color: #ffffff; display: flex; align-items: center; justify-content: center; font-size: 1.5rem;">
          <i class="fa-brands fa-whatsapp"></i>
        </div>
        <span style="font-size: 0.74rem; font-weight: 600; color: #000000; text-align: center;">WhatsApp</span>
      </a>

      <!-- 2. Instagram -->
      <div onclick="window.copyInstagramLink('${shareUrl}')" style="display: flex; flex-direction: column; align-items: center; gap: 6px; cursor: pointer;">
        <div style="width: 50px; height: 50px; border-radius: 50%; background: linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%); color: #ffffff; display: flex; align-items: center; justify-content: center; font-size: 1.4rem;">
          <i class="fa-brands fa-instagram"></i>
        </div>
        <span style="font-size: 0.74rem; font-weight: 600; color: #000000; text-align: center;">Instagram</span>
      </div>

      <!-- 3. Facebook -->
      <a href="https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}" target="_blank" rel="noopener" style="display: flex; flex-direction: column; align-items: center; gap: 6px; text-decoration: none;">
        <div style="width: 50px; height: 50px; border-radius: 50%; background: #1877f2; color: #ffffff; display: flex; align-items: center; justify-content: center; font-size: 1.4rem;">
          <i class="fa-brands fa-facebook-f"></i>
        </div>
        <span style="font-size: 0.74rem; font-weight: 600; color: #000000; text-align: center;">Facebook</span>
      </a>

      <!-- 4. X (Twitter) -->
      <a href="https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}" target="_blank" rel="noopener" style="display: flex; flex-direction: column; align-items: center; gap: 6px; text-decoration: none;">
        <div style="width: 50px; height: 50px; border-radius: 50%; background: #f8fafc; color: #0f172a; border: 1.5px solid #cbd5e1; display: flex; align-items: center; justify-content: center; font-size: 1.3rem; box-shadow: 0 2px 6px rgba(0,0,0,0.06);">
          <i class="fa-brands fa-x-twitter"></i>
        </div>
        <span style="font-size: 0.74rem; font-weight: 600; color: #000000; text-align: center;">X</span>
      </a>

      <!-- 5. Telegram -->
      <a href="https://t.me/share/url?url=${encodedUrl}&text=${encodedText}" target="_blank" rel="noopener" style="display: flex; flex-direction: column; align-items: center; gap: 6px; text-decoration: none;">
        <div style="width: 50px; height: 50px; border-radius: 50%; background: #0284c7; color: #ffffff; display: flex; align-items: center; justify-content: center; font-size: 1.35rem;">
          <i class="fa-brands fa-telegram"></i>
        </div>
        <span style="font-size: 0.74rem; font-weight: 600; color: #000000; text-align: center;">Telegram</span>
      </a>

      <!-- 6. Reddit -->
      <a href="https://reddit.com/submit?url=${encodedUrl}&title=${encodedText}" target="_blank" rel="noopener" style="display: flex; flex-direction: column; align-items: center; gap: 6px; text-decoration: none;">
        <div style="width: 50px; height: 50px; border-radius: 50%; background: #ff4500; color: #ffffff; display: flex; align-items: center; justify-content: center; font-size: 1.4rem;">
          <i class="fa-brands fa-reddit-alien"></i>
        </div>
        <span style="font-size: 0.74rem; font-weight: 600; color: #000000; text-align: center;">Reddit</span>
      </a>

      <!-- 7. Pinterest -->
      <a href="https://pinterest.com/pin/create/button/?url=${encodedUrl}&description=${encodedText}" target="_blank" rel="noopener" style="display: flex; flex-direction: column; align-items: center; gap: 6px; text-decoration: none;">
        <div style="width: 50px; height: 50px; border-radius: 50%; background: #e60023; color: #ffffff; display: flex; align-items: center; justify-content: center; font-size: 1.35rem;">
          <i class="fa-brands fa-pinterest-p"></i>
        </div>
        <span style="font-size: 0.74rem; font-weight: 600; color: #000000; text-align: center;">Pinterest</span>
      </a>

    </div>

    <!-- Full-Width Copy Link Button with Micro-Animation & Toast Message -->
    <button type="button" id="btn-copy-art-link-bar" onclick="window.copyShareLinkToClipboard('${shareUrl}')" style="width: 100%; background: #0f172a; color: #ffffff; border: none; padding: 12px 16px; border-radius: 14px; font-weight: 700; font-size: 0.88rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1); margin-top: 4px; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.2);" onmousedown="this.style.transform='scale(0.95)'" onmouseup="this.style.transform='scale(1)'" onmouseleave="this.style.transform='scale(1)'">
      <i id="btn-copy-art-icon" class="fa-solid fa-link"></i>
      <span id="btn-copy-art-text">Copy Link</span>
    </button>
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

window.copyShareLinkToClipboard = function (url) {
  const barBtn = document.getElementById("btn-copy-art-link-bar");
  const barIcon = document.getElementById("btn-copy-art-icon");
  const barText = document.getElementById("btn-copy-art-text");

  if (barBtn) {
    barBtn.style.transform = "scale(0.95)";
    setTimeout(() => { barBtn.style.transform = "scale(1)"; }, 120);
  }

  const applySuccessState = () => {
    if (barBtn) {
      barBtn.style.background = "#059669";
    }
    if (barIcon) {
      barIcon.className = "fa-solid fa-check";
    }
    if (barText) {
      barText.textContent = "Link is copied!";
    }

    if (typeof showArtToast === 'function') {
      showArtToast("Link copied to clipboard");
    }

    setTimeout(() => {
      if (barBtn) {
        barBtn.style.background = "#0f172a";
      }
      if (barIcon) {
        barIcon.className = "fa-solid fa-link";
      }
      if (barText) {
        barText.textContent = "Copy Link";
      }
    }, 2500);
  };

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(url).then(applySuccessState).catch(() => {
      fallbackCopyText(url);
      applySuccessState();
    });
  } else {
    fallbackCopyText(url);
    applySuccessState();
  }
};

function fallbackCopyText(text) {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  try {
    document.execCommand("copy");
  } catch (e) { }
  document.body.removeChild(textarea);
}

window.copyInstagramLink = function (url) {
  window.copyShareLinkToClipboard(url);
  alert("Artwork link copied to clipboard! You can now paste it directly into your Instagram Story or Direct Message.");
};

window.closeShareModal = function () {
  const modal = document.getElementById("art-share-modal-overlay");
  if (modal) modal.remove();
};

window.copyShareLinkToClipboard = function () {
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

window.copyInstagramLink = function (url) {
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

  // Transparent Hero Search Bar Setup
  const heroSearchInput = document.getElementById("art-hero-search-input");
  const heroSearchClear = document.getElementById("art-hero-search-clear");

  if (heroSearchInput) {
    heroSearchInput.addEventListener("input", (e) => {
      const val = e.target.value;
      if (heroSearchClear) {
        heroSearchClear.style.display = val.trim() ? "inline-block" : "none";
      }
      handleHeroSearchInput(val);
    });
  }

  if (heroSearchClear) {
    heroSearchClear.addEventListener("click", () => {
      if (heroSearchInput) heroSearchInput.value = "";
      heroSearchClear.style.display = "none";
      handleHeroSearchInput("");
    });
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
    cancelEditingComment();
    cancelReplyingToComment();
    document.getElementById("art-emoji-picker-popover")?.classList.remove("active");
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

  // Expose closePanel globally so category buttons & search can close the preview
  window.closeDetailPanel = closePanel;

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

  const lightboxShareBtn = document.getElementById("lightbox-share-btn");
  if (lightboxShareBtn) {
    lightboxShareBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const charName = document.getElementById("detail-charname")?.textContent || "Artwork";
      const shareUrl = window.location.href;
      const shareTitle = `SenpaiWorks - ${charName}`;
      const shareText = `Check out this artwork of ${charName} on SenpaiWorks!`;
      if (window.toggleSharePopover) {
        window.toggleSharePopover(lightboxShareBtn, shareTitle, shareText, shareUrl);
      }
    });
  }

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

  // Load dynamic categories from backend API & bind filter buttons
  loadDynamicCategories();

  // Calculate layout on resize
  window.addEventListener('resize', () => {
    updateVisibleItems();
  });

  // Infinite scroll listener to progressively reveal batches as user scrolls down
  window.addEventListener('scroll', () => {
    if ((window.innerHeight + window.scrollY) >= (document.documentElement.scrollHeight - 600)) {
      const items = Array.from(document.querySelectorAll("#pinterest-grid .pinterest-item"));
      if (visibleLimit > 0 && visibleLimit < items.length) {
        visibleLimit += getBatchSize();
        updateVisibleItems();
      }
    }
  }, { passive: true });

  window.addEventListener('load', () => layoutMasonry());

  // Fast layout refresh sequence for immediate image rendering
  [10, 50, 150, 300, 600, 1000].forEach(delay => {
    setTimeout(() => layoutMasonry(), delay);
  });
});

function handleHeroSearchInput(query) {
  heroSearchQuery = (query || "").trim();
  const cleanQuery = heroSearchQuery.toLowerCase();

  const grid = document.getElementById("pinterest-grid");
  const container = document.querySelector(".category-filter-bar");

  // Silently close detail panel without scrolling, so the user can keep typing
  const pinPageLayout = document.getElementById("pin-page-layout");
  if (pinPageLayout && pinPageLayout.classList.contains("detail-open")) {
    pinPageLayout.classList.remove("detail-open");
    if (typeof activeCardEl !== 'undefined' && activeCardEl) {
      activeCardEl.style.display = '';
      activeCardEl.classList.remove("is-active");
      activeCardEl = null;
    }
  }

  if (cleanQuery && grid) {
    const items = Array.from(grid.querySelectorAll(".pinterest-item"));
    const match = items.find(item => {
      const charName = (item.getAttribute("data-charname") || item.querySelector(".pinterest-title")?.textContent || "").toLowerCase();
      const artist = (item.getAttribute("data-artist") || "").toLowerCase();
      const source = (item.getAttribute("data-source") || "").toLowerCase();
      return charName.includes(cleanQuery) || artist.includes(cleanQuery) || source.includes(cleanQuery);
    });

    if (match) {
      const matchCat = match.getAttribute("data-category");
      if (matchCat && container) {
        activeCategory = matchCat;
        const filterBtns = container.querySelectorAll('.filter-btn');
        filterBtns.forEach(btn => {
          if (btn.dataset.filter === matchCat) {
            btn.classList.add('active');
          } else {
            btn.classList.remove('active');
          }
        });
      }
    }
  } else if (!cleanQuery && container) {
    // When search is cleared, reset to "All" category
    activeCategory = 'all';
    const filterBtns = container.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
      if (btn.dataset.filter === 'all') {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  updateVisibleItems();
}

async function loadDynamicCategories() {
  const container = document.querySelector(".category-filter-bar");
  if (!container) return;

  try {
    const res = await fetch("/api/categories");
    if (!res.ok) return;
    const categories = await res.json();

    if (categories && categories.length > 0) {
      let html = `<button class="filter-btn ${activeCategory === 'all' ? 'active' : ''}" data-filter="all">All</button>`;
      categories.forEach(cat => {
        const isAct = activeCategory === cat.slug;
        html += `<button class="filter-btn ${isAct ? 'active' : ''}" data-filter="${escapeHTML2D(cat.slug)}">${escapeHTML2D(cat.name)}</button>`;
      });
      container.innerHTML = html;
    }

    // Bind event listeners to dynamic filter buttons
    const filterBtns = container.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeCategory = btn.dataset.filter || 'all';

        // Clear search query on category button click so category displays cleanly
        heroSearchQuery = "";
        const heroInput = document.getElementById("art-hero-search-input");
        const heroClear = document.getElementById("art-hero-search-clear");
        if (heroInput) heroInput.value = "";
        if (heroClear) heroClear.style.display = "none";

        visibleLimit = getInitialLimit();
        if (typeof window.closeDetailPanel === 'function') {
          window.closeDetailPanel();
        }
        updateVisibleItems();
      });
    });

    // Auto-filter by URL hash if present
    const hashCategory = window.location.hash.replace('#', '');
    if (hashCategory) {
      const targetFilterBtn = container.querySelector(`.filter-btn[data-filter="${hashCategory}"]`);
      if (targetFilterBtn) {
        setTimeout(() => targetFilterBtn.click(), 50);
      }
    }
  } catch (e) {
    console.error("Error loading dynamic categories in art library:", e);
  }
}
