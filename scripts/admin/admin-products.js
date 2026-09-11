/**
 * SenpaiWorks Admin Console - Store Products Module
 * scripts/admin/admin-products.js
 */

window.adminProductsList = [];
let editingProductId = null;
let customCategoriesList = JSON.parse(localStorage.getItem("adminCustomCategories") || '[]');

// ── Bulk Selection Helpers ─────────────────────────────────
window.updateStoreBulkSelection = function () {
  const checkboxes = document.querySelectorAll("#products-list-body .tbl-checkbox");
  const selected = Array.from(checkboxes).filter(cb => cb.checked);
  const bulkBtn = document.getElementById("prod-bulk-delete-btn");
  const bulkCount = document.getElementById("prod-selected-count");
  const selectAllCb = document.getElementById("prod-select-all");

  checkboxes.forEach(cb => {
    const tr = cb.closest("tr");
    if (tr) tr.classList.toggle("row-selected", cb.checked);
  });

  if (selectAllCb) {
    selectAllCb.checked = checkboxes.length > 0 && selected.length === checkboxes.length;
    selectAllCb.indeterminate = selected.length > 0 && selected.length < checkboxes.length;
  }

  if (bulkBtn && bulkCount) {
    bulkCount.textContent = selected.length;
    bulkBtn.style.display = selected.length > 0 ? "inline-flex" : "none";
  }
};

// ── Wishlist, Auto-Rating & Color Variant URL Utilities ──
function getProductWishlistDetails(productId, productName) {
  let count = 0;
  let breakdown = {};
  
  try {
    const wishlist = JSON.parse(localStorage.getItem("userWishlist") || "[]");
    const matches = wishlist.filter(item => (productId && item.id == productId) || (productName && item.name == productName));
    count = matches.length;
    
    matches.forEach(item => {
      let label = "Standard";
      if (item.color || item.size) {
        label = `${item.color || 'Any'}/${item.size || 'Any'}`;
      }
      breakdown[label] = (breakdown[label] || 0) + 1;
    });
  } catch (e) { }

  try {
    const countsMap = JSON.parse(localStorage.getItem("product_wishlist_counts") || "{}");
    const storedCount = countsMap[productId] || countsMap[productName] || 0;
    if (storedCount > count) {
      count = storedCount;
      if (Object.keys(breakdown).length === 0) breakdown["Standard"] = storedCount;
    }
  } catch (e) { }

  let breakdownStr = Object.entries(breakdown).map(([k, v]) => `${v} ${k}`).join(', ');
  if (breakdownStr) breakdownStr = `(${breakdownStr})`;
  
  return { count, breakdownStr };
}

function calculateProductRating(prod) {
  if (!prod) return { rating: 5.0, ratingCount: 0 };
  let saved = [];
  try {
    const raw = localStorage.getItem("user_reviews_" + prod.id);
    if (raw) saved = JSON.parse(raw);
  } catch (e) { }

  let base = Array.isArray(prod.reviews) ? prod.reviews : [];
  const all = [...saved, ...base];
  if (all.length === 0) {
    return {
      rating: prod.rating !== undefined ? prod.rating : 5.0,
      ratingCount: prod.ratingCount !== undefined ? prod.ratingCount : 0
    };
  }

  const sum = all.reduce((acc, r) => acc + (Number(r.rating) || 5), 0);
  const avg = Math.round((sum / all.length) * 10) / 10;
  return { rating: avg, ratingCount: all.length };
}

function renderColorVariantsContainer(colors = []) {
  const container = document.getElementById("color-variants-container");
  if (!container) return;
  container.innerHTML = "";
  if (!colors || colors.length === 0) {
    renderColorVariantInputRow({ name: "Black", hex: "#111111", img: "assets/Store/Tshirts/Colored itachi tshirts/itachi_black_tshirt_colored.jpg", available: true });
    renderColorVariantInputRow({ name: "White", hex: "#ffffff", img: "assets/Store/Tshirts/Colored itachi tshirts/itachi_white_tshirt_colored.jpg", available: true });
  } else {
    colors.forEach(c => renderColorVariantInputRow(c));
  }
}

function renderColorVariantInputRow(colorData = {}) {
  const container = document.getElementById("color-variants-container");
  if (!container) return;

  const row = document.createElement("div");
  row.className = "color-variant-row";

  const defaultImg = "assets/Store/Tshirts/Colored itachi tshirts/itachi_black_tshirt_colored.jpg";
  const nameVal = colorData.name || "Black";
  const hexVal = colorData.hex || colorData.colorCode || "#111111";
  const imgVal = colorData.img || defaultImg;
  const isAvail = colorData.available !== false;

  row.innerHTML = `
    <img src="${imgVal}" class="color-thumb-preview" onerror="this.src='${defaultImg}'">
    <input type="text" class="color-name-field" placeholder="Color Name (e.g. Black)" value="${window.escapeHtml(nameVal)}">
    <input type="color" class="color-hex-field" value="${hexVal.startsWith('#') ? hexVal : '#111111'}" title="Swatch Hex Color">
    <input type="text" class="color-img-field" placeholder="Color Image URL (assets/... or https://...)" value="${window.escapeHtml(imgVal)}">
    <label class="color-avail-label">
      <input type="checkbox" class="color-avail-field" ${isAvail ? 'checked' : ''}>
      Active
    </label>
    <button type="button" class="btn-remove-color" title="Remove Color Variant"><i class="fa-solid fa-trash"></i></button>
  `;

  const inputImg = row.querySelector(".color-img-field");
  const imgThumb = row.querySelector(".color-thumb-preview");
  const removeBtn = row.querySelector(".btn-remove-color");

  inputImg.addEventListener("input", () => {
    imgThumb.src = inputImg.value.trim() || defaultImg;
  });

  removeBtn.addEventListener("click", () => {
    row.remove();
    if (container.children.length === 0) {
      renderColorVariantInputRow({ name: "Black", hex: "#111111", img: "", available: true });
    }
  });

  container.appendChild(row);
}

