/**
 * SenpaiWorks Admin Console - Customer Feedback & Reviews Module
 * scripts/admin/admin-feedback.js
 */

window.feedbackSortCol = 'date';
window.feedbackSortDir = 'desc';
window.feedbackCurrentPage = 1;

window.loadCommunityReviews = async function () {
  const tbody = document.getElementById("community-reviews-list");
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

  const searchInput = document.getElementById("feedback-search-input");
  const catFilter = document.getElementById("feedback-category-filter");
  const statusFilter = document.getElementById("feedback-status-filter");

  if (searchInput && searchInput.value) {
    const q = searchInput.value.toLowerCase().trim();
    allReviews = allReviews.filter(r => 
      (r.author && r.author.toLowerCase().includes(q)) || 
      (r.user && r.user.toLowerCase().includes(q)) ||
      (r.email && r.email.toLowerCase().includes(q)) ||
      (r.text && r.text.toLowerCase().includes(q)) ||
      (r.title && r.title.toLowerCase().includes(q))
    );
  }

  if (catFilter && catFilter.value !== "All") {
    allReviews = allReviews.filter(r => (r.category || 'General') === catFilter.value);
  }

  if (statusFilter && statusFilter.value !== "All") {
    allReviews = allReviews.filter(r => (r.status || 'Pending') === statusFilter.value);
  }

  const cols = ['author', 'rating', 'date'];
  cols.forEach(col => {
    const icon = document.getElementById(`sort-icon-${col}`);
    if (icon) {
      icon.className = 'fa-solid fa-sort';
      if (col === window.feedbackSortCol) {
        icon.className = window.feedbackSortDir === 'asc' ? 'fa-solid fa-sort-up' : 'fa-solid fa-sort-down';
      }
    }
  });

  allReviews.sort((a, b) => {
    let valA = a[window.feedbackSortCol];
    let valB = b[window.feedbackSortCol];

    if (window.feedbackSortCol === 'date') {
      valA = new Date(valA || 0).getTime();
      valB = new Date(valB || 0).getTime();
    } else if (window.feedbackSortCol === 'rating') {
      valA = a.rating || 0;
      valB = b.rating || 0;
    } else if (window.feedbackSortCol === 'author') {
      valA = (a.author || a.user || 'Anonymous').toLowerCase();
      valB = (b.author || b.user || 'Anonymous').toLowerCase();
    }

    if (valA < valB) return window.feedbackSortDir === 'asc' ? -1 : 1;
    if (valA > valB) return window.feedbackSortDir === 'asc' ? 1 : -1;
    return 0;
  });

  if (countBadge) countBadge.textContent = allReviews.length;
  if (feedbackCountBadge) feedbackCountBadge.textContent = allReviews.length;

  window.feedbackCurrentPage = window.feedbackCurrentPage || 1;
  const itemsPerPage = 10;
  const totalPages = Math.max(1, Math.ceil(allReviews.length / itemsPerPage));
  if (window.feedbackCurrentPage > totalPages) window.feedbackCurrentPage = totalPages;

  const startIndex = (window.feedbackCurrentPage - 1) * itemsPerPage;
  const paginatedReviews = allReviews.slice(startIndex, startIndex + itemsPerPage);

  const prevBtn = document.getElementById("feedback-prev-btn");
  const nextBtn = document.getElementById("feedback-next-btn");
  const pageInfo = document.getElementById("feedback-page-info");
  if (prevBtn && nextBtn && pageInfo) {
    prevBtn.disabled = window.feedbackCurrentPage <= 1;
    nextBtn.disabled = window.feedbackCurrentPage >= totalPages;
    pageInfo.textContent = `Page ${window.feedbackCurrentPage} of ${totalPages}`;
  }

  if (allReviews.length === 0) {
    const emptyRow = `<tr><td colspan="7" style="text-align: center; color: #94a3b8; padding: 24px;">No community feedback submitted yet.</td></tr>`;
    allTargetTbodies.forEach(tb => tb.innerHTML = emptyRow);
    return;
  }

  const rowsHtml = paginatedReviews.map(r => {
    const stars = '★'.repeat(r.rating || 5);
    const author = r.author || r.user || 'Anonymous';
    const status = r.status || 'Pending';
    let statusColor = '#94a3b8';
    if (status === 'Reviewed') statusColor = '#3b82f6';
    if (status === 'Resolved') statusColor = '#10b981';
    if (status === 'Flagged') statusColor = '#ef4444';

    return `
      <tr class="feedback-row-clickable" onclick="window.openFeedbackDetail('${r.id}', event)">
        <td class="text-center" onclick="event.stopPropagation()">
          <input type="checkbox" class="feedback-row-checkbox" value="${r.id}" onchange="window.updateBulkActionState()">
        </td>
        <td>
          <div class="feedback-author-name">${window.escapeHtml(author)}</div>
          ${r.email ? `<small class="feedback-author-email">${window.escapeHtml(r.email)}</small>` : ''}
        </td>
        <td>
          <div class="feedback-rating-stars">${stars} <span class="feedback-rating-num">(${r.rating || 5}.0)</span></div>
          <strong class="feedback-item-title">${window.escapeHtml(r.title || 'Review')}</strong>
        </td>
        <td>
          <div class="feedback-snippet" title="${window.escapeHtml(r.text || '')}">${window.escapeHtml(r.text || '')}</div>
        </td>
        <td>
          <span class="badge badge-type">${window.escapeHtml(r.category || 'General')}</span>
        </td>
        <td>
          <span class="feedback-status-pill" style="border-color: ${statusColor}; color: ${statusColor};">${status}</span>
        </td>
        <td>
          <span class="feedback-date-text">${window.escapeHtml(r.date || 'Today')}</span>
        </td>
        <td onclick="event.stopPropagation()">
          <button class="action-btn btn-delete" onclick="window.deleteAdminCommunityReview('${r.id}')" title="Delete Review"><i class="fa-solid fa-trash"></i> Delete</button>
        </td>
      </tr>
    `;
  }).join("");

  allTargetTbodies.forEach(tb => tb.innerHTML = rowsHtml);
};

