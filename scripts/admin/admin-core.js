/**
 * SenpaiWorks Admin Console - Core & Utilities Module
 * scripts/admin/admin-core.js
 */

// Cookie-based httpOnly authentication is used for admin sessions
// Automatically ensure credentials: "include" is attached to all fetch requests
(function () {
  const originalFetch = window.fetch;
  window.fetch = function (url, options) {
    options = options || {};
    if (!options.credentials) {
      options.credentials = "include";
    }
    return originalFetch.call(this, url, options);
  };
})();

// Tab mapping for URL routing
window.tabSlugMap = {
  "tab-homepage": "homepage",
  "tab-dashboard": "dashboard",
  "tab-store": "store-products",
  "tab-reviews": "reviews",
  "tab-orders": "customer-orders",
  "tab-replacements": "replacements",
  "tab-art": "art-library",
  "tab-motion": "motion-assets",
  "tab-news": "news-articles",
  "tab-coupons": "coupons",
  "tab-community": "community",
  "tab-feedback": "customer-feedback",
  "tab-notifications": "notifications",
  "tab-courses": "courses",
  "tab-faq": "faq-management",
  "tab-account": "account-settings",
  "tab-trash": "trash"
};

window.slugToTabMap = {
  "homepage": "tab-homepage",
  "dashboard": "tab-dashboard",
  "store-products": "tab-store",
  "reviews": "tab-reviews",
  "customer-orders": "tab-orders",
  "replacements": "tab-replacements",
  "art-library": "tab-art",
  "motion-assets": "tab-motion",
  "news-articles": "tab-news",
  "coupons": "tab-coupons",
  "community": "tab-community",
  "customer-feedback": "tab-feedback",
  "notifications": "tab-notifications",
  "courses": "tab-courses",
  "faq-management": "tab-faq",
  "account-settings": "tab-account",
  "trash": "tab-trash"
};

// ── HTML Escaping Utility ──────────────────────────────────
window.escapeHtml = function (text) {
  if (text === null || text === undefined) return "";
  const div = document.createElement("div");
  div.textContent = String(text);
  return div.innerHTML;
};

// ── Global Toast Notification System ──────────────────────
window.showAdminToast = function (message, type = "success", title = "") {
  let container = document.getElementById("admin-toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "admin-toast-container";
    container.className = "admin-toast-container";
    document.body.appendChild(container);
  }

  const icons = {
    success: "fa-circle-check",
    danger: "fa-circle-xmark",
    warning: "fa-triangle-exclamation",
    info: "fa-circle-info"
  };
  const defaultTitles = {
    success: "Success",
    danger: "Action Error",
    warning: "Attention",
    info: "Notification"
  };

  const toastTitle = title || defaultTitles[type] || "Notice";
  const toastIcon = icons[type] || "fa-circle-info";

  const toast = document.createElement("div");
  toast.className = `admin-toast toast-${type}`;
  toast.innerHTML = `
    <i class="fa-solid ${toastIcon} admin-toast-icon"></i>
    <div class="admin-toast-content">
      <div class="admin-toast-title">${window.escapeHtml(toastTitle)}</div>
      <div class="admin-toast-msg">${window.escapeHtml(message)}</div>
    </div>
    <button class="admin-toast-close" onclick="this.parentElement.remove()"><i class="fa-solid fa-xmark"></i></button>
    <div class="toast-progress"></div>
  `;

  container.appendChild(toast);

  const progress = toast.querySelector(".toast-progress");
  if (progress) {
    progress.style.transition = "width 3.5s linear";
    setTimeout(() => { progress.style.width = "0%"; }, 50);
  }

  setTimeout(() => {
    if (toast.parentElement) {
      toast.style.opacity = "0";
      toast.style.transform = "translateX(50px)";
      setTimeout(() => toast.remove(), 300);
    }
  }, 3500);
};

