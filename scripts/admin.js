// ── State ──────────────────────────────────────────────
let activeAdminToken = localStorage.getItem("adminToken") || localStorage.getItem("activeAdminToken") || "";

let allArtworks = [];
let allProducts = [];
let allOrders = [
  { id: "ORD-101", product: "Wireless Mouse", img: "https://res.cloudinary.com/dmzchsqms/image/upload/f_auto,q_auto/w_200/v1757630848/rem_happy_evhesz.webp", deliveryTime: "April 22, 2025, 10:30 AM", pymType: "Paypal", amount: "$99.00", status: "Delivered" },
  { id: "ORD-102", product: "LaptNoise Cancelling Headphones", img: "https://res.cloudinary.com/dmzchsqms/image/upload/f_auto,q_auto/w_200/v1757630827/deadpool_poster_krntp0.webp", deliveryTime: "April 22, 2025, 10:30 AM", pymType: "Stripe", amount: "$120.00", status: "Pending" },
  { id: "ORD-103", product: "Travel Backpack", img: "https://res.cloudinary.com/dmzchsqms/image/upload/f_auto,q_auto/w_200/v1757630823/Mikasa_copy_jcwuga.webp", deliveryTime: "April 22, 2025, 10:30 AM", pymType: "Paypal", amount: "$99.00", status: "Cancelled" },
  { id: "ORD-104", product: "USB-C Charger", img: "https://res.cloudinary.com/dmzchsqms/image/upload/f_auto,q_auto/w_200/v1757630825/zoro_insane_art_copy_iwn6q1.webp", deliveryTime: "April 22, 2025, 10:30 AM", pymType: "Credit Card", amount: "$99.00", status: "Delivered" },
  { id: "ORD-105", product: "Smartwatch Band", img: "https://res.cloudinary.com/dmzchsqms/image/upload/f_auto,q_auto/w_200/v1757630826/rose_blackpink_copy_oemv2z.webp", deliveryTime: "April 22, 2025, 10:30 AM", pymType: "Paypal", amount: "$60.00", status: "Shipped" },
  { id: "ORD-106", product: "Laptop Sleeve", img: "https://res.cloudinary.com/dmzchsqms/image/upload/f_auto,q_auto/w_200/v1757630828/jungkook_copy_n9vx2a.webp", deliveryTime: "April 22, 2025, 10:30 AM", pymType: "Paypal", amount: "$99.00", status: "Delivered" },
  { id: "ORD-107", product: "Itachi Uchiha Canvas Art", img: "https://res.cloudinary.com/dmzchsqms/image/upload/f_auto,q_auto/w_200/v1757630825/itachi_insane_art_copy_yq8zsp.webp", deliveryTime: "April 23, 2025, 02:15 PM", pymType: "UPI / GPay", amount: "$149.00", status: "Processing" }
];

let allMotionAssets = [
  { id: "m-1", title: "Blender Toon Shader NPR Node Pack", type: "Shader Asset", format: ".blend", status: "Published", img: "https://res.cloudinary.com/dmzchsqms/image/upload/f_auto,q_auto/w_600/v1757630827/deadpool_poster_krntp0.webp" },
  { id: "m-2", title: "Suzens Idol Character 3D Rig", type: "3D Character Rig", format: ".fbx / .blend", status: "Published", img: "https://res.cloudinary.com/dmzchsqms/image/upload/f_auto,q_auto/w_600/v1757630848/rem_happy_evhesz.webp" }
];

let allNewsArticles = [
  { id: "senpaiworks-2-release", title: "SenpaiWorks 2.0 Official Release Notes", category: "Platform Core", author: "Suhas H" },
  { id: "deadpool-animation", title: "Deadpool Fan Animation VFX Breakdown", category: "3D & VFX", author: "SenpaiWorks Studio" }
];

let allCoupons = [
  { code: "WELCOME100", discount: "₹100 INSTANT OFF", desc: "First Sign-in Special Discount", status: "Active" },
  { code: "ITACHI50", discount: "50% OFF", desc: "Itachi Merchandise Collection Sale", status: "Active" },
  { code: "SENPAI20", discount: "20% OFF", desc: "Storewide Summer Sale", status: "Active" }
];

let allCommunityReviews = [
  { user: "Aarav Sharma", rating: "★★★★★ (5.0)", text: "The Itachi oversized graphic tee fabric quality is top-notch! Fast shipping.", topic: "Itachi Graphic Tee", status: "Approved" },
  { user: "Maya Lin", rating: "★★★★★ (5.0)", text: "The Blender toon shader node setup saved me weeks of NPR rendering tweaking.", topic: "3D Shader Asset", status: "Approved" }
];

let allUsers = [
  { id: "USR-101", username: "suhas_h", email: "suhas@example.com", avatar: "https://res.cloudinary.com/dmzchsqms/image/upload/f_auto,q_auto/w_600/v1757630848/rem_happy_evhesz.webp", provider: "Google 1-Click", joined: "2026-06-15", ordersCount: 5, status: "Verified" },
  { id: "USR-102", username: "alex_mercer", email: "alex@example.com", avatar: "https://res.cloudinary.com/dmzchsqms/image/upload/f_auto,q_auto/w_600/v1757630827/deadpool_poster_krntp0.webp", provider: "Email & Password", joined: "2026-06-18", ordersCount: 2, status: "Verified" },
  { id: "USR-103", username: "rin_tohsaka", email: "rin@example.com", avatar: "https://res.cloudinary.com/dmzchsqms/image/upload/f_auto,q_auto/w_600/v1757630848/chronos_plays_fl47xm.webp", provider: "Google 1-Click", joined: "2026-07-02", ordersCount: 1, status: "Verified" },
  { id: "USR-104", username: "ken_kaneki", email: "ken@example.com", avatar: "https://res.cloudinary.com/dmzchsqms/image/upload/f_auto,q_auto/w_600/v1757630827/all_characters_yvk9ik.webp", provider: "Email & Password", joined: "2026-07-10", ordersCount: 3, status: "Verified" }
];

let artworkPage = 1;
let productPage = 1;
const PAGE_SIZE = 10;
let artworkSearch = "";
let productSearch = "";
let ordersSearch = "";
let timelineChart = null;
let categoryChart = null;

// ── Init ───────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  initAdminAuth();
  initThemeToggle();
  initSidebarTabs();
  initInnerTabs();
  initMobileSidebar();
  initAccountSettings();
  initTaskList();
  initArtworkForm();
  initCategoryForm();
  initProductAddForm();

  loadAdminCategories();
  loadDashboardStats();
  loadArtworks();
  loadProducts();
  loadOrders();
  loadUsers();
  loadMotionAssets();
  loadNewsArticles();
  loadCoupons();
  loadCommunityReviews();
  loadDesignPollSuggestions();
  loadDonations();

  initFilterBar();
  initTableSearch();
  initEditModal();
  
  const sortSelect = document.getElementById("feedback-sort-select");
  if (sortSelect) {
    sortSelect.addEventListener("change", loadCommunityReviews);
  }
});


// ═══════════════════════════════════════════════════════════
//  GLOBAL CUSTOM DIALOG & TOAST NOTIFICATION UTILITIES
// ═══════════════════════════════════════════════════════════
window.showAdminToast = function (message, type = "success", title = "") {
  const container = document.getElementById("admin-toast-container");
  if (!container) return;

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
      <div class="admin-toast-title">${toastTitle}</div>
      <div class="admin-toast-msg">${message}</div>
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
      const iconMap = { danger: "fa-triangle-exclamation", success: "fa-circle-check", warning: "fa-triangle-exclamation", info: "fa-circle-info" };
      iconEl.innerHTML = `<i class="fa-solid ${iconMap[type] || 'fa-circle-info'}"></i>`;
    }

    if (confirmBtn) {
      confirmBtn.textContent = confirmBtnText;
      confirmBtn.className = `btn-dialog-confirm btn-confirm-${type === 'danger' ? 'danger' : type === 'success' ? 'success' : 'info'}`;
    }

    overlay.style.display = "flex";

    const cleanup = () => {
      overlay.style.display = "none";
      cancelBtn.removeEventListener("click", onCancel);
      confirmBtn.removeEventListener("click", onConfirm);
    };

    const onCancel = () => { cleanup(); resolve(false); };
    const onConfirm = () => { cleanup(); resolve(true); };

    cancelBtn.addEventListener("click", onCancel);
    confirmBtn.addEventListener("click", onConfirm);
  });
};

// ═══════════════════════════════════════════════════════════
//  THEME TOGGLE
// ═══════════════════════════════════════════════════════════
function initThemeToggle() {
  const themeBtn = document.getElementById("theme-toggle-btn");
  const themeIcon = document.getElementById("theme-icon");
  const savedTheme = localStorage.getItem("adminTheme") || "dark";

  if (savedTheme === "light") {
    document.body.classList.add("light-theme");
    if (themeIcon) themeIcon.className = "fa-solid fa-sun";
  }

  if (themeBtn) {
    themeBtn.addEventListener("click", () => {
      document.body.classList.toggle("light-theme");
      const isLight = document.body.classList.contains("light-theme");
      localStorage.setItem("adminTheme", isLight ? "light" : "dark");
      if (themeIcon) {
        themeIcon.className = isLight ? "fa-solid fa-sun" : "fa-solid fa-moon";
      }
    });
  }
}

// ═══════════════════════════════════════════════════════════
//  SIDEBAR TAB TOGGLING & DYNAMIC URL ROUTING (#art-library, etc.)
// ═══════════════════════════════════════════════════════════
const tabSlugMap = {
  "tab-dashboard": "dashboard",
  "tab-store": "store-products",
  "tab-orders": "customer-orders",
  "tab-users": "registered-users",
  "tab-art": "art-library",
  "tab-motion": "motion-assets",
  "tab-news": "news-articles",
  "tab-coupons": "coupons",
  "tab-donations": "donations",
  "tab-community": "community",
  "tab-feedback": "customer-feedback",
  "tab-notifications": "notifications",
  "tab-account": "account-settings"
};

const slugToTabMap = {
  "dashboard": "tab-dashboard",
  "store-products": "tab-store",
  "customer-orders": "tab-orders",
  "registered-users": "tab-users",
  "art-library": "tab-art",
  "motion-assets": "tab-motion",
  "news-articles": "tab-news",
  "coupons": "tab-coupons",
  "donations": "tab-donations",
  "community": "tab-community",
  "customer-feedback": "tab-feedback",
  "notifications": "tab-notifications",
  "account-settings": "tab-account"
};

function activateTabById(targetTab, updateHash = true) {
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

  if (targetTab === "tab-community" || targetTab === "tab-feedback") {
    if (typeof loadCommunityReviews === "function") loadCommunityReviews();
    if (typeof loadDesignPollSuggestions === "function") loadDesignPollSuggestions();
  }

  if (updateHash && tabSlugMap[targetTab]) {
    const slug = tabSlugMap[targetTab];
    if (window.location.hash !== `#${slug}`) {
      history.pushState(null, "", `#${slug}`);
    }
  }

  const sidebar = document.querySelector(".admin-sidebar");
  if (sidebar) sidebar.classList.remove("active");
}

function handleHashRouting() {
  const currentHash = window.location.hash.replace("#", "");
  const parts = currentHash.split('/');
  const mainSlug = parts[0] || "dashboard";
  const subTabId = parts[1];

  const targetTab = slugToTabMap[mainSlug] || "tab-dashboard";
  activateTabById(targetTab, false);

  if (subTabId) {
    const parentSubpage = document.getElementById(targetTab);
    if (parentSubpage) {
      const btn = parentSubpage.querySelector(`.inner-tab-btn[data-subtab="${subTabId}"]`);
      if (btn) {
        activateInnerTab(btn, false);
      }
    }
  }
}

function initSidebarTabs() {
  const sidebarLinks = document.querySelectorAll(".sidebar-link");

  sidebarLinks.forEach(link => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const targetTab = link.getAttribute("data-tab");
      activateTabById(targetTab, true);
    });
  });

  // Handle URL hash changes (browser back/forward or direct link pasting)
  window.addEventListener("popstate", handleHashRouting);
  window.addEventListener("hashchange", handleHashRouting);

  // Initial load routing
  handleHashRouting();

  const settingsBtn = document.getElementById("sidebar-btn-settings");
  if (settingsBtn) {
    settingsBtn.addEventListener("click", () => {
      activateTabById("tab-account", true);
    });
  }
}

