"use strict";

let selectedStarRating = 5;
let rawCropperImage = null;
let currentZoom = 1;

document.addEventListener("DOMContentLoaded", () => {
  initAccountCenter();
});

function getCurrentUser() {
  const user = localStorage.getItem("currentUser");
  if (user) return JSON.parse(user);
  return {
    username: "suhas",
    name: "Suhas",
    email: "suhassenpai@gmail.com",
    avatar: "https://res.cloudinary.com/dmzchsqms/image/upload/f_auto,q_auto/w_600/v1757630848/rem_happy_evhesz.webp"
  };
}

function initAccountCenter() {
  loadUserProfileData();
  setupAvatarUpload();
  setupFormHandlers();
  setupStarPicker();
  loadFeedbackHistory();
  loadNotificationsInbox();
  loadWishlistGrid();
  setupCropZoom();

  // Check URL hash tab parameter (e.g. #orders, #feedback, #notifications)
  const hash = window.location.hash.replace("#", "");
  if (hash && ["profile", "orders", "feedback", "notifications", "addresses", "wishlist", "payments", "security"].includes(hash)) {
    switchAccountTab(hash);
  } else {
    switchAccountTab("profile");
  }
}

// 1. SIGN OUT HANDLER
window.handleSignOut = function() {
  if (confirm("Are you sure you want to sign out from your SenpaiWorks account?")) {
    localStorage.removeItem("currentUser");
    alert("You have been signed out.");
    window.location.href = "index.html";
  }
};

// 2. SWITCH ACCOUNT TAB
window.switchAccountTab = function(tabName) {
  const navBtns = document.querySelectorAll(".account-nav-btn");
  navBtns.forEach(btn => {
    if (btn.getAttribute("data-tab") === tabName) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  });

  const panels = document.querySelectorAll(".account-tab-panel");
  panels.forEach(panel => {
    if (panel.id === `tab-panel-${tabName}`) {
      panel.classList.add("active");
    } else {
      panel.classList.remove("active");
    }
  });

  if (tabName === "orders" && window.filterOrders) {
    window.filterOrders("all");
  }

  if (history.pushState) {
    history.pushState(null, null, `#${tabName}`);
  } else {
    window.location.hash = `#${tabName}`;
  }
};

// 3. LOAD USER PROFILE DATA
function loadUserProfileData() {
  const currentUser = getCurrentUser();

  const bannerName = document.getElementById("acc-banner-name");
  const bannerEmail = document.getElementById("acc-banner-email");
  const bannerAvatar = document.getElementById("acc-banner-avatar");

  if (bannerName) bannerName.textContent = currentUser.name || currentUser.username || "Suhas";
  if (bannerEmail) bannerEmail.textContent = currentUser.email || "suhassenpai@gmail.com";
  if (bannerAvatar && currentUser.avatar) bannerAvatar.src = currentUser.avatar;

  const usernameInput = document.getElementById("profile-username");
  const fullnameInput = document.getElementById("profile-fullname");
  const emailInput = document.getElementById("profile-email");
  const phoneInput = document.getElementById("profile-phone");
  const bioInput = document.getElementById("profile-bio");
  const avatarPreview = document.getElementById("profile-avatar-preview");

  if (usernameInput) usernameInput.value = currentUser.username || "";
  if (fullnameInput) fullnameInput.value = currentUser.name || currentUser.username || "";
  if (emailInput) emailInput.value = currentUser.email || "";
  if (phoneInput) phoneInput.value = currentUser.phone || "+91 98765 43210";
  if (bioInput) bioInput.value = currentUser.bio || "Anime art enthusiast & digital collector at SenpaiWorks.";
  if (avatarPreview && currentUser.avatar) avatarPreview.src = currentUser.avatar;
}

// 4. AVATAR UPLOAD WITH 1MB LIMIT & CROP MODAL
function setupAvatarUpload() {
  const trigger = document.getElementById("avatar-upload-trigger");
  const fileInput = document.getElementById("profile-avatar-file");

  if (trigger && fileInput) {
    trigger.addEventListener("click", () => fileInput.click());
  }

  if (fileInput) {
    fileInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file) return;

      // 1MB FILE SIZE LIMIT CHECK
      const maxSizeBytes = 1024 * 1024; // 1 MB
      if (file.size > maxSizeBytes) {
        alert("File size exceeds 1MB limit!\nPlease select an image file smaller than 1MB.");
        fileInput.value = "";
        return;
      }

      if (!file.type.startsWith("image/")) {
        alert("Please select a valid image file (JPG, PNG, or WebP).");
        fileInput.value = "";
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          rawCropperImage = img;
          resetCropOffsets();
          const range = document.getElementById("crop-zoom-range");
          if (range) range.value = 1;
          openCropModal();
          drawCropCanvas();
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    });
  }
}

