


  // Store all details data here
  const animeData = {
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
      plot: `Fan-Made Animated Short by SenpaiWorks is an action-packed tribute inspired by the Marvel X-Men universe and
       the iconic portrayal of Deadpool by Ryan Reynolds. While the characters are based on the X-Men franchise, the story, 
       direction, and execution are completely original — imagined and brought to life solely by SenpaiWorks. 
       The short film delivers a fast-paced sequence filled with intense battles, sharp humor, and the chaotic energy that 
       defines Deadpool, while also featuring familiar faces like Colossus, Yukio, Negasonic, and Wolverine. Though it borrows 
       beloved characters, the narrative itself is fresh and unique, created as a personal passion project that reimagines Deadpool’s world in an original light.`,
},

suzanz: {
  title: "Suzanz: The First Bloom",
  cover: "https://res.cloudinary.com/dmzchsqms/image/upload/f_auto,q_auto/w_600/v1757630847/suzan_godrays_jggu36.webp",
  genres: ["Pop", "Digital Band", "Music", "Fantasy"],
  watchUrl: "#",
  synonyms: "Suzanz: The First Bloom",
  aired: "In Development",
  premiered: "TBA",
  duration: "Approx. 3–4 min (Music Video)",
  studio: "SenpaiWorks",
  software: "Clip Studio Paint, Photoshop, Blender, Maya, Houdini, After Effects, Substance Painter.",
  plot:  `Suzanz is an original digital girl group inspired by K-pop culture, anime aesthetics, 
and idol storytelling. Each member is designed as a reflection of the creator's inspirations and 
favorite characters, reimagined as stylish, powerful idols. Their debut, "Suzanz: The First Bloom," 
marks the beginning of a fan-driven production that blends music, animation, and storytelling — 
with all creative work produced entirely by SenpaiWorks.`
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
      plot: `Dive into the tragic and powerful story of Zoro/Itachi-inspired tribute animation — 
      filled with loyalty, love, and sacrifice. 
      A cinematic sequence that brings together emotional storytelling with dynamic action.`,
      summary: `SenpaiWorks continues experimenting with anime-inspired cinematics, 
      blending classic storytelling with fresh visual direction.`
    }
  };

  // Fetch ID from URL
  const urlParams = new URLSearchParams(window.location.search);
  const animeId = urlParams.get("id") || "deadpool"; // default to deadpool
  const data = animeData[animeId];

  // Now fill the DOM
  document.querySelector(".detail-anime-title").textContent = data.title;
  document.querySelector(".detail-cover-image").src = data.cover;

  // Genres
  const genreList = document.querySelector(".detail-genre-list");
  genreList.innerHTML = `<span class="detail-sidebar-title">Genre:</span>` + 
    data.genres.map(g => `<span class="detail-genre-badge">${g}</span>`).join("");

  // Watch button
  const watchBtn = document.querySelector(".hero-buttons .watch-now");
  watchBtn.href = data.watchUrl;
  watchBtn.textContent = data.watchUrl === "#" ? "Coming Soon" : "▶ Watch Now";

  // Plot
  document.getElementById("plot-text").textContent = data.plot;
  document.getElementById("plot-summary-2").textContent = data.summary;

  // Sidebar
  const sidebar = document.querySelector(".detail-sidebar");
  sidebar.innerHTML = `
    <div><div class="detail-sidebar-title">Synonyms</div><div class="detail-sidebar-item">${data.synonyms}</div></div>
    <div><div class="detail-sidebar-title">Aired</div><div class="detail-sidebar-item">${data.aired}</div></div>
    <div><div class="detail-sidebar-title">Premiered</div><div class="detail-sidebar-item">${data.premiered}</div></div>
    <div><div class="detail-sidebar-title">Duration</div><div class="detail-sidebar-item">${data.duration}</div></div>
    <div><div class="detail-sidebar-title">Studio</div><div class="detail-sidebar-item">${data.studio}</div></div>
    <div><div class="detail-sidebar-title">Software</div><div class="detail-sidebar-item">${data.software}</div></div>
  `;








  document.addEventListener("DOMContentLoaded", function() {
  const plotTextEl = document.getElementById('plot-text');
  const toggleLink = document.getElementById('plot-toggle-link');
  if (!plotTextEl || !toggleLink) return;

  const fullText = plotTextEl.textContent.trim();
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
        this.textContent = "less";
      } else {
        plotTextEl.textContent = shortText + " ";
        this.textContent = "more";
      }
    });
  } else {
    toggleLink.style.display = 'none';
  }
});




