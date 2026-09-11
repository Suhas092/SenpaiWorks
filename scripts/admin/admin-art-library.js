/**
 * SenpaiWorks Admin Console - Art Library & Categories Module
 * scripts/admin/admin-art-library.js
 */

let cacheArtworksList = [];
let artCurrentCat = "all";
let artCurrentPage = 1;
let artPageSize = 10;
let editingArtworkId = null;
let selectedFileBase64 = null;
let selectedFileName = "";
let allCategoriesList = [];
let draggedCategoryRowIndex = null;

// ── Artworks Pagination ────────────────────────────────────
window.changeArtPage = function (p) {
  artCurrentPage = p;
  window.loadArtworks();
};

// ── Load & Render Artworks ─────────────────────────────────
window.loadArtworks = async function () {
  const tbody = document.getElementById("artworks-list-body");
  const countSpan = document.getElementById("artwork-table-count");
  const searchInput = document.getElementById("artwork-search");
  const pageSizeSelect = document.getElementById("art-page-size");
  if (!tbody) return;

  if (pageSizeSelect) artPageSize = parseInt(pageSizeSelect.value) || 10;

  try {
    const res = await fetch("/api/artworks");
    if (res.ok) {
      const dbArtworks = await res.json();
      if (Array.isArray(dbArtworks)) {
        cacheArtworksList = dbArtworks;
      }
    }
  } catch (err) {
    console.warn("Could not fetch artworks from backend:", err);
  }

  let filtered = [...cacheArtworksList];

  const query = searchInput ? searchInput.value.toLowerCase().trim() : "";
  if (query) {
    filtered = filtered.filter(a =>
      (a.charname || "").toLowerCase().includes(query) ||
      (a.source || "").toLowerCase().includes(query) ||
      (a.category || "").toLowerCase().includes(query) ||
      (a.artstyle || "").toLowerCase().includes(query) ||
      (a.software || "").toLowerCase().includes(query)
    );
  }

  if (artCurrentCat !== "all") {
    filtered = filtered.filter(a => a.category === artCurrentCat);
  }

  const totalItems = filtered.length;
  const totalPages = Math.ceil(totalItems / artPageSize) || 1;
  if (artCurrentPage > totalPages) artCurrentPage = 1;

  const startIdx = (artCurrentPage - 1) * artPageSize;
  const endIdx = Math.min(startIdx + artPageSize, totalItems);
  const paginated = filtered.slice(startIdx, endIdx);

  if (countSpan) {
    countSpan.textContent = totalItems === 0 ? "Showing 0 items" : `Showing ${startIdx + 1} - ${endIdx} of ${totalItems} items`;
  }

  window.renderPagination("art-page-controls", totalItems, artCurrentPage, artPageSize, "window.changeArtPage");

  if (paginated.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: #94a3b8; padding: 24px;">No matching artworks found.</td></tr>`;
    return;
  }

  tbody.innerHTML = paginated.map(a => {
    const formattedDate = a.createdAt ? new Date(a.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '01 Aug 2026';
    return `
      <tr>
        <td class="td-checkbox"><input type="checkbox" class="tbl-checkbox"></td>
        <td>
          <div class="art-thumb-cell">
            <img src="${a.img}" alt="${window.escapeHtml(a.charname)}" class="art-preview-thumb">
            <div>
              <strong class="art-title-text">${window.escapeHtml(a.charname)}</strong>
              <br><small class="art-date-text"><i class="fa-regular fa-calendar"></i> ${formattedDate}</small>
            </div>
          </div>
        </td>
        <td>
          <span class="badge badge-type">${window.escapeHtml((a.category || "").replace('-', ' '))}</span>
          <br><small class="art-style-text">${window.escapeHtml(a.artstyle || 'Digital Art')}</small>
        </td>
        <td>
          <div class="art-artist-block">
            <strong class="art-artist-name">${window.escapeHtml(a.artist || 'SenpaiWorks Official')}</strong>
            <br><small class="art-source-name">${window.escapeHtml(a.source || 'SenpaiWorks Original')}</small>
          </div>
        </td>
        <td>
          <div class="art-engagement-stats">
            <span title="Likes" class="stat-like"><i class="fa-solid fa-heart"></i> ${a.likeCount || 0}</span>
            <span title="Comments" class="stat-comment"><i class="fa-solid fa-comment"></i> ${a.commentCount || 0}</span>
            <span title="Interested" class="stat-star"><i class="fa-solid fa-star"></i> ${a.interestCount || 0}</span>
            <span title="Downloads" class="stat-download"><i class="fa-solid fa-download"></i> ${a.downloadCount || 0}</span>
          </div>
        </td>
        <td>
          <button class="action-btn btn-edit" onclick="window.editArtwork(${a.id})" title="Edit Artwork"><i class="fa-solid fa-pen"></i> Edit</button>
          <button class="action-btn btn-delete" onclick="window.deleteArtwork(${a.id})" title="Delete Artwork"><i class="fa-solid fa-trash"></i> Delete</button>
        </td>
      </tr>
    `;
  }).join("");
};

// ── Edit Artwork ──────────────────────────────────────────
window.editArtwork = function (id) {
  const artwork = cacheArtworksList.find(a => a.id === id);
  if (!artwork) {
    window.showAdminToast("Artwork not found.", "warning");
    return;
  }

  editingArtworkId = artwork.id;

  const charnameInput = document.getElementById("art-charname");
  const categorySelect = document.getElementById("art-category");
  const artistInput = document.getElementById("art-artist");
  const sourceInput = document.getElementById("art-source");
  const sexSelect = document.getElementById("art-sex");
  const artstyleInput = document.getElementById("art-artstyle");
  const imgInput = document.getElementById("art-img");
  const descriptionInput = document.getElementById("art-description");
  const aboutDescInput = document.getElementById("art-about-desc");
  const formTitle = document.querySelector("#art-add h2");
  const submitBtn = document.querySelector("#form-add-artwork button[type='submit']");

  if (charnameInput) charnameInput.value = artwork.charname || "";
  if (categorySelect) categorySelect.value = artwork.category || "digital-portrait";
  if (artistInput) artistInput.value = artwork.artist || "SenpaiWorks Official";
  if (sourceInput) sourceInput.value = artwork.source || "SenpaiWorks Original";
  if (sexSelect) sexSelect.value = artwork.sex || "Female";
  if (artstyleInput) artstyleInput.value = artwork.artstyle || "Digital Art";
  if (imgInput) {
    imgInput.value = artwork.img || "";
    imgInput.dispatchEvent(new Event("input"));
  }
  if (descriptionInput) descriptionInput.value = artwork.description || "";
  if (aboutDescInput) aboutDescInput.value = artwork.aboutDesc || "";

  if (formTitle) {
    formTitle.innerHTML = `<i class="fa-solid fa-pen-to-square"></i> Edit Artwork: ${window.escapeHtml(artwork.charname)}`;
  }
  if (submitBtn) {
    submitBtn.innerHTML = `<i class="fa-solid fa-save"></i> Save Artwork Changes`;
  }

  const addTabBtn = document.querySelector('.inner-tab-btn[data-subtab="art-add"]');
  if (addTabBtn) addTabBtn.click();
};

// ── Delete Artwork ────────────────────────────────────────
window.deleteArtwork = async function (id) {
  const confirmed = await window.showAdminConfirm(
    "Delete Artwork",
    "Are you sure you want to delete this artwork? This action cannot be undone.",
    "Delete Artwork",
    "danger"
  );
  if (!confirmed) return;

  try {
    const res = await fetch(`/api/artworks/${id}`, {
      method: "DELETE",
      headers: window.getAdminTokenHeaders()
    });

    if (res.ok) {
      window.showAdminToast("Artwork deleted successfully!", "success");
      window.loadArtworks();
    } else {
      const data = await res.json();
      window.showAdminToast(data.error || "Delete Failed", "danger");
    }
  } catch (err) {
    console.error("Delete Artwork Error:", err);
    window.showAdminToast("Error deleting artwork from server.", "danger");
  }
};

// ── Add / Edit Artwork Form Initialization ────────────────
window.initArtworkForm = function () {
  const form = document.getElementById("form-add-artwork");
  if (!form) return;

  if (form.dataset.hasSubmitListener) return;
  form.dataset.hasSubmitListener = "true";

  const btnTabDevice = document.getElementById("btn-tab-device");
  const btnTabUrl = document.getElementById("btn-tab-url");
  const wrapDevice = document.getElementById("wrap-device-upload");
  const wrapUrl = document.getElementById("wrap-url-upload");
  const fileInput = document.getElementById("art-file-input");
  const addImgInput = document.getElementById("art-img");
  const imgBox = document.getElementById("add-art-img-box");
  const statusSpan = document.getElementById("add-art-img-status");

  // Tab switching between Device Upload & Web URL
  if (btnTabDevice && btnTabUrl && wrapDevice && wrapUrl) {
    btnTabDevice.addEventListener("click", () => {
      btnTabDevice.classList.add("active");
      btnTabUrl.classList.remove("active");
      wrapDevice.style.display = "block";
      wrapUrl.style.display = "none";
    });

    btnTabUrl.addEventListener("click", () => {
      btnTabUrl.classList.add("active");
      btnTabDevice.classList.remove("active");
      wrapUrl.style.display = "block";
      wrapDevice.style.display = "none";
    });
  }

  // Device File Selection
  if (fileInput) {
    fileInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file) return;

      selectedFileName = file.name;
      const reader = new FileReader();
      reader.onload = function (evt) {
        selectedFileBase64 = evt.target.result;
        if (imgBox) {
          imgBox.innerHTML = `<img src="${selectedFileBase64}" alt="Preview" class="art-form-preview-img">`;
        }
        if (statusSpan) {
          statusSpan.className = "image-preview-status valid";
          statusSpan.innerHTML = `<i class="fa-solid fa-circle-check"></i> Device File Loaded (${window.escapeHtml(file.name)})`;
        }
      };
      reader.readAsDataURL(file);
    });
  }

  // Web URL Input
  if (addImgInput) {
    addImgInput.addEventListener("input", () => {
      const url = addImgInput.value.trim();
      if (!url) {
        if (!selectedFileBase64) {
          if (imgBox) imgBox.innerHTML = `<i class="fa-solid fa-image"></i>`;
          if (statusSpan) {
            statusSpan.className = "image-preview-status invalid";
            statusSpan.textContent = "No image loaded";
          }
        }
        return;
      }

      selectedFileBase64 = null;
      if (imgBox) {
        imgBox.innerHTML = `<img src="${url}" alt="Preview" class="art-form-preview-img" onerror="this.remove(); document.getElementById('add-art-img-box').innerHTML='<i class=\\'fa-solid fa-image-slash\\'></i>'; const s=document.getElementById('add-art-img-status'); if(s){s.className='image-preview-status invalid'; s.innerHTML='Invalid Image URL';}">`;
      }
      if (statusSpan) {
        statusSpan.className = "image-preview-status valid";
        statusSpan.innerHTML = `<i class="fa-solid fa-circle-check"></i> Live Preview Loaded`;
      }
    });
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const charname = document.getElementById("art-charname").value.trim();
    const category = document.getElementById("art-category").value;
    const artist = document.getElementById("art-artist") ? document.getElementById("art-artist").value.trim() : "SenpaiWorks Official";
    const source = document.getElementById("art-source") ? document.getElementById("art-source").value.trim() : "SenpaiWorks Original";
    const sex = document.getElementById("art-sex") ? document.getElementById("art-sex").value : "Female";
    const artstyle = document.getElementById("art-artstyle") ? document.getElementById("art-artstyle").value.trim() : "Digital Art";
    const description = document.getElementById("art-description").value.trim();
    const aboutDesc = document.getElementById("art-about-desc") ? document.getElementById("art-about-desc").value.trim() : "";
    let img = document.getElementById("art-img") ? document.getElementById("art-img").value.trim() : "";

    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Processing & Uploading...`;
    }

    try {
      if (selectedFileBase64) {
        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            imageBase64: selectedFileBase64,
            fileName: selectedFileName
          })
        });

        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          img = uploadData.url;
        } else {
          throw new Error("Failed to upload image file to backend server.");
        }
      }

      if (!img) {
        window.showAdminToast("Please upload an image file from your device or enter an image URL.", "warning");
        if (submitBtn) submitBtn.disabled = false;
        return;
      }

      const isEdit = editingArtworkId !== null;
      const url = isEdit ? `/api/artworks/${editingArtworkId}` : "/api/artworks";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: window.getAdminTokenHeaders(),
        body: JSON.stringify({
          charname,
          artist,
          source,
          category,
          sex,
          img,
          description,
          aboutDesc,
          artstyle
        })
      });

      const data = await res.json();

      if (res.ok) {
        window.showAdminToast(`Artwork "${charname}" ${isEdit ? 'updated' : 'uploaded'} successfully!`, "success");
        form.reset();
        selectedFileBase64 = null;
        selectedFileName = "";
        editingArtworkId = null;

        const formTitle = document.querySelector("#art-add h2");
        if (formTitle) formTitle.innerHTML = `<i class="fa-solid fa-plus-circle"></i> Add New Artwork`;
        if (submitBtn) submitBtn.innerHTML = `<i class="fa-solid fa-cloud-arrow-up"></i> Upload Artwork Asset`;

        if (imgBox) imgBox.innerHTML = `<i class="fa-solid fa-image"></i>`;
        if (statusSpan) {
          statusSpan.className = "image-preview-status invalid";
          statusSpan.innerHTML = `<i class="fa-solid fa-circle-info"></i> No image loaded`;
        }

        window.loadArtworks();

        const listSubtab = document.querySelector('[data-subtab="art-list"]');
        if (listSubtab) listSubtab.click();
      } else {
        window.showAdminToast("Operation Failed: " + (data.error || "Bad request"), "danger");
      }
    } catch (err) {
      console.error("Artwork Form Error:", err);
      window.showAdminToast("Error: " + err.message, "danger");
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
      }
    }
  });

  // Attach search and filter listeners
  const artSearch = document.getElementById("artwork-search");
  const artSearchBtn = document.getElementById("artwork-search-btn");
  const artSearchIconBtn = document.getElementById("art-search-icon-btn");

  const triggerArtSearch = () => {
    artCurrentPage = 1;
    window.loadArtworks();
  };

  if (artSearch) {
    artSearch.addEventListener("input", triggerArtSearch);
    artSearch.addEventListener("keydown", (e) => {
      if (e.key === "Enter") triggerArtSearch();
    });
  }
  if (artSearchBtn) artSearchBtn.addEventListener("click", triggerArtSearch);
  if (artSearchIconBtn) artSearchIconBtn.addEventListener("click", triggerArtSearch);

  const artPageSizeSelect = document.getElementById("art-page-size");
  if (artPageSizeSelect) {
    artPageSizeSelect.addEventListener("change", () => {
      artPageSize = parseInt(artPageSizeSelect.value) || 10;
      artCurrentPage = 1;
      window.loadArtworks();
    });
  }

  const artPrintBtn = document.getElementById("art-print-btn");
  if (artPrintBtn) {
    artPrintBtn.addEventListener("click", () => window.printTableElement("artworks-table", "SenpaiWorks - Gallery Artworks"));
  }

  const artExportBtn = document.getElementById("art-export-btn");
  if (artExportBtn) {
    artExportBtn.addEventListener("click", () => {
      const headers = ["ID", "Character", "Source Anime", "Category", "Gender", "Image URL"];
      const rows = cacheArtworksList.map(a => [a.id, a.charname, a.source, a.category, a.sex || "Female", a.img]);
      window.exportTableCSV("senpaiworks_artworks.csv", headers, rows);
    });
  }

  const artViewToggle = document.getElementById("art-view-toggle");
  if (artViewToggle) {
    artViewToggle.addEventListener("click", () => {
      document.getElementById("artworks-table")?.classList.toggle("compact-mode");
    });
  }

  const artSelectToggle = document.getElementById("art-select-toggle");
  if (artSelectToggle) {
    artSelectToggle.addEventListener("click", () => {
      document.getElementById("artworks-table")?.classList.toggle("table-show-checkboxes");
      artSelectToggle.classList.toggle("active");
    });
  }

  const artSelectAll = document.getElementById("art-select-all");
  if (artSelectAll) {
    artSelectAll.addEventListener("change", () => {
      document.querySelectorAll("#artworks-list-body .tbl-checkbox").forEach(cb => cb.checked = artSelectAll.checked);
    });
  }
};

// ── Category Management Logic ─────────────────────────────
function renderCategoryTableRows(listBody) {
  if (!listBody) return;
  if (allCategoriesList.length === 0) {
    listBody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 24px;">No categories found.</td></tr>`;
    return;
  }

  listBody.innerHTML = allCategoriesList.map((cat, idx) => `
    <tr draggable="true" class="cat-row-draggable" data-cat-id="${cat.id}" data-idx="${idx}">
      <td style="text-align: center;"><strong>${idx + 1}</strong></td>
      <td style="text-align: center; color: #64748b;">
        <i class="fa-solid fa-grip-lines drag-handle"></i>
      </td>
      <td><strong>${window.escapeHtml(cat.name)}</strong></td>
      <td><code>${window.escapeHtml(cat.slug)}</code></td>
      <td>${new Date(cat.createdAt).toLocaleDateString()}</td>
      <td>
        <button class="action-btn btn-delete" onclick="window.deleteCategory(${cat.id}, '${window.escapeHtml(cat.name).replace(/'/g, "\\'")}')" title="Delete Category">
          <i class="fa-solid fa-trash"></i>
        </button>
      </td>
    </tr>
  `).join("");

  const rows = listBody.querySelectorAll(".cat-row-draggable");
  rows.forEach(row => {
    row.addEventListener("dragstart", (e) => {
      draggedCategoryRowIndex = parseInt(row.getAttribute("data-idx"), 10);
      row.style.opacity = "0.4";
      e.dataTransfer.effectAllowed = "move";
    });

    row.addEventListener("dragend", () => {
      row.style.opacity = "1";
      rows.forEach(r => r.style.borderTop = "");
    });

    row.addEventListener("dragover", (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      row.style.borderTop = "2px solid #2563eb";
    });

    row.addEventListener("dragleave", () => {
      row.style.borderTop = "";
    });

    row.addEventListener("drop", async (e) => {
      e.preventDefault();
      row.style.borderTop = "";
      const targetIndex = parseInt(row.getAttribute("data-idx"), 10);
      if (draggedCategoryRowIndex === null || draggedCategoryRowIndex === targetIndex) return;

      const movedItem = allCategoriesList.splice(draggedCategoryRowIndex, 1)[0];
      allCategoriesList.splice(targetIndex, 0, movedItem);
      draggedCategoryRowIndex = null;

      renderCategoryTableRows(listBody);
      updateCategoryDropdownsAndPills();

      try {
        const categoryIds = allCategoriesList.map(c => c.id);
        await fetch("/api/categories/reorder-all", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ categoryIds })
        });
      } catch (err) {
        console.error("Error saving reordered categories:", err);
      }
    });
  });
}