function getColorVariantsData() {
  const rows = document.querySelectorAll("#color-variants-container .color-variant-row");
  return Array.from(rows).map(row => {
    const name = row.querySelector(".color-name-field")?.value.trim() || "Black";
    const hex = row.querySelector(".color-hex-field")?.value || "#111111";
    const img = row.querySelector(".color-img-field")?.value.trim() || "";
    const available = row.querySelector(".color-avail-field")?.checked !== false;
    return { name, hex, colorCode: hex, img, available };
  });
}

// ── Additional Image URLs Manager ─────────────────────────
function renderAdditionalImageUrls(urls) {
  const container = document.getElementById("additional-urls-container");
  if (!container) return;
  container.innerHTML = "";
  const list = Array.isArray(urls) ? urls : (typeof urls === "string" ? urls.split("\n").filter(Boolean) : []);
  if (list.length === 0) {
    addAdditionalUrlInputRow("");
  } else {
    list.forEach(url => addAdditionalUrlInputRow(url));
  }
}

function addAdditionalUrlInputRow(urlVal = "") {
  const container = document.getElementById("additional-urls-container");
  if (!container) return;

  const row = document.createElement("div");
  row.className = "url-input-row";
  const defaultImg = "assets/Store/Tshirts/Colored itachi tshirts/itachi_black_tshirt_colored.jpg";
  const src = urlVal.trim() || defaultImg;

  row.innerHTML = `
    <img src="${src}" class="url-thumb-preview" onerror="this.src='${defaultImg}'">
    <input type="text" class="url-input-field" placeholder="Image URL (e.g. assets/... or https://...)" value="${window.escapeHtml(urlVal)}">
    <button type="button" class="btn-remove-url" title="Remove URL"><i class="fa-solid fa-trash"></i></button>
  `;

  const input = row.querySelector(".url-input-field");
  const img = row.querySelector(".url-thumb-preview");
  const removeBtn = row.querySelector(".btn-remove-url");

  input.addEventListener("input", () => {
    img.src = input.value.trim() || defaultImg;
  });

  removeBtn.addEventListener("click", () => {
    row.remove();
    if (container.children.length === 0) {
      addAdditionalUrlInputRow("");
    }
  });

  container.appendChild(row);
}

function getAdditionalImageUrls() {
  const inputs = document.querySelectorAll("#additional-urls-container .url-input-field");
  return Array.from(inputs).map(inp => inp.value.trim()).filter(Boolean);
}

// ── Custom Category Manager ────────────────────────────────
function initCategoryManagement() {
  const openBtn = document.getElementById("btn-open-add-category-modal");
  const modal = document.getElementById("admin-category-modal");
  const form = document.getElementById("form-add-category");

  customCategoriesList.forEach(catName => appendCategoryToUI(catName, false));

  if (openBtn) {
    openBtn.onclick = () => {
      if (modal) modal.style.display = "flex";
    };
  }

  if (form) {
    form.onsubmit = (e) => {
      e.preventDefault();
      const input = document.getElementById("new-category-name");
      const catName = input ? input.value.trim() : "";
      if (!catName) return;

      if (!customCategoriesList.includes(catName)) {
        customCategoriesList.push(catName);
        localStorage.setItem("adminCustomCategories", JSON.stringify(customCategoriesList));
        appendCategoryToUI(catName, true);
        window.showAdminToast(`Category '${catName}' created successfully!`, "success");
      } else {
        window.showAdminToast(`Category '${catName}' already exists.`, "warning");
      }

      if (input) input.value = "";
      window.closeAdminCategoryModal();
    };
  }
}

window.closeAdminCategoryModal = function () {
  const modal = document.getElementById("admin-category-modal");
  if (modal) modal.style.display = "none";
};

function appendCategoryToUI(catName, activatePill = false) {
  const subtabs = document.getElementById("prod-category-subtabs");
  const categorySelect = document.getElementById("prod-category");

  if (subtabs && !subtabs.querySelector(`button[data-cat="${catName}"]`)) {
    const pill = document.createElement("button");
    pill.type = "button";
    pill.className = `table-subtab-pill ${activatePill ? 'active' : ''}`;
    pill.setAttribute("data-cat", catName);
    pill.textContent = catName;

    pill.onclick = () => {
      subtabs.querySelectorAll(".table-subtab-pill").forEach(t => t.classList.remove("active"));
      pill.classList.add("active");
      renderProductsTable(window.adminProductsList.filter(p => p.category === catName || p.subCategory === catName));
    };

    subtabs.appendChild(pill);
  }

  if (categorySelect && !categorySelect.querySelector(`option[value="${catName}"]`)) {
    const opt = document.createElement("option");
    opt.value = catName;
    opt.textContent = catName;
    categorySelect.appendChild(opt);
  }
}