// ── Global Confirmation Dialog Overlay ────────────────────
window.showAdminConfirm = function (title, message, confirmBtnText = "Confirm", type = "danger") {
  return new Promise((resolve) => {
    const overlay = document.getElementById("admin-dialog-overlay");
    const titleEl = document.getElementById("admin-dialog-title");
    const msgEl = document.getElementById("admin-dialog-msg");
    const iconEl = document.getElementById("admin-dialog-icon");
    const cancelBtn = document.getElementById("admin-dialog-cancel-btn");
    const confirmBtn = document.getElementById("admin-dialog-confirm-btn");

    if (!overlay) {
      resolve(window.confirm(`${title}\n\n${message}`));
      return;
    }

    if (titleEl) titleEl.textContent = title;
    if (msgEl) msgEl.textContent = message;

    if (iconEl) {
      iconEl.className = `admin-dialog-icon icon-${type}`;
      const iconMap = {
        danger: "fa-triangle-exclamation",
        success: "fa-circle-check",
        warning: "fa-triangle-exclamation",
        info: "fa-circle-info"
      };
      iconEl.innerHTML = `<i class="fa-solid ${iconMap[type] || 'fa-circle-info'}"></i>`;
    }

    if (confirmBtn) {
      confirmBtn.textContent = confirmBtnText;
      confirmBtn.className = `btn-dialog-confirm btn-confirm-${type === 'danger' ? 'danger' : type === 'success' ? 'success' : 'info'}`;
    }

    overlay.style.display = "flex";

    const cleanup = () => {
      overlay.style.display = "none";
      if (cancelBtn) cancelBtn.removeEventListener("click", onCancel);
      if (confirmBtn) confirmBtn.removeEventListener("click", onConfirm);
    };

    const onCancel = () => { cleanup(); resolve(false); };
    const onConfirm = () => { cleanup(); resolve(true); };

    if (cancelBtn) cancelBtn.addEventListener("click", onCancel);
    if (confirmBtn) confirmBtn.addEventListener("click", onConfirm);
  });
};

// ── Generic Pagination Controls Renderer ──────────────────
window.renderPagination = function (controlsId, totalItems, currentPage, pageSize, pageChangeFnName) {
  const container = document.getElementById(controlsId);
  if (!container) return;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;

  let html = `<button type="button" class="pg-btn" ${currentPage === 1 ? 'disabled' : ''} onclick="${pageChangeFnName}(1)">«</button>`;
  html += `<button type="button" class="pg-btn" ${currentPage === 1 ? 'disabled' : ''} onclick="${pageChangeFnName}(${currentPage - 1})"><</button>`;

  for (let p = 1; p <= totalPages; p++) {
    if (p === 1 || p === totalPages || (p >= currentPage - 1 && p <= currentPage + 1)) {
      html += `<button type="button" class="pg-btn ${p === currentPage ? 'active' : ''}" onclick="${pageChangeFnName}(${p})">${p}</button>`;
    } else if (p === currentPage - 2 || p === currentPage + 2) {
      html += `<span class="pagination-ellipsis">...</span>`;
    }
  }

  html += `<button type="button" class="pg-btn ${currentPage === totalPages ? 'disabled' : ''} onclick="${pageChangeFnName}(${currentPage + 1})">></button>`;
  html += `<button type="button" class="pg-btn ${currentPage === totalPages ? 'disabled' : ''} onclick="${pageChangeFnName}(${totalPages})">»</button>`;

  container.innerHTML = html;
};

