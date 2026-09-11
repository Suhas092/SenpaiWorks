"use strict";

// 10. SAVED ADDRESSES MANAGEMENT
function getSavedAddressesStorageKey() {
  const currentUser = typeof getCurrentUser === "function" ? getCurrentUser() : null;
  if (currentUser && currentUser.email) {
    return "savedUserAddresses_" + encodeURIComponent(currentUser.email.toLowerCase().trim());
  }
  return "savedUserAddresses";
}

function getSavedAddressesList() {
  const key = getSavedAddressesStorageKey();
  let addrs = [];
  try {
    addrs = JSON.parse(localStorage.getItem(key)) || [];
  } catch (e) { addrs = []; }

  // Filter out any legacy hardcoded dummy placeholder addresses
  addrs = (addrs || []).filter(a => {
    if (!a) return false;
    if (a.id === "ADDR-DEF-1") return false;
    if (a.flat && typeof a.flat === 'string' && a.flat.includes("SenpaiWorks Studio, High Street")) return false;
    return true;
  });

  return addrs;
}

function loadSavedAddresses() {
  const container = document.getElementById("user-saved-addresses-grid");
  if (!container) return;

  const addrs = getSavedAddressesList();

  // 1. First Card: Add address card
  let html = `
    <div class="add-address-card" onclick="window.openAddAddressModal()" style="border: 2px dashed #cbd5e1; border-radius: 12px; min-height: 200px; padding: 20px; display: flex; flex-direction: column; align-items: center; justify-content: center; cursor: pointer; background: #ffffff; transition: all 0.2s ease; text-align: center;">
      <div class="add-icon" style="font-size: 2.2rem; color: #cbd5e1; margin-bottom: 6px;"><i class="fa-solid fa-plus"></i></div>
      <div class="add-txt" style="font-weight: 800; color: #0f172a; font-size: 1.05rem;">Add address</div>
    </div>
  `;

  // 2. Address cards (Reduced font size, clean bottom links, SenpaiWorks black text logo)
  addrs.forEach(addr => {
    html += `
      <div class="address-card ${addr.isDefault ? 'default-address' : ''}" style="border: 1px solid #d5d9d9; border-radius: 12px; padding: 14px 16px; position: relative; background: #ffffff; display: flex; flex-direction: column; justify-content: space-between; min-height: 200px; text-align: left;">
        <div>
          ${addr.isDefault ? `
            <div style="font-size: 0.76rem; font-weight: 700; color: #565959; border-bottom: 1px solid #e7e7e7; padding-bottom: 6px; margin-bottom: 10px; display: flex; align-items: center; gap: 4px; text-align: left;">
              Default: 
              <img src="assets/Videos/SenpaiWorks logo.png" alt="SenpaiWorks Icon" style="height: 12px; width: auto; filter: brightness(0); vertical-align: middle; margin-left: 2px;">
              <img src="assets/Videos/senpaiworks name logo no bg.png" alt="SenpaiWorks Text" style="height: 10px; width: auto; filter: brightness(0); vertical-align: middle;">
            </div>
          ` : ''}
          <h4 style="font-weight: 800; color: #0f172a; margin: 0 0 4px 0; font-size: 0.9rem; text-align: left;">${addr.fullName}</h4>
          <div style="font-size: 0.81rem; color: #334155; line-height: 1.38; margin-bottom: 6px; text-align: left;">
            ${addr.flat}<br>
            ${addr.street}${addr.landmark ? ', ' + addr.landmark : ''}<br>
            ${addr.city ? addr.city.toUpperCase() : ''}, ${addr.state ? addr.state.toUpperCase() : ''} ${addr.pincode}<br>
            ${addr.country}<br>
            Phone number: ${addr.phone}
          </div>
        </div>

        <!-- Bottom Links Row: Edit | Remove | Set as Default -->
        <div style="margin-top: 10px; padding-top: 8px; border-top: 1px solid #e7e7e7; font-size: 0.82rem; color: #565959; font-weight: 500; text-align: left;">
          <a href="javascript:void(0)" onclick="window.openAddAddressModal('${addr.id}')" style="color: #0066c0; text-decoration: none; font-weight: 600;">Edit</a>
          &nbsp;|&nbsp;
          <a href="javascript:void(0)" onclick="window.deleteAddress('${addr.id}')" style="color: #0066c0; text-decoration: none; font-weight: 600;">Remove</a>
          ${!addr.isDefault ? ` &nbsp;|&nbsp; <a href="javascript:void(0)" onclick="window.setDefaultAddress('${addr.id}')" style="color: #0066c0; text-decoration: none; font-weight: 600;">Set as Default</a>` : ''}
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}
window.loadSavedAddresses = loadSavedAddresses;

window.openAddAddressModal = function (editId) {
  const gridView = document.getElementById("addresses-grid-view");
  const formView = document.getElementById("addresses-form-view");
  const title = document.getElementById("inline-addr-title");
  const breadcrumbs = document.getElementById("inline-addr-breadcrumbs");
  const submitBtn = document.getElementById("btn-submit-address");
  const form = document.getElementById("address-inline-form");

  if (!gridView || !formView || !form) return;

  if (editId) {
    const addrs = getSavedAddressesList();
    const target = addrs.find(a => a.id === editId);
    if (target) {
      document.getElementById("addr-edit-id").value = target.id;
      document.getElementById("addr-country").value = target.country || "India";
      document.getElementById("addr-fullname").value = target.fullName || "";
      document.getElementById("addr-phone").value = target.phone ? target.phone.replace(/\D/g, "").slice(-10) : "";
      document.getElementById("addr-pincode").value = target.pincode || "";
      document.getElementById("addr-flat").value = target.flat || "";
      document.getElementById("addr-street").value = target.street || "";
      document.getElementById("addr-landmark").value = target.landmark || "";
      document.getElementById("addr-city").value = target.city || "";
      document.getElementById("addr-state").value = target.state || "Karnataka";
      document.getElementById("addr-is-default").checked = !!target.isDefault;
      document.getElementById("addr-instructions").value = target.instructions || "";

      if (title) title.textContent = "Edit your address";
      if (breadcrumbs) breadcrumbs.textContent = "Edit Address";
      if (submitBtn) submitBtn.textContent = "Save changes";
    }
  } else {
    form.reset();
    document.getElementById("addr-edit-id").value = "";
    if (title) title.textContent = "Add a new address";
    if (breadcrumbs) breadcrumbs.textContent = "New Address";
    if (submitBtn) submitBtn.textContent = "Add address";
  }

  gridView.style.display = "none";
  formView.style.display = "block";

  // Smooth scroll to top of address panel
  const panel = document.getElementById("tab-panel-addresses");
  if (panel) panel.scrollIntoView({ behavior: "smooth", block: "start" });
};

window.closeAddressInlineForm = function () {
  const gridView = document.getElementById("addresses-grid-view");
  const formView = document.getElementById("addresses-form-view");
  if (gridView) gridView.style.display = "block";
  if (formView) formView.style.display = "none";
};

window.autofillLocation = function (e) {
  const evt = e || window.event;
  const btn = evt ? (evt.target ? evt.target.closest("button") : null) : null;
  const originalHtml = btn ? btn.innerHTML : '<i class="fa-solid fa-crosshairs"></i> Autofill';

  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Detecting location...';
  }

  function applyLocationData(city, state, pincode, street, country) {
    const cityInput = document.getElementById("addr-city");
    const stateInput = document.getElementById("addr-state");
    const pincodeInput = document.getElementById("addr-pincode");
    const streetInput = document.getElementById("addr-street");
    const countryInput = document.getElementById("addr-country");

    if (cityInput && city) cityInput.value = city;
    if (stateInput && state) stateInput.value = state;
    if (pincodeInput && pincode) pincodeInput.value = pincode;
    if (streetInput && street && !streetInput.value) streetInput.value = street;
    if (countryInput && country) countryInput.value = country;

    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<i class="fa-solid fa-check"></i> Location Autofilled!';
      setTimeout(() => { btn.innerHTML = originalHtml; }, 2500);
    }
  }

  async function fetchLocFromCoords(lat, lon) {
    try {
      const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`);
      if (res.ok) {
        const data = await res.json();
        const city = data.city || data.locality || data.principalSubdivision || "Mysuru";
        const state = data.principalSubdivision || "Karnataka";
        const country = data.countryName || "India";
        const pincode = data.postcode ? data.postcode.replace(/\D/g, "").slice(0, 6) : "570016";
        const street = data.localityInfo && data.localityInfo.informative ? data.localityInfo.informative[0].name : "";

        applyLocationData(city, state, pincode, street, country);
        return true;
      }
    } catch (err) {
      console.warn("BigDataCloud lookup error:", err);
    }
    return false;
  }

  async function fetchLocFromIp() {
    try {
      const res = await fetch("https://ipapi.co/json/");
      if (res.ok) {
        const data = await res.json();
        const city = data.city || "Mysuru";
        const state = data.region || "Karnataka";
        const pincode = data.postal ? data.postal.replace(/\D/g, "").slice(0, 6) : "570016";
        const country = data.country_name || "India";

        applyLocationData(city, state, pincode, "", country);
        return true;
      }
    } catch (err) {
      console.warn("IP Geolocation lookup failed:", err);
    }
    return false;
  }

  if ("geolocation" in navigator) {
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const ok = await fetchLocFromCoords(pos.coords.latitude, pos.coords.longitude);
        if (!ok) await fetchLocFromIp();
      },
      async (err) => {
        console.warn("Geolocation permission error/timeout:", err);
        const ok = await fetchLocFromIp();
        if (!ok) applyLocationData("Mysuru", "Karnataka", "570016", "", "India");
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  } else {
    fetchLocFromIp();
  }
};