// ═══════════════════════════════════════════════════════════
//  INNER SUBTABS TOGGLING
// ═══════════════════════════════════════════════════════════
function activateInnerTab(btn, pushHistory = true) {
  const parentSubpage = btn.closest(".admin-subpage");
  if (!parentSubpage) return;

  const btns = parentSubpage.querySelectorAll(".inner-tab-btn");
  const contents = parentSubpage.querySelectorAll(".inner-tab-content");

  btns.forEach(b => b.classList.remove("active"));
  contents.forEach(c => c.classList.remove("active"));

  btn.classList.add("active");
  const targetId = btn.getAttribute("data-subtab");
  const targetContent = parentSubpage.querySelector(`#${targetId}`);
  if (targetContent) {
    targetContent.classList.add("active");
  }

  if (pushHistory) {
    const mainTabId = parentSubpage.id;
    const mainSlug = tabSlugMap[mainTabId];
    if (mainSlug) {
      const newHash = `#${mainSlug}/${targetId}`;
      if (window.location.hash !== newHash) {
        history.pushState(null, "", newHash);
      }
    }
  }
}

function initInnerTabs() {
  const innerBtns = document.querySelectorAll(".inner-tab-btn");
  innerBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      activateInnerTab(btn, true);
    });
  });
}

function initMobileSidebar() {
  const toggleBtn = document.getElementById("sidebar-toggle");
  const sidebar = document.querySelector(".admin-sidebar");
  if (toggleBtn && sidebar) {
    toggleBtn.addEventListener("click", () => {
      sidebar.classList.toggle("active");
    });
  }
}

// ═══════════════════════════════════════════════════════════
//  DASHBOARD DATA & CHARTS
// ═══════════════════════════════════════════════════════════
function loadDashboardStats() {
  initDashboardCharts();
  renderRecentActivity();

  // Fetch donation stats from backend API
  fetch("/api/donate/stats")
    .then(res => res.ok ? res.json() : null)
    .then(data => {
      if (data && data.success) {
        const statDonations = document.getElementById("stat-donations");
        const statDonationsTrend = document.getElementById("stat-donations-trend");
        if (statDonations) {
          statDonations.textContent = `$${(data.totalUsd || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
        }
        if (statDonationsTrend) {
          statDonationsTrend.innerHTML = `<i class="fa-solid fa-heart"></i> ${data.donorCount || 0} donors`;
        }
      }
    })
    .catch(err => console.warn("Could not fetch donation stats for dashboard:", err));
}

function renderRecentActivity() {
  const tbody = document.getElementById("recent-activity-body");
  if (!tbody) return;

  const activities = [
    { img: "https://res.cloudinary.com/dmzchsqms/image/upload/f_auto,q_auto/w_600/v1757630827/all_characters_yvk9ik.webp", title: "SenpaiWorks 2.0 Release", type: "Article", cat: "Platform", status: "Published" },
    { img: "https://res.cloudinary.com/dmzchsqms/image/upload/f_auto,q_auto/w_600/v1757630827/deadpool_poster_krntp0.webp", title: "Itachi Graphic Oversized Tee", type: "Product", cat: "Merchandise", status: "Active" },
    { img: "https://res.cloudinary.com/dmzchsqms/image/upload/f_auto,q_auto/w_600/v1757630848/rem_happy_evhesz.webp", title: "Kaori Miyazono Portrait", type: "Artwork", cat: "Digital Portrait", status: "Featured" }
  ];

  tbody.innerHTML = activities.map(act => `
    <tr>
      <td><img src="${act.img}" alt="${act.title}" class="table-thumb"></td>
      <td><strong>${act.title}</strong></td>
      <td><span class="badge badge-type">${act.type}</span></td>
      <td>${act.cat}</td>
      <td><span class="status-pill status-active">${act.status}</span></td>
    </tr>
  `).join("");
}

function initDashboardCharts() {
  const ctxTimeline = document.getElementById("chart-timeline");
  if (ctxTimeline) {
    timelineChart = new Chart(ctxTimeline, {
      type: "line",
      data: {
        labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        datasets: [{
          label: "Sales Revenue (₹)",
          data: [12000, 19000, 15000, 28000, 22000, 34000, 42000],
          borderColor: "#2563eb",
          backgroundColor: "rgba(37, 99, 235, 0.15)",
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } }
      }
    });
  }

  const ctxCat = document.getElementById("chart-categories");
  if (ctxCat) {
    categoryChart = new Chart(ctxCat, {
      type: "doughnut",
      data: {
        labels: ["Apparel & Merch", "3D Assets & Rigs", "Digital Courses", "Art Prints"],
        datasets: [{
          data: [45, 25, 20, 10],
          backgroundColor: ["#2563eb", "#8b5cf6", "#10b981", "#f59e0b"]
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false
      }
    });
  }
}

// ═══════════════════════════════════════════════════════════
//  DONATIONS MANAGEMENT
// ═══════════════════════════════════════════════════════════
let allDonationsData = [];

async function loadDonations() {
  const tbody = document.getElementById("donations-list-body");
  const emptyState = document.getElementById("donations-empty-state");
  const totalRaisedEl = document.getElementById("donations-total-raised");
  const donorCountEl = document.getElementById("donations-donor-count");
  const goalProgressEl = document.getElementById("donations-goal-progress");
  const searchInput = document.getElementById("donations-search");

  if (!tbody) return;

  try {
    const res = await fetch("/api/donate/list");
    if (!res.ok) throw new Error("API error");
    const data = await res.json();

    allDonationsData = data.donations || [];

    // Update summary cards
    if (totalRaisedEl) totalRaisedEl.textContent = `$${(data.totalUsd || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    if (donorCountEl) donorCountEl.textContent = (data.totalDonors || 0).toLocaleString();
    if (goalProgressEl) {
      const goalPct = Math.min(100, Math.round(((data.totalUsd || 0) / (data.goalUsd || 1500)) * 100));
      goalProgressEl.textContent = `${goalPct}%`;
    }

    renderDonationsTable(allDonationsData);

    // Search handler
    if (searchInput) {
      searchInput.addEventListener("input", () => {
        const q = searchInput.value.toLowerCase().trim();
        if (!q) {
          renderDonationsTable(allDonationsData);
          return;
        }
        const filtered = allDonationsData.filter(d =>
          (d.donorName || "").toLowerCase().includes(q) ||
          (d.donorEmail || "").toLowerCase().includes(q) ||
          (d.transactionId || "").toLowerCase().includes(q) ||
          (d.paymentMethod || "").toLowerCase().includes(q)
        );
        renderDonationsTable(filtered);
      });
    }

  } catch (err) {
    console.warn("Could not fetch donations list:", err);
    if (emptyState) emptyState.style.display = "block";
    if (tbody) tbody.innerHTML = "";
  }
}

function renderDonationsTable(donations) {
  const tbody = document.getElementById("donations-list-body");
  const emptyState = document.getElementById("donations-empty-state");
  const table = document.getElementById("donations-table");

  if (!tbody) return;

  if (!donations || donations.length === 0) {
    tbody.innerHTML = "";
    if (emptyState) emptyState.style.display = "block";
    if (table) table.style.display = "none";
    return;
  }

  if (emptyState) emptyState.style.display = "none";
  if (table) table.style.display = "";

  const methodLabels = {
    card: "Credit/Debit Card",
    upi: "UPI",
    paypal: "PayPal",
    razorpay: "Razorpay",
    store_checkout: "Store Checkout",
    cards: "Card",
    netbanking: "Net Banking",
    cod: "COD"
  };

  tbody.innerHTML = donations.map(d => {
    const currSymbol = (d.currency || "USD") === "INR" ? "₹" : "$";
    const amountDisplay = `${currSymbol}${(d.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    const usdDisplay = `$${(d.amountInUsd || d.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    const method = methodLabels[(d.paymentMethod || "").toLowerCase()] || (d.paymentMethod || "Unknown");
    const dateStr = d.createdAt ? new Date(d.createdAt).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : "—";
    const statusClass = (d.paymentStatus || "").toUpperCase() === "SUCCESS" ? "status-active" : "status-pending";
    const statusText = d.paymentStatus || "Pending";

    return `
      <tr>
        <td><strong>${d.donorName || 'Anonymous'}</strong></td>
        <td>${d.donorEmail || '—'}</td>
        <td style="font-weight: 700;">${amountDisplay}</td>
        <td style="color: #10b981; font-weight: 600;">${usdDisplay}</td>
        <td><span class="badge badge-type">${method}</span></td>
        <td><code style="font-size: 0.78rem;">${d.transactionId || '—'}</code></td>
        <td>${dateStr}</td>
        <td><span class="status-pill ${statusClass}">${statusText}</span></td>
      </tr>
    `;
  }).join("");
}

// ═══════════════════════════════════════════════════════════
//  DATA MANAGEMENT (PRODUCTS, ORDERS, ARTWORKS, COUPONS, NEWS)
// ═══════════════════════════════════════════════════════════
let adminProductsList = [];

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
function getProductWishlistCount(productId, productName) {
  let count = 0;
  try {
    const wishlist = JSON.parse(localStorage.getItem("userWishlist") || "[]");
    count = wishlist.filter(item => (productId && item.id == productId) || (productName && item.name == productName)).length;
  } catch (e) { }

  try {
    const countsMap = JSON.parse(localStorage.getItem("product_wishlist_counts") || "{}");
    const storedCount = countsMap[productId] || countsMap[productName] || 0;
    count = Math.max(count, storedCount);
  } catch (e) { }

  return count;
}

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
  if (base.length === 0 && typeof DEFAULT_PRODUCT_REVIEWS !== "undefined") {
    base = DEFAULT_PRODUCT_REVIEWS;
  }

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
  row.style.cssText = "display: flex; align-items: center; gap: 10px; background: var(--bg-primary, #0f172a); padding: 10px; border-radius: 10px; border: 1px solid var(--border-color, #1e293b); flex-wrap: wrap;";

  const defaultImg = "assets/Store/Tshirts/Colored itachi tshirts/itachi_black_tshirt_colored.jpg";
  const nameVal = colorData.name || "Black";
  const hexVal = colorData.hex || colorData.colorCode || "#111111";
  const imgVal = colorData.img || defaultImg;
  const isAvail = colorData.available !== false;

  row.innerHTML = `
    <img src="${imgVal}" class="color-thumb-preview" style="width: 40px; height: 40px; object-fit: cover; border-radius: 6px; border: 1px solid #334155;" onerror="this.src='${defaultImg}'">
    <input type="text" class="color-name-field" placeholder="Color Name (e.g. Black)" value="${nameVal}" style="width: 130px; padding: 8px 12px; border-radius: 8px; border: 1px solid #334155; background: #1e293b; color: #fff; font-size: 0.85rem;">
    <input type="color" class="color-hex-field" value="${hexVal.startsWith('#') ? hexVal : '#111111'}" title="Swatch Hex Color" style="width: 38px; height: 36px; padding: 2px; border-radius: 6px; border: 1px solid #334155; cursor: pointer; background: transparent;">
    <input type="text" class="color-img-field" placeholder="Color Image URL (assets/... or https://...)" value="${imgVal}" style="flex: 1; min-width: 200px; padding: 8px 12px; border-radius: 8px; border: 1px solid #334155; background: #1e293b; color: #fff; font-size: 0.85rem;">
    <label style="display: flex; align-items: center; gap: 6px; font-size: 0.82rem; cursor: pointer; color: #cbd5e1;">
      <input type="checkbox" class="color-avail-field" ${isAvail ? 'checked' : ''}>
      Active
    </label>
    <button type="button" class="btn-remove-color" title="Remove Color Variant" style="background: rgba(239, 68, 68, 0.15); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3); padding: 8px 12px; border-radius: 8px; cursor: pointer;"><i class="fa-solid fa-trash"></i></button>
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

// ── Dynamic Additional Image URLs Manager ─────────────────
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
    <input type="text" class="url-input-field" placeholder="Image URL (e.g. assets/... or https://...)" value="${urlVal}">
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
let customCategoriesList = JSON.parse(localStorage.getItem("adminCustomCategories") || '[]');

function initCategoryManagement() {
  const openBtn = document.getElementById("btn-open-add-category-modal");
  const modal = document.getElementById("admin-category-modal");
  const form = document.getElementById("form-add-category");

  // Load stored custom categories into subtabs & dropdown
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
        showAdminToast(`Category '${catName}' created successfully!`, "success");
      } else {
        showAdminToast(`Category '${catName}' already exists.`, "warning");
      }

      if (input) input.value = "";
      closeAdminCategoryModal();
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
      renderProductsTable(adminProductsList.filter(p => p.category === catName || p.subCategory === catName));
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

async function loadProducts() {
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
      adminProductsList = await res.json();
    } else {
      adminProductsList = window.PRODUCTS || [];
    }
  } catch (err) {
    console.warn("Using offline fallback products list in admin:", err);
    adminProductsList = window.PRODUCTS || [];
  }

  try {
    localStorage.setItem("admin_custom_products", JSON.stringify(adminProductsList));
    window.PRODUCTS = adminProductsList;
  } catch (e) { }

  // Update Category Counts
  const countAll = document.getElementById("admin-count-all");
  const countOversized = document.getElementById("admin-count-oversized");
  const countHoodies = document.getElementById("admin-count-hoodies");

  if (countAll) countAll.textContent = adminProductsList.length;
  if (countOversized) {
    const numOversized = adminProductsList.filter(p => p.category === "Oversized T-Shirts" || p.subCategory === "Oversized T-Shirts").length;
    countOversized.textContent = numOversized;
  }
  if (countHoodies) {
    const numHoodies = adminProductsList.filter(p => p.category === "Hoodies" || p.subCategory === "Hoodies").length;
    countHoodies.textContent = numHoodies;
  }

  initCategoryManagement();
  renderProductsTable(adminProductsList);

  // Category Pills Filter
  const subtabs = document.querySelectorAll("#prod-category-subtabs .table-subtab-pill");
  subtabs.forEach(tab => {
    tab.onclick = () => {
      subtabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      const cat = tab.getAttribute("data-cat");
      if (cat === "all") {
        renderProductsTable(adminProductsList);
      } else {
        renderProductsTable(adminProductsList.filter(p => p.category === cat || p.subCategory === cat));
      }
    };
  });

  // Search Input & Search Icon
  const runSearch = () => {
    const q = (searchInput ? searchInput.value : "").toLowerCase().trim();
    if (!q) {
      renderProductsTable(adminProductsList);
      return;
    }
    const filtered = adminProductsList.filter(p =>
      (p.name || "").toLowerCase().includes(q) ||
      (p.category || "").toLowerCase().includes(q) ||
      (p.subCategory || "").toLowerCase().includes(q) ||
      (p.id || "").toLowerCase().includes(q) ||
      (p.type || "").toLowerCase().includes(q) ||
      (p.description || "").toLowerCase().includes(q)
    );
    renderProductsTable(filtered);
  };

  if (searchInput) searchInput.oninput = runSearch;
  if (searchIcon) searchIcon.onclick = () => { if (searchInput) searchInput.focus(); runSearch(); };

  // Select Mode Toggle Button (Hide checkboxes at start, show on click)
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
        updateStoreBulkSelection();
      }
    };
  }

  // Select All Checkbox Handler
  if (selectAllCb) {
    selectAllCb.onclick = () => {
      const isChecked = selectAllCb.checked;
      const cbs = document.querySelectorAll("#products-list-body .tbl-checkbox");
      cbs.forEach(cb => { cb.checked = isChecked; });
      updateStoreBulkSelection();
    };
  }

  // Bulk Delete Button Handler
  if (bulkDeleteBtn) {
    bulkDeleteBtn.onclick = async () => {
      const selectedCbs = Array.from(document.querySelectorAll("#products-list-body .tbl-checkbox")).filter(cb => cb.checked);
      const idsToDelete = selectedCbs.map(cb => cb.value);
      if (idsToDelete.length === 0) return;

      const confirmed = await showAdminConfirm(
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
            headers: { "Authorization": `Bearer ${activeAdminToken || "admin-secret-token-senpaiworks-2026"}` }
          });
          deletedCount++;
        } catch (e) {
          console.error("Bulk delete error:", e);
        }
      }

      adminProductsList = adminProductsList.filter(p => !idsToDelete.includes(p.id));
      renderProductsTable(adminProductsList);
      showAdminToast(`Successfully deleted ${deletedCount || idsToDelete.length} product(s)!`, "success", "Bulk Delete Complete");
    };
  }

  // Export CSV Handler
  if (exportBtn) {
    exportBtn.onclick = () => {
      if (!adminProductsList || adminProductsList.length === 0) {
        showAdminToast("No product data to export.", "warning");
        return;
      }

      const headers = ["ID", "Name", "Category", "SubCategory", "Sale Price (INR)", "Original Price (INR)", "Stock", "Available", "Type", "Badge", "Rating"];
      const rows = adminProductsList.map(p => [
        `"${p.id || ''}"`,
        `"${(p.name || '').replace(/"/g, '""')}"`,
        `"${p.category || ''}"`,
        `"${p.subCategory || ''}"`,
        p.price || 0,
        p.originalPrice || p.price || 0,
        p.stockQuantity !== undefined ? p.stockQuantity : 50,
        p.available !== false ? "Yes" : "No",
        `"${p.type || 'physical'}"`,
        `"${p.badge || ''}"`,
        p.rating || 5.0
      ]);

      const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `senpaiworks_products_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showAdminToast(`Exported ${adminProductsList.length} products to CSV!`, "success", "Export Successful");
    };
  }

  // Table Density View Toggle Handler
  if (viewToggleBtn) {
    let isCompact = false;
    viewToggleBtn.onclick = () => {
      const table = document.getElementById("products-table");
      if (!table) return;
      isCompact = !isCompact;
      table.classList.toggle("table-compact", isCompact);
      viewToggleBtn.innerHTML = isCompact ? `<i class="fa-solid fa-list"></i> View: Compact` : `<i class="fa-solid fa-table-cells"></i> View: Expanded`;
      showAdminToast(`Switched table layout to ${isCompact ? 'Compact' : 'Expanded'} density`, "info");
    };
  }

  if (printBtn) printBtn.onclick = () => window.print();

  // Add Image URL Button Handler
  const addUrlBtn = document.getElementById("btn-add-image-url");
  if (addUrlBtn) {
    addUrlBtn.onclick = () => addAdditionalUrlInputRow("");
  }
}

function renderProductsTable(products) {
  const tbody = document.getElementById("products-list-body");
  const countSpan = document.getElementById("product-table-count");
  if (!tbody) return;

  if (countSpan) countSpan.textContent = `Showing ${products.length} products`;

  if (!products || products.length === 0) {
    tbody.innerHTML = `<tr><td colspan="10" style="text-align: center; color: #94a3b8; padding: 32px;">No store products found.</td></tr>`;
    updateStoreBulkSelection();
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
        <td class="select-col-td"><input type="checkbox" class="tbl-checkbox" value="${p.id}" onchange="updateStoreBulkSelection()"></td>
        <td><img src="${p.img || 'https://res.cloudinary.com/dmzchsqms/image/upload/f_auto,q_auto/w_200/v1757630848/rem_happy_evhesz.webp'}" alt="${p.name}" class="table-thumb" style="width: 44px; height: 44px; object-fit: cover; border-radius: 8px;"></td>
        <td>
          <strong style="color: var(--text-primary);">${p.name}</strong>${badgePill}<br>
          <code style="font-size: 0.76rem; color: var(--text-muted);">${p.id}</code>
        </td>
        <td>
          <span class="badge badge-type">${p.category || 'General'}</span>
          ${p.subCategory ? `<br><span style="font-size: 0.76rem; color: var(--text-muted);">${p.subCategory}</span>` : ''}
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
          <button type="button" class="action-btn btn-view" onclick="viewProductModal('${p.id}')" title="Quick View Product Details"><i class="fa-solid fa-eye"></i></button>
          <button type="button" class="action-btn btn-edit" onclick="editProduct('${p.id}')" title="Edit Product"><i class="fa-solid fa-pen"></i></button>
          <button type="button" class="action-btn" onclick="toggleProductAvailability('${p.id}', ${isAvail})" title="${toggleTitle}">${toggleIcon}</button>
          <button type="button" class="action-btn btn-delete" onclick="deleteProduct('${p.id}')" title="Delete Product"><i class="fa-solid fa-trash"></i></button>
        </td>
      </tr>
    `;
  }).join("");

  updateStoreBulkSelection();
}