// ── Export CSV Utility ────────────────────────────────────
window.exportTableCSV = function (filename, headers, rows) {
  let csv = headers.join(",") + "\n";
  rows.forEach(r => {
    csv += r.map(val => `"${String(val !== undefined && val !== null ? val : '').replace(/"/g, '""')}"`).join(",") + "\n";
  });
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// ── Print Table Element Utility ───────────────────────────
window.printTableElement = function (elementId, title) {
  const tableEl = document.getElementById(elementId);
  if (!tableEl) return;
  const win = window.open("", "", "width=900,height=700");
  win.document.write(`
    <html>
      <head>
        <title>${title}</title>
        <style>
          body { font-family: sans-serif; padding: 20px; color: #000; }
          h2 { margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #ccc; padding: 8px 12px; text-align: left; font-size: 14px; }
          th { background: #f1f5f9; }
          img { max-width: 45px; max-height: 45px; border-radius: 6px; }
        </style>
      </head>
      <body>
        <h2>${title}</h2>
        ${tableEl.outerHTML}
      </body>
    </html>
  `);
  win.document.close();
  win.focus();
  setTimeout(() => { win.print(); win.close(); }, 300);
};

// ── Theme Switcher (Dark / Light) ─────────────────────────
window.initThemeToggle = function () {
  const themeBtn = document.getElementById("theme-toggle-btn");
  const themeIcon = document.getElementById("theme-icon");
  const savedTheme = localStorage.getItem("adminTheme") || "dark";

  function applyTheme(theme) {
    if (theme === "light") {
      document.body.classList.add("light-theme");
      document.body.classList.remove("dark-theme");
      if (themeIcon) themeIcon.className = "fa-solid fa-sun";
    } else {
      document.body.classList.remove("light-theme");
      document.body.classList.add("dark-theme");
      if (themeIcon) themeIcon.className = "fa-solid fa-moon";
    }
  }

  applyTheme(savedTheme);

  if (themeBtn) {
    themeBtn.addEventListener("click", () => {
      const isCurrentlyLight = document.body.classList.contains("light-theme");
      const nextTheme = isCurrentlyLight ? "dark" : "light";
      localStorage.setItem("adminTheme", nextTheme);
      applyTheme(nextTheme);
    });
  }
};

// ── Tab Switcher & Dynamic URL Router ─────────────────────
window.activateTabById = function (targetTab, updateHash = true) {
  const sidebarLinks = document.querySelectorAll(".sidebar-link");
  const subpages = document.querySelectorAll(".admin-subpage");
  const pageTitle = document.getElementById("page-title");

  const targetLink = document.querySelector(`.sidebar-link[data-tab="${targetTab}"]`);
  const targetPage = document.getElementById(targetTab);

  if (!targetPage) return;

  sidebarLinks.forEach(l => l.classList.remove("active"));
  subpages.forEach(p => p.classList.remove("active"));

  if (targetLink) targetLink.classList.add("active");
  targetPage.classList.add("active");

  if (targetLink && pageTitle) {
    const labelSpan = targetLink.querySelector("span");
    if (labelSpan) pageTitle.textContent = labelSpan.textContent;
  }

  // Trigger lazy loading per tab
  if (targetTab === "tab-community" || targetTab === "tab-feedback") {
    if (typeof window.loadCommunityReviews === "function") window.loadCommunityReviews();
    if (typeof window.loadDesignPollSuggestions === "function") window.loadDesignPollSuggestions();
  }
  if (targetTab === "tab-replacements") {
    if (typeof window.loadAdminReplacements === "function") window.loadAdminReplacements();
  }
  if (targetTab === "tab-faq") {
    if (typeof window.loadAdminFaqs === "function") window.loadAdminFaqs();
  }
  if (targetTab === "tab-courses") {
    if (typeof window.loadAdminCourses === "function") window.loadAdminCourses();
  }
  if (targetTab === "tab-notifications") {
    if (typeof window.loadAdminNotifications === "function") window.loadAdminNotifications();
  }
  if (targetTab === "tab-orders") {
    if (typeof window.loadOrders === "function") window.loadOrders();
  }
  if (targetTab === "tab-store") {
    if (typeof window.loadProducts === "function") window.loadProducts();
  }
  if (targetTab === "tab-reviews") {
    if (typeof window.loadAdminReviewsModule === "function") window.loadAdminReviewsModule();
  }
  if (targetTab === "tab-art") {
    if (typeof window.loadArtworks === "function") window.loadArtworks();
  }
  if (targetTab === "tab-homepage") {
    if (typeof window.loadHomepageManager === "function") window.loadHomepageManager();
  }
  if (targetTab === "tab-dashboard") {
    if (typeof window.loadDashboardStats === "function") window.loadDashboardStats();
  }
  if (targetTab === "tab-trash") {
    if (typeof window.loadAdminTrash === "function") window.loadAdminTrash();
  }

  if (updateHash && window.tabSlugMap[targetTab]) {
    const slug = window.tabSlugMap[targetTab];
    if (window.location.hash !== `#${slug}`) {
      history.pushState(null, "", `#${slug}`);
    }
  }

  const sidebar = document.querySelector(".admin-sidebar");
  if (sidebar) sidebar.classList.remove("active");
};

window.handleHashRouting = function () {
  const currentHash = window.location.hash.replace("#", "");
  const parts = currentHash.split('/');
  const mainSlug = parts[0] || "dashboard";
  const subTabId = parts[1];

  const targetTab = window.slugToTabMap[mainSlug] || "tab-dashboard";
  window.activateTabById(targetTab, false);

  if (subTabId) {
    const parentSubpage = document.getElementById(targetTab);
    if (parentSubpage) {
      const btn = parentSubpage.querySelector(`.inner-tab-btn[data-subtab="${subTabId}"]`);
      if (btn) {
        window.activateInnerTab(btn, false);
      }
    }
  }
};

window.initSidebarTabs = function () {
  const sidebarLinks = document.querySelectorAll(".sidebar-link");

  sidebarLinks.forEach(link => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const targetTab = link.getAttribute("data-tab");
      window.activateTabById(targetTab, true);
    });
  });

  window.addEventListener("popstate", window.handleHashRouting);
  window.addEventListener("hashchange", window.handleHashRouting);

  window.handleHashRouting();

  const settingsBtn = document.getElementById("sidebar-btn-settings");
  if (settingsBtn) {
    settingsBtn.addEventListener("click", () => {
      window.activateTabById("tab-account", true);
    });
  }
};

