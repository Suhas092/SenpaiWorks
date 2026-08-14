"use strict";

// State Management
let filters = {
  search: "",
  category: "all",
  priceRange: "all",
  software: [],
  format: [],
  rating: 0,
  isNew: false,
  freePaid: "all"
};

let currentSort = "featured";

// Instant Non-Blocking Store Page Initialization Handler
function initStoreProductsPage() {
  try {
    initSearchHeader();
    initSidebarFilters();
    initSorting();
    initSaleIsOnSlideshow();
  } catch (err) {
    console.warn("Init header/filters notice:", err);
  }

  // 1. Render local catalog IMMEDIATELY (0ms - zero wait time!)
  renderProducts();

  // 2. Non-blocking async check for backend database products
  if (window.dbProductsPromise) {
    window.dbProductsPromise.then(() => {
      renderProducts();
    }).catch(() => { });
  }

  window.addEventListener("productsUpdated", () => renderProducts());
  window.addEventListener("storage", (e) => {
    if (e.key === "admin_custom_products") renderProducts();
  });

  // Auto-filter store products by URL params or Hash (e.g. ?category=Hoodies or ?category=Oversized%20T-Shirts or #merchandise)
  const urlParams = new URLSearchParams(window.location.search);
  const paramCat = urlParams.get("category");
  const hash = window.location.hash.replace('#', '');

  if (paramCat) {
    if (typeof filterByStoreCategory === 'function') {
      filterByStoreCategory(paramCat);
    } else {
      filters.category = paramCat;
      renderProducts();
    }
  } else if (hash) {
    if (hash === 'merchandise') {
      if (typeof filterByStoreCategory === 'function') filterByStoreCategory('Merchandise');
    } else if (hash === 'hoodies') {
      if (typeof filterByStoreCategory === 'function') filterByStoreCategory('Hoodies');
    } else if (hash === 'tshirts' || hash === 'oversized-tshirts') {
      if (typeof filterByStoreCategory === 'function') filterByStoreCategory('Oversized T-Shirts');
    } else if (hash === '3d-models') {
      if (typeof filterByStoreCategory === 'function') filterByStoreCategory('3D Assets');
    } else if (hash === 'courses') {
      if (typeof filterByStoreCategory === 'function') filterByStoreCategory('Digital Courses');
    } else if (hash === 'all-categories') {
      if (typeof filterByStoreCategory === 'function') filterByStoreCategory('all');
    }
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initStoreProductsPage);
} else {
  initStoreProductsPage();
}

// Helper to show sidebar when a filter is applied
function showSidebarOnFilter() {
  const sidebar = document.getElementById("main-filters-sidebar");
  if (sidebar) {
    sidebar.style.display = "block";
  }
}

// 1. Initialize Search Header
function initSearchHeader() {
  const categorySelect = document.getElementById("search-category-select");
  const searchInput = document.getElementById("search-bar-input");
  const searchBtn = document.getElementById("search-bar-btn");

  if (categorySelect) {
    categorySelect.addEventListener("change", (e) => {
      filters.category = e.target.value;
      updateSidebarCategorySelection(filters.category);
      showSidebarOnFilter();
      renderProducts();
    });
  }

  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      filters.search = e.target.value.trim().toLowerCase();
      if (filters.search !== "") {
        showSidebarOnFilter();
      }
      renderProducts();
    });

    searchInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        showSidebarOnFilter();
        renderProducts();
      }
    });
  }

  if (searchBtn) {
    searchBtn.addEventListener("click", () => {
      showSidebarOnFilter();
      renderProducts();
    });
  }
}

// Update left sidebar category link highlighting based on top dropdown
function updateSidebarCategorySelection(selectedCategory) {
  const categoryLinks = document.querySelectorAll(".filter-category-link");
  categoryLinks.forEach(link => {
    const val = link.getAttribute("data-value");
    if (val === selectedCategory) {
      link.classList.add("active");
    } else {
      link.classList.remove("active");
    }
  });
}