window.viewProductModal = function (id) {
  const prod = adminProductsList.find(p => p.id === id);
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
          <span class="badge badge-type">${prod.category || 'General'}</span>
          <span style="font-size: 0.85rem; font-weight: 700; color: #38bdf8; text-transform: uppercase;">${prod.type || 'physical'}</span>
        </div>
        <h2 style="font-size: 1.25rem; font-weight: 800; margin: 0; color: var(--text-primary);">${prod.name}</h2>
        <code style="font-size: 0.8rem; color: var(--text-muted);">${prod.id}</code>
        
        <div style="display: flex; align-items: baseline; gap: 10px; margin: 4px 0;">
          <span style="font-size: 1.5rem; font-weight: 800; color: #38bdf8;">${priceDisplay}</span>
          <span style="font-size: 0.9rem; text-decoration: line-through; color: var(--text-muted);">MRP: ${origPriceDisplay}</span>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 0.85rem; background: var(--bg-primary); padding: 12px; border-radius: 10px; border: 1px solid var(--border-color);">
          <div><strong>Stock:</strong> ${prod.stockQuantity !== undefined ? prod.stockQuantity : 50} units</div>
          <div><strong>Status:</strong> ${prod.available !== false ? '✅ Available' : '❌ Unavailable'}</div>
          <div><strong>Badge:</strong> ${prod.badge || 'None'}</div>
          <div><strong>Wishlist / Favorites:</strong> ❤️ ${wishlistDetails.count} Users <span style="font-size: 0.75rem; color: var(--text-muted); display: block; margin-top: 2px;">${wishlistDetails.breakdownStr}</span></div>
          <div><strong>Rating:</strong> ⭐ ${ratingStats.rating} (${ratingStats.ratingCount} reviews)</div>
          <div><strong>SubCategory:</strong> ${prod.subCategory || 'N/A'}</div>
          <div><strong>Type:</strong> ${(prod.type || 'physical').toUpperCase()}</div>
        </div>

        <p style="font-size: 0.88rem; color: var(--text-secondary); line-height: 1.5; margin-top: 6px;">
          ${prod.description || 'No description provided.'}
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
    headers: {
      ...getAdminTokenHeaders(),
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ type: 'wishlist_restock', title: '?? Back in Stock Alert!', message: 'A product in your wishlist is now back in stock and ready to order!', link: '/store-detail.html?id=' + prodId, icon: 'fa-box-open' })
  }).catch(e => console.error('Error generating back in stock notification:', e));
}

window.toggleProductAvailability = async function (id, currentStatus) {
  const newStatus = !currentStatus;
  try {
    const res = await fetch(`/api/products/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${activeAdminToken || "admin-secret-token-senpaiworks-2026"}`
      },
      body: JSON.stringify({ available: newStatus })
    });
    if (res.ok) {
      showAdminToast(`Product availability updated to ${newStatus ? 'Available' : 'Unavailable'}`, "success");
      notifyWishlistUsersBackInStock(id, newStatus);
      loadProducts();
    } else {
      const prod = adminProductsList.find(p => p.id === id);
      if (prod) prod.available = newStatus;
      showAdminToast(`Product status updated locally to ${newStatus ? 'Available' : 'Unavailable'}`, "info");
      notifyWishlistUsersBackInStock(id, newStatus);
      renderProductsTable(adminProductsList);
    }
  } catch (err) {
    const prod = adminProductsList.find(p => p.id === id);
    if (prod) prod.available = newStatus;
    showAdminToast(`Product status updated locally to ${newStatus ? 'Available' : 'Unavailable'}`, "info");
    notifyWishlistUsersBackInStock(id, newStatus);
    renderProductsTable(adminProductsList);
  }
};

window.deleteProduct = async function (id) {
  const confirmed = await showAdminConfirm("Delete Product", `Are you sure you want to delete product '${id}'? This cannot be undone.`, "Delete Product", "danger");
  if (!confirmed) return;

  try {
    const res = await fetch(`/api/products/${id}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${activeAdminToken || "admin-secret-token-senpaiworks-2026"}`
      }
    });
    if (res.ok) {
      showAdminToast("Product deleted successfully!", "success");
      loadProducts();
    } else {
      adminProductsList = adminProductsList.filter(p => p.id !== id);
      renderProductsTable(adminProductsList);
      showAdminToast("Product deleted locally!", "info");
    }
  } catch (err) {
    adminProductsList = adminProductsList.filter(p => p.id !== id);
    renderProductsTable(adminProductsList);
    showAdminToast("Product deleted locally!", "info");
  }
};

let editingProductId = null;

