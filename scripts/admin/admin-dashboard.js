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
    headers: window.getAdminTokenHeaders()
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
