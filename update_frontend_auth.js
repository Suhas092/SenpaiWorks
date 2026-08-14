const fs = require('fs');
let content = fs.readFileSync('scripts/header.js', 'utf8');

// Replace loginUserAndRedirect
content = content.replace(
  /async function loginUserAndRedirect\(userData\) \{[\s\S]*?\} catch \(err\) \{[\s\S]*?console\.warn\("Backend database sync offline, logged in locally:", err\);\s*\}[\s\S]*?if \(window\.location\.pathname\.includes\("profile\.html"\)\) \{\s*window\.location\.reload\(\);\s*\} else \{\s*window\.location\.href = "profile\.html";\s*\}\s*\}/,
  \sync function loginUserAndRedirect(userData, token = null, skipFetch = false) {
    if (token) {
      localStorage.setItem("userToken", token);
      localStorage.setItem("lastUserToken", token);
    }
    
    if (window.Auth && window.Auth.saveUserProfile) {
      window.Auth.saveUserProfile(userData);
    } else {
      localStorage.setItem("currentUser", JSON.stringify(userData));
      localStorage.setItem("lastUser", JSON.stringify(userData));
      localStorage.removeItem("userLoggedOut");
      localStorage.setItem("isLoggedIn", "true");
    }

    if (userData && userData.email) {
      const userKey = \\\userCart_\\\\\\;
      const savedCartRaw = localStorage.getItem(userKey);
      if (savedCartRaw !== null) {
        localStorage.setItem("shoppingCart", savedCartRaw);
      }
    }

    if (!skipFetch && !token) {
      try {
        const res = await fetch("/api/auth/oauth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: userData.email,
            username: userData.username,
            name: userData.name || userData.username,
            avatar: userData.avatar,
            provider: userData.provider || "local",
            providerId: userData.providerId || null
          })
        });
        const data = await res.json();
        if (data.success && data.token) {
          localStorage.setItem("userToken", data.token);
          localStorage.setItem("lastUserToken", data.token);
        }
      } catch (err) {
        console.warn("Backend database sync offline, logged in locally:", err);
      }
    }

    updateAuthUI();
    updateCartBadge();
    const authModal = document.getElementById("auth-modal");
    if (authModal) authModal.classList.remove("active");
    if (window.location.pathname.includes("profile.html")) {
      window.location.reload();
    } else {
      window.location.href = "profile.html";
    }
  }\
);

// Replace signinForm logic
content = content.replace(
  /if \(signinForm\) \{[\s\S]*?signinForm\.addEventListener\("submit", \(e\) => \{[\s\S]*?const loginVal = document\.getElementById\("signin-email"\)\.value\.trim\(\);\s*const passwordVal = document\.getElementById\("signin-password"\)\.value;[\s\S]*?if \(match\) \{[\s\S]*?loginUserAndRedirect\(loggedUser\);\s*\} else \{[\s\S]*?\}\s*\}\);\s*\}/,
  \if (signinForm) {
    signinForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const loginVal = document.getElementById("signin-email").value.trim();
      const passwordVal = document.getElementById("signin-password").value;

      if (signinError) signinError.style.display = "none";
      const submitBtn = signinForm.querySelector('button[type="submit"]');
      const originalText = submitBtn ? submitBtn.innerText : "Sign In";
      if (submitBtn) submitBtn.innerText = "Signing in...";

      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: loginVal, username: loginVal, password: passwordVal })
        });
        const data = await res.json();
        
        if (res.ok && data.success) {
          signinForm.reset();
          loginUserAndRedirect(data.user, data.token, true);
        } else {
          if (signinError) {
            signinError.textContent = data.error || "Invalid credentials.";
            signinError.style.display = "block";
          }
        }
      } catch (err) {
        if (signinError) {
          signinError.textContent = "Server error. Please try again.";
          signinError.style.display = "block";
        }
      } finally {
        if (submitBtn) submitBtn.innerText = originalText;
      }
    });
  }\
);

// Replace signupForm logic
content = content.replace(
  /if \(signupForm\) \{[\s\S]*?signupForm\.addEventListener\("submit", \(e\) => \{[\s\S]*?const usernameVal = document\.getElementById\("signup-username"\)\.value\.trim\(\);\s*const emailVal = document\.getElementById\("signup-email"\)\.value\.trim\(\);\s*const passwordVal = document\.getElementById\("signup-password"\)\.value;[\s\S]*?const newUser = \{ username: usernameVal, email: emailVal, password: passwordVal \};\s*users\.push\(newUser\);\s*localStorage\.setItem\("registeredUsers", JSON\.stringify\(users\)\);\s*loginUserAndRedirect\(loggedUser\);\s*\}\);\s*\}/,
  \if (signupForm) {
    signupForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const usernameVal = document.getElementById("signup-username").value.trim();
      const emailVal = document.getElementById("signup-email").value.trim();
      const passwordVal = document.getElementById("signup-password").value;

      if (signupError) signupError.style.display = "none";

      if (passwordVal.length < 6) {
        if (signupError) {
          signupError.textContent = "Password must be at least 6 characters.";
          signupError.style.display = "block";
        }
        return;
      }
      
      const submitBtn = signupForm.querySelector('button[type="submit"]');
      const originalText = submitBtn ? submitBtn.innerText : "Create Account";
      if (submitBtn) submitBtn.innerText = "Creating...";

      try {
        const res = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: emailVal, username: usernameVal, password: passwordVal })
        });
        const data = await res.json();
        
        if (res.ok && data.success) {
          signupForm.reset();
          loginUserAndRedirect(data.user, data.token, true);
        } else {
          if (signupError) {
            signupError.textContent = data.error || "Signup failed.";
            signupError.style.display = "block";
          }
        }
      } catch (err) {
        if (signupError) {
          signupError.textContent = "Server error. Please try again.";
          signupError.style.display = "block";
        }
      } finally {
        if (submitBtn) submitBtn.innerText = originalText;
      }
    });
  }\
);

fs.writeFileSync('scripts/header.js', content);