window.editProduct = function (id) {
  const prod = adminProductsList.find(p => p.id === id);
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

  // Append category option if missing dynamically
  if (categoryInput) {
    if (prod.category && !categoryInput.querySelector(`option[value="${prod.category}"]`)) {
      appendCategoryToUI(prod.category, false);
    }
    categoryInput.value = prod.category || "Oversized T-Shirts";
  }

  if (subCategoryInput) subCategoryInput.value = prod.subCategory || "";
  if (typeInput) typeInput.value = prod.type || "physical";
  if (stockInput) stockInput.value = prod.stockQuantity !== undefined ? prod.stockQuantity : 50;
  if (availableInput) availableInput.value = String(prod.available !== false);
  if (badgeInput) badgeInput.value = prod.badge || "";
  if (ratingInput) ratingInput.value = prod.rating || 5.0;
  if (ratingCountInput) ratingCountInput.value = prod.ratingCount || 48;
  if (imgInput) imgInput.value = prod.img || "";
  
  if (skuInput) skuInput.value = prod.sku || "";
  if (costPriceInput) costPriceInput.value = prod.costPrice || 0;
  if (statusInput) statusInput.value = prod.status || "Active";

  // Parse variantsData
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

  // Parse featureHighlights
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

  // Switch to Add/Edit Product tab
  const addTabBtn = document.querySelector('.inner-tab-btn[data-subtab="store-add"]');
  if (addTabBtn) addTabBtn.click();

  showAdminToast(`Editing product: ${prod.name}`, "info");
};

function initProductAddForm() {
  const form = document.getElementById("form-add-product");
  if (!form) return;

  renderAdditionalImageUrls([]);
  renderColorVariantsContainer([]);

  const addColorBtn = document.getElementById("btn-add-color-variant");
  if (addColorBtn) {
    addColorBtn.onclick = () => renderColorVariantInputRow({ name: "Black", hex: "#111111", img: "", available: true });
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const isEdit = Boolean(editingProductId);
    let id = document.getElementById("prod-id").value.trim();
    const name = document.getElementById("prod-name").value.trim();

    if (!id) {
      id = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    }
    if (!isEdit && Array.isArray(adminProductsList) && adminProductsList.some(p => p.id === id)) {
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
    const stockQuantity = parseInt(document.getElementById("prod-stock").value) || 0;
    const available = document.getElementById("prod-available-status").value === "true";
    const badge = document.getElementById("prod-badge").value.trim();
    
    // New fields
    const sku = document.getElementById("prod-sku")?.value.trim() || "";
    const costPrice = parseFloat(document.getElementById("prod-cost-price")?.value) || 0;
    const status = document.getElementById("prod-status")?.value || "Active";
    const slug = id;
    
    // Automatically calculate rating and rating count from customer reviews
    const ratingStats = calculateProductRating({ id, name });
    const rating = ratingStats.rating;
    const ratingCount = ratingStats.ratingCount;

    const img = document.getElementById("prod-img").value.trim();
    const additionalImages = getAdditionalImageUrls();
    const description = document.getElementById("prod-description").value.trim();

    // Package Variant Config
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
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${activeAdminToken || "admin-secret-token-senpaiworks-2026"}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        showAdminToast(`Product '${name}' ${isEdit ? 'updated' : 'created'} successfully!`, "success");
      } else {
        showAdminToast(`Saved product '${name}' locally!`, "info");
      }
    } catch (err) {
      showAdminToast(`Saved product '${name}' locally!`, "info");
    }

    if (isEdit) {
      const idx = adminProductsList.findIndex(p => p.id === editingProductId);
      if (idx !== -1) adminProductsList[idx] = payload;
    } else {
      adminProductsList.unshift(payload);
    }

    try {
      localStorage.setItem("admin_custom_products", JSON.stringify(adminProductsList));
    } catch(e) {}
    window.PRODUCTS = adminProductsList;
    window.dispatchEvent(new Event("productsUpdated"));

    editingProductId = null;
    form.reset();
    renderAdditionalImageUrls([]);
    renderColorVariantsContainer([]);
    document.getElementById("prod-id").readOnly = false;
    renderProductsTable(adminProductsList);

    const listTabBtn = document.querySelector('.inner-tab-btn[data-subtab="store-list"]');
    if (listTabBtn) listTabBtn.click();
  });
}



let usersCurrentStatus = "all";
let usersCurrentPage = 1;
let usersPageSize = 10;

window.changeUsersPage = function (p) {
  usersCurrentPage = p;
  loadUsers();
};

async function loadUsers() {
  const tbody = document.getElementById("users-list-body");
  const countSpan = document.getElementById("users-table-count");
  const searchInput = document.getElementById("users-search");
  const pageSizeSelect = document.getElementById("users-page-size");
  if (!tbody) return;

  if (pageSizeSelect) usersPageSize = parseInt(pageSizeSelect.value) || 10;

  try {
    const res = await fetch("/api/users");
    if (res.ok) {
      const dbUsers = await res.json();
      if (dbUsers && dbUsers.length > 0) {
        const existingEmails = new Set(dbUsers.map(u => u.email));
        const mappedDbUsers = dbUsers.map(u => ({
          id: u.id,
          username: u.username || u.name || "User",
          email: u.email,
          avatar: u.avatar || "https://res.cloudinary.com/dmzchsqms/image/upload/f_auto,q_auto/w_600/v1757630848/rem_happy_evhesz.webp",
          provider: u.provider || "Email & Password",
          joined: u.createdAt ? new Date(u.createdAt).toISOString().split('T')[0] : "2026-07-28",
          ordersCount: u.ordersCount || 0,
          status: "Verified"
        }));
        allUsers = [...mappedDbUsers, ...allUsers.filter(u => !existingEmails.has(u.email))];
      }
    }
  } catch (err) {
    console.warn("Backend user fetch offline, using default users list:", err);
  }

  let filtered = [...allUsers];

  const query = searchInput ? searchInput.value.toLowerCase().trim() : "";
  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: #999; padding: 20px;">No matching user accounts found.</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(u => `
    <tr>
      <td>
        <div style="display: flex; align-items: center; gap: 10px;">
          <img src="${u.avatar}" alt="${u.username}" style="width: 34px; height: 34px; border-radius: 50%; object-fit: cover;">
          <strong style="font-size: 0.9rem;">@${u.username}</strong>
        </div>
      </td>
      <td>${u.email}</td>
      <td><span class="status-pill" style="background: rgba(2, 132, 199, 0.15); color: #0284c7; font-weight: 700;"><i class="fa-brands fa-shield"></i> ${u.provider}</span></td>
      <td>${u.joined}</td>
      <td><strong style="color: #e11d48;">${u.ordersCount} Order${u.ordersCount === 1 ? '' : 's'}</strong></td>
      <td><span class="status-pill status-delivered"><i class="fa-solid fa-circle-check"></i> ${u.status}</span></td>
      <td>
        <button class="action-btn btn-edit" onclick="alert('Viewing account details for @${u.username}')" title="View Account Details"><i class="fa-solid fa-eye"></i></button>
      </td>
    </tr>
  `).join("");
}

// ═══════════════════════════════════════════════════════════
//  ADMIN AUTHENTICATION & SECURITY (IN-MEMORY TAB-ISOLATED TOKEN)
// ═══════════════════════════════════════════════════════════
function initAdminAuth() {
  const overlay = document.getElementById("admin-auth-overlay");
  const loginForm = document.getElementById("admin-login-form");
  const errorMsg = document.getElementById("admin-login-error");
  const logoutBtn = document.getElementById("sidebar-btn-logout");

  const isLocalDev = location.hostname === "localhost" || location.hostname === "127.0.0.1";
  if (overlay && isLocalDev) {
    overlay.classList.remove("active");
  }

  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const usernameInput = document.getElementById("admin-username");
      const passwordInput = document.getElementById("admin-password");
      const submitBtn = document.getElementById("admin-login-btn");

      if (errorMsg) errorMsg.style.display = "none";
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Verifying...';
      }

      try {
        const response = await fetch("/api/admin/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: usernameInput ? usernameInput.value.trim() : "",
            password: passwordInput ? passwordInput.value : ""
          })
        });

        const data = await response.json();

        if (response.ok && data.success && data.token) {
          activeAdminToken = data.token; // Store token in memory only
          if (overlay) overlay.classList.remove("active");
          if (loginForm) loginForm.reset();
          loadArtworks();
        } else {
          if (errorMsg) {
            errorMsg.textContent = data.error || "Invalid admin username or password.";
            errorMsg.style.display = "block";
          }
        }
      } catch (err) {
        console.error("Admin Auth Error:", err);
        if (errorMsg) {
          errorMsg.textContent = "Unable to connect to backend server. Make sure node server is running on port 5000.";
          errorMsg.style.display = "block";
        }
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = '<i class="fa-solid fa-lock-open"></i> Unlock Admin Dashboard';
        }
      }
    });
  }

  function setupLogoutBtn(btn) {
    if (!btn || btn.dataset.hasLogout) return;
    btn.dataset.hasLogout = "true";
    btn.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (confirm("Are you sure you want to sign out from Admin Control?")) {
        localStorage.removeItem("adminToken");
        localStorage.removeItem("activeAdminToken");
        localStorage.removeItem("currentUser");
        activeAdminToken = "";
        alert("You have signed out successfully.");
        location.reload();
      }
    };
  }

  setupLogoutBtn(document.getElementById("sidebar-btn-logout"));
  setupLogoutBtn(document.getElementById("header-btn-logout"));

  // Password Visibility Eye Toggle
  const togglePassBtn = document.getElementById("toggle-admin-pass");
  const passInput = document.getElementById("admin-password");
  const toggleIcon = document.getElementById("toggle-pass-icon");

  if (togglePassBtn && passInput && toggleIcon) {
    togglePassBtn.addEventListener("click", () => {
      const isPassword = passInput.type === "password";
      passInput.type = isPassword ? "text" : "password";
      toggleIcon.className = isPassword ? "fa-solid fa-eye-slash" : "fa-solid fa-eye";
    });
  }
}

// ── Table State & Pagination ──────────────────────────────
let artCurrentCat = "all";
let artCurrentPage = 1;
let artPageSize = 10;

let ordersCurrentStatus = "all";
let ordersCurrentPage = 1;
let ordersPageSize = 10;

let cacheArtworksList = [];

// Export CSV Utility
window.exportTableCSV = function (filename, headers, rows) {
  let csv = headers.join(",") + "\n";
  rows.forEach(r => {
    csv += r.map(val => `"${String(val).replace(/"/g, '""')}"`).join(",") + "\n";
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

// Print Table Utility
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

// Generic Pagination Controls Renderer
function renderPagination(controlsId, totalItems, currentPage, pageSize, pageChangeFnName) {
  const container = document.getElementById(controlsId);
  if (!container) return;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;

  let html = `<button type="button" class="pg-btn" ${currentPage === 1 ? 'disabled' : ''} onclick="${pageChangeFnName}(1)">«</button>`;
  html += `<button type="button" class="pg-btn" ${currentPage === 1 ? 'disabled' : ''} onclick="${pageChangeFnName}(${currentPage - 1})"><</button>`;

  for (let p = 1; p <= totalPages; p++) {
    if (p === 1 || p === totalPages || (p >= currentPage - 1 && p <= currentPage + 1)) {
      html += `<button type="button" class="pg-btn ${p === currentPage ? 'active' : ''}" onclick="${pageChangeFnName}(${p})">${p}</button>`;
    } else if (p === currentPage - 2 || p === currentPage + 2) {
      html += `<span style="color:#64748b; padding:0 2px;">...</span>`;
    }
  }

  html += `<button type="button" class="pg-btn" ${currentPage === totalPages ? 'disabled' : ''} onclick="${pageChangeFnName}(${currentPage + 1})">></button>`;
  html += `<button type="button" class="pg-btn" ${currentPage === totalPages ? 'disabled' : ''} onclick="${pageChangeFnName}(${totalPages})">»</button>`;

  container.innerHTML = html;
}

window.changeArtPage = function (p) {
  artCurrentPage = p;
  loadArtworks();
};

window.changeOrdersPage = function (p) {
  ordersCurrentPage = p;
  loadOrders();
};

