/**
 * SenpaiWorks Admin Console - News & Release Articles Module
 * scripts/admin/admin-news.js (v5.0)
 */

(function () {
  "use strict";

  let allNewsArticles = [];

  // Load and render news articles list
  window.loadNewsArticles = async function () {
    const tbody = document.getElementById("news-list-body");
    const countEl = document.getElementById("news-table-count");
    if (!tbody) return;

    try {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 24px; color: var(--text-secondary);"><i class="fa-solid fa-spinner fa-spin"></i> Loading news articles...</td></tr>';

      const res = await fetch("/api/admin/news", { headers: window.getAdminTokenHeaders() });
      if (window.handleAdminResponse) window.handleAdminResponse(res);
      if (!res.ok) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 20px; color: #ef4444;">Failed to load articles.</td></tr>';
        return;
      }

      allNewsArticles = await res.json();
      renderNewsTable();
    } catch (err) {
      console.error("Failed to fetch news articles:", err);
      tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 20px; color: #ef4444;">Error connecting to server.</td></tr>';
    }
  };

  function renderNewsTable() {
    const tbody = document.getElementById("news-list-body");
    const countEl = document.getElementById("news-table-count");
    if (!tbody) return;

    const searchTerm = (document.getElementById("news-search-input")?.value || "").toLowerCase().trim();
    const categoryFilter = document.getElementById("news-category-filter")?.value || "";
    const featuredFilter = document.getElementById("news-featured-filter")?.value || "";

    const filtered = allNewsArticles.filter(art => {
      if (searchTerm) {
        const matchTitle = (art.title || "").toLowerCase().includes(searchTerm);
        const matchCat = (art.category || "").toLowerCase().includes(searchTerm);
        const matchAuthor = (art.author || "").toLowerCase().includes(searchTerm);
        if (!matchTitle && !matchCat && !matchAuthor) return false;
      }
      if (categoryFilter && art.category !== categoryFilter) return false;
      if (featuredFilter === "featured" && !art.isFeatured) return false;
      if (featuredFilter === "standard" && art.isFeatured) return false;
      return true;
    });

    if (countEl) countEl.textContent = `${filtered.length} Articles`;

    if (filtered.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 30px; color: var(--text-secondary);">No articles match the filter.</td></tr>';
      return;
    }

    tbody.innerHTML = filtered.map(art => {
      const coverImg = art.img || "assets/news page assets/news slide photoshoped.png";
      const placementLabels = {
        main_feature: '<span class="badge" style="background:#6366f1;color:#fff;font-size:0.75rem;padding:4px 8px;border-radius:6px;">Main Feature</span>',
        recommended: '<span class="badge" style="background:#0284c7;color:#fff;font-size:0.75rem;padding:4px 8px;border-radius:6px;">Recommended Card</span>',
        list: '<span class="badge" style="background:#059669;color:#fff;font-size:0.75rem;padding:4px 8px;border-radius:6px;">List Item</span>',
        standard: '<span class="badge" style="background:rgba(255,255,255,0.08);color:var(--text-secondary);font-size:0.75rem;padding:4px 8px;border-radius:6px;">Standard Story</span>'
      };
      const placementBadge = placementLabels[art.placement] || placementLabels.standard;

      const featuredBtn = art.isFeatured
        ? `<button type="button" onclick="window.toggleNewsFeatured('${art.id}')" title="Currently Featured - Click to unfeature" style="background:rgba(99,102,241,0.15);border:1px solid #6366f1;color:#818cf8;padding:5px 10px;border-radius:6px;cursor:pointer;font-weight:700;font-size:0.78rem;"><i class="fa-solid fa-star" style="color:#fbbf24;"></i> Featured</button>`
        : `<button type="button" onclick="window.toggleNewsFeatured('${art.id}')" title="Not Featured - Click to feature" style="background:transparent;border:1px solid rgba(255,255,255,0.12);color:var(--text-secondary);padding:5px 10px;border-radius:6px;cursor:pointer;font-size:0.78rem;"><i class="fa-regular fa-star"></i> Feature</button>`;

      return `
        <tr>
          <td>
            <img src="${window.escapeHtml(coverImg)}" alt="Cover" style="width: 52px; height: 52px; object-fit: cover; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1);">
          </td>
          <td>
            <strong style="color: var(--text-primary); font-size: 0.94rem; display: block; max-width: 280px; line-height: 1.35;">${window.escapeHtml(art.title)}</strong>
            <span style="font-size: 0.76rem; color: var(--text-secondary);">${window.escapeHtml(art.readTime || "5 mins read")}</span>
          </td>
          <td>
            <span class="badge badge-type" style="font-size: 0.8rem; font-weight: 700;">${window.escapeHtml(art.category)}</span>
          </td>
          <td>
            <div style="font-size: 0.86rem; color: var(--text-primary); font-weight: 600;">${window.escapeHtml(art.author || "Team SenpaiWorks")}</div>
            <div style="font-size: 0.76rem; color: var(--text-secondary);">${window.escapeHtml(art.date || "")}</div>
          </td>
          <td>${placementBadge}</td>
          <td>${featuredBtn}</td>
          <td style="text-align: right; white-space: nowrap;">
            <a href="article.html?id=${encodeURIComponent(art.id)}" target="_blank" class="action-btn" title="View Live Article" style="text-decoration:none; display:inline-flex; align-items:center; justify-content:center; margin-right:4px;">
              <i class="fa-solid fa-arrow-up-right-from-square"></i>
            </a>
            <button type="button" class="action-btn btn-edit" onclick="window.openEditNewsModal('${art.id}')" title="Edit Article" style="margin-right:4px;">
              <i class="fa-solid fa-pen"></i>
            </button>
            <button type="button" class="action-btn btn-delete" onclick="window.deleteNewsArticle('${art.id}', '${window.escapeHtml(art.title).replace(/'/g, "\\'")}')" title="Delete Article">
              <i class="fa-solid fa-trash"></i>
            </button>
          </td>
        </tr>
      `;
    }).join("");
  }

  // Toggle Featured status
  window.toggleNewsFeatured = async function (id) {
    try {
      const res = await fetch(`/api/admin/news/${id}/feature`, {
        method: "PATCH",
        headers: window.getAdminTokenHeaders()
      });
      if (window.handleAdminResponse) window.handleAdminResponse(res);
      if (res.ok) {
        const data = await res.json();
        if (window.showAdminToast) {
          window.showAdminToast(data.isFeatured ? "Article featured on homepage!" : "Article removed from homepage highlights.", "success");
        }
        window.loadNewsArticles();
      }
    } catch (e) {
      console.error("Failed to toggle featured:", e);
    }
  };

  // Open edit modal (self-hydrating if allNewsArticles is not yet loaded)
  window.openEditNewsModal = async function (id) {
    let art = allNewsArticles.find(a => a.id === id);
    if (!art) {
      try {
        const res = await fetch("/api/news");
        if (res.ok) {
          const list = await res.json();
          if (Array.isArray(list)) {
            allNewsArticles = list;
            art = allNewsArticles.find(a => a.id === id);
          }
        }
      } catch (e) {
        console.warn("Could not fetch news articles for edit modal:", e);
      }
    }
    if (!art) {
      if (window.showAdminToast) window.showAdminToast("Could not find article details.", "warning");
      return;
    }

    const modal = document.getElementById("admin-news-modal");
    if (!modal) return;

    document.getElementById("news-edit-id").value = art.id;
    document.getElementById("news-edit-title").value = art.title || "";
    document.getElementById("news-edit-category").value = art.category || "Platform Core";
    document.getElementById("news-edit-author").value = art.author || "Team SenpaiWorks";
    document.getElementById("news-edit-date").value = art.date || "";
    document.getElementById("news-edit-readtime").value = art.readTime || "5 mins read";
    document.getElementById("news-edit-placement").value = art.placement || "standard";
    document.getElementById("news-edit-is-featured").checked = Boolean(art.isFeatured);
    document.getElementById("news-edit-img").value = art.img || "";
    document.getElementById("news-edit-hashtags").value = art.hashtags || "";
    document.getElementById("news-edit-summary").value = art.summary || "";
    document.getElementById("news-edit-content").value = art.content || "";

    modal.classList.add("active");
  };

  window.closeNewsModal = function () {
    const modal = document.getElementById("admin-news-modal");
    if (modal) modal.classList.remove("active");
  };

  // Delete article
  window.deleteNewsArticle = async function (id, title) {
    if (!confirm(`Are you sure you want to delete article "${title}"?`)) return;

    try {
      const res = await fetch(`/api/admin/news/${id}`, {
        method: "DELETE",
        headers: window.getAdminTokenHeaders()
      });
      if (window.handleAdminResponse) window.handleAdminResponse(res);
      if (res.ok) {
        if (window.showAdminToast) window.showAdminToast("Article deleted successfully", "success");
        window.loadNewsArticles();
      }
    } catch (e) {
      console.error("Failed to delete article:", e);
    }
  };

  // Setup form submission listeners once DOM ready
  document.addEventListener("DOMContentLoaded", () => {
    // 1. Search & Filter listeners
    const searchInput = document.getElementById("news-search-input");
    const categoryFilter = document.getElementById("news-category-filter");
    const featuredFilter = document.getElementById("news-featured-filter");

    if (searchInput) searchInput.addEventListener("input", renderNewsTable);
    if (categoryFilter) categoryFilter.addEventListener("change", renderNewsTable);
    if (featuredFilter) featuredFilter.addEventListener("change", renderNewsTable);

    // 2. Publish New Article Form
    const addForm = document.getElementById("form-add-news");
    if (addForm) {
      addForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const title = document.getElementById("news-title").value.trim();
        const category = document.getElementById("news-category").value;
        const author = document.getElementById("news-author").value.trim();
        const date = document.getElementById("news-date").value.trim();
        const readTime = document.getElementById("news-readtime").value.trim();
        const placement = document.getElementById("news-placement").value;
        const isFeatured = document.getElementById("news-is-featured").checked;
        const img = document.getElementById("news-img").value.trim();
        const hashtags = document.getElementById("news-hashtags").value.trim();
        const summary = document.getElementById("news-summary").value.trim();
        const content = document.getElementById("news-content").value.trim();

        try {
          const res = await fetch("/api/admin/news", {
            method: "POST",
            headers: window.getAdminTokenHeaders(),
            body: JSON.stringify({
              title, category, author, date, readTime,
              placement, isFeatured, img, hashtags, summary, content
            })
          });

          if (window.handleAdminResponse) window.handleAdminResponse(res);
          if (res.ok) {
            if (window.showAdminToast) window.showAdminToast("Article published successfully!", "success");
            addForm.reset();
            // Switch back to list tab
            const listTabBtn = document.querySelector('.inner-tab-btn[data-subtab="news-list"]');
            if (listTabBtn) listTabBtn.click();
            window.loadNewsArticles();
          } else {
            const err = await res.json();
            alert(err.error || "Failed to publish article.");
          }
        } catch (err) {
          console.error("Failed to publish news article:", err);
          alert("Network error publishing article.");
        }
      });
    }

    // 3. Edit Article Form Modal
    const editForm = document.getElementById("admin-edit-news-form");
    if (editForm) {
      editForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const id = document.getElementById("news-edit-id").value;
        if (!id) return;

        const title = document.getElementById("news-edit-title").value.trim();
        const category = document.getElementById("news-edit-category").value;
        const author = document.getElementById("news-edit-author").value.trim();
        const date = document.getElementById("news-edit-date").value.trim();
        const readTime = document.getElementById("news-edit-readtime").value.trim();
        const placement = document.getElementById("news-edit-placement").value;
        const isFeatured = document.getElementById("news-edit-is-featured").checked;
        const img = document.getElementById("news-edit-img").value.trim();
        const hashtags = document.getElementById("news-edit-hashtags").value.trim();
        const summary = document.getElementById("news-edit-summary").value.trim();
        const content = document.getElementById("news-edit-content").value.trim();

        try {
          const res = await fetch(`/api/admin/news/${id}`, {
            method: "PUT",
            headers: window.getAdminTokenHeaders(),
            body: JSON.stringify({
              title, category, author, date, readTime,
              placement, isFeatured, img, hashtags, summary, content
            })
          });

          if (window.handleAdminResponse) window.handleAdminResponse(res);
          if (res.ok) {
            if (window.showAdminToast) window.showAdminToast("Article updated successfully!", "success");
            window.closeNewsModal();
            window.loadNewsArticles();
          } else {
            const err = await res.json();
            alert(err.error || "Failed to update article.");
          }
        } catch (err) {
          console.error("Failed to update news article:", err);
          alert("Network error updating article.");
        }
      });
    }

    // 4. Cloudinary File Upload Integration
    const fileUpload = document.getElementById("news-file-upload");
    if (fileUpload) {
      fileUpload.addEventListener("change", async () => {
        const file = fileUpload.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append("image", file);

        try {
          if (window.showAdminToast) window.showAdminToast("Uploading image to Cloudinary...", "info");
          const uploadRes = await fetch("/api/upload", {
            method: "POST",
            body: formData
          });

          if (uploadRes.ok) {
            const data = await uploadRes.json();
            const urlInput = document.getElementById("news-img");
            if (urlInput) urlInput.value = data.url;
            if (window.showAdminToast) window.showAdminToast("Image uploaded successfully!", "success");
          } else {
            alert("Image upload failed.");
          }
        } catch (e) {
          console.error("Failed to upload image:", e);
          alert("Error uploading image.");
        }
      });
    }
  });
})();
