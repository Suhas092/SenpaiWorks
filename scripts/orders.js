    "use strict";

let allUserOrders = [];
let currentTabFilter = "all";
let activeModalOrderId = null;
let activeModalOrderDbId = null;

document.addEventListener("DOMContentLoaded", () => {
  initOrdersDashboard();
});

async function getOrders() {
  try {
    const token = localStorage.getItem("userToken");
    if (!token) return [];
    const res = await fetch("/api/orders", {
      headers: { "Authorization": `Bearer ${token}` }
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data;
  } catch (e) {
    console.error("Failed to fetch orders:", e);
    return [];
  }
}

function getCurrentUser() {
  const user = localStorage.getItem("currentUser");
  return user ? JSON.parse(user) : null;
}

let userReviewedProductIds = new Set();

async function initOrdersDashboard() {
  const token = localStorage.getItem("userToken") || sessionStorage.getItem("userToken");
  if (token) {
    try {
      const revRes = await fetch('/api/users/me/reviews', {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (revRes.ok) {
        const revData = await revRes.json();
        if (revData.reviews) {
          userReviewedProductIds = new Set(revData.reviews.map(r => r.productId));
        }
      }
    } catch (e) {
      console.warn("Failed to fetch user reviews cache:", e);
    }
  }

  allUserOrders = await getOrders();
  window.allUserOrders = allUserOrders;
  renderOrdersList(allUserOrders);
  updateOrdersNavBadge(allUserOrders);
}

function updateOrdersNavBadge(orders) {
  const navOrdersCount = document.getElementById("nav-orders-count");
  if (!navOrdersCount) return;

  const pendingOrders = (orders || []).filter(o => {
    const st = (o.status || "").toLowerCase();
    const isCancelled = st.includes("cancel");
    const isDelivered = st.includes("deliver");

    // Check for active replacement request (Requested or Approved)
    const hasActiveReplacement = (o.replacements || []).some(r => r.status === "Requested" || r.status === "Approved");
    if (hasActiveReplacement) return true;

    // If order is delivered or cancelled, it is NOT pending delivery
    if (isDelivered || isCancelled) return false;

    // Processing, shipped, in-transit, etc.
    return true;
  });

  const count = pendingOrders.length;
  if (count > 0) {
    navOrdersCount.textContent = count;
    navOrdersCount.style.display = "inline-block";
  } else {
    navOrdersCount.textContent = "0";
    navOrdersCount.style.display = "none";
  }
}

let ordersCurrentPage = 1;
const ORDERS_PER_PAGE = 10;
let currentRenderedOrders = [];

window.changeOrdersPage = function (delta) {
  ordersCurrentPage += delta;
  if (ordersCurrentPage < 1) ordersCurrentPage = 1;
  renderOrdersList(currentRenderedOrders, false);
  const container = document.getElementById("orders-history-list");
  if (container) {
    container.scrollIntoView({ behavior: "smooth", block: "start" });
  }
};

function renderOrdersList(ordersToRender, resetPage = true) {
  if (resetPage) {
    ordersCurrentPage = 1;
  }
  currentRenderedOrders = ordersToRender || [];

  const container = document.getElementById("orders-history-list");
  const paginationDiv = document.getElementById("orders-pagination");
  const pageInfoEl = document.getElementById("orders-page-info");
  const btnPrev = document.getElementById("btn-prev-orders");
  const btnNext = document.getElementById("btn-next-orders");

  if (!container) return;

  if (!ordersToRender || ordersToRender.length === 0) {
    if (paginationDiv) paginationDiv.style.display = "none";
    let emptyTitle = "No Orders Found";
    let emptyMsg = "Looks like you haven't placed any orders matching this category yet.";
    let iconClass = "fa-box-open";

    if (currentTabFilter === "buy-again") {
      emptyTitle = "No Reorderable Items Found";
      emptyMsg = "Physical merchandise from your delivered orders will appear here for easy 1-click reordering.";
      iconClass = "fa-rotate";
    } else if (currentTabFilter === "not-shipped" || currentTabFilter === "processing") {
      emptyTitle = "No Unshipped Orders";
      emptyMsg = "You currently have no orders waiting to be shipped.";
      iconClass = "fa-box-open";
    }

    container.innerHTML = `
      <div class="orders-empty-state">
        <div class="empty-icon"><i class="fa-solid ${iconClass}"></i></div>
        <h3>${emptyTitle}</h3>
        <p>${emptyMsg}</p>
        <a href="store.html" class="btn-view-order">
          <i class="fa-solid fa-bag-shopping"></i> Continue Shopping
        </a>
      </div>
    `;
    return;
  }

  // =========================================================================
  // BUY AGAIN: DEDICATED PRODUCT CARD GRID (AMAZON STYLE)
  // =========================================================================
  if (currentTabFilter === "buy-again") {
    const buyAgainItems = [];
    ordersToRender.forEach(order => {
      const orderId = order.orderNumber || order.orderId || order.id || ("ORD-" + Math.floor(100000 + Math.random() * 900000));
      let orderDate = "";
      if (order.date && !order.date.toLowerCase().includes("delivered") && !order.date.toLowerCase().includes("order")) {
        orderDate = order.date;
      } else if (order.createdAt) {
        orderDate = new Date(order.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
      }
      const orderItems = order.items || [];
      orderItems.forEach(item => {
        const isDigital = (item.product && item.product.type === "digital") || item.type === "digital";
        if (!isDigital) {
          buyAgainItems.push({
            ...item,
            orderId,
            orderDate
          });
        }
      });
    });

    if (buyAgainItems.length === 0) {
      if (paginationDiv) paginationDiv.style.display = "none";
      container.innerHTML = `
        <div class="orders-empty-state">
          <div class="empty-icon"><i class="fa-solid fa-rotate"></i></div>
          <h3>No Reorderable Items Found</h3>
          <p>Physical merchandise from your delivered orders will appear here for easy 1-click reordering.</p>
          <a href="store.html" class="btn-view-order">
            <i class="fa-solid fa-bag-shopping"></i> Continue Shopping
          </a>
        </div>
      `;
      return;
    }

    // Pagination for Buy Again items (10 per page)
    const totalItems = buyAgainItems.length;
    const startIdx = (ordersCurrentPage - 1) * ORDERS_PER_PAGE + 1;
    const endIdx = Math.min(ordersCurrentPage * ORDERS_PER_PAGE, totalItems);
    const paginatedItems = buyAgainItems.slice((ordersCurrentPage - 1) * ORDERS_PER_PAGE, ordersCurrentPage * ORDERS_PER_PAGE);

    if (paginationDiv) {
      paginationDiv.style.display = totalItems > 0 ? "flex" : "none";
      if (pageInfoEl) pageInfoEl.textContent = `${startIdx}–${endIdx} of ${totalItems}`;
      if (btnPrev) {
        btnPrev.disabled = ordersCurrentPage <= 1;
        btnPrev.style.opacity = ordersCurrentPage <= 1 ? "0.4" : "1";
        btnPrev.style.cursor = ordersCurrentPage <= 1 ? "default" : "pointer";
      }
      if (btnNext) {
        const hasMore = endIdx < totalItems;
        btnNext.disabled = !hasMore;
        btnNext.style.opacity = !hasMore ? "0.4" : "1";
        btnNext.style.cursor = !hasMore ? "default" : "pointer";
      }
    }

    let gridHtml = `<div class="buy-again-grid">`;
    paginatedItems.forEach(item => {
      const pId = item.productId || item.id;
      const detailHref = pId ? `store-detail.html?id=${encodeURIComponent(pId)}` : '#';
      const cardElementId = `order-item-${item.orderId}-${item.id || item.productId || ''}`;
      const imgUrl = item.img || item.image || item.productImage || (item.product && item.product.image) || 'assets/Videos/SenpaiWorks logo.png';
      const titleText = item.productName || item.name || (item.product && (item.product.name || item.product.title)) || 'SenpaiWorks Product';
      
      const priceVal = Number(item.price) || 849;
      let origVal = item.originalPrice || (item.product && item.product.originalPrice);
      if (!origVal && window.PRODUCTS && window.PRODUCTS.length > 0) {
        const catalogProd = window.PRODUCTS.find(p => p.id === pId || p.name === titleText);
        if (catalogProd && catalogProd.originalPrice) {
          origVal = catalogProd.originalPrice;
        }
      }
      if (!origVal || origVal <= priceVal) {
        origVal = Math.round(priceVal * 1.6);
      }
      const discountPct = Math.round(((origVal - priceVal) / origVal) * 100);

      gridHtml += `
        <div class="buy-again-card" id="${cardElementId}" data-order-id="${item.orderId}" data-item-id="${item.id || item.productId || ''}" data-product-id="${pId || ''}">
          <div>
            <a href="${detailHref}" class="buy-again-img-wrap">
              <img src="${imgUrl}" alt="${titleText}" class="buy-again-img">
            </a>
            <a href="${detailHref}" class="buy-again-title" title="${titleText}">
              ${titleText}
            </a>
            <div class="buy-again-price-row">
              <span class="buy-again-price">₹${priceVal.toLocaleString('en-IN')}</span>
              <span class="buy-again-orig-price">₹${origVal.toLocaleString('en-IN')}</span>
              <span class="buy-again-discount-badge">${discountPct}% OFF</span>
            </div>
            ${item.orderDate ? `
              <div class="buy-again-last-purchased">
                <i class="fa-solid fa-clock-rotate-left"></i> Purchased on ${item.orderDate}
              </div>
            ` : ''}
          </div>
          <div>
            <button onclick="addToCartFromBuyAgain('${item.orderId}', '${item.id || item.productId || ''}')" class="buy-again-add-btn">
              <i class="fa-solid fa-cart-shopping"></i> Add to cart
            </button>
          </div>
        </div>
      `;
    });
    gridHtml += `</div>`;
    container.innerHTML = gridHtml;
    return;
  }

  // =========================================================================
  // STANDARD ORDERS RECEIPT LIST (Orders, Not Yet Shipped)
  // =========================================================================
  const totalOrders = ordersToRender.length;
  const startIdx = (ordersCurrentPage - 1) * ORDERS_PER_PAGE + 1;
  const endIdx = Math.min(ordersCurrentPage * ORDERS_PER_PAGE, totalOrders);
  const paginatedOrders = ordersToRender.slice((ordersCurrentPage - 1) * ORDERS_PER_PAGE, ordersCurrentPage * ORDERS_PER_PAGE);

  if (paginationDiv) {
    paginationDiv.style.display = totalOrders > 0 ? "flex" : "none";
    if (pageInfoEl) pageInfoEl.textContent = `${startIdx}–${endIdx} of ${totalOrders}`;
    if (btnPrev) {
      btnPrev.disabled = ordersCurrentPage <= 1;
      btnPrev.style.opacity = ordersCurrentPage <= 1 ? "0.4" : "1";
      btnPrev.style.cursor = ordersCurrentPage <= 1 ? "default" : "pointer";
    }
    if (btnNext) {
      const hasMore = endIdx < totalOrders;
      btnNext.disabled = !hasMore;
      btnNext.style.opacity = !hasMore ? "0.4" : "1";
      btnNext.style.cursor = !hasMore ? "default" : "pointer";
    }
  }

  const currentUser = getCurrentUser();
  const defaultUserName = currentUser ? (currentUser.name || currentUser.username) : "Suhas H";

  let html = "";

  paginatedOrders.forEach(order => {
    const orderId = order.orderNumber || order.orderId || order.id || ("ORD-" + Math.floor(100000 + Math.random() * 900000));
    const orderDate = order.date || "Mon, 03 Aug 2026";
    const orderTotal = order.grandTotal || order.total || 0;
    const orderStatus = order.status || "Processing";
    const orderItems = order.items || [];
    const addrObj = getOrderAddressObj(order);
    const resolvedCustomerName = (addrObj && (addrObj.firstName || addrObj.fullName))
      ? `${addrObj.firstName || ''} ${addrObj.lastName || ''}`.trim() || addrObj.fullName
      : (order.guestName || (order.customer ? (order.customer.name || order.customer.username) : defaultUserName));

    const shippingAddress = addrObj
      ? [addrObj.address || addrObj.street || addrObj.flat, addrObj.city, addrObj.state, addrObj.pincode].filter(Boolean).join(", ")
      : (typeof order.address === 'string' ? order.address : `${defaultUserName}, Indiranagar, Bengaluru`);

    const hasPhysicalItems = orderItems.some(i => (i.product && i.product.type !== "digital") || (!i.product && i.type !== "digital"));
    const isDigitalOnlyOrder = orderItems.length > 0 && !hasPhysicalItems;

    // Delivery date text formatting
    let deliveryDateStr = "";
    if (order.deliveredAt) {
      const d = new Date(order.deliveredAt);
      deliveryDateStr = !isNaN(d.getTime()) ? d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' }) : "24 August";
    } else if (order.date) {
      const dMatch = String(order.date).match(/(\d{1,2}\s+[A-Za-z]+)/);
      deliveryDateStr = dMatch ? dMatch[1] : String(order.date);
    } else {
      deliveryDateStr = "24 August";
    }

    let statusHeaderHtml = `<div style="font-size: 1.05rem; font-weight: 800; color: #0f172a;">Processing</div>`;
    if (isDigitalOnlyOrder) {
      statusHeaderHtml = `<div style="font-size: 1.05rem; font-weight: 800; color: #0f172a;">Instant Digital Delivery</div>`;
    } else if (orderStatus.toLowerCase().includes("cancel")) {
      statusHeaderHtml = `<div style="font-size: 1.05rem; font-weight: 800; color: #ef4444;">Cancelled</div>`;
    } else if (orderStatus.toLowerCase().includes("deliver")) {
      statusHeaderHtml = `<div style="font-size: 1.05rem; font-weight: 800; color: #0f172a;">Delivered ${deliveryDateStr}</div>`;
    } else if (orderStatus.toLowerCase().includes("transit") || orderStatus.toLowerCase().includes("ship")) {
      statusHeaderHtml = `<div style="font-size: 1.05rem; font-weight: 800; color: #0f172a;">In Transit ${order.estDeliveryDate || order.estDate ? `· Est. ${order.estDeliveryDate || order.estDate}` : ''}</div>`;
    } else if (orderStatus.toLowerCase().includes("return")) {
      statusHeaderHtml = `<div style="font-size: 1.05rem; font-weight: 800; color: #0f172a;">${orderStatus}</div>`;
    }

    const isDelivered = orderStatus.toLowerCase().includes("deliver") || isDigitalOnlyOrder;
    const deliveredAt = order.deliveredAt ? new Date(order.deliveredAt) : null;
    
    // Replacement availability: ONLY shown once delivered for physical items
    const activeReplacement = (order.replacements || []).find(r => r.status === "Requested" || r.status === "Approved");
    let canShowReplaceBtn = false;
    let isReplaceable = false;
    let replaceBtnText = "Replace Items";

    if (!isDigitalOnlyOrder && isDelivered) {
      canShowReplaceBtn = true;
      if (activeReplacement) {
        isReplaceable = false;
        replaceBtnText = activeReplacement.status === "Approved" ? "Replacement Approved" : "Replacement Pending";
      } else if (deliveredAt && !isNaN(deliveredAt.getTime())) {
        const daysSince = (Date.now() - deliveredAt.getTime()) / (1000 * 3600 * 24);
        if (daysSince <= 7) {
          isReplaceable = true;
        } else {
          replaceBtnText = "Return window closed (7 days)";
        }
      } else {
        isReplaceable = true;
      }
    }

    const isProcessing = Boolean(
      orderStatus.toLowerCase().includes("process") || 
      orderStatus.toLowerCase().includes("pending") || 
      orderStatus.toLowerCase().includes("placed")
    );

    // Only physical orders in Processing status can have their address edited
    const canEditAddress = !isDigitalOnlyOrder && isProcessing;

    // Any physical order in Processing status can be cancelled by customers (any payment method - Amazon/Flipkart style)
    const canCancelOrder = !isDigitalOnlyOrder && isProcessing;

    let itemsToDisplay = orderItems;

    let itemsHtml = "";
    itemsToDisplay.forEach(item => {
      const pId = item.productId || item.id;
      const detailHref = pId ? `store-detail.html?id=${encodeURIComponent(pId)}` : '#';
      const isDigitalItem = (item.product && item.product.type === "digital") || item.type === "digital";
      const downloadUrl = item.product?.downloadUrl || item.downloadUrl;
      // Review ONLY appears once delivered
      const canReview = isDelivered && pId;
      const alreadyReviewed = pId ? userReviewedProductIds.has(pId) : false;
      const rowElementId = `order-item-${orderId}-${item.id || item.productId || ''}`;

      itemsHtml += `
        <div class="order-card-item-row" id="${rowElementId}" data-order-id="${orderId}" data-item-id="${item.id || item.productId || ''}" data-product-id="${pId || ''}">
          <div class="order-card-item-main" style="display: flex; flex-direction: column; gap: 10px; flex: 1;">
            <!-- Status text above the image (Simple Bold Text, No Emojis) -->
            ${statusHeaderHtml}

            <!-- Image + Product Information -->
            <div style="display: flex; align-items: flex-start; gap: 16px;">
              <a href="${detailHref}" style="flex-shrink: 0;">
                <img src="${item.img || item.image || item.productImage || (item.product && item.product.image) || 'assets/Videos/SenpaiWorks logo.png'}" alt="${item.productName || item.name || 'Product Image'}" class="order-card-item-img" style="cursor: pointer; border-radius: 0px !important;">
              </a>
              <div class="order-card-item-info">
                <div class="order-card-item-title" style="display: flex; align-items: center; gap: 8px;">
                  <a href="${detailHref}" style="color: #0066cc; text-decoration: none; font-size: 0.92rem; font-weight: 600; line-height: 1.4;">${item.productName || item.name || (item.product && (item.product.name || item.product.title)) || 'SenpaiWorks Product'}</a>
                  ${isDigitalItem ? '<span style="background: rgba(6, 182, 212, 0.15); color: #06b6d4; font-size: 0.68rem; padding: 2px 6px; border-radius: 4px; font-weight: 700;">Digital Asset</span>' : ''}
                </div>
                <div class="order-card-item-meta" style="font-size: 0.85rem; color: #64748b; margin-top: 3px;">Size / Variant: ${item.size || item.variant || (isDigitalItem ? 'Digital Edition' : 'Standard Edition')} | Qty: ${item.quantity || 1}</div>

                ${(!isDigitalItem && isDelivered) ? `
                  <div style="margin-top: 10px;">
                    <button onclick="buyAgain('${orderId}', '${item.id || item.productId || ''}')" class="btn-order-action primary" style="display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; font-size: 0.84rem;">
                      <i class="fa-solid fa-rotate"></i> Buy it again
                    </button>
                  </div>
                ` : ''}
              </div>
            </div>
          </div>

          <div class="order-card-item-actions">
            ${!isDigitalOnlyOrder ? `
              <button onclick="openTrackModal('${orderId}')" class="btn-order-action primary">
                <i class="fa-solid fa-truck-fast"></i> Track Package
              </button>
            ` : ''}
            ${canReview ? `
              <a href="store-detail.html?id=${encodeURIComponent(pId)}&openReview=true" class="btn-order-action outline" style="text-decoration: none; display: flex; align-items: center; justify-content: center; gap: 6px; border: 1.5px solid #0f172a; color: #0f172a;">
                <i class="fa-${alreadyReviewed ? 'solid fa-pen-to-square' : 'regular fa-star'}"></i> ${alreadyReviewed ? 'Edit Your Review' : 'Write a Review'}
              </a>
            ` : ''}
            ${canShowReplaceBtn ? `
              <button onclick="openReturnModal('${orderId}', '${order.id}')" class="btn-order-action outline" style="border: 1.5px solid #0f172a; color: #0f172a; ${!isReplaceable ? 'opacity:0.5; cursor:not-allowed;' : ''}">
                <i class="fa-solid fa-rotate-left"></i> ${replaceBtnText}
              </button>
            ` : ''}
            ${canEditAddress ? `
              <button onclick="openEditOrderAddressModal('${order.id}', '${orderId}')" class="btn-order-action outline" style="border: 1.5px solid #0284c7; color: #0284c7;">
                <i class="fa-solid fa-pen-to-square"></i> Edit Address
              </button>
            ` : ''}
            ${canCancelOrder ? `
              <button onclick="cancelOrder('${order.id}', '${orderId}')" class="btn-order-action outline" style="border: 1.5px solid #ef4444; color: #ef4444;">
                <i class="fa-solid fa-ban"></i> Cancel Order
              </button>
            ` : ''}
            ${isDigitalItem ? `
              <a href="${downloadUrl || '#'}" target="_blank" class="btn-order-action primary" style="background: linear-gradient(135deg, #06b6d4, #3b82f6); border: none; text-decoration: none; color: #fff; font-weight: 700; display: flex; align-items: center; justify-content: center;">
                <i class="fa-solid fa-cloud-arrow-down"></i> Download
              </a>
            ` : ''}
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
              <div class="meta-label">${isDigitalOnlyOrder ? 'DELIVERY' : 'SHIP TO'}</div>
              <div class="meta-val" title="${shippingAddress}">${isDigitalOnlyOrder ? 'Instant Digital Download' : defaultUserName}</div>
            </div>
          </div>

          <div class="order-header-right" style="text-align: right;">
            ${order.isReplacementOrder ? '<div style="background:#0284c7;color:#fff;padding:2px 8px;border-radius:12px;font-size:0.7rem;font-weight:700;display:inline-block;margin-bottom:4px;"><i class="fa-solid fa-rotate"></i> Replacement</div><br>' : ''}
            <div class="meta-label">ORDER # ${orderId}</div>
            <div style="display: flex; gap: 8px; justify-content: flex-end; align-items: center; margin-top: 4px;">
              <a href="javascript:void(0)" onclick="openOrderDetailsModal('${orderId}')" class="link-view-receipt">Order Details</a>
              <span style="color: #cbd5e1;">|</span>
              <a href="order-confirmation.html?orderId=${orderId}" class="link-view-receipt">View Receipt &rarr;</a>
            </div>
          </div>
        </div>

        <div class="order-card-body">
          <div class="order-card-items-wrap">
            ${itemsHtml}
          </div>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}

// Filter tabs
window.filterOrders = function (tabName) {
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
  } else if (tabName === "buy-again") {
    const buyAgainOrders = (allUserOrders || []).filter(o => {
      const st = (o.status || "").toLowerCase();
      const isCancelled = st.includes("cancel");
      const isDelivered = st.includes("deliver");
      if (isCancelled || !isDelivered) return false;
      const orderItems = o.items || [];
      return orderItems.some(i => (i.product && i.product.type !== "digital") || (!i.product && i.type !== "digital"));
    });
    renderOrdersList(buyAgainOrders);
  } else if (tabName === "not-shipped" || tabName === "processing") {
    const notShippedOrders = (allUserOrders || []).filter(o => {
      const st = (o.status || "").toLowerCase();
      const isShipped = st.includes("ship") || st.includes("transit");
      const isDelivered = st.includes("deliver");
      const isCancelled = st.includes("cancel");
      // Not yet shipped = orders still processing/pending that haven't been shipped, delivered, or cancelled
      return !isShipped && !isDelivered && !isCancelled;
    });
    renderOrdersList(notShippedOrders);
  } else {
    renderOrdersList(allUserOrders);
  }
};

// Search orders
window.searchOrders = function () {
  const query = document.getElementById("order-search-input").value.trim().toLowerCase();
  if (!query) {
    window.filterOrders(currentTabFilter);
    return;
  }

  let sourceOrders = allUserOrders;
  if (currentTabFilter === "buy-again") {
    sourceOrders = (allUserOrders || []).filter(o => {
      const st = (o.status || "").toLowerCase();
      const isCancelled = st.includes("cancel");
      const isDelivered = st.includes("deliver");
      if (isCancelled || !isDelivered) return false;
      const orderItems = o.items || [];
      return orderItems.some(i => (i.product && i.product.type !== "digital") || (!i.product && i.type !== "digital"));
    });
  } else if (currentTabFilter === "not-shipped" || currentTabFilter === "processing") {
    sourceOrders = (allUserOrders || []).filter(o => {
      const st = (o.status || "").toLowerCase();
      const isShipped = st.includes("ship") || st.includes("transit");
      const isDelivered = st.includes("deliver");
      const isCancelled = st.includes("cancel");
      return !isShipped && !isDelivered && !isCancelled;
    });
  }

  const filtered = sourceOrders.filter(order => {
    const idMatch = (order.id || "").toLowerCase().includes(query) || (order.orderNumber || "").toLowerCase().includes(query);
    const itemMatch = (order.items || []).some(item => (item.productName || item.name || "").toLowerCase().includes(query));
    return idMatch || itemMatch;
  });

  renderOrdersList(filtered);
};

// Order Details Modal Handler
window.openOrderDetailsModal = function (orderId) {
  const order = (window.allUserOrders || []).find(o => (o.orderNumber || o.orderId || String(o.id)) === String(orderId));
  if (!order) return;

  const modal = document.getElementById("order-details-modal");
  if (!modal) return;

  const currentUser = getCurrentUser();
  const defaultUserName = currentUser ? (currentUser.name || currentUser.username) : "Suhas H";

  // Date & Number
  const dateEl = document.getElementById("od-modal-date");
  const numEl = document.getElementById("od-modal-order-number");
  if (dateEl) dateEl.textContent = order.date || (order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : "Recently placed");
  if (numEl) numEl.textContent = `#${order.orderNumber || order.orderId || order.id}`;

  // Real Status Timeline
  const timelineWrap = document.getElementById("od-modal-timeline-wrap");
  if (timelineWrap) {
    timelineWrap.innerHTML = generateOrderTimelineHtml(order);
  }

  // Ship To Address
  const nameEl = document.getElementById("od-modal-ship-name");
  const addrEl = document.getElementById("od-modal-ship-address");
  const editAddrWrap = document.getElementById("od-modal-edit-addr-btn-wrap");

  const addrObj = getOrderAddressObj(order);
  const isPhysical = (order.items || []).some(i => (i.product && i.product.type !== "digital") || (!i.product && i.type !== "digital"));
  const isProcessing = (order.status || "").toLowerCase().includes("process") || (order.status || "").toLowerCase().includes("pending");
  const canEditAddress = isPhysical && isProcessing;

  if (editAddrWrap) {
    if (canEditAddress) {
      editAddrWrap.innerHTML = `<button type="button" onclick="openEditOrderAddressModal('${order.id}', '${order.orderNumber || order.orderId || order.id}')" class="btn-edit-order-address" style="background: none; border: 1.5px solid #0284c7; color: #0284c7; font-size: 0.75rem; font-weight: 700; border-radius: 6px; padding: 2px 8px; cursor: pointer; display: inline-flex; align-items: center; gap: 4px;"><i class="fa-solid fa-pen-to-square"></i> Edit Address</button>`;
    } else {
      editAddrWrap.innerHTML = "";
    }
  }

  if (addrObj) {
    const rName = (addrObj.firstName || addrObj.fullName)
      ? `${addrObj.firstName || ''} ${addrObj.lastName || ''}`.trim() || addrObj.fullName
      : (order.guestName || defaultUserName);
    if (nameEl) nameEl.textContent = rName;
    const lines = [
      addrObj.address || addrObj.street || addrObj.flat || '',
      addrObj.apartment || addrObj.landmark ? `Near ${addrObj.apartment || addrObj.landmark}` : '',
      [addrObj.city, addrObj.state, addrObj.pincode || addrObj.zip].filter(Boolean).join(", "),
      addrObj.country || "India",
      addrObj.phone ? `Phone: ${addrObj.phone}` : ''
    ].filter(Boolean);
    if (addrEl) addrEl.textContent = lines.join("\n") || "Indiranagar, Bengaluru, Karnataka, India";
  } else if (typeof order.address === "string") {
    if (nameEl) nameEl.textContent = order.guestName || defaultUserName;
    if (addrEl) addrEl.textContent = order.address;
  } else {
    if (nameEl) nameEl.textContent = order.guestName || defaultUserName;
    if (addrEl) addrEl.textContent = "House no 08 ground floor\nHebbal 1st Stage, 6th Main Road\nMYSURU, KARNATAKA 570016\nIndia";
  }

  // Payment Method
  const pymEl = document.getElementById("od-modal-payment-method");
  const pymStatusEl = document.getElementById("od-modal-payment-status");
  if (pymEl) pymEl.textContent = order.paymentMethod || "BHIM UPI";
  if (pymStatusEl) pymStatusEl.textContent = order.paymentStatus || "Completed";

  // Items List
  const itemsContainer = document.getElementById("od-modal-items-list");
  if (itemsContainer) {
    let itemsHtml = "";
    (order.items || []).forEach(item => {
      const pId = item.productId || item.id;
      const detailHref = pId ? `store-detail.html?id=${encodeURIComponent(pId)}` : '#';
      const isDigitalItem = (item.product && item.product.type === "digital") || item.type === "digital";
      const itemTitle = item.productName || item.name || (item.product && (item.product.name || item.product.title)) || "SenpaiWorks Product";
      const itemImg = item.img || item.image || item.productImage || (item.product && item.product.image) || "assets/Videos/SenpaiWorks logo.png";
      const itemPrice = item.price || 0;
      const itemQty = item.quantity || 1;

      itemsHtml += `
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 14px; padding: 10px 14px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <a href="${detailHref}">
              <img src="${itemImg}" alt="${itemTitle}" style="width: 48px; height: 48px; object-fit: cover; border-radius: 6px; border: 1px solid #e2e8f0;">
            </a>
            <div>
              <a href="${detailHref}" style="font-weight: 700; color: #0f172a; text-decoration: none; font-size: 0.9rem; display: block;">${itemTitle}</a>
              <div style="font-size: 0.78rem; color: #64748b; margin-top: 2px;">
                Size / Variant: ${item.size || item.variant || (isDigitalItem ? 'Digital Edition' : 'Standard Edition')} | Qty: ${itemQty}
              </div>
            </div>
          </div>
          <div style="font-weight: 700; color: #0f172a; font-size: 0.92rem; white-space: nowrap;">
            ₹${(itemPrice * itemQty).toLocaleString()}.00
          </div>
        </div>
      `;
    });
    itemsContainer.innerHTML = itemsHtml || `<div style="color:#64748b; font-size:0.85rem;">No item details available.</div>`;
  }

  // Summary Prices
  const total = order.grandTotal || order.total || 0;
  const subtotal = order.subtotal || total;
  const shipping = order.shippingFee || order.shipping || 0;
  const platformFee = order.platformFee || order.tax || 0;

  const subtotalEl = document.getElementById("od-modal-subtotal");
  const shippingEl = document.getElementById("od-modal-shipping");
  const feeEl = document.getElementById("od-modal-platform-fee");
  const totalEl = document.getElementById("od-modal-total");
  const grandTotalEl = document.getElementById("od-modal-grand-total");

  if (subtotalEl) subtotalEl.textContent = `₹${Number(subtotal).toLocaleString()}.00`;
  if (shippingEl) shippingEl.textContent = shipping > 0 ? `₹${Number(shipping).toLocaleString()}.00` : "₹0.00";
  if (feeEl) feeEl.textContent = platformFee > 0 ? `₹${Number(platformFee).toFixed(2)}` : "₹0.00";
  if (totalEl) totalEl.textContent = `₹${Number(total).toLocaleString()}.00`;
  if (grandTotalEl) grandTotalEl.textContent = `₹${Number(total).toLocaleString()}.00`;

  modal.classList.add("active");
};

window.closeOrderDetailsModal = function () {
  const modal = document.getElementById("order-details-modal");
  if (modal) modal.classList.remove("active");
};

// Track package modal (Now displays real status timeline)
window.openTrackModal = function (orderId) {
  activeModalOrderId = orderId;
  const order = (window.allUserOrders || []).find(o =>
    String(o.id) === String(orderId) ||
    (o.orderNumber && String(o.orderNumber) === String(orderId)) ||
    (o.orderId && String(o.orderId) === String(orderId))
  );
  const modal = document.getElementById("track-modal");
  const title = document.getElementById("track-order-id-title");
  const subtitle = document.getElementById("track-order-number-subtitle");
  const timelineWrap = document.getElementById("track-modal-timeline-wrap");

  if (title) title.textContent = `Order Status Timeline`;
  if (subtitle) subtitle.textContent = `#${orderId}`;
  if (timelineWrap && order) {
    timelineWrap.innerHTML = generateOrderTimelineHtml(order);
  }

  if (modal) modal.classList.add("active");
};

window.closeTrackModal = function () {
  const modal = document.getElementById("track-modal");
  if (modal) modal.classList.remove("active");
};

// Replacement item modal
window.openReturnModal = function (orderId, dbId) {
  activeModalOrderId = orderId;
  activeModalOrderDbId = dbId;
  const modal = document.getElementById("return-modal");
  const idTxt = document.getElementById("return-order-id-txt");
  if (idTxt) idTxt.textContent = `#${orderId}`;

  const order = (window.allUserOrders || []).find(o => String(o.id) === String(dbId));
  const itemContainer = document.getElementById("return-item-selector-container");
  const itemSelect = document.getElementById("return-item-select");

  if (order && order.items && itemContainer && itemSelect) {
    itemSelect.innerHTML = "";
    if (order.items.length > 1) {
      itemContainer.style.display = "block";
      itemSelect.required = true;
      itemSelect.innerHTML = `<option value="">Select an item...</option>`;
      order.items.forEach(item => {
        itemSelect.innerHTML += `<option value="${item.id}">${item.productName} (x${item.quantity})</option>`;
      });
    } else if (order.items.length === 1) {
      itemContainer.style.display = "none";
      itemSelect.required = false;
      itemSelect.innerHTML = `<option value="${order.items[0].id}" selected>${order.items[0].productName}</option>`;
    }
  }

  if (modal) modal.classList.add("active");
};

window.closeReturnModal = function () {
  const modal = document.getElementById("return-modal");
  if (modal) modal.classList.remove("active");
};

window.handleReturnSubmit = async function (e) {
  if (e) e.preventDefault();
  const reasonSelect = document.getElementById("return-reason-select");
  const commentsTxt = document.getElementById("return-comments-text");

  const reason = reasonSelect ? reasonSelect.value : "Item Defective / Damaged";
  const notes = commentsTxt ? commentsTxt.value.trim() : "";
  const fullReason = notes ? `${reason} - ${notes}` : reason;

  if (!activeModalOrderDbId) return;
  try {
    const token = localStorage.getItem("userToken");

    const order = (window.allUserOrders || []).find(o => String(o.id) === String(activeModalOrderDbId));
    if (order && order.replacements && order.replacements.some(r => r.status === "Requested" || r.status === "Approved")) {
      alert("A replacement request for this order is already pending or approved.");
      closeReturnModal();
      return;
    }

    const itemSelect = document.getElementById("return-item-select");
    const orderItemId = itemSelect ? itemSelect.value : null;

    const res = await fetch(`/api/orders/${activeModalOrderDbId}/replace`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { "Authorization": `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ reason: fullReason, orderItemId })
    });

    if (res.ok) {
      window.showOrderToast(`Replacement requested`, "Our team will review your request", "success");
      window.closeReturnModal();
      initOrdersDashboard();
    } else {
      const data = await res.json();
      window.showOrderToast(`Failed to request replacement`, data.error || "Unknown error", "error");
    }
  } catch (err) {
    console.error("API error during replacement request:", err);
    window.showOrderToast("Error", "Could not submit replacement request", "error");
  }
};

// Global Toast Notice for Orders & Cart
window.showOrderToast = function (title, subtext = "", type = "success") {
  let toast = document.getElementById("senpai-order-toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "senpai-order-toast";
    toast.style.cssText = `
      position: fixed;
      bottom: 28px;
      right: 28px;
      background: #0f172a;
      color: #ffffff;
      padding: 14px 20px;
      border-radius: 14px;
      box-shadow: 0 14px 30px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1);
      display: flex;
      align-items: center;
      gap: 14px;
      z-index: 99999;
      font-family: inherit;
      transform: translateY(120px) scale(0.95);
      opacity: 0;
      transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
      max-width: 420px;
      pointer-events: none;
    `;
    document.body.appendChild(toast);
  }

  const iconHtml = type === "success"
    ? `<div style="width: 36px; height: 36px; border-radius: 50%; background: rgba(34, 197, 94, 0.2); color: #4ade80; display: flex; align-items: center; justify-content: center; font-size: 1.1rem; flex-shrink: 0;"><i class="fa-solid fa-circle-check"></i></div>`
    : (type === "info"
      ? `<div style="width: 36px; height: 36px; border-radius: 50%; background: rgba(56, 189, 248, 0.2); color: #38bdf8; display: flex; align-items: center; justify-content: center; font-size: 1.1rem; flex-shrink: 0;"><i class="fa-solid fa-cart-shopping"></i></div>`
      : `<div style="width: 36px; height: 36px; border-radius: 50%; background: rgba(239, 68, 68, 0.2); color: #f87171; display: flex; align-items: center; justify-content: center; font-size: 1.1rem; flex-shrink: 0;"><i class="fa-solid fa-triangle-exclamation"></i></div>`);

  toast.innerHTML = `
    ${iconHtml}
    <div style="flex: 1; min-width: 0; text-align: left;">
      <div style="font-size: 0.92rem; font-weight: 700; color: #ffffff; line-height: 1.3;">${title}</div>
      ${subtext ? `<div style="font-size: 0.8rem; color: #94a3b8; margin-top: 2px; line-height: 1.3;">${subtext}</div>` : ''}
    </div>
  `;

  toast.style.transform = "translateY(0) scale(1)";
  toast.style.opacity = "1";

  if (window.orderToastTimeout) clearTimeout(window.orderToastTimeout);
  window.orderToastTimeout = setTimeout(() => {
    toast.style.transform = "translateY(120px) scale(0.95)";
    toast.style.opacity = "0";
  }, 4000);
};

// Cancel Order Modal Handler
let pendingCancelOrderData = null;

window.cancelOrder = function (dbId, orderNumber) {
  const ordersList = window.allUserOrders || allUserOrders || [];
  const order = ordersList.find(o =>
    String(o.id) === String(dbId) ||
    (o.orderNumber && String(o.orderNumber) === String(orderNumber)) ||
    (o.orderId && String(o.orderId) === String(orderNumber)) ||
    String(o.id) === String(orderNumber)
  );

  let productNames = "";
  if (order && order.items && order.items.length > 0) {
    productNames = order.items.map(i => {
      return i.productName || (i.product && (i.product.name || i.product.title)) || i.name || "";
    }).filter(Boolean).join(", ");
  }

  if (!productNames && order) {
    productNames = order.productName || order.name || order.title || "";
  }

  if (!productNames) {
    productNames = "SenpaiWorks Product";
  }

  pendingCancelOrderData = { dbId, orderNumber, productNames };

  const modal = document.getElementById("cancel-order-modal");
  const numEl = document.getElementById("cancel-modal-order-number");
  const nameEl = document.getElementById("cancel-modal-product-name");

  if (numEl) numEl.textContent = `Order #${orderNumber}`;
  if (nameEl) nameEl.textContent = productNames;

  if (modal) {
    modal.classList.add("active");
  } else {
    // Fallback if modal not present
    if (confirm(`Are you sure you want to cancel "${productNames}" (Order #${orderNumber})?`)) {
      window.confirmCancelOrderAction();
    }
  }
};

window.closeCancelOrderModal = function () {
  const modal = document.getElementById("cancel-order-modal");
  if (modal) modal.classList.remove("active");
  pendingCancelOrderData = null;
};

window.confirmCancelOrderAction = async function () {
  if (!pendingCancelOrderData) return;
  const { dbId, orderNumber, productNames } = pendingCancelOrderData;
  const btn = document.getElementById("btn-confirm-cancel-order");
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = "Cancelling...";
  }

  try {
    const token = localStorage.getItem("userToken");
    const res = await fetch(`/api/orders/${dbId}/cancel`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { "Authorization": `Bearer ${token}` } : {})
      }
    });

    const data = await res.json();
    if (res.ok) {
      window.closeCancelOrderModal();
      const toastMsg = data.refundFlagged
        ? `Order #${orderNumber} cancelled. Refund is being processed.`
        : `Order #${orderNumber} cancelled`;
      window.showOrderToast(toastMsg, productNames, "success");
      initOrdersDashboard(); // Refresh orders list & badge
    } else {
      window.showOrderToast(`Failed to cancel order`, data.error || "Unknown error", "error");
    }
  } catch (err) {
    console.error("Error cancelling order:", err);
    window.showOrderToast("Network error while cancelling order", "Please try again later", "error");
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = "Yes, Cancel Order";
    }
  }
};

// Buy it again: Navigates to Buy Again tab, scrolls to and highlights that specific product
window.buyAgain = function (orderId, itemId) {
  // 1. Switch to the Buy Again tab
  window.filterOrders("buy-again");

  // 2. Smoothly scroll to and highlight the requested product
  setTimeout(() => {
    // Clear any previous highlights
    document.querySelectorAll(".buy-again-highlight").forEach(el => el.classList.remove("buy-again-highlight"));

    let targetEl = document.getElementById(`order-item-${orderId}-${itemId}`);
    if (!targetEl && itemId) {
      targetEl = document.querySelector(`[data-item-id="${itemId}"]`) || document.querySelector(`[data-product-id="${itemId}"]`);
    }
    if (!targetEl && orderId) {
      targetEl = document.querySelector(`[data-order-id="${orderId}"]`);
    }

    if (targetEl) {
      targetEl.scrollIntoView({ behavior: "smooth", block: "center" });
      targetEl.classList.add("buy-again-highlight");
    }
  }, 100);
};

// Add to Cart from Buy Again tab
window.addToCartFromBuyAgain = function (orderId, itemId) {
  const order = (window.allUserOrders || []).find(o => (o.orderNumber || o.orderId || String(o.id)) === String(orderId)) || (window.allUserOrders && window.allUserOrders.length > 0 ? window.allUserOrders[0] : null);

  if (!order || !order.items || order.items.length === 0) {
    window.showOrderToast("Item not found", "Could not locate order item", "error");
    return;
  }

  let cart = localStorage.getItem("shoppingCart");
  cart = cart ? JSON.parse(cart) : [];

  // If specific item selected
  let itemsToAdd = order.items;
  if (itemId) {
    const matched = order.items.find(i => String(i.id) === String(itemId) || String(i.productId) === String(itemId));
    if (matched) itemsToAdd = [matched];
  }

  const productNames = itemsToAdd.map(i => i.productName || i.name || (i.product && (i.product.name || i.product.title)) || "SenpaiWorks Product").join(", ");

  itemsToAdd.forEach(item => {
    const pId = item.productId || item.id;
    const existing = cart.find(c => (item.id && c.id === item.id) || (pId && (c.id === pId || c.productId === pId)) || (item.productName && c.name === item.productName));
    if (existing) {
      existing.quantity = (existing.quantity || 1) + 1;
    } else {
      cart.push({
        id: pId || ("PROD-" + Date.now()),
        productId: pId,
        name: item.productName || item.name || (item.product && (item.product.name || item.product.title)) || "SenpaiWorks Product",
        price: item.price || 0,
        image: item.img || item.image || item.productImage || (item.product && item.product.image) || "assets/Videos/SenpaiWorks logo.png",
        category: item.category || (item.product && item.product.category) || "Apparel",
        color: item.color || "Standard",
        size: item.size || "M",
        quantity: 1
      });
    }
  });

  localStorage.setItem("shoppingCart", JSON.stringify(cart));

  if (typeof updateCartCount === "function") {
    updateCartCount();
  }

  window.showOrderToast(`Added to your Shopping Cart!`, productNames, "info");
};

// =========================================================================
// HELPER: Extract structured shipping address object
// =========================================================================
function getOrderAddressObj(order) {
  if (!order) return null;
  let raw = order.shippingAddress || order.address;
  if (!raw) return null;
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw);
    } catch (e) {
      return { address: raw };
    }
  }
  return typeof raw === "object" ? raw : null;
}

// =========================================================================
// REAL STATUS TIMELINE GENERATOR (Using order.status & statusHistory only)
// =========================================================================
function generateOrderTimelineHtml(order) {
  if (!order) return "";

  const isDigital = (order.items || []).every(i => (i.product && i.product.type === "digital") || i.type === "digital") && (order.items || []).length > 0;
  const statusStr = (order.status || "Processing").trim();
  const isCancelled = statusStr.toLowerCase().includes("cancel");

  // Parse statusHistory if present
  let history = [];
  if (order.statusHistory) {
    try {
      history = typeof order.statusHistory === "string" ? JSON.parse(order.statusHistory) : order.statusHistory;
    } catch (e) {
      history = [];
    }
  }

  function getTimestampForStatus(name) {
    const found = history.find(h => (h.status || "").toLowerCase() === name.toLowerCase());
    if (found && found.timestamp) return new Date(found.timestamp);
    if (name.toLowerCase() === "placed" && order.createdAt) return new Date(order.createdAt);
    if (name.toLowerCase() === "delivered" && order.deliveredAt) return new Date(order.deliveredAt);
    if (name.toLowerCase() === statusStr.toLowerCase()) return new Date(order.updatedAt || order.createdAt || Date.now());
    return null;
  }

  function formatTimelineTime(d) {
    if (!d || isNaN(d.getTime())) return null;
    return d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  if (isDigital) {
    const deliveredDate = getTimestampForStatus("delivered") || (order.deliveredAt ? new Date(order.deliveredAt) : (order.createdAt ? new Date(order.createdAt) : new Date()));
    return `
      <div class="status-timeline-container" style="margin: 18px 0; padding: 18px; background: #f0fdf4; border: 1.5px solid #bbf7d0; border-radius: 12px;">
        <div style="display: flex; align-items: center; gap: 12px;">
          <div style="width: 36px; height: 36px; border-radius: 50%; background: #16a34a; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 1.1rem;">
            <i class="fa-solid fa-bolt"></i>
          </div>
          <div>
            <div style="font-weight: 800; color: #166534; font-size: 0.95rem;">Instant Digital Delivery Confirmed</div>
            <div style="font-size: 0.8rem; color: #15803d; margin-top: 2px;">Asset delivered to your account on ${formatTimelineTime(deliveredDate) || "Instant Delivery"}</div>
          </div>
        </div>
      </div>
    `;
  }

  if (isCancelled) {
    const placedDate = getTimestampForStatus("placed");
    const cancelDate = getTimestampForStatus("cancelled") || new Date();
    return `
      <div class="status-timeline-container" style="margin: 18px 0; padding: 18px; background: #fef2f2; border: 1.5px solid #fecaca; border-radius: 12px;">
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 14px;">
          <div style="width: 36px; height: 36px; border-radius: 50%; background: #ef4444; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 1.1rem;">
            <i class="fa-solid fa-ban"></i>
          </div>
          <div>
            <div style="font-weight: 800; color: #991b1b; font-size: 0.95rem;">Order Cancelled</div>
            <div style="font-size: 0.8rem; color: #b91c1c; margin-top: 2px;">This order was cancelled on ${formatTimelineTime(cancelDate) || "Recently"}</div>
          </div>
        </div>
        <div style="display: flex; align-items: center; gap: 8px; font-size: 0.82rem; color: #7f1d1d; border-top: 1px dashed #fca5a5; padding-top: 10px;">
          <span><strong>Order Placed:</strong> ${formatTimelineTime(placedDate) || "Confirmed"}</span>
          <span>&rarr;</span>
          <span><strong>Cancelled:</strong> ${formatTimelineTime(cancelDate) || "Processed"}</span>
        </div>
      </div>
    `;
  }

  const steps = [
    { key: "placed", label: "Placed", icon: "fa-solid fa-receipt" },
    { key: "processing", label: "Processing", icon: "fa-solid fa-boxes-packing" },
    { key: "shipped", label: "Shipped", icon: "fa-solid fa-truck" },
    { key: "delivered", label: "Delivered", icon: "fa-solid fa-house-circle-check" }
  ];

  const stLower = statusStr.toLowerCase();
  let currentStepIdx = 0;
  if (stLower.includes("deliver")) currentStepIdx = 3;
  else if (stLower.includes("transit") || stLower.includes("ship")) currentStepIdx = 2;
  else if (stLower.includes("process") || stLower.includes("pending")) currentStepIdx = 1;
  else currentStepIdx = 0;

  const stepsHtml = steps.map((s, idx) => {
    const isCompleted = idx < currentStepIdx;
    const isActive = idx === currentStepIdx;
    const isPending = idx > currentStepIdx;

    const dt = getTimestampForStatus(s.key);
    const dateStr = dt ? formatTimelineTime(dt) : (isActive && s.key === "processing" ? "In Progress" : "");

    let circleBg = "#e2e8f0";
    let circleColor = "#64748b";
    let textColor = "#64748b";

    if (isCompleted) {
      circleBg = "#0f172a";
      circleColor = "#ffffff";
      textColor = "#0f172a";
    } else if (isActive) {
      circleBg = "#0284c7";
      circleColor = "#ffffff";
      textColor = "#0284c7";
    }

    return `
      <div style="display: flex; flex-direction: column; align-items: center; text-align: center; flex: 1; position: relative; z-index: 2;">
        <div style="width: 38px; height: 38px; border-radius: 50%; background: ${circleBg}; color: ${circleColor}; display: flex; align-items: center; justify-content: center; font-size: 0.95rem; font-weight: 700; margin-bottom: 8px; box-shadow: ${isActive ? '0 0 0 4px rgba(2, 132, 199, 0.2)' : 'none'}; transition: all 0.3s ease;">
          <i class="${isCompleted ? 'fa-solid fa-check' : s.icon}"></i>
        </div>
        <div style="font-weight: 800; font-size: 0.88rem; color: ${textColor}; margin-bottom: 2px;">
          ${s.label}
        </div>
        <div style="font-size: 0.72rem; color: ${isActive ? '#0284c7' : '#64748b'}; line-height: 1.2; max-width: 110px;">
          ${dateStr || (isPending ? 'Upcoming' : '')}
        </div>
      </div>
    `;
  }).join("");

  const progressPct = currentStepIdx === 0 ? 0 : currentStepIdx === 1 ? 33.3 : currentStepIdx === 2 ? 66.6 : 100;

  return `
    <div class="order-status-timeline-widget" style="margin: 20px 0; padding: 22px 18px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 14px; box-shadow: 0 2px 8px rgba(0,0,0,0.03);">
      <div style="font-size: 0.75rem; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 18px; display: flex; justify-content: space-between; align-items: center;">
        <span><i class="fa-solid fa-timeline" style="color: #0284c7; margin-right: 6px;"></i> Order Status Timeline</span>
        <span style="background: ${currentStepIdx === 3 ? '#dcfce7' : '#e0f2fe'}; color: ${currentStepIdx === 3 ? '#166534' : '#0369a1'}; padding: 2px 8px; border-radius: 12px; font-size: 0.72rem; font-weight: 800;">${statusStr}</span>
      </div>
      <div style="position: relative; display: flex; align-items: flex-start; justify-content: space-between; width: 100%;">
        <div style="position: absolute; top: 19px; left: 10%; right: 10%; height: 3px; background: #e2e8f0; z-index: 1;"></div>
        <div style="position: absolute; top: 19px; left: 10%; width: ${progressPct * 0.8}%; height: 3px; background: #0f172a; z-index: 1; transition: width 0.4s ease;"></div>
        ${stepsHtml}
      </div>
    </div>
  `;
}

// =========================================================================
// EDIT ORDER SHIPPING ADDRESS MODAL HANDLERS
// =========================================================================
let activeEditOrderDbId = null;

window.openEditOrderAddressModal = function (dbId, orderNumber) {
  activeEditOrderDbId = dbId;
  const order = (window.allUserOrders || []).find(o =>
    String(o.id) === String(dbId) ||
    (o.orderNumber && String(o.orderNumber) === String(orderNumber)) ||
    (o.orderId && String(o.orderId) === String(orderNumber))
  );

  const modal = document.getElementById("edit-order-address-modal");
  const numEl = document.getElementById("edit-addr-modal-order-number");
  const dbIdInput = document.getElementById("edit-order-db-id");
  const numInput = document.getElementById("edit-order-num-val");

  if (numEl) numEl.textContent = `Order #${orderNumber || (order ? order.orderNumber : dbId)}`;
  if (dbIdInput) dbIdInput.value = dbId;
  if (numInput) numInput.value = orderNumber || (order ? order.orderNumber : dbId);

  const addrObj = getOrderAddressObj(order) || {};

  const firstNameEl = document.getElementById("edit-addr-first-name");
  const lastNameEl = document.getElementById("edit-addr-last-name");
  const phoneEl = document.getElementById("edit-addr-phone");
  const streetEl = document.getElementById("edit-addr-street");
  const aptEl = document.getElementById("edit-addr-apartment");
  const cityEl = document.getElementById("edit-addr-city");
  const stateEl = document.getElementById("edit-addr-state");
  const pincodeEl = document.getElementById("edit-addr-pincode");
  const countryEl = document.getElementById("edit-addr-country");

  if (firstNameEl) firstNameEl.value = addrObj.firstName || (order && order.guestName ? order.guestName.split(" ")[0] : "");
  if (lastNameEl) lastNameEl.value = addrObj.lastName || (order && order.guestName ? order.guestName.split(" ").slice(1).join(" ") : "");
  if (phoneEl) phoneEl.value = addrObj.phone || (order ? order.guestPhone || "" : "");
  if (streetEl) streetEl.value = addrObj.address || addrObj.street || addrObj.flat || "";
  if (aptEl) aptEl.value = addrObj.apartment || addrObj.landmark || "";
  if (cityEl) cityEl.value = addrObj.city || "";
  if (stateEl) stateEl.value = addrObj.state || "";
  if (pincodeEl) pincodeEl.value = addrObj.pincode || addrObj.zip || "";
  if (countryEl) countryEl.value = addrObj.country || "India";

  if (modal) modal.classList.add("active");
};

window.closeEditOrderAddressModal = function () {
  const modal = document.getElementById("edit-order-address-modal");
  if (modal) modal.classList.remove("active");
  activeEditOrderDbId = null;
};

window.handleSaveOrderAddressSubmit = async function (e) {
  e.preventDefault();
  const dbId = activeEditOrderDbId || document.getElementById("edit-order-db-id")?.value;
  const orderNumber = document.getElementById("edit-order-num-val")?.value;

  const firstName = document.getElementById("edit-addr-first-name")?.value.trim();
  const lastName = document.getElementById("edit-addr-last-name")?.value.trim();
  const phone = document.getElementById("edit-addr-phone")?.value.trim();
  const street = document.getElementById("edit-addr-street")?.value.trim();
  const apartment = document.getElementById("edit-addr-apartment")?.value.trim();
  const city = document.getElementById("edit-addr-city")?.value.trim();
  const state = document.getElementById("edit-addr-state")?.value.trim();
  const pincode = document.getElementById("edit-addr-pincode")?.value.trim();
  const country = document.getElementById("edit-addr-country")?.value.trim() || "India";

  if (!street || !city || !state || !pincode) {
    window.showOrderToast("Validation Error", "Please fill in all required address fields.", "error");
    return;
  }

  const btn = document.getElementById("btn-save-order-addr");
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';
  }

  try {
    const token = localStorage.getItem("userToken") || sessionStorage.getItem("userToken");
    const res = await fetch(`/api/orders/${dbId}/address`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { "Authorization": `Bearer ${token}` } : {})
      },
      body: JSON.stringify({
        address: {
          firstName,
          lastName,
          phone,
          address: street,
          apartment,
          city,
          state,
          pincode,
          country
        }
      })
    });

    const data = await res.json();
    if (res.ok && data.success) {
      window.closeEditOrderAddressModal();
      window.showOrderToast("Address Updated", `Shipping address for Order #${orderNumber || dbId} updated successfully.`, "success");
      
      // Update local orders cache
      if (data.order && window.allUserOrders) {
        const idx = window.allUserOrders.findIndex(o => String(o.id) === String(dbId));
        if (idx !== -1) {
          window.allUserOrders[idx] = { ...window.allUserOrders[idx], ...data.order };
          renderOrdersList(window.allUserOrders);
        }
      } else {
        initOrdersDashboard();
      }

      // If details modal is open, refresh it
      const detailsModal = document.getElementById("order-details-modal");
      if (detailsModal && detailsModal.classList.contains("active")) {
        window.openOrderDetailsModal(orderNumber || dbId);
      }
    } else {
      window.showOrderToast("Failed to Update Address", data.error || "Unknown server error", "error");
    }
  } catch (err) {
    console.error("Error updating order address:", err);
    window.showOrderToast("Network Error", "Could not save address update. Please try again.", "error");
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<i class="fa-solid fa-check"></i> Save Address';
    }
  }
};
