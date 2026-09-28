"use strict";

// 9. WISHLIST GRID - Load from API with localStorage fallback
// Safe auth token accessor: some pages define getAuthToken(), but it may not be declared in all contexts
function safeGetAuthToken() {
  try {
    if (typeof getAuthToken === 'function') return getAuthToken();
  } catch (e) {}
  try {
    return localStorage.getItem('auth_token') || null;
  } catch (e) {
    return null;
  }
}

async function loadWishlistGrid() {
  const container = document.getElementById("wishlist-items-grid");
  if (!container) return;

  let items = [];
  
  try {
    const token = safeGetAuthToken();
    if (token) {
      // Fetch from backend
      const res = await fetch("/api/wishlist", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        items = data.items || [];
        // Cache in localStorage for offline viewing
        localStorage.setItem("userWishlist", JSON.stringify(items));
      } else {
        // Fallback to localStorage if API fails
        items = JSON.parse(localStorage.getItem("userWishlist")) || [];
      }
    } else {
      // Not authenticated, load from localStorage
      items = JSON.parse(localStorage.getItem("userWishlist")) || [];
    }
  } catch (e) {
    console.warn("Wishlist fetch error:", e);
    items = JSON.parse(localStorage.getItem("userWishlist")) || [];
  }

  if (items.length === 0) {
    container.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: #64748b; padding: 40px 0;"><i class="fa-regular fa-bookmark" style="font-size: 2rem; margin-bottom: 10px; display: block; color: #ff4d6a;"></i>Your Wishlist is currently empty. Explore our store and save items to your wishlist!</div>`;
    return;
  }

  let html = "";
  items.forEach((item, idx) => {
    const itemData = item.itemData || item || {};

    // Normalize id and type because wishlist items may be stored in different shapes
    const normalizedId = item.itemId || item.id || item._id || itemData.itemId || itemData.id || itemData._id || '';
    const normalizedType = item.itemType || item.type || itemData.type || (itemData.category ? 'product' : 'artwork');

    const variantInfo = (itemData.color || itemData.size) ? `<div class="wishlist-variant-info" style="font-size: 0.78rem; font-weight: 600; color: #64748b; margin-top: 4px; margin-bottom: 8px;"><i class="fa-solid fa-tags" style="color: #ff4d6a; margin-right: 4px;"></i>Colour: ${itemData.color || 'Standard'} | Size: ${itemData.size || 'M'}</div>` : '';
    const dateSaved = item.createdAt ? `<div style="font-size: 0.72rem; color: #94a3b8; margin-bottom: 6px;">Saved on ${new Date(item.createdAt).toLocaleDateString('en-IN')}</div>` : '';

    const detailHref = normalizedType === 'artwork' 
      ? `art-library.html?artworkId=${encodeURIComponent(normalizedId)}`
      : `store-detail.html?id=${encodeURIComponent(normalizedId)}`;

    html += `
      <div class="wishlist-card" style="position: relative;">
        <a href="${detailHref}" style="display: block; overflow: hidden; border-radius: 8px 8px 0 0;">
          <img src="${itemData.image || 'assets/SenpaiWorks logo.png'}" alt="${itemData.name || ''}" class="wishlist-img" style="width: 100%; aspect-ratio: 3 / 4; object-fit: cover; transition: transform 0.2s ease;">
        </a>
        <div class="wishlist-info">
          <div class="wishlist-title"><a href="${detailHref}" style="color: inherit; text-decoration: none;">${itemData.name || ''}</a></div>
          ${variantInfo}
          ${dateSaved}
          ${itemData.price ? `<div class="wishlist-price">₹${(itemData.price || 0).toLocaleString('en-IN')}.00</div>` : ''}
          <div style="display: flex; gap: 8px; margin-top: 12px;">
            ${normalizedType !== 'artwork' ? `<button onclick="addWishlistItemToCart('${normalizedId}', '${normalizedType}')" class="btn-order-action primary" style="flex: 1; justify-content: center; font-size: 0.82rem;">
              <i class="fa-solid fa-cart-plus"></i> Move to Cart
            </button>` : ''}
            <button onclick="removeWishlistItem('${normalizedId}', '${normalizedType}')" class="btn-order-action secondary" style="color: #ef4444; border-color: #fecdd3; padding: 6px 12px;" title="Remove from Wishlist">
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

window.removeWishlistItem = async function (itemId, itemType) {
  console.log('[Wishlist] removeWishlistItem called', { itemId, itemType });
  // Always remove locally first for instant UI feedback
  try {
    let items = JSON.parse(localStorage.getItem("userWishlist")) || [];
    const beforeCount = items.length;
    items = items.filter(item => {
      const candidateId = item.itemId || item.id || item._id || (item.itemData && (item.itemData.itemId || item.itemData.id || item.itemData._id));
      const candidateType = item.itemType || item.type || (item.itemData && item.itemData.type) || (item.itemData && item.itemData.category ? 'product' : 'artwork');
      return !(String(candidateId) === String(itemId) && String(candidateType) === String(itemType));
    });
    localStorage.setItem("userWishlist", JSON.stringify(items));
    localStorage.removeItem(`wishlist_${itemId}`);
    window.dispatchEvent(new Event("wishlistUpdated"));
    await loadWishlistGrid();
    if (beforeCount !== items.length) showToastNotice("Item removed from your wishlist.");
  } catch (e) {
    console.warn("Local remove wishlist error:", e);
  }

  // If authenticated, attempt server-side removal; otherwise skip but keep local change
  try {
    const token = safeGetAuthToken();
    if (!token) {
      // Not authenticated — local change only
      return;
    }

    const res = await fetch(`/api/wishlist/remove/${itemId}/${itemType}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    if (!res.ok) {
      console.warn('Server wishlist removal failed', res.status);
    }
  } catch (e) {
    console.error("Remove wishlist error:", e);
  }
};

window.addWishlistItemToCart = async function (itemId, itemType) {
  console.log('[Wishlist] addWishlistItemToCart called', { itemId, itemType });
  if (itemType === 'artwork') {
    showToastNotice("Artworks cannot be added to cart. View the artwork instead.");
    return;
  }

  try {
    let items = JSON.parse(localStorage.getItem("userWishlist")) || [];
    const wishlistItem = items.find(item => {
      const candidateId = item.itemId || item.id || item._id || (item.itemData && (item.itemData.itemId || item.itemData.id || item.itemData._id));
      return String(candidateId) === String(itemId);
    });
    if (!wishlistItem) return;

    const itemData = wishlistItem.itemData || wishlistItem;
    let cart = localStorage.getItem("shoppingCart");
    cart = cart ? JSON.parse(cart) : [];

    const variantStr = (itemData.color || itemData.size) ? `${itemData.color || 'Black'} / ${itemData.size || 'M'}` : "Standard Edition";
    const existing = cart.find(c => c.name === itemData.name && c.variant === variantStr);
    if (existing) {
      existing.quantity += 1;
    } else {
      cart.push({
        id: itemId || ("WISHLIST-" + Date.now()),
        name: itemData.name,
        price: itemData.price || 0,
        img: itemData.image,
        quantity: 1,
        variant: variantStr
      });
    }

    localStorage.setItem("shoppingCart", JSON.stringify(cart));
    window.dispatchEvent(new Event("cartUpdated"));
    
    // Remove from wishlist
    await removeWishlistItem(itemId, itemType);
    showToastNotice(`${itemData.name} moved to your cart!`);
  } catch (e) {
    console.error("Add to cart error:", e);
    showToastNotice("Failed to add to cart");
  }
};

// Real-time wishlist sync
if (!window.hasWishlistSyncListener) {
  window.hasWishlistSyncListener = true;
  
  // Reload wishlist when updated event fires
  window.addEventListener("wishlistUpdated", () => {
    loadWishlistGrid();
  });

  // Poll for wishlist changes every 3 seconds
  setInterval(() => {
    const token = safeGetAuthToken();
    if (token && document.getElementById("tab-panel-wishlist")?.offsetParent !== null) {
      loadWishlistGrid().catch(() => {});
    }
  }, 3000);
}