window.deleteAdminCommunityReview = async function (reviewId) {
  const confirmed = await window.showAdminConfirm(
    "Delete Feedback",
    "Are you sure you want to delete this community review?",
    "Delete",
    "danger"
  );
  if (!confirmed) return;

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

  window.showAdminToast("Review deleted successfully.", "success");
  window.loadCommunityReviews();
};

window.toggleFeedbackSort = function (col) {
  if (window.feedbackSortCol === col) {
    window.feedbackSortDir = window.feedbackSortDir === 'asc' ? 'desc' : 'asc';
  } else {
    window.feedbackSortCol = col;
    window.feedbackSortDir = 'asc';
  }
  window.loadCommunityReviews();
};

window.feedbackChangePage = function (delta) {
  window.feedbackCurrentPage = (window.feedbackCurrentPage || 1) + delta;
  window.loadCommunityReviews();
};

window.toggleAllFeedback = function (source) {
  const checkboxes = document.querySelectorAll(".feedback-row-checkbox");
  checkboxes.forEach(cb => cb.checked = source.checked);
  window.updateBulkActionState();
};

window.updateBulkActionState = function () {
  const checkboxes = document.querySelectorAll(".feedback-row-checkbox:checked");
  const count = checkboxes.length;
  const bulkBar = document.getElementById("feedback-bulk-actions");
  const countText = document.getElementById("feedback-bulk-count");
  if (bulkBar && countText) {
    if (count > 0) {
      bulkBar.style.display = "flex";
      countText.textContent = `${count} selected`;
    } else {
      bulkBar.style.display = "none";
    }
  }
};

window.bulkMarkAsReviewedFeedback = async function () {
  const checkboxes = document.querySelectorAll(".feedback-row-checkbox:checked");
  if (checkboxes.length === 0) return;
  
  const confirmed = await window.showAdminConfirm(
    "Mark as Reviewed",
    `Are you sure you want to mark ${checkboxes.length} selected feedbacks as Reviewed?`,
    "Mark Reviewed",
    "info"
  );
  if (!confirmed) return;

  const idsToUpdate = Array.from(checkboxes).map(cb => cb.value);
  try {
    let reviewsList = JSON.parse(localStorage.getItem("userReviews") || localStorage.getItem("user_reviews") || "[]");
    reviewsList = reviewsList.map(r => {
      if (idsToUpdate.includes(r.id)) {
        r.status = "Reviewed";
      }
      return r;
    });
    localStorage.setItem("userReviews", JSON.stringify(reviewsList));
    localStorage.setItem("user_reviews", JSON.stringify(reviewsList));
  } catch (e) {}

  window.showAdminToast(`${checkboxes.length} reviews marked as Reviewed.`, "success");
  const selectAll = document.getElementById("feedback-select-all");
  if (selectAll) selectAll.checked = false;
  window.updateBulkActionState();
  window.loadCommunityReviews();
};