// 2. Initialize Sidebar Filters
function initSidebarFilters() {
  // Mobile drawer toggle
  const mobileFilterOpenBtn = document.getElementById("mobile-filter-open-btn");
  const mobileFilterCloseBtn = document.getElementById("mobile-filter-close-btn");
  const sidebar = document.querySelector(".store-filters-sidebar");

  if (mobileFilterOpenBtn && sidebar) {
    mobileFilterOpenBtn.addEventListener("click", () => {
      sidebar.classList.add("mobile-active");
    });
  }

  if (mobileFilterCloseBtn && sidebar) {
    mobileFilterCloseBtn.addEventListener("click", () => {
      sidebar.classList.remove("mobile-active");
    });
  }

  // Category links
  const categoryLinks = document.querySelectorAll(".filter-category-link");
  categoryLinks.forEach(link => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const val = link.getAttribute("data-value");
      filters.category = val;

      // Sync top header search category dropdown
      const topSelect = document.getElementById("search-category-select");
      if (topSelect) {
        topSelect.value = val;
      }

      categoryLinks.forEach(l => l.classList.remove("active"));
      link.classList.add("active");

      renderProducts();
    });
  });

  // Price range quick links
  const priceRangeBtns = document.querySelectorAll(".price-range-btn");
  priceRangeBtns.forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const range = btn.getAttribute("data-range");
      filters.priceRange = range;

      priceRangeBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      renderProducts();
    });
  });

  // Free/Paid ratio buttons
  const freePaidRadios = document.getElementsByName("free-paid-filter");
  freePaidRadios.forEach(radio => {
    radio.addEventListener("change", (e) => {
      filters.freePaid = e.target.value;
      renderProducts();
    });
  });

  // Software checkboxes
  const softwareCheckboxes = document.querySelectorAll(".software-checkbox");
  softwareCheckboxes.forEach(cb => {
    cb.addEventListener("change", () => {
      const selected = [];
      softwareCheckboxes.forEach(c => {
        if (c.checked) selected.push(c.value);
      });
      filters.software = selected;
      renderProducts();
    });
  });

  // Format checkboxes
  const formatCheckboxes = document.querySelectorAll(".format-checkbox");
  formatCheckboxes.forEach(cb => {
    cb.addEventListener("change", () => {
      const selected = [];
      formatCheckboxes.forEach(c => {
        if (c.checked) selected.push(c.value);
      });
      filters.format = selected;
      renderProducts();
    });
  });

  // Rating quick filter links
  const ratingLinks = document.querySelectorAll(".filter-rating-link");
  ratingLinks.forEach(link => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const stars = parseFloat(link.getAttribute("data-rating"));

      if (link.classList.contains("active")) {
        filters.rating = 0;
        link.classList.remove("active");
      } else {
        ratingLinks.forEach(l => l.classList.remove("active"));
        filters.rating = stars;
        link.classList.add("active");
      }

      renderProducts();
    });
  });

  // New Releases Toggle
  const newReleasesCheckbox = document.getElementById("filter-new-releases");
  if (newReleasesCheckbox) {
    newReleasesCheckbox.addEventListener("change", (e) => {
      filters.isNew = e.target.checked;
      renderProducts();
    });
  }

  // Clear filters
  const resetBtn = document.getElementById("clear-filters-btn");
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      // Clear values
      filters = {
        search: "",
        category: "all",
        priceRange: "all",
        software: [],
        format: [],
        rating: 0,
        isNew: false,
        freePaid: "all"
      };

      // Reset DOM elements
      const topSelect = document.getElementById("search-category-select");
      if (topSelect) topSelect.value = "all";

      const searchInput = document.getElementById("search-bar-input");
      if (searchInput) searchInput.value = "";

      categoryLinks.forEach(l => l.classList.remove("active"));
      const allCatLink = document.querySelector(".filter-category-link[data-value='all']");
      if (allCatLink) allCatLink.classList.add("active");

      priceRangeBtns.forEach(b => b.classList.remove("active"));
      const allPriceBtn = document.querySelector(".price-range-btn[data-range='all']");
      if (allPriceBtn) allPriceBtn.classList.add("active");

      const allFreePaidRadio = document.getElementById("fp-all");
      if (allFreePaidRadio) allFreePaidRadio.checked = true;

      softwareCheckboxes.forEach(c => c.checked = false);
      formatCheckboxes.forEach(c => c.checked = false);
      ratingLinks.forEach(l => l.classList.remove("active"));

      if (newReleasesCheckbox) newReleasesCheckbox.checked = false;

      renderProducts();
    });
  }
}

// 3. Initialize Sorting
function initSorting() {
  const sortSelect = document.getElementById("store-sort-select");
  if (sortSelect) {
    sortSelect.addEventListener("change", (e) => {
      currentSort = e.target.value;
      renderProducts();
    });
  }
}

// Pagination / Load More State Management
function getColumnsCount() {
  const width = window.innerWidth;
  if (width >= 1024) return 4;
  if (width >= 768) return 3;
  if (width >= 480) return 2;
  return 1;
}

function getInitialItemLimit() {
  const cols = getColumnsCount();
  const width = window.innerWidth;
  if (width >= 1024) {
    return 3 * cols; // 4 columns x 3 rows = 12 items (Desktop/Laptop)
  }
  return 5 * cols; // 5 rows x cols (15, 10, 5 items)
}