async function loadArtworks() {
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
      if (dbArtworks && dbArtworks.length > 0) {
        cacheArtworksList = dbArtworks;
      }
    }
  } catch (err) {
    console.warn("Backend artworks fetch offline, showing default list:", err);
  }

  let filtered = [...cacheArtworksList];

  // 1. Search Query Filter
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

  // 2. Subtabs Category Filter
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

  renderPagination("art-page-controls", totalItems, artCurrentPage, artPageSize, "changeArtPage");

  if (paginated.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: #94a3b8; padding: 24px;">No matching artworks found.</td></tr>`;
    return;
  }

  tbody.innerHTML = paginated.map(a => {
    const formattedDate = a.createdAt ? new Date(a.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '01 Aug 2026';
    return `
      <tr>
        <td class="td-checkbox"><input type="checkbox" class="tbl-checkbox"></td>
        <td>
          <div style="display:flex; align-items:center; gap:12px;">
            <img src="${a.img}" alt="${a.charname}" class="table-thumb" style="width:42px; height:42px; border-radius:8px; object-fit:cover;">
            <div>
              <strong style="color: #f8fafc;">${a.charname}</strong>
              <br><small style="color:#64748b; font-size:0.76rem;"><i class="fa-regular fa-calendar"></i> ${formattedDate}</small>
            </div>
          </div>
        </td>
        <td>
          <span class="badge badge-type" style="margin-bottom:2px; display:inline-block;">${(a.category || "").replace('-', ' ')}</span>
          <br><small style="color:#cbd5e1; font-size:0.8rem;">${a.artstyle || 'Digital Art'}</small>
        </td>
        <td>
          <div style="font-size:0.84rem; color:#e2e8f0;">
            <strong style="color:#38bdf8;">${a.artist || 'SenpaiWorks Official'}</strong>
            <br><small style="color:#94a3b8;">${a.source || 'SenpaiWorks Original'}</small>
          </div>
        </td>
        <td>
          <div style="display:flex; align-items:center; gap:10px; font-size:0.84rem;">
            <span title="Likes" style="color:#ef4444; font-weight:700; display:inline-flex; align-items:center; gap:4px;">
              <i class="fa-solid fa-heart"></i> ${a.likeCount || 0}
            </span>
            <span title="Comments" style="color:#38bdf8; font-weight:700; display:inline-flex; align-items:center; gap:4px;">
              <i class="fa-solid fa-comment"></i> ${a.commentCount || 0}
            </span>
            <span title="Interested" style="color:#eab308; font-weight:700; display:inline-flex; align-items:center; gap:4px;">
              <i class="fa-solid fa-star"></i> ${a.interestCount || 0}
            </span>
            <span title="Downloads" style="color:#10b981; font-weight:700; display:inline-flex; align-items:center; gap:4px;">
              <i class="fa-solid fa-download"></i> ${a.downloadCount || 0}
            </span>
          </div>
        </td>
        <td>
          <button class="action-btn btn-edit" onclick="editArtwork(${a.id})" title="Edit Artwork"><i class="fa-solid fa-pen"></i> Edit</button>
          <button class="action-btn btn-delete" onclick="deleteArtwork(${a.id})" title="Delete Artwork"><i class="fa-solid fa-trash"></i> Delete</button>
        </td>
      </tr>
    `;
  }).join("");
}

function getAdminOrdersList() {
  let list = [];
  try {
    const raw = localStorage.getItem("user_orders") || localStorage.getItem("userOrdersList") || localStorage.getItem("userOrders");
    if (raw) list = JSON.parse(raw);
  } catch (e) { list = []; }

  if (!list || list.length === 0) {
    list = [
      {
        orderId: "ORD-105010",
        id: "ORD-105010",
        date: "03 Aug 2026",
        grandTotal: 1499,
        status: "Delivered",
        paymentType: "Razorpay Official Gateway",
        customerName: "Suhas H",
        email: "suhash092@gmail.com",
        phone: "+91 99022 15010",
        address: "05, 3rd Main Road, near lakshmi medical, MYSURU, KARNATAKA 570016, India",
        items: [
          {
            name: "Ken Kaneki Tokyo Ghoul B&W Edition T-Shirt",
            price: 1499,
            quantity: 1,
            variant: "Oversized / Black",
            img: "assets/Store/Tshirts/Black and white kaneki tshirts/kaneki_bw_black_tshirt.jpg"
          }
        ]
      },
      {
        orderId: "ORD-104980",
        id: "ORD-104980",
        date: "28 Jul 2026",
        grandTotal: 1499,
        status: "Processing",
        paymentType: "UPI / PhonePe",
        customerName: "Suhas H",
        email: "suhash092@gmail.com",
        phone: "+91 99022 15010",
        address: "05, 3rd Main Road, near lakshmi medical, MYSURU, KARNATAKA 570016, India",
        items: [
          {
            name: "Itachi Uchiha Duo Graphic Colored T-Shirt",
            price: 1499,
            quantity: 1,
            variant: "Oversized / Black",
            img: "assets/Store/Tshirts/Colored itachi tshirts/itachi_black_tshirt_colored.jpg"
          }
        ]
      }
    ];
  }
  return list;
}

async function loadOrders() {
  const tbody = document.getElementById("orders-list-body");
  const countSpan = document.getElementById("orders-table-count");
  const searchInput = document.getElementById("orders-search");
  const pageSizeSelect = document.getElementById("orders-page-size");
  if (!tbody) return;

  if (pageSizeSelect) ordersPageSize = parseInt(pageSizeSelect.value) || 10;

  const realOrders = getAdminOrdersList();
  let filtered = [...realOrders];

  const query = searchInput ? searchInput.value.toLowerCase().trim() : "";
  if (query) {
    filtered = filtered.filter(o => {
      const orderIdStr = (o.orderId || o.id || "").toLowerCase();
      const custStr = (o.customerName || o.email || "").toLowerCase();
      const itemStr = (o.items && o.items[0] ? o.items[0].name : "").toLowerCase();
      const statusStr = (o.status || "").toLowerCase();
      return orderIdStr.includes(query) || custStr.includes(query) || itemStr.includes(query) || statusStr.includes(query);
    });
  }

  if (ordersCurrentStatus !== "all") {
    filtered = filtered.filter(o => {
      const st = (o.status || "").toLowerCase();
      const target = ordersCurrentStatus.toLowerCase();
      return st.includes(target);
    });
  }

  const totalItems = filtered.length;
  const totalPages = Math.ceil(totalItems / ordersPageSize) || 1;
  if (ordersCurrentPage > totalPages) ordersCurrentPage = 1;

  const startIdx = (ordersCurrentPage - 1) * ordersPageSize;
  const endIdx = Math.min(startIdx + ordersPageSize, totalItems);
  const paginated = filtered.slice(startIdx, endIdx);

  if (countSpan) {
    countSpan.textContent = totalItems === 0 ? "Showing 0 entries" : `Showing ${startIdx + 1} - ${endIdx} of ${totalItems} entries`;
  }

  renderPagination("orders-page-controls", totalItems, ordersCurrentPage, ordersPageSize, "changeOrdersPage");

  if (paginated.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: #94a3b8; padding: 24px;">No matching customer orders found.</td></tr>`;
    return;
  }

  tbody.innerHTML = paginated.map(o => {
    const id = o.orderId || o.id;
    const firstItem = (o.items && o.items[0]) ? o.items[0] : { name: "SenpaiWorks Item", img: "assets/Videos/SenpaiWorks logo.png" };
    const date = o.date || "Mon, 03 Aug 2026";
    const payment = o.paymentType || "Razorpay Gateway";
    const amount = o.grandTotal ? `₹${o.grandTotal.toLocaleString()}.00` : (o.amount || "₹1,499.00");
    const status = o.status || "Processing";

    return `
      <tr>
        <td><input type="checkbox" class="tbl-checkbox"></td>
        <td>
          <div style="display:flex; align-items:center; gap:12px;">
            <img src="${firstItem.img}" alt="${firstItem.name}" style="width:40px; height:40px; border-radius:8px; object-fit:cover; background:#1e293b;">
            <div>
              <strong style="color: #f8fafc;">${firstItem.name} ${o.items && o.items.length > 1 ? `<span style="font-size:0.75rem; color:#0284c7;">(+${o.items.length - 1} more)</span>` : ''}</strong>
              <br><small style="color:#64748b; font-size:0.78rem;">#${id} • ${o.customerName || o.email || 'Customer'}</small>
            </div>
          </div>
        </td>
        <td><span style="color:#94a3b8; font-size:0.85rem;">${date}</span></td>
        <td><span style="font-weight:600; color:#e2e8f0; font-size:0.85rem;">${payment}</span></td>
        <td><strong style="color:#ffffff;">${amount}</strong></td>
        <td>
          <select onchange="window.updateAdminOrderStatus('${id}', this.value)" style="background: #1e293b; color: #ffffff; border: 1px solid #334155; padding: 4px 8px; border-radius: 6px; font-weight: 700; font-size: 0.8rem; cursor: pointer;">
            <option value="Processing" ${status.includes('Processing') ? 'selected' : ''}>Processing</option>
            <option value="In Transit" ${status.includes('Transit') ? 'selected' : ''}>In Transit</option>
            <option value="Delivered" ${status.includes('Delivered') ? 'selected' : ''}>Delivered</option>
            <option value="Return Requested" ${status.includes('Return') ? 'selected' : ''}>Replacement Requested</option>
            <option value="Refunded" ${status.includes('Refund') ? 'selected' : ''}>Refunded</option>
            <option value="Cancelled" ${status.includes('Cancel') ? 'selected' : ''}>Cancelled</option>
          </select>
        </td>
        <td>
          <button class="action-btn btn-edit" onclick="window.viewAdminOrderDetails('${id}')" title="View Full Order Details" style="background:#0284c7; color:#fff;"><i class="fa-solid fa-eye"></i> Details</button>
        </td>
      </tr>
    `;
  }).join("");
}

window.updateAdminOrderStatus = function (orderId, newStatus) {
  let list = getAdminOrdersList();
  const order = list.find(o => (o.orderId || o.id) === orderId);
  if (order) {
    order.status = newStatus;
    localStorage.setItem("user_orders", JSON.stringify(list));
    localStorage.setItem("userOrdersList", JSON.stringify(list));
    localStorage.setItem("userOrders", JSON.stringify(list));
    loadOrders();
    alert(`Order #${orderId} status updated to: ${newStatus}`);
  }
};

window.viewAdminOrderDetails = function (orderId) {
  const list = getAdminOrdersList();
  const order = list.find(o => (o.orderId || o.id) === orderId);
  if (!order) return;

  const modal = document.getElementById("admin-order-details-modal");
  const title = document.getElementById("admin-order-modal-title");
  const body = document.getElementById("admin-order-modal-body");

  if (title) title.innerHTML = `<i class="fa-solid fa-box-open"></i> Order Details #${order.orderId || order.id}`;

  const addressTxt = typeof order.address === 'string' ? order.address : (order.address ? `${order.address.firstName || ''} ${order.address.lastName || ''}, ${order.address.address || ''}, ${order.address.city || ''}, ${order.address.state || ''} ${order.address.pincode || ''}` : "Indiranagar, Mysuru");

  let itemsHtml = "";
  (order.items || []).forEach(item => {
    itemsHtml += `
      <div style="display:flex; align-items:center; gap:12px; background:#1e293b; padding:10px 14px; border-radius:10px; margin-bottom:8px;">
        <img src="${item.img || 'assets/Videos/SenpaiWorks logo.png'}" style="width:48px; height:48px; border-radius:8px; object-fit:cover;">
        <div>
          <div style="font-weight:700; color:#f8fafc; font-size:0.9rem;">${item.name}</div>
          <div style="font-size:0.8rem; color:#94a3b8;">${item.variant || 'Standard'} | Qty: ${item.quantity || 1} • ₹${(item.price || 0).toLocaleString()}</div>
        </div>
      </div>
    `;
  });

  let returnSection = "";
  if (order.returnRequest) {
    returnSection = `
      <div style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 12px; padding: 14px; margin-top: 10px;">
        <div style="font-weight: 800; color: #f87171; font-size: 0.9rem;"><i class="fa-solid fa-rotate-left"></i> Customer Replacement Request Details</div>
        <div style="font-size: 0.84rem; color: #cbd5e1; margin-top: 6px;"><strong>Reason:</strong> ${order.returnRequest.reason}</div>
        <div style="font-size: 0.84rem; color: #cbd5e1; margin-top: 2px;"><strong>Resolution:</strong> ${order.returnRequest.resolution}</div>
        ${order.returnRequest.notes ? `<div style="font-size: 0.84rem; color: #cbd5e1; margin-top: 2px;"><strong>Notes:</strong> ${order.returnRequest.notes}</div>` : ''}
        <div style="display: flex; gap: 10px; margin-top: 10px;">
          <button onclick="window.updateAdminOrderStatus('${order.orderId || order.id}', 'Return Approved'); closeAdminOrderDetailsModal();" style="background:#059669; color:#fff; border:none; padding:6px 14px; border-radius:16px; font-weight:700; font-size:0.8rem; cursor:pointer;">Approve Replacement</button>
          <button onclick="window.updateAdminOrderStatus('${order.orderId || order.id}', 'Refunded'); closeAdminOrderDetailsModal();" style="background:#0284c7; color:#fff; border:none; padding:6px 14px; border-radius:16px; font-weight:700; font-size:0.8rem; cursor:pointer;">Issue Refund</button>
        </div>
      </div>
    `;
  }

  if (body) {
    body.innerHTML = `
      <div>
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
          <div><strong style="color:#38bdf8;">Customer Name:</strong> ${order.customerName || 'Suhas H'}</div>
          <div><strong style="color:#38bdf8;">Email:</strong> ${order.email || 'suhash092@gmail.com'}</div>
        </div>
        <div style="margin-top:6px;"><strong style="color:#38bdf8;">Phone:</strong> ${order.phone || '+91 99022 15010'}</div>
        <div style="margin-top:6px;"><strong style="color:#38bdf8;">Shipping Address:</strong> ${addressTxt}</div>
        <div style="margin-top:6px;"><strong style="color:#38bdf8;">Payment Gateway:</strong> ${order.paymentType || 'Razorpay Gateway'}</div>
      </div>

      <div style="margin-top:10px;">
        <div style="font-weight:700; color:#94a3b8; font-size:0.85rem; margin-bottom:6px;">ORDERED ITEMS:</div>
        ${itemsHtml}
      </div>

      ${returnSection}
    `;
  }

  if (modal) modal.style.display = "flex";
};