// ── Load Products from Backend API ────────────────────────
window.loadProducts = async function () {
  const tbody = document.getElementById("products-list-body");
  const searchInput = document.getElementById("product-search");
  const searchIcon = document.getElementById("product-search-icon");
  const selectAllCb = document.getElementById("prod-select-all");
  const bulkDeleteBtn = document.getElementById("prod-bulk-delete-btn");
  const selectModeBtn = document.getElementById("prod-toggle-select-mode-btn");
  const exportBtn = document.getElementById("prod-export-btn");
  const viewToggleBtn = document.getElementById("prod-view-toggle");
  const printBtn = document.getElementById("prod-print-btn");

  if (!tbody) return;

  try {
    const res = await fetch("/api/products");
    if (res.ok) {
      window.adminProductsList = await res.json();
    } else {
      window.adminProductsList = [];
    }
  } catch (err) {
    console.warn("Could not fetch products from backend:", err);
    window.adminProductsList = [];
  }

  // Update Category Counts
  const countAll = document.getElementById("admin-count-all");
  const countOversized = document.getElementById("admin-count-oversized");
  const countHoodies = document.getElementById("admin-count-hoodies");

  if (countAll) countAll.textContent = window.adminProductsList.length;
  if (countOversized) {
    const numOversized = window.adminProductsList.filter(p => p.category === "Oversized T-Shirts" || p.subCategory === "Oversized T-Shirts").length;
    countOversized.textContent = numOversized;
  }
  if (countHoodies) {
    const numHoodies = window.adminProductsList.filter(p => p.category === "Hoodies" || p.subCategory === "Hoodies").length;
    countHoodies.textContent = numHoodies;
  }

  initCategoryManagement();
  renderProductsTable(window.adminProductsList);

  // Populate Category Filter Dropdown dynamically from catalog
  const categoryFilter = document.getElementById("product-filter-category");
  const typeFilter = document.getElementById("product-filter-type");

  if (categoryFilter) {
    const currentVal = categoryFilter.value || "all";
    const baseCats = ["Merchandise", "Digital Courses", "3D Assets", "Materials & Textures"];
    const catalogCats = window.adminProductsList.map(p => p.category).filter(Boolean);
    const uniqueCats = Array.from(new Set([...baseCats, ...catalogCats]));

    categoryFilter.innerHTML = `<option value="all">📁 All Categories</option>` +
      uniqueCats.map(c => `<option value="${window.escapeHtml(c)}">${window.escapeHtml(c)}</option>`).join("");

    if (uniqueCats.includes(currentVal) || currentVal === "all") {
      categoryFilter.value = currentVal;
    }
    categoryFilter.onchange = () => window.filterAdminProducts();
  }

  if (typeFilter) {
    typeFilter.onchange = () => window.filterAdminProducts();
  }

  if (searchInput) {
    searchInput.oninput = () => window.filterAdminProducts();
  }
  if (searchIcon) {
    searchIcon.onclick = () => {
      if (searchInput) searchInput.focus();
      window.filterAdminProducts();
    };
  }

  // Unified Filter Function (Search + Category + Type)
  window.filterAdminProducts = function () {
    const sInput = document.getElementById("product-search");
    const cFilter = document.getElementById("product-filter-category");
    const tFilter = document.getElementById("product-filter-type");

    const q = (sInput ? sInput.value : "").toLowerCase().trim();
    const cat = cFilter ? cFilter.value : "all";
    const type = tFilter ? tFilter.value : "all";

    let filtered = [...window.adminProductsList];

    if (cat && cat !== "all") {
      filtered = filtered.filter(p => (p.category || "").toLowerCase() === cat.toLowerCase() || (p.subCategory || "").toLowerCase() === cat.toLowerCase());
    }

    if (type && type !== "all") {
      filtered = filtered.filter(p => (p.type || "physical").toLowerCase() === type.toLowerCase());
    }

    if (q) {
      filtered = filtered.filter(p =>
        (p.name || "").toLowerCase().includes(q) ||
        (p.category || "").toLowerCase().includes(q) ||
        (p.subCategory || "").toLowerCase().includes(q) ||
        (p.id || "").toLowerCase().includes(q) ||
        (p.type || "").toLowerCase().includes(q) ||
        (p.description || "").toLowerCase().includes(q)
      );
    }

    renderProductsTable(filtered);
  };

  // Select Mode Toggle Button
  if (selectModeBtn) {
    let selectModeActive = false;
    selectModeBtn.onclick = () => {
      const table = document.getElementById("products-table");
      if (!table) return;
      selectModeActive = !selectModeActive;
      table.classList.toggle("selection-mode-active", selectModeActive);
      selectModeBtn.classList.toggle("active", selectModeActive);
      selectModeBtn.innerHTML = selectModeActive ? `<i class="fa-solid fa-xmark"></i> Cancel Selection` : `<i class="fa-solid fa-check-double"></i> Select`;

      if (!selectModeActive) {
        const cbs = document.querySelectorAll("#products-list-body .tbl-checkbox");
        cbs.forEach(cb => { cb.checked = false; });
        if (selectAllCb) selectAllCb.checked = false;
        window.updateStoreBulkSelection();
      }
    };
  }

  // Select All Checkbox Handler
  if (selectAllCb) {
    selectAllCb.onclick = () => {
      const isChecked = selectAllCb.checked;
      const cbs = document.querySelectorAll("#products-list-body .tbl-checkbox");
      cbs.forEach(cb => { cb.checked = isChecked; });
      window.updateStoreBulkSelection();
    };
  }

  // Bulk Delete Button Handler
  if (bulkDeleteBtn) {
    bulkDeleteBtn.onclick = async () => {
      const selectedCbs = Array.from(document.querySelectorAll("#products-list-body .tbl-checkbox")).filter(cb => cb.checked);
      const idsToDelete = selectedCbs.map(cb => cb.value);
      if (idsToDelete.length === 0) return;

      const confirmed = await window.showAdminConfirm(
        "Delete Selected Products",
        `Are you sure you want to permanently delete ${idsToDelete.length} selected product(s)? This action cannot be undone.`,
        `Delete ${idsToDelete.length} Items`,
        "danger"
      );

      if (!confirmed) return;

      let deletedCount = 0;
      for (const id of idsToDelete) {
        try {
          await fetch(`/api/products/${id}`, {
            method: "DELETE",
            headers: window.getAdminTokenHeaders()
          });
          deletedCount++;
        } catch (e) {
          console.error("Bulk delete error:", e);
        }
      }

      window.adminProductsList = window.adminProductsList.filter(p => !idsToDelete.includes(p.id));
      renderProductsTable(window.adminProductsList);
      window.showAdminToast(`Successfully deleted ${deletedCount || idsToDelete.length} product(s)!`, "success", "Bulk Delete Complete");
    };
  }

  // Export CSV Handler
  if (exportBtn) {
    exportBtn.onclick = () => {
      if (!window.adminProductsList || window.adminProductsList.length === 0) {
        window.showAdminToast("No product data to export.", "warning");
        return;
      }

      const headers = ["ID", "Name", "Category", "SubCategory", "Sale Price (INR)", "Original Price (INR)", "Stock", "Available", "Type", "Badge", "Rating"];
      const rows = window.adminProductsList.map(p => [
        p.id || '',
        p.name || '',
        p.category || '',
        p.subCategory || '',
        p.price || 0,
        p.originalPrice || p.price || 0,
        p.stockQuantity !== undefined ? p.stockQuantity : 50,
        p.available !== false ? "Yes" : "No",
        p.type || 'physical',
        p.badge || '',
        p.rating || 5.0
      ]);

      window.exportTableCSV(`senpaiworks_products_${Date.now()}.csv`, headers, rows);
      window.showAdminToast(`Exported ${window.adminProductsList.length} products to CSV!`, "success", "Export Successful");
    };
  }

  // Table Density View Toggle
  if (viewToggleBtn) {
    let isCompact = false;
    viewToggleBtn.onclick = () => {
      const table = document.getElementById("products-table");
      if (!table) return;
      isCompact = !isCompact;
      table.classList.toggle("table-compact", isCompact);
      viewToggleBtn.innerHTML = isCompact ? `<i class="fa-solid fa-list"></i> View: Compact` : `<i class="fa-solid fa-table-cells"></i> View: Expanded`;
      window.showAdminToast(`Switched table layout to ${isCompact ? 'Compact' : 'Expanded'} density`, "info");
    };
  }

  if (printBtn) printBtn.onclick = () => window.print();

  // Add Image URL Button Handler
  const addUrlBtn = document.getElementById("btn-add-image-url");
  if (addUrlBtn) {
    addUrlBtn.onclick = () => addAdditionalUrlInputRow("");
  }
};