let visibleLimit = getInitialItemLimit();
let isLimitManuallyExpanded = false;

// 4. Render Products Grid
// 4. Render Products Grid
function renderProducts() {
  const grid = document.querySelector(".product-grid");
  const countEl = document.getElementById("results-count");
  if (!grid) return;

  const productList = window.PRODUCTS || (typeof PRODUCTS !== "undefined" ? PRODUCTS : []);

  // Filter products safely
  let filtered = productList.filter(prod => {
    if (!prod) return false;

    // Search query filter
    if (filters.search) {
      const q = filters.search;
      const matchName = (prod.name || "").toLowerCase().includes(q);
      const matchDesc = (prod.description || "").toLowerCase().includes(q);
      const matchSubCat = (prod.subCategory || "").toLowerCase().includes(q);
      const matchCreator = (prod.creator || "").toLowerCase().includes(q);
      const matchSoftware = prod.software && Array.isArray(prod.software) ? prod.software.some(s => (s || "").toLowerCase().includes(q)) : false;
      const matchFormat = prod.format && Array.isArray(prod.format) ? prod.format.some(f => (f || "").toLowerCase().includes(q)) : false;

      if (!matchName && !matchDesc && !matchSubCat && !matchCreator && !matchSoftware && !matchFormat) {
        return false;
      }
    }

    // Category filter
    if (filters.category !== "all") {
      const matchCat = typeof isProductInCategory === "function" ? isProductInCategory(prod, filters.category) : (prod.category === filters.category || prod.subCategory === filters.category);
      if (!matchCat) return false;
    }

    // Price range filter
    if (filters.priceRange !== "all") {
      const pr = filters.priceRange;
      const pPrice = prod.price || 0;
      if (pr === "free" && pPrice > 0) return false;
      if (pr === "under-15" && (pPrice === 0 || pPrice > 15)) return false;
      if (pr === "15-30" && (pPrice < 15 || pPrice > 30)) return false;
      if (pr === "30-50" && (pPrice < 30 || pPrice > 50)) return false;
      if (pr === "above-50" && pPrice < 50) return false;
    }

    // Free / Paid toggle filter
    if (filters.freePaid !== "all") {
      const pPrice = prod.price || 0;
      if (filters.freePaid === "free" && pPrice > 0) return false;
      if (filters.freePaid === "paid" && pPrice === 0) return false;
    }

    // Software compatibility filter
    if (filters.software.length > 0) {
      const hasCompat = prod.software && Array.isArray(prod.software) && filters.software.some(s => prod.software.includes(s));
      if (!hasCompat) return false;
    }

    // File format filter
    if (filters.format.length > 0) {
      const hasFormat = prod.format && Array.isArray(prod.format) && filters.format.some(f => prod.format.includes(f));
      if (!hasFormat) return false;
    }

    // Rating filter
    if (filters.rating > 0 && (prod.rating || 0) < filters.rating) {
      return false;
    }

    // New releases filter
    if (filters.isNew && !prod.isNew) {
      return false;
    }

    return true;
  });

  // Sort products
  filtered.sort((a, b) => {
    if (currentSort === "featured") {
      const valA = a.badge === "Best Seller" ? 2 : (a.badge === "Limited Edition" ? 1 : 0);
      const valB = b.badge === "Best Seller" ? 2 : (b.badge === "Limited Edition" ? 1 : 0);
      return valB - valA;
    }
    if (currentSort === "newest") {
      return (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0);
    }
    if (currentSort === "bestselling") {
      return (b.ratingCount || 0) - (a.ratingCount || 0);
    }
    if (currentSort === "rating") {
      return (b.rating || 0) - (a.rating || 0);
    }
    if (currentSort === "price-asc") {
      return (a.price || 0) - (b.price || 0);
    }
    if (currentSort === "price-desc") {
      return (b.price || 0) - (a.price || 0);
    }
    return 0;
  });

  // Update counts
  if (countEl) {
    countEl.textContent = `${filtered.length} product${filtered.length === 1 ? "" : "s"} found`;
  }

  // Populate Grid
  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="store-no-results">
        <i class="fa-solid fa-folder-open"></i>
        <h3>No matching assets found</h3>
        <p>Try resetting some filters or searching for different keywords.</p>
      </div>
    `;
    const loadMoreWrap = document.getElementById("load-more-wrap");
    if (loadMoreWrap) loadMoreWrap.style.display = "none";
    return;
  }

  grid.innerHTML = filtered.map(prod => {
    const subLabel = prod.subCategory || prod.category || (prod.type === 'physical' ? 'Merchandise' : 'Digital Asset');
    let badgeMarkup = prod.badge ? `<span class="prod-badge badge-custom">${prod.badge}</span>` : "";
    let outOfStockOverlay = "";
    if (prod.available === false || (prod.type === 'physical' && prod.stockQuantity <= 0)) {
      badgeMarkup = `<span class="prod-badge badge-custom" style="background: #ef4444; color: #fff;">Unavailable</span>`;
      outOfStockOverlay = `<div style="position: absolute; top:0; left:0; width:100%; height:100%; background: rgba(15, 23, 42, 0.6); display: flex; align-items: center; justify-content: center; z-index: 10; border-radius: inherit; pointer-events: none;"><span style="background: #ef4444; color: #fff; padding: 6px 14px; border-radius: 6px; font-weight: 800; transform: rotate(-5deg); text-transform: uppercase; letter-spacing: 1px;">Out of Stock</span></div>`;
    }
    let formattedPrice = "";
    let originalPriceMarkup = "";
    let discountBadgeMarkup = "";

    const price = prod.price || 899;
    formattedPrice = `₹${price.toLocaleString('en-IN')}`;
    const origVal = prod.originalPrice ? prod.originalPrice : Math.round(price * 1.6);
    originalPriceMarkup = `<span class="prod-original-price">₹${origVal.toLocaleString('en-IN')}</span>`;
    const discountPct = Math.round(((origVal - price) / origVal) * 100);
    discountBadgeMarkup = `<span class="prod-discount-badge">${discountPct}% OFF</span>`;

    let userWishlist = [];
    try {
      userWishlist = JSON.parse(localStorage.getItem("userWishlist")) || [];
    } catch (e) { }
    const isWishlisted = userWishlist.some(w => (prod.id && w.id === prod.id) || w.name === prod.name);

    let savedRevs = [];
    try {
      const raw = localStorage.getItem("user_reviews_" + prod.id);
      if (raw) savedRevs = JSON.parse(raw);
    } catch (e) { }
    const baseRevs = Array.isArray(prod.reviews) ? prod.reviews : [];
    const allRevs = [...savedRevs, ...baseRevs];
    const calcCount = allRevs.length > 0 ? allRevs.length : (prod.ratingCount || 48);
    const calcSum = allRevs.reduce((acc, r) => acc + (Number(r.rating) || 5), 0);
    const calcAvg = allRevs.length > 0 ? (calcSum / allRevs.length).toFixed(1) : (prod.rating || 5.0).toFixed(1);

    const swatchesMarkup = prod.colorVariants && Array.isArray(prod.colorVariants) && prod.colorVariants.length > 0 ? `
      <div class="prod-color-swatches">
        ${prod.colorVariants.map(variant => `
          <button type="button" 
                  class="color-swatch-dot" 
                  style="background-color: ${variant.colorCode || variant.hex || '#000'};" 
                  title="${variant.name || ''}"
                  onclick="changeCardColorImage(event, '${prod.id}', '${(variant.img || '').replace(/'/g, "\\'")}')"></button>
        `).join("")}
      </div>
    ` : '';

    return `
      <div class="product-card ${prod.type || 'digital'}">
        <div class="prod-img-wrap" style="position: relative;">
          ${outOfStockOverlay}
          <a href="store-detail.html?id=${prod.id}">
            <img src="${prod.img || 'assets/SenpaiWorks logo.png'}" alt="${prod.name || 'Product'}">
          </a>
          <div class="prod-badges-row">
            ${badgeMarkup}
            ${discountBadgeMarkup}
          </div>
        </div>
        <div class="prod-body">
          <h3 class="prod-title"><a href="store-detail.html?id=${prod.id}">${prod.name || 'Untitled Asset'}</a></h3>
          <div class="prod-sub-row" style="display: flex; align-items: center; justify-content: space-between;">
            <span class="prod-sub-text">${subLabel}</span>
            <span style="font-size: 0.78rem; color: #f59e0b; font-weight: 700;"><i class="fa-solid fa-star"></i> ${calcAvg} (${calcCount})</span>
          </div>
          <div class="prod-price-row">
            <span class="prod-price">${formattedPrice}</span>
            ${originalPriceMarkup}
          </div>
          ${swatchesMarkup}
        </div>
      </div>
    `;
  }).join("");
}

// Global Wishlist toggle for Product Cards in Store Page
window.toggleCardWishlist = function (event, prodId) {
  if (event) {
    event.stopPropagation();
    event.preventDefault();
  }
  const productList = window.PRODUCTS || (typeof PRODUCTS !== "undefined" ? PRODUCTS : []);
  const prod = productList.find(p => p.id === prodId);
  if (!prod) return;

  let currentWishlist = [];
  try {
    currentWishlist = JSON.parse(localStorage.getItem("userWishlist")) || [];
  } catch (e) { currentWishlist = []; }

  const existingIdx = currentWishlist.findIndex(item => (prod.id && item.id === prod.id) || item.name === prod.name);

function showToastNotice(msg) {
  let toast = document.getElementById("toast-notice");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toast-notice";
    toast.style.cssText = "position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); background: #1e293b; color: white; padding: 12px 24px; border-radius: 8px; font-weight: 500; display: flex; align-items: center; gap: 8px; z-index: 10000; opacity: 0; transition: opacity 0.3s; pointer-events: none;";
    document.body.appendChild(toast);
  }
  toast.innerHTML = `<i class="fa-solid fa-circle-check" style="color: #4ade80;"></i> <span>${msg}</span>`;
  toast.style.opacity = "1";
  if (window.toastTimeout) clearTimeout(window.toastTimeout);
  window.toastTimeout = setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}

window.showWishlistModal = window.showWishlistModal || function(msg) {
  let modal = document.getElementById("custom-wishlist-modal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "custom-wishlist-modal";
    modal.innerHTML = `
      <div style="background: white; padding: 24px; border-radius: 12px; text-align: center; max-width: 340px; box-shadow: 0 10px 25px rgba(0,0,0,0.1);">
        <h3 style="margin: 0 0 12px 0; font-family: 'Outfit', sans-serif; color: #0f172a;">Added to Wishlist</h3>
        <p style="margin: 0 0 20px 0; color: #64748b; font-size: 0.95rem; line-height: 1.5;">${msg}</p>
        <div style="display: flex; gap: 10px; margin-top: 10px;">
          <button onclick="document.getElementById('custom-wishlist-modal').style.opacity='0'; setTimeout(()=>document.getElementById('custom-wishlist-modal').style.display='none', 200);" style="flex: 1; background: #e2e8f0; color: #0f172a; border: none; padding: 10px; border-radius: 8px; font-weight: 600; cursor: pointer; transition: background 0.2s;">Cancel</button>
          <button onclick="window.location.href='profile.html#wishlist'" style="flex: 1; background: #3b82f6; color: white; border: none; padding: 10px; border-radius: 8px; font-weight: 600; cursor: pointer;">View Wishlist</button>
        </div>
      </div>
    `;
    modal.style.cssText = "position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(15, 23, 42, 0.4); display: none; align-items: center; justify-content: center; z-index: 10000; backdrop-filter: blur(4px); opacity: 0; transition: opacity 0.2s;";
    document.body.appendChild(modal);
  } else {
    modal.querySelector("p").textContent = msg;
  }
  modal.style.display = "flex";
  setTimeout(() => modal.style.opacity = "1", 10);
};

window.showCartModal = window.showCartModal || function(msg) {
  let modal = document.getElementById("custom-cart-modal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "custom-cart-modal";
    modal.innerHTML = `
      <div style="background: white; padding: 24px; border-radius: 12px; text-align: center; max-width: 340px; box-shadow: 0 10px 25px rgba(0,0,0,0.1);">
        <i class="fa-solid fa-bag-shopping" style="color: #3b82f6; font-size: 2.5rem; margin-bottom: 16px;"></i>
        <h3 style="margin: 0 0 12px 0; font-family: 'Outfit', sans-serif; color: #0f172a;">Cart Updated</h3>
        <p style="margin: 0 0 20px 0; color: #64748b; font-size: 0.95rem; line-height: 1.5;">${msg}</p>
        <div style="display: flex; gap: 10px; justify-content: stretch;">
          <button onclick="document.getElementById('custom-cart-modal').style.opacity='0'; setTimeout(()=>document.getElementById('custom-cart-modal').style.display='none', 200);" style="flex: 1; background: #e2e8f0; color: #0f172a; border: none; padding: 10px; border-radius: 8px; font-weight: 600; cursor: pointer;">Cancel</button>
          <button onclick="window.location.href='cart.html'" style="flex: 1; background: #3b82f6; color: white; border: none; padding: 10px; border-radius: 8px; font-weight: 600; cursor: pointer;">Go to Cart</button>
        </div>
      </div>
    `;
    modal.style.cssText = "position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(15, 23, 42, 0.4); display: none; align-items: center; justify-content: center; z-index: 10000; backdrop-filter: blur(4px); opacity: 0; transition: opacity 0.2s;";
    document.body.appendChild(modal);
  } else {
    modal.querySelector("p").textContent = msg;
  }
  modal.style.display = "flex";
  setTimeout(() => modal.style.opacity = "1", 10);
};

  if (existingIdx > -1) {
    currentWishlist.splice(existingIdx, 1);
    showToastNotice("Item removed from your wishlist.");
  } else {
    currentWishlist.push({
      id: prod.id,
      name: prod.name,
      price: prod.price,
      type: prod.type || "physical",
      img: prod.img,
      category: prod.category || "Merchandise"
    });
    window.showWishlistModal("Your item has been successfully added to your Wishlist.");
    localStorage.setItem("wishlist_has_unseen_items", "true");
  }

  localStorage.setItem("userWishlist", JSON.stringify(currentWishlist));

  try {
    const countsMap = JSON.parse(localStorage.getItem("product_wishlist_counts") || "{}");
    const key = prod.id || prod.name;
    countsMap[key] = currentWishlist.filter(item => (prod.id && item.id === prod.id) || item.name === prod.name).length;
    localStorage.setItem("product_wishlist_counts", JSON.stringify(countsMap));
  } catch (e) { }

  window.dispatchEvent(new Event("wishlistUpdated"));
  renderProducts();
};

// Global Color Swatch image switcher for Product Cards
window.changeCardColorImage = function (event, prodId, newImgSrc) {
  if (event) {
    event.stopPropagation();
    event.preventDefault();
  }

  const card = event.target.closest(".product-card");
  if (card) {
    const imgEl = card.querySelector(".prod-img-wrap img");
    if (imgEl) {
      imgEl.src = newImgSrc;
    }
  }
};

// Global Buy Now checkout hook (Goes DIRECTLY to checkout.html)
window.buyNow = function (item) {
  const doInstantCheckout = () => {
    let cart = localStorage.getItem("shoppingCart");
    cart = cart ? JSON.parse(cart) : [];

    const itemVariant = item.variant || "Standard Edition";
    const existing = cart.find(c => (c.id === item.id || c.name === item.name) && (c.variant === itemVariant));
    if (existing) {
      existing.quantity += (item.quantity || 1);
    } else {
      cart.push({
        id: item.id || ("BUY-" + Date.now()),
        name: item.name,
        price: item.price,
        img: item.img,
        type: item.type || "physical",
        quantity: item.quantity || 1,
        variant: item.variant || "Standard Edition"
      });
    }
    localStorage.setItem("shoppingCart", JSON.stringify(cart));

    // Direct redirect to checkout.html without opening cart drawer
    window.location.href = "checkout.html";
  };

  if (window.checkAuthOrPrompt) {
    window.checkAuthOrPrompt("proceed with Instant Buy", doInstantCheckout);
  } else {
    doInstantCheckout();
  }
};

// Global Browse Category quick filter hook
window.filterByStoreCategory = function (catName) {
  filters.category = catName;

  // Sync top category dropdown
  const topSelect = document.getElementById("search-category-select");
  if (topSelect) {
    topSelect.value = catName;
  }

  // Sync left sidebar links
  updateSidebarCategorySelection(catName);

  // Show the filter sidebar when a category is selected from home
  showSidebarOnFilter();

  // Scroll to store layout container
  const container = document.querySelector(".store-layout-container") || document.getElementById("store-products-anchor");
  if (container) {
    container.scrollIntoView({ behavior: "smooth" });
  }

  // Re-render catalog
  renderProducts();
};

// Global Toast Notification for Category Selection
function showCategoryToast(message) {
  let toast = document.getElementById("category-toast-notice");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "category-toast-notice";
    toast.className = "category-toast-notification";
    document.body.appendChild(toast);
  }

  toast.innerHTML = `<i class="fa-solid fa-circle-check" style="color: #4ade80;"></i> <span>${message}</span>`;
  toast.classList.add("active");

  if (window.toastTimeout) clearTimeout(window.toastTimeout);
  window.toastTimeout = setTimeout(() => {
    toast.classList.remove("active");
  }, 3800);
}

window.selectBrowseCategory = function (catName) {
  if (!catName) return;
  filters.category = catName;

  // Reveal the 'All Categories' option in the dropdown when a specific category is selected
  const allOption = document.getElementById("bc-option-all");
  if (allOption) {
    if (catName !== "all") {
      allOption.style.display = "block";
    }
  }

  // Update left sidebar category link highlighting
  if (typeof updateSidebarCategorySelection === "function") {
    updateSidebarCategorySelection(catName);
  }

  renderProducts();

  // Calculate count of matching products
  const productList = window.PRODUCTS || (typeof PRODUCTS !== "undefined" ? PRODUCTS : []);
  const matchingCount = productList.filter(prod => {
    if (typeof isProductInCategory === "function") {
      return isProductInCategory(prod, catName);
    }
    return catName === "all" || prod.category === catName || prod.subCategory === catName;
  }).length;

  let catDisplay = catName === "all" ? "All Categories" : (catName === "Merchandise" ? "Merchandise" : (catName === "3D Assets" ? "3D Models" : (catName === "Digital Courses" ? "Courses" : catName)));
  showCategoryToast(`${matchingCount} product${matchingCount === 1 ? '' : 's'} found in ${catDisplay}!`);

  // Scroll smoothly to store layout container
  const container = document.querySelector(".store-layout-container") || document.getElementById("store-products-anchor");
  if (container) {
    container.scrollIntoView({ behavior: "smooth" });
  }
};

// Rapid Advertisement Carousel for Sale Is On Section (Itachi & Kaneki Shirt Colors)
function initSaleIsOnSlideshow() {
  const promoImg1 = document.getElementById("sale-promo-img-1");
  const promoImg2 = document.getElementById("sale-promo-img-2");

  if (!promoImg1 && !promoImg2) return;

  // Itachi Shirt Color Variations (Left Card)
  const itachiImagesSet = [
    "assets/Store/Tshirts/Colored itachi tshirts/itachi_black_tshirt_colored.jpg",
    "assets/Store/Tshirts/Colored itachi tshirts/itachi_red_tshirt_colored.jpg",
    "assets/Store/Tshirts/Colored itachi tshirts/itachi_purple_tshirt_colored.jpg",
    "assets/Store/Tshirts/Colored itachi tshirts/itachi_white_tshirt_colored.jpg",
    "assets/Store/Tshirts/black and white itachi tshirts/itachi_black_tshirt_bw.jpg",
    "assets/Store/Tshirts/black and white itachi tshirts/itachi_red_tshirt_bw.jpg",
    "assets/Store/Tshirts/black and white itachi tshirts/itachi_white_tshirt_bw.jpg"
  ];

  // Kaneki Shirt Color Variations (Right Card)
  const kanekiImagesSet = [
    "assets/Store/Tshirts/Colored kaneki tshirts/kaneki_black_tshirt_colored.jpg",
    "assets/Store/Tshirts/Colored kaneki tshirts/kaneki_white_tshirt_colored.jpg",
    "assets/Store/Tshirts/Colored kaneki tshirts/kaneki_darkgrey_tshirt_colored.jpg",
    "assets/Store/Tshirts/Black and whirte kaneki tshirts/kaneki_black_tshirt_bw.jpg",
    "assets/Store/Tshirts/Black and whirte kaneki tshirts/kaneki_maroon_tshirt_bw.jpg",
    "assets/Store/Tshirts/Black and whirte kaneki tshirts/kaneki_white_tshirt_bw.jpg"
  ];

  let index1 = 0;
  let index2 = 0;

  setInterval(() => {
    if (promoImg1) {
      index1 = (index1 + 1) % itachiImagesSet.length;
      promoImg1.style.opacity = "0.2";
      setTimeout(() => {
        promoImg1.style.backgroundImage = `url('${itachiImagesSet[index1]}')`;
        promoImg1.style.opacity = "1";
      }, 150);
    }

    if (promoImg2) {
      index2 = (index2 + 1) % kanekiImagesSet.length;
      promoImg2.style.opacity = "0.2";
      setTimeout(() => {
        promoImg2.style.backgroundImage = `url('${kanekiImagesSet[index2]}')`;
        promoImg2.style.opacity = "1";
      }, 150);
    }
  }, 1400); // Rapid 1.4s advertisement cycle
}

function isUserLoggedIn() {
  if (window.Auth && typeof window.Auth.isLoggedIn === "function") {
    return window.Auth.isLoggedIn();
  }
  const isLoggedOut = localStorage.getItem("userLoggedOut") === "true" || localStorage.getItem("isLoggedIn") === "false";
  if (isLoggedOut) return false;
  const user = localStorage.getItem("currentUser");
  return !!user;
}

function showPollNotice(msg) {
  if (window.showCategoryToast) {
    showCategoryToast(msg);
  } else {
    alert(msg);
  }
}

// Global Handler for Design Preference Poll Submission
window.handleDesignPollSubmit = function (e) {
  if (e) e.preventDefault();

  if (!isUserLoggedIn()) {
    showPollNotice("Please sign in to submit your response.");
    return;
  }

  const customCharInput = document.getElementById("dp-custom-character");
  const customChar = customCharInput ? customCharInput.value.trim() : "";

  if (!customChar) return;

  let currentUser = null;
  try {
    currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
  } catch (err) { }

  const author = currentUser ? (currentUser.name || currentUser.username || currentUser.email || "Community Supporter") : "Community Supporter";

  // Store in localStorage for Admin Control Center Tracking
  try {
    let list = [];
    const raw = localStorage.getItem("site_design_poll_suggestions");
    if (raw) list = JSON.parse(raw);
    list.unshift({
      id: "poll_" + Date.now(),
      user: author,
      suggestion: customChar,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      status: "Pending"
    });
    localStorage.setItem("site_design_poll_suggestions", JSON.stringify(list));
  } catch (err) {
    console.error("Failed saving poll suggestion to localStorage:", err);
  }

  const msg = `Awesome ${author}! We've logged your request for "${customChar}". Stay tuned for future drops!`;
  showPollNotice(msg);

  const form = document.getElementById("design-poll-form");
  if (form) form.reset();
};

