"use strict";

document.addEventListener("DOMContentLoaded", () => {
  initAccountCenter();

  // Watch for storage changes to sync wishlist tab
  window.addEventListener("storage", (e) => {
    if (e.key === "userWishlist" && window.location.hash === "#wishlist") {
      if (typeof window.loadWishlistGrid === "function") {
        window.loadWishlistGrid();
      }
    }
  });
});

function getCurrentUser() {
  const isLoggedOut = localStorage.getItem("userLoggedOut") === "true" || localStorage.getItem("isLoggedIn") === "false";
  if (isLoggedOut) return null;

  const user = localStorage.getItem("currentUser");
  if (user) {
    try {
      return JSON.parse(user);
    } catch (e) {
      return null;
    }
  }
  return null;
}
window.getCurrentUser = getCurrentUser;

function initAccountCenter() {
  if (window.Auth) {
    if (!window.Auth.requireAuth("profile.html")) return;
  } else {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      window.location.href = "login.html?redirect=profile.html";
      return;
    }
  }

  if (typeof window.loadUserProfileData === "function") window.loadUserProfileData();
  if (typeof window.setupAvatarUpload === "function") window.setupAvatarUpload();
  if (typeof window.setupFormHandlers === "function") window.setupFormHandlers();
  if (typeof window.setupStarPicker === "function") window.setupStarPicker();
  if (typeof window.loadFeedbackHistory === "function") window.loadFeedbackHistory();
  if (typeof window.loadNotificationsInbox === "function") window.loadNotificationsInbox();
  if (typeof window.loadWishlistGrid === "function") window.loadWishlistGrid();
  if (typeof window.loadSavedAddresses === "function") window.loadSavedAddresses();
  if (typeof window.setupCropZoom === "function") window.setupCropZoom();
  setupSignoutModalListeners();

  // Check URL hash tab parameter (e.g. #orders, #my-reviews, #feedback, #notifications)
  const rawHash = window.location.hash.replace("#", "");
  const hash = rawHash.split('?')[0];
  if (hash && ["profile", "orders", "my-reviews", "feedback", "notifications", "addresses", "wishlist", "payments", "security"].includes(hash)) {
    window.switchAccountTab(hash);
  } else {
    window.switchAccountTab("profile");
  }

  // Check if a pending notification was clicked from the header notification bar
  const pendingNotifId = sessionStorage.getItem('pending_open_notif_id');
  if (pendingNotifId) {
    sessionStorage.removeItem('pending_open_notif_id');
    window.switchAccountTab('notifications');
    setTimeout(() => {
      if (typeof window.openDirectNotificationById === 'function') {
        window.openDirectNotificationById(pendingNotifId);
      }
    }, 50);
  }
}
window.initAccountCenter = initAccountCenter;

function setupSignoutModalListeners() {
  const signoutModal = document.getElementById("signout-modal");
  const cancelBtn = document.getElementById("signout-cancel-btn");
  const confirmBtn = document.getElementById("signout-confirm-btn");

  if (cancelBtn && signoutModal) {
    cancelBtn.onclick = () => {
      signoutModal.classList.remove("active");
    };
  }

  if (confirmBtn) {
    confirmBtn.onclick = () => {
      if (window.Auth) {
        window.Auth.logout("home.html");
      } else {
        localStorage.removeItem("currentUser");
        localStorage.setItem("userLoggedOut", "true");
        localStorage.setItem("isLoggedIn", "false");
        sessionStorage.clear();
        window.location.href = "home.html";
      }
    };
  }
}
window.setupSignoutModalListeners = setupSignoutModalListeners;

// 1. SIGN OUT HANDLER
window.handleSignOut = function () {
  const signoutModal = document.getElementById("signout-modal");
  if (signoutModal) {
    signoutModal.classList.add("active");
  } else {
    if (window.Auth) {
      window.Auth.logout("home.html");
    } else {
      localStorage.removeItem("currentUser");
      localStorage.setItem("userLoggedOut", "true");
      localStorage.setItem("isLoggedIn", "false");
      sessionStorage.clear();
      window.location.href = "home.html";
    }
  }
};

// 2. SWITCH ACCOUNT TAB
window.switchAccountTab = function (tabName) {
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

  if (tabName === "my-reviews" && window.loadMyReviewsList) {
    window.loadMyReviewsList();
  }

  if (tabName === "wishlist") {
    if (window.clearWishlistHighlight) {
      window.clearWishlistHighlight();
    } else {
      localStorage.setItem("wishlist_has_unseen_items", "false");
      window.dispatchEvent(new Event("wishlistUpdated"));
    }
  }

  if (history.pushState) {
    history.pushState(null, null, `#${tabName}`);
  } else {
    window.location.hash = `#${tabName}`;
  }
};
