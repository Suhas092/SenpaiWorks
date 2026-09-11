"use strict";

// ==========================================
// ==========================================
// PROFILE SECURITY: PASSWORD & EMAIL CHANGE WITH MULTI-STEP VERIFICATION
// ==========================================
let profileOtpCountdownTimer = null;
let profileEmailOtpCountdownTimer = null;
let cachedCurrentPassword = "";
let cachedNewPassword = "";
let cachedNewEmail = "";
let cachedEmailCurrentPassword = "";

function showSecMsg(txt, isSuccess) {
  const msgEl = document.getElementById("sec-pass-message");
  if (!msgEl) return;
  if (!txt) {
    msgEl.style.display = "none";
    return;
  }
  msgEl.textContent = txt;
  msgEl.style.display = "block";
  msgEl.style.color = isSuccess ? "#059669" : "#dc2626";
}

function showSecEmailMsg(txt, isSuccess) {
  const msgEl = document.getElementById("sec-email-message");
  if (!msgEl) return;
  if (!txt) {
    msgEl.style.display = "none";
    return;
  }
  msgEl.textContent = txt;
  msgEl.style.display = "block";
  msgEl.style.color = isSuccess ? "#059669" : "#dc2626";
}

// ── 1. PASSWORD CHANGE FLOW ──────────────────────────────────────
window.cancelProfilePassChange = function () {
  cachedCurrentPassword = "";
  cachedNewPassword = "";
  if (profileOtpCountdownTimer) clearInterval(profileOtpCountdownTimer);

  const fieldsView = document.getElementById("profile-pass-fields-view");
  const otpView = document.getElementById("profile-pass-otp-view");
  const forgotFlow = document.getElementById("profile-forgot-flow");
  const msgEl = document.getElementById("sec-pass-message");

  if (fieldsView) fieldsView.style.display = "block";
  if (otpView) otpView.style.display = "none";
  if (forgotFlow) forgotFlow.style.display = "none";
  if (msgEl) msgEl.style.display = "none";

  document.getElementById("profile-pass-change-form")?.reset();
  document.getElementById("profile-otp-confirm-form")?.reset();
  document.getElementById("profile-forgot-reset-form")?.reset();
};

window.handleProfilePassChangeSubmit = async function (e) {
  if (e) e.preventDefault();
  const currentPass = (document.getElementById("sec-current-pass")?.value || "").trim();
  const newPass = (document.getElementById("sec-new-pass")?.value || "").trim();
  const confirmPass = (document.getElementById("sec-confirm-pass")?.value || "").trim();
  const changeBtn = document.getElementById("sec-btn-change-pass");
  const origText = changeBtn ? changeBtn.innerHTML : '<i class="fa-solid fa-lock"></i> Change Password';

  if (!currentPass) {
    showSecMsg("Please enter your current password.", false);
    return;
  }

  const isStrongPass = newPass.length >= 8 &&
    /[A-Z]/.test(newPass) &&
    /[a-z]/.test(newPass) &&
    /[0-9]/.test(newPass) &&
    /[^A-Za-z0-9]/.test(newPass);

  if (!isStrongPass) {
    showSecMsg("Password must be at least 8 characters and include uppercase, lowercase, a number, and a special character.", false);
    return;
  }

  if (newPass === currentPass) {
    showSecMsg("New password must be different from your current password.", false);
    return;
  }

  if (newPass !== confirmPass) {
    showSecMsg("Passwords do not match. Please re-enter identical passwords.", false);
    return;
  }

  const token = localStorage.getItem("userToken") || sessionStorage.getItem("userToken");
  if (changeBtn) {
    changeBtn.disabled = true;
    changeBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Verifying & Sending Code...';
  }

  try {
    const res = await fetch("/api/user/request-password-change-otp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token || ""}`
      },
      body: JSON.stringify({ currentPassword: currentPass })
    });

    const data = await res.json();
    if (res.ok && data.success) {
      cachedCurrentPassword = currentPass;
      cachedNewPassword = newPass;
      showSecMsg(`6-digit verification code sent to ${data.email || "your email"}!`, true);
      document.getElementById("profile-pass-fields-view").style.display = "none";
      document.getElementById("profile-pass-otp-view").style.display = "block";
      startProfileOtpCountdown();
      const otpInput = document.getElementById("sec-otp-input");
      if (otpInput) {
        otpInput.value = "";
        otpInput.focus();
      }
    } else {
      showSecMsg(data.error || "Failed to send verification code.", false);
    }
  } catch (err) {
    showSecMsg("Network error. Please try again.", false);
  } finally {
    if (changeBtn) {
      changeBtn.disabled = false;
      changeBtn.innerHTML = origText;
    }
  }
};