window.closeAdminOrderDetailsModal = function () {
  const modal = document.getElementById("admin-order-details-modal");
  if (modal) modal.style.display = "none";
};

let editingArtworkId = null;

async function editArtwork(id) {
  const artwork = cacheArtworksList.find(a => a.id === id);
  if (!artwork) {
    alert("Artwork not found.");
    return;
  }

  editingArtworkId = artwork.id;

  // Pre-fill form fields in #form-add-artwork
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
    formTitle.innerHTML = `<i class="fa-solid fa-pen-to-square"></i> Edit Artwork: ${artwork.charname}`;
  }
  if (submitBtn) {
    submitBtn.innerHTML = `<i class="fa-solid fa-save"></i> Save Artwork Changes`;
  }

  // Switch tab to Add / Edit Artwork tab
  const addTabBtn = document.querySelector('.inner-tab-btn[data-subtab="art-add"]');
  if (addTabBtn) addTabBtn.click();
}

let selectedFileBase64 = null;
let selectedFileName = "";

function initArtworkForm() {
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

  // Handle Local File Upload Selection from Device
  if (fileInput) {
    fileInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file) return;

      selectedFileName = file.name;
      const reader = new FileReader();
      reader.onload = function (evt) {
        selectedFileBase64 = evt.target.result;
        if (imgBox) {
          imgBox.innerHTML = `<img src="${selectedFileBase64}" alt="Preview" style="object-fit: contain !important; width: 100%; height: 100%;">`;
        }
        if (statusSpan) {
          statusSpan.className = "image-preview-status valid";
          statusSpan.innerHTML = `<i class="fa-solid fa-circle-check"></i> Device File Loaded (${file.name})`;
        }
      };
      reader.readAsDataURL(file);
    });
  }

  // Handle Web URL Input
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

      selectedFileBase64 = null; // reset device upload if URL typed
      if (imgBox) {
        imgBox.innerHTML = `<img src="${url}" alt="Preview" style="object-fit: contain !important; width: 100%; height: 100%;" onerror="this.remove(); document.getElementById('add-art-img-box').innerHTML='<i class=\\'fa-solid fa-image-slash\\'></i>'; const s=document.getElementById('add-art-img-status'); if(s){s.className='image-preview-status invalid'; s.innerHTML='Invalid Image URL';}">`;
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
      // If local device file selected, upload to server first to generate permanent URL
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
          img = uploadData.url; // Permanent backend server URL (e.g. /uploads/art_1785.png)
        } else {
          throw new Error("Failed to upload image file to backend server.");
        }
      }

      if (!img) {
        alert("Please upload an image file from your device or enter an image URL.");
        if (submitBtn) submitBtn.disabled = false;
        return;
      }

      const isEdit = editingArtworkId !== null;
      const url = isEdit ? `/api/artworks/${editingArtworkId}` : "/api/artworks";
      const method = isEdit ? "PUT" : "POST";

      const headers = { "Content-Type": "application/json" };
      if (activeAdminToken) {
        headers["Authorization"] = `Bearer ${activeAdminToken}`;
      }

      const res = await fetch(url, {
        method,
        headers,
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
        alert(`Artwork "${charname}" ${isEdit ? 'updated' : 'uploaded'} successfully! Live URL: ${img}`);
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

        loadArtworks();

        const listSubtab = document.querySelector('[data-subtab="art-list"]');
        if (listSubtab) listSubtab.click();
      } else {
        alert("Operation Failed: " + (data.error || "Bad request"));
      }
    } catch (err) {
      console.error("Artwork Form Error:", err);
      alert("Error: " + err.message);
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
      }
    }
  });
}

function initInnerSubtabs() {
  const subtabBtns = document.querySelectorAll(".inner-tab-btn[data-subtab]");
  subtabBtns.forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const targetId = btn.getAttribute("data-subtab");
      const parentSubpage = btn.closest(".admin-subpage");
      if (!parentSubpage || !targetId) return;

      parentSubpage.querySelectorAll(".inner-tab-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      // Reset product form if navigating to Add Store Product tab
      if (targetId === "store-add") {
        if (typeof editingProductId !== "undefined") {
          editingProductId = null;
        }
        const pform = document.getElementById("form-add-product");
        if (pform) {
          pform.reset();
          if (typeof renderAdditionalImageUrls === "function") renderAdditionalImageUrls([]);
          if (typeof renderColorVariantsContainer === "function") renderColorVariantsContainer([]);
          const prodIdInput = document.getElementById("prod-id");
          if (prodIdInput) prodIdInput.readOnly = false;
        }
      }

      parentSubpage.querySelectorAll(".inner-tab-content").forEach(content => {
        content.style.display = "";
        if (content.id === targetId) {
          content.classList.add("active");
        } else {
          content.classList.remove("active");
        }
      });
    });
  });
}

async function deleteArtwork(id) {
  if (!confirm("Are you sure you want to delete this artwork?")) return;

  try {
    const headers = {};
    if (activeAdminToken) {
      headers["Authorization"] = `Bearer ${activeAdminToken}`;
    }

    const res = await fetch(`/api/artworks/${id}`, {
      method: "DELETE",
      headers
    });

    if (res.ok) {
      alert("Artwork deleted successfully!");
      loadArtworks();
    } else {
      const data = await res.json();
      alert("Delete Failed: " + (data.error || "Unauthorized"));
    }
  } catch (err) {
    console.error("Delete Artwork Error:", err);
    alert("Error deleting artwork from backend.");
  }
}
window.deleteArtwork = deleteArtwork;



function loadMotionAssets() {
  const tbody = document.getElementById("motion-list-body");
  if (!tbody) return;

  tbody.innerHTML = allMotionAssets.map(m => `
    <tr>
      <td><img src="${m.img}" alt="${m.title}" class="table-thumb"></td>
      <td><strong>${m.title}</strong></td>
      <td>${m.type}</td>
      <td><code>${m.format}</code></td>
      <td><span class="status-pill status-active">${m.status}</span></td>
      <td>
        <button class="action-btn btn-edit" onclick="alert('Edit asset: ${m.title}')"><i class="fa-solid fa-pen"></i></button>
      </td>
    </tr>
  `).join("");
}

function loadNewsArticles() {
  const tbody = document.getElementById("news-list-body");
  if (!tbody) return;

  tbody.innerHTML = allNewsArticles.map(n => `
    <tr>
      <td><code>${n.id}</code></td>
      <td><strong>${n.title}</strong></td>
      <td>${n.category}</td>
      <td>${n.author}</td>
      <td>
        <button class="action-btn btn-edit" onclick="alert('Edit article: ${n.title}')"><i class="fa-solid fa-pen"></i></button>
      </td>
    </tr>
  `).join("");
}

function loadCoupons() {
  const tbody = document.getElementById("coupons-list-body");
  if (!tbody) return;

  tbody.innerHTML = allCoupons.map(c => `
    <tr>
      <td><code class="coupon-code-tag">${c.code}</code></td>
      <td><strong>${c.discount}</strong></td>
      <td>${c.desc}</td>
      <td><span class="status-pill status-active">${c.status}</span></td>
      <td>
        <button class="action-btn btn-edit" onclick="alert('Toggle coupon ${c.code}')"><i class="fa-solid fa-toggle-on"></i></button>
      </td>
    </tr>
  `).join("");
}



function loadDesignPollSuggestions() {
  const tbody = document.getElementById("poll-suggestions-list-body");
  if (!tbody) return;

  const defaultSuggestions = [
    { id: "poll_def_1", suggestion: "Gojo Satoru Domain Expansion Tee", date: "Jul 26, 2026, 08:30 PM", status: "In Progress" },
    { id: "poll_def_2", suggestion: "Sung Jinwoo Shadow Monarch Oversized Tee", date: "Jul 25, 2026, 04:15 PM", status: "Pending" },
    { id: "poll_def_3", suggestion: "Chainsaw Man Pochita Vintage Wash", date: "Jul 24, 2026, 11:00 AM", status: "Completed" }
  ];

  let userPolls = [];
  try {
    const raw = localStorage.getItem("site_design_poll_suggestions");
    if (raw) userPolls = JSON.parse(raw);
  } catch (e) { }

  const allPolls = [...userPolls, ...defaultSuggestions];

  if (allPolls.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: #888; padding: 20px;">No anime character suggestions recorded yet.</td></tr>`;
    return;
  }

  tbody.innerHTML = allPolls.map(p => {
    let statusClass = "status-paid";
    if (p.status === "In Progress") statusClass = "status-shipped";
    if (p.status === "Pending") statusClass = "status-active";

    return `
      <tr>
        <td><strong>${p.suggestion}</strong></td>
        <td><small style="color: #888;">${p.date}</small></td>
        <td><span class="status-pill ${statusClass}">${p.status || "Pending"}</span></td>
        <td>
          <button class="action-btn btn-edit" onclick="toggleAdminPollStatus('${p.id}')" title="Change Status"><i class="fa-solid fa-rotate"></i></button>
          <button class="action-btn btn-delete" onclick="deleteAdminPollSuggestion('${p.id}')" title="Delete Suggestion"><i class="fa-solid fa-trash"></i></button>
        </td>
      </tr>
    `;
  }).join("");
}

window.toggleAdminPollStatus = function (pollId) {
  try {
    const raw = localStorage.getItem("site_design_poll_suggestions");
    if (raw) {
      let list = JSON.parse(raw);
      const target = list.find(p => p.id === pollId);
      if (target) {
        if (target.status === "Pending") target.status = "In Progress";
        else if (target.status === "In Progress") target.status = "Completed";
        else target.status = "Pending";
        localStorage.setItem("site_design_poll_suggestions", JSON.stringify(list));
      }
    }
  } catch (e) { }
  loadDesignPollSuggestions();
};

window.deleteAdminPollSuggestion = function (pollId) {
  if (!confirm("Remove this design suggestion?")) return;
  try {
    const raw = localStorage.getItem("site_design_poll_suggestions");
    if (raw) {
      let list = JSON.parse(raw);
      list = list.filter(p => p.id !== pollId);
      localStorage.setItem("site_design_poll_suggestions", JSON.stringify(list));
    }
  } catch (e) { }
  loadDesignPollSuggestions();
};

