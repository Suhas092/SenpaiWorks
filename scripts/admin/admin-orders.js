/**
 * SenpaiWorks Admin Console - Customer Orders Module
 * scripts/admin/admin-orders.js
 */

let ordersCurrentStatus = "all";
let ordersCurrentPage = 1;
let ordersPageSize = 10;
let ordersSortColumn = 'date';
let ordersSortAsc = false;
let cachedOrdersList = [];

// ── Toggle Column Sort ─────────────────────────────────────
window.toggleOrdersSort = function (col) {
  if (ordersSortColumn === col) {
    ordersSortAsc = !ordersSortAsc;
  } else {
    ordersSortColumn = col;
    ordersSortAsc = col === 'total' || col === 'id' ? false : true;
  }
  
  document.querySelectorAll('th i[id^="orders-sort-icon-"]').forEach(i => i.className = "fa-solid fa-sort");
  const icon = document.getElementById(`orders-sort-icon-${col}`);
  if (icon) {
    icon.className = ordersSortAsc ? "fa-solid fa-sort-up" : "fa-solid fa-sort-down";
  }
  
  window.loadOrders();
};

window.changeOrdersPage = function (p) {
  ordersCurrentPage = p;
  window.loadOrders();
};

// ── Fetch Orders from Backend API ─────────────────────────
window.getAdminOrdersList = async function () {
  try {
    const res = await fetch("/api/admin/orders", {
      headers: window.getAdminTokenHeaders()
    });
    if (window.handleAdminResponse) window.handleAdminResponse(res);
    if (!res.ok) return [];
    const data = await res.json();
    cachedOrdersList = Array.isArray(data) ? data : [];
    return cachedOrdersList;
  } catch (e) {
    console.error("Failed to fetch admin orders:", e);
    return [];
  }
};

// ── Order Type Helper (Physical, Digital, Mixed) ───────────
window.getOrderTypeInfo = function (order) {
  const items = order.items || [];
  if (items.length === 0) {
    return {
      type: "Physical",
      badgeClass: "badge-physical",
      icon: "fa-box",
      badgeStyle: "background: rgba(59, 130, 246, 0.15); color: #3b82f6; border: 1px solid rgba(59, 130, 246, 0.3);"
    };
  }

  let hasDigital = false;
  let hasPhysical = false;

  items.forEach(item => {
    const isDigital = (item.product && item.product.type === "digital") || item.type === "digital";
    if (isDigital) hasDigital = true;
    else hasPhysical = true;
  });

  if (hasDigital && !hasPhysical) {
    return {
      type: "Digital",
      badgeClass: "badge-digital",
      icon: "fa-cloud-arrow-down",
      badgeStyle: "background: rgba(6, 182, 212, 0.15); color: #06b6d4; border: 1px solid rgba(6, 182, 212, 0.3);"
    };
  } else if (hasPhysical && hasDigital) {
    return {
      type: "Mixed",
      badgeClass: "badge-mixed",
      icon: "fa-layer-group",
      badgeStyle: "background: rgba(168, 85, 247, 0.15); color: #a855f7; border: 1px solid rgba(168, 85, 247, 0.3);"
    };
  } else {
    return {
      type: "Physical",
      badgeClass: "badge-physical",
      icon: "fa-box",
      badgeStyle: "background: rgba(59, 130, 246, 0.15); color: #3b82f6; border: 1px solid rgba(59, 130, 246, 0.3);"
    };
  }
};