window.handleProfileOtpSubmit = async function (e) {
  if (e) e.preventDefault();
  const otpVal = (document.getElementById("sec-otp-input")?.value || "").trim();
  const confirmBtn = document.getElementById("sec-btn-confirm-pass");
  const origText = confirmBtn ? confirmBtn.innerHTML : '<i class="fa-solid fa-check"></i> Confirm & Update Password';

  if (otpVal.length !== 6) {
    showSecMsg("Please enter the complete 6-digit verification code.", false);
    return;
  }

  const token = localStorage.getItem("userToken") || sessionStorage.getItem("userToken");
  if (confirmBtn) {
    confirmBtn.disabled = true;
    confirmBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Updating Password...';
  }

  try {
    const deviceToken = localStorage.getItem("senpai_device_token") || null;
    const res = await fetch("/api/user/change-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token || ""}`
      },
      body: JSON.stringify({
        currentPassword: cachedCurrentPassword,
        newPassword: cachedNewPassword,
        otp: otpVal,
        deviceToken
      })
    });

    const data = await res.json();
    if (res.ok && data.success) {
      if (data.deviceToken) {
        localStorage.setItem("senpai_device_token", data.deviceToken);
      }
      window.cancelProfilePassChange();
      showSecMsg("✓ Password updated successfully!", true);
    } else {
      showSecMsg(data.error || "Failed to update password.", false);
    }
  } catch (err) {
    showSecMsg("Network error. Please try again.", false);
  } finally {
    if (confirmBtn) {
      confirmBtn.disabled = false;
      confirmBtn.innerHTML = origText;
    }
  }
};

window.resendProfilePasswordOtp = async function () {
  const token = localStorage.getItem("userToken") || sessionStorage.getItem("userToken");
  try {
    const res = await fetch("/api/user/request-password-change-otp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token || ""}`
      },
      body: JSON.stringify({ currentPassword: cachedCurrentPassword })
    });
    const data = await res.json();
    if (res.ok && data.success) {
      startProfileOtpCountdown();
      showSecMsg(`New 6-digit verification code sent to ${data.email || "your email"}!`, true);
    } else {
      showSecMsg(data.error || "Failed to resend code.", false);
    }
  } catch (err) {
    showSecMsg("Network error. Please try again.", false);
  }
};

function startProfileOtpCountdown() {
  const resendBtn = document.getElementById("sec-btn-resend-otp");
  const timerEl = document.getElementById("sec-otp-timer");
  if (!resendBtn) return;

  if (profileOtpCountdownTimer) clearInterval(profileOtpCountdownTimer);

  let seconds = 60;
  resendBtn.style.display = "none";
  if (timerEl) {
    timerEl.style.display = "inline";
    timerEl.textContent = `(Resend in ${seconds}s)`;
  }

  profileOtpCountdownTimer = setInterval(() => {
    seconds--;
    if (seconds <= 0) {
      clearInterval(profileOtpCountdownTimer);
      resendBtn.style.display = "inline";
      if (timerEl) timerEl.style.display = "none";
    } else {
      if (timerEl) timerEl.textContent = `(Resend in ${seconds}s)`;
    }
  }, 1000);
}

// In-Profile Forgot Password Flow
window.handleProfileForgotPassword = function (e) {
  if (e) e.preventDefault();
  document.getElementById("profile-pass-fields-view").style.display = "none";
  document.getElementById("profile-pass-otp-view").style.display = "none";
  document.getElementById("profile-forgot-flow").style.display = "block";
  document.getElementById("profile-forgot-step-1").style.display = "block";
  document.getElementById("profile-forgot-step-2").style.display = "none";
  showSecMsg("", false);
};

window.sendProfileForgotOtp = async function () {
  const curUser = window.Auth?.getCurrentUser();
  if (!curUser || !curUser.email) {
    showSecMsg("Unable to retrieve account email. Please sign in again.", false);
    return;
  }

  const btn = document.getElementById("sec-btn-send-forgot-otp");
  const origText = btn ? btn.innerHTML : '<i class="fa-solid fa-paper-plane"></i> Send Password Reset Code';
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Sending Code...';
  }

  try {
    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: curUser.email })
    });
    const data = await res.json();
    if (res.ok && data.success) {
      showSecMsg(`6-digit password reset code sent to ${curUser.email}!`, true);
      document.getElementById("profile-forgot-step-1").style.display = "none";
      document.getElementById("profile-forgot-step-2").style.display = "block";
      const otpInput = document.getElementById("sec-forgot-otp");
      if (otpInput) {
        otpInput.value = "";
        otpInput.focus();
      }
    } else {
      showSecMsg(data.error || "Failed to send reset code.", false);
    }
  } catch (err) {
    showSecMsg("Network error. Please try again.", false);
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = origText;
    }
  }
};

