"use strict";

// ── State ──────────────────────────────────────────────
let allArtworks = [];
let allProducts = [];
let allOrders = [
  { id: "ORD-9842", customer: "Suhas H", email: "suhas@example.com", date: "2026-07-25", total: "₹2,499", payment: "Paid", status: "Delivered" },
  { id: "ORD-9841", customer: "Alex Mercer", email: "alex@example.com", date: "2026-07-24", total: "₹1,299", payment: "Paid", status: "Shipped" },
  { id: "ORD-9840", customer: "Rin Tohsaka", email: "rin@example.com", date: "2026-07-24", total: "₹999", payment: "Paid", status: "Processing" },
  { id: "ORD-9839", customer: "Ken Kaneki", email: "ken@example.com", date: "2026-07-23", total: "₹1,899", payment: "Paid", status: "Delivered" }
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
  initThemeToggle();
  initSidebarTabs();
  initInnerTabs();
  initMobileSidebar();
  initAccountSettings();
  initTaskList();
  
  loadDashboardStats();
  loadArtworks();
  loadProducts();
  loadOrders();
  loadMotionAssets();
  loadNewsArticles();
  loadCoupons();
  loadCommunityReviews();
  loadDesignPollSuggestions();
  
  initFilterBar();
  initTableSearch();
  initEditModal();
});

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
//  SIDEBAR TAB TOGGLING
// ═══════════════════════════════════════════════════════════
function initSidebarTabs() {
  const sidebarLinks = document.querySelectorAll(".sidebar-link");
  const subpages = document.querySelectorAll(".admin-subpage");
  const pageTitle = document.getElementById("page-title");

  sidebarLinks.forEach(link => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      
      sidebarLinks.forEach(l => l.classList.remove("active"));
      subpages.forEach(p => p.classList.remove("active"));
      
      link.classList.add("active");
      
      const targetTab = link.getAttribute("data-tab");
      const targetPage = document.getElementById(targetTab);
      if (targetPage) {
        targetPage.classList.add("active");
      }
      
      const labelText = link.querySelector("span").textContent;
      if (pageTitle) {
        pageTitle.textContent = labelText;
      }

      const sidebar = document.querySelector(".admin-sidebar");
      if (sidebar) {
        sidebar.classList.remove("active");
      }
    });
  });

  const settingsBtn = document.getElementById("sidebar-btn-settings");
  if (settingsBtn) {
    settingsBtn.addEventListener("click", () => {
      const accountLink = document.querySelector('.sidebar-link[data-tab="tab-account"]');
      if (accountLink) accountLink.click();
    });
  }

  const logoutBtn = document.getElementById("sidebar-btn-logout");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      if (confirm("Are you sure you want to sign out?")) {
        localStorage.removeItem("currentUser");
        window.location.href = "home.html";
      }
    });
  }
}