async function loadCommunityReviews() {
  const tbody = document.getElementById("community-list-body");
  const feedbackTbody = document.getElementById("customer-feedback-list-body");
  const feedbackAdminTbody = document.getElementById("feedback-admin-list-body");
  const countBadge = document.getElementById("admin-comm-reviews-count");
  const feedbackCountBadge = document.getElementById("admin-feedback-reviews-count");

  const allTargetTbodies = [tbody, feedbackTbody, feedbackAdminTbody].filter(Boolean);
  if (allTargetTbodies.length === 0) return;

  let apiReviews = [];
  try {
    const res = await fetch("/api/community/reviews");
    if (res.ok) {
      apiReviews = await res.json();
    }
  } catch (e) { }

  let reviewsList = [];
  try {
    const raw = localStorage.getItem("userReviews") || localStorage.getItem("user_reviews");
    if (raw) reviewsList = JSON.parse(raw) || [];
  } catch (e) {
    reviewsList = [];
  }

  const seedReviews = [
    { id: "rev-seed-1", author: "ZoroFan42", rating: 5, category: "Order Issue", title: "Incredible print quality!", text: "The green contrast on the Zoro poster is even more vibrant in person. Paper feels very premium.", date: "July 10, 2026", isPublic: true, likes: 24 },
    { id: "rev-seed-2", author: "RigArtist", rating: 5, category: "3D Character Rig", title: "Perfect blender rig!", text: "Excellent topology and weight painting on the Suzens model.", date: "July 08, 2026", isPublic: true, likes: 15 },
    { id: "rev-seed-3", author: "BrushesPro", rating: 4, category: "Brushes & Textures", title: "Super clean brushes", text: "Nice digital painting brushes and template guidelines.", date: "July 05, 2026", isPublic: true, likes: 8 },
    { id: "rev-seed-4", author: "DevSora", rating: 5, category: "General Website", title: "Smooth website UI", text: "The donation page micro-animations are beautiful.", date: "June 29, 2026", isPublic: true, likes: 42 }
  ];

  const customReviews = reviewsList.filter(r => r && r.id && !r.id.startsWith("rev-seed-"));

  const reviewMap = new Map();
  [...apiReviews, ...customReviews, ...seedReviews].forEach(r => {
    if (r && r.id && !reviewMap.has(r.id)) {
      reviewMap.set(r.id, r);
    }
  });

  let allReviews = Array.from(reviewMap.values());

  const sortSelect = document.getElementById("feedback-sort-select");
  if (sortSelect) {
    const sortBy = sortSelect.value;
    allReviews.sort((a, b) => {
      if (sortBy === "newest") {
        return new Date(b.date || 0) - new Date(a.date || 0);
      } else if (sortBy === "oldest") {
        return new Date(a.date || 0) - new Date(b.date || 0);
      } else if (sortBy === "highest_rating") {
        return (b.rating || 0) - (a.rating || 0);
      } else if (sortBy === "lowest_rating") {
        return (a.rating || 0) - (b.rating || 0);
      }
      return 0;
    });
  }

  if (countBadge) countBadge.textContent = allReviews.length;
  if (feedbackCountBadge) feedbackCountBadge.textContent = allReviews.length;

  if (allReviews.length === 0) {
    const emptyRow = `<tr><td colspan="7" style="text-align: center; color: #94a3b8; padding: 24px;">No community feedback submitted yet.</td></tr>`;
    allTargetTbodies.forEach(tb => tb.innerHTML = emptyRow);
    return;
  }

  const rowsHtml = allReviews.map(r => {
    const stars = '★'.repeat(r.rating || 5);
    const author = r.author || r.user || 'Anonymous';
    const likes = r.likes || 0;

    return `
      <tr>
        <td>
          <div style="font-weight:700; color:#f8fafc;">${author}</div>
          ${r.email ? `<small style="color:#64748b;">${r.email}</small>` : ''}
        </td>
        <td>
          <div style="color:#eab308; font-size:0.85rem; margin-bottom:2px;">${stars} <span style="color:#94a3b8; font-size:0.78rem;">(${r.rating || 5}.0)</span></div>
          <strong style="color:#38bdf8; font-size:0.85rem;">${r.title || 'Review'}</strong>
        </td>
        <td>
          <span class="badge badge-type" style="display:inline-block; font-size:0.75rem;">${r.category || 'General'}</span>
        </td>
        <td>
          <div style="color:#e2e8f0; font-size:0.84rem; max-width:280px; line-height:1.35;" title="${r.text || ''}">${r.text || ''}</div>
        </td>
        <td>
          <span style="color:#94a3b8; font-size:0.82rem;">${r.date || 'Today'}</span>
        </td>
        <td>
          <span title="Likes Count" style="color:#ef4444; font-weight:700; display:inline-flex; align-items:center; gap:4px; font-size:0.88rem;">
            <i class="fa-solid fa-heart"></i> ${likes}
          </span>
        </td>
        <td>
          <button class="action-btn btn-delete" onclick="window.deleteAdminCommunityReview('${r.id}')" title="Delete Review"><i class="fa-solid fa-trash"></i> Delete</button>
        </td>
      </tr>
    `;
  }).join("");

  allTargetTbodies.forEach(tb => tb.innerHTML = rowsHtml);
}

window.deleteAdminCommunityReview = async function (reviewId) {
  if (!confirm("Are you sure you want to delete this community review?")) return;

  try {
    await fetch(`/api/community/reviews/${reviewId}`, {
      method: "DELETE"
    });
  } catch (e) { }

  try {
    let reviewsList = JSON.parse(localStorage.getItem("userReviews") || localStorage.getItem("user_reviews") || "[]");
    reviewsList = reviewsList.filter(r => r.id !== reviewId);
    localStorage.setItem("userReviews", JSON.stringify(reviewsList));
    localStorage.setItem("user_reviews", JSON.stringify(reviewsList));
  } catch (e) { }

  loadCommunityReviews();
};

window.addEventListener("storage", (e) => {
  if (e.key === "userReviews" || e.key === "user_reviews") {
    if (typeof loadCommunityReviews === "function") loadCommunityReviews();
  }
});

// ═══════════════════════════════════════════════════════════
//  TASKS CHECKLIST
// ═══════════════════════════════════════════════════════════
function initTaskList() {
  const taskList = document.getElementById("dashboard-tasks-list");
  const addTrigger = document.getElementById("task-add-trigger");
  const inputWrap = document.getElementById("task-input-wrapper");
  const submitBtn = document.getElementById("task-new-submit");
  const input = document.getElementById("task-new-title");

  const initialTasks = [
    { text: "Update Deadpool animation breakdown video render link", done: true },
    { text: "Add ₹100 First Login promo code validation rule to checkout backend", done: false },
    { text: "Review 3D Blender asset rig downloads for SenpaiWorks 2.0 ecosystem", done: false }
  ];

  function renderTasks() {
    if (!taskList) return;
    taskList.innerHTML = initialTasks.map((t, idx) => `
      <div class="task-item ${t.done ? 'task-done' : ''}">
        <input type="checkbox" ${t.done ? 'checked' : ''} onchange="toggleTask(${idx})">
        <span>${t.text}</span>
      </div>
    `).join("");
  }

  window.toggleTask = function (idx) {
    initialTasks[idx].done = !initialTasks[idx].done;
    renderTasks();
  };

  if (addTrigger && inputWrap) {
    addTrigger.addEventListener("click", () => {
      inputWrap.style.display = inputWrap.style.display === "none" ? "flex" : "none";
    });
  }

  if (submitBtn && input) {
    submitBtn.addEventListener("click", () => {
      const val = input.value.trim();
      if (val) {
        initialTasks.push({ text: val, done: false });
        input.value = "";
        inputWrap.style.display = "none";
        renderTasks();
      }
    });
  }

  renderTasks();
}

function initAccountSettings() { }
function initFilterBar() { }
function initTableSearch() {
  // ── Art Library Toolbar & Subtab Event Listeners ──
  const artSearch = document.getElementById("artwork-search");
  const artSearchBtn = document.getElementById("artwork-search-btn");
  const artSearchIconBtn = document.getElementById("art-search-icon-btn");

  const triggerArtSearch = () => {
    artCurrentPage = 1;
    loadArtworks();
  };

  if (artSearch) {
    artSearch.addEventListener("input", triggerArtSearch);
    artSearch.addEventListener("keydown", (e) => {
      if (e.key === "Enter") triggerArtSearch();
    });
  }
  if (artSearchBtn) artSearchBtn.addEventListener("click", triggerArtSearch);
  if (artSearchIconBtn) artSearchIconBtn.addEventListener("click", triggerArtSearch);

  const artSubtabs = document.querySelectorAll("#art-category-subtabs .table-subtab-pill");
  artSubtabs.forEach(btn => {
    btn.addEventListener("click", () => {
      artSubtabs.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      artCurrentCat = btn.getAttribute("data-cat") || "all";
      artCurrentPage = 1;
      loadArtworks();
    });
  });

  const artPageSizeSelect = document.getElementById("art-page-size");
  if (artPageSizeSelect) {
    artPageSizeSelect.addEventListener("change", () => {
      artPageSize = parseInt(artPageSizeSelect.value) || 10;
      artCurrentPage = 1;
      loadArtworks();
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

  // ── Customer Orders Toolbar & Subtab Event Listeners ──
  const ordersSearch = document.getElementById("orders-search");
  if (ordersSearch) ordersSearch.addEventListener("input", () => { ordersCurrentPage = 1; loadOrders(); });

  const ordersSubtabs = document.querySelectorAll("#orders-status-subtabs .table-subtab-pill");
  ordersSubtabs.forEach(btn => {
    btn.addEventListener("click", () => {
      ordersSubtabs.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      ordersCurrentStatus = btn.getAttribute("data-status") || "all";
      ordersCurrentPage = 1;
      loadOrders();
    });
  });

  const ordersPageSizeSelect = document.getElementById("orders-page-size");
  if (ordersPageSizeSelect) {
    ordersPageSizeSelect.addEventListener("change", () => {
      ordersPageSize = parseInt(ordersPageSizeSelect.value) || 10;
      ordersCurrentPage = 1;
      loadOrders();
    });
  }

  const ordersPrintBtn = document.getElementById("orders-print-btn");
  if (ordersPrintBtn) {
    ordersPrintBtn.addEventListener("click", () => window.printTableElement("orders-table", "SenpaiWorks - Customer Orders"));
  }

  const ordersExportBtn = document.getElementById("orders-export-btn");
  if (ordersExportBtn) {
    ordersExportBtn.addEventListener("click", () => {
      const headers = ["Order ID", "Product", "Delivery Time", "Payment Type", "Amount", "Status"];
      const rows = allOrders.map(o => [o.id, o.product, o.deliveryTime, o.pymType, o.amount, o.status]);
      window.exportTableCSV("senpaiworks_orders.csv", headers, rows);
    });
  }

  const ordersViewToggle = document.getElementById("orders-view-toggle");
  if (ordersViewToggle) {
    ordersViewToggle.addEventListener("click", () => {
      document.getElementById("orders-table")?.classList.toggle("compact-mode");
    });
  }

  const ordersSelectAll = document.getElementById("orders-select-all");
  if (ordersSelectAll) {
    ordersSelectAll.addEventListener("change", () => {
      document.querySelectorAll("#orders-list-body .tbl-checkbox").forEach(cb => cb.checked = ordersSelectAll.checked);
    });
  }

  const usersSearch = document.getElementById("users-search");
  if (usersSearch) {
    usersSearch.addEventListener("input", loadUsers);
  }
}

// ── Category Management Logic ─────────────────────────────
let allCategoriesList = [];

let draggedCategoryRowIndex = null;

function renderCategoryTableRows(listBody) {
  if (!listBody) return;
  if (allCategoriesList.length === 0) {
    listBody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 24px;">No categories found.</td></tr>`;
    return;
  }

  listBody.innerHTML = allCategoriesList.map((cat, idx) => `
    <tr draggable="true" class="cat-row-draggable" data-cat-id="${cat.id}" data-idx="${idx}" style="cursor: grab; transition: background 0.15s ease;">
      <td style="text-align: center;"><strong>${idx + 1}</strong></td>
      <td style="text-align: center; color: #64748b;">
        <i class="fa-solid fa-grip-lines drag-handle" style="cursor: grab;"></i>
      </td>
      <td><strong>${cat.name}</strong></td>
      <td><code>${cat.slug}</code></td>
      <td>${new Date(cat.createdAt).toLocaleDateString()}</td>
      <td>
        <button class="action-btn btn-delete" onclick="deleteCategory(${cat.id}, '${cat.name.replace(/'/g, "\\'")}')" title="Delete Category">
          <i class="fa-solid fa-trash"></i>
        </button>
      </td>
    </tr>
  `).join("");

  // Attach Drag & Drop Listeners to Category Rows
  const rows = listBody.querySelectorAll(".cat-row-draggable");
  rows.forEach(row => {
    row.addEventListener("dragstart", (e) => {
      draggedCategoryRowIndex = parseInt(row.getAttribute("data-idx"), 10);
      row.style.opacity = "0.4";
      row.style.background = "rgba(37, 99, 235, 0.1)";
      e.dataTransfer.effectAllowed = "move";
    });

    row.addEventListener("dragend", () => {
      row.style.opacity = "1";
      row.style.background = "";
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

      // Reorder array locally instantly
      const movedItem = allCategoriesList.splice(draggedCategoryRowIndex, 1)[0];
      allCategoriesList.splice(targetIndex, 0, movedItem);
      draggedCategoryRowIndex = null;

      // Re-render table & update dropdowns instantly
      renderCategoryTableRows(listBody);
      updateCategoryDropdownsAndPills();

      // Persist order to backend
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

  // Populate Add Artwork Category Select Dropdown
  if (artCatSelect) {
    const currentVal = artCatSelect.value;
    artCatSelect.innerHTML = allCategoriesList.map(cat => `
      <option value="${cat.slug}">${cat.name}</option>
    `).join("");
    if (currentVal && Array.from(artCatSelect.options).some(o => o.value === currentVal)) {
      artCatSelect.value = currentVal;
    }
  }

  // Populate Admin Art Subtabs Category Pills
  if (artCatSubtabs) {
    let subtabsHTML = `<button type="button" class="table-subtab-pill ${artCurrentCat === 'all' ? 'active' : ''}" data-cat="all">All Artworks</button>`;
    allCategoriesList.forEach(cat => {
      subtabsHTML += `<button type="button" class="table-subtab-pill ${artCurrentCat === cat.slug ? 'active' : ''}" data-cat="${cat.slug}">${cat.name}</button>`;
    });
    artCatSubtabs.innerHTML = subtabsHTML;

    const catPills = artCatSubtabs.querySelectorAll(".table-subtab-pill");
    catPills.forEach(pill => {
      pill.addEventListener("click", () => {
        catPills.forEach(p => p.classList.remove("active"));
        pill.classList.add("active");
        artCurrentCat = pill.getAttribute("data-cat");
        artCurrentPage = 1;
        loadArtworks();
      });
    });
  }
}

async function loadAdminCategories() {
  const listBody = document.getElementById("categories-list-body");

  try {
    const res = await fetch("/api/categories");
    if (!res.ok) return;
    allCategoriesList = await res.json();

    // 1. Render Categories Table in Admin
    renderCategoryTableRows(listBody);

    // 2. Populate Dropdowns & Pills
    updateCategoryDropdownsAndPills();

  } catch (err) {
    console.error("Error loading categories in admin:", err);
  }
}

async function initCategoryForm() {
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
        alert(`Category "${name}" created successfully!`);
        input.value = "";
        loadAdminCategories();
      } else {
        alert(data.error || "Failed to create category");
      }
    } catch (err) {
      console.error("Error creating category:", err);
      alert("Unable to connect to server.");
    }
  });
}

window.moveCategory = async function (id, direction) {
  try {
    const res = await fetch(`/api/categories/${id}/reorder`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ direction })
    });
    if (res.ok) {
      loadAdminCategories();
    } else {
      const data = await res.json();
      alert(data.error || "Failed to reorder category");
    }
  } catch (err) {
    console.error("Error reordering category:", err);
    alert("Unable to connect to server.");
  }
};

