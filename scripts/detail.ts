interface AnimeDetail {
  title: string;
  cover: string;
  genres: string[];
  watchUrl: string;
  synonyms: string;
  aired: string;
  premiered: string;
  duration: string;
  studio: string;
  software: string;
  plot: string;
  summary?: string;
}

const animeData: Record<string, AnimeDetail> = {
  deadpool: {
    title: "Deadpool Animation",
    cover: "https://res.cloudinary.com/dmzchsqms/image/upload/f_auto,q_auto/w_600/v1757630827/deadpool_poster_krntp0.webp",
    genres: ["Action", "Adventure", "Superhero", "Fan-Animation"],
    watchUrl: "https://www.youtube.com/watch?v=SsoV6Mdjr6A",
    synonyms: "Deadpool Action Animation",
    aired: "May 6, 2025",
    premiered: "Summer 2025",
    duration: "3 min 41 sec",
    studio: "SenpaiWorks",
    software: "Clip Studio Paint, Photoshop, ZBrush, Blender, Mixamo, Substance Painter, After Effects, and Houdini.",
    plot: `Fan-Made Animated Short by SenpaiWorks is an action-packed tribute inspired by the Marvel X-Men universe and the iconic portrayal of Deadpool by Ryan Reynolds. While the characters are based on the X-Men franchise, the story, direction, and execution are completely original — imagined and brought to life solely by SenpaiWorks. The short film delivers a fast-paced sequence filled with intense battles, sharp humor, and the chaotic energy that defines Deadpool, while also featuring familiar faces like Colossus, Yukio, Negasonic, and Wolverine. Though it borrows beloved characters, the narrative itself is fresh and unique, created as a personal passion project that reimagines Deadpool’s world in an original light.`,
  },
  suzens: {
    title: "Suzens: The First Bloom",
    cover: "https://res.cloudinary.com/dmzchsqms/image/upload/f_auto,q_auto/w_600/v1757630847/suzan_godrays_jggu36.webp",
    genres: ["Pop", "Digital Band", "Music", "Fantasy"],
    watchUrl: "#",
    synonyms: "Suzens: The First Bloom",
    aired: "In Development",
    premiered: "TBA",
    duration: "Approx. 3–4 min (Music Video)",
    studio: "SenpaiWorks",
    software: "Clip Studio Paint, Photoshop, Blender, Maya, Houdini, After Effects, Substance Painter.",
    plot: `Suzens is an original digital girl group inspired by K-pop culture, anime aesthetics, and idol storytelling. Each member is designed as a reflection of the creator's inspirations and favorite characters, reimagined as stylish, powerful idols. Their debut, "Suzens: The First Bloom," marks the beginning of a fan-driven production that blends music, animation, and storytelling — with all creative work produced entirely by SenpaiWorks.`
  },
  zoro: {
    title: "Roronoa Zoro",
    cover: "https://res.cloudinary.com/dmzchsqms/image/upload/f_auto,q_auto/w_600/v1757630847/zoro_green_poster_unzusa.webp",
    genres: ["Action", "Drama", "Fan-Animation"],
    watchUrl: "https://www.instagram.com/reel/Cvt4tO7h0eg/",
    synonyms: "Itachi / Zoro Tribute",
    aired: "Coming Soon",
    premiered: "TBA",
    duration: "—",
    studio: "SenpaiWorks",
    software: "Clip Studio Paint, Photoshop, Blender, Substance Painter.",
    plot: `Dive into the tragic and powerful story of Zoro/Itachi-inspired tribute animation — filled with loyalty, love, and sacrifice. A cinematic sequence that brings together emotional storytelling with dynamic action.`,
    summary: `SenpaiWorks continues experimenting with anime-inspired cinematics, blending classic storytelling with fresh visual direction.`
  }
};

// Fetch ID from URL
const urlParams = new URLSearchParams(window.location.search);
const animeId = urlParams.get("id") || "deadpool"; // default to deadpool
const data = animeData[animeId];

if (data) {
  // Now fill the DOM
  const titleEl = document.querySelector(".detail-anime-title");
  if (titleEl) titleEl.textContent = data.title;

  const coverEl = document.querySelector(".detail-cover-image") as HTMLImageElement | null;
  if (coverEl) coverEl.src = data.cover;

  // Genres
  const genreList = document.querySelector(".detail-genre-list");
  if (genreList) {
    genreList.innerHTML = `<span class="detail-sidebar-title">Genre:</span>` + 
      data.genres.map(g => `<span class="detail-genre-badge">${g}</span>`).join("");
  }

  // Watch button
  const watchBtn = document.querySelector(".hero-buttons .watch-now") as HTMLAnchorElement | null;
  if (watchBtn) {
    watchBtn.href = data.watchUrl;
    watchBtn.textContent = data.watchUrl === "#" ? "Coming Soon" : "▶ Watch Now";
  }

  // Plot
  const plotTextEl = document.getElementById("plot-text");
  if (plotTextEl) plotTextEl.textContent = data.plot;

  const plotSummaryEl = document.getElementById("plot-summary-2");
  if (plotSummaryEl) plotSummaryEl.textContent = data.summary || "";

  // Sidebar
  const sidebar = document.querySelector(".detail-sidebar");
  if (sidebar) {
    sidebar.innerHTML = `
      <div><div class="detail-sidebar-title">Synonyms</div><div class="detail-sidebar-item">${data.synonyms}</div></div>
      <div><div class="detail-sidebar-title">Aired</div><div class="detail-sidebar-item">${data.aired}</div></div>
      <div><div class="detail-sidebar-title">Premiered</div><div class="detail-sidebar-item">${data.premiered}</div></div>
      <div><div class="detail-sidebar-title">Duration</div><div class="detail-sidebar-item">${data.duration}</div></div>
      <div><div class="detail-sidebar-title">Studio</div><div class="detail-sidebar-item">${data.studio}</div></div>
      <div><div class="detail-sidebar-title">Software</div><div class="detail-sidebar-item">${data.software}</div></div>
    `;
  }
}

