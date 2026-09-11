/**
 * SenpaiWorks Admin Console - Replacements Module
 * scripts/admin/admin-replacements.js
 */

window.loadAdminReplacements = async function () {
  const tbody = document.getElementById("replacements-list-body");
  if (!tbody) return;
  
  try {
    const res = await fetch("/api/admin/replacements", {
      headers: window.getAdminTokenHeaders()
    });
    if (window.handleAdminResponse) window.handleAdminResponse(res);
    if (!res.ok) throw new Error("Failed to fetch replacements");
    const replacements = await res.json();
    
    if (!Array.isArray(replacements) || replacements.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 30px; color: #94a3b8;">No replacement requests found.</td></tr>`;
      return;
    }

    tbody.innerHTML = replacements.map(r => {
      const orderNum = r.order ? r.order.orderNumber : `ID-${r.orderId}`;
      const customer = r.order ? (r.order.customer?.name || r.order.guestName || r.order.email) : "Unknown Customer";
      const itemReplaced = r.orderItem ? `${r.orderItem.productName} (x${r.orderItem.quantity})` : "Entire Order";
      const reason = r.reason || "Not specified";
      const date = new Date(r.createdAt).toLocaleDateString();
      
      let statusBadge = "";
      let actions = "";
      
      if (r.status === "Requested") {
        statusBadge = `<span class="badge-status-pending">Pending</span>`;
        actions = `
          <button onclick="window.updateAdminReplacementStatus(${r.id}, 'Approved')" class="btn-replacement-approve">Approve</button>
          <button onclick="window.updateAdminReplacementStatus(${r.id}, 'Rejected')" class="btn-replacement-reject">Reject</button>
        `;
      } else if (r.status === "Approved") {
        statusBadge = `<span class="badge-status-approved">Approved</span>`;
        actions = r.newOrder ? `<span class="new-order-badge">New Order: <br><strong>#${r.newOrder.orderNumber}</strong></span>` : '<span class="text-green">Approved</span>';
      } else {
        statusBadge = `<span class="badge-status-rejected">Rejected</span>`;
        actions = `<span class="text-red">Rejected</span>`;
      }

      return `
        <tr>
          <td class="order-num-cell">#${orderNum}</td>
          <td>${window.escapeHtml(customer)}</td>
          <td class="item-replaced-cell">${window.escapeHtml(itemReplaced)}</td>
          <td class="reason-cell" title="${window.escapeHtml(reason)}">${window.escapeHtml(reason)}</td>
          <td class="date-cell">${date}</td>
          <td>${statusBadge}</td>
          <td>${actions}</td>
        </tr>
      `;
    }).join("");
  } catch (err) {
    console.error("Error loading replacements:", err);
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 30px; color: #ef4444;">Error loading replacements.</td></tr>`;
  }
};

window.updateAdminReplacementStatus = async function (id, status) {
  const confirmed = await window.showAdminConfirm(
    `${status} Replacement`,
    `Are you sure you want to ${status.toLowerCase()} this replacement request?`,
    status,
    status === "Approved" ? "success" : "danger"
  );
  if (!confirmed) return;

  try {
    const res = await fetch(`/api/admin/replacements/${id}`, {
      method: "PATCH",
      headers: window.getAdminTokenHeaders(),
      body: JSON.stringify({ status })
    });
    
    if (res.ok) {
      window.showAdminToast(`Replacement request ${status.toLowerCase()} successfully.`, "success");
      window.loadAdminReplacements();
      if (typeof window.loadOrders === "function") window.loadOrders();
    } else {
      const data = await res.json();
      window.showAdminToast(data.error || "Failed to update replacement status", "danger");
    }
  } catch (err) {
    console.error("Error updating replacement:", err);
    window.showAdminToast("Error updating replacement status.", "danger");
  }
};