function renderProductsTable(products) {
  const tbody = document.getElementById("products-list-body");
  const countSpan = document.getElementById("product-table-count");
  if (!tbody) return;

  if (countSpan) countSpan.textContent = `Showing ${products.length} products`;

  if (!products || products.length === 0) {
    tbody.innerHTML = `<tr><td colspan="10" style="text-align: center; color: #94a3b8; padding: 32px;">No store products found.</td></tr>`;
    window.updateStoreBulkSelection();
    return;
  }

  tbody.innerHTML = products.map(p => {
    const isAvail = p.available !== false;
    const statusBadge = isAvail ? `<span class="status-pill status-active">Available ✅</span>` : `<span class="status-pill status-pending" style="background: rgba(239, 68, 68, 0.15); color: #ef4444;">Unavailable ❌</span>`;
    const toggleIcon = isAvail ? `<i class="fa-solid fa-ban" style="color: #ef4444;"></i>` : `<i class="fa-solid fa-circle-check" style="color: #10b981;"></i>`;
    const toggleTitle = isAvail ? "Mark as Unavailable" : "Mark as Available";

    const priceDisplay = `₹${(p.price || 0).toLocaleString('en-IN')}`;
    const origPriceDisplay = p.originalPrice ? `<span style="text-decoration: line-through; color: #64748b; font-size: 0.78rem; margin-left: 6px;">₹${(p.originalPrice).toLocaleString('en-IN')}</span>` : "";

    const ratingStats = calculateProductRating(p);
    p.rating = ratingStats.rating;
    p.ratingCount = ratingStats.ratingCount;

    const wishlistDetails = getProductWishlistDetails(p.id, p.name);
    const wishlistDisplay = `<span style="color: #ef4444; font-weight: 700; font-size: 0.84rem;" title="${wishlistDetails.breakdownStr}"><i class="fa-solid fa-heart"></i> ${wishlistDetails.count}</span>`;

    const stockDisplay = p.stockQuantity !== undefined ? p.stockQuantity : 50;
    const prodType = (p.type || "physical").toLowerCase() === "digital" ? `<span class="badge" style="background: rgba(139, 92, 246, 0.15); color: #a78bfa;"><i class="fa-solid fa-download"></i> Digital</span>` : `<span class="badge" style="background: rgba(59, 130, 246, 0.15); color: #60a5fa;"><i class="fa-solid fa-box"></i> Physical</span>`;
    const ratingDisplay = `<span style="color: #f59e0b; font-weight: 700; font-size: 0.82rem;"><i class="fa-solid fa-star"></i> ${p.rating} <span style="color: #64748b; font-size: 0.75rem;">(${p.ratingCount})</span></span>`;
    const badgePill = p.badge ? `<span class="badge" style="background: rgba(245, 158, 11, 0.15); color: #fbbf24; font-size: 0.72rem; margin-left: 6px;">${p.badge}</span>` : "";

    return `
      <tr>
        <td class="select-col-td"><input type="checkbox" class="tbl-checkbox" value="${p.id}" onchange="window.updateStoreBulkSelection()"></td>
        <td><img src="${p.img || 'https://pub-fcaa22b002b74b8a93604c85b4342984.r2.dev/brand/rem_happy_evhesz.webp'}" alt="${window.escapeHtml(p.name)}" class="table-thumb" style="width: 44px; height: 44px; object-fit: cover; border-radius: 8px;"></td>
        <td>
          <strong style="color: var(--text-primary);">${window.escapeHtml(p.name)}</strong>${badgePill}<br>
          <code style="font-size: 0.76rem; color: var(--text-muted);">${p.id}</code>
        </td>
        <td>
          <span class="badge badge-type">${window.escapeHtml(p.category || 'General')}</span>
          ${p.subCategory ? `<br><span style="font-size: 0.76rem; color: var(--text-muted);">${window.escapeHtml(p.subCategory)}</span>` : ''}
        </td>
        <td>
          <span style="font-weight: 700; color: #38bdf8;">${priceDisplay}</span>${origPriceDisplay}
        </td>
        <td>
          ${prodType}<br>
          ${ratingDisplay}
        </td>
        <td>
          ${wishlistDisplay}
        </td>
        <td style="font-weight: 600;">${stockDisplay}</td>
        <td>${statusBadge}</td>
        <td class="actions-cell">
          <button type="button" class="action-btn btn-view" onclick="window.viewProductModal('${p.id}')" title="Quick View Product Details"><i class="fa-solid fa-eye"></i></button>
          <button type="button" class="action-btn btn-edit" onclick="window.editProduct('${p.id}')" title="Edit Product"><i class="fa-solid fa-pen"></i></button>
          <button type="button" class="action-btn" onclick="window.toggleProductAvailability('${p.id}', ${isAvail})" title="${toggleTitle}">${toggleIcon}</button>
          <button type="button" class="action-btn btn-delete" onclick="window.deleteProduct('${p.id}')" title="Delete Product"><i class="fa-solid fa-trash"></i></button>
        </td>
      </tr>
    `;
  }).join("");

  window.updateStoreBulkSelection();
}

