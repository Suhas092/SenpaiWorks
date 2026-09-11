/**
 * scripts/admin/admin-reviews.js
 * Admin Moderation & Catalog Health for Customer Product Reviews
 */

"use strict";

let adminReviewsSearchDebounce = null;
let currentReviewsSubtab = "reviews-moderation";

document.addEventListener("DOMContentLoaded", () => {
  // Listen for sidebar link click to Product Reviews
  document.querySelectorAll(".sidebar-link").forEach(link => {
    link.addEventListener("click", () => {
      if (link.getAttribute("data-tab") === "tab-reviews") {
        loadAdminReviewsModule();
      }
    });
  });
});

window.loadAdminReviewsModule = function () {
  // Always default to Moderation Queue (Reported Reviews)
  switchReviewsSubtab(currentReviewsSubtab || "reviews-moderation");
};

window.switchReviewsSubtab = function (subtabId) {
  currentReviewsSubtab = subtabId;
  const parentSubpage = document.getElementById("tab-reviews");
  if (!parentSubpage) return;

  const btns = parentSubpage.querySelectorAll(".inner-tab-btn");
  const contents = parentSubpage.querySelectorAll(".inner-tab-content");

  btns.forEach(btn => {
    if (btn.getAttribute("data-subtab") === subtabId) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  });

  contents.forEach(content => {
    if (content.id === subtabId) {
      content.classList.add("active");
    } else {
      content.classList.remove("active");
    }
  });

  if (subtabId === "reviews-moderation") {
    loadReportedModerationQueue();
  } else if (subtabId === "reviews-health") {
    loadProductHealthOverview();
  } else if (subtabId === "reviews-all") {
    loadAllAdminReviews();
  }
};

