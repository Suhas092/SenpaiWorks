/**
 * SenpaiWorks Admin Console - Authentication & Security Module
 * scripts/admin/admin-auth.js
 */

// ── Centralized Admin Token Utilities ─────────────────────
window.getAdminToken = function () {
  return ""; // In-accessible to JavaScript via httpOnly cookie
};

window.setAdminToken = function () {
  // Cookies are managed by server set-cookie headers
};

window.getAdminTokenHeaders = function () {
  return {
    "Content-Type": "application/json"
  };
};

// Refresh token by making a request to /api/admin/me every 6 hours to keep session alive
window.startAdminTokenRefresh = function () {
  const refreshInterval = 6 * 60 * 60 * 1000; // 6 hours
  setInterval(async () => {
    try {
      const res = await fetch("/api/admin/me", {
        method: "GET",
        credentials: "include"
      });
      if (res.ok) {
        console.log("[Admin Auth] Token refresh successful - session extended");
      } else if (res.status === 401) {
        console.warn("[Admin Auth] Token expired - admin needs to re-login");
        if (typeof window.showAdminToast === 'function') {
          window.showAdminToast("Admin session expired. Please log in again.", "warning");
        }
      }
    } catch (err) {
      console.error("[Admin Auth] Token refresh error:", err);
    }
  }, refreshInterval);
};

window.handleAdminResponse = function (res) {
  if (res.status === 401) {
    const overlay = document.getElementById("admin-auth-overlay");
    if (overlay) overlay.classList.add("active");
  }
  return res;
};


// ── Admin Auth Initialization ─────────────────────────────
window.initAdminAuth = async function () {
  const overlay = document.getElementById("admin-auth-overlay");
  const loginForm = document.getElementById("admin-login-form");
  const errorMsg = document.getElementById("admin-login-error");

  // Verify httpOnly cookie session on page load/refresh
  try {
    const checkRes = await fetch("/api/admin/me");
    if (checkRes.ok) {
      const data = await checkRes.json();
      if (overlay) overlay.classList.remove("active");
      const roleSubtitle = document.getElementById("sidebar-role-subtitle");
      if (roleSubtitle && data && data.adminUser) {
        roleSubtitle.textContent = data.adminUser.isSuper ? "SUPER ADMIN" : "NORMAL ADMIN";
      }
    } else {
      if (overlay) overlay.classList.add("active");
    }
  } catch (e) {
    if (overlay) overlay.classList.add("active");
  }

  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const usernameInput = document.getElementById("admin-username");
      const passwordInput = document.getElementById("admin-password");
      const submitBtn = document.getElementById("admin-login-btn");

      if (errorMsg) errorMsg.style.display = "none";
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Verifying...';
      }

      try {
        const response = await fetch("/api/admin/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: usernameInput ? usernameInput.value.trim() : "",
            password: passwordInput ? passwordInput.value : ""
          })
        });

        const data = await response.json();

        if (response.ok && data.success) {
          if (overlay) overlay.classList.remove("active");
          if (loginForm) loginForm.reset();
          
          if (typeof window.showAdminToast === "function") {
            window.showAdminToast("Admin authenticated successfully.", "success");
          }

          // Trigger data reload across modules
          if (typeof window.loadDashboardStats === "function") window.loadDashboardStats();
          if (typeof window.loadArtworks === "function") window.loadArtworks();
          if (typeof window.loadProducts === "function") window.loadProducts();
          if (typeof window.loadOrders === "function") window.loadOrders();
          if (typeof window.loadAdminFaqs === "function") window.loadAdminFaqs();
          if (typeof window.loadAdminAlerts === "function") window.loadAdminAlerts();
        } else {
          if (errorMsg) {
            errorMsg.textContent = data.error || "Invalid admin username or passcode.";
            errorMsg.style.display = "block";
          }
        }
      } catch (err) {
        console.error("Admin Auth Error:", err);
        if (errorMsg) {
          errorMsg.textContent = "Unable to connect to server. Please verify backend is running on port 5000.";
          errorMsg.style.display = "block";
        }
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = '<i class="fa-solid fa-lock-open"></i> Unlock Admin Dashboard';
        }
      }
    });
  }

  function setupLogoutBtn(btn) {
    if (!btn || btn.dataset.hasLogout) return;
    btn.dataset.hasLogout = "true";
    btn.addEventListener("click", async (e) => {
      e.preventDefault();
      e.stopPropagation();
      const confirmed = await window.showAdminConfirm(
        "Sign Out Admin",
        "Are you sure you want to sign out from the SenpaiWorks Admin Control Center?",
        "Sign Out",
        "warning"
      );
      if (!confirmed) return;

      try {
        await fetch("/api/admin/logout", { method: "POST", credentials: "same-origin" });
      } catch (err) {
        console.error("Admin logout error:", err);
      }

      // Show the login overlay directly so sign-out does not depend on a page reload.
      if (loginForm) loginForm.reset();
      if (errorMsg) errorMsg.style.display = "none";
      if (overlay) overlay.classList.add("active");
    });
  }

  setupLogoutBtn(document.getElementById("sidebar-btn-logout"));
  setupLogoutBtn(document.getElementById("header-btn-logout"));

  // Passcode Visibility Eye Toggle
  const togglePassBtn = document.getElementById("toggle-admin-pass");
  const passInput = document.getElementById("admin-password");
  const toggleIcon = document.getElementById("toggle-pass-icon");

  if (togglePassBtn && passInput && toggleIcon) {
    togglePassBtn.addEventListener("click", () => {
      const isPassword = passInput.type === "password";
      passInput.type = isPassword ? "text" : "password";
      toggleIcon.className = isPassword ? "fa-solid fa-eye-slash" : "fa-solid fa-eye";
    });
  }

  // Start automatic token refresh every 6 hours to keep session alive
  window.startAdminTokenRefresh();
};
