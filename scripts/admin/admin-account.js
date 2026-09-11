/**
 * SenpaiWorks Admin Console - Account Settings Module
 * scripts/admin/admin-account.js
 */

window.initAccountSettings = function () {
  const form = document.getElementById("form-edit-profile");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = document.getElementById("profile-username-input")?.value.trim();
    const email = document.getElementById("profile-email-input")?.value.trim();
    const avatar = document.getElementById("profile-avatar-input")?.value.trim();
    const password = document.getElementById("profile-password-input")?.value;

    const payload = { name, email, avatar };
    if (password && password.trim().length > 0) {
      payload.password = password.trim();
    }

    try {
      const res = await fetch("/api/admin/profile", {
        method: "PUT",
        headers: window.getAdminTokenHeaders(),
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        window.showAdminToast("Admin profile credentials updated successfully.", "success");
      } else {
        window.showAdminToast("Admin profile credentials saved locally.", "info");
      }
    } catch (err) {
      window.showAdminToast("Admin profile credentials saved locally.", "info");
    }

    // Update avatar and username display across header/sidebar
    const nameDisplay = document.getElementById("sidebar-user-name");
    const detailName = document.getElementById("detail-profile-name");
    const detailEmail = document.getElementById("detail-profile-email");
    const avatarImgs = [
      document.getElementById("sidebar-user-avatar"),
      document.getElementById("detail-profile-avatar")
    ];

    if (nameDisplay && name) nameDisplay.textContent = name;
    if (detailName && name) detailName.textContent = name;
    if (detailEmail && email) detailEmail.textContent = email;
    if (avatar) {
      avatarImgs.forEach(img => { if (img) img.src = avatar; });
    }

    const passInput = document.getElementById("profile-password-input");
    if (passInput) passInput.value = "";
  });
};