function getAdminFetchHeaders() {
  const headers = window.getAdminTokenHeaders ? window.getAdminTokenHeaders() : { "Content-Type": "application/json" };
  const token = localStorage.getItem("adminToken") || sessionStorage.getItem("adminToken");
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

// ── 1. MODERATION QUEUE (REPORTED REVIEWS ONLY) ────────────────────────
window.loadReportedModerationQueue = async function () {
  const tbody = document.getElementById("admin-reported-reviews-table-body");
  const badgeCount = document.getElementById("reviews-reported-badge-count");
  if (!tbody) return;

  tbody.innerHTML = `
    <tr>
      <td colspan="8" style="text-align: center; padding: 40px; color: var(--text-secondary);">
        <i class="fa-solid fa-spinner fa-spin" style="font-size: 1.5rem; margin-bottom: 8px; color: #ef4444;"></i>
        <p>Checking moderation queue...</p>
      </td>
    </tr>
  `;

  try {
    const res = await fetch("/api/admin/reviews?reportedOnly=true&limit=100", {
      credentials: "include",
      headers: getAdminFetchHeaders()
    });

    if (window.handleAdminResponse) window.handleAdminResponse(res);

    if (!res.ok) {
      if (res.status === 401) {
        tbody.innerHTML = `
          <tr>
            <td colspan="8" style="text-align: center; padding: 30px; color: #ef4444;">
              Unauthorized: Please sign in as administrator.
            </td>
          </tr>
        `;
        return;
      }
      throw new Error(`Error ${res.status}: Failed to fetch moderation queue.`);
    }

    const data = await res.json();
    const reviews = data.reviews || [];
    const count = reviews.length;

    if (badgeCount) {
      if (count > 0) {
        badgeCount.textContent = `${count} Action Required`;
        badgeCount.style.display = "inline-block";
      } else {
        badgeCount.textContent = "0";
        badgeCount.style.display = "none";
      }
    }

    if (count === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" style="text-align: center; padding: 48px 20px; color: var(--text-secondary);">
            <i class="fa-solid fa-circle-check" style="font-size: 2.5rem; color: #10b981; margin-bottom: 12px; opacity: 0.8;"></i>
            <h4 style="font-size: 1.1rem; font-weight: 700; color: var(--text-primary); margin-bottom: 6px;">All Clear! Moderation Queue Is Empty</h4>
            <p style="font-size: 0.88rem; color: var(--text-secondary); max-width: 440px; margin: 0 auto;">No customer-reported reviews currently require admin intervention.</p>
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = reviews.map(rev => {
      const prod = rev.product || {};
      const user = rev.user || {};
      const prodName = prod.name || rev.productId;
      const userName = user.name || user.username || user.email || `User #${rev.userId}`;
      const isPublished = rev.status === "Published";
      const formattedDate = new Date(rev.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      
      const safeTitle = (rev.title || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      const safeText = (rev.text || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

      const statusBadge = isPublished
        ? `<span class="badge badge-success" style="background: rgba(16, 185, 129, 0.15); color: #10b981; padding: 4px 8px; border-radius: 4px; font-weight: 700; font-size: 0.75rem;">Published</span>`
        : `<span class="badge badge-danger" style="background: rgba(239, 68, 68, 0.15); color: #ef4444; padding: 4px 8px; border-radius: 4px; font-weight: 700; font-size: 0.75rem;">Hidden</span>`;

      const reportsList = (rev.reports || []).map(rep => {
        const detailSnippet = rep.details ? `<div style="font-size: 0.72rem; color: var(--text-secondary); margin-top: 2px;">"${rep.details}"</div>` : '';
        return `
          <div style="background: rgba(239, 68, 68, 0.08); border-left: 3px solid #ef4444; padding: 4px 8px; border-radius: 0 4px 4px 0; margin-bottom: 4px;">
            <div style="font-size: 0.76rem; font-weight: 700; color: #ef4444;"><i class="fa-solid fa-flag"></i> ${rep.reason}</div>
            ${detailSnippet}
          </div>
        `;
      }).join("") || `<span style="background: rgba(239, 68, 68, 0.15); color: #ef4444; font-weight: 700; padding: 2px 8px; border-radius: 12px; font-size: 0.75rem;"><i class="fa-solid fa-flag"></i> ${rev.reportCount} Report${rev.reportCount === 1 ? '' : 's'}</span>`;

      return `
        <tr id="admin-reported-row-${rev.id}">
          <td style="font-weight: 600;">
            <a href="store-detail.html?id=${encodeURIComponent(rev.productId)}" target="_blank" style="color: var(--text-primary); text-decoration: none;">
              ${prodName}
            </a>
            <div style="font-size: 0.72rem; color: #64748b;">ID: ${rev.productId}</div>
          </td>
          <td>
            <div style="font-weight: 600; color: var(--text-primary);">${userName}</div>
            <div style="font-size: 0.72rem; color: #64748b;">${user.email || ''}</div>
          </td>
          <td>
            <span style="font-weight: 700; color: #f59e0b; display: inline-flex; align-items: center; gap: 4px;">
              <i class="fa-solid fa-star"></i> ${rev.rating}.0
            </span>
          </td>
          <td style="max-width: 260px;">
            <div style="font-weight: 700; color: var(--text-primary); margin-bottom: 2px;">${safeTitle}</div>
            <div style="font-size: 0.82rem; color: var(--text-secondary); line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;" title="${safeText}">
              ${safeText}
            </div>
          </td>
          <td style="min-width: 180px;">
            ${reportsList}
          </td>
          <td>${statusBadge}</td>
          <td style="color: var(--text-secondary); font-size: 0.8rem; white-space: nowrap;">${formattedDate}</td>
          <td style="text-align: right; white-space: nowrap;">
            <button onclick="toggleAdminReviewStatus(${rev.id}, '${isPublished ? 'Hidden' : 'Published'}', true)" class="action-btn" title="${isPublished ? 'Hide Review' : 'Publish Review'}" style="margin-right: 6px; background: ${isPublished ? '#eab308' : '#10b981'}; color: #fff; border: none; padding: 6px 10px; border-radius: 6px; cursor: pointer; font-size: 0.78rem; font-weight: 600;">
              <i class="fa-solid ${isPublished ? 'fa-eye-slash' : 'fa-eye'}"></i> ${isPublished ? 'Hide' : 'Unhide'}
            </button>
            <button onclick="deleteAdminReview(${rev.id}, true)" class="action-btn" title="Delete Review" style="background: #ef4444; color: #fff; border: none; padding: 6px 10px; border-radius: 6px; cursor: pointer; font-size: 0.78rem; font-weight: 600;">
              <i class="fa-solid fa-trash"></i> Delete
            </button>
          </td>
        </tr>
      `;
    }).join("");
  } catch (err) {
    console.error("Error loading moderation queue:", err);
    tbody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align: center; padding: 30px; color: #ef4444;">
          Failed to load moderation queue. Please refresh.
        </td>
      </tr>
    `;
  }
};

// ── 2. CATALOG RATINGS HEALTH OVERVIEW (LOWEST RATING FIRST) ─────────
window.loadProductHealthOverview = async function () {
  const tbody = document.getElementById("admin-product-health-table-body");
  if (!tbody) return;

  tbody.innerHTML = `
    <tr>
      <td colspan="6" style="text-align: center; padding: 40px; color: var(--text-secondary);">
        <i class="fa-solid fa-spinner fa-spin" style="font-size: 1.5rem; margin-bottom: 8px; color: #3b82f6;"></i>
        <p>Loading catalog product health...</p>
      </td>
    </tr>
  `;

  try {
    const res = await fetch("/api/admin/reviews/product-health", {
      credentials: "include",
      headers: getAdminFetchHeaders()
    });

    if (window.handleAdminResponse) window.handleAdminResponse(res);

    if (!res.ok) {
      throw new Error(`Error ${res.status}: Failed to fetch product ratings health.`);
    }

    const data = await res.json();
    const products = data.products || [];

    if (products.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; padding: 40px; color: var(--text-secondary);">
            No products found in catalog.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = products.map(prod => {
      const rating = prod.rating !== undefined ? prod.rating : 5.0;
      const count = prod.ratingCount || 0;
      const img = prod.img || 'assets/Videos/SenpaiWorks logo.png';

      let statusBadge = "";
      if (count === 0) {
        statusBadge = `<span style="background: rgba(148, 163, 184, 0.15); color: #94a3b8; padding: 4px 10px; border-radius: 12px; font-weight: 700; font-size: 0.75rem;">⚪ No Reviews Yet</span>`;
      } else if (rating < 3.5) {
        statusBadge = `<span style="background: rgba(239, 68, 68, 0.15); color: #ef4444; padding: 4px 10px; border-radius: 12px; font-weight: 700; font-size: 0.75rem;"><i class="fa-solid fa-triangle-exclamation"></i> Needs Attention (${rating.toFixed(1)})</span>`;
      } else if (rating < 4.5) {
        statusBadge = `<span style="background: rgba(234, 179, 8, 0.15); color: #eab308; padding: 4px 10px; border-radius: 12px; font-weight: 700; font-size: 0.75rem;"><i class="fa-solid fa-star-half-stroke"></i> Good (${rating.toFixed(1)})</span>`;
      } else {
        statusBadge = `<span style="background: rgba(16, 185, 129, 0.15); color: #10b981; padding: 4px 10px; border-radius: 12px; font-weight: 700; font-size: 0.75rem;"><i class="fa-solid fa-circle-check"></i> Excellent (${rating.toFixed(1)})</span>`;
      }

      return `
        <tr>
          <td style="display: flex; align-items: center; gap: 12px;">
            <img src="${img}" alt="${prod.name}" style="width: 44px; height: 44px; object-fit: cover; border-radius: 6px; border: 1px solid var(--border-color);">
            <div>
              <div style="font-weight: 700; color: var(--text-primary);">${prod.name}</div>
              <div style="font-size: 0.72rem; color: #64748b;">ID: ${prod.id}</div>
            </div>
          </td>
          <td>
            <span style="font-size: 0.82rem; color: var(--text-secondary);">${prod.category || 'Standard'}</span>
          </td>
          <td>
            <div style="display: flex; align-items: center; gap: 6px;">
              <span style="font-weight: 800; font-size: 1rem; color: #f59e0b;">${rating.toFixed(1)}</span>
              <span style="color: #f59e0b;"><i class="fa-solid fa-star"></i></span>
            </div>
          </td>
          <td>
            <span style="font-weight: 700; color: var(--text-primary);">${count}</span>
            <span style="font-size: 0.78rem; color: #64748b;"> reviews</span>
          </td>
          <td>
            ${statusBadge}
          </td>
          <td style="text-align: right; white-space: nowrap;">
            <button type="button" onclick="openProductReviewsSearch('${prod.id}')" class="btn-order-action outline" style="padding: 6px 12px; font-size: 0.78rem; border: 1px solid #3b82f6; color: #3b82f6; background: transparent; cursor: pointer; border-radius: 6px; font-weight: 600; margin-right: 6px;">
              <i class="fa-solid fa-magnifying-glass"></i> View Reviews
            </button>
            <a href="store-detail.html?id=${encodeURIComponent(prod.id)}" target="_blank" class="btn-order-action outline" style="padding: 6px 12px; font-size: 0.78rem; border: 1px solid var(--border-color); color: var(--text-primary); text-decoration: none; border-radius: 6px;">
              <i class="fa-solid fa-arrow-up-right-from-square"></i> Store Page
            </a>
          </td>
        </tr>
      `;
    }).join("");
  } catch (err) {
    console.error("Error loading product health overview:", err);
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; padding: 30px; color: #ef4444;">
          Failed to load product health. Please refresh.
        </td>
      </tr>
    `;
  }
};

window.openProductReviewsSearch = function (productId) {
  switchReviewsSubtab("reviews-all");
  const searchInput = document.getElementById("admin-reviews-search");
  if (searchInput) {
    searchInput.value = productId;
  }
  loadAllAdminReviews();
};

// ── 3. ALL REVIEWS DATABASE (SEARCH & FILTERS) ─────────────────────────
window.handleAdminReviewsSearch = function () {
  if (adminReviewsSearchDebounce) clearTimeout(adminReviewsSearchDebounce);
  adminReviewsSearchDebounce = setTimeout(() => {
    loadAllAdminReviews();
  }, 350);
};

window.loadAllAdminReviews = async function () {
  const tbody = document.getElementById("admin-reviews-table-body");
  const totalBadge = document.getElementById("admin-reviews-total-badge");
  if (!tbody) return;

  tbody.innerHTML = `
    <tr>
      <td colspan="10" style="text-align: center; padding: 40px; color: var(--text-secondary);">
        <i class="fa-solid fa-spinner fa-spin" style="font-size: 1.5rem; margin-bottom: 8px; color: var(--accent-blue, #3b82f6);"></i>
        <p>Searching reviews database...</p>
      </td>
    </tr>
  `;

  const searchInput = document.getElementById("admin-reviews-search");
  const ratingFilter = document.getElementById("admin-reviews-filter-rating");
  const statusFilter = document.getElementById("admin-reviews-filter-status");
  const verifiedFilter = document.getElementById("admin-reviews-filter-verified");

  let queryUrl = `/api/admin/reviews?limit=100`;
  if (searchInput && searchInput.value.trim()) queryUrl += `&search=${encodeURIComponent(searchInput.value.trim())}`;
  if (ratingFilter && ratingFilter.value) queryUrl += `&rating=${encodeURIComponent(ratingFilter.value)}`;
  if (statusFilter && statusFilter.value) queryUrl += `&status=${encodeURIComponent(statusFilter.value)}`;
  if (verifiedFilter && verifiedFilter.checked) queryUrl += `&verifiedOnly=true`;

  try {
    const res = await fetch(queryUrl, {
      credentials: "include",
      headers: getAdminFetchHeaders()
    });

    if (window.handleAdminResponse) window.handleAdminResponse(res);

    if (!res.ok) {
      if (res.status === 401) {
        tbody.innerHTML = `
          <tr>
            <td colspan="10" style="text-align: center; padding: 30px; color: #ef4444;">
              Unauthorized: Please sign in as administrator.
            </td>
          </tr>
        `;
        return;
      }
      throw new Error(`Error ${res.status}: Failed to fetch admin reviews.`);
    }

    const data = await res.json();
    const reviews = data.reviews || [];
    const totalCount = data.totalCount !== undefined ? data.totalCount : reviews.length;

    if (totalBadge) totalBadge.textContent = `${totalCount} Review${totalCount === 1 ? '' : 's'}`;

    if (reviews.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="10" style="text-align: center; padding: 40px; color: var(--text-secondary);">
            <i class="fa-regular fa-star" style="font-size: 2rem; margin-bottom: 8px; opacity: 0.5;"></i>
            <p>No reviews match the selected filter criteria.</p>
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = reviews.map(rev => {
      const prod = rev.product || {};
      const user = rev.user || {};
      const prodName = prod.name || rev.productId;
      const userName = user.name || user.username || user.email || `User #${rev.userId}`;
      const isPublished = rev.status === "Published";
      const formattedDate = new Date(rev.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      
      const safeTitle = (rev.title || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      const safeText = (rev.text || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

      const statusBadge = isPublished
        ? `<span class="badge badge-success" style="background: rgba(16, 185, 129, 0.15); color: #10b981; padding: 4px 8px; border-radius: 4px; font-weight: 700; font-size: 0.75rem;">Published</span>`
        : `<span class="badge badge-danger" style="background: rgba(239, 68, 68, 0.15); color: #ef4444; padding: 4px 8px; border-radius: 4px; font-weight: 700; font-size: 0.75rem;">Hidden</span>`;

      const verifiedTag = rev.verifiedPurchase
        ? `<span style="color: #10b981; font-size: 0.75rem; font-weight: 700; display: inline-flex; align-items: center; gap: 4px;"><i class="fa-solid fa-circle-check"></i> Verified</span>`
        : `<span style="color: #64748b; font-size: 0.75rem;">Unverified</span>`;

      const variantText = rev.variant ? `<div style="font-size: 0.72rem; color: #94a3b8;">${rev.variant}</div>` : '';

      const reportCount = rev.reportCount || 0;
      const reportsBadge = reportCount > 0
        ? `<span style="background: rgba(239, 68, 68, 0.15); color: #ef4444; font-weight: 700; padding: 2px 8px; border-radius: 12px; font-size: 0.75rem;"><i class="fa-solid fa-flag"></i> ${reportCount}</span>`
        : `<span style="color: var(--text-secondary); font-size: 0.8rem;">0</span>`;

      return `
        <tr id="admin-review-row-${rev.id}">
          <td style="font-weight: 600;">
            <a href="store-detail.html?id=${encodeURIComponent(rev.productId)}" target="_blank" style="color: var(--text-primary); text-decoration: none;">
              ${prodName}
            </a>
            <div style="font-size: 0.72rem; color: #64748b;">ID: ${rev.productId}</div>
          </td>
          <td>
            <div style="font-weight: 600; color: var(--text-primary);">${userName}</div>
            <div style="font-size: 0.72rem; color: #64748b;">${user.email || ''}</div>
          </td>
          <td>
            <span style="font-weight: 700; color: #f59e0b; display: inline-flex; align-items: center; gap: 4px;">
              <i class="fa-solid fa-star"></i> ${rev.rating}.0
            </span>
          </td>
          <td style="max-width: 300px;">
            <div style="font-weight: 700; color: var(--text-primary); margin-bottom: 2px;">${safeTitle}</div>
            <div style="font-size: 0.82rem; color: var(--text-secondary); line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;" title="${safeText}">
              ${safeText}
            </div>
          </td>
          <td>
            ${verifiedTag}
            ${variantText}
          </td>
          <td>${statusBadge}</td>
          <td style="color: var(--text-secondary); font-size: 0.85rem;">
            <i class="fa-regular fa-thumbs-up"></i> ${rev.helpfulCount || 0}
          </td>
          <td>${reportsBadge}</td>
          <td style="color: var(--text-secondary); font-size: 0.8rem; white-space: nowrap;">${formattedDate}</td>
          <td style="text-align: right; white-space: nowrap;">
            <button onclick="toggleAdminReviewStatus(${rev.id}, '${isPublished ? 'Hidden' : 'Published'}')" class="action-btn" title="${isPublished ? 'Hide Review' : 'Publish Review'}" style="margin-right: 6px; background: ${isPublished ? '#eab308' : '#10b981'}; color: #fff; border: none; padding: 6px 10px; border-radius: 6px; cursor: pointer; font-size: 0.78rem; font-weight: 600;">
              <i class="fa-solid ${isPublished ? 'fa-eye-slash' : 'fa-eye'}"></i> ${isPublished ? 'Hide' : 'Unhide'}
            </button>
            <button onclick="deleteAdminReview(${rev.id})" class="action-btn" title="Delete Review" style="background: #ef4444; color: #fff; border: none; padding: 6px 10px; border-radius: 6px; cursor: pointer; font-size: 0.78rem; font-weight: 600;">
              <i class="fa-solid fa-trash"></i> Delete
            </button>
          </td>
        </tr>
      `;
    }).join("");
  } catch (err) {
    console.error("Error loading admin reviews:", err);
    tbody.innerHTML = `
      <tr>
        <td colspan="10" style="text-align: center; padding: 30px; color: #ef4444;">
          Failed to load reviews. Please try again.
        </td>
      </tr>
    `;
  }
};

window.toggleAdminReviewStatus = async function (reviewId, newStatus, isQueue = false) {
  try {
    const res = await fetch(`/api/admin/reviews/${reviewId}/status`, {
      method: "PATCH",
      credentials: "include",
      headers: getAdminFetchHeaders(),
      body: JSON.stringify({ status: newStatus })
    });

    if (window.handleAdminResponse) window.handleAdminResponse(res);

    const data = await res.json();
    if (!res.ok) {
      alert(data.error || "Failed to update review status.");
      return;
    }

    if (isQueue) {
      loadReportedModerationQueue();
    } else {
      loadAllAdminReviews();
    }
  } catch (err) {
    console.error("Error updating review status:", err);
    alert("Network error while updating review status.");
  }
};

window.deleteAdminReview = async function (reviewId, isQueue = false) {
  if (!confirm("Are you sure you want to permanently delete this customer review? This cannot be undone.")) {
    return;
  }

  try {
    const res = await fetch(`/api/admin/reviews/${reviewId}`, {
      method: "DELETE",
      credentials: "include",
      headers: getAdminFetchHeaders()
    });

    if (window.handleAdminResponse) window.handleAdminResponse(res);

    const data = await res.json();
    if (!res.ok) {
      alert(data.error || "Failed to delete review.");
      return;
    }

    if (isQueue) {
      loadReportedModerationQueue();
    } else {
      loadAllAdminReviews();
    }
  } catch (err) {
    console.error("Error deleting review:", err);
    alert("Network error while deleting review.");
  }
};
