/**
 * SenpaiWorks Admin Console - Coupons & Promos Module
 * scripts/admin/admin-coupons.js
 *
 * Routes: GET list, POST create, PATCH toggle status, DELETE
 */

// ── Load & Render ────────────────────────────────────────────────────────────
window.loadCoupons = async function () {
  const tbody = document.getElementById("coupons-list-body");
  const countEl = document.getElementById("coupons-table-count");
  if (!tbody) return;

  tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:20px;color:#64748b;">Loading...</td></tr>';

  try {
    const res = await fetch("/api/admin/coupons", { headers: window.getAdminTokenHeaders() });
    if (window.handleAdminResponse) window.handleAdminResponse(res);
    if (!res.ok) return;
    const coupons = await res.json();

    if (countEl) countEl.textContent = `${coupons.length} coupon${coupons.length !== 1 ? 's' : ''}`;

    if (!coupons || coupons.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:30px;color:#64748b;">No coupons yet. Click <strong>Add Coupon</strong> to create one.</td></tr>';
      return;
    }

    tbody.innerHTML = coupons.map(c => {
      const isActive = c.status === 'Active';
      const usageStr = c.maxUses ? `${c.usageCount} / ${c.maxUses}` : `${c.usageCount} (unlimited)`;
      const expiryStr = c.expiryDate ? c.expiryDate : '—';
      const discountStr = c.discountType === 'percentage'
        ? `${c.discountValue}%`
        : `₹${c.discountValue}`;

      return '<tr>' +
        '<td><code class="coupon-code-tag">' + window.escapeHtml(c.code) + '</code></td>' +
        '<td><strong>' + discountStr + '</strong></td>' +
        '<td>' + (c.discountType === 'percentage' ? 'Percentage' : 'Flat Amount') + '</td>' +
        '<td>' + usageStr + '</td>' +
        '<td>' + expiryStr + '</td>' +
        '<td>' +
          '<span class="status-pill ' + (isActive ? 'status-active' : 'status-inactive') + '">' +
          window.escapeHtml(c.status) + '</span>' +
        '</td>' +
        '<td class="text-center" style="white-space:nowrap;">' +
          '<button class="action-btn btn-edit" onclick="window.toggleCouponStatus(\'' + window.escapeHtml(c.code) + '\')" title="Toggle Active/Inactive">' +
            '<i class="fa-solid ' + (isActive ? 'fa-toggle-on' : 'fa-toggle-off') + '"></i>' +
          '</button>' +
          '<button class="action-btn btn-delete" onclick="window.deleteCoupon(\'' + window.escapeHtml(c.code) + '\')" title="Delete Coupon">' +
            '<i class="fa-solid fa-trash"></i>' +
          '</button>' +
        '</td>' +
      '</tr>';
    }).join("");
  } catch (err) {
    console.error("Failed to fetch coupons", err);
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:20px;color:#ef4444;">Failed to load coupons.</td></tr>';
  }
};

// ── Toggle Active/Inactive ───────────────────────────────────────────────────
window.toggleCouponStatus = async function (code) {
  try {
    const res = await fetch("/api/admin/coupons/" + encodeURIComponent(code) + "/toggle", {
      method: "PATCH",
      headers: window.getAdminTokenHeaders()
    });
    if (window.handleAdminResponse) window.handleAdminResponse(res);
    if (res.ok) {
      const data = await res.json();
      window.showAdminToast(`Coupon ${code} is now ${data.status}`, "success");
      window.loadCoupons();
    } else {
      window.showAdminToast("Failed to toggle coupon status", "error");
    }
  } catch (e) {
    console.error(e);
    window.showAdminToast("Network error", "error");
  }
};

// ── Delete ───────────────────────────────────────────────────────────────────
window.deleteCoupon = async function (code) {
  const confirmed = await window.showAdminConfirm(
    `Delete Coupon`,
    `Delete coupon "${code}"? This cannot be undone.`,
    'Delete',
    'danger'
  );
  if (!confirmed) return;

  try {
    const res = await fetch("/api/admin/coupons/" + encodeURIComponent(code), {
      method: "DELETE",
      headers: window.getAdminTokenHeaders()
    });
    if (window.handleAdminResponse) window.handleAdminResponse(res);
    if (res.ok) {
      window.showAdminToast(`Coupon ${code} deleted`, "success");
      window.loadCoupons();
    } else {
      const data = await res.json();
      window.showAdminToast(data.error || "Failed to delete coupon", "error");
    }
  } catch (e) {
    console.error(e);
    window.showAdminToast("Network error", "error");
  }
};

// ── Create Modal Open/Close ──────────────────────────────────────────────────
window.openAddCouponModal = function () {
  const modal = document.getElementById("admin-coupon-modal");
  const form = document.getElementById("admin-coupon-form");
  if (form) form.reset();
  const title = document.getElementById("coupon-modal-title");
  if (title) title.innerHTML = '<i class="fa-solid fa-ticket"></i> Add New Coupon';
  if (modal) modal.style.display = "flex";
};

window.closeCouponModal = function () {
  const modal = document.getElementById("admin-coupon-modal");
  if (modal) modal.style.display = "none";
};

// ── Create Submit ────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("admin-coupon-form");
  if (!form) return;

  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    const submitBtn = document.getElementById("coupon-modal-submit-btn");
    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = "Saving..."; }

    const payload = {
      code: document.getElementById("coupon-input-code")?.value?.trim(),
      discountType: document.getElementById("coupon-input-type")?.value,
      discountValue: document.getElementById("coupon-input-value")?.value?.trim(),
      maxUses: document.getElementById("coupon-input-maxuses")?.value?.trim() || null,
      expiryDate: document.getElementById("coupon-input-expiry")?.value?.trim() || null,
      status: document.getElementById("coupon-input-status")?.value || "Active"
    };

    try {
      const res = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: { ...window.getAdminTokenHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (window.handleAdminResponse) window.handleAdminResponse(res);
      const data = await res.json();

      if (res.ok && data.success) {
        window.showAdminToast(`Coupon ${payload.code} created!`, "success");
        window.closeCouponModal();
        window.loadCoupons();
      } else {
        window.showAdminToast(data.error || "Failed to create coupon", "error");
      }
    } catch (err) {
      console.error(err);
      window.showAdminToast("Network error", "error");
    } finally {
      if (submitBtn) { submitBtn.disabled = false; submitBtn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Save Coupon'; }
    }
  });
});
