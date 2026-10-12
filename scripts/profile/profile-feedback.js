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

// 7. FEEDBACK (stored on the server; admin replies are shown in the history)
function getProfileUserToken() {
  return localStorage.getItem("userToken") || sessionStorage.getItem("userToken") || "";
}

function feedbackEscape(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatFeedbackDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

function notifyFeedbackResult(message, isError = false) {
  if (!isError && typeof showToast === "function") showToast(message);
  else alert(message);
}

function notifyAdminOfFeedback(category, rating, message) {
  let currentUser = {};
  try {
    currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
  } catch (err) {}
  const authorName = currentUser.firstName ? `${currentUser.firstName} ${currentUser.lastName}` : "Profile User";

  fetch("/api/support/contact", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: authorName,
      email: currentUser.email || "",
      subject: `User Feedback: ${category}`,
      message: `Profile Feedback\n\nRating: ${rating}/5\n\n${message}`
    })
  }).catch(err => console.warn("[Feedback] Admin email notification failed:", err));
}

window.handleAccountFeedbackSubmit = async function (e) {
  if (e) e.preventDefault();
  const categoryEl = document.getElementById("feedback-category-select");
  const msgEl = document.getElementById("feedback-msg-input");
  const category = (categoryEl && categoryEl.value) || "General";
  const message = msgEl.value.trim();
  if (!message) return;

  const token = getProfileUserToken();
  if (!token) {
    notifyFeedbackResult("Please log in to submit feedback.", true);
    return;
  }

  const submitBtn = e && e.target ? e.target.querySelector('button[type="submit"]') : null;
  if (submitBtn) submitBtn.disabled = true;

  try {
    const res = await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
      body: JSON.stringify({ category, rating: selectedStarRating, message })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      notifyFeedbackResult(data.error || "Could not submit feedback. Please try again.", true);
      return;
    }

    notifyAdminOfFeedback(category, selectedStarRating, message);
    msgEl.value = "";
    notifyFeedbackResult("Thank you for your feedback! Our team will review it.");
    window.profileFeedbackLimit = 5;
    await window.loadFeedbackHistory();
  } catch (err) {
    console.warn("[Feedback] Submit failed:", err);
    notifyFeedbackResult("Network error. Please try again.", true);
  } finally {
    if (submitBtn) submitBtn.disabled = false;
  }
};

window.profileFeedbackLimit = 5;

window.loadFeedbackHistory = async function () {
  const container = document.getElementById("feedback-history-list");
  if (!container) return;

  const token = getProfileUserToken();
  if (!token) {
    container.innerHTML = `<div style="text-align: center; color: #94a3b8; padding: 24px;">Log in to view your feedback.</div>`;
    return;
  }

  let history = [];
  try {
    const res = await fetch("/api/users/me/feedback", {
      headers: { "Authorization": `Bearer ${token}` }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    history = Array.isArray(data.feedback) ? data.feedback : [];
  } catch (err) {
    console.warn("[Feedback] Could not load history:", err);
    container.innerHTML = `<div style="text-align: center; color: #94a3b8; padding: 24px;">Could not load your feedback. Please refresh the page.</div>`;
    return;
  }

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

    const status = item.status || "Pending";
    const statusColor = status === 'Resolved' ? '#10b981' : (status === 'Reviewed' ? '#3b82f6' : (status === 'Flagged' ? '#ef4444' : '#94a3b8'));
    const replyDate = formatFeedbackDate(item.adminReplyAt);
    const replyHtml = item.adminReply ? `
        <div style="margin-top: 10px; padding: 10px 12px; background: #eff6ff; border-left: 3px solid #3b82f6; border-radius: 6px;">
          <div style="font-size: 0.72rem; font-weight: 700; color: #1d4ed8; margin-bottom: 4px;">SenpaiWorks replied${replyDate ? ` on ${feedbackEscape(replyDate)}` : ""}</div>
          <p style="font-size: 0.85rem; color: #1e293b; margin: 0; white-space: pre-wrap;">${feedbackEscape(item.adminReply)}</p>
        </div>
      ` : "";

    html += `
      <div style="background: #f8fafc; padding: 12px 16px; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 8px;">
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap;">
          <span style="font-size: 0.75rem; font-weight: 700; color: #0f172a; background: #e2e8f0; padding: 2px 6px; border-radius: 4px;">${feedbackEscape(item.category || "General")}</span>
          <span>${starsHtml}</span>
          <span style="font-size: 0.7rem; font-weight: 700; color: ${statusColor}; border: 1px solid ${statusColor}; padding: 2px 6px; border-radius: 4px;">${feedbackEscape(status)}</span>
          <span style="font-size: 0.75rem; color: #64748b; white-space: nowrap;">${feedbackEscape(formatFeedbackDate(item.createdAt))}</span>
        </div>
        <p style="font-size: 0.85rem; color: #334155; margin: 8px 0 0; white-space: pre-wrap;">${feedbackEscape(item.message)}</p>
        ${replyHtml}
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