function openCropModal() {
  const modal = document.getElementById("crop-avatar-modal");
  if (modal) modal.classList.add("active");
}

window.closeCropModal = function() {
  const modal = document.getElementById("crop-avatar-modal");
  if (modal) modal.classList.remove("active");
  const fileInput = document.getElementById("profile-avatar-file");
  if (fileInput) fileInput.value = "";
};

let cropOffsetX = 0;
let cropOffsetY = 0;
let isDraggingCrop = false;
let dragStartX = 0;
let dragStartY = 0;

function setupCropZoom() {
  const range = document.getElementById("crop-zoom-range");
  if (range) {
    range.addEventListener("input", (e) => {
      currentZoom = parseFloat(e.target.value);
      drawCropCanvas();
    });
  }
  setupCropCanvasListeners();
}

function setupCropCanvasListeners() {
  const canvas = document.getElementById("crop-canvas");
  if (!canvas) return;

  canvas.addEventListener("mousedown", (e) => {
    isDraggingCrop = true;
    dragStartX = e.clientX - cropOffsetX;
    dragStartY = e.clientY - cropOffsetY;
    canvas.style.cursor = "grabbing";
  });

  window.addEventListener("mousemove", (e) => {
    if (!isDraggingCrop) return;
    cropOffsetX = e.clientX - dragStartX;
    cropOffsetY = e.clientY - dragStartY;
    drawCropCanvas();
  });

  window.addEventListener("mouseup", () => {
    if (isDraggingCrop) {
      isDraggingCrop = false;
      const cvs = document.getElementById("crop-canvas");
      if (cvs) cvs.style.cursor = "grab";
    }
  });

  canvas.addEventListener("touchstart", (e) => {
    if (e.touches.length === 1) {
      isDraggingCrop = true;
      dragStartX = e.touches[0].clientX - cropOffsetX;
      dragStartY = e.touches[0].clientY - cropOffsetY;
    }
  }, { passive: true });

  canvas.addEventListener("touchmove", (e) => {
    if (isDraggingCrop && e.touches.length === 1) {
      cropOffsetX = e.touches[0].clientX - dragStartX;
      cropOffsetY = e.touches[0].clientY - dragStartY;
      drawCropCanvas();
    }
  }, { passive: true });

  canvas.addEventListener("touchend", () => {
    isDraggingCrop = false;
  });

  canvas.addEventListener("wheel", (e) => {
    e.preventDefault();
    const range = document.getElementById("crop-zoom-range");
    const delta = e.deltaY < 0 ? 0.05 : -0.05;
    currentZoom = Math.min(3, Math.max(1, currentZoom + delta));
    if (range) range.value = currentZoom;
    drawCropCanvas();
  }, { passive: false });
}

function resetCropOffsets() {
  cropOffsetX = 0;
  cropOffsetY = 0;
  currentZoom = 1;
}