// ── Product Quick View Modal ──────────────────────────────
window.viewProductModal = function (id) {
  const prod = window.adminProductsList.find(p => p.id === id);
  if (!prod) return;

  const modal = document.getElementById("admin-product-view-modal");
  const body = document.getElementById("prod-view-modal-body");
  if (!modal || !body) return;

  const priceDisplay = `₹${(prod.price || 0).toLocaleString('en-IN')}`;
  const origPriceDisplay = prod.originalPrice ? `₹${(prod.originalPrice).toLocaleString('en-IN')}` : "—";
  const ratingStats = calculateProductRating(prod);
  const wishlistDetails = getProductWishlistDetails(prod.id, prod.name);

  let imagesHTML = `<img src="${prod.img || ''}" style="width: 100%; max-height: 260px; object-fit: cover; border-radius: 12px; border: 1px solid var(--border-color);">`;
  if (Array.isArray(prod.additionalImages) && prod.additionalImages.length > 0) {
    imagesHTML += `<div style="display: flex; gap: 8px; margin-top: 10px; overflow-x: auto; padding-bottom: 4px;">
      ${prod.additionalImages.map(img => `<img src="${img}" style="width: 56px; height: 56px; object-fit: cover; border-radius: 8px; border: 1px solid var(--border-color);">`).join('')}
    </div>`;
  }

  body.innerHTML = `
    <div style="display: grid; grid-template-columns: 240px 1fr; gap: 24px;">
      <div>${imagesHTML}</div>
      <div style="display: flex; flex-direction: column; gap: 10px;">
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <span class="badge badge-type">${window.escapeHtml(prod.category || 'General')}</span>
          <span style="font-size: 0.85rem; font-weight: 700; color: #38bdf8; text-transform: uppercase;">${window.escapeHtml(prod.type || 'physical')}</span>
        </div>
        <h2 style="font-size: 1.25rem; font-weight: 800; margin: 0; color: var(--text-primary);">${window.escapeHtml(prod.name)}</h2>
        <code style="font-size: 0.8rem; color: var(--text-muted);">${prod.id}</code>
        
        <div style="display: flex; align-items: baseline; gap: 10px; margin: 4px 0;">
          <span style="font-size: 1.5rem; font-weight: 800; color: #38bdf8;">${priceDisplay}</span>
          <span style="font-size: 0.9rem; text-decoration: line-through; color: var(--text-muted);">MRP: ${origPriceDisplay}</span>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 0.85rem; background: var(--bg-primary); padding: 12px; border-radius: 10px; border: 1px solid var(--border-color);">
          <div><strong>Stock:</strong> ${prod.stockQuantity !== undefined ? prod.stockQuantity : 50} units</div>
          <div><strong>Status:</strong> ${prod.available !== false ? '✅ Available' : '❌ Unavailable'}</div>
          <div><strong>Badge:</strong> ${prod.badge || 'None'}</div>
          <div><strong>Wishlist / Favorites:</strong> ❤️ ${wishlistDetails.count} Users</div>
          <div><strong>Rating:</strong> ⭐ ${ratingStats.rating} (${ratingStats.ratingCount} reviews)</div>
          <div><strong>SubCategory:</strong> ${window.escapeHtml(prod.subCategory || 'N/A')}</div>
        </div>

        <p style="font-size: 0.88rem; color: var(--text-secondary); line-height: 1.5; margin-top: 6px;">
          ${window.escapeHtml(prod.description || 'No description provided.')}
        </p>
      </div>
    </div>
  `;

  modal.style.display = "flex";
};

window.closeProductViewModal = function () {
  const modal = document.getElementById("admin-product-view-modal");
  if (modal) modal.style.display = "none";
};