window.handleSaveAddressSubmit = function (e) {
  e.preventDefault();
  const editId = document.getElementById("addr-edit-id").value;
  const country = document.getElementById("addr-country").value;
  const fullName = document.getElementById("addr-fullname").value.trim();
  const phone = document.getElementById("addr-phone").value.trim();
  const pincode = document.getElementById("addr-pincode").value.trim();
  const flat = document.getElementById("addr-flat").value.trim();
  const street = document.getElementById("addr-street").value.trim();
  const landmark = document.getElementById("addr-landmark").value.trim();
  const city = document.getElementById("addr-city").value.trim();
  const state = document.getElementById("addr-state").value;
  const isDefault = document.getElementById("addr-is-default").checked;
  const instructions = document.getElementById("addr-instructions").value.trim();

  let addrs = getSavedAddressesList();

  if (isDefault) {
    addrs.forEach(a => a.isDefault = false);
  }

  if (editId) {
    const idx = addrs.findIndex(a => a.id === editId);
    if (idx !== -1) {
      addrs[idx] = {
        id: editId,
        country,
        fullName,
        phone,
        pincode,
        flat,
        street,
        landmark,
        city,
        state,
        isDefault,
        instructions
      };
    }
  } else {
    const newAddr = {
      id: "ADDR-" + Date.now(),
      country,
      fullName,
      phone,
      pincode,
      flat,
      street,
      landmark,
      city,
      state,
      isDefault: isDefault || addrs.length === 0,
      instructions
    };
    addrs.push(newAddr);
  }

  localStorage.setItem(getSavedAddressesStorageKey(), JSON.stringify(addrs));
  loadSavedAddresses();
  window.closeAddressInlineForm();
};