window.deleteCategory = async function (id, name) {
  if (!confirm(`Are you sure you want to delete category "${name}"?`)) return;
  try {
    const res = await fetch(`/api/categories/${id}`, {
      method: "DELETE"
    });
    if (res.ok) {
      alert(`Category "${name}" deleted successfully!`);
      loadAdminCategories();
    } else {
      const data = await res.json();
      alert(data.error || "Failed to delete category");
    }
  } catch (err) {
    console.error("Error deleting category:", err);
    alert("Unable to connect to server.");
  }
};

window.addEventListener("storage", (e) => {
  if (e.key === "userWishlist" || e.key === "product_wishlist_counts") {
    if (typeof adminProductsList !== "undefined" && typeof renderProductsTable === "function") {
      renderProductsTable(adminProductsList);
    }
  }
});

// ═══════════════════════════════════════════════════════════
// NOTIFICATIONS & BROADCASTS SYSTEM
// ═══════════════════════════════════════════════════════════

function getAdminTokenHeaders() {
  return {
    "Authorization": `Bearer ${activeAdminToken}`,
    "Content-Type": "application/json"
  };
}

window.loadAdminNotifications = async function() {
  await Promise.all([loadBroadcastHistory(), loadNotificationTriggers()]);
};

async function loadBroadcastHistory() {
  try {
    const res = await fetch('/api/admin/notifications/history', {
      headers: getAdminTokenHeaders()
    });
    if(!res.ok) return;
    const data = await res.json();
    const tbody = document.getElementById('broadcast-history-table');
    if(!tbody) return;
    
    document.getElementById('stat-total-broadcasts').innerText = data.history.length;
    
    let html = '';
    if(data.history.length === 0) {
      html = '<tr><td colspan="5" style="text-align: center; color: #64748b;">No broadcasts found.</td></tr>';
    } else {
      data.history.forEach(b => {
        let statusColor = '#94a3b8';
        if(b.status === 'sent') statusColor = '#22c55e';
        if(b.status === 'scheduled') statusColor = '#3b82f6';
        if(b.status === 'cancelled') statusColor = '#ef4444';
        
        const dateStr = new Date(b.sendAt).toLocaleString();
        
        let cancelBtn = b.status === 'scheduled' 
          ? `<button onclick="cancelBroadcast(${b.id})" class="btn-outline" style="padding:4px 8px; font-size:0.75rem; border-color:#ef4444; color:#ef4444;">Cancel</button>` 
          : '';

        html += `
          <tr>
            <td style="font-weight: 600;">${b.title}</td>
            <td><span class="badge" style="background:#f1f5f9; color:#475569; padding:4px 8px; border-radius:12px; font-size:0.75rem;">${b.category || 'Studio'}</span></td>
            <td><span style="background:#f1f5f9; padding:2px 8px; border-radius:12px; font-size:0.75rem;">${b.audience}</span></td>
            <td style="white-space:nowrap; font-size: 0.85rem;">${dateStr}</td>
            <td><span style="color: ${statusColor}; font-weight: 700; font-size: 0.8rem; text-transform: uppercase;">${b.status}</span></td>
            <td style="font-size: 0.85rem; color: #475569;">${b.readCount || 0} / ${b.totalCount || 0}</td>
            <td>${cancelBtn}</td>
          </tr>
        `;
      });
    }
    tbody.innerHTML = html;
  } catch(e) {
    console.error('Failed to load broadcast history', e);
  }
}

async function loadNotificationTriggers() {
  try {
    const res = await fetch('/api/admin/notifications/triggers', {
      headers: getAdminTokenHeaders()
    });
    if(!res.ok) return;
    const data = await res.json();
    const list = document.getElementById('triggers-list');
    if(!list) return;

    const availableTriggers = [
      { type: 'order_update', title: 'Order Status Update', desc: 'Fires when an admin changes an order status.' },
      { type: 'order_delivered', title: 'Order Delivered', desc: 'Fires when an order is marked as delivered.' },
      { type: 'post_reply', title: 'Post/Comment Reply', desc: 'Fires when someone replies to a user\'s post.' },
      { type: 'new_offer', title: 'New Promo Code/Offer', desc: 'Fires globally when a new coupon is published.' },
      { type: 'sale', title: 'Flash Sale Activated', desc: 'Fires globally when a sale event starts.' },
      { type: 'new_article', title: 'New News Article', desc: 'Fires globally when an article is published.' },
      { type: 'new_course', title: 'New Course Added', desc: 'Fires globally when a new course is added.' },
      { type: 'new_product', title: 'New Product Added', desc: 'Fires globally when a new product is added.' },
      { type: 'wishlist_restock', title: 'Wishlist Restock', desc: 'Fires to specific users when a wishlisted item restocks.' },
      { type: 'support_reply', title: 'Support Ticket Reply', desc: 'Fires when an admin replies to a support ticket.' }
    ];

    let activeCount = 0;
    
    let html = '';
    availableTriggers.forEach(t => {
      const dbTrigger = data.triggers.find(dt => dt.type === t.type);
      const isEnabled = dbTrigger ? dbTrigger.enabled : true;
      if(isEnabled) activeCount++;
      
      html += `
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 16px; border: 1px solid #e2e8f0; border-radius: 8px; background: #f8fafc;">
          <div>
            <div style="font-weight: 700; color: #0f172a; margin-bottom: 4px;">${t.title} <span style="font-size: 0.7rem; color: #94a3b8; font-weight: normal; font-family: monospace;">(${t.type})</span></div>
            <div style="font-size: 0.8rem; color: #64748b;">${t.desc}</div>
          </div>
          <label class="switch" style="position: relative; display: inline-block; width: 44px; height: 24px;">
            <input type="checkbox" onchange="toggleAutoTrigger('${t.type}', this.checked)" ${isEnabled ? 'checked' : ''} style="opacity: 0; width: 0; height: 0;">
            <span class="slider round" style="position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: ${isEnabled ? '#3b82f6' : '#cbd5e1'}; transition: .4s; border-radius: 24px;">
              <span style="position: absolute; height: 18px; width: 18px; left: ${isEnabled ? '22px' : '3px'}; bottom: 3px; background-color: white; transition: .4s; border-radius: 50%;"></span>
            </span>
          </label>
        </div>
      `;
    });
    
    list.innerHTML = html;
    document.getElementById('stat-active-triggers').innerText = `${activeCount} / ${availableTriggers.length}`;
  } catch(e) {
    console.error('Failed to load triggers', e);
  }
}

window.toggleAutoTrigger = async function(type, enabled) {
  try {
    await fetch(`/api/admin/notifications/triggers/${type}`, {
      method: 'PATCH',
      headers: getAdminTokenHeaders(),
      body: JSON.stringify({ enabled })
    });
    // Immediately redraw the sliders by re-fetching
    loadNotificationTriggers();
    showAdminToast(`Trigger '${type}' ${enabled ? 'enabled' : 'disabled'}`, 'success');
  } catch(e) {
    showAdminToast('Failed to update trigger', 'danger');
  }
};

window.openComposeBroadcastModal = function() {
  document.getElementById('compose-broadcast-modal').style.display = 'flex';
  document.getElementById('form-compose-broadcast').reset();
  document.getElementById('broadcast-email-group').style.display = 'none';
  document.getElementById('broadcast-schedule-group').style.display = 'none';
};

window.closeComposeBroadcastModal = function() {
  document.getElementById('compose-broadcast-modal').style.display = 'none';
};

document.getElementById('broadcast-audience').addEventListener('change', function(e) {
  document.getElementById('broadcast-email-group').style.display = e.target.value === 'specific' ? 'block' : 'none';
  if(e.target.value === 'specific') document.getElementById('broadcast-email').required = true;
  else document.getElementById('broadcast-email').required = false;
});

document.getElementById('form-compose-broadcast').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const payload = {
    title: document.getElementById('broadcast-title').value,
    message: document.getElementById('broadcast-message').value,
    icon: document.getElementById('broadcast-icon').value,
    link: document.getElementById('broadcast-link').value,
    audience: document.getElementById('broadcast-audience').value === 'specific' ? document.getElementById('broadcast-email').value : 'all',
    category: document.getElementById('broadcast-category') ? document.getElementById('broadcast-category').value : 'Studio',
  };
  
  const sendType = document.getElementById('broadcast-send-type').value;
  if(sendType === 'schedule') {
    const sendAt = document.getElementById('broadcast-send-at').value;
    if(!sendAt) return showAdminToast('Please provide a schedule date/time', 'danger');
    payload.sendAt = sendAt;
  }
  
  try {
    const res = await fetch('/api/admin/notifications/broadcast', {
      method: 'POST',
      headers: getAdminTokenHeaders(),
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if(res.ok && data.success) {
      showAdminToast('Broadcast created successfully!', 'success');
      closeComposeBroadcastModal();
      loadBroadcastHistory();
    } else {
      showAdminToast(data.error || 'Failed to create broadcast', 'danger');
    }
  } catch(err) {
    showAdminToast('Server error', 'danger');
  }
});

window.cancelBroadcast = async function(id) {
  if(!confirm('Are you sure you want to cancel this scheduled broadcast?')) return;
  try {
    const res = await fetch(`/api/admin/notifications/${id}`, {
      method: 'PATCH',
      headers: getAdminTokenHeaders(),
      body: JSON.stringify({ status: 'cancelled' })
    });
    if(res.ok) {
      showAdminToast('Broadcast cancelled', 'success');
      loadBroadcastHistory();
    }
  } catch(err) {
    showAdminToast('Failed to cancel broadcast', 'danger');
  }
};

// Hook into sidebar click to load data when Notifications tab is opened
document.addEventListener("DOMContentLoaded", () => {
  const notifLinks = document.querySelectorAll('.sidebar-link[data-tab="tab-notifications"]');
  notifLinks.forEach(l => l.addEventListener('click', () => loadAdminNotifications()));
});



