/**
 * SenpaiWorks Dynamic Suzens Member Showcase Loader
 * Loads member data from backend API instead of hardcoded HTML
 * scripts/home-suzens.js
 */

(function () {
  "use strict";

  function escapeHtml(str) {
    if (!str) return "";
    return String(str).replace(/[&<>'"]/g, tag => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;"
    }[tag] || tag));
  }

  async function loadSuzensShowcase() {
    try {
      const res = await fetch("/api/homepage/suzens-members");
      if (!res.ok) {
        console.warn("[Suzens API] Failed to load members (HTTP " + res.status + "), using static fallback");
        return; // Use static HTML fallback
      }

      const members = await res.json();
      if (!Array.isArray(members) || members.length === 0) {
        console.warn("[Suzens API] No members returned, using static fallback");
        return;
      }

      // Members should be in order: Suzana, Tiara, Remi, Ayana (index 0-3)
      const cardsContainer = document.querySelector(".showcase-cards-container");
      if (!cardsContainer) return;

      // Clear existing cards and regenerate from API
      cardsContainer.innerHTML = members.map((member, index) => {
        const memberImg = member.imageUrl || "assets/suzana all out old.png";
        const memberName = member.name || "MEMBER";
        return `
          <div class="showcase-card" data-index="${index}">
            <div class="card-bg-overlay"></div>
            <img src="${memberImg}" alt="${escapeHtml(memberName)}" loading=\"${idx < 15 ? 'eager' : 'lazy'}\" decoding="async">
            <div class="card-name-overlay">${escapeHtml(memberName)}</div>
          </div>
        `;
      }).join("");

      // Update member details (left side) when card is clicked
      const firstMember = members[0];
      if (firstMember) {
        updateMemberDetails(firstMember, 1, members.length);
      }

      // Bind card click handlers
      bindMemberCardHandlers(members);

    } catch (err) {
      console.warn("[Suzens API] Could not load members, using static fallback:", err);
    }
  }

  function updateMemberDetails(member, currentIndex, totalMembers) {
    const nameEl = document.getElementById("showcase-member-name");
    const roleEl = document.getElementById("showcase-member-role");
    const descEl = document.getElementById("showcase-member-desc");
    const counterEl = document.getElementById("showcase-member-counter");

    if (nameEl) nameEl.textContent = member.name || "MEMBER";
    if (roleEl) roleEl.textContent = member.role || "VOCALIST";
    if (descEl) descEl.textContent = member.description || "Member of SUZENS";
    if (counterEl) {
      const padded = String(currentIndex).padStart(2, "0");
      const total = String(totalMembers).padStart(2, "0");
      counterEl.textContent = `${padded} / ${total}`;
    }
  }

  function bindMemberCardHandlers(members) {
    const cards = document.querySelectorAll(".showcase-card");
    cards.forEach(card => {
      card.addEventListener("click", () => {
        const index = parseInt(card.dataset.index, 10);
        if (members[index]) {
          updateMemberDetails(members[index], index + 1, members.length);
        }
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", loadSuzensShowcase);
  } else {
    loadSuzensShowcase();
  }
})();
