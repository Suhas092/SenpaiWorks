"use strict";

let allUserOrders = [];
let currentTabFilter = "all";
let activeModalOrderId = null;

document.addEventListener("DOMContentLoaded", () => {
  initOrdersDashboard();
});

function getOrders() {
  const orders = localStorage.getItem("userOrders");
  return orders ? JSON.parse(orders) : [];
}

function getCurrentUser() {
  const user = localStorage.getItem("currentUser");
  return user ? JSON.parse(user) : null;
}

function initOrdersDashboard() {
  allUserOrders = getOrders();
  renderOrdersList(allUserOrders);
}

function renderOrdersList(ordersToRender) {
  const container = document.getElementById("orders-history-list");
  if (!container) return;

  if (!ordersToRender || ordersToRender.length === 0) {
    container.innerHTML = `
      <div class="orders-empty-state">
        <div class="empty-icon"><i class="fa-solid fa-box-open"></i></div>
        <h3>No Orders Found</h3>
        <p>Looks like you haven't placed any orders matching this category yet.</p>
        <a href="store.html" class="btn-view-order">
          <i class="fa-solid fa-bag-shopping"></i> Continue Shopping
        </a>
      </div>
    `;
    return;
  }

  const currentUser = getCurrentUser();
  const defaultUserName = currentUser ? currentUser.username : "Suhas Senpai";

  let html = "";

  ordersToRender.forEach(order => {
    const orderId = order.id || ("ORD-" + Math.floor(100000 + Math.random() * 900000));
    const orderDate = order.date || "Mon, 27 Jul 2026";
    const orderTotal = order.total || 0;
    const orderStatus = order.status || "Processing";
    const orderItems = order.items || [];
    const shippingAddress = order.address || `${defaultUserName}, SenpaiWorks Studio, Indiranagar, Bengaluru`;

    // Status badge style
    let statusBadgeHtml = `<span class="order-status-badge status-processing"><i class="fa-solid fa-arrows-rotate"></i> Processing</span>`;
    if (orderStatus.toLowerCase().includes("deliver")) {
      statusBadgeHtml = `<span class="order-status-badge status-delivered"><i class="fa-solid fa-circle-check"></i> Delivered</span>`;
    } else if (orderStatus.toLowerCase().includes("transit") || orderStatus.toLowerCase().includes("ship")) {
      statusBadgeHtml = `<span class="order-status-badge status-shipped"><i class="fa-solid fa-truck"></i> In Transit</span>`;
    } else if (orderStatus.toLowerCase().includes("return")) {
      statusBadgeHtml = `<span class="order-status-badge status-returned"><i class="fa-solid fa-rotate-left"></i> Return Requested</span>`;
    }

    let itemsHtml = "";
    orderItems.forEach(item => {
      itemsHtml += `
        <div class="order-card-item-row">
          <img src="${item.img || 'assets/Videos/SenpaiWorks logo.png'}" alt="${item.name}" class="order-card-item-img">
          <div class="order-card-item-info">
            <div class="order-card-item-title">${item.name}</div>
            <div class="order-card-item-meta">Size / Variant: ${item.size || item.variant || 'Standard Edition'} | Qty: ${item.quantity}</div>
            <div class="order-card-item-price">₹${(item.price * item.quantity).toLocaleString()}.00</div>
          </div>
          <div class="order-card-item-actions">
            <button onclick="buyAgain('${orderId}')" class="btn-order-action outline">
              <i class="fa-solid fa-rotate"></i> Buy it again
            </button>
          </div>
        </div>
      `;
    });

    html += `
      <div class="order-history-card">
        <div class="order-card-header">
          <div class="order-header-meta-group">
            <div>
              <div class="meta-label">ORDER PLACED</div>
              <div class="meta-val">${orderDate}</div>
            </div>
            <div>
              <div class="meta-label">TOTAL</div>
              <div class="meta-val">₹${orderTotal.toLocaleString()}.00</div>
            </div>
            <div>
              <div class="meta-label">SHIP TO</div>
              <div class="meta-val" title="${shippingAddress}">${defaultUserName}</div>
            </div>
          </div>

          <div class="order-header-right">
            <div class="meta-label">ORDER # ${orderId}</div>
            <a href="order-confirmation.html" class="link-view-receipt">View Receipt &rarr;</a>
          </div>
        </div>

        <div class="order-card-body">
          <div class="order-card-status-row">
            ${statusBadgeHtml}
            <span class="order-est-delivery"><i class="fa-regular fa-clock"></i> Estimated Delivery: 3-5 Business Days</span>
          </div>

          <div class="order-card-items-wrap">
            ${itemsHtml}
          </div>
        </div>

        <div class="order-card-footer">
          <button onclick="openTrackModal('${orderId}')" class="btn-order-action primary">
            <i class="fa-solid fa-truck-fast"></i> Track Package
          </button>

          <button onclick="openReturnModal('${orderId}')" class="btn-order-action secondary">
            <i class="fa-solid fa-rotate-left"></i> Return or Replace Items
          </button>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}

// Filter tabs
window.filterOrders = function(tabName) {
  currentTabFilter = tabName;

  const tabBtns = document.querySelectorAll(".order-tab-btn");
  tabBtns.forEach(btn => {
    if (btn.getAttribute("data-tab") === tabName) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  });

  if (tabName === "all") {
    renderOrdersList(allUserOrders);
  } else if (tabName === "processing") {
    const filtered = allUserOrders.filter(o => !o.status || o.status.toLowerCase().includes("process") || o.status.toLowerCase().includes("ship") || o.status.toLowerCase().includes("transit"));
    renderOrdersList(filtered);
  } else if (tabName === "delivered") {
    const filtered = allUserOrders.filter(o => o.status && o.status.toLowerCase().includes("deliver"));
    renderOrdersList(filtered);
  } else if (tabName === "returned") {
    const filtered = allUserOrders.filter(o => o.status && o.status.toLowerCase().includes("return"));
    renderOrdersList(filtered);
  }
};

// Search orders
window.searchOrders = function() {
  const query = document.getElementById("order-search-input").value.trim().toLowerCase();
  if (!query) {
    window.filterOrders(currentTabFilter);
    return;
  }

  const filtered = allUserOrders.filter(order => {
    const idMatch = (order.id || "").toLowerCase().includes(query);
    const itemMatch = (order.items || []).some(item => (item.name || "").toLowerCase().includes(query));
    return idMatch || itemMatch;
  });

  renderOrdersList(filtered);
};

// Track package modal
window.openTrackModal = function(orderId) {
  activeModalOrderId = orderId;
  const modal = document.getElementById("track-modal");
  const title = document.getElementById("track-order-id-title");
  const awb = document.getElementById("track-awb-val");

  if (title) title.textContent = `Tracking Order #${orderId}`;
  if (awb) awb.textContent = `BD-${Math.floor(100000000 + Math.random() * 900000000)}`;

  if (modal) modal.classList.add("active");
};

window.closeTrackModal = function() {
  const modal = document.getElementById("track-modal");
  if (modal) modal.classList.remove("active");
};

// Return item modal
window.openReturnModal = function(orderId) {
  activeModalOrderId = orderId;
  const modal = document.getElementById("return-modal");
  const idTxt = document.getElementById("return-order-id-txt");
  if (idTxt) idTxt.textContent = `#${orderId}`;

  if (modal) modal.classList.add("active");
};

window.closeReturnModal = function() {
  const modal = document.getElementById("return-modal");
  if (modal) modal.classList.remove("active");
};

window.handleReturnSubmit = function(e) {
  if (e) e.preventDefault();
  const reason = document.getElementById("return-reason-select").value;
  const resolution = document.getElementById("return-resolution-select").value;

  if (!reason) {
    alert("Please select a reason for your return request.");
    return;
  }

  // Update order status in localStorage
  let orders = getOrders();
  const orderIdx = orders.findIndex(o => o.id === activeModalOrderId);
  if (orderIdx !== -1) {
    orders[orderIdx].status = "Return Requested";
    localStorage.setItem("userOrders", JSON.stringify(orders));
    allUserOrders = orders;
  } else if (allUserOrders.length > 0) {
    allUserOrders[0].status = "Return Requested";
    localStorage.setItem("userOrders", JSON.stringify(allUserOrders));
  }

  alert(`Return request submitted successfully for Order #${activeModalOrderId || 'ORD-105010'}!\nWe will send a pickup confirmation email within 24 hours.`);
  window.closeReturnModal();
  renderOrdersList(allUserOrders);
};

// Buy it again
window.buyAgain = function(orderId) {
  const order = allUserOrders.find(o => o.id === orderId) || (allUserOrders.length > 0 ? allUserOrders[0] : null);
  if (!order || !order.items || order.items.length === 0) {
    alert("Re-added item to shopping cart!");
    return;
  }

  let cart = localStorage.getItem("shoppingCart");
  cart = cart ? JSON.parse(cart) : [];

  order.items.forEach(item => {
    const existing = cart.find(c => c.id === item.id || c.name === item.name);
    if (existing) {
      existing.quantity += item.quantity || 1;
    } else {
      cart.push({ ...item });
    }
  });

  localStorage.setItem("shoppingCart", JSON.stringify(cart));
  alert("Items added back to your Shopping Cart! Redirecting to Store...");
  window.location.href = "store.html";
};