document.addEventListener("DOMContentLoaded", function() {
  const plotTextEl = document.getElementById('plot-text');
  const toggleLink = document.getElementById('plot-toggle-link');
  if (!plotTextEl || !toggleLink) return;

  const fullText = plotTextEl.textContent ? plotTextEl.textContent.trim() : "";
  const words = fullText.split(/\s+/);

  if (words.length > 40) {
    const shortText = words.slice(0, 40).join(' ') + "...";
    let expanded = false;
    plotTextEl.textContent = shortText + " ";
    toggleLink.style.display = 'inline';

    toggleLink.addEventListener('click', function() {
      expanded = !expanded;
      if (expanded) {
        plotTextEl.textContent = fullText + " ";
        toggleLink.textContent = "less";
      } else {
        plotTextEl.textContent = shortText + " ";
        toggleLink.textContent = "more";
      }
    });
  } else {
    toggleLink.style.display = 'none';
  }
});

// backend API URL
const API_BASE_URL = 'http://localhost:5000/api';

interface DBComment {
  id: number;
  animeId: string;
  username: string;
  text: string;
  createdAt: string;
}

// Fetch and load likes
async function initLikes() {
  const likeBtn = document.getElementById("like-btn");
  const likeIcon = document.getElementById("like-icon");
  const likeCount = document.getElementById("like-count");
  if (!likeBtn || !likeIcon || !likeCount) return;

  const votedKey = `liked_anime_${animeId}`;
  let isLiked = localStorage.getItem(votedKey) === 'true';

  if (isLiked) {
    likeBtn.classList.add("liked");
    likeIcon.className = "fa-solid fa-heart";
  } else {
    likeBtn.classList.remove("liked");
    likeIcon.className = "fa-regular fa-heart";
  }

  try {
    const res = await fetch(`${API_BASE_URL}/anime/likes?animeId=${animeId}`);
    if (res.ok) {
      const data = await res.json();
      likeCount.textContent = data.count.toString();
    }
  } catch (err) {
    console.error("Error fetching likes:", err);
  }

  likeBtn.addEventListener("click", async () => {
    isLiked = localStorage.getItem(votedKey) === 'true';
    const action = isLiked ? 'unlike' : 'like';

    try {
      const res = await fetch(`${API_BASE_URL}/anime/likes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ animeId, action })
      });
      if (res.ok) {
        const data = await res.json();
        likeCount.textContent = data.count.toString();
        if (action === 'like') {
          likeBtn.classList.add("liked");
          likeIcon.className = "fa-solid fa-heart";
          localStorage.setItem(votedKey, 'true');
        } else {
          likeBtn.classList.remove("liked");
          likeIcon.className = "fa-regular fa-heart";
          localStorage.removeItem(votedKey);
        }
      }
    } catch (err) {
      console.error(`Error ${action}ing anime:`, err);
    }
  });
}

// Fetch and render comments
async function fetchComments() {
  const commentsList = document.getElementById("comments-list");
  const commentsCount = document.getElementById("comments-count");
  if (!commentsList || !commentsCount) return;

  try {
    const res = await fetch(`${API_BASE_URL}/anime/comments?animeId=${animeId}`);
    if (res.ok) {
      const comments: DBComment[] = await res.json();
      commentsCount.textContent = comments.length.toString();

      if (comments.length === 0) {
        commentsList.innerHTML = `<p style="color: #64748b; font-style: italic; font-size: 0.95rem;">No comments yet. Be the first to share your thoughts!</p>`;
        return;
      }

      commentsList.innerHTML = comments.map(comment => {
        const dateStr = new Date(comment.createdAt).toLocaleDateString(undefined, {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
        const initial = comment.username ? comment.username.charAt(0).toUpperCase() : '?';

        return `
          <div class="comment-card">
            <div class="comment-avatar">${initial}</div>
            <div class="comment-content">
              <div class="comment-meta">
                <span class="comment-author">${escapeHTML(comment.username)}</span>
                <span class="comment-date">${dateStr}</span>
              </div>
              <p class="comment-text">${escapeHTML(comment.text)}</p>
            </div>
          </div>
        `;
      }).join("");
    }
  } catch (err) {
    console.error("Error fetching comments:", err);
  }
}

function escapeHTML(str: string): string {
  return str.replace(/[&<>'"]/g, 
    tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag)
  );
}

// Set up comment form submit handler
function initComments() {
  const commentForm = document.getElementById("comment-form") as HTMLFormElement | null;
  const usernameInput = document.getElementById("comment-username") as HTMLInputElement | null;
  const textInput = document.getElementById("comment-text") as HTMLTextAreaElement | null;

  if (!commentForm || !usernameInput || !textInput) return;

  // Restore username from localStorage if available
  const savedUsername = localStorage.getItem("comment_username");
  if (savedUsername && usernameInput) {
    usernameInput.value = savedUsername;
  }

  commentForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const username = usernameInput.value.trim();
    const text = textInput.value.trim();

    if (!username || !text) return;

    try {
      const res = await fetch(`${API_BASE_URL}/anime/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ animeId, username, text })
      });

      if (res.ok) {
        textInput.value = "";
        localStorage.setItem("comment_username", username);
        fetchComments();
      }
    } catch (err) {
      console.error("Error posting comment:", err);
    }
  });

  fetchComments();
}

// Call on load
document.addEventListener("DOMContentLoaded", () => {
  initLikes();
  initComments();
});