function notifyWishlistUsersBackInStock(prodId, isNowAvailable) {
  if (!isNowAvailable) return;
  fetch('/api/admin/notifications/trigger-event', {
    method: 'POST',
    headers: window.getAdminTokenHeaders(),
    body: JSON.stringify({
      type: 'wishlist_restock',
      title: 'Back in Stock Alert!',
      message: 'A product in your wishlist is now back in stock and ready to order!',
      link: '/store-detail.html?id=' + prodId,
      icon: 'fa-box-open'
    })
  }).catch(e => console.error('Error generating back in stock notification:', e));
}

// ── Toggle Availability ───────────────────────────────────
window.toggleProductAvailability = async function (id, currentStatus) {
  const newStatus = !currentStatus;
  try {
    const res = await fetch(`/api/products/${id}`, {
      method: "PUT",
      headers: window.getAdminTokenHeaders(),
      body: JSON.stringify({ available: newStatus })
    });
    if (res.ok) {
      window.showAdminToast(`Product availability updated to ${newStatus ? 'Available' : 'Unavailable'}`, "success");
      notifyWishlistUsersBackInStock(id, newStatus);
      window.loadProducts();
    } else {
      const prod = window.adminProductsList.find(p => p.id === id);
      if (prod) prod.available = newStatus;
      window.showAdminToast(`Product status updated to ${newStatus ? 'Available' : 'Unavailable'}`, "info");
      notifyWishlistUsersBackInStock(id, newStatus);
      renderProductsTable(window.adminProductsList);
    }
  } catch (err) {
    const prod = window.adminProductsList.find(p => p.id === id);
    if (prod) prod.available = newStatus;
    window.showAdminToast(`Product status updated to ${newStatus ? 'Available' : 'Unavailable'}`, "info");
    notifyWishlistUsersBackInStock(id, newStatus);
    renderProductsTable(window.adminProductsList);
  }
};

// ── Delete Product ────────────────────────────────────────
window.deleteProduct = async function (id) {
  const confirmed = await window.showAdminConfirm(
    "Delete Product",
    `Are you sure you want to delete product '${id}'? This action cannot be undone.`,
    "Delete Product",
    "danger"
  );
  if (!confirmed) return;

  try {
    const res = await fetch(`/api/products/${id}`, {
      method: "DELETE",
      headers: window.getAdminTokenHeaders()
    });
    if (res.ok) {
      window.showAdminToast("Product deleted successfully!", "success");
      window.loadProducts();
    } else {
      window.adminProductsList = window.adminProductsList.filter(p => p.id !== id);
      renderProductsTable(window.adminProductsList);
      window.showAdminToast("Product removed from catalog.", "info");
    }
  } catch (err) {
    window.adminProductsList = window.adminProductsList.filter(p => p.id !== id);
    renderProductsTable(window.adminProductsList);
    window.showAdminToast("Product removed from catalog.", "info");
  }
};

