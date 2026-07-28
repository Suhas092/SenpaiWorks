"use strict";

document.addEventListener("DOMContentLoaded", () => {
  renderLatestOrderReceipt();
});

function getOrders() {
  const orders = localStorage.getItem("userOrders");
  return orders ? JSON.parse(orders) : [];
}

function getCurrentUser() {
  const user = localStorage.getItem("currentUser");
  return user ? JSON.parse(user) : null;
}

function renderLatestOrderReceipt() {
  const orders = getOrders();
  const currentUser = getCurrentUser();

  const greetingNameEl = document.getElementById("rcpt-greeting-name");
  const addressTextEl = document.getElementById("rcpt-address-text");
  const orderIdEl = document.getElementById("rcpt-order-id");
  const orderDateEl = document.getElementById("rcpt-order-date");
  const deliveryDatesEl = document.getElementById("rcpt-delivery-dates");
  const itemsListEl = document.getElementById("rcpt-items-list");
  const paymentMethodEl = document.getElementById("rcpt-payment-method");
  const subtotalEl = document.getElementById("rcpt-subtotal-val");
  const shippingEl = document.getElementById("rcpt-shipping-val");
  const grandTotalEl = document.getElementById("rcpt-grand-total-val");

  // Get the most recent order placed
  const latestOrder = (orders && orders.length > 0) ? orders[0] : {
    id: "ORD-" + Math.floor(100000 + Math.random() * 900000),
    date: new Date().toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }),
    items: [
      {
        name: "SenpaiWorks Official Cyber Hoodie",
        img: "assets/Videos/SenpaiWorks logo.png",
        price: 1499,
        quantity: 1,
        variant: "Size: M / Black Edition"
      }
    ],
    total: 1499,
    paymentMethod: "Razorpay Gateway / Credit Card",
    user: currentUser ? currentUser.username : "Suhas Senpai"
  };

  const userName = currentUser ? currentUser.username : (latestOrder.user || "Customer");
  if (greetingNameEl) greetingNameEl.textContent = `Hi ${userName},`;

  if (addressTextEl) {
    addressTextEl.innerHTML = `
      ${userName}<br>
      SenpaiWorks Studio, High Street<br>
      Indiranagar, MG Road<br>
      Bengaluru, KARNATAKA 560038<br>
      India
    `;
  }

  if (orderIdEl) orderIdEl.textContent = latestOrder.id;
  if (orderDateEl) orderDateEl.textContent = latestOrder.date || new Date().toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

  // Calculate estimated delivery timeline (3-5 days out)
  const today = new Date();
  const d1 = new Date(today); d1.setDate(today.getDate() + 3);
  const d2 = new Date(today); d2.setDate(today.getDate() + 5);
  const dateStr = `Standard Delivery: ${d1.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })} - ${d2.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}`;
  if (deliveryDatesEl) deliveryDatesEl.textContent = dateStr;

  // Render Item Cards
  if (itemsListEl && latestOrder.items) {
    let itemsHtml = "";
    latestOrder.items.forEach(item => {
      itemsHtml += `
        <div class="order-item-card">
          <img src="${item.img || 'assets/Videos/SenpaiWorks logo.png'}" alt="${item.name}" class="order-item-img">
          <div class="order-item-details">
            <div class="order-item-name">${item.name}</div>
            <div style="color: #666666; margin-bottom: 4px;">Variant / Size: ${item.size || item.variant || 'Standard Edition'}</div>
            <div style="color: #666666;">Quantity: ${item.quantity}</div>
          </div>
          <div class="order-item-price">₹${(item.price * item.quantity).toLocaleString()}.00</div>
        </div>
      `;
    });
    itemsListEl.innerHTML = itemsHtml;
  }

  // Totals breakdown
  const subtotal = latestOrder.total || 0;
  if (paymentMethodEl) paymentMethodEl.textContent = latestOrder.paymentMethod || "Credit / Debit Card";
  if (subtotalEl) subtotalEl.textContent = `₹${subtotal.toLocaleString()}.00`;
  if (shippingEl) shippingEl.textContent = "Free";
  if (grandTotalEl) grandTotalEl.textContent = `₹${subtotal.toLocaleString()}.00`;
}