window.bulkDeleteFeedback = async function () {
  const checkboxes = document.querySelectorAll(".feedback-row-checkbox:checked");
  if (checkboxes.length === 0) return;

  const confirmed = await window.showAdminConfirm(
    "Delete Selected Feedback",
    `Are you sure you want to delete ${checkboxes.length} selected feedback entries?`,
    "Delete",
    "danger"
  );
  if (!confirmed) return;

  const idsToDelete = Array.from(checkboxes).map(cb => cb.value);
  try {
    let reviewsList = JSON.parse(localStorage.getItem("userReviews") || localStorage.getItem("user_reviews") || "[]");
    reviewsList = reviewsList.filter(r => !idsToDelete.includes(r.id));
    localStorage.setItem("userReviews", JSON.stringify(reviewsList));
    localStorage.setItem("user_reviews", JSON.stringify(reviewsList));
  } catch (e) {}

  window.showAdminToast(`${checkboxes.length} reviews deleted successfully.`, "success");
  const selectAll = document.getElementById("feedback-select-all");
  if (selectAll) selectAll.checked = false;
  window.updateBulkActionState();
  window.loadCommunityReviews();
};

// ── Feedback Detail Modal ─────────────────────────────────
window.openFeedbackDetail = function (id, event) {
  if (event) {
    if (event.target.closest('button') || event.target.closest('input[type="checkbox"]')) return;
  }
  
  let reviewsList = [];
  try {
    const raw = localStorage.getItem("userReviews") || localStorage.getItem("user_reviews");
    if (raw) reviewsList = JSON.parse(raw) || [];
  } catch (e) {}

  const review = reviewsList.find(r => r.id === id);
  if (!review) return;

  const idField = document.getElementById("detail-modal-id");
  const userField = document.getElementById("detail-modal-user");
  const catField = document.getElementById("detail-modal-category");
  const dateField = document.getElementById("detail-modal-date");
  const ratingField = document.getElementById("detail-modal-rating");
  const contentField = document.getElementById("detail-modal-content");
  const statusField = document.getElementById("detail-modal-status");
  const priorityField = document.getElementById("detail-modal-priority");
  const notesField = document.getElementById("detail-modal-internal-notes");
  const replyField = document.getElementById("detail-modal-admin-reply");

  if (idField) idField.value = review.id;
  if (userField) userField.textContent = review.author || review.user || 'Anonymous';
  if (catField) catField.textContent = review.category || 'General';
  if (dateField) dateField.textContent = review.date || 'Unknown';
  if (ratingField) ratingField.textContent = review.rating ? '★'.repeat(review.rating) : 'N/A';
  if (contentField) contentField.textContent = review.text || 'No content provided.';
  
  if (statusField) statusField.value = review.status || 'Pending';
  if (priorityField) priorityField.value = review.priority || 'Low';
  if (notesField) notesField.value = review.internal_notes || '';
  if (replyField) replyField.value = review.admin_reply || '';

  const modal = document.getElementById("modal-feedback-detail");
  if (modal) {
    modal.classList.add("active");
    modal.style.display = "flex";
  }
};

window.saveFeedbackDetail = function () {
  const id = document.getElementById("detail-modal-id")?.value;
  if (!id) return;

  try {
    let reviewsList = JSON.parse(localStorage.getItem("userReviews") || localStorage.getItem("user_reviews") || "[]");
    const idx = reviewsList.findIndex(r => r.id === id);
    if (idx > -1) {
      reviewsList[idx].status = document.getElementById("detail-modal-status")?.value || 'Pending';
      reviewsList[idx].priority = document.getElementById("detail-modal-priority")?.value || 'Low';
      reviewsList[idx].internal_notes = document.getElementById("detail-modal-internal-notes")?.value || '';
      reviewsList[idx].admin_reply = document.getElementById("detail-modal-admin-reply")?.value || '';
      
      localStorage.setItem("userReviews", JSON.stringify(reviewsList));
      localStorage.setItem("user_reviews", JSON.stringify(reviewsList));
      
      window.showAdminToast("Feedback updated successfully.", "success");
      
      const modal = document.getElementById("modal-feedback-detail");
      if (modal) {
        modal.classList.remove("active");
        modal.style.display = "none";
      }
      
      window.loadCommunityReviews();
    }
  } catch (e) {}
};

window.addEventListener("storage", (e) => {
  if (e.key === "userReviews" || e.key === "user_reviews") {
    if (typeof window.loadCommunityReviews === "function") window.loadCommunityReviews();
  }
});
