/**
 * SenpaiWorks Admin Console - Home Page Manager Module
 * scripts/admin/admin-homepage.js
 */

(function () {
  "use strict";

  let allHeroSlides = [];
  let allShowcaseItems = [];
  let allShortsItems = [];

  // Main loader called when "Home Page Manager" tab is activated
  window.loadHomepageManager = async function () {
    await Promise.all([
      loadHeroSlides(),
      loadShowcaseItems(),
      loadShortsItems(),
      loadHomeNewsOverview(),
      loadHomeMerchOverview()
    ]);
  };

  // Helper to switch main admin sidebar tabs
  window.navigateToAdminTab = function (tabId) {
    const link = document.querySelector(`.sidebar-link[data-tab="${tabId}"]`);
    if (link) {
      link.click();
    }
  };

  // Helper to switch main inner subtabs (Starting Hero Slides, Things You Might Like, Shorts & Entertainment, Featured News Overview, New Merch on Store)
  window.switchHomeSubtab = function (subtabId) {
    const tabBtns = document.querySelectorAll("#tab-homepage .inner-tab-btn");
    const tabContents = document.querySelectorAll("#tab-homepage .inner-tab-content");

    tabBtns.forEach(btn => {
      btn.classList.toggle("active", btn.getAttribute("data-subtab") === subtabId);
    });

    tabContents.forEach(content => {
      const match = content.id === subtabId;
      content.classList.toggle("active", match);
      content.style.display = match ? "block" : "none";
    });

    // When switching tabs, trigger data loader or show list view
    if (subtabId === "home-tab-slides") {
      window.showHeroSlidesList();
    } else if (subtabId === "home-tab-showcase") {
      window.showShowcaseList();
    } else if (subtabId === "home-tab-shorts") {
      window.showShortsList();
    } else if (subtabId === "home-tab-news") {
      loadHomeNewsOverview();
    } else if (subtabId === "home-tab-merch") {
      loadHomeMerchOverview();
    }

    const activeContent = document.getElementById(subtabId);
    if (activeContent) {
      activeContent.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // =========================================================================
  // 1. HERO SLIDES IN-TAB NAVIGATION & BREADCRUMB
  // =========================================================================
  window.showHeroSlidesList = function () {
    const listView = document.getElementById("hero-slides-list-view");
    const editorView = document.getElementById("hero-slides-editor-view");
    const sep = document.getElementById("hero-crumb-sep");
    const current = document.getElementById("hero-crumb-current");

    if (listView) listView.style.display = "block";
    if (editorView) editorView.style.display = "none";
    if (sep) sep.style.display = "none";
    if (current) current.style.display = "none";
  };

  window.openHeroSlideEditor = function (id) {
    const listView = document.getElementById("hero-slides-list-view");
    const editorView = document.getElementById("hero-slides-editor-view");
    const sep = document.getElementById("hero-crumb-sep");
    const current = document.getElementById("hero-crumb-current");
    const form = document.getElementById("form-hero-slide");

    if (!form) return;
    form.reset();
    document.getElementById("hero-slide-id").value = "";

    const titleEl = document.getElementById("hero-slide-editor-title");
    const subtitleEl = document.getElementById("hero-slide-editor-subtitle");
    const submitBtn = document.getElementById("hero-slide-submit-btn");

    if (id) {
      const slide = allHeroSlides.find(s => s.id === id);
      if (slide) {
        if (titleEl) titleEl.innerHTML = `<i class="fa-solid fa-pen-to-square"></i> Edit Hero Slide: ${window.escapeHtml(slide.title)}`;
        if (subtitleEl) subtitleEl.textContent = `Update spotlight details, background video/image, or button call-to-actions for "${slide.title}".`;
        if (submitBtn) submitBtn.innerHTML = `<i class="fa-solid fa-save"></i> Update Hero Slide`;
        if (current) current.textContent = `Hero Slide Editor (${slide.title})`;

        document.getElementById("hero-slide-id").value = slide.id;
        document.getElementById("hero-slide-spotlight").value = slide.spotlight || "#1 Spotlight";
        document.getElementById("hero-slide-title").value = slide.title || "";
        document.getElementById("hero-slide-desc").value = slide.description || "";
        document.getElementById("hero-slide-bgtype").value = slide.bgType || "image";
        document.getElementById("hero-slide-bgurl").value = slide.bgUrl || "";
        document.getElementById("hero-slide-btn1-text").value = slide.primaryBtnText || "";
        document.getElementById("hero-slide-btn1-link").value = slide.primaryBtnLink || "";
        document.getElementById("hero-slide-btn2-text").value = slide.secondaryBtnText || "";
        document.getElementById("hero-slide-btn2-link").value = slide.secondaryBtnLink || "";
        document.getElementById("hero-slide-order").value = slide.order !== undefined ? slide.order : 0;
        document.getElementById("hero-slide-published").checked = Boolean(slide.published);
      }
    } else {
      if (titleEl) titleEl.innerHTML = '<i class="fa-solid fa-plus-circle"></i> Create Hero Spotlight Slide';
      if (subtitleEl) subtitleEl.textContent = 'Customize title, spotlight tag, background media, and action buttons for the hero carousel.';
      if (submitBtn) submitBtn.innerHTML = '<i class="fa-solid fa-save"></i> Save Hero Slide';
      if (current) current.textContent = 'Hero Slide Editor (New Slide)';

      document.getElementById("hero-slide-order").value = allHeroSlides.length + 1;
      document.getElementById("hero-slide-published").checked = true;
    }

    if (listView) listView.style.display = "none";
    if (editorView) editorView.style.display = "block";
    if (sep) sep.style.display = "inline-flex";
    if (current) current.style.display = "inline-flex";

    editorView.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  window.openHeroSlideModal = window.openHeroSlideEditor;
  window.closeHeroSlideModal = window.showHeroSlidesList;

  async function loadHeroSlides() {
    const tbody = document.getElementById("hero-slides-table-body");
    if (!tbody) return;

    try {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:24px;color:var(--text-secondary);"><i class="fa-solid fa-spinner fa-spin"></i> Loading hero slides...</td></tr>';
      let res = await fetch("/api/admin/homepage/hero-slides", { headers: window.getAdminTokenHeaders ? window.getAdminTokenHeaders() : {} });
      if (!res.ok) {
        res = await fetch("/api/homepage/hero-slides");
      }

      if (!res.ok) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:20px;color:#ef4444;">Failed to load hero slides.</td></tr>';
        return;
      }

      allHeroSlides = await res.json();
      renderHeroSlidesTable();
    } catch (e) {
      console.error("Failed to fetch hero slides:", e);
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:20px;color:#ef4444;">Error connecting to server.</td></tr>';
    }
  }

  function renderHeroSlidesTable() {
    const tbody = document.getElementById("hero-slides-table-body");
    const countEl = document.getElementById("hero-slides-count");
    if (!tbody) return;

    if (countEl) countEl.textContent = `${allHeroSlides.length} Slides`;

    if (allHeroSlides.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:30px;color:var(--text-secondary);">No hero slides yet. Click "Add Hero Slide" above.</td></tr>';
      return;
    }

    tbody.innerHTML = allHeroSlides.map(slide => {
      const isVideo = slide.bgType === "video";
      const preview = isVideo
        ? `<div style="width:72px;height:45px;background:#000;border-radius:6px;display:flex;align-items:center;justify-content:center;color:#60a5fa;font-size:1.1rem;"><i class="fa-solid fa-play"></i></div>`
        : `<img src="${window.escapeHtml(slide.bgUrl)}" alt="Preview" style="width:72px;height:45px;object-fit:cover;border-radius:6px;border:1px solid rgba(255,255,255,0.1);">`;

      const pubBadge = slide.published
        ? `<span class="badge" style="background:#10b981;color:#fff;font-size:0.75rem;padding:3px 8px;border-radius:6px;">Visible</span>`
        : `<span class="badge" style="background:rgba(255,255,255,0.12);color:var(--text-secondary);font-size:0.75rem;padding:3px 8px;border-radius:6px;">Draft</span>`;

      return `
        <tr>
          <td>${preview}</td>
          <td>
            <strong style="color:var(--text-primary);font-size:0.95rem;display:block;">${window.escapeHtml(slide.title)}</strong>
            <span style="font-size:0.78rem;color:#60a5fa;font-weight:700;">${window.escapeHtml(slide.spotlight)}</span>
          </td>
          <td>
            <div style="font-size:0.8rem;color:var(--text-secondary);max-width:280px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
              ${window.escapeHtml(slide.description || "No description")}
            </div>
          </td>
          <td>
            <div style="font-size:0.8rem;color:var(--text-primary);">
              ${slide.primaryBtnText ? `<div><strong>1:</strong> ${window.escapeHtml(slide.primaryBtnText)}</div>` : ''}
              ${slide.secondaryBtnText ? `<div><strong>2:</strong> ${window.escapeHtml(slide.secondaryBtnText)}</div>` : ''}
            </div>
          </td>
          <td>
            <span style="font-weight:700;color:var(--text-primary);">${slide.order}</span>
          </td>
          <td>
            <button type="button" onclick="window.toggleHeroSlideStatus('${slide.id}', ${slide.published})" style="background:transparent;border:none;cursor:pointer;">
              ${pubBadge}
            </button>
          </td>
          <td style="text-align:right;white-space:nowrap;">
            <button type="button" class="action-btn btn-edit" onclick="window.openHeroSlideEditor('${slide.id}')" title="Edit Slide">
              <i class="fa-solid fa-pen"></i>
            </button>
            <button type="button" class="action-btn btn-delete" onclick="window.deleteHeroSlide('${slide.id}', '${window.escapeHtml(slide.title).replace(/'/g, "\\'")}')" title="Delete Slide">
              <i class="fa-solid fa-trash"></i>
            </button>
          </td>
        </tr>
      `;
    }).join("");
  }

  window.deleteHeroSlide = async function (id, title) {
    if (!confirm(`Are you sure you want to delete slide "${title}"?`)) return;

    try {
      const res = await fetch(`/api/admin/homepage/hero-slides/${id}`, {
        method: "DELETE",
        headers: window.getAdminTokenHeaders ? window.getAdminTokenHeaders() : {}
      });
      if (res.ok) {
        if (window.showAdminToast) window.showAdminToast("Slide deleted successfully", "success");
        loadHeroSlides();
      }
    } catch (e) {
      console.error("Failed to delete slide:", e);
    }
  };

  window.toggleHeroSlideStatus = async function (id, currentStatus) {
    try {
      const res = await fetch(`/api/admin/homepage/hero-slides/${id}`, {
        method: "PUT",
        headers: window.getAdminTokenHeaders ? window.getAdminTokenHeaders() : {},
        body: JSON.stringify({ published: !currentStatus })
      });
      if (res.ok) {
        if (window.showAdminToast) window.showAdminToast("Visibility updated", "success");
        loadHeroSlides();
      }
    } catch (e) {
      console.error("Failed to update status:", e);
    }
  };

  // =========================================================================
  // 2. SHOWCASE ITEMS IN-TAB NAVIGATION & BREADCRUMB (Things You Might Like)
  // =========================================================================
  window.showShowcaseList = function () {
    const listView = document.getElementById("showcase-list-view");
    const editorView = document.getElementById("showcase-editor-view");
    const sep = document.getElementById("showcase-crumb-sep");
    const current = document.getElementById("showcase-crumb-current");

    if (listView) listView.style.display = "block";
    if (editorView) editorView.style.display = "none";
    if (sep) sep.style.display = "none";
    if (current) current.style.display = "none";
  };

  window.openShowcaseEditor = function (id) {
    const listView = document.getElementById("showcase-list-view");
    const editorView = document.getElementById("showcase-editor-view");
    const sep = document.getElementById("showcase-crumb-sep");
    const current = document.getElementById("showcase-crumb-current");
    const form = document.getElementById("form-showcase-item");

    if (!form) return;
    form.reset();
    document.getElementById("showcase-item-id").value = "";

    const titleEl = document.getElementById("showcase-editor-title");
    const subtitleEl = document.getElementById("showcase-editor-subtitle");
    const submitBtn = document.getElementById("showcase-submit-btn");

    if (id) {
      const item = allShowcaseItems.find(i => i.id === id);
      if (item) {
        if (titleEl) titleEl.innerHTML = `<i class="fa-solid fa-pen-to-square"></i> Edit Showcase Card: ${window.escapeHtml(item.title)}`;
        if (subtitleEl) subtitleEl.textContent = `Update card title, description, and link for "${item.title}".`;
        if (submitBtn) submitBtn.innerHTML = `<i class="fa-solid fa-save"></i> Update Showcase Card`;
        if (current) current.textContent = `Showcase Card Editor (${item.title})`;

        document.getElementById("showcase-item-id").value = item.id;
        document.getElementById("showcase-title").value = item.title || "";
        document.getElementById("showcase-subtitle").value = item.subtitle || "";
        document.getElementById("showcase-desc").value = item.description || "";
        document.getElementById("showcase-imgurl").value = item.imageUrl || "";
        document.getElementById("showcase-linkurl").value = item.linkUrl || "";
        document.getElementById("showcase-btntext").value = item.btnText || "Explore";
        document.getElementById("showcase-order").value = item.order !== undefined ? item.order : 0;
        document.getElementById("showcase-published").checked = Boolean(item.published);
      }
    } else {
      if (titleEl) titleEl.innerHTML = '<i class="fa-solid fa-layer-group"></i> Create Showcase Card';
      if (subtitleEl) subtitleEl.textContent = 'Configure cards in the "Things You Might Like" homepage showcase.';
      if (submitBtn) submitBtn.innerHTML = '<i class="fa-solid fa-save"></i> Save Showcase Card';
      if (current) current.textContent = 'Showcase Card Editor (New Card)';

      document.getElementById("showcase-order").value = allShowcaseItems.length + 1;
      document.getElementById("showcase-published").checked = true;
    }

    if (listView) listView.style.display = "none";
    if (editorView) editorView.style.display = "block";
    if (sep) sep.style.display = "inline-flex";
    if (current) current.style.display = "inline-flex";

    editorView.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  window.openShowcaseModal = window.openShowcaseEditor;
  window.closeShowcaseModal = window.showShowcaseList;

  async function loadShowcaseItems() {
    const tbody = document.getElementById("showcase-items-table-body");
    if (!tbody) return;

    try {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:20px;color:var(--text-secondary);"><i class="fa-solid fa-spinner fa-spin"></i> Loading showcase items...</td></tr>';
      let res = await fetch("/api/admin/homepage/showcase-items", { headers: window.getAdminTokenHeaders ? window.getAdminTokenHeaders() : {} });
      if (!res.ok) {
        res = await fetch("/api/homepage/showcase-items?section=things_you_might_like");
      }

      if (!res.ok) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:20px;color:#ef4444;">Failed to load showcase items.</td></tr>';
        return;
      }

      const allItems = await res.json();
      allShowcaseItems = allItems.filter(i => !i.section || i.section === "things_you_might_like");
      renderShowcaseTable();
    } catch (e) {
      console.error("Failed to fetch showcase items:", e);
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:20px;color:#ef4444;">Error connecting to server.</td></tr>';
    }
  }

  function renderShowcaseTable() {
    const tbody = document.getElementById("showcase-items-table-body");
    const countEl = document.getElementById("showcase-items-count");
    if (!tbody) return;

    if (countEl) countEl.textContent = `${allShowcaseItems.length} Showcase Items`;

    if (allShowcaseItems.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:24px;color:var(--text-secondary);">No showcase items.</td></tr>';
      return;
    }

    tbody.innerHTML = allShowcaseItems.map(item => `
      <tr>
        <td>
          <img src="${window.escapeHtml(item.imageUrl)}" alt="Img" style="width:60px;height:45px;object-fit:cover;border-radius:6px;border:1px solid rgba(255,255,255,0.1);">
        </td>
        <td>
          <strong style="color:var(--text-primary);font-size:0.92rem;display:block;">${window.escapeHtml(item.title)}</strong>
          <span style="font-size:0.75rem;color:var(--text-secondary);">${window.escapeHtml(item.subtitle || "")}</span>
        </td>
        <td>
          <div style="font-size:0.8rem;color:var(--text-secondary);max-width:260px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
            ${window.escapeHtml(item.description)}
          </div>
        </td>
        <td>
          <span style="font-size:0.82rem;color:#818cf8;font-weight:600;">${window.escapeHtml(item.btnText || "Explore")}</span>
          <div style="font-size:0.75rem;color:var(--text-secondary);">${window.escapeHtml(item.linkUrl || "")}</div>
        </td>
        <td><strong>${item.order}</strong></td>
        <td style="text-align:right;white-space:nowrap;">
          <button type="button" class="action-btn btn-edit" onclick="window.openShowcaseEditor('${item.id}')" title="Edit Showcase Card">
            <i class="fa-solid fa-pen"></i>
          </button>
          <button type="button" class="action-btn btn-delete" onclick="window.deleteShowcaseItem('${item.id}', '${window.escapeHtml(item.title).replace(/'/g, "\\'")}')" title="Delete Item">
            <i class="fa-solid fa-trash"></i>
          </button>
        </td>
      </tr>
    `).join("");
  }

  window.deleteShowcaseItem = async function (id, title) {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return;

    try {
      const res = await fetch(`/api/admin/homepage/showcase-items/${id}`, {
        method: "DELETE",
        headers: window.getAdminTokenHeaders ? window.getAdminTokenHeaders() : {}
      });
      if (res.ok) {
        if (window.showAdminToast) window.showAdminToast("Item deleted", "success");
        loadShowcaseItems();
      }
    } catch (e) {
      console.error("Failed to delete showcase item:", e);
    }
  };

  // =========================================================================
  // 3. SHORTS & ENTERTAINMENT IN-TAB NAVIGATION & BREADCRUMB
  // =========================================================================
  window.showShortsList = function () {
    const listView = document.getElementById("shorts-list-view");
    const editorView = document.getElementById("shorts-editor-view");
    const sep = document.getElementById("shorts-crumb-sep");
    const current = document.getElementById("shorts-crumb-current");

    if (listView) listView.style.display = "block";
    if (editorView) editorView.style.display = "none";
    if (sep) sep.style.display = "none";
    if (current) current.style.display = "none";
  };

  window.openShortsEditor = function (id) {
    const listView = document.getElementById("shorts-list-view");
    const editorView = document.getElementById("shorts-editor-view");
    const sep = document.getElementById("shorts-crumb-sep");
    const current = document.getElementById("shorts-crumb-current");
    const form = document.getElementById("form-shorts-item");

    if (!form) return;
    form.reset();
    document.getElementById("shorts-item-id").value = "";

    const titleEl = document.getElementById("shorts-editor-title");
    const subtitleEl = document.getElementById("shorts-editor-subtitle");
    const submitBtn = document.getElementById("shorts-submit-btn");

    if (id) {
      const item = allShortsItems.find(i => i.id === id);
      if (item) {
        if (titleEl) titleEl.innerHTML = `<i class="fa-solid fa-pen-to-square"></i> Edit Short Card: ${window.escapeHtml(item.title)}`;
        if (subtitleEl) subtitleEl.textContent = `Update video title, poster image, and watch link for "${item.title}".`;
        if (submitBtn) submitBtn.innerHTML = `<i class="fa-solid fa-save"></i> Update Short Card`;
        if (current) current.textContent = `Short Video Editor (${item.title})`;

        document.getElementById("shorts-item-id").value = item.id;
        document.getElementById("shorts-title").value = item.title || "";
        document.getElementById("shorts-subtitle").value = item.subtitle || "";
        document.getElementById("shorts-imgurl").value = item.imageUrl || "";
        document.getElementById("shorts-linkurl").value = item.linkUrl || "";
        document.getElementById("shorts-btntext").value = item.btnText || "Start Watching";
        document.getElementById("shorts-order").value = item.order !== undefined ? item.order : 0;
        document.getElementById("shorts-published").checked = Boolean(item.published);
      }
    } else {
      if (titleEl) titleEl.innerHTML = '<i class="fa-solid fa-film"></i> Create Short / Entertainment Card';
      if (subtitleEl) subtitleEl.textContent = 'Configure videos and animations in the "Shorts & Entertainment" homepage carousel.';
      if (submitBtn) submitBtn.innerHTML = '<i class="fa-solid fa-save"></i> Save Short Card';
      if (current) current.textContent = 'Short Video Editor (New Reel)';

      document.getElementById("shorts-order").value = allShortsItems.length + 1;
      document.getElementById("shorts-published").checked = true;
    }

    if (listView) listView.style.display = "none";
    if (editorView) editorView.style.display = "block";
    if (sep) sep.style.display = "inline-flex";
    if (current) current.style.display = "inline-flex";

    editorView.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  async function loadShortsItems() {
    const tbody = document.getElementById("shorts-items-table-body");
    if (!tbody) return;

    try {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:20px;color:var(--text-secondary);"><i class="fa-solid fa-spinner fa-spin"></i> Loading shorts...</td></tr>';
      let res = await fetch("/api/admin/homepage/showcase-items", { headers: window.getAdminTokenHeaders ? window.getAdminTokenHeaders() : {} });
      if (!res.ok) {
        res = await fetch("/api/homepage/showcase-items?section=shorts_entertainment");
      }

      if (!res.ok) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:20px;color:#ef4444;">Failed to load shorts.</td></tr>';
        return;
      }

      const allItems = await res.json();
      allShortsItems = allItems.filter(i => i.section === "shorts_entertainment");
      renderShortsTable();
    } catch (e) {
      console.error("Failed to fetch shorts:", e);
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:20px;color:#ef4444;">Error connecting to server.</td></tr>';
    }
  }

  function renderShortsTable() {
    const tbody = document.getElementById("shorts-items-table-body");
    const countEl = document.getElementById("shorts-items-count");
    if (!tbody) return;

    if (countEl) countEl.textContent = `${allShortsItems.length} Shorts & Animations`;

    if (allShortsItems.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:24px;color:var(--text-secondary);">No shorts found. Click "Add Short / Reel" above.</td></tr>';
      return;
    }

    tbody.innerHTML = allShortsItems.map(item => {
      const pubBadge = item.published
        ? `<span class="badge" style="background:#10b981;color:#fff;font-size:0.75rem;padding:3px 8px;border-radius:6px;">Visible</span>`
        : `<span class="badge" style="background:rgba(255,255,255,0.12);color:var(--text-secondary);font-size:0.75rem;padding:3px 8px;border-radius:6px;">Draft</span>`;

      return `
        <tr>
          <td>
            <img src="${window.escapeHtml(item.imageUrl)}" alt="Poster" style="width:55px;height:75px;object-fit:cover;border-radius:6px;border:1px solid rgba(255,255,255,0.1);">
          </td>
          <td>
            <strong style="color:var(--text-primary);font-size:0.92rem;display:block;">${window.escapeHtml(item.title)}</strong>
            <span style="font-size:0.75rem;color:var(--text-secondary);">${window.escapeHtml(item.subtitle || item.description || "")}</span>
          </td>
          <td>
            <span style="font-size:0.82rem;color:#60a5fa;font-weight:600;"><i class="fa-solid fa-play" style="font-size:0.7rem;"></i> ${window.escapeHtml(item.btnText || "Start Watching")}</span>
            <div style="font-size:0.75rem;color:var(--text-secondary);max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${window.escapeHtml(item.linkUrl || "")}</div>
          </td>
          <td><strong>${item.order}</strong></td>
          <td>
            <button type="button" onclick="window.toggleShortsStatus('${item.id}', ${item.published})" style="background:transparent;border:none;cursor:pointer;">
              ${pubBadge}
            </button>
          </td>
          <td style="text-align:right;white-space:nowrap;">
            <button type="button" class="action-btn btn-edit" onclick="window.openShortsEditor('${item.id}')" title="Edit Short">
              <i class="fa-solid fa-pen"></i>
            </button>
            <button type="button" class="action-btn btn-delete" onclick="window.deleteShortsItem('${item.id}', '${window.escapeHtml(item.title).replace(/'/g, "\\'")}')" title="Delete Short">
              <i class="fa-solid fa-trash"></i>
            </button>
          </td>
        </tr>
      `;
    }).join("");
  }

  window.deleteShortsItem = async function (id, title) {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return;

    try {
      const res = await fetch(`/api/admin/homepage/showcase-items/${id}`, {
        method: "DELETE",
        headers: window.getAdminTokenHeaders ? window.getAdminTokenHeaders() : {}
      });
      if (res.ok) {
        if (window.showAdminToast) window.showAdminToast("Short deleted", "success");
        loadShortsItems();
      }
    } catch (e) {
      console.error("Failed to delete short item:", e);
    }
  };

  window.toggleShortsStatus = async function (id, currentStatus) {
    try {
      const res = await fetch(`/api/admin/homepage/showcase-items/${id}`, {
        method: "PUT",
        headers: window.getAdminTokenHeaders ? window.getAdminTokenHeaders() : {},
        body: JSON.stringify({ published: !currentStatus })
      });
      if (res.ok) {
        if (window.showAdminToast) window.showAdminToast("Visibility updated", "success");
        loadShortsItems();
      }
    } catch (e) {
      console.error("Failed to update status:", e);
    }
  };

  // =========================================================================
  // 4. FEATURED NEWS OVERVIEW
  // =========================================================================
  async function loadHomeNewsOverview() {
    const container = document.getElementById("home-featured-news-preview-wrap");
    if (!container) return;

    try {
      const res = await fetch("/api/news/featured");
      if (!res.ok) return;

      const { mainFeature, recommended } = await res.json();
      container.innerHTML = `
        <div style="display:grid;grid-template-columns:1.2fr 1fr;gap:20px;align-items:start;">
          <div style="background:var(--bg-secondary);border:1px solid var(--border-color);padding:20px;border-radius:12px;">
            <span class="badge" style="background:#6366f1;color:#fff;font-size:0.75rem;padding:3px 8px;border-radius:6px;margin-bottom:8px;display:inline-block;">Main Feature Card</span>
            <h3 style="margin:6px 0;font-size:1.1rem;color:var(--text-primary);">${mainFeature ? window.escapeHtml(mainFeature.title) : 'None selected'}</h3>
            <p style="font-size:0.84rem;color:var(--text-secondary);">${mainFeature ? window.escapeHtml(mainFeature.summary || '') : ''}</p>
            <div style="margin-top:14px;display:flex;gap:10px;flex-wrap:wrap;">
              ${mainFeature ? `
                <button type="button" class="admin-submit-btn" onclick="window.openEditNewsModal('${mainFeature.id}')" style="padding:6px 14px;font-size:0.8rem;display:inline-flex;align-items:center;gap:6px;border:none;cursor:pointer;">
                  <i class="fa-solid fa-pen"></i> Edit Article
                </button>
              ` : ''}
              <button type="button" class="btn-refresh" onclick="window.navigateToAdminTab('tab-news')" style="padding:6px 14px;font-size:0.8rem;display:inline-flex;align-items:center;gap:6px;cursor:pointer;">
                <i class="fa-solid fa-newspaper"></i> Open News & Articles Database
              </button>
            </div>
          </div>

          <div style="background:var(--bg-secondary);border:1px solid var(--border-color);padding:20px;border-radius:12px;">
            <span class="badge" style="background:#0284c7;color:#fff;font-size:0.75rem;padding:3px 8px;border-radius:6px;margin-bottom:8px;display:inline-block;">Recommended Top Card</span>
            <h3 style="margin:6px 0;font-size:1.05rem;color:var(--text-primary);">${recommended ? window.escapeHtml(recommended.title) : 'None selected'}</h3>
            <p style="font-size:0.84rem;color:var(--text-secondary);">${recommended ? window.escapeHtml(recommended.summary || '') : ''}</p>
            <div style="margin-top:14px;display:flex;gap:10px;flex-wrap:wrap;">
              ${recommended ? `
                <button type="button" class="admin-submit-btn" onclick="window.openEditNewsModal('${recommended.id}')" style="padding:6px 14px;font-size:0.8rem;display:inline-flex;align-items:center;gap:6px;border:none;cursor:pointer;">
                  <i class="fa-solid fa-pen"></i> Edit Article
                </button>
              ` : ''}
              <button type="button" class="btn-refresh" onclick="window.navigateToAdminTab('tab-news')" style="padding:6px 14px;font-size:0.8rem;display:inline-flex;align-items:center;gap:6px;cursor:pointer;">
                <i class="fa-solid fa-newspaper"></i> Open News & Articles Database
              </button>
            </div>
          </div>
        </div>
      `;
    } catch (e) {
      console.error("Failed to load featured news overview:", e);
    }
  }

  // =========================================================================
  // =========================================================================
  // 5. NEW MERCH ON STORE OVERVIEW & AUTOMATED RANKING INSPECTOR
  // =========================================================================
  async function loadHomeMerchOverview() {
    const container = document.getElementById("home-merch-preview-wrap");
    if (!container) return;

    try {
      container.innerHTML = `<div style="text-align:center;padding:30px;color:var(--text-secondary);"><i class="fa-solid fa-spinner fa-spin"></i> Loading merchandise ranking & spotlight data...</div>`;

      const res = await fetch("/api/homepage/merch-spotlight");
      if (!res.ok) {
        container.innerHTML = `<div style="text-align:center;padding:24px;color:#ef4444;">Failed to load merchandise ranking.</div>`;
        return;
      }

      const data = await res.json();
      const spotlight = data.spotlight;
      const gridProds = data.grid || [];
      const leaderboard = data.rankingLeaderboard || [];
      const isOverride = Boolean(data.isOverride);
      const overrideProductId = data.overrideProductId || "";

      const modeBadge = isOverride
        ? `<span class="badge" style="background:rgba(239,68,68,0.2);color:#f87171;border:1px solid rgba(239,68,68,0.4);padding:4px 10px;font-weight:700;"><i class="fa-solid fa-lock"></i> MANUAL OVERRIDE ACTIVE</span>`
        : `<span class="badge" style="background:rgba(34,197,94,0.2);color:#4ade80;border:1px solid rgba(34,197,94,0.4);padding:4px 10px;font-weight:700;"><i class="fa-solid fa-robot"></i> AUTOMATIC: TOP RATED BY CUSTOMERS</span>`;

      container.innerHTML = `
        <div style="display:flex;flex-direction:column;gap:24px;">
          <!-- Informational Banner -->
          <div style="background:rgba(56,189,248,0.08);border:1px solid rgba(56,189,248,0.25);border-radius:12px;padding:16px 20px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:14px;">
            <div style="font-size:0.88rem;color:var(--text-secondary);max-width:750px;">
              <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px;">
                <strong style="color:var(--text-primary);font-size:0.95rem;">Current Spotlight Mode:</strong>
                ${modeBadge}
              </div>
              <div>
                <strong>Ranking Formula:</strong> <code style="background:rgba(0,0,0,0.3);padding:2px 6px;border-radius:4px;color:#38bdf8;">Score = Rating &times; log10(Reviews + 2)</code>.
                Ties fall back to newest releases first. Spotlight winner is automatically excluded from the 6-item grid.
              </div>
            </div>
            <button type="button" class="btn-refresh" onclick="window.navigateToAdminTab('tab-store')" style="padding:8px 16px;font-size:0.85rem;display:inline-flex;align-items:center;gap:8px;cursor:pointer;">
              <i class="fa-solid fa-store"></i> Store Catalog (${leaderboard.length} Items)
            </button>
          </div>

          <!-- Spotlight & Controls Section -->
          <div style="display:grid;grid-template-columns:360px 1fr;gap:24px;align-items:start;">
            <!-- Left: Current Spotlight Winner -->
            <div style="background:var(--bg-secondary);border:1px solid var(--border-color);border-radius:14px;padding:20px;">
              <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;">
                <span class="badge" style="background:#ef4444;color:#fff;font-size:0.75rem;padding:4px 10px;border-radius:6px;font-weight:700;">
                  <i class="fa-solid fa-trophy"></i> Left Spotlight Winner
                </span>
                <span style="font-size:0.8rem;color:var(--text-secondary);">${spotlight ? spotlight.category || 'Merch' : 'N/A'}</span>
              </div>

              ${spotlight ? `
                <div style="border-radius:10px;overflow:hidden;margin-bottom:14px;background:#000;border:1px solid var(--border-color);height:240px;position:relative;">
                  <img src="${spotlight.img || 'assets/SenpaiWorks logo bg.png'}" alt="${window.escapeHtml(spotlight.name)}" style="width:100%;height:100%;object-fit:cover;" onerror="this.onerror=null; this.src='assets/SenpaiWorks logo bg.png';">
                  <span style="position:absolute;top:10px;left:10px;background:rgba(0,0,0,0.8);backdrop-filter:blur(4px);color:#fff;font-size:0.75rem;padding:3px 8px;border-radius:6px;border:1px solid rgba(255,255,255,0.15);">
                    ${window.escapeHtml(spotlight.rankingReason || spotlight.badge || 'Top Rated')}
                  </span>
                </div>

                <h3 style="margin:0 0 6px 0;font-size:1.1rem;color:var(--text-primary);">${window.escapeHtml(spotlight.name)}</h3>
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
                  <div style="font-size:1.1rem;font-weight:700;color:#38bdf8;">₹${spotlight.price}</div>
                  <div style="font-size:0.85rem;color:#facc15;font-weight:600;">
                    ★ ${spotlight.computedRating !== undefined ? spotlight.computedRating : (spotlight.rating || 5.0)} <span style="color:var(--text-secondary);font-size:0.75rem;">(${spotlight.computedRatingCount !== undefined ? spotlight.computedRatingCount : (spotlight.ratingCount || 0)} reviews)</span>
                  </div>
                </div>
                <div style="font-size:0.8rem;color:var(--text-secondary);margin-bottom:16px;background:rgba(255,255,255,0.03);padding:8px 10px;border-radius:6px;">
                  <strong>Popularity Score:</strong> <span style="color:#4ade80;font-weight:700;">${spotlight.score !== undefined ? spotlight.score : (spotlight.popularityScore || 0)}</span>
                </div>

                <button type="button" class="admin-submit-btn" onclick="window.openStoreProductEditor('${spotlight.id}')" style="width:100%;padding:8px;font-size:0.85rem;display:flex;align-items:center;justify-content:center;gap:6px;border:none;cursor:pointer;margin-bottom:16px;">
                  <i class="fa-solid fa-pen"></i> Edit in Store Catalog
                </button>
              ` : `<div style="padding:20px;text-align:center;color:var(--text-secondary);">No physical products available.</div>`}

              <!-- Dedicated Override Control -->
              <div style="background:var(--bg-primary);border:1px solid var(--border-color);border-radius:10px;padding:14px;">
                <label style="display:block;font-size:0.82rem;color:var(--text-primary);margin-bottom:8px;font-weight:700;">
                  <i class="fa-solid fa-sliders"></i> Spotlight Selection Mode:
                </label>
                <select id="select-spotlight-override" class="table-filter-select" style="width:100%;font-size:0.82rem;padding:6px 10px;margin-bottom:10px;">
                  <option value="" ${!isOverride ? 'selected' : ''}>-- Automatic (#1 Top Rated by Customers) --</option>
                  ${leaderboard.map(p => `
                    <option value="${p.id}" ${overrideProductId === p.id ? 'selected' : ''}>
                      Manual Override: ${window.escapeHtml(p.name)} (${p.rating}★ · ${p.ratingCount} rev · Score ${p.score})
                    </option>
                  `).join('')}
                </select>

                <div style="display:flex;gap:8px;">
                  <button type="button" class="admin-submit-btn" onclick="window.saveSpotlightOverride()" style="flex:1;padding:6px 10px;font-size:0.8rem;border:none;cursor:pointer;">
                    Apply Mode
                  </button>
                  ${isOverride ? `
                    <button type="button" class="btn-refresh" onclick="window.clearSpotlightOverride()" style="padding:6px 10px;font-size:0.8rem;cursor:pointer;" title="Reset to auto ranking">
                      Reset to Auto
                    </button>
                  ` : ''}
                </div>
              </div>
            </div>

            <!-- Right: 6 Grid Products -->
            <div style="background:var(--bg-secondary);border:1px solid var(--border-color);border-radius:14px;padding:20px;">
              <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">
                <h3 style="margin:0;font-size:1.05rem;color:var(--text-primary);display:flex;align-items:center;gap:8px;">
                  <i class="fa-solid fa-grip" style="color:#38bdf8;"></i> Homepage 6-Item Grid Showcase
                </h3>
                <span style="font-size:0.8rem;color:var(--text-secondary);">${gridProds.length} of 6 slots filled</span>
              </div>

              <div style="display:grid;grid-template-columns:repeat(auto-fill, minmax(180px, 1fr));gap:14px;">
                ${gridProds.map((p, idx) => {
                  const pBadge = p.badge || `₹${p.price}`;
                  return `
                    <div style="background:var(--bg-primary);border:1px solid var(--border-color);border-radius:10px;padding:12px;display:flex;flex-direction:column;justify-content:space-between;">
                      <div>
                        <div style="height:120px;border-radius:8px;overflow:hidden;background:#000;margin-bottom:8px;">
                          <img src="${p.img || 'assets/SenpaiWorks logo bg.png'}" alt="${window.escapeHtml(p.name)}" style="width:100%;height:100%;object-fit:cover;" onerror="this.onerror=null; this.src='assets/SenpaiWorks logo bg.png';">
                        </div>
                        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;">
                          <span style="font-size:0.72rem;background:rgba(56,189,248,0.15);color:#38bdf8;padding:2px 6px;border-radius:4px;font-weight:600;">
                            Grid #${idx + 1}
                          </span>
                          <span style="font-size:0.74rem;color:#facc15;">★ ${p.computedRating || p.rating}</span>
                        </div>
                        <h4 style="margin:2px 0 4px 0;font-size:0.85rem;color:var(--text-primary);line-height:1.3;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">
                          ${window.escapeHtml(p.name)}
                        </h4>
                        <div style="font-size:0.85rem;font-weight:700;color:#22c55e;">₹${p.price}</div>
                        <div style="font-size:0.72rem;color:var(--text-secondary);margin-top:2px;">Score: ${p.popularityScore || p.score || 0}</div>
                      </div>
                      <div style="margin-top:10px;padding-top:8px;border-top:1px solid var(--border-color);display:flex;gap:6px;">
                        <button type="button" class="action-btn btn-edit" onclick="window.openStoreProductEditor('${p.id}')" title="Edit this product in Store Editor" style="flex:1;font-size:0.75rem;padding:4px 0;">
                          <i class="fa-solid fa-pen"></i> Edit
                        </button>
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
          </div>

          <!-- Live Ranking Leaderboard Table -->
          <div style="background:var(--bg-secondary);border:1px solid var(--border-color);border-radius:14px;padding:20px;">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;">
              <h3 style="margin:0;font-size:1.05rem;color:var(--text-primary);display:flex;align-items:center;gap:8px;">
                <i class="fa-solid fa-list-ol" style="color:#38bdf8;"></i> Full Physical Merchandise Ranking Leaderboard
              </h3>
              <span style="font-size:0.8rem;color:var(--text-secondary);">${leaderboard.length} Ranked Items</span>
            </div>

            <div class="table-responsive">
              <table class="admin-table">
                <thead>
                  <tr>
                    <th style="width:60px;">Rank</th>
                    <th>Product</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Rating</th>
                    <th>Reviews</th>
                    <th>Computed Score</th>
                    <th>Homepage Placement</th>
                    <th class="text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  ${leaderboard.map(item => {
                    let placementBadge = '<span style="font-size:0.75rem;color:var(--text-secondary);">Reserve / Store</span>';
                    if (item.isSpotlight) {
                      placementBadge = '<span class="badge" style="background:#ef4444;color:#fff;font-size:0.74rem;padding:3px 8px;"><i class="fa-solid fa-fire"></i> Left Spotlight</span>';
                    } else if (item.isInGrid) {
                      placementBadge = '<span class="badge" style="background:#0284c7;color:#fff;font-size:0.74rem;padding:3px 8px;"><i class="fa-solid fa-grip"></i> In 6-Item Grid</span>';
                    }

                    return `
                      <tr>
                        <td style="font-weight:700;color:${item.rank === 1 ? '#facc15' : 'var(--text-primary)'};">#${item.rank}</td>
                        <td>
                          <div style="display:flex;align-items:center;gap:10px;">
                            <img src="${item.img || 'assets/SenpaiWorks logo bg.png'}" style="width:36px;height:36px;border-radius:6px;object-fit:cover;" onerror="this.onerror=null; this.src='assets/SenpaiWorks logo bg.png';">
                            <strong style="color:var(--text-primary);">${window.escapeHtml(item.name)}</strong>
                          </div>
                        </td>
                        <td><span class="badge badge-type">${window.escapeHtml(item.category || 'Apparel')}</span></td>
                        <td style="font-weight:700;color:#38bdf8;">₹${item.price}</td>
                        <td style="color:#facc15;">★ ${item.rating}</td>
                        <td>${item.ratingCount}</td>
                        <td style="font-weight:700;color:#4ade80;">${item.score}</td>
                        <td>${placementBadge}</td>
                        <td class="text-center">
                          <button type="button" class="action-btn btn-edit" onclick="window.openStoreProductEditor('${item.id}')" title="Edit in Store"><i class="fa-solid fa-pen"></i></button>
                        </td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      `;
    } catch (e) {
      console.error("Failed to load home merch overview:", e);
      if (container) container.innerHTML = `<div style="text-align:center;padding:24px;color:#ef4444;">Failed to load store products.</div>`;
    }
  }

  // Open product editor from Homepage Manager
  window.openStoreProductEditor = function (id) {
    window.navigateToAdminTab('tab-store');
    setTimeout(() => {
      if (typeof window.editProduct === "function") {
        window.editProduct(id);
      }
    }, 150);
  };

  // Save manual spotlight override or reset to automatic
  window.saveSpotlightOverride = async function () {
    const select = document.getElementById("select-spotlight-override");
    if (!select) return;

    const productId = select.value || null;

    try {
      const res = await fetch("/api/admin/homepage/merch-spotlight/override", {
        method: "PUT",
        headers: window.getAdminTokenHeaders ? window.getAdminTokenHeaders() : { "Content-Type": "application/json" },
        body: JSON.stringify({ productId })
      });

      if (res.ok) {
        if (window.showAdminToast) {
          window.showAdminToast(
            productId ? "Manual spotlight override applied!" : "Reset to automatic customer rating spotlight!",
            "success"
          );
        }
        loadHomeMerchOverview();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to update spotlight mode.");
      }
    } catch (err) {
      console.error("Error setting spotlight override:", err);
      alert("Network error updating spotlight mode.");
    }
  };

  window.clearSpotlightOverride = async function () {
    const select = document.getElementById("select-spotlight-override");
    if (select) select.value = "";
    await window.saveSpotlightOverride();
  };

  // =========================================================================
  // 5. FORM SUBMISSIONS & CLOUDINARY UPLOADS
  // =========================================================================
  document.addEventListener("DOMContentLoaded", () => {
    // 1. Hero slide form submit
    const heroForm = document.getElementById("form-hero-slide");
    if (heroForm) {
      heroForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const id = document.getElementById("hero-slide-id").value;
        const spotlight = document.getElementById("hero-slide-spotlight").value.trim();
        const title = document.getElementById("hero-slide-title").value.trim();
        const description = document.getElementById("hero-slide-desc").value.trim();
        const bgType = document.getElementById("hero-slide-bgtype").value;
        const bgUrl = document.getElementById("hero-slide-bgurl").value.trim();
        const primaryBtnText = document.getElementById("hero-slide-btn1-text").value.trim();
        const primaryBtnLink = document.getElementById("hero-slide-btn1-link").value.trim();
        const secondaryBtnText = document.getElementById("hero-slide-btn2-text").value.trim();
        const secondaryBtnLink = document.getElementById("hero-slide-btn2-link").value.trim();
        const order = parseInt(document.getElementById("hero-slide-order").value, 10) || 0;
        const published = document.getElementById("hero-slide-published").checked;

        const payload = {
          spotlight, title, description, bgType, bgUrl,
          primaryBtnText, primaryBtnLink, secondaryBtnText, secondaryBtnLink,
          order, published
        };

        try {
          const url = id ? `/api/admin/homepage/hero-slides/${id}` : "/api/admin/homepage/hero-slides";
          const method = id ? "PUT" : "POST";

          const res = await fetch(url, {
            method,
            headers: window.getAdminTokenHeaders ? window.getAdminTokenHeaders() : { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
          });

          if (res.ok) {
            if (window.showAdminToast) window.showAdminToast(id ? "Slide updated successfully!" : "Slide created successfully!", "success");
            window.showHeroSlidesList();
            loadHeroSlides();
          } else {
            const err = await res.json();
            alert(err.error || "Failed to save slide.");
          }
        } catch (err) {
          console.error("Failed to save slide:", err);
          alert("Network error saving slide.");
        }
      });
    }

    // 2. Showcase item form submit
    const showcaseForm = document.getElementById("form-showcase-item");
    if (showcaseForm) {
      showcaseForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const id = document.getElementById("showcase-item-id").value;
        const title = document.getElementById("showcase-title").value.trim();
        const subtitle = document.getElementById("showcase-subtitle").value.trim();
        const description = document.getElementById("showcase-desc").value.trim();
        const imageUrl = document.getElementById("showcase-imgurl").value.trim();
        const linkUrl = document.getElementById("showcase-linkurl").value.trim();
        const btnText = document.getElementById("showcase-btntext").value.trim();
        const order = parseInt(document.getElementById("showcase-order").value, 10) || 0;
        const published = document.getElementById("showcase-published").checked;

        const payload = {
          section: "things_you_might_like",
          title, subtitle, description, imageUrl, linkUrl, btnText, order, published
        };

        try {
          const url = id ? `/api/admin/homepage/showcase-items/${id}` : "/api/admin/homepage/showcase-items";
          const method = id ? "PUT" : "POST";

          const res = await fetch(url, {
            method,
            headers: window.getAdminTokenHeaders ? window.getAdminTokenHeaders() : { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
          });

          if (res.ok) {
            if (window.showAdminToast) window.showAdminToast("Showcase card saved successfully!", "success");
            window.showShowcaseList();
            loadShowcaseItems();
          } else {
            const err = await res.json();
            alert(err.error || "Failed to save showcase item.");
          }
        } catch (err) {
          console.error("Failed to save showcase item:", err);
          alert("Network error saving showcase item.");
        }
      });
    }

    // 3. Shorts item form submit
    const shortsForm = document.getElementById("form-shorts-item");
    if (shortsForm) {
      shortsForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const id = document.getElementById("shorts-item-id").value;
        const title = document.getElementById("shorts-title").value.trim();
        const subtitle = document.getElementById("shorts-subtitle").value.trim();
        const description = subtitle;
        const imageUrl = document.getElementById("shorts-imgurl").value.trim();
        const linkUrl = document.getElementById("shorts-linkurl").value.trim();
        const btnText = document.getElementById("shorts-btntext").value.trim() || "Start Watching";
        const order = parseInt(document.getElementById("shorts-order").value, 10) || 0;
        const published = document.getElementById("shorts-published").checked;

        const payload = {
          section: "shorts_entertainment",
          title, subtitle, description, imageUrl, linkUrl, btnText, order, published
        };

        try {
          const url = id ? `/api/admin/homepage/showcase-items/${id}` : "/api/admin/homepage/showcase-items";
          const method = id ? "PUT" : "POST";

          const res = await fetch(url, {
            method,
            headers: window.getAdminTokenHeaders ? window.getAdminTokenHeaders() : { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
          });

          if (res.ok) {
            if (window.showAdminToast) window.showAdminToast(id ? "Short updated successfully!" : "Short created successfully!", "success");
            window.showShortsList();
            loadShortsItems();
          } else {
            const err = await res.json();
            alert(err.error || "Failed to save short card.");
          }
        } catch (err) {
          console.error("Failed to save short card:", err);
          alert("Network error saving short card.");
        }
      });
    }

    // 4. Hero Slide Cloudinary File Upload
    const heroFileUpload = document.getElementById("hero-slide-file-upload");
    if (heroFileUpload) {
      heroFileUpload.addEventListener("change", async () => {
        const file = heroFileUpload.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append("image", file);

        try {
          if (window.showAdminToast) window.showAdminToast("Uploading media...", "info");
          const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
          if (uploadRes.ok) {
            const data = await uploadRes.json();
            document.getElementById("hero-slide-bgurl").value = data.url;
            if (window.showAdminToast) window.showAdminToast("Media uploaded successfully!", "success");
          } else {
            alert("Upload failed.");
          }
        } catch (e) {
          console.error("Upload error:", e);
          alert("Error uploading media.");
        }
      });
    }

    // 5. Showcase Item Cloudinary Upload
    const showcaseFileUpload = document.getElementById("showcase-file-upload");
    if (showcaseFileUpload) {
      showcaseFileUpload.addEventListener("change", async () => {
        const file = showcaseFileUpload.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append("image", file);

        try {
          if (window.showAdminToast) window.showAdminToast("Uploading image...", "info");
          const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
          if (uploadRes.ok) {
            const data = await uploadRes.json();
            document.getElementById("showcase-imgurl").value = data.url;
            if (window.showAdminToast) window.showAdminToast("Image uploaded!", "success");
          } else {
            alert("Upload failed.");
          }
        } catch (e) {
          console.error("Upload error:", e);
          alert("Error uploading image.");
        }
      });
    }

    // 6. Shorts Item Cloudinary Upload
    const shortsFileUpload = document.getElementById("shorts-file-upload");
    if (shortsFileUpload) {
      shortsFileUpload.addEventListener("change", async () => {
        const file = shortsFileUpload.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append("image", file);

        try {
          if (window.showAdminToast) window.showAdminToast("Uploading poster...", "info");
          const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
          if (uploadRes.ok) {
            const data = await uploadRes.json();
            document.getElementById("shorts-imgurl").value = data.url;
            if (window.showAdminToast) window.showAdminToast("Poster uploaded!", "success");
          } else {
            alert("Upload failed.");
          }
        } catch (e) {
          console.error("Upload error:", e);
          alert("Error uploading poster.");
        }
      });
    }

    // Auto-bind sidebar link click
    const homepageLink = document.querySelector('.sidebar-link[data-tab="tab-homepage"]');
    if (homepageLink) {
      homepageLink.addEventListener("click", () => {
        window.loadHomepageManager();
      });
    }

    // Inner tab switching for Home Page Manager
    const homeTabBtns = document.querySelectorAll('#tab-homepage .inner-tab-btn');
    homeTabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const subtabId = btn.getAttribute('data-subtab');
        window.switchHomeSubtab(subtabId);
      });
    });

    // Initial load
    window.loadHomepageManager();
  });

  // Also trigger if DOM is already loaded
  if (document.readyState !== "loading") {
    setTimeout(() => {
      window.loadHomepageManager();
    }, 100);
  }
})();