function drawCropCanvas() {
  const canvas = document.getElementById("crop-canvas");
  if (!canvas || !rawCropperImage) return;

  const ctx = canvas.getContext("2d");
  const canvasSize = 260;
  canvas.width = canvasSize;
  canvas.height = canvasSize;

  ctx.clearRect(0, 0, canvasSize, canvasSize);

  // Calculate base scale & dimensions
  const minDim = Math.min(rawCropperImage.width, rawCropperImage.height);
  const scale = (canvasSize / minDim) * currentZoom;

  const drawWidth = rawCropperImage.width * scale;
  const drawHeight = rawCropperImage.height * scale;

  const dx = (canvasSize - drawWidth) / 2 + cropOffsetX;
  const dy = (canvasSize - drawHeight) / 2 + cropOffsetY;

  ctx.drawImage(rawCropperImage, dx, dy, drawWidth, drawHeight);

  // Draw dark semi-transparent backdrop mask outside 200px circle
  ctx.save();
  ctx.fillStyle = "rgba(15, 23, 42, 0.65)";
  ctx.beginPath();
  ctx.rect(0, 0, canvasSize, canvasSize);
  ctx.arc(canvasSize / 2, canvasSize / 2, 100, 0, Math.PI * 2, true);
  ctx.fill();
  ctx.restore();

  // Draw white border ring around circle crop area
  ctx.save();
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(canvasSize / 2, canvasSize / 2, 100, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

window.saveCroppedAvatar = function() {
  const canvas = document.getElementById("crop-canvas");
  if (!canvas || !rawCropperImage) return;

  const outputCanvas = document.createElement("canvas");
  outputCanvas.width = 200;
  outputCanvas.height = 200;
  const ctx = outputCanvas.getContext("2d");

  ctx.beginPath();
  ctx.arc(100, 100, 100, 0, Math.PI * 2);
  ctx.clip();

  const minDim = Math.min(rawCropperImage.width, rawCropperImage.height);
  const scale = (260 / minDim) * currentZoom;
  const drawWidth = rawCropperImage.width * scale;
  const drawHeight = rawCropperImage.height * scale;

  const ratio = 200 / 260;
  const dx = ((260 - drawWidth) / 2 + cropOffsetX) * ratio;
  const dy = ((260 - drawHeight) / 2 + cropOffsetY) * ratio;

  ctx.drawImage(rawCropperImage, dx, dy, drawWidth * ratio, drawHeight * ratio);

  const croppedBase64 = outputCanvas.toDataURL("image/webp", 0.9);

  const avatarPreview = document.getElementById("profile-avatar-preview");
  const bannerAvatar = document.getElementById("acc-banner-avatar");
  if (avatarPreview) avatarPreview.src = croppedBase64;
  if (bannerAvatar) bannerAvatar.src = croppedBase64;

  let user = getCurrentUser();
  user.avatar = croppedBase64;
  localStorage.setItem("currentUser", JSON.stringify(user));

  showStatus("Profile picture updated successfully!", true);
  window.closeCropModal();
};

function showStatus(text, isSuccess) {
  const msgEl = document.getElementById("profile-form-message");
  if (!msgEl) return;
  msgEl.textContent = text;
  msgEl.className = "profile-message " + (isSuccess ? "success" : "error");
}

// 5. PROFILE FORM SUBMIT
function setupFormHandlers() {
  const form = document.getElementById("profile-edit-form");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const username = document.getElementById("profile-username").value.trim();
    const name = document.getElementById("profile-fullname").value.trim();
    const email = document.getElementById("profile-email").value.trim();
    const phone = document.getElementById("profile-phone").value.trim();
    const bio = document.getElementById("profile-bio").value.trim();
    const password = document.getElementById("profile-new-password").value;

    if (!username || !email) {
      showStatus("Username and Email are required.", false);
      return;
    }

    let user = getCurrentUser();
    const updatedUser = {
      ...user,
      username,
      name,
      email,
      phone,
      bio
    };

    localStorage.setItem("currentUser", JSON.stringify(updatedUser));
    showStatus("Profile details updated successfully!", true);

    const bannerName = document.getElementById("acc-banner-name");
    const bannerEmail = document.getElementById("acc-banner-email");
    if (bannerName) bannerName.textContent = name || username;
    if (bannerEmail) bannerEmail.textContent = email;

    if (password) {
      document.getElementById("profile-new-password").value = "";
    }
  });
}

// 6. STAR RATING PICKER
function setupStarPicker() {
  const stars = document.querySelectorAll("#star-picker .star-btn");
  const valTxt = document.getElementById("star-rating-val");

  stars.forEach(star => {
    star.addEventListener("click", () => {
      selectedStarRating = parseInt(star.getAttribute("data-val"));
      stars.forEach(s => {
        const sVal = parseInt(s.getAttribute("data-val"));
        if (sVal <= selectedStarRating) {
          s.classList.add("active");
        } else {
          s.classList.remove("active");
        }
      });
      if (valTxt) valTxt.textContent = `${selectedStarRating} / 5`;
    });
  });
}

// 7. FEEDBACK SUBMISSION
window.handleAccountFeedbackSubmit = function(e) {
  if (e) e.preventDefault();
  const category = document.getElementById("feedback-category-select").value;
  const msg = document.getElementById("feedback-msg-input").value.trim();
  if (!msg) return;

  const newFeedback = {
    id: "FB-" + Math.floor(1000 + Math.random() * 9000),
    date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    category: category.toUpperCase(),
    rating: selectedStarRating,
    message: msg,
    status: "Reviewed & Approved"
  };

  let history = localStorage.getItem("accountFeedbackHistory");
  history = history ? JSON.parse(history) : [];
  history.unshift(newFeedback);
  localStorage.setItem("accountFeedbackHistory", JSON.stringify(history));

  document.getElementById("feedback-msg-input").value = "";
  alert("Thank you for your feedback! Your review has been recorded.");
  loadFeedbackHistory();
};

