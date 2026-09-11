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
      if (overlay) overlay.classList.remove("active");
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
    btn.onclick = async (e) => {
      e.preventDefault();
      e.stopPropagation();
      const confirmed = await window.showAdminConfirm(
        "Sign Out Admin",
        "Are you sure you want to sign out from the SenpaiWorks Admin Control Center?",
        "Sign Out",
        "warning"
      );
      if (confirmed) {
        try {
          await fetch("/api/admin/logout", { method: "POST" });
        } catch (e) {}
        location.reload();
      }
    };
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
};