window.setDefaultAddress = function (id) {
  let addrs = getSavedAddressesList();
  addrs.forEach(a => {
    a.isDefault = (a.id === id);
  });
  localStorage.setItem(getSavedAddressesStorageKey(), JSON.stringify(addrs));
  loadSavedAddresses();
};

let pendingDeleteAddressId = null;

window.deleteAddress = function (id) {
  const addrs = getSavedAddressesList();
  const target = addrs.find(a => a.id === id);
  if (!target) return;

  pendingDeleteAddressId = id;

  const previewEl = document.getElementById("delete-addr-preview");
  if (previewEl) {
    previewEl.innerHTML = `
      <strong style="font-weight: 800; font-size: 0.95rem; color: #0f172a;">${target.fullName}</strong><br>
      ${target.flat}<br>
      ${target.street}${target.landmark ? ', ' + target.landmark : ''}<br>
      ${target.city ? target.city.toUpperCase() : ''}, ${target.state ? target.state.toUpperCase() : ''} ${target.pincode}<br>
      ${target.country}<br>
      Phone number: ${target.phone}
    `;
  }

  const modal = document.getElementById("delete-address-modal");
  if (modal) modal.classList.add("active");
};

window.closeDeleteAddressModal = function () {
  pendingDeleteAddressId = null;
  const modal = document.getElementById("delete-address-modal");
  if (modal) modal.classList.remove("active");
};

window.confirmDeleteAddressAction = function () {
  if (!pendingDeleteAddressId) return;

  let addrs = getSavedAddressesList();
  addrs = addrs.filter(a => a.id !== pendingDeleteAddressId);
  if (addrs.length > 0 && !addrs.some(a => a.isDefault)) {
    addrs[0].isDefault = true;
  }
  localStorage.setItem(getSavedAddressesStorageKey(), JSON.stringify(addrs));
  loadSavedAddresses();
  window.closeDeleteAddressModal();
};
