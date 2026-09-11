"use strict";

let selectedStarRating = 5;

// 6. STAR RATING PICKER
function setupStarPicker() {
  const stars = document.querySelectorAll("#star-picker .star-btn");
  const valTxt = document.getElementById("star-rating-val");

  stars.forEach(star => {
    star.addEventListener("click", () => {
      selectedStarRating = parseInt(star.getAttribute("data-val"));
      stars.forEach(s => {
        const sVal = parseInt(s.getAttribute("data-val"));
        if (sVal <= selectedStarRating) {
          s.classList.add("active");
        } else {
          s.classList.remove("active");
        }
      });
      if (valTxt) valTxt.textContent = `${selectedStarRating} / 5`;
    });
  });
}
window.setupStarPicker = setupStarPicker;

// 7. FEEDBACK SUBMISSION
window.handleAccountFeedbackSubmit = function (e) {
  if (e) e.preventDefault();
  const category = document.getElementById("feedback-category-select").value;
  const msg = document.getElementById("feedback-msg-input").value.trim();
  if (!msg) return;

  const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
  const authorName = currentUser.firstName ? `${currentUser.firstName} ${currentUser.lastName}` : "Profile User";

  const newFeedback = {
    id: "FB-" + Math.floor(1000 + Math.random() * 9000),
    user: authorName,
    date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
    category: category,
    rating: selectedStarRating,
    title: "Profile Feedback",
    text: msg,
    isPublic: true,
    helpfulCount: 0,
    status: "Pending",
    admin_reply: null,
    internal_notes: null,
    priority: null
  };

  let reviewsList = [];
  try {
    const raw = localStorage.getItem("userReviews") || localStorage.getItem("user_reviews");
    if (raw) reviewsList = JSON.parse(raw) || [];
  } catch (err) {}

  reviewsList.unshift(newFeedback);
  localStorage.setItem("userReviews", JSON.stringify(reviewsList));
  localStorage.setItem("user_reviews", JSON.stringify(reviewsList));

  document.getElementById("feedback-msg-input").value = "";
  if (typeof showToast === 'function') showToast("Thank you for your feedback! Your review has been recorded.");
  else alert("Thank you for your feedback! Your review has been recorded.");
  window.loadFeedbackHistory();
};

window.profileFeedbackLimit = 5;

window.loadFeedbackHistory = function() {
  const container = document.getElementById("feedback-history-list");
  if (!container) return;

  const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
  const authorName = currentUser.firstName ? `${currentUser.firstName} ${currentUser.lastName}` : "Profile User";

  let reviewsList = [];
  try {
    const raw = localStorage.getItem("userReviews") || localStorage.getItem("user_reviews");
    if (raw) reviewsList = JSON.parse(raw) || [];
  } catch (err) {}

  // Filter to only show feedback submitted by the current user
  let history = reviewsList.filter(r => r.user === authorName || r.author === authorName);
  
  // Sort newest first
  history.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

  if (history.length === 0) {
    container.innerHTML = `<div style="text-align: center; color: #94a3b8; padding: 24px;">No past feedback found.</div>`;
    return;
  }

  const visibleHistory = history.slice(0, window.profileFeedbackLimit);
  let html = "";
  
  visibleHistory.forEach(item => {
    let starsHtml = "";
    for (let i = 1; i <= 5; i++) {
      starsHtml += `<i class="fa-solid fa-star" style="color: ${i <= item.rating ? '#f59e0b' : '#cbd5e1'}; font-size: 0.75rem;"></i>`;
    }

    const statusColor = item.status === 'Resolved' ? '#10b981' : (item.status === 'Reviewed' ? '#3b82f6' : (item.status === 'Flagged' ? '#ef4444' : '#94a3b8'));

    html += `
      <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px; background: #f8fafc; padding: 12px 16px; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 8px; flex-wrap: nowrap; overflow: hidden;">
        <div style="flex-shrink: 0; width: 140px;">
          <span style="font-size: 0.75rem; font-weight: 700; color: #0f172a; background: #e2e8f0; padding: 2px 6px; border-radius: 4px; display: inline-block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%;" title="${item.category || 'General'}">${item.category || 'General'}</span>
        </div>
        <div style="flex-shrink: 0; width: 70px;">
          ${starsHtml}
        </div>
        <div style="flex-grow: 1; flex-shrink: 1; min-width: 0;">
          <p style="font-size: 0.85rem; color: #334155; margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${item.text || item.message || ''}">${item.text || item.message || ''}</p>
        </div>
        <div style="flex-shrink: 0; width: 80px; text-align: center;">
          <span style="font-size: 0.7rem; font-weight: 700; color: ${statusColor}; border: 1px solid ${statusColor}; padding: 2px 6px; border-radius: 4px;">${item.status || 'Pending'}</span>
        </div>
        <div style="flex-shrink: 0; width: 90px; text-align: right;">
          <span style="font-size: 0.75rem; color: #64748b; white-space: nowrap;">${item.date}</span>
        </div>
      </div>
    `;
  });

  if (history.length > window.profileFeedbackLimit) {
    html += `
      <div style="text-align: center; margin-top: 12px;">
        <button onclick="window.profileFeedbackLimit += 5; window.loadFeedbackHistory()" style="background: transparent; border: 1px solid #cbd5e1; color: #475569; padding: 6px 16px; border-radius: 6px; font-size: 0.85rem; font-weight: 600; cursor: pointer;">Show More</button>
      </div>
    `;
  }

  container.innerHTML = html;
};
