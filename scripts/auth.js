/**
 * SenpaiWorks Centralized Auth Manager (scripts/auth.js)
 * Manages user sessions, registration, login, logout, profile setup onboarding, and protected route redirects.
 */
(function (window) {
  "use strict";

  const STORAGE_KEYS = {
    CURRENT_USER: "currentUser",
    REGISTERED_USERS: "registeredUsers",
    IS_LOGGED_IN: "isLoggedIn",
    USER_LOGGED_OUT: "userLoggedOut",
    LAST_USER: "lastUser"
  };

  const Auth = {
    /**
     * Checks if a user is currently authenticated.
     * @returns {boolean}
     */
    isLoggedIn: function () {
      const isExplicitLoggedOut = localStorage.getItem(STORAGE_KEYS.USER_LOGGED_OUT) === "true";
      const isLoggedInFlag = localStorage.getItem(STORAGE_KEYS.IS_LOGGED_IN) === "true";
      const user = this.getCurrentUser();
      return !isExplicitLoggedOut && isLoggedInFlag && !!user;
    },

    /**
     * Retrieves the current logged in user object.
     * @returns {Object|null}
     */
    getCurrentUser: function () {
      const isLoggedOut = localStorage.getItem(STORAGE_KEYS.USER_LOGGED_OUT) === "true";
      if (isLoggedOut) return null;

      const userStr = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      if (userStr) {
        try {
          return JSON.parse(userStr);
        } catch (e) {
          return null;
        }
      }
      return null;
    },

    /**
     * Authenticates a user with email/username and password.
     * @param {string} emailOrUsername 
     * @param {string} password 
     * @returns {{ success: boolean, message?: string, user?: Object }}
     */
    /**
     * Authenticates a user with email/username and password via backend.
     * @param {string} emailOrUsername 
     * @param {string} password 
     * @returns {Promise<{ success: boolean, requireOtp?: boolean, message?: string, user?: Object, token?: string }>}
     */
    login: async function (emailOrUsername, password) {
      if (!emailOrUsername || !password) {
        return { success: false, message: "Please fill in all required fields." };
      }

      const cleanInput = emailOrUsername.trim();
      const deviceToken = localStorage.getItem("senpai_device_token") || null;

      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ email: cleanInput, username: cleanInput, password, deviceToken })
        });

        const data = await res.json();

        if (data.requireOtp) {
          return { success: false, requireOtp: true, email: data.email || cleanInput, message: data.message };
        }

        if (res.ok && data.success && data.token) {
          localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(data.user));
          localStorage.setItem(STORAGE_KEYS.LAST_USER, JSON.stringify(data.user));
          localStorage.setItem("userToken", data.token);
          if (data.deviceToken) {
            localStorage.setItem("senpai_device_token", data.deviceToken);
          }
          localStorage.setItem(STORAGE_KEYS.IS_LOGGED_IN, "true");
          localStorage.removeItem(STORAGE_KEYS.USER_LOGGED_OUT);

          return { success: true, user: data.user, token: data.token };
        }

        return { success: false, message: data.error || "Invalid credentials." };
      } catch (err) {
        return { success: false, message: "Server error. Please try again." };
      }
    },

    syncUserCart: function (cartData) {
      const user = this.getCurrentUser();
      if (!user || !user.email) return;
      const email = user.email.toLowerCase();
      const userKey = `userCart_${email}`;
      localStorage.setItem(userKey, JSON.stringify(cartData));

      user.cart = cartData;
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
      localStorage.setItem(STORAGE_KEYS.LAST_USER, JSON.stringify(user));

      const users = this.getRegisteredUsers();
      const idx = users.findIndex(u => u.email && u.email.toLowerCase() === email);
      if (idx !== -1) {
        users[idx].cart = cartData;
        localStorage.setItem(STORAGE_KEYS.REGISTERED_USERS, JSON.stringify(users));
      }
    },

    saveUserProfile: async function (updatedUser) {
      if (!updatedUser || !updatedUser.email) return;
      const email = updatedUser.email.toLowerCase();
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(updatedUser));
      localStorage.setItem(STORAGE_KEYS.LAST_USER, JSON.stringify(updatedUser));

      const users = this.getRegisteredUsers();
      const idx = users.findIndex(u => u.email && u.email.toLowerCase() === email);
      if (idx !== -1) {
        users[idx] = { ...users[idx], ...updatedUser };
      } else {
        users.push(updatedUser);
      }
      localStorage.setItem(STORAGE_KEYS.REGISTERED_USERS, JSON.stringify(users));

      try {
        const token = localStorage.getItem("userToken") || sessionStorage.getItem("userToken");
        const headers = { "Content-Type": "application/json" };
        if (token) headers["Authorization"] = `Bearer ${token}`;

        await fetch("/api/users/profile", {
          method: "POST",
          headers,
          body: JSON.stringify(updatedUser)
        });
      } catch (err) {
        console.warn("Backend user profile sync warning:", err);
      }
      window.dispatchEvent(new Event("profileUpdated"));
    },

    /**
     * Registers a new user via backend with OTP challenge.
     * @param {string} username 
     * @param {string} email 
     * @param {string} password 
     * @returns {Promise<{ success: boolean, requireOtp?: boolean, message?: string }>}
     */
    register: async function (username, email, password) {
      if (!username || !email || !password) {
        return { success: false, message: "Please complete all registration fields." };
      }

      const isStrongPass = password.length >= 8 &&
        /[A-Z]/.test(password) &&
        /[a-z]/.test(password) &&
        /[0-9]/.test(password) &&
        /[^A-Za-z0-9]/.test(password);

      if (!isStrongPass) {
        return { success: false, message: "Password must be at least 8 characters and include uppercase, lowercase, a number, and a special character." };
      }

      try {
        const res = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.trim(), username: username.trim(), password })
        });

        const data = await res.json();

        if (data.requireOtp || (res.ok && data.success)) {
          return { success: true, requireOtp: true, email: data.email || email.trim(), message: data.message };
        }

        return { success: false, message: data.error || "Registration failed." };
      } catch (err) {
        return { success: false, message: "Server error. Please try again." };
      }
    },

    /**
     * Completes initial profile setup onboarding for new accounts.
     * @param {Object} [profileData] 
     * @param {string} [redirectUrl]
     * @returns {Promise<{ success: boolean, message?: string, user?: Object }>}
     */
    completeProfileSetup: async function (profileData, redirectUrl) {
      const curUser = this.getCurrentUser();
      if (!curUser) {
        window.location.href = "login.html";
        return { success: false, message: "Not authenticated" };
      }

      const token = localStorage.getItem("userToken") || sessionStorage.getItem("userToken");
      const payload = {
        name: profileData?.name || curUser.name || curUser.username,
        phone: profileData?.phone || curUser.phone || "",
        avatar: profileData?.avatar || curUser.avatar,
        countryCode: profileData?.countryCode || curUser.countryCode
      };

      try {
        if (token) {
          const res = await fetch("/api/user/complete-profile-setup", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(payload)
          });
          const data = await res.json();
          if (res.ok && data.success && data.user) {
            Object.assign(curUser, data.user);
          }
        }
      } catch (err) {
        console.warn("[Auth] Backend complete-profile-setup sync notice:", err.message);
      }

      if (profileData) {
        if (profileData.name) curUser.name = profileData.name.trim();
        if (profileData.phone) curUser.phone = profileData.phone.trim();
        if (profileData.avatar) curUser.avatar = profileData.avatar;
        if (profileData.interest) curUser.interest = profileData.interest;
      }

      curUser.profile_completed = true;
      curUser.profileCompleted = true;

      this.saveUserProfile(curUser);

      this.handlePostLoginRedirect(redirectUrl || "home.html");
      return { success: true, user: curUser };
    },

    /**
     * Logs out the current user and clears session state.
     * @param {string} [redirectTarget="home.html"]
     */
    logout: function (redirectTarget) {
      const cur = this.getCurrentUser();
      if (cur && cur.email) {
        localStorage.setItem(STORAGE_KEYS.LAST_USER, JSON.stringify(cur));
        const currentCart = localStorage.getItem("shoppingCart");
        if (currentCart !== null) {
          localStorage.setItem(`userCart_${cur.email.toLowerCase()}`, currentCart);
        }
      }
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
      localStorage.removeItem("userToken");
      localStorage.removeItem("adminToken");
      localStorage.removeItem("shoppingCart");
      localStorage.setItem(STORAGE_KEYS.USER_LOGGED_OUT, "true");
      localStorage.setItem(STORAGE_KEYS.IS_LOGGED_IN, "false");
      sessionStorage.clear();

      const target = redirectTarget || "home.html";
      window.location.href = target;
    },

    /**
     * Route guard: Enforces authentication and profile setup on protected pages.
     * Redirects to login.html if unauthenticated, or profile-setup.html if setup is incomplete.
     * @param {string} [currentPath] 
     */
    requireAuth: function (currentPath) {
      if (!this.isLoggedIn()) {
        const path = currentPath || window.location.pathname.split("/").pop() || "profile.html";
        window.location.href = `login.html?redirect=${encodeURIComponent(path)}`;
        return false;
      }

      const curUser = this.getCurrentUser();
      const pageName = currentPath || window.location.pathname.split("/").pop();

      if (curUser && curUser.profile_completed === false && pageName !== "profile-setup.html") {
        window.location.href = "profile-setup.html";
        return false;
      }

      return true;
    },

    /**
     * Handles post-login redirect:
     * - If profile_completed is false, forces redirect to profile-setup.html
     * - Otherwise redirects to originating ?redirect= URL or defaultRedirect
     * @param {string} [defaultRedirect="home.html"]
     */
    handlePostLoginRedirect: function (defaultRedirect) {
      const params = new URLSearchParams(window.location.search);
      let redirectTarget = params.get("redirect");
      if (redirectTarget) {
        redirectTarget = decodeURIComponent(redirectTarget).trim();
        const lower = redirectTarget.toLowerCase();
        if (
          lower === "login" ||
          lower === "/login" ||
          lower === "login.html" ||
          lower === "/login.html" ||
          lower.includes("login") ||
          lower === "register" ||
          lower === "/register" ||
          lower === "register.html" ||
          lower === "/register.html" ||
          lower.includes("register") ||
          lower.includes("signin") ||
          lower.includes("signup") ||
          lower.includes("profile-setup")
        ) {
          redirectTarget = null;
        }
      }

      let destination = redirectTarget || defaultRedirect || "/home";
      if (destination.endsWith(".html") && !destination.startsWith("http")) {
        destination = "/" + destination.replace(/\.html$/, "");
      }
      if (!destination.startsWith("/") && !destination.startsWith("http")) {
        destination = "/" + destination;
      }
      window.location.replace(destination);
    },

    /**
     * Helper to get list of registered users.
     * @returns {Array}
     */
    /**
     * Helper to get list of registered users.
     * @returns {Array}
     */
    getRegisteredUsers: function () {
      const usersStr = localStorage.getItem(STORAGE_KEYS.REGISTERED_USERS);
      if (usersStr) {
        try { return JSON.parse(usersStr); } catch (e) { return []; }
      }
      return [];
    },

    /**
     * Complete Social OAuth login, save session, sync backend, and trigger callback/redirect.
     */
    completeOAuthLogin: async function (userData, onSuccess) {
      console.log("[Auth] completeOAuthLogin called for:", userData.email, "provider:", userData.provider);
      const users = this.getRegisteredUsers();
      const existingUser = users.find(u => u.email && u.email.toLowerCase() === userData.email.toLowerCase());
      if (existingUser) {
        const originalAvatar = existingUser.avatar;
        userData = { ...existingUser, ...userData };
        // If the user has a custom avatar saved in our system, keep it. Don't let Google overwrite it.
        if (originalAvatar && !originalAvatar.includes('rem_happy_evhesz.webp')) {
          userData.avatar = originalAvatar;
        }
      }
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(userData));
      localStorage.setItem(STORAGE_KEYS.LAST_USER, JSON.stringify(userData));
      localStorage.removeItem(STORAGE_KEYS.USER_LOGGED_OUT);
      localStorage.setItem(STORAGE_KEYS.IS_LOGGED_IN, "true");

      try {
        const res = await fetch("/api/auth/oauth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: 'include',
          body: JSON.stringify({
            email: userData.email,
            username: userData.username,
            name: userData.name,
            avatar: userData.avatar,
            provider: userData.provider || "oauth",
            providerId: userData.providerId || null
          })
        });
        const data = await res.json();
        if (data.token) {
          localStorage.setItem("userToken", data.token);
          userData._token = data.token;
        }
        console.log("[Auth] Backend OAuth sync complete, token:", !!data.token);
      } catch (err) {
        console.warn("Backend database sync notice:", err.message);
      }

      this.closeOAuthModals();

      if (typeof onSuccess === "function") {
        console.log("[Auth] Calling onSuccess callback...");
        try {
          onSuccess(userData, userData._token);
        } catch (cbErr) {
          console.error("[Auth] onSuccess callback error:", cbErr);
          window.location.href = "/home";
        }
      } else {
        console.log("[Auth] No onSuccess callback, redirecting directly to /home");
        window.location.href = "/home";
      }

      // Safety net: if still on a login/register page after 2 seconds, force redirect
      setTimeout(() => {
        const path = window.location.pathname.toLowerCase();
        if (path.includes("login") || path.includes("register") || path.includes("signin")) {
          console.log("[Auth] Safety-net redirect triggered — still on auth page after OAuth login");
          window.location.href = "/home";
        }
      }, 2000);
    },

    /**
     * Trigger Google OAuth login flow directly on accounts.google.com
     */
    triggerGoogleLogin: function (onSuccess) {
      console.log("[Auth] triggerGoogleLogin invoked. Client ID:", window.GOOGLE_CLIENT_ID);
      const clientId = (window.GOOGLE_CLIENT_ID && window.GOOGLE_CLIENT_ID.trim()) ? window.GOOGLE_CLIENT_ID.trim() : "681420178068-lpf5lcl98dfj560p9od15f7t12k4fcqa.apps.googleusercontent.com";

      const width = 520;
      const height = 650;
      const left = Math.max(0, Math.floor(window.screenX + (window.outerWidth - width) / 2));
      const top = Math.max(0, Math.floor(window.screenY + (window.outerHeight - height) / 2));

      const redirectUri = window.location.origin + window.location.pathname;
      const oauthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=token&scope=openid%20email%20profile&prompt=select_account&state=google_oauth`;

      console.log("[Auth] Opening centered Google OAuth popup...");
      let popup = null;
      try {
        popup = window.open(
          oauthUrl,
          "GoogleSignInWindow",
          `width=${width},height=${height},left=${left},top=${top},status=no,toolbar=no,menubar=no,location=no,resizable=yes,scrollbars=yes`
        );
      } catch (e) {
        console.warn("[Auth] window.open failed, falling back to direct navigation:", e);
      }

      // If browser blocked popup window, navigate in same tab
      if (!popup || popup.closed || typeof popup.closed === "undefined") {
        console.log("[Auth] Popup blocked by browser — navigating same window to Google...");
        window.location.href = oauthUrl;
        return;
      }

      try { popup.focus(); } catch (_) {}

      // Listen for storage changes & poll popup status
      const checkInterval = setInterval(() => {
        if (Auth.isLoggedIn()) {
          clearInterval(checkInterval);
          try {
            if (popup && !popup.closed) popup.close();
          } catch (_) {}
          console.log("[Auth] Login detected from popup — redirecting parent to /home");
          window.location.replace("/home");
        } else if (!popup || popup.closed) {
          clearInterval(checkInterval);
          setTimeout(() => {
            if (Auth.isLoggedIn()) {
              window.location.replace("/home");
            }
          }, 300);
          console.log("[Auth] Popup window closed.");
        }
      }, 300);
    },

    /**
     * Trigger Facebook OAuth login flow directly on facebook.com
     */
    triggerFacebookLogin: function (onSuccess) {
      const appId = (window.FB_APP_ID && window.FB_APP_ID.trim()) ? window.FB_APP_ID.trim() : "1043452911768475";

      if (window.FB) {
        try {
          FB.login((response) => {
            if (response && response.authResponse) {
              FB.api('/me', { fields: 'name,email,picture' }, (profile) => {
                const userCleanName = (profile.name || "fb_user").toLowerCase().replace(/\s+/g, ".");
                const fbUser = {
                  username: (profile.name || "fb_user").toLowerCase().replace(/\s+/g, "_"),
                  name: profile.name || "Facebook User",
                  email: profile.email || `${userCleanName}@facebook.com`,
                  avatar: profile.picture?.data?.url || "assets/default-avatar.svg",
                  provider: "facebook",
                  providerId: profile.id,
                  profile_completed: true
                };
                Auth.completeOAuthLogin(fbUser, onSuccess);
              });
            } else {
              console.error("Facebook SDK Login cancelled.");
            }
          }, { scope: 'public_profile' });
          return;
        } catch (e) {
          console.warn("FB SDK Login warning:", e);
        }
      }

      try {
        const redirectUri = window.location.origin + window.location.pathname;
        const fbUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${encodeURIComponent(appId)}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=token&scope=public_profile&state=facebook_oauth`;

        // Direct same-window redirect
        window.location.href = fbUrl;
      } catch (err) {
        console.error("Facebook OAuth Error:", err);
        alert("Facebook Login failed. Please try again.");
      }
    },

    closeOAuthModals: function () {
      const gModal = document.getElementById("google-oauth-modal-overlay");
      const fbModal = document.getElementById("fb-oauth-modal-overlay");
      if (gModal) gModal.remove();
      if (fbModal) fbModal.remove();
    }
  };

  // Helper to decode JWT payload safely
  function parseJwtPayload(jwtToken) {
    try {
      const base64Url = jwtToken.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (e) {
      try {
        return JSON.parse(atob(jwtToken.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
      } catch (err) {
        return null;
      }
    }
  }

  // Check URL Hash for return token from accounts.google.com or facebook.com
  if (window.location.hash && (window.location.hash.includes("id_token") || window.location.hash.includes("access_token"))) {
    console.log("[Auth] OAuth hash tokens detected in URL");
    try {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const idToken = hashParams.get("id_token");
      const accessToken = hashParams.get("access_token");
      const state = hashParams.get("state") || "";
      const scope = hashParams.get("scope") || "";

      const isGoogle = idToken || state === "google_oauth" || scope.includes("googleapis.com") || scope.includes("openid");
      console.log("[Auth] Hash analysis — isGoogle:", isGoogle, "hasIdToken:", !!idToken, "hasAccessToken:", !!accessToken, "state:", state);

      // Clean hash from URL immediately
      history.replaceState(null, document.title, window.location.pathname + window.location.search);

      function finishOAuthAndRedirect(user) {
        Auth.completeOAuthLogin(user).then(function() {
          console.log("[Auth] completeOAuthLogin resolved");
          document.documentElement.style.visibility = "";
          window.__oauthHashPending = false;

          // Cross-tab broadcast to parent tab
          try {
            if (typeof BroadcastChannel !== "undefined") {
              const ch = new BroadcastChannel("senpai_oauth_sync");
              ch.postMessage({ type: "LOGIN_SUCCESS" });
            }
          } catch (_) {}

          // If this is a popup window, close self and command opener to redirect
          const isPopup = !!(window.opener || window.name === "GoogleSignInWindow" || (window.outerWidth && window.outerWidth < 600));
          if (isPopup) {
            if (window.opener && !window.opener.closed) {
              try {
                window.opener.location.replace("/home");
              } catch (_) {}
            }
            try {
              window.close();
              setTimeout(() => {
                window.location.replace("/home");
              }, 400);
              return;
            } catch (_) {}
          }
          window.location.replace("/home");
        }).catch(function(err) {
          console.error("[Auth] completeOAuthLogin error:", err);
          document.documentElement.style.visibility = "";
          window.__oauthHashPending = false;
          window.location.replace("/home");
        });
      }

      if (isGoogle) {
        if (idToken) {
          const payload = parseJwtPayload(idToken);
          console.log("[Auth] Parsed Google id_token payload:", payload ? payload.email : "FAILED");
          if (payload) {
            const gUser = {
              username: payload.email ? payload.email.split('@')[0] : "google_user",
              name: payload.name || "Google User",
              email: payload.email || "google@example.com",
              avatar: payload.picture || "assets/default-avatar.svg",
              provider: "google",
              providerId: payload.sub,
              profile_completed: true
            };
            finishOAuthAndRedirect(gUser);
          }
        } else if (accessToken) {
          console.log("[Auth] Using Google access_token to fetch userinfo...");
          fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
            headers: { Authorization: `Bearer ${accessToken}` }
          })
            .then(res => res.json())
            .then(profile => {
              console.log("[Auth] Google userinfo response:", profile ? profile.email : "NO PROFILE");
              if (profile && (profile.email || profile.sub)) {
                const gUser = {
                  username: profile.email ? profile.email.split('@')[0] : "google_user",
                  name: profile.name || "Google User",
                  email: profile.email || "google@example.com",
                  avatar: profile.picture || "assets/default-avatar.svg",
                  provider: "google",
                  providerId: profile.sub,
                  profile_completed: true
                };
                finishOAuthAndRedirect(gUser);
              }
            })
            .catch(err => {
              console.error("Error fetching Google profile from access token:", err);
              document.documentElement.style.visibility = "";
              window.__oauthHashPending = false;
            });
        }
      } else if (accessToken) {
        // Facebook Access Token -> Fetch Facebook Profile
        fetch(`https://graph.facebook.com/v18.0/me?fields=id,name,email,picture&access_token=${encodeURIComponent(accessToken)}`)
          .then(res => res.json())
          .then(profile => {
            if (profile && profile.id) {
              const userCleanName = (profile.name || "fb_user").toLowerCase().replace(/\s+/g, ".");
              const fbUser = {
                username: (profile.name || "fb_user").toLowerCase().replace(/\s+/g, "_"),
                name: profile.name || "Facebook User",
                email: profile.email || `${userCleanName}@facebook.com`,
                avatar: profile.picture?.data?.url || "assets/default-avatar.svg",
                provider: "facebook",
                providerId: profile.id,
                profile_completed: true
              };
              finishOAuthAndRedirect(fbUser);
            }
          })
          .catch(err => {
            console.error("Error fetching Facebook user profile:", err);
            document.documentElement.style.visibility = "";
            window.__oauthHashPending = false;
          });
      }
    } catch (e) {
      console.warn("OAuth Hash token detection warning:", e);
      document.documentElement.style.visibility = "";
      window.__oauthHashPending = false;
    }
  }

  window.Auth = Auth;
})(window);
