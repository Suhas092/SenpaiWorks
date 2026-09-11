"use strict";

// 4. MY REVIEWS LIST & MANAGEMENT
function getReviewStarsHTML(rating) {
  let html = "";
  for (let i = 1; i <= 5; i++) {
    if (i <= rating) {
      html += `<i class="fa-solid fa-star" style="color: #f59e0b; margin-right: 2px;"></i>`;
    } else {
      html += `<i class="fa-regular fa-star" style="color: #64748b; margin-right: 2px;"></i>`;
    }
  }
  return html;
}
window.getReviewStarsHTML = getReviewStarsHTML;

window.loadMyReviewsList = async function () {
  const container = document.getElementById("my-reviews-list-container");
  if (!container) return;

  container.innerHTML = `
    <div style="padding: 40px; text-align: center; color: #94a3b8;">
      <i class="fa-solid fa-spinner fa-spin" style="font-size: 2rem; margin-bottom: 12px; color: #3b82f6;"></i>
      <p>Loading your reviews...</p>
    </div>
  `;

  const token = localStorage.getItem("userToken") || sessionStorage.getItem("userToken");
  if (!token) {
    container.innerHTML = `
      <div style="padding: 40px; text-align: center; color: #94a3b8;">
        <p>Please log in to view your reviews.</p>
      </div>
    `;
    return;
  }

  try {
    const res = await fetch('/api/users/me/reviews', {
      headers: { "Authorization": `Bearer ${token}` }
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch reviews: ${res.status}`);
    }

    const data = await res.json();
    const reviews = data.reviews || [];

    if (reviews.length === 0) {
      container.innerHTML = `
        <div class="orders-empty-state" style="padding: 48px 24px; text-align: center; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.03);">
          <div style="font-size: 3rem; color: #3b82f6; margin-bottom: 16px; opacity: 0.8;"><i class="fa-regular fa-star"></i></div>
          <h3 style="font-size: 1.25rem; font-weight: 700; color: #0f172a; margin-bottom: 8px;">No Reviews Written Yet</h3>
          <p style="color: #64748b; font-size: 0.9rem; max-width: 420px; margin: 0 auto 20px auto;">Share your experience with products you've purchased or explored to help other fans and creators.</p>
          <a href="store.html" class="btn-save-profile" style="text-decoration: none; display: inline-flex; align-items: center; gap: 8px; font-weight: 700; padding: 10px 20px;">
            <i class="fa-solid fa-bag-shopping"></i> Explore Store Catalog
          </a>
        </div>
      `;
      return;
    }

    container.innerHTML = reviews.map(rev => {
      const prod = rev.product || {};
      const prodName = prod.name || rev.productId;
      const prodImg = prod.img || 'assets/Videos/SenpaiWorks logo.png';
      const formattedDate = new Date(rev.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      const safeTitle = (rev.title || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      const safeText = (rev.text || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

      return `
        <div class="order-history-card my-review-card" id="my-review-card-${rev.id}" style="padding: 20px; display: flex; gap: 20px; flex-wrap: wrap; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.03); text-align: left;">
          <div style="width: 80px; height: 80px; border-radius: 8px; overflow: hidden; background: #f1f5f9; border: 1px solid #e2e8f0; flex-shrink: 0;">
            <a href="store-detail.html?id=${encodeURIComponent(rev.productId)}">
              <img src="${prodImg}" alt="${prodName}" style="width: 100%; height: 100%; object-fit: cover;">
            </a>
          </div>
          <div style="flex: 1; min-width: 260px; text-align: left;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; margin-bottom: 6px;">
              <div style="text-align: left;">
                <a href="store-detail.html?id=${encodeURIComponent(rev.productId)}" style="font-size: 1.05rem; font-weight: 700; color: #0f172a; text-decoration: none; text-align: left; display: inline-block;">
                  ${prodName}
                </a>
                <div style="display: flex; align-items: center; gap: 8px; margin-top: 4px; flex-wrap: wrap; text-align: left;">
                  <div style="display: flex; align-items: center;">${getReviewStarsHTML(rev.rating)}</div>
                  <span style="font-size: 0.78rem; color: #64748b;">• ${formattedDate}</span>
                  ${rev.verifiedPurchase ? '<span style="font-size: 0.72rem; color: #10b981; font-weight: 600;"><i class="fa-solid fa-circle-check"></i> Verified Purchase</span>' : ''}
                  ${rev.variant ? `<span style="font-size: 0.72rem; color: #64748b;">(${rev.variant})</span>` : ''}
                </div>
              </div>
              <div style="display: flex; gap: 8px; flex-shrink: 0;">
                <a href="store-detail.html?id=${encodeURIComponent(rev.productId)}&openReview=true" class="btn-order-action primary" style="padding: 6px 14px; font-size: 0.8rem; text-decoration: none; display: inline-flex; align-items: center; gap: 6px; background: #ffffffff; color: #000000ff; border: 1px solid #0f172a; border-radius: 6px; font-weight: 600;">
                  <i class="fa-solid fa-pen-to-square"></i> Edit
                </a>
                <button type="button" onclick="deleteMyReview(${rev.id})" class="btn-order-action outline" style="padding: 6px 12px; font-size: 0.8rem; border: 1px solid #ef4444; color: #ef4444; cursor: pointer; background: transparent; border-radius: 6px;">
                  <i class="fa-solid fa-trash"></i> Delete
                </button>
              </div>
            </div>
            <h4 style="font-size: 0.95rem; font-weight: 700; color: #1e293b; margin: 8px 0 4px 0; text-align: left;">${safeTitle}</h4>
            <p style="font-size: 0.88rem; color: #475569; line-height: 1.5; margin: 0; text-align: left;">${safeText}</p>
          </div>
        </div>
      `;
    }).join("");
  } catch (err) {
    console.error("Error loading My Reviews:", err);
    container.innerHTML = `
      <div style="padding: 30px; text-align: center; color: #ef4444;">
        <p>Failed to load your reviews. Please try refreshing the page.</p>
      </div>
    `;
  }
};

window.deleteMyReview = async function (reviewId) {
  if (!confirm("Are you sure you want to delete this review? This action cannot be undone.")) {
    return;
  }

  const token = localStorage.getItem("userToken") || sessionStorage.getItem("userToken");
  if (!token) return;

  try {
    const res = await fetch(`/api/reviews/${reviewId}`, {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${token}` }
    });

    const data = await res.json();
    if (!res.ok) {
      alert(data.error || "Failed to delete review.");
      return;
    }

    if (window.showAuthToast) {
      window.showAuthToast("Review deleted successfully.");
    } else {
      alert("Review deleted successfully.");
    }

    // Refresh list
    window.loadMyReviewsList();
  } catch (err) {
    console.error("Error deleting review:", err);
    alert("Network error while deleting review.");
  }
};