function updateCategoryDropdownsAndPills() {
  const artCatSelect = document.getElementById("art-category");
  const artCatSubtabs = document.getElementById("art-category-subtabs");

  if (artCatSelect) {
    const currentVal = artCatSelect.value;
    artCatSelect.innerHTML = allCategoriesList.map(cat => `
      <option value="${cat.slug}">${window.escapeHtml(cat.name)}</option>
    `).join("");
    if (currentVal && Array.from(artCatSelect.options).some(o => o.value === currentVal)) {
      artCatSelect.value = currentVal;
    }
  }

  if (artCatSubtabs) {
    let subtabsHTML = `<button type="button" class="table-subtab-pill ${artCurrentCat === 'all' ? 'active' : ''}" data-cat="all">All Artworks</button>`;
    allCategoriesList.forEach(cat => {
      subtabsHTML += `<button type="button" class="table-subtab-pill ${artCurrentCat === cat.slug ? 'active' : ''}" data-cat="${cat.slug}">${window.escapeHtml(cat.name)}</button>`;
    });
    artCatSubtabs.innerHTML = subtabsHTML;

    const catPills = artCatSubtabs.querySelectorAll(".table-subtab-pill");
    catPills.forEach(pill => {
      pill.addEventListener("click", () => {
        catPills.forEach(p => p.classList.remove("active"));
        pill.classList.add("active");
        artCurrentCat = pill.getAttribute("data-cat");
        artCurrentPage = 1;
        window.loadArtworks();
      });
    });
  }
}