window.handleProfileForgotResetSubmit = async function (e) {
  if (e) e.preventDefault();
  const curUser = window.Auth?.getCurrentUser();
  const otpVal = (document.getElementById("sec-forgot-otp")?.value || "").trim();
  const newPass = (document.getElementById("sec-forgot-newpass")?.value || "").trim();
  const confirmPass = (document.getElementById("sec-forgot-confirmpass")?.value || "").trim();
  const submitBtn = document.getElementById("sec-btn-submit-forgot-reset");
  const origText = submitBtn ? submitBtn.innerHTML : '<i class="fa-solid fa-check"></i> Reset & Update Password';

  if (!otpVal || otpVal.length !== 6) {
    showSecMsg("Please enter the 6-digit reset code.", false);
    return;
  }

  const isStrongPass = newPass.length >= 8 &&
    /[A-Z]/.test(newPass) &&
    /[a-z]/.test(newPass) &&
    /[0-9]/.test(newPass) &&
    /[^A-Za-z0-9]/.test(newPass);

  if (!isStrongPass) {
    showSecMsg("Password must be at least 8 characters and include uppercase, lowercase, a number, and a special character.", false);
    return;
  }

  if (newPass !== confirmPass) {
    showSecMsg("Passwords do not match. Please re-enter identical passwords.", false);
    return;
  }

  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Resetting Password...';
  }

  try {
    const deviceToken = localStorage.getItem("senpai_device_token") || null;
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: curUser.email, otp: otpVal, newPassword: newPass, deviceToken })
    });
    const data = await res.json();
    if (res.ok && data.success) {
      if (data.deviceToken) {
        localStorage.setItem("senpai_device_token", data.deviceToken);
      }
      window.cancelProfilePassChange();
      showSecMsg("✓ Password reset and updated successfully!", true);
    } else {
      showSecMsg(data.error || "Failed to reset password.", false);
    }
  } catch (err) {
    showSecMsg("Network error. Please try again.", false);
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = origText;
    }
  }
};

// ── 2. EMAIL CHANGE FLOW ─────────────────────────────────────────
window.cancelProfileEmailChange = function () {
  cachedNewEmail = "";
  cachedEmailCurrentPassword = "";
  if (profileEmailOtpCountdownTimer) clearInterval(profileEmailOtpCountdownTimer);

  const fieldsView = document.getElementById("profile-email-fields-view");
  const otpView = document.getElementById("profile-email-otp-view");
  const msgEl = document.getElementById("sec-email-message");

  if (fieldsView) fieldsView.style.display = "block";
  if (otpView) otpView.style.display = "none";
  if (msgEl) msgEl.style.display = "none";

  document.getElementById("profile-email-change-form")?.reset();
  document.getElementById("profile-email-otp-form")?.reset();
};

window.handleProfileEmailChangeSubmit = async function (e) {
  if (e) e.preventDefault();
  const newEmail = (document.getElementById("sec-change-new-email")?.value || "").trim().toLowerCase();
  const currentPass = (document.getElementById("sec-change-email-pass")?.value || "").trim();
  const changeBtn = document.getElementById("sec-btn-change-email");
  const origText = changeBtn ? changeBtn.innerHTML : '<i class="fa-solid fa-envelope"></i> Update Email';

  if (!newEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
    showSecEmailMsg("Please enter a valid email address.", false);
    return;
  }

  if (!currentPass) {
    showSecEmailMsg("Please enter your current password to authorize this change.", false);
    return;
  }

  const curUser = window.Auth?.getCurrentUser();
  if (curUser && curUser.email && curUser.email.toLowerCase() === newEmail) {
    showSecEmailMsg("New email address must be different from your current email.", false);
    return;
  }

  const token = localStorage.getItem("userToken") || sessionStorage.getItem("userToken");
  if (changeBtn) {
    changeBtn.disabled = true;
    changeBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Verifying & Sending Code...';
  }

  try {
    const res = await fetch("/api/user/request-email-change-otp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token || ""}`
      },
      body: JSON.stringify({ newEmail, currentPassword: currentPass })
    });

    const data = await res.json();
    if (res.ok && data.success) {
      cachedNewEmail = newEmail;
      cachedEmailCurrentPassword = currentPass;
      showSecEmailMsg(`6-digit verification code sent to ${newEmail}!`, true);

      const targetDisp = document.getElementById("sec-email-target-disp");
      if (targetDisp) targetDisp.textContent = newEmail;

      document.getElementById("profile-email-fields-view").style.display = "none";
      document.getElementById("profile-email-otp-view").style.display = "block";
      startProfileEmailOtpCountdown();

      const otpInput = document.getElementById("sec-email-otp-input");
      if (otpInput) {
        otpInput.value = "";
        otpInput.focus();
      }
    } else {
      showSecEmailMsg(data.error || "Failed to send verification code.", false);
    }
  } catch (err) {
    showSecEmailMsg("Network error. Please try again.", false);
  } finally {
    if (changeBtn) {
      changeBtn.disabled = false;
      changeBtn.innerHTML = origText;
    }
  }
};