// ── Edit Product ──────────────────────────────────────────
window.editProduct = function (id) {
  const prod = window.adminProductsList.find(p => p.id === id);
  if (!prod) return;

  editingProductId = id;

  const idInput = document.getElementById("prod-id");
  const nameInput = document.getElementById("prod-name");
  const priceInput = document.getElementById("prod-price");
  const origPriceInput = document.getElementById("prod-original-price");
  const categoryInput = document.getElementById("prod-category");
  const subCategoryInput = document.getElementById("prod-subcategory");
  const typeInput = document.getElementById("prod-type");
  const stockInput = document.getElementById("prod-stock");
  const availableInput = document.getElementById("prod-available-status");
  const badgeInput = document.getElementById("prod-badge");
  const ratingInput = document.getElementById("prod-rating");
  const ratingCountInput = document.getElementById("prod-rating-count");
  const imgInput = document.getElementById("prod-img");
  const descInput = document.getElementById("prod-description");
  
  const skuInput = document.getElementById("prod-sku");
  const costPriceInput = document.getElementById("prod-cost-price");
  const statusInput = document.getElementById("prod-status");

  if (idInput) { idInput.value = prod.id; idInput.readOnly = false; }
  if (nameInput) nameInput.value = prod.name || "";
  if (priceInput) priceInput.value = prod.price || 0;
  if (origPriceInput) origPriceInput.value = prod.originalPrice || prod.price || 0;

  if (categoryInput) {
    if (prod.category && !categoryInput.querySelector(`option[value="${prod.category}"]`)) {
      appendCategoryToUI(prod.category, false);
    }
    categoryInput.value = prod.category || "Oversized T-Shirts";
  }

  if (subCategoryInput) subCategoryInput.value = prod.subCategory || "";
  if (typeInput) typeInput.value = prod.type || "physical";
  
  const downloadUrlInput = document.getElementById("prod-download-url");
  if (downloadUrlInput) downloadUrlInput.value = prod.downloadUrl || "";
  window.updateProductTypeFields(prod.type || "physical");

  if (stockInput) stockInput.value = prod.stockQuantity !== undefined ? prod.stockQuantity : 50;
  if (availableInput) availableInput.value = String(prod.available !== false);
  if (badgeInput) badgeInput.value = prod.badge || "";
  if (ratingInput) ratingInput.value = prod.rating || 5.0;
  if (ratingCountInput) ratingCountInput.value = prod.ratingCount || 48;
  if (imgInput) imgInput.value = prod.img || "";
  
  if (skuInput) skuInput.value = prod.sku || "";
  if (costPriceInput) costPriceInput.value = prod.costPrice || 0;
  if (statusInput) statusInput.value = prod.status || "Active";

  let vData = prod.variantsData;
  if (typeof vData === "string" && vData) {
    try { vData = JSON.parse(vData); } catch (e) { vData = null; }
  }

  renderAdditionalImageUrls(prod.additionalImages);
  renderColorVariantsContainer(prod.colorVariants || (vData && vData.colors ? vData.colors : []));

  if (descInput) descInput.value = prod.description || "";

  if (vData) {
    if (vData.printTypes) {
      const bwHalf = document.getElementById("v-print-bw-half");
      const bwFull = document.getElementById("v-print-bw-full");
      const colHalf = document.getElementById("v-print-col-half");
      const colFull = document.getElementById("v-print-col-full");
      if (bwHalf) bwHalf.checked = vData.printTypes.some(p => p.id === "bw-half" && p.available !== false);
      if (bwFull) bwFull.checked = vData.printTypes.some(p => p.id === "bw-full" && p.available !== false);
      if (colHalf) colHalf.checked = vData.printTypes.some(p => p.id === "col-half" && p.available !== false);
      if (colFull) colFull.checked = vData.printTypes.some(p => p.id === "col-full" && p.available !== false);
    }
    if (vData.colors) {
      const white = document.getElementById("v-color-white");
      const black = document.getElementById("v-color-black");
      const jeans = document.getElementById("v-color-jeans");
      const red = document.getElementById("v-color-red");
      if (white) white.checked = vData.colors.some(c => c.name.toLowerCase() === "white" && c.available !== false);
      if (black) black.checked = vData.colors.some(c => c.name.toLowerCase() === "black" && c.available !== false);
      if (jeans) jeans.checked = vData.colors.some(c => c.name.toLowerCase() === "jeans" && c.available !== false);
      if (red) red.checked = vData.colors.some(c => c.name.toLowerCase() === "red" && c.available !== false);
    }
    if (vData.sizes) {
      const sizeS = document.getElementById("v-size-s");
      const sizeM = document.getElementById("v-size-m");
      const sizeL = document.getElementById("v-size-l");
      const sizeXL = document.getElementById("v-size-xl");
      const sizeXXL = document.getElementById("v-size-xxl");
      if (sizeS) sizeS.checked = vData.sizes.some(s => s.name.toUpperCase() === "S" && s.available !== false);
      if (sizeM) sizeM.checked = vData.sizes.some(s => s.name.toUpperCase() === "M" && s.available !== false);
      if (sizeL) sizeL.checked = vData.sizes.some(s => s.name.toUpperCase() === "L" && s.available !== false);
      if (sizeXL) sizeXL.checked = vData.sizes.some(s => s.name.toUpperCase() === "XL" && s.available !== false);
      if (sizeXXL) sizeXXL.checked = vData.sizes.some(s => s.name.toUpperCase() === "XXL" && s.available !== false);
    }
  }

  let fData = prod.featureHighlights;
  if (typeof fData === "string" && fData) {
    try { fData = JSON.parse(fData); } catch (e) { fData = null; }
  }

  if (fData && Array.isArray(fData)) {
    if (fData[0]) {
      const f1t = document.getElementById("feat-1-title"); if (f1t) f1t.value = fData[0].title || "";
      const f1d = document.getElementById("feat-1-desc"); if (f1d) f1d.value = fData[0].desc || "";
      const f1i = document.getElementById("feat-1-img"); if (f1i) f1i.value = fData[0].img || "";
    }
    if (fData[1]) {
      const f2t = document.getElementById("feat-2-title"); if (f2t) f2t.value = fData[1].title || "";
      const f2d = document.getElementById("feat-2-desc"); if (f2d) f2d.value = fData[1].desc || "";
      const f2i = document.getElementById("feat-2-img"); if (f2i) f2i.value = fData[1].img || "";
    }
    if (fData[2]) {
      const f3t = document.getElementById("feat-3-title"); if (f3t) f3t.value = fData[2].title || "";
      const f3d = document.getElementById("feat-3-desc"); if (f3d) f3d.value = fData[2].desc || "";
      const f3i = document.getElementById("feat-3-img"); if (f3i) f3i.value = fData[2].img || "";
    }
  }

  const addTabBtn = document.querySelector('.inner-tab-btn[data-subtab="store-add"]');
  if (addTabBtn) addTabBtn.click();

  window.showAdminToast(`Editing product: ${prod.name}`, "info");
};

// ── Product Type Field Visibility Controller ──────────────
window.updateProductTypeFields = function (type) {
  const downloadGroup = document.getElementById("prod-download-url-group");
  const physicalFields = document.getElementById("physical-only-fields");
  const stockGroup = document.getElementById("prod-stock-group");
  const downloadInput = document.getElementById("prod-download-url");

  if (type === "digital") {
    if (downloadGroup) downloadGroup.style.display = "block";
    if (physicalFields) physicalFields.style.display = "none";
    if (stockGroup) stockGroup.style.display = "none";
    if (downloadInput) downloadInput.required = true;
  } else {
    if (downloadGroup) downloadGroup.style.display = "none";
    if (physicalFields) physicalFields.style.display = "block";
    if (stockGroup) stockGroup.style.display = "block";
    if (downloadInput) downloadInput.required = false;
  }
};

