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

// DOMContentLoaded Handler
document.addEventListener("DOMContentLoaded", async () => {
  initSearchHeader();
  initSidebarFilters();
  initSorting();
  initSaleIsOnSlideshow();

  if (window.dbProductsPromise) {
    await window.dbProductsPromise;
  }

  renderProducts();

  // Auto-filter store products by URL Hash (e.g. #merchandise, #3d-models, #courses)
  const hash = window.location.hash.replace('#', '');
  if (hash) {
    if (hash === 'merchandise') {
      if (typeof filterByStoreCategory === 'function') filterByStoreCategory('Merchandise');
    } else if (hash === '3d-models') {
      if (typeof filterByStoreCategory === 'function') filterByStoreCategory('3D Assets');
    } else if (hash === 'courses') {
      if (typeof filterByStoreCategory === 'function') filterByStoreCategory('Digital Courses');
    } else if (hash === 'all-categories') {
      if (typeof filterByStoreCategory === 'function') filterByStoreCategory('all');
    }
  }
});

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
function renderProducts() {
  const grid = document.querySelector(".product-grid");
  const countEl = document.getElementById("results-count");
  if (!grid) return;

  // Filter products
  let filtered = PRODUCTS.filter(prod => {
    // Search query filter
    if (filters.search) {
      const q = filters.search;
      const matchName = prod.name.toLowerCase().includes(q);
      const matchDesc = prod.description.toLowerCase().includes(q);
      const matchSubCat = prod.subCategory.toLowerCase().includes(q);
      const matchCreator = prod.creator.toLowerCase().includes(q);
      const matchSoftware = prod.software.some(s => s.toLowerCase().includes(q));
      const matchFormat = prod.format.some(f => f.toLowerCase().includes(q));

      if (!matchName && !matchDesc && !matchSubCat && !matchCreator && !matchSoftware && !matchFormat) {
        return false;
      }
    }

    // Category filter
    if (filters.category !== "all" && prod.category !== filters.category) {
      return false;
    }

    // Price range filter
    if (filters.priceRange !== "all") {
      const pr = filters.priceRange;
      if (pr === "free" && prod.price > 0) return false;
      if (pr === "under-15" && (prod.price === 0 || prod.price > 15)) return false;
      if (pr === "15-30" && (prod.price < 15 || prod.price > 30)) return false;
      if (pr === "30-50" && (prod.price < 30 || prod.price > 50)) return false;
      if (pr === "above-50" && prod.price < 50) return false;
    }

    // Free / Paid toggle filter
    if (filters.freePaid !== "all") {
      if (filters.freePaid === "free" && prod.price > 0) return false;
      if (filters.freePaid === "paid" && prod.price === 0) return false;
    }

    // Software compatibility filter
    if (filters.software.length > 0) {
      const hasCompat = filters.software.some(s => prod.software.includes(s));
      if (!hasCompat) return false;
    }

    // File format filter
    if (filters.format.length > 0) {
      const hasFormat = filters.format.some(f => prod.format.includes(f));
      if (!hasFormat) return false;
    }

    // Rating filter
    if (filters.rating > 0 && prod.rating < filters.rating) {
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
      // Best Seller / Featured first
      const valA = a.badge === "Best Seller" ? 2 : (a.badge === "Limited Edition" ? 1 : 0);
      const valB = b.badge === "Best Seller" ? 2 : (b.badge === "Limited Edition" ? 1 : 0);
      return valB - valA;
    }
    if (currentSort === "newest") {
      return (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0);
    }
    if (currentSort === "bestselling") {
      return b.ratingCount - a.ratingCount;
    }
    if (currentSort === "rating") {
      return b.rating - a.rating;
    }
    if (currentSort === "price-asc") {
      return a.price - b.price;
    }
    if (currentSort === "price-desc") {
      return b.price - a.price;
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

  const totalCount = filtered.length;
  const cols = getColumnsCount();

  let effectiveLimit = visibleLimit;
  // If there are more products remaining, ensure effectiveLimit rounds DOWN to an exact full row multiple!
  if (totalCount > effectiveLimit) {
    const fullRowLimit = Math.floor(effectiveLimit / cols) * cols;
    effectiveLimit = fullRowLimit > 0 ? fullRowLimit : cols;
  }

  const productsToRender = filtered.slice(0, effectiveLimit);

  grid.innerHTML = productsToRender.map(prod => {
    const badgeMarkup = prod.badge ? `<span class="prod-badge badge-custom">${prod.badge}</span>` : "";
    let formattedPrice = "";
    let originalPriceMarkup = "";
    let discountBadgeMarkup = "";

    if (prod.price === 0) {
      formattedPrice = "FREE";
    } else if (prod.category === "Merchandise" || prod.type === "physical") {
      const rupees = 1299;
      const origRupees = 2499;
      const discountPct = Math.round(((origRupees - rupees) / origRupees) * 100);
      formattedPrice = `₹${rupees.toLocaleString('en-IN')}`;
      originalPriceMarkup = ""; // No MRP display
      discountBadgeMarkup = `<span class="prod-discount-badge">${discountPct}% OFF</span>`;
    } else {
      const inrVal = prod.price > 100 ? prod.price : Math.round(prod.price * 83);
      formattedPrice = `₹${inrVal.toLocaleString('en-IN')}`;
      originalPriceMarkup = ""; // No MRP display
      discountBadgeMarkup = `<span class="prod-discount-badge">28% OFF</span>`;
    }

    let subLabel = prod.subCategory || prod.category;
    if (prod.category === "Merchandise" || prod.type === "physical") {
      subLabel = `${subLabel} • India Only 🇮🇳`;
    }

    const swatchesMarkup = prod.colorVariants && prod.colorVariants.length > 0 ? `
      <div class="prod-color-swatches">
        ${prod.colorVariants.map(variant => `
          <button type="button" 
                  class="color-swatch-dot" 
                  style="background-color: ${variant.colorCode};" 
                  title="${variant.name}"
                  onclick="changeCardColorImage(event, '${prod.id}', '${variant.img.replace(/'/g, "\\'")}')"></button>
        `).join("")}
      </div>
    ` : '';

    return `
      <div class="product-card ${prod.type}">
        <div class="prod-img-wrap">
          <a href="store-detail.html?id=${prod.id}">
            <img src="${prod.img}" alt="${prod.name}">
          </a>
          <div class="prod-badges-row">
            ${badgeMarkup}
            ${discountBadgeMarkup}
          </div>
        </div>
        <div class="prod-body">
          <h3 class="prod-title"><a href="store-detail.html?id=${prod.id}">${prod.name}</a></h3>
          <div class="prod-sub-row">
            <span class="prod-sub-text">${subLabel}</span>
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

  // Handle Load More / Show Less Button Display & Event Listener
  const loadMoreWrap = document.getElementById("load-more-wrap");
  const loadMoreBtn = document.getElementById("load-more-btn");

  if (loadMoreWrap && loadMoreBtn) {
    const initialThreshold = getInitialItemLimit();

    // Show button if more products exist OR if catalog is currently expanded
    if (totalCount > effectiveLimit || (isLimitManuallyExpanded && effectiveLimit >= totalCount)) {
      loadMoreWrap.style.display = "flex";

      if (effectiveLimit >= totalCount) {
        // All products currently displayed -> Mode: Show Less
        loadMoreBtn.innerHTML = `<span>Show Less Products</span> <i class="fa-solid fa-arrow-up"></i>`;
        loadMoreBtn.onclick = function () {
          isLimitManuallyExpanded = false;
          visibleLimit = initialThreshold;
          renderProducts();

          // Scroll back up smoothly to 1st row of products catalog
          const anchor = document.getElementById("store-catalog-section") || document.querySelector(".product-grid");
          if (anchor) {
            anchor.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        };
      } else {
        // More products available -> Mode: Load More
        loadMoreBtn.innerHTML = `<span>Load More Products</span> <i class="fa-solid fa-arrow-down"></i>`;
        loadMoreBtn.onclick = function () {
          isLimitManuallyExpanded = true;
          visibleLimit += initialThreshold;
          renderProducts();
        };
      }
    } else {
      loadMoreWrap.style.display = "none";
    }
  }
}

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

    const existing = cart.find(c => c.id === item.id || c.name === item.name);
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
  const matchingCount = PRODUCTS.filter(prod => {
    if (catName !== "all" && prod.category !== catName) return false;
    return true;
  }).length;

  let catDisplay = catName === "all" ? "All Categories" : (catName === "Merchandise" ? "Merchandise" : (catName === "3D Assets" ? "3D Models" : "Courses"));
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

// Global Handler for Design Preference Poll Submission (No login required)
window.handleDesignPollSubmit = function (e) {
  if (e) e.preventDefault();
  const customCharInput = document.getElementById("dp-custom-character");
  const customChar = customCharInput ? customCharInput.value.trim() : "";

  if (!customChar) return;

  // Store in localStorage for Admin Control Center Tracking
  try {
    let list = [];
    const raw = localStorage.getItem("site_design_poll_suggestions");
    if (raw) list = JSON.parse(raw);
    list.unshift({
      id: "poll_" + Date.now(),
      suggestion: customChar,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      status: "Pending"
    });
    localStorage.setItem("site_design_poll_suggestions", JSON.stringify(list));
  } catch (err) {
    console.error("Failed saving poll suggestion to localStorage:", err);
  }

  const msg = `Awesome! We've logged your request for "${customChar}". Stay tuned for future drops!`;

  if (window.showCategoryToast) {
    showCategoryToast(msg);
  } else {
    alert(msg);
  }

  const form = document.getElementById("design-poll-form");
  if (form) form.reset();
};

window.appendPollSuggestion = function(characterName) {
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