window.loadAdminCategories = async function () {
  const listBody = document.getElementById("categories-list-body");

  try {
    const res = await fetch("/api/categories");
    if (!res.ok) return;
    allCategoriesList = await res.json();

    renderCategoryTableRows(listBody);
    updateCategoryDropdownsAndPills();
  } catch (err) {
    console.error("Error loading categories in admin:", err);
  }
};

window.initCategoryForm = function () {
  const form = document.getElementById("form-add-category");
  if (!form || form.dataset.hasCategoryListener) return;
  form.dataset.hasCategoryListener = "true";

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const input = document.getElementById("cat-new-name");
    const name = input ? input.value.trim() : "";
    if (!name) return;

    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name })
      });

      const data = await res.json();
      if (res.ok) {
        window.showAdminToast(`Category "${name}" created successfully!`, "success");
        input.value = "";
        window.loadAdminCategories();
      } else {
        window.showAdminToast(data.error || "Failed to create category", "danger");
      }
    } catch (err) {
      console.error("Error creating category:", err);
      window.showAdminToast("Unable to connect to server.", "danger");
    }
  });
};

window.deleteCategory = async function (id, name) {
  const confirmed = await window.showAdminConfirm(
    "Delete Category",
    `Are you sure you want to delete category "${name}"?`,
    "Delete Category",
    "danger"
  );
  if (!confirmed) return;

  try {
    const res = await fetch(`/api/categories/${id}`, {
      method: "DELETE"
    });
    if (res.ok) {
      window.showAdminToast(`Category "${name}" deleted successfully!`, "success");
      window.loadAdminCategories();
    } else {
      const data = await res.json();
      window.showAdminToast(data.error || "Failed to delete category", "danger");
    }
  } catch (err) {
    console.error("Error deleting category:", err);
    window.showAdminToast("Unable to connect to server.", "danger");
  }
};
