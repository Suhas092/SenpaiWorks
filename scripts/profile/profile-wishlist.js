"use strict";

// 9. WISHLIST GRID
function loadWishlistGrid() {
  const container = document.getElementById("wishlist-items-grid");
  if (!container) return;

  let items = [];
  try {
    items = JSON.parse(localStorage.getItem("userWishlist")) || [];
  } catch (e) { items = []; }

  if (items.length === 0) {
    container.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: #64748b; padding: 40px 0;"><i class="fa-regular fa-heart" style="font-size: 2rem; margin-bottom: 10px; display: block; color: #ff4d6a;"></i>Your Wishlist is currently empty. Explore our store and save items to your wishlist!</div>`;
    return;
  }

  let html = "";
  items.forEach((item, idx) => {
    const variantInfo = (item.color || item.size) ? `<div class="wishlist-variant-info" style="font-size: 0.78rem; font-weight: 600; color: #64748b; margin-top: 4px; margin-bottom: 8px;"><i class="fa-solid fa-tags" style="color: #ff4d6a; margin-right: 4px;"></i>Colour: ${item.color || 'Standard'} | Size: ${item.size || 'M'}</div>` : '';
    const dateSaved = item.savedAt ? `<div style="font-size: 0.72rem; color: #94a3b8; margin-bottom: 6px;">Saved on ${item.savedAt}</div>` : '';
    
    const detailHref = (item.id || item.productId) ? `store-detail.html?id=${item.id || item.productId}` : '#';

    html += `
      <div class="wishlist-card" style="position: relative;">
        <a href="${detailHref}" style="display: block; overflow: hidden; border-radius: 8px 8px 0 0;">
          <img src="${item.img || 'assets/SenpaiWorks logo.png'}" alt="${item.name}" class="wishlist-img" style="width: 100%; aspect-ratio: 3 / 4; object-fit: cover; transition: transform 0.2s ease;">
        </a>
        <div class="wishlist-info">
          <div class="wishlist-title"><a href="${detailHref}" style="color: inherit; text-decoration: none;">${item.name}</a></div>
          ${variantInfo}
          ${dateSaved}
          <div class="wishlist-price">₹${(item.price || 0).toLocaleString('en-IN')}.00</div>
          <div style="display: flex; gap: 8px; margin-top: 12px;">
            <button onclick="addWishlistItemToCart(${idx})" class="btn-order-action primary" style="flex: 1; justify-content: center; font-size: 0.82rem;">
              <i class="fa-solid fa-cart-plus"></i> Move to Cart
            </button>
            <button onclick="removeWishlistItem(${idx})" class="btn-order-action secondary" style="color: #ef4444; border-color: #fecdd3; padding: 6px 12px;" title="Remove from Wishlist">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </div>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}
window.loadWishlistGrid = loadWishlistGrid;

function showToastNotice(msg) {
  let toast = document.getElementById("toast-notice");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toast-notice";
    toast.style.cssText = "position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); background: #1e293b; color: white; padding: 12px 24px; border-radius: 8px; font-weight: 500; display: flex; align-items: center; gap: 8px; z-index: 10000; opacity: 0; transition: opacity 0.3s; pointer-events: none;";
    document.body.appendChild(toast);
  }
  toast.innerHTML = `<i class="fa-solid fa-circle-check" style="color: #4ade80;"></i> <span>${msg}</span>`;
  toast.style.opacity = "1";
  if (window.toastTimeout) clearTimeout(window.toastTimeout);
  window.toastTimeout = setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}
window.showToastNotice = showToastNotice;

window.removeWishlistItem = function (idx) {
  let items = [];
  try {
    items = JSON.parse(localStorage.getItem("userWishlist")) || [];
  } catch (e) { items = []; }

  if (idx >= 0 && idx < items.length) {
    const removed = items.splice(idx, 1)[0];
    localStorage.setItem("userWishlist", JSON.stringify(items));
    
    try {
      const countsMap = JSON.parse(localStorage.getItem("product_wishlist_counts") || "{}");
      if (removed) {
        const key = removed.id || removed.name;
        countsMap[key] = items.filter(item => (removed.id && item.id === removed.id) || item.name === removed.name).length;
        localStorage.setItem("product_wishlist_counts", JSON.stringify(countsMap));
      }
    } catch (e) {}

    window.dispatchEvent(new Event("wishlistUpdated"));
    loadWishlistGrid();
    showToastNotice("Item removed from your wishlist.");
  }
};

window.addWishlistItemToCart = function (idx) {
  let items = [];
  try {
    items = JSON.parse(localStorage.getItem("userWishlist")) || [];
  } catch (e) { items = []; }

  if (idx < 0 || idx >= items.length) return;
  const item = items[idx];

  let cart = localStorage.getItem("shoppingCart");
  cart = cart ? JSON.parse(cart) : [];

  const variantStr = (item.color || item.size) ? `${item.color || 'Black'} / ${item.size || 'M'}` : "Standard Edition";
  const existing = cart.find(c => c.name === item.name && c.variant === variantStr);
  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({
      id: item.id || ("WISHLIST-" + Date.now()),
      name: item.name,
      price: item.price || 0,
      img: item.img,
      quantity: 1,
      variant: variantStr
    });
  }

  localStorage.setItem("shoppingCart", JSON.stringify(cart));
  window.dispatchEvent(new Event("cartUpdated"));
  
  // Remove from wishlist after moving to cart
  items.splice(idx, 1);
  localStorage.setItem("userWishlist", JSON.stringify(items));
  window.dispatchEvent(new Event("wishlistUpdated"));
  
  loadWishlistGrid();
  alert(`${item.name} moved to your cart!`);
};
