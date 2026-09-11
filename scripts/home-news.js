/**
 * SenpaiWorks Dynamic Featured News Loader
 * scripts/home-news.js
 */

(function () {
  "use strict";

  function escapeHtml(str) {
    if (!str) return "";
    return String(str).replace(/[&<>'"]/g, tag => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;"
    }[tag] || tag));
  }

  function escapeAttr(str) {
    if (!str) return "";
    return String(str).replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  function safeUrl(url) {
    if (!url) return "#";
    const trimmed = String(url).trim();
    if (trimmed.startsWith("javascript:") || trimmed.startsWith("data:") || trimmed.startsWith("vbscript:")) {
      return "#";
    }
    return trimmed;
  }

  async function loadHomeFeaturedNews() {
    try {
      const res = await fetch("/api/news/featured");
      if (!res.ok) return;

      const { mainFeature, recommended, listItems } = await res.json();

      // 1. Populate Main Feature Card (Left Big Card)
      if (mainFeature) {
        const mainCard = document.getElementById("home-featured-main-card");
        const badgeEl = document.getElementById("home-feature-badge");
        const metaEl = document.getElementById("home-feature-meta");
        const titleEl = document.getElementById("home-feature-title");
        const hashtagsEl = document.getElementById("home-feature-hashtags");

        if (mainCard) mainCard.href = `article.html?id=${encodeURIComponent(mainFeature.id)}`;
        if (badgeEl) badgeEl.textContent = mainFeature.category || "Best of the Week";
        if (metaEl) {
          const dateStr = mainFeature.date || "Recent";
          metaEl.textContent = `${mainFeature.category || "Platform Core"} · ${dateStr}`;
        }
        if (titleEl) titleEl.textContent = mainFeature.title || "";

        if (hashtagsEl && mainFeature.hashtags) {
          const tags = String(mainFeature.hashtags).split(",").map(t => t.trim()).filter(Boolean);
          if (tags.length > 0) {
            hashtagsEl.innerHTML = tags.map(tag => {
              const formattedTag = tag.startsWith("#") ? tag : "#" + tag;
              return `<span>${escapeHtml(formattedTag)}</span>`;
            }).join("");
          }
        }
      }

      // 2. Populate Recommended Card (Right Top Wide Card)
      if (recommended) {
        const recCard = document.getElementById("home-recommended-card");
        const recBadge = document.getElementById("home-rec-badge");
        const recTitle = document.getElementById("home-rec-title");

        if (recCard) {
          recCard.href = `article.html?id=${encodeURIComponent(recommended.id)}`;
          if (recommended.img) {
            recCard.style.backgroundImage = `url('${escapeAttr(safeUrl(recommended.img))}')`;
          }
        }
        if (recBadge) recBadge.textContent = recommended.category || "Art Library";
        if (recTitle) recTitle.textContent = recommended.title || "";
      }

      // 3. Populate Recommended 3-Item List
      if (listItems && listItems.length > 0) {
        const listContainer = document.getElementById("home-rec-list");
        if (listContainer) {
          listContainer.innerHTML = listItems.map(item => {
            const imgUrl = item.img || "https://pub-fcaa22b002b74b8a93604c85b4342984.r2.dev/news/code_copy_jq3ic6.webp";
            const timeAgo = item.readTime || item.date || "4 hours ago";
            const itemCat = item.category || "News";
            return `
              <a href="article.html?id=${encodeURIComponent(item.id)}" class="rec-list-item">
                <div class="rec-item-text">
                  <div class="rec-item-meta">${escapeHtml(itemCat)} &middot; ${escapeHtml(timeAgo)}</div>
                  <h4 class="rec-item-title">${escapeHtml(item.title || "")}</h4>
                </div>
                <img src="${escapeAttr(safeUrl(imgUrl))}" alt="${escapeAttr(item.title || "News")}" class="rec-item-img">
              </a>
            `;
          }).join("");
        }
      }
    } catch (err) {
      console.warn("Could not load dynamic featured news, using static fallback:", err);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", loadHomeFeaturedNews);
  } else {
    loadHomeFeaturedNews();
  }
})();