window.handleProfileEmailOtpSubmit = async function (e) {
  if (e) e.preventDefault();
  const otpVal = (document.getElementById("sec-email-otp-input")?.value || "").trim();
  const confirmBtn = document.getElementById("sec-btn-confirm-email-otp");
  const origText = confirmBtn ? confirmBtn.innerHTML : '<i class="fa-solid fa-check"></i> Confirm & Update Email';

  if (otpVal.length !== 6) {
    showSecEmailMsg("Please enter the complete 6-digit verification code.", false);
    return;
  }

  const token = localStorage.getItem("userToken") || sessionStorage.getItem("userToken");
  if (confirmBtn) {
    confirmBtn.disabled = true;
    confirmBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Updating Email Address...';
  }

  try {
    const deviceToken = localStorage.getItem("senpai_device_token") || null;
    const res = await fetch("/api/user/confirm-email-change", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token || ""}`
      },
      body: JSON.stringify({
        newEmail: cachedNewEmail,
        currentPassword: cachedEmailCurrentPassword,
        otp: otpVal,
        deviceToken
      })
    });

    const data = await res.json();
    if (res.ok && data.success) {
      if (data.token) {
        localStorage.setItem("userToken", data.token);
      }
      if (data.user) {
        localStorage.setItem("currentUser", JSON.stringify(data.user));
        localStorage.setItem("lastUser", JSON.stringify(data.user));
      }
      if (data.deviceToken) {
        localStorage.setItem("senpai_device_token", data.deviceToken);
      }

      // Update UI elements across page
      const bannerEmail = document.getElementById("acc-banner-email");
      const profileEmail = document.getElementById("profile-email");
      const dropdownEmail = document.getElementById("dropdown-email");
      if (bannerEmail) bannerEmail.textContent = data.user.email;
      if (profileEmail) profileEmail.value = data.user.email;
      if (dropdownEmail) dropdownEmail.textContent = data.user.email;

      window.cancelProfileEmailChange();
      showSecEmailMsg("✓ Email address updated successfully!", true);
    } else {
      showSecEmailMsg(data.error || "Failed to update email address.", false);
    }
  } catch (err) {
    showSecEmailMsg("Network error. Please try again.", false);
  } finally {
    if (confirmBtn) {
      confirmBtn.disabled = false;
      confirmBtn.innerHTML = origText;
    }
  }
};

window.resendProfileEmailOtp = async function () {
  const token = localStorage.getItem("userToken") || sessionStorage.getItem("userToken");
  try {
    const res = await fetch("/api/user/request-email-change-otp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token || ""}`
      },
      body: JSON.stringify({ newEmail: cachedNewEmail, currentPassword: cachedEmailCurrentPassword })
    });
    const data = await res.json();
    if (res.ok && data.success) {
      startProfileEmailOtpCountdown();
      showSecEmailMsg(`New 6-digit verification code sent to ${cachedNewEmail}!`, true);
    } else {
      showSecEmailMsg(data.error || "Failed to resend code.", false);
    }
  } catch (err) {
    showSecEmailMsg("Network error. Please try again.", false);
  }
};

function startProfileEmailOtpCountdown() {
  const resendBtn = document.getElementById("sec-btn-resend-email-otp");
  const timerEl = document.getElementById("sec-email-otp-timer");
  if (!resendBtn) return;

  if (profileEmailOtpCountdownTimer) clearInterval(profileEmailOtpCountdownTimer);

  let seconds = 60;
  resendBtn.style.display = "none";
  if (timerEl) {
    timerEl.style.display = "inline";
    timerEl.textContent = `(Resend in ${seconds}s)`;
  }

  profileEmailOtpCountdownTimer = setInterval(() => {
    seconds--;
    if (seconds <= 0) {
      clearInterval(profileEmailOtpCountdownTimer);
      resendBtn.style.display = "inline";
      if (timerEl) timerEl.style.display = "none";
    } else {
      if (timerEl) timerEl.textContent = `(Resend in ${seconds}s)`;
    }
  }, 1000);
}

// ── 3. PASSWORD VISIBILITY TOGGLE HELPER ─────────────────────────
window.togglePasswordVisibility = function (inputId, btnEl) {
  const input = document.getElementById(inputId);
  if (!input) return;
  const isPassword = input.type === "password";
  input.type = isPassword ? "text" : "password";
  if (btnEl) {
    btnEl.innerHTML = isPassword ? '<i class="fa-regular fa-eye"></i>' : '<i class="fa-regular fa-eye-slash"></i>';
  }
};
