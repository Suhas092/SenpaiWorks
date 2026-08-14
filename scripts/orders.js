"use strict";

let allUserOrders = [];
let currentTabFilter = "all";
let activeModalOrderId = null;

document.addEventListener("DOMContentLoaded", () => {
  initOrdersDashboard();
});

function getOrders() {
  let list = [];
  try {
    const raw = localStorage.getItem("user_orders") || localStorage.getItem("userOrdersList") || localStorage.getItem("userOrders");
    if (raw) list = JSON.parse(raw);
  } catch (e) { list = []; }

  if (!list || list.length === 0) {
    list = [
      {
        orderId: "ORD-105010",
        id: "ORD-105010",
        date: "03 Aug 2026",
        total: 1499,
        grandTotal: 1499,
        status: "Delivered",
        paymentType: "Razorpay Official Gateway",
        customerName: "Suhas H",
        email: "suhash092@gmail.com",
        phone: "+91 99022 15010",
        address: "05, 3rd Main Road, near lakshmi medical, MYSURU, KARNATAKA 570016, India",
        items: [
          {
            id: "kaneki-bw-tshirt",
            name: "Ken Kaneki Tokyo Ghoul B&W Edition T-Shirt",
            price: 1499,
            quantity: 1,
            variant: "Oversized / Black",
            img: "assets/Store/Tshirts/Black and white kaneki tshirts/kaneki_bw_black_tshirt.jpg"
          }
        ]
      },
      {
        orderId: "ORD-104980",
        id: "ORD-104980",
        date: "28 Jul 2026",
        total: 1499,
        grandTotal: 1499,
        status: "Processing",
        paymentType: "UPI / PhonePe",
        customerName: "Suhas H",
        email: "suhash092@gmail.com",
        phone: "+91 99022 15010",
        address: "05, 3rd Main Road, near lakshmi medical, MYSURU, KARNATAKA 570016, India",
        items: [
          {
            id: "itachi-colored-tshirt",
            name: "Itachi Uchiha Duo Graphic Colored T-Shirt",
            price: 1499,
            quantity: 1,
            variant: "Oversized / Black",
            img: "assets/Store/Tshirts/Colored itachi tshirts/itachi_black_tshirt_colored.jpg"
          }
        ]
      }
    ];
    localStorage.setItem("user_orders", JSON.stringify(list));
  }
  return list;
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
  const defaultUserName = currentUser ? (currentUser.name || currentUser.username) : "Suhas H";

  let html = "";

  ordersToRender.forEach(order => {
    const orderId = order.orderId || order.id || ("ORD-" + Math.floor(100000 + Math.random() * 900000));
    const orderDate = order.date || "Mon, 03 Aug 2026";
    const orderTotal = order.grandTotal || order.total || 0;
    const orderStatus = order.status || "Processing";
    const orderItems = order.items || [];
    const shippingAddress = typeof order.address === 'string' ? order.address : (order.address ? `${order.address.firstName || ''} ${order.address.lastName || ''}, ${order.address.address || ''}, ${order.address.city || ''}` : `${defaultUserName}, Indiranagar, Bengaluru`);

    let statusBadgeHtml = `<span class="order-status-badge status-processing"><i class="fa-solid fa-arrows-rotate"></i> Processing</span>`;
    if (orderStatus.toLowerCase().includes("deliver")) {
      statusBadgeHtml = `<span class="order-status-badge status-delivered"><i class="fa-solid fa-circle-check"></i> Delivered</span>`;
    } else if (orderStatus.toLowerCase().includes("transit") || orderStatus.toLowerCase().includes("ship")) {
      statusBadgeHtml = `<span class="order-status-badge status-shipped"><i class="fa-solid fa-truck"></i> In Transit</span>`;
    } else if (orderStatus.toLowerCase().includes("return")) {
      statusBadgeHtml = `<span class="order-status-badge status-returned"><i class="fa-solid fa-rotate-left"></i> ${orderStatus}</span>`;
    }

    let itemsHtml = "";
    orderItems.forEach(item => {
      itemsHtml += `
        <div class="order-card-item-row">
          <img src="${item.img || 'assets/Videos/SenpaiWorks logo.png'}" alt="${item.name}" class="order-card-item-img">
          <div class="order-card-item-info">
            <div class="order-card-item-title">${item.name}</div>
            <div class="order-card-item-meta">Size / Variant: ${item.size || item.variant || 'Standard Edition'} | Qty: ${item.quantity || 1}</div>
            <div class="order-card-item-price">₹${((item.price || 0) * (item.quantity || 1)).toLocaleString()}.00</div>
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
            <a href="order-confirmation.html?orderId=${orderId}" class="link-view-receipt">View Receipt &rarr;</a>
          </div>
        </div>

        <div class="order-card-body">
          <div class="order-card-status-row">
            ${statusBadgeHtml}
            <span class="order-est-delivery"><i class="fa-regular fa-clock"></i> Delivery Status: ${orderStatus}</span>
          </div>

          <div class="order-card-items-wrap">
            ${itemsHtml}
          </div>
        </div>

        <div class="order-card-footer" style="display: flex; gap: 10px; flex-wrap: wrap;">
          <button onclick="openTrackModal('${orderId}')" class="btn-order-action primary">
            <i class="fa-solid fa-truck-fast"></i> Track Package
          </button>

          <button onclick="openReturnModal('${orderId}')" class="btn-order-action secondary">
            <i class="fa-solid fa-rotate-left"></i> Replace Items
          </button>

          <button onclick="openFeedbackModal('${orderId}')" class="btn-order-action outline" style="border: 1.5px solid #0284c7; color: #0284c7;">
            <i class="fa-solid fa-star"></i> Leave Feedback
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
  } else {
    const filtered = allUserOrders.filter(o => {
      const st = (o.status || "").toLowerCase();
      if (tabName === "open") return st.includes("process") || st.includes("transit") || st.includes("ship");
      if (tabName === "buy-again") return st.includes("deliver");
      if (tabName === "not-shipped") return st.includes("process");
      if (tabName === "cancelled") return st.includes("cancel") || st.includes("return");
      return true;
    });
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
  if (awb) awb.textContent = `SW-TRK-${Math.floor(100000 + Math.random() * 900000)}`;

  if (modal) {
    modal.style.display = "flex !important";
    modal.classList.add("active");
  }
};

window.closeTrackModal = function() {
  const modal = document.getElementById("track-modal");
  if (modal) {
    modal.classList.remove("active");
    modal.style.display = "none !important";
  }
};

// Replacement item modal
window.openReturnModal = function(orderId) {
  activeModalOrderId = orderId;
  const modal = document.getElementById("return-modal");
  const idTxt = document.getElementById("return-order-id-txt");
  if (idTxt) idTxt.textContent = `#${orderId}`;

  if (modal) {
    modal.style.display = "flex !important";
    modal.classList.add("active");
  }
};

window.closeReturnModal = function() {
  const modal = document.getElementById("return-modal");
  if (modal) {
    modal.classList.remove("active");
    modal.style.display = "none !important";
  }
};

window.handleReturnSubmit = function(e) {
  if (e) e.preventDefault();
  const reasonSelect = document.getElementById("return-reason-select");
  const resolutionSelect = document.getElementById("return-resolution-select");
  const commentsTxt = document.getElementById("return-comments-text");

  const reason = reasonSelect ? reasonSelect.value : "Item Defective / Damaged";
  const resolution = resolutionSelect ? resolutionSelect.value : "replacement";
  const notes = commentsTxt ? commentsTxt.value.trim() : "";

  let orders = getOrders();
  const orderIdx = orders.findIndex(o => (o.orderId || o.id) === activeModalOrderId);
  if (orderIdx !== -1) {
    orders[orderIdx].status = "Replacement Requested (Pending Review)";
    orders[orderIdx].returnRequest = {
      reason,
      resolution,
      notes,
      date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
      status: "Pending Review"
    };

    localStorage.setItem("user_orders", JSON.stringify(orders));
    localStorage.setItem("userOrdersList", JSON.stringify(orders));
    localStorage.setItem("userOrders", JSON.stringify(orders));
    allUserOrders = orders;
  }

  alert(`Replacement request submitted for Order #${activeModalOrderId || 'ORD-105010'}!\nIt will now reflect in your Account and on the Admin Control Dashboard.`);
  window.closeReturnModal();
  renderOrdersList(allUserOrders);
};

// Feedback Modal Handlers
window.openFeedbackModal = function(orderId) {
  activeModalOrderId = orderId;
  const modal = document.getElementById("feedback-modal");
  if (modal) {
    modal.style.display = "flex !important";
    modal.classList.add("active");
  }
};

window.closeFeedbackModal = function() {
  const modal = document.getElementById("feedback-modal");
  if (modal) {
    modal.classList.remove("active");
    modal.style.display = "none !important";
  }
};

window.handleFeedbackSubmit = function(e) {
  if (e) e.preventDefault();
  const rating = document.getElementById("feedback-rating") ? document.getElementById("feedback-rating").value : "5";
  const category = document.getElementById("feedback-category") ? document.getElementById("feedback-category").value : "Product Quality";
  const comments = document.getElementById("feedback-comments") ? document.getElementById("feedback-comments").value : "";

  const currentUser = getCurrentUser();
  const userEmail = currentUser ? currentUser.email : "suhash092@gmail.com";
  const userName = currentUser ? (currentUser.name || currentUser.username) : "Suhas H";

  let feedbackList = [];
  try {
    const raw = localStorage.getItem("customer_feedback_list");
    if (raw) feedbackList = JSON.parse(raw);
  } catch (err) { feedbackList = []; }

  feedbackList.unshift({
    id: "FB-" + Math.floor(1000 + Math.random() * 9000),
    orderId: activeModalOrderId || "ORD-105010",
    user: userName,
    email: userEmail,
    rating: "★".repeat(parseInt(rating)) + ` (${rating}.0)`,
    category,
    text: comments,
    topic: category,
    date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
    status: "Approved"
  });

  localStorage.setItem("customer_feedback_list", JSON.stringify(feedbackList));

  closeFeedbackModal();
  alert("Thank you! Your feedback has been submitted successfully and sent to Admin Control.");
};

// Buy it again
window.buyAgain = function(orderId) {
  const order = allUserOrders.find(o => (o.orderId || o.id) === orderId) || (allUserOrders.length > 0 ? allUserOrders[0] : null);
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
