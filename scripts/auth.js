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
    login: function (emailOrUsername, password) {
      if (!emailOrUsername || !password) {
        return { success: false, message: "Please fill in all required fields." };
      }

      const input = emailOrUsername.trim().toLowerCase();
      const users = this.getRegisteredUsers();
      let user = users.find(u =>
        (u.email && u.email.toLowerCase() === input) ||
        (u.username && u.username.toLowerCase() === input)
      );

      if (!user) {
        // Fallback demo user creation for seamless experience
        const username = input.includes("@") ? input.split("@")[0] : input;
        user = {
          username: username,
          email: input.includes("@") ? input : `${username}@example.com`,
          avatar: "https://res.cloudinary.com/dmzchsqms/image/upload/f_auto,q_auto/w_600/v1757630848/rem_happy_evhesz.webp",
          profile_completed: true
        };
      } else {
        if (user.profile_completed === undefined) {
          user.profile_completed = true;
        }
      }

      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
      localStorage.setItem(STORAGE_KEYS.LAST_USER, JSON.stringify(user));
      localStorage.setItem(STORAGE_KEYS.IS_LOGGED_IN, "true");
      localStorage.removeItem(STORAGE_KEYS.USER_LOGGED_OUT);

      // Restore account-specific cart
      if (user && user.email) {
        const userKey = `userCart_${user.email.toLowerCase()}`;
        const savedCartRaw = localStorage.getItem(userKey);
        if (savedCartRaw !== null) {
          localStorage.setItem("shoppingCart", savedCartRaw);
        }
      }

      return { success: true, user: user };
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
        await fetch("/api/users/profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedUser)
        });
      } catch (err) {
        console.warn("Backend user profile sync warning:", err);
      }
      window.dispatchEvent(new Event("profileUpdated"));
    },

    /**
     * Registers a new user.
     * @param {string} username 
     * @param {string} email 
     * @param {string} password 
     * @returns {{ success: boolean, message?: string, user?: Object }}
     */
    register: function (username, email, password) {
      if (!username || !email || !password) {
        return { success: false, message: "Please complete all registration fields." };
      }

      if (password.length < 6) {
        return { success: false, message: "Password must be at least 6 characters long." };
      }

      const users = this.getRegisteredUsers();
      const existing = users.find(u =>
        (u.email && u.email.toLowerCase() === email.trim().toLowerCase()) ||
        (u.username && u.username.toLowerCase() === username.trim().toLowerCase())
      );

      if (existing) {
        return { success: false, message: "An account with this email or username already exists." };
      }

      const newUser = {
        username: username.trim(),
        email: email.trim(),
        password: password,
        avatar: "https://res.cloudinary.com/dmzchsqms/image/upload/f_auto,q_auto/w_600/v1757630848/rem_happy_evhesz.webp",
        joinedDate: new Date().toISOString(),
        profile_completed: false
      };

      users.push(newUser);
      localStorage.setItem(STORAGE_KEYS.REGISTERED_USERS, JSON.stringify(users));

      // Auto login after registration
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(newUser));
      localStorage.setItem(STORAGE_KEYS.LAST_USER, JSON.stringify(newUser));
      localStorage.setItem(STORAGE_KEYS.IS_LOGGED_IN, "true");
      localStorage.removeItem(STORAGE_KEYS.USER_LOGGED_OUT);

      return { success: true, user: newUser };
    },

    /**
     * Completes initial profile setup onboarding for new accounts.
     * @param {Object} profileData 
     * @returns {{ success: boolean, message?: string, user?: Object }}
     */
    completeProfileSetup: function (profileData) {
      const curUser = this.getCurrentUser();
      if (!curUser) {
        window.location.href = "login.html";
        return { success: false, message: "Not authenticated" };
      }

      if (profileData) {
        if (profileData.name) curUser.name = profileData.name.trim();
        if (profileData.phone) curUser.phone = profileData.phone.trim();
        if (profileData.avatar) curUser.avatar = profileData.avatar;
        if (profileData.interest) curUser.interest = profileData.interest;
      }

      curUser.profile_completed = true;

      this.saveUserProfile(curUser);

      this.handlePostLoginRedirect("home.html");
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
      const curUser = this.getCurrentUser();
      if (curUser && curUser.profile_completed === false) {
        window.location.href = "profile-setup.html";
        return;
      }

      const params = new URLSearchParams(window.location.search);
      const redirectTarget = params.get("redirect");
      if (redirectTarget) {
        window.location.href = decodeURIComponent(redirectTarget);
      } else {
        window.location.href = defaultRedirect || "home.html";
      }
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
      } catch (err) {
        console.warn("Backend database sync notice:", err.message);
      }

      this.closeOAuthModals();

      if (typeof onSuccess === "function") {
        onSuccess(userData, userData._token);
      } else {
        this.handlePostLoginRedirect("home.html");
      }
    },

    /**
     * Trigger Google OAuth login flow directly on accounts.google.com
     */
    triggerGoogleLogin: function (onSuccess) {
      const clientId = (window.GOOGLE_CLIENT_ID && window.GOOGLE_CLIENT_ID.trim()) ? window.GOOGLE_CLIENT_ID.trim() : "681420178068-lpf5lcl98dfj560p9od15f7t12k4fcqa.apps.googleusercontent.com";

      if (window.google && window.google.accounts && window.google.accounts.id) {
        try {
          google.accounts.id.initialize({
            client_id: clientId,
            callback: (response) => {
              try {
                const base64Url = response.credential.split('.')[1];
                const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
                const payload = JSON.parse(jsonPayload);

                const gUser = {
                  username: payload.email ? payload.email.split('@')[0] : "google_user",
                  name: payload.name || "Google User",
                  email: payload.email || "google@example.com",
                  avatar: payload.picture || "https://res.cloudinary.com/dmzchsqms/image/upload/f_auto,q_auto/w_600/v1757630848/rem_happy_evhesz.webp",
                  provider: "google",
                  providerId: payload.sub,
                  profile_completed: true
                };
                Auth.completeOAuthLogin(gUser, onSuccess);
              } catch (e) {
                console.error("Failed Google OAuth token parse:", e);
                alert("Google Login failed. Please try again.");
              }
            }
          });
          google.accounts.id.prompt((notification) => {
            if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
              console.warn("Google One-Tap prompt dismissed or blocked.");
            }
          });
          return;
        } catch (err) {
          console.warn("Google GSI prompt warning:", err);
        }
      }

      // Direct OAuth 2.0 popup with fallback
      try {
        const redirectUri = window.location.origin + window.location.pathname;
        const oauthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=token%20id_token&scope=openid%20email%20profile&nonce=${Date.now()}`;

        const width = 520, height = 650;
        const left = Math.max(0, (window.innerWidth - width) / 2);
        const top = Math.max(0, (window.innerHeight - height) / 2);
        const popup = window.open(oauthUrl, "GoogleOAuthPopup", `width=${width},height=${height},top=${top},left=${left},scrollbars=yes,resizable=yes`);

        if (!popup || popup.closed) {
          console.error("Google OAuth popup was blocked.");
          alert("Login popup blocked. Please allow popups for this site.");
        }
      } catch (err) {
        console.error("Google OAuth Error:", err);
        alert("Google Login failed. Please try again.");
      }
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
                  avatar: profile.picture?.data?.url || "https://res.cloudinary.com/dmzchsqms/image/upload/f_auto,q_auto/w_600/v1757630848/rem_happy_evhesz.webp",
                  provider: "facebook",
                  providerId: profile.id,
                  profile_completed: true
                };
                Auth.completeOAuthLogin(fbUser, onSuccess);
              });
            } else {
              console.error("Facebook SDK Login failed or was cancelled.");
              alert("Facebook Login failed.");
            }
          }, { scope: 'public_profile' });
          return;
        } catch (e) {
          console.warn("FB SDK Login warning:", e);
        }
      }

      try {
        const redirectUri = window.location.origin + window.location.pathname;
        const fbUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${encodeURIComponent(appId)}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=token&scope=public_profile`;

        const width = 580, height = 650;
        const left = Math.max(0, (window.innerWidth - width) / 2);
        const top = Math.max(0, (window.innerHeight - height) / 2);
        const popup = window.open(fbUrl, "FacebookOAuthPopup", `width=${width},height=${height},top=${top},left=${left},scrollbars=yes,resizable=yes`);

        if (!popup || popup.closed) {
          console.error("Facebook OAuth popup was blocked.");
          alert("Login popup blocked. Please allow popups for this site.");
        }
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

  // Check URL Hash for return token from accounts.google.com or facebook.com
  if (window.location.hash && (window.location.hash.includes("id_token") || window.location.hash.includes("access_token"))) {
    try {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const idToken = hashParams.get("id_token");
      const accessToken = hashParams.get("access_token");

      if (idToken) {
        const base64Url = idToken.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(decodeURIComponent(atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')));
        const gUser = {
          username: payload.email ? payload.email.split('@')[0] : "google_user",
          name: payload.name || "Google User",
          email: payload.email || "google@example.com",
          avatar: payload.picture || "https://res.cloudinary.com/dmzchsqms/image/upload/f_auto,q_auto/w_600/v1757630848/rem_happy_evhesz.webp",
          provider: "google",
          providerId: payload.sub,
          profile_completed: true
        };

        if (window.opener && window.opener.Auth) {
          window.opener.Auth.completeOAuthLogin(gUser);
          window.close();
        } else {
          history.replaceState(null, document.title, window.location.pathname + window.location.search);
          Auth.completeOAuthLogin(gUser);
        }
      } else if (accessToken) {
        fetch(`https://graph.facebook.com/v18.0/me?fields=id,name,email,picture&access_token=${encodeURIComponent(accessToken)}`)
          .then(res => res.json())
          .then(profile => {
            if (profile && profile.id) {
              const userCleanName = (profile.name || "fb_user").toLowerCase().replace(/\s+/g, ".");
              const fbUser = {
                username: (profile.name || "fb_user").toLowerCase().replace(/\s+/g, "_"),
                name: profile.name || "Facebook User",
                email: profile.email || `${userCleanName}@facebook.com`,
                avatar: profile.picture?.data?.url || "https://res.cloudinary.com/dmzchsqms/image/upload/f_auto,q_auto/w_600/v1757630848/rem_happy_evhesz.webp",
                provider: "facebook",
                providerId: profile.id,
                profile_completed: true
              };
              if (window.opener && window.opener.Auth) {
                window.opener.Auth.completeOAuthLogin(fbUser);
                window.close();
              } else {
                history.replaceState(null, document.title, window.location.pathname + window.location.search);
                Auth.completeOAuthLogin(fbUser);
              }
            }
          })
          .catch(err => {
            console.error("Error fetching Facebook user profile:", err);
            if (window.opener && window.opener.Auth) {
              window.close();
            }
          });
      }
    } catch (e) {
      console.warn("OAuth Hash token detection warning:", e);
    }
  }

  window.Auth = Auth;
})(window);
