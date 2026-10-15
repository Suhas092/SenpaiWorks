/**
 * SenpaiWorks Admin Console - Dashboard & Analytics Module
 * scripts/admin/admin-dashboard.js
 */

let timelineChart = null;
let categoryChart = null;

// ── Dashboard Statistics & Activity Loader ────────────────
window.loadDashboardStats = function () {
  renderRecentActivity();

  fetch("/api/donate/stats")
    .then(res => res.ok ? res.json() : null)
    .then(data => {
      if (data && data.success) {
        const statDonations = document.getElementById("stat-donations");
        const statDonationsTrend = document.getElementById("stat-donations-trend");
        if (statDonations) {
          statDonations.textContent = '$' + (data.totalUsd || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
        }
        if (statDonationsTrend) {
          statDonationsTrend.innerHTML = '<i class="fa-solid fa-heart"></i> ' + (data.donorCount || 0) + ' donors';
        }
      }
    })
    .catch(err => console.warn("Could not fetch donation stats for dashboard:", err));

  // Fetch real dashboard stats from backend
  fetch("/api/admin/dashboard/stats", {
    headers: window.getAdminTokenHeaders(),
    credentials: "include"
  })
    .then(res => {
      if (window.handleAdminResponse) window.handleAdminResponse(res);
      return res.ok ? res.json() : null;
    })
    .then(data => {
      if (!data || !data.success) return;

      // Update KPI stat counters with real database totals
      if (data.kpis) {
        const statArtworks = document.getElementById("stat-artworks");
        const statProducts = document.getElementById("stat-products");
        const statRevenue = document.getElementById("stat-revenue");

        if (statArtworks && data.kpis.totalArtworks !== undefined) {
          statArtworks.textContent = data.kpis.totalArtworks.toLocaleString();
        }
        if (statProducts && data.kpis.totalProducts !== undefined) {
          statProducts.textContent = data.kpis.totalProducts.toLocaleString();
        }
        if (statRevenue && data.kpis.totalRevenue !== undefined) {
          statRevenue.textContent = '₹' + Math.round(data.kpis.totalRevenue).toLocaleString();
        }
      }

      // Update Timeline (Line) Chart with real 7-day revenue
      if (data.timeline && typeof Chart !== "undefined") {
        const ctxTimeline = document.getElementById("chart-timeline");
        if (ctxTimeline) {
          const chartLabels = data.timeline.labels || [];
          const chartData = data.timeline.data || [];

          if (timelineChart) {
            timelineChart.data.labels = chartLabels;
            timelineChart.data.datasets[0].data = chartData;
            timelineChart.update();
          } else {
            timelineChart = new Chart(ctxTimeline, {
              type: "line",
              data: {
                labels: chartLabels,
                datasets: [{
                  label: "Sales Revenue (₹)",
                  data: chartData,
                  borderColor: "#2563eb",
                  backgroundColor: "rgba(37, 99, 235, 0.15)",
                  fill: true,
                  tension: 0.4
                }]
              },
              options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      callback: function (val) {
                        return '₹' + val.toLocaleString();
                      }
                    }
                  }
                }
              }
            });
          }
        }
      }

      // Update Category Breakdown (Doughnut) Chart with real category distribution
      if (data.categories && typeof Chart !== "undefined") {
        const catSubtitle = document.getElementById("category-chart-subtitle");
        if (catSubtitle && data.categories.productGmv !== undefined) {
          catSubtitle.textContent = '₹' + Math.round(data.categories.productGmv).toLocaleString() + ' Gross Sales (GMV)';
        }

        const ctxCat = document.getElementById("chart-categories");
        if (ctxCat) {
          const catLabels = data.categories.labels || ["No Sales"];
          const catData = data.categories.data || [0];
          const colorPalette = ["#2563eb", "#8b5cf6", "#10b981", "#f59e0b", "#ec4899", "#06b6d4", "#f97316", "#64748b"];
          const bgColors = catLabels.map((_, i) => colorPalette[i % colorPalette.length]);

          if (categoryChart) {
            categoryChart.data.labels = catLabels;
            categoryChart.data.datasets[0].data = catData;
            categoryChart.data.datasets[0].backgroundColor = bgColors;
            categoryChart.update();
          } else {
            categoryChart = new Chart(ctxCat, {
              type: "doughnut",
              data: {
                labels: catLabels,
                datasets: [{
                  data: catData,
                  backgroundColor: bgColors
                }]
              },
              options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'top',
                    labels: {
                      boxWidth: 12,
                      padding: 12,
                      font: { size: 12 }
                    }
                  },
                  tooltip: {
                    callbacks: {
                      label: function (ctx) {
                        const val = ctx.raw || 0;
                        const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
                        const pct = total > 0 ? ((val / total) * 100).toFixed(1) : 0;
                        return ` ${ctx.label}: ₹${val.toLocaleString()} (${pct}%)`;
                      },
                      afterBody: function () {
                        return ['\nNote: Gross merchandise sales before order-level shipping & discounts'];
                      }
                    }
                  }
                }
              }
            });
          }
        }
      }
    })
    .catch(err => console.warn("Failed to fetch live admin dashboard stats:", err));

  // Start real-time polling after initial stats load
  setTimeout(() => {
    if (typeof window.startRealtimeMetricsPolling === "function") {
      window.startRealtimeMetricsPolling();
      console.log("[Dashboard] Real-time metrics polling started");
    }
  }, 1000);
};