function updateStorePollFormState() {
  const isLoggedIn = isUserLoggedIn();
  const authNotice = document.getElementById("store-poll-auth-notice");
  const pollInput = document.getElementById("dp-custom-character");
  const pollSubmitBtn = document.querySelector(".dp-capsule-submit-btn");
  const tagPills = document.querySelectorAll(".dp-tag-pill");

  if (!isLoggedIn) {
    if (authNotice) authNotice.style.display = "flex";
    if (pollInput) {
      pollInput.disabled = true;
      pollInput.placeholder = "Please sign in to submit your response";
    }
    if (pollSubmitBtn) {
      pollSubmitBtn.disabled = true;
      pollSubmitBtn.style.opacity = "0.5";
      pollSubmitBtn.style.cursor = "not-allowed";
    }
    tagPills.forEach(p => {
      p.disabled = true;
      p.style.opacity = "0.6";
      p.style.cursor = "not-allowed";
    });
  } else {
    if (authNotice) authNotice.style.display = "none";
    if (pollInput) {
      pollInput.disabled = false;
      pollInput.placeholder = "Type any anime, character, or design concept...";
    }
    if (pollSubmitBtn) {
      pollSubmitBtn.disabled = false;
      pollSubmitBtn.style.opacity = "1";
      pollSubmitBtn.style.cursor = "pointer";
    }
    tagPills.forEach(p => {
      p.disabled = false;
      p.style.opacity = "1";
      p.style.cursor = "pointer";
    });
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", updateStorePollFormState);
} else {
  updateStorePollFormState();
}
window.addEventListener("profileUpdated", updateStorePollFormState);
window.addEventListener("storage", updateStorePollFormState);
setInterval(updateStorePollFormState, 1000);

window.appendPollSuggestion = function (characterName) {
  if (!isUserLoggedIn()) {
    showPollNotice("Please sign in to submit your response.");
    return;
  }

  const input = document.getElementById("dp-custom-character");
  if (!input) return;
  input.value = characterName;
  input.focus();
};

// Auto-cycling T-Shirt Showcase in Design Poll section (Current Store Designs)
function initPollTshirtAdRotation() {
  const adImg = document.getElementById("poll-ad-tshirt-img");
  if (!adImg) return;

  const tshirtAds = [
    "assets/Store/Tshirts/Colored itachi tshirts/itachi_black_tshirt_colored.jpg",
    "assets/Store/Tshirts/Colored kaneki tshirts/kaneki_black_tshirt_colored.jpg",
    "assets/Store/Tshirts/colored Zoro tshirts/zoro_colored_black_tshirt.jpg",
    "assets/Store/Tshirts/black and white itachi tshirts/itachi_black_tshirt_bw.jpg",
    "assets/Store/Tshirts/Black and whirte kaneki tshirts/kaneki_black_tshirt_bw.jpg",
    "assets/Store/Tshirts/Black and White Zoro tshirts/zoro_bw_black_tshirt.jpg"
  ];

  let currentIndex = 0;
  setInterval(() => {
    currentIndex = (currentIndex + 1) % tshirtAds.length;
    const currentImg = tshirtAds[currentIndex];

    adImg.style.opacity = "0";
    adImg.style.transform = "scale(0.96)";

    setTimeout(() => {
      adImg.style.backgroundImage = `url('${currentImg.replace(/'/g, "\\'")}')`;
      adImg.style.opacity = "1";
      adImg.style.transform = "scale(1)";
    }, 250);
  }, 2200);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initPollTshirtAdRotation);
} else {
  initPollTshirtAdRotation();
}