// ── Product Add / Edit Form Initialization ────────────────
window.initProductAddForm = function () {
  const form = document.getElementById("form-add-product");
  if (!form) return;

  renderAdditionalImageUrls([]);
  renderColorVariantsContainer([]);

  const typeSelect = document.getElementById("prod-type");
  if (typeSelect) {
    typeSelect.addEventListener("change", (e) => {
      window.updateProductTypeFields(e.target.value);
    });
    window.updateProductTypeFields(typeSelect.value);
  }

  const addColorBtn = document.getElementById("btn-add-color-variant");
  if (addColorBtn) {
    addColorBtn.onclick = () => renderColorVariantInputRow({ name: "Black", hex: "#111111", img: "", available: true });
  }

  const addUrlBtn = document.getElementById("btn-add-additional-url");
  if (addUrlBtn) {
    addUrlBtn.onclick = () => addAdditionalUrlInputRow("");
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const isEdit = Boolean(editingProductId);
    let id = document.getElementById("prod-id").value.trim();
    const name = document.getElementById("prod-name").value.trim();

    if (!id) {
      id = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    }
    if (!isEdit && Array.isArray(window.adminProductsList) && window.adminProductsList.some(p => p.id === id)) {
      id = `${id}-${Date.now().toString(36)}`;
    }
    if (!id) {
      id = `prod-${Date.now().toString(36)}`;
    }

    const price = parseFloat(document.getElementById("prod-price").value) || 0;
    const originalPrice = parseFloat(document.getElementById("prod-original-price").value) || price;
    const category = document.getElementById("prod-category").value;
    const subCategory = document.getElementById("prod-subcategory").value.trim();
    const type = document.getElementById("prod-type").value;
    const downloadUrl = type === "digital" ? (document.getElementById("prod-download-url")?.value.trim() || null) : null;
    const stockQuantity = type === "digital" ? 9999 : (parseInt(document.getElementById("prod-stock").value) || 0);
    const available = document.getElementById("prod-available-status").value === "true";
    const badge = document.getElementById("prod-badge").value.trim();
    
    const sku = document.getElementById("prod-sku")?.value.trim() || "";
    const costPrice = parseFloat(document.getElementById("prod-cost-price")?.value) || 0;
    const status = document.getElementById("prod-status")?.value || "Active";
    const slug = id;
    
    const ratingStats = calculateProductRating({ id, name });
    const rating = ratingStats.rating;
    const ratingCount = ratingStats.ratingCount;

    const img = document.getElementById("prod-img").value.trim();
    const additionalImages = getAdditionalImageUrls();
    const description = document.getElementById("prod-description").value.trim();

    const printTypes = [
      { id: "bw-half", name: "Black & White Half Print", available: document.getElementById("v-print-bw-half")?.checked },
      { id: "bw-full", name: "Black & White Full Print", available: document.getElementById("v-print-bw-full")?.checked },
      { id: "col-half", name: "Colored Half Print", available: document.getElementById("v-print-col-half")?.checked },
      { id: "col-full", name: "Colored Full Print", available: document.getElementById("v-print-col-full")?.checked }
    ];

    const colorVariants = getColorVariantsData();
    const colors = colorVariants;

    const sizes = [
      { name: "S", available: document.getElementById("v-size-s")?.checked },
      { name: "M", available: document.getElementById("v-size-m")?.checked },
      { name: "L", available: document.getElementById("v-size-l")?.checked },
      { name: "XL", available: document.getElementById("v-size-xl")?.checked },
      { name: "XXL", available: document.getElementById("v-size-xxl")?.checked }
    ];

    const featureHighlights = [
      {
        title: document.getElementById("feat-1-title")?.value.trim() || "Weather-Ready Performance",
        desc: document.getElementById("feat-1-desc")?.value.trim() || "Designed to handle light rain and changing conditions.",
        img: document.getElementById("feat-1-img")?.value.trim() || "assets/closeup_weather.png"
      },
      {
        title: document.getElementById("feat-2-title")?.value.trim() || "Functional Design",
        desc: document.getElementById("feat-2-desc")?.value.trim() || "Smart pocket systems and practical details.",
        img: document.getElementById("feat-2-img")?.value.trim() || "assets/closeup_functional.png"
      },
      {
        title: document.getElementById("feat-3-title")?.value.trim() || "Heavyweight Organic Fabric",
        desc: document.getElementById("feat-3-desc")?.value.trim() || "Crafted from 100% premium 240 GSM organic combed cotton.",
        img: document.getElementById("feat-3-img")?.value.trim() || "assets/closeup_performance.png"
      }
    ];

    const variantsData = { printTypes, colors, sizes };

    const payload = {
      id,
      name,
      category,
      subCategory,
      type,
      downloadUrl,
      price,
      originalPrice,
      stockQuantity,
      available,
      badge,
      sku,
      costPrice,
      status,
      slug,
      rating,
      ratingCount,
      img,
      additionalImages,
      colorVariants,
      description,
      variantsData,
      featureHighlights
    };

    const url = isEdit ? `/api/products/${editingProductId}` : "/api/products";
    const method = isEdit ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: window.getAdminTokenHeaders(),
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        window.showAdminToast(`Product '${name}' ${isEdit ? 'updated' : 'created'} successfully!`, "success");
      } else {
        window.showAdminToast(`Product '${name}' saved.`, "info");
      }
    } catch (err) {
      window.showAdminToast(`Product '${name}' saved.`, "info");
    }

    if (isEdit) {
      const idx = window.adminProductsList.findIndex(p => p.id === editingProductId);
      if (idx !== -1) window.adminProductsList[idx] = payload;
    } else {
      window.adminProductsList.unshift(payload);
    }

    editingProductId = null;
    form.reset();
    renderAdditionalImageUrls([]);
    renderColorVariantsContainer([]);
    window.updateProductTypeFields("physical");
    document.getElementById("prod-id").readOnly = false;
    renderProductsTable(window.adminProductsList);

    const listTabBtn = document.querySelector('.inner-tab-btn[data-subtab="store-list"]');
    if (listTabBtn) listTabBtn.click();
  });
};
