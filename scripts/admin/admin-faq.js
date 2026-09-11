/**
 * SenpaiWorks Admin Console - FAQ Management Module
 * scripts/admin/admin-faq.js
 */

let allAdminFaqs = [];
window.activeAdminFaqCat = "all";

// ── Load FAQs from SQLite Backend API ─────────────────────
window.loadAdminFaqs = async function () {
  const tableBody = document.getElementById("faq-admin-list-body");
  const countLabel = document.getElementById("faq-admin-table-count");
  if (!tableBody) return;

  try {
    tableBody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding: 24px; color: #94a3b8;"><i class="fa-solid fa-spinner fa-spin"></i> Fetching FAQs...</td></tr>`;
    
    const res = await fetch("/api/faqs");
    if (!res.ok) throw new Error("Failed to load FAQs");
    
    allAdminFaqs = await res.json();
    window.renderAdminFaqs();
  } catch (err) {
    console.error("Error loading FAQs:", err);
    tableBody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding: 24px; color: #ef4444;">Failed to load FAQs. Please retry.</td></tr>`;
  }
};

// ── Render FAQ Table ───────────────────────────────────────
window.renderAdminFaqs = function () {
  const tableBody = document.getElementById("faq-admin-list-body");
  const countLabel = document.getElementById("faq-admin-table-count");
  const searchInput = document.getElementById("faq-admin-search");

  if (!tableBody) return;

  const query = searchInput ? searchInput.value.trim().toLowerCase() : "";
  const cat = window.activeAdminFaqCat || "all";

  const filtered = allAdminFaqs.filter(faq => {
    const matchCat = (cat === "all" || (faq.category && faq.category.toLowerCase() === cat.toLowerCase()));
    const matchSearch = !query || 
      (faq.question && faq.question.toLowerCase().includes(query)) || 
      (faq.answer && faq.answer.toLowerCase().includes(query));
    return matchCat && matchSearch;
  });

  if (countLabel) {
    countLabel.textContent = `Showing ${filtered.length} of ${allAdminFaqs.length} questions`;
  }

  if (filtered.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding: 32px; color: #94a3b8;">No questions found matching your criteria.</td></tr>`;
    return;
  }

  const categoryNames = {
    store: "Store & Orders",
    merch: "Apparel & Merch",
    assets: "3D Assets & Rigs",
    account: "Accounts & Notifs",
    general: "Studio & Art"
  };

  tableBody.innerHTML = filtered.map(faq => {
    const catLabel = categoryNames[faq.category] || faq.category || "General";

    return `
      <tr>
        <td class="faq-order-col">#${faq.order || 0}</td>
        <td class="faq-question-col">${window.escapeHtml(faq.question)}</td>
        <td>
          <span class="faq-badge-category">
            ${catLabel}
          </span>
        </td>
        <td class="text-center">
          <div class="faq-row-actions">
            <button class="faq-btn-edit" onclick="window.openEditFaqModal(${faq.id})" title="Edit Question">
              <i class="fa-solid fa-pen"></i>
            </button>
            <button class="faq-btn-delete" onclick="window.deleteFaqItem(${faq.id})" title="Delete Question">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join("");
};

// ── Add / Edit FAQ Modal Handlers ─────────────────────────
window.openAddFaqModal = function () {
  document.getElementById("faq-modal-title").innerHTML = `<i class="fa-solid fa-circle-question"></i> Add New FAQ`;
  document.getElementById("faq-edit-id").value = "";
  document.getElementById("faq-input-question").value = "";
  document.getElementById("faq-input-category").value = "store";
  document.getElementById("faq-input-order").value = allAdminFaqs.length + 1;
  document.getElementById("faq-input-answer").value = "";
  document.getElementById("admin-faq-modal").style.display = "flex";
};

window.openEditFaqModal = function (id) {
  const faq = allAdminFaqs.find(f => f.id === id);
  if (!faq) return;

  document.getElementById("faq-modal-title").innerHTML = `<i class="fa-solid fa-pen-to-square"></i> Edit FAQ (#${id})`;
  document.getElementById("faq-edit-id").value = faq.id;
  document.getElementById("faq-input-question").value = faq.question || "";
  document.getElementById("faq-input-category").value = faq.category || "general";
  document.getElementById("faq-input-order").value = faq.order || 0;
  document.getElementById("faq-input-answer").value = faq.answer || "";
  document.getElementById("admin-faq-modal").style.display = "flex";
};

window.closeFaqModal = function () {
  document.getElementById("admin-faq-modal").style.display = "none";
};

window.handleSaveFaqForm = async function (e) {
  if (e) e.preventDefault();

  const editId = document.getElementById("faq-edit-id")?.value;
  const question = document.getElementById("faq-input-question")?.value.trim();
  const category = document.getElementById("faq-input-category")?.value;
  const order = parseInt(document.getElementById("faq-input-order")?.value) || 0;
  const answer = document.getElementById("faq-input-answer")?.value.trim();

  if (!question || !answer) {
    window.showAdminToast("Please provide both question and answer content", "danger");
    return;
  }

  const payload = { question, category, order, answer };
  const isEditing = !!editId;
  const url = isEditing ? `/api/admin/faqs/${editId}` : `/api/admin/faqs`;
  const method = isEditing ? "PUT" : "POST";

  try {
    const res = await fetch(url, {
      method,
      headers: window.getAdminTokenHeaders(),
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (res.ok && (data.success || data.faq)) {
      window.showAdminToast(isEditing ? "FAQ updated successfully!" : "New FAQ created!", "success");
      window.closeFaqModal();
      window.loadAdminFaqs();
    } else {
      window.showAdminToast(data.error || "Failed to save FAQ", "danger");
    }
  } catch (err) {
    console.error("Error saving FAQ:", err);
    window.showAdminToast("Server connection error while saving FAQ", "danger");
  }
};

window.deleteFaqItem = async function (id) {
  const faq = allAdminFaqs.find(f => f.id === id);
  const qTitle = faq ? `"${faq.question.substring(0, 40)}..."` : `Question #${id}`;

  const confirmed = await window.showAdminConfirm(
    "Delete FAQ",
    `Are you sure you want to delete ${qTitle}?`,
    "Delete Question",
    "danger"
  );
  if (!confirmed) return;

  try {
    const res = await fetch(`/api/admin/faqs/${id}`, {
      method: "DELETE",
      headers: window.getAdminTokenHeaders()
    });

    const data = await res.json();
    if (res.ok && data.success) {
      window.showAdminToast("FAQ deleted successfully!", "success");
      window.loadAdminFaqs();
    } else {
      window.showAdminToast(data.error || "Failed to delete FAQ", "danger");
    }
  } catch (err) {
    console.error("Error deleting FAQ:", err);
    window.showAdminToast("Server error deleting FAQ", "danger");
  }
};

// Hook listeners
document.addEventListener("DOMContentLoaded", () => {
  const faqSearch = document.getElementById("faq-admin-search");
  if (faqSearch) {
    faqSearch.addEventListener("input", () => window.renderAdminFaqs());
  }

  const faqPillBtns = document.querySelectorAll(".faq-admin-pill");
  faqPillBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      faqPillBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      window.activeAdminFaqCat = btn.dataset.cat || "all";
      window.renderAdminFaqs();
    });
  });

  const faqForm = document.getElementById("admin-faq-form");
  if (faqForm) {
    faqForm.addEventListener("submit", window.handleSaveFaqForm);
  }
});