// ── Load & Render Orders ───────────────────────────────────
window.loadOrders = async function () {
  const tbody = document.getElementById("orders-list-body");
  const countSpan = document.getElementById("orders-table-count");
  const searchInput = document.getElementById("orders-search");
  const pageSizeSelect = document.getElementById("orders-page-size");
  if (!tbody) return;

  if (pageSizeSelect) ordersPageSize = parseInt(pageSizeSelect.value) || 10;

  const realOrders = await window.getAdminOrdersList();
  let filtered = [...realOrders];

  const query = searchInput ? searchInput.value.toLowerCase().trim() : "";
  if (query) {
    filtered = filtered.filter(o => {
      const orderIdStr = String(o.orderNumber || o.orderId || o.id || "").toLowerCase();
      const custStr = (o.customer?.name || o.customer?.username || (o.customerId ? 'Registered User' : (o.guestName || 'Guest'))).toLowerCase();
      const itemStr = (o.items && o.items[0] ? (o.items[0].productName || o.items[0].name || "") : "").toLowerCase();
      const statusStr = (o.status || "").toLowerCase();
      return orderIdStr.includes(query) || custStr.includes(query) || itemStr.includes(query) || statusStr.includes(query);
    });
  }

  if (ordersCurrentStatus !== "all") {
    filtered = filtered.filter(o => {
      const st = (o.status || "").toLowerCase();
      const target = ordersCurrentStatus.toLowerCase();
      return st.includes(target);
    });
  }

  filtered.sort((a, b) => {
    let valA, valB;
    if (ordersSortColumn === 'id') {
      valA = a.orderNumber || a.orderId || String(a.id);
      valB = b.orderNumber || b.orderId || String(b.id);
    } else if (ordersSortColumn === 'total') {
      valA = a.total != null ? Number(a.total) : Number(a.grandTotal || a.amount || 0);
      valB = b.total != null ? Number(b.total) : Number(b.grandTotal || b.amount || 0);
    } else {
      valA = new Date(a.createdAt || a.date).getTime() || 0;
      valB = new Date(b.createdAt || b.date).getTime() || 0;
    }

    if (valA < valB) return ordersSortAsc ? -1 : 1;
    if (valA > valB) return ordersSortAsc ? 1 : -1;
    return 0;
  });

  const totalItems = filtered.length;
  const totalPages = Math.ceil(totalItems / ordersPageSize) || 1;
  if (ordersCurrentPage > totalPages) ordersCurrentPage = 1;

  const startIdx = (ordersCurrentPage - 1) * ordersPageSize;
  const endIdx = Math.min(startIdx + ordersPageSize, totalItems);
  const paginated = filtered.slice(startIdx, endIdx);

  if (countSpan) {
    countSpan.textContent = totalItems === 0 ? "Showing 0 entries" : `Showing ${startIdx + 1} - ${endIdx} of ${totalItems} entries`;
  }

  window.renderPagination("orders-page-controls", totalItems, ordersCurrentPage, ordersPageSize, "window.changeOrdersPage");

  if (paginated.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: #94a3b8; padding: 24px;">No customer orders found.</td></tr>`;
    return;
  }

  tbody.innerHTML = paginated.map(o => {
    const id = o.orderId || o.id;
    const firstItem = (o.items && o.items[0]) ? o.items[0] : { name: "SenpaiWorks Item", img: "assets/Videos/SenpaiWorks logo.png" };
    const typeInfo = window.getOrderTypeInfo(o);
    
    let payment = "Razorpay Gateway";
    if (o.paymentId && o.paymentId.startsWith("COD")) {
      payment = "Cash on Delivery";
    } else if (o.paymentGateway) {
      payment = o.paymentGateway;
    } else if (o.paymentId) {
      payment = o.paymentId;
    }
    
    const amount = o.total != null ? `₹${Number(o.total).toLocaleString('en-IN')}.00` : (o.grandTotal ? `₹${Number(o.grandTotal).toLocaleString('en-IN')}.00` : (o.amount || "₹1,499.00"));
    const status = o.status || (typeInfo.type === "Digital" ? "Delivered" : "Processing");
    const customerName = o.customer?.name || o.customer?.username || (o.customerId ? (o.customer?.email || 'Registered User') : (o.guestName || 'Guest'));
    const isGuestStr = o.customerId ? "Registered" : "Guest";
    const badgeColor = o.customerId ? 'rgba(56, 189, 248, 0.2); color:#38bdf8' : 'rgba(245, 158, 11, 0.2); color:#f59e0b';

    const pName = firstItem.productName || firstItem.name || "SenpaiWorks Item";
    const pImg = firstItem.productImage || firstItem.img || "assets/Videos/SenpaiWorks logo.png";
    const orderNumberStr = o.orderNumber || o.orderId || id;
    const realDate = o.createdAt ? new Date(o.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : (o.date || "Mon, 03 Aug 2026");

    return `
      <tr>
        <td>
          <div class="order-id-cell">
            <div class="order-id-header">
              <input type="checkbox" class="tbl-checkbox"> 
              <span class="order-number-text">#${orderNumberStr}</span>
            </div>
            <div style="display: flex; gap: 4px; flex-wrap: wrap; margin-top: 4px;">
              <span class="badge-order-type ${typeInfo.badgeClass}" style="${typeInfo.badgeStyle}; padding: 2px 6px; border-radius: 4px; font-size: 0.7rem; font-weight: 700; display: inline-flex; align-items: center; gap: 4px;">
                <i class="fa-solid ${typeInfo.icon}"></i> ${typeInfo.type}
              </span>
              ${o.isReplacementOrder ? '<div class="badge-replacement"><i class="fa-solid fa-rotate"></i> Replacement</div>' : ''}
              ${o.refundStatus ? `<div class="badge-refund-pending" style="background: rgba(239, 68, 68, 0.15); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3); padding: 2px 6px; border-radius: 4px; font-size: 0.7rem; font-weight: 700; display: inline-flex; align-items: center; gap: 4px;"><i class="fa-solid fa-hand-holding-dollar"></i> ${window.escapeHtml(o.refundStatus)}</div>` : ''}
            </div>
          </div>
        </td>
        <td>
          <div class="order-cust-cell">
            <img src="${pImg}" alt="${window.escapeHtml(pName)}" class="order-item-thumb">
            <div class="order-cust-info">
              <strong class="order-item-title">${window.escapeHtml(pName)} ${o.items && o.items.length > 1 ? `<span class="more-items-tag">(+${o.items.length - 1} more)</span>` : ''}</strong>
              <div class="order-user-tag">
                <span class="order-user-name"><i class="fa-solid fa-user"></i> ${window.escapeHtml(customerName)}</span>
                <span class="badge-user-type" style="background: ${badgeColor};">${isGuestStr}</span>
              </div>
            </div>
          </div>
        </td>
        <td><span class="order-date-text">${realDate}</span></td>
        <td>
          <span class="order-payment-text">${payment}</span>
          ${o.refundStatus ? `<div style="font-size: 0.72rem; color: #ef4444; font-weight: 700; margin-top: 2px;"><i class="fa-solid fa-hand-holding-dollar"></i> ${window.escapeHtml(o.refundStatus)}</div>` : ''}
        </td>
        <td><strong class="order-amount-text">${amount}</strong></td>
        <td>
          ${typeInfo.type === "Digital" ? `
            <div style="color: #06b6d4; font-weight: 700; font-size: 0.8rem; display: inline-flex; align-items: center; gap: 6px; background: rgba(6, 182, 212, 0.1); padding: 4px 10px; border-radius: 6px;">
              <i class="fa-solid fa-circle-check"></i> Fulfilled (Instant)
            </div>
          ` : `
            <select onchange="window.updateAdminOrderStatus('${id}', this.value)" class="order-status-select">
              <option value="Processing" ${status.includes('Processing') ? 'selected' : ''}>Processing</option>
              <option value="In Transit" ${status.includes('Transit') ? 'selected' : ''}>In Transit</option>
              <option value="Delivered" ${status.includes('Delivered') ? 'selected' : ''}>Delivered</option>
              <option value="Return Requested" ${status.includes('Return') ? 'selected' : ''}>Replacement Requested</option>
              <option value="Cancelled" ${status.includes('Cancel') ? 'selected' : ''}>Cancelled</option>
            </select>
          `}
        </td>
        <td>
          <button class="action-btn btn-edit btn-order-details" onclick="window.viewAdminOrderDetails('${id}')" title="View Full Order Details"><i class="fa-solid fa-eye"></i> Details</button>
        </td>
      </tr>
    `;
  }).join("");
};

// ── Update Order Status ────────────────────────────────────
window.updateAdminOrderStatus = async function (orderId, newStatus) {
  try {
    const order = (cachedOrdersList || []).find(o => String(o.id) === String(orderId) || String(o.orderNumber) === String(orderId));
    const typeInfo = order ? window.getOrderTypeInfo(order) : { type: "Physical" };

    if (typeInfo.type === "Digital" && (newStatus === "In Transit" || newStatus === "Shipped")) {
      window.showAdminToast("Digital orders are delivered instantly and do not require shipping/tracking.", "warning");
      window.loadOrders();
      return;
    }

    let bodyData = { status: newStatus };
    if (newStatus === "Shipped" || newStatus === "In Transit") {
      const awb = prompt(`Enter AWB / Tracking Number for order #${orderId} (optional):`);
      if (awb !== null && awb.trim() !== "") {
        bodyData.awbNumber = awb.trim();
      }
    }

    const res = await fetch(`/api/admin/orders/${orderId}/status`, {
      method: "PATCH",
      headers: window.getAdminTokenHeaders(),
      body: JSON.stringify(bodyData)
    });
    if (window.handleAdminResponse) window.handleAdminResponse(res);
    if (res.ok) {
      window.showAdminToast(`Order status updated to ${newStatus}`, "success");
      window.loadOrders();
    } else {
      window.showAdminToast("Failed to update order status", "danger");
    }
  } catch (e) {
    console.error(e);
    window.showAdminToast("Error updating order status", "danger");
  }
};

// ── View Order Details Modal ──────────────────────────────
window.viewAdminOrderDetails = async function (orderId) {
  let order = (cachedOrdersList || []).find(o => String(o.id) === String(orderId) || String(o.orderNumber) === String(orderId) || String(o.orderId) === String(orderId));
  if (!order) {
    const list = await window.getAdminOrdersList();
    order = (list || []).find(o => String(o.id) === String(orderId) || String(o.orderNumber) === String(orderId) || String(o.orderId) === String(orderId));
  }
  if (!order) return;

  const modal = document.getElementById("admin-order-details-modal");
  const body = document.getElementById("order-modal-body");
  const title = document.getElementById("order-modal-title");
  const typeInfo = window.getOrderTypeInfo(order);

  if (title) {
    title.innerHTML = `<i class="fa-solid fa-receipt"></i> Order #${order.orderNumber || order.orderId || order.id} <span style="${typeInfo.badgeStyle}; font-size: 0.72rem; padding: 2px 8px; border-radius: 4px; margin-left: 8px; vertical-align: middle;"><i class="fa-solid ${typeInfo.icon}"></i> ${typeInfo.type} Order</span>`;
  }

  let addressObj = {};
  if (order.shippingAddress) {
    try {
      addressObj = typeof order.shippingAddress === 'string' ? JSON.parse(order.shippingAddress) : order.shippingAddress;
    } catch (e) {
      addressObj = { address: order.shippingAddress };
    }
  } else if (order.address) {
    addressObj = typeof order.address === 'string' ? { address: order.address } : order.address;
  }
  const addressTxt = addressObj.address ? `${addressObj.firstName || ''} ${addressObj.lastName || ''}, ${addressObj.address || ''}, ${addressObj.city || ''}, ${addressObj.state || ''} ${addressObj.pincode || ''}` : "No Address Provided";

  const isGuest = order.customerId ? "Registered Customer" : "Guest User";
  const customerName = order.customer?.name || order.customer?.username || (order.customerId ? (order.customer?.email || 'Registered User') : (order.guestName || 'Guest'));
  const paymentStatus = order.paymentStatus || 'Pending';

  let paymentGateway = "Razorpay Gateway";
  if (order.paymentId && order.paymentId.startsWith("COD")) {
    paymentGateway = "Cash on Delivery";
  } else if (order.paymentGateway) {
    paymentGateway = order.paymentGateway;
  } else if (order.paymentId) {
    paymentGateway = order.paymentId;
  }

  let itemsHtml = "";
  (order.items || []).forEach(item => {
    const iName = item.productName || item.name || "Unknown Item";
    const iImg = item.productImage || item.img || "assets/Videos/SenpaiWorks logo.png";
    const iVar = item.variant || item.selectedVariant || item.size || 'Standard';
    const iQty = item.quantity || 1;
    const iPrice = item.price || 0;
    const iTotal = iQty * iPrice;
    const isDigitalItem = (item.product && item.product.type === "digital") || item.type === "digital";
    const downloadUrl = item.product?.downloadUrl || item.downloadUrl;

    itemsHtml += `
      <div class="order-detail-item-row">
        <div class="order-detail-item-left">
          <img src="${iImg}" class="order-detail-item-img">
          <div>
            <div class="order-detail-item-name">
              ${window.escapeHtml(iName)}
              ${isDigitalItem ? '<span class="badge-digital"><i class="fa-solid fa-cloud-arrow-down"></i> Digital</span>' : ''}
            </div>
            <div class="order-detail-item-var">${window.escapeHtml(iVar)} | Qty: ${iQty} • ₹${iPrice.toLocaleString('en-IN')}/ea</div>
            ${downloadUrl ? `<a href="${downloadUrl}" target="_blank" class="order-download-link"><i class="fa-solid fa-link"></i> Download Link</a>` : ''}
          </div>
        </div>
        <div class="order-detail-item-total">₹${iTotal.toLocaleString('en-IN')}</div>
      </div>
    `;
  });

  const subtotal = order.subtotal != null ? order.subtotal : (order.total || 0);
  const shipping = order.shippingFee || order.shipping || 0;
  const discount = order.discount || 0;
  const grandTotal = order.total != null ? order.total : (order.grandTotal || 0);
  const orderDate = new Date(order.createdAt || order.date).toLocaleString('en-IN');
  const orderStatus = order.status || (typeInfo.type === "Digital" ? "Delivered" : "Processing");

  if (body) {
    body.innerHTML = `
      <div class="order-modal-info-card">
        <div class="order-modal-info-header">
          <div>
            <div class="order-modal-section-title">Customer Info</div>
            <div class="order-modal-cust-name">
              ${window.escapeHtml(customerName)} 
              <span class="badge-guest-pill ${isGuest.includes('Guest') ? 'guest' : 'registered'}">${isGuest}</span>
            </div>
            <div class="order-modal-meta-line"><i class="fa-solid fa-envelope"></i> ${window.escapeHtml(order.email || order.guestEmail || order.customer?.email || 'N/A')}</div>
            <div class="order-modal-meta-line"><i class="fa-solid fa-phone"></i> ${window.escapeHtml(order.guestPhone || order.customer?.phone || addressObj.phone || 'N/A')}</div>
          </div>
          <div class="order-modal-status-col">
            <div class="order-modal-section-title">Order Status</div>
            <div class="order-modal-status-val">${orderStatus}</div>
            <div class="order-modal-date-val">${orderDate}</div>
          </div>
        </div>
        
        <div class="order-modal-shipping-block">
          <div class="order-modal-section-title">${typeInfo.type === "Digital" ? "Fulfillment Mode" : "Shipping Address"}</div>
          <div class="order-modal-address-txt">
            ${typeInfo.type === "Digital"
              ? '<span style="color: #06b6d4; font-weight: 600;"><i class="fa-solid fa-bolt"></i> Instant Digital Delivery (Files unlocked immediately upon payment)</span>'
              : window.escapeHtml(addressTxt)
            }
          </div>
        </div>
      </div>

      <div class="order-modal-info-card">
        <div class="order-modal-info-header">
          <div>
            <div class="order-modal-section-title">Payment Info</div>
            <div><strong>Gateway:</strong> ${paymentGateway}</div>
            <div class="order-modal-payment-id"><strong>ID:</strong> ${order.paymentId || 'N/A'}</div>
          </div>
          <div class="order-modal-status-col">
            <div class="order-modal-section-title">Status</div>
            <div class="order-modal-payment-status ${paymentStatus.toLowerCase() === 'paid' ? 'paid' : 'pending'}">
              <i class="fa-solid ${paymentStatus.toLowerCase() === 'paid' ? 'fa-check-circle' : 'fa-clock'}"></i> ${paymentStatus}
            </div>
            ${order.refundStatus ? `<div style="margin-top: 4px; font-size: 0.72rem; font-weight: 700; color: #ef4444;"><i class="fa-solid fa-hand-holding-dollar"></i> ${window.escapeHtml(order.refundStatus)}</div>` : ''}
          </div>
        </div>
      </div>

      <div class="order-modal-items-container">
        <div class="order-modal-section-title">Ordered Items</div>
        ${itemsHtml}
        
        <div class="order-modal-summary-card">
          <div class="order-modal-summary-row">
            <span>Subtotal</span>
            <span>₹${subtotal.toLocaleString('en-IN')}</span>
          </div>
          <div class="order-modal-summary-row">
            <span>Shipping Fee</span>
            <span>${shipping > 0 ? `₹${shipping.toLocaleString('en-IN')}` : 'Free / Instant'}</span>
          </div>
          <div class="order-modal-summary-row text-green">
            <span>Discount</span>
            <span>- ₹${discount.toLocaleString('en-IN')}</span>
          </div>
          <div class="order-modal-grand-total-row">
            <span>Grand Total</span>
            <span>₹${grandTotal.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>
    `;
  }

  if (modal) modal.style.display = "flex";
};

window.closeAdminOrderDetailsModal = function () {
  const modal = document.getElementById("admin-order-details-modal");
  if (modal) modal.style.display = "none";
};