window.activateInnerTab = function (btn, pushHistory = true) {
  const parentSubpage = btn.closest(".admin-subpage");
  if (!parentSubpage) return;

  const btns = parentSubpage.querySelectorAll(".inner-tab-btn");
  const contents = parentSubpage.querySelectorAll(".inner-tab-content");

  btns.forEach(b => b.classList.remove("active"));
  contents.forEach(c => c.classList.remove("active"));

  btn.classList.add("active");
  const targetId = btn.getAttribute("data-subtab") || btn.getAttribute("data-target");
  const targetContent = parentSubpage.querySelector(`#${targetId}`);
  if (targetContent) {
    targetContent.classList.add("active");
    targetContent.style.display = "";
  }

  if (pushHistory) {
    const mainTabId = parentSubpage.id;
    const mainSlug = window.tabSlugMap[mainTabId];
    if (mainSlug && targetId) {
      const newHash = `#${mainSlug}/${targetId}`;
      if (window.location.hash !== newHash) {
        history.pushState(null, "", newHash);
      }
    }
  }
};

window.initInnerTabs = function () {
  const innerBtns = document.querySelectorAll(".inner-tab-btn");
  innerBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      window.activateInnerTab(btn, true);
    });
  });
};

window.initMobileSidebar = function () {
  const toggleBtn = document.getElementById("sidebar-toggle");
  const sidebar = document.querySelector(".admin-sidebar");
  if (toggleBtn && sidebar) {
    toggleBtn.addEventListener("click", () => {
      sidebar.classList.toggle("active");
    });
  }
};

// ── Master DOM Initialization ─────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  if (typeof window.initAdminAuth === "function") window.initAdminAuth();
  if (typeof window.initThemeToggle === "function") window.initThemeToggle();
  if (typeof window.initSidebarTabs === "function") window.initSidebarTabs();
  if (typeof window.initInnerTabs === "function") window.initInnerTabs();
  if (typeof window.initMobileSidebar === "function") window.initMobileSidebar();
  if (typeof window.initAccountSettings === "function") window.initAccountSettings();
  if (typeof window.initTaskList === "function") window.initTaskList();
  if (typeof window.initArtworkForm === "function") window.initArtworkForm();
  if (typeof window.initCategoryForm === "function") window.initCategoryForm();
  if (typeof window.initProductAddForm === "function") window.initProductAddForm();

  // Load initial data
  if (typeof window.loadAdminCategories === "function") window.loadAdminCategories();
  if (typeof window.loadDashboardStats === "function") window.loadDashboardStats();
  if (typeof window.loadArtworks === "function") window.loadArtworks();
  if (typeof window.loadProducts === "function") window.loadProducts();
  if (typeof window.loadOrders === "function") window.loadOrders();
  if (typeof window.loadUsers === "function") window.loadUsers();
  if (typeof window.loadMotionAssets === "function") window.loadMotionAssets();
  if (typeof window.loadNewsArticles === "function") window.loadNewsArticles();
  if (typeof window.loadCoupons === "function") window.loadCoupons();
  if (typeof window.loadCommunityReviews === "function") window.loadCommunityReviews();
  if (typeof window.loadDesignPollSuggestions === "function") window.loadDesignPollSuggestions();
  if (typeof window.loadAdminFaqs === "function") window.loadAdminFaqs();
  if (typeof window.loadHomepageManager === "function") window.loadHomepageManager();

  // Search and filter listeners for user feedback
  const searchInput = document.getElementById("feedback-search-input");
  if (searchInput) searchInput.addEventListener("input", () => { window.feedbackCurrentPage = 1; if (typeof window.loadCommunityReviews === "function") window.loadCommunityReviews(); });

  const catFilter = document.getElementById("feedback-category-filter");
  if (catFilter) catFilter.addEventListener("change", () => { window.feedbackCurrentPage = 1; if (typeof window.loadCommunityReviews === "function") window.loadCommunityReviews(); });

  const statusFilter = document.getElementById("feedback-status-filter");
  if (statusFilter) statusFilter.addEventListener("change", () => { window.feedbackCurrentPage = 1; if (typeof window.loadCommunityReviews === "function") window.loadCommunityReviews(); });
});