function renderRecentActivity() {
  const tbody = document.getElementById("recent-activity-body");
  if (!tbody) return;

  const activities = [
    { img: "https://pub-fcaa22b002b74b8a93604c85b4342984.r2.dev/brand/all_characters_yvk9ik.webp", title: "SenpaiWorks 2.0 Release", type: "Article", cat: "Platform", status: "Published" },
    { img: "https://pub-fcaa22b002b74b8a93604c85b4342984.r2.dev/artworks/deadpool_poster_krntp0.webp", title: "Itachi Graphic Oversized Tee", type: "Product", cat: "Merchandise", status: "Active" },
    { img: "https://pub-fcaa22b002b74b8a93604c85b4342984.r2.dev/avatars/rem_happy_evhesz.webp", title: "Kaori Miyazono Portrait", type: "Artwork", cat: "Digital Portrait", status: "Featured" }
  ];

  tbody.innerHTML = activities.map(act => 
    '<tr>' +
      '<td><img src="' + act.img + '" alt="' + window.escapeHtml(act.title) + '" class="table-thumb"></td>' +
      '<td><strong>' + window.escapeHtml(act.title) + '</strong></td>' +
      '<td><span class="badge badge-type">' + window.escapeHtml(act.type) + '</span></td>' +
      '<td>' + window.escapeHtml(act.cat) + '</td>' +
      '<td><span class="status-pill status-active">' + window.escapeHtml(act.status) + '</span></td>' +
    '</tr>'
  ).join("");
}

function initDashboardCharts() {
  // Chart initialization is now driven dynamically by real data in loadDashboardStats
}

// ── Studio Tasks Checklist Widget ─────────────────────────
window.initTaskList = async function () {
  const taskList = document.getElementById("dashboard-tasks-list");
  const addTrigger = document.getElementById("task-add-trigger");
  const inputWrap = document.getElementById("task-input-wrapper");
  const submitBtn = document.getElementById("task-new-submit");
  const input = document.getElementById("task-new-title");

  let storedTasks = [];
  try {
    const res = await fetch("/api/admin/tasks", { headers: window.getAdminTokenHeaders() });
    if (window.handleAdminResponse) window.handleAdminResponse(res);
    if (res.ok) storedTasks = await res.json();
  } catch (e) { }

  function renderTasks() {
    if (!taskList) return;
    taskList.innerHTML = storedTasks.map((t, idx) => 
      '<div class="task-item ' + (t.done ? 'task-done' : '') + '">' +
        '<input type="checkbox" ' + (t.done ? 'checked' : '') + ' onchange="window.toggleTask(' + t.id + ')">' +
        '<span>' + window.escapeHtml(t.text) + '</span>' +
      '</div>'
    ).join("");
  }

  window.toggleTask = async function (id) {
    try {
      const res = await fetch("/api/admin/tasks/" + id + "/toggle", {
        method: "PATCH",
        headers: window.getAdminTokenHeaders()
      });
      if (window.handleAdminResponse) window.handleAdminResponse(res);
      if (res.ok) {
        window.showAdminToast("Task toggled", "success");
        const task = storedTasks.find(t => t.id === id);
        if(task) task.done = !task.done;
        renderTasks();
      }
    } catch(e) {
      console.error(e);
    }
  };

  if (addTrigger && inputWrap) {
    addTrigger.addEventListener("click", () => {
      inputWrap.style.display = inputWrap.style.display === "none" ? "flex" : "none";
    });
  }

  if (submitBtn && input) {
    submitBtn.addEventListener("click", async () => {
      const val = input.value.trim();
      if (val) {
        try {
          const res = await fetch("/api/admin/tasks", {
            method: "POST",
            headers: window.getAdminTokenHeaders(),
            body: JSON.stringify({ text: val })
          });
          if (window.handleAdminResponse) window.handleAdminResponse(res);
          if (res.ok) {
            const newTask = await res.json();
            window.showAdminToast("Added task", "success");
            storedTasks.push(newTask);
            input.value = "";
            inputWrap.style.display = "none";
            renderTasks();
          }
        } catch(e) {
          console.error(e);
        }
      }
    });
  }

  renderTasks();
};

// ────────────────────────────────────────
// REAL-TIME DASHBOARD METRICS POLLING
// ────────────────────────────────────────
window.stopRealtimeMetricsPolling = function () {
  if (window.dashboardPollingInterval) {
    clearInterval(window.dashboardPollingInterval);
    window.dashboardPollingInterval = null;
  }
};