function loadFeedbackHistory() {
  const container = document.getElementById("feedback-history-list");
  if (!container) return;

  let history = localStorage.getItem("accountFeedbackHistory");
  history = history ? JSON.parse(history) : [
    {
      id: "FB-8842",
      date: "Jul 24, 2026",
      category: "APPAREL & MERCH",
      rating: 5,
      message: "The Itachi 240GSM cotton tee is top tier quality! Print holds up amazingly after washes.",
      status: "Reviewed by Studio"
    }
  ];

  let html = "";
  history.forEach(item => {
    let starsHtml = "";
    for (let i = 1; i <= 5; i++) {
      starsHtml += `<i class="fa-solid fa-star" style="color: ${i <= item.rating ? '#f59e0b' : '#cbd5e1'}; font-size: 0.85rem;"></i>`;
    }

    html += `
      <div style="background: #f8fafc; padding: 16px; border-radius: 10px; border: 1px solid #e2e8f0; margin-bottom: 12px;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
          <span style="font-size: 0.78rem; font-weight: 800; color: #0066cc;">${item.category}</span>
          <span style="font-size: 0.8rem; color: #64748b;">${item.date}</span>
        </div>
        <div style="margin-bottom: 6px;">${starsHtml}</div>
        <p style="font-size: 0.9rem; color: #0f172a; margin: 0 0 8px 0; line-height: 1.5;">"${item.message}"</p>
        <span class="verified-tag"><i class="fa-solid fa-circle-check"></i> ${item.status}</span>
      </div>
    `;
  });

  container.innerHTML = html;
}

// 8. NOTIFICATIONS INBOX
function loadNotificationsInbox() {
  const container = document.getElementById("notifications-inbox-list");
  if (!container) return;

  const notifs = [
    {
      id: 1,
      title: "Order Dispatch Notification",
      desc: "Order #ORD-105010 has been packed and handed over to Blue Dart Express.",
      time: "2 hours ago",
      icon: "fa-truck-fast",
      unread: true
    },
    {
      id: 2,
      title: "Welcome Registration Discount Active",
      desc: "Use promo code SENPAI100 at checkout to get ₹100.00 OFF your purchase!",
      time: "1 day ago",
      icon: "fa-gift",
      unread: true
    }
  ];

  let html = "";
  notifs.forEach(n => {
    html += `
      <div class="notif-item ${n.unread ? 'unread' : ''}">
        <div class="notif-icon"><i class="fa-solid ${n.icon}"></i></div>
        <div class="notif-body">
          <div class="notif-title">${n.title}</div>
          <div class="notif-desc">${n.desc}</div>
          <div class="notif-time">${n.time}</div>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}

window.markAllNotificationsRead = function() {
  const unreadItems = document.querySelectorAll(".notif-item.unread");
  unreadItems.forEach(item => item.classList.remove("unread"));
  const unreadDot = document.getElementById("nav-notif-unread");
  if (unreadDot) unreadDot.style.display = "none";
};

// 9. WISHLIST GRID
function loadWishlistGrid() {
  const container = document.getElementById("wishlist-items-grid");
  if (!container) return;

  let items = [];
  try {
    items = JSON.parse(localStorage.getItem("userWishlist")) || [];
  } catch (e) { items = []; }

  if (items.length === 0) {
    container.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: #64748b; padding: 40px 0;"><i class="fa-regular fa-heart" style="font-size: 2rem; margin-bottom: 10px; display: block;"></i>Your Wishlist is currently empty. Explore our store to save items!</div>`;
    return;
  }

  let html = "";
  items.forEach(item => {
    html += `
      <div class="wishlist-card">
        <img src="${item.img}" alt="${item.name}" class="wishlist-img">
        <div class="wishlist-info">
          <div class="wishlist-title">${item.name}</div>
          <div class="wishlist-price">₹${item.price.toLocaleString()}.00</div>
          <button onclick="addWishlistItemToCart('${item.name.replace(/'/g, "\\'")}', ${item.price}, '${item.img.replace(/'/g, "\\'")}')" class="btn-order-action primary" style="width: 100%; justify-content: center;">
            <i class="fa-solid fa-cart-plus"></i> Move to Cart
          </button>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}

window.addWishlistItemToCart = function(name, price, img) {
  let cart = localStorage.getItem("shoppingCart");
  cart = cart ? JSON.parse(cart) : [];

  const existing = cart.find(c => c.name === name);
  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({
      id: "WISHLIST-" + Date.now(),
      name,
      price,
      img,
      quantity: 1,
      variant: "Standard Edition"
    });
  }

  localStorage.setItem("shoppingCart", JSON.stringify(cart));
  alert(`${name} added to your cart! Redirecting to Store...`);
  window.location.href = "store.html";
};

window.openAddAddressModal = function() {
  alert("Enter new shipping address details:\n(Demo: Address added to saved list!)");
};