// ═══════════════════════════════════════════════════════════
//  INNER SUBTABS TOGGLING
// ═══════════════════════════════════════════════════════════
function initInnerTabs() {
  const innerBtns = document.querySelectorAll(".inner-tab-btn");
  innerBtns.forEach(btn => {
    btn.addEventListener("click", () => {
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
//  DATA MANAGEMENT (PRODUCTS, ORDERS, ARTWORKS, COUPONS, NEWS)
// ═══════════════════════════════════════════════════════════
function loadProducts() {
  const tbody = document.getElementById("products-list-body");
  if (!tbody) return;

  const defaultProducts = [
    { id: "itachi-black-colored", name: "Itachi Crow Genjutsu Graphic Tee", price: "₹999", cat: "Merchandise", img: "assets/Store/Tshirts/Colored itachi tshirts/itachi_black_tshirt_colored.jpg" },
    { id: "zoro-green-colored", name: "Roronoa Zoro Three-Sword Style Tee", price: "₹1,099", cat: "Merchandise", img: "assets/Store/Tshirts/colored Zoro tshirts/zoro_colored_green_tshirt.jpg" },
    { id: "kaneki-black-colored", name: "Kaneki Ken Tokyo Ghoul Anime Tee", price: "₹999", cat: "Merchandise", img: "assets/Store/Tshirts/Colored kaneki tshirts/kaneki_black_tshirt_colored.jpg" }
  ];

  tbody.innerHTML = defaultProducts.map(p => `
    <tr>
      <td><img src="${p.img}" alt="${p.name}" class="table-thumb"></td>
      <td><strong>${p.name}</strong></td>
      <td><code>${p.id}</code></td>
      <td>${p.price}</td>
      <td>${p.cat}</td>
      <td>
        <button class="action-btn btn-edit" onclick="alert('Edit product: ${p.name}')"><i class="fa-solid fa-pen"></i></button>
        <button class="action-btn btn-delete" onclick="alert('Delete product')"><i class="fa-solid fa-trash"></i></button>
      </td>
    </tr>
  `).join("");
}

function loadOrders() {
  const tbody = document.getElementById("orders-list-body");
  if (!tbody) return;

  tbody.innerHTML = allOrders.map(o => `
    <tr>
      <td><code>${o.id}</code></td>
      <td><strong>${o.customer}</strong><br><small class="text-subtle">${o.email}</small></td>
      <td>${o.date}</td>
      <td><strong>${o.total}</strong></td>
      <td><span class="status-pill status-paid">${o.payment}</span></td>
      <td><span class="status-pill status-shipped">${o.status}</span></td>
      <td>
        <button class="action-btn btn-edit" onclick="alert('View order details for ${o.id}')"><i class="fa-solid fa-eye"></i></button>
      </td>
    </tr>
  `).join("");
}

function loadArtworks() {
  const tbody = document.getElementById("artworks-list-body");
  if (!tbody) return;

  const defaultArtworks = [
    { char: "Kaori Miyazono", source: "Your Lie in April", cat: "Digital Portrait", img: "https://res.cloudinary.com/dmzchsqms/image/upload/f_auto,q_auto/w_600/v1757630821/black_kaori_copy_csr9qi.webp" },
    { char: "Deadpool", source: "Marvel Fan Animation", cat: "Insane Artwork", img: "https://res.cloudinary.com/dmzchsqms/image/upload/f_auto,q_auto/w_600/v1757630827/deadpool_poster_krntp0.webp" }
  ];

  tbody.innerHTML = defaultArtworks.map(a => `
    <tr>
      <td><img src="${a.img}" alt="${a.char}" class="table-thumb"></td>
      <td><strong>${a.char}</strong></td>
      <td>${a.source}</td>
      <td>${a.cat}</td>
      <td>
        <button class="action-btn btn-edit" onclick="alert('Edit artwork: ${a.char}')"><i class="fa-solid fa-pen"></i></button>
        <button class="action-btn btn-delete" onclick="alert('Delete artwork')"><i class="fa-solid fa-trash"></i></button>
      </td>
    </tr>
  `).join("");
}

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

function loadCommunityReviews() {
  const tbody = document.getElementById("community-list-body");
  if (!tbody) return;

  const defaultReviews = [
    { id: "rev_def_1", user: "Aarav Sharma", rating: 5, title: "Amazing quality", text: "The Itachi oversized graphic tee fabric quality is top-notch! Fast shipping.", productName: "Itachi Crow Genjutsu Graphic Tee", date: "July 24, 2026", status: "Published" },
    { id: "rev_def_2", user: "Maya Lin", rating: 5, title: "Great 3D Rig", text: "The Blender toon shader node setup saved me weeks of NPR rendering tweaking.", productName: "Blender Toon Shader Node Pack", date: "July 22, 2026", status: "Published" }
  ];

  let userReviews = [];
  try {
    const raw = localStorage.getItem("site_master_reviews_log");
    if (raw) userReviews = JSON.parse(raw);
  } catch(e) {}

  const allReviews = [...userReviews, ...defaultReviews];

  if (allReviews.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: #888; padding: 20px;">No customer reviews recorded yet.</td></tr>`;
    return;
  }

  tbody.innerHTML = allReviews.map(r => {
    const starCount = r.rating || 5;
    const starsMarkup = "★".repeat(starCount) + "☆".repeat(5 - starCount);
    return `
      <tr>
        <td><strong>${r.user || "Verified Customer"}</strong></td>
        <td><span class="rating-stars" style="color: #f59e0b; font-weight: bold;">${starsMarkup} (${starCount}.0)</span></td>
        <td>
          <strong>${r.title || ""}</strong><br>
          <span style="font-size: 0.85rem; color: #888;">"${r.text || ""}"</span>
        </td>
        <td><span class="status-pill status-active" style="background: rgba(2, 132, 199, 0.1); color: #0284c7; border: 1px solid rgba(2, 132, 199, 0.2);">${r.productName || r.productId || "Store Product"}</span></td>
        <td><small style="color: #888;">${r.date || "Recent"}</small></td>
        <td>
          <button class="action-btn btn-delete" onclick="deleteAdminReview('${r.id}')" title="Delete Review"><i class="fa-solid fa-trash"></i></button>
        </td>
      </tr>
    `;
  }).join("");
}

window.deleteAdminReview = function(revId) {
  if (!confirm("Are you sure you want to remove this review?")) return;
  try {
    const raw = localStorage.getItem("site_master_reviews_log");
    if (raw) {
      let list = JSON.parse(raw);
      list = list.filter(r => r.id !== revId);
      localStorage.setItem("site_master_reviews_log", JSON.stringify(list));
    }
  } catch(e) {}
  loadCommunityReviews();
};

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
  } catch(e) {}

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

window.toggleAdminPollStatus = function(pollId) {
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
  } catch(e) {}
  loadDesignPollSuggestions();
};

window.deleteAdminPollSuggestion = function(pollId) {
  if (!confirm("Remove this design suggestion?")) return;
  try {
    const raw = localStorage.getItem("site_design_poll_suggestions");
    if (raw) {
      let list = JSON.parse(raw);
      list = list.filter(p => p.id !== pollId);
      localStorage.setItem("site_design_poll_suggestions", JSON.stringify(list));
    }
  } catch(e) {}
  loadDesignPollSuggestions();
};

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

  window.toggleTask = function(idx) {
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

function initAccountSettings() {}
function initFilterBar() {}
function initTableSearch() {}
function initEditModal() {}