window.startRealtimeMetricsPolling = function () {
  window.stopRealtimeMetricsPolling();

  // Poll every 15 seconds for live metrics
  window.dashboardPollingInterval = setInterval(async () => {
    try {
      // httpOnly cookie is automatically sent; no manual Authorization header needed
      const res = await fetch("/api/admin/metrics", {
        headers: { "Content-Type": "application/json" },
        credentials: "include" // Ensure cookies are sent
      });

      if (!res.ok) {
        return;
      }
      
      const data = await res.json();

      if (!data.success || !data.metrics) {
        return;
      }

      const { metrics } = data;

      // Update KPI Stat Cards
      const statArtworks = document.getElementById("stat-artworks");
      const statArtworksTrend = document.getElementById("stat-artworks-trend");
      if (statArtworks && metrics.totalArtworks !== undefined) {
        statArtworks.textContent = metrics.totalArtworks.toLocaleString();
      }
      if (statArtworksTrend && metrics.artworksTrend !== undefined) {
        const trendDir = metrics.artworksTrend >= 0 ? 'up' : 'down';
        statArtworksTrend.innerHTML = `<i class="fa-solid fa-arrow-trend-${trendDir}"></i> ${metrics.artworksTrend > 0 ? '+' : ''}${metrics.artworksTrend}%`;
      }

      const statProducts = document.getElementById("stat-products");
      const statProductsTrend = document.getElementById("stat-products-trend");
      if (statProducts && metrics.totalProducts !== undefined) {
        statProducts.textContent = metrics.totalProducts.toLocaleString();
      }
      if (statProductsTrend && metrics.productsTrend !== undefined) {
        const trendDir = metrics.productsTrend >= 0 ? 'up' : 'down';
        statProductsTrend.innerHTML = `<i class="fa-solid fa-arrow-trend-${trendDir}"></i> ${metrics.productsTrend > 0 ? '+' : ''}${metrics.productsTrend}%`;
      }

      const statRevenue = document.getElementById("stat-revenue");
      const statRevenueTrend = document.getElementById("stat-revenue-trend");
      if (statRevenue && metrics.totalRevenue !== undefined) {
        statRevenue.textContent = '₹' + Math.round(metrics.totalRevenue).toLocaleString('en-IN');
      }
      if (statRevenueTrend && metrics.revenueTrend !== undefined) {
        const trendDir = metrics.revenueTrend >= 0 ? 'up' : 'down';
        statRevenueTrend.innerHTML = `<i class="fa-solid fa-arrow-trend-${trendDir}"></i> ${metrics.revenueTrend > 0 ? '+' : ''}${metrics.revenueTrend}%`;
      }

      const statViews = document.getElementById("stat-views");
      const statViewsTrend = document.getElementById("stat-views-trend");
      if (statViews && metrics.monthlyViews !== undefined) {
        statViews.textContent = metrics.monthlyViews.toLocaleString();
      }
      if (statViewsTrend && metrics.viewsTrend !== undefined) {
        const trendDir = metrics.viewsTrend >= 0 ? 'up' : 'down';
        statViewsTrend.innerHTML = `<i class="fa-solid fa-arrow-trend-${trendDir}"></i> ${metrics.viewsTrend > 0 ? '+' : ''}${metrics.viewsTrend}%`;
      }

      // Update 7-Day Revenue Chart
      if (window.timelineChart && metrics.sevenDayRevenue && metrics.sevenDayRevenue.length > 0) {
        const dates = metrics.sevenDayRevenue.map(d => d.date);
        const revenues = metrics.sevenDayRevenue.map(d => (d.revenue / 100000).toFixed(2)); // Convert to lakhs
        
        window.timelineChart.data.labels = dates;
        window.timelineChart.data.datasets[0].data = revenues;
        window.timelineChart.update();
      }

      // Update Category Chart
      if (window.categoryChart && metrics.salesByCategory && metrics.salesByCategory.length > 0) {
        const labels = metrics.salesByCategory.map(cat => cat.category || 'Other');
        const data = metrics.salesByCategory.map(cat => (cat._sum && cat._sum.price) ? cat._sum.price : 0);
        const colors = [
          '#3b82f6', '#a855f7', '#10b981',
          '#f59e0b', '#ef4444', '#06b6d4',
          '#ec4899', '#14b8a6', '#f97316', '#8b5cf6'
        ];

        window.categoryChart.data.labels = labels;
        window.categoryChart.data.datasets[0].data = data;
        window.categoryChart.data.datasets[0].backgroundColor = colors.slice(0, labels.length);
        window.categoryChart.update();
      }

      // Update GMV subtitle with total
      if (metrics.salesByCategory && metrics.salesByCategory.length > 0) {
        const totalGMV = metrics.salesByCategory.reduce((sum, cat) => sum + ((cat._sum && cat._sum.price) ? cat._sum.price : 0), 0);
        const gmvSubtitle = document.getElementById("category-chart-subtitle");
        if (gmvSubtitle) {
          gmvSubtitle.textContent = `₹${Math.round(totalGMV).toLocaleString('en-IN')} Gross Merchandise Value (GMV)`;
        }
      }

    } catch (err) {
      console.warn("[Dashboard Polling] Error fetching real-time metrics:", err);
    }
  }, 15000);
};
