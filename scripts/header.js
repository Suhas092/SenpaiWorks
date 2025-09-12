document.addEventListener("DOMContentLoaded", () => {
  const placeholder = document.getElementById("header-placeholder");
  if (!placeholder) return;

  fetch("header.html")
    .then(res => res.text())
    .then(data => {
      placeholder.innerHTML = data;

      const links = placeholder.querySelectorAll(".nav-link");
      let currentPage = window.location.pathname.split("/").pop().toLowerCase();

      // If at root, consider it home.html
      if (!currentPage) currentPage = "home";

      links.forEach(link => {
        // const linkHref = link.getAttribute("href").toLowerCase();
      link.getAttribute("href")
        .toLowerCase()
        .replace(/\.html$/, "");
        if (linkHref === currentPage) {
          link.classList.add("active");
        } else {
          link.classList.remove("active");
        }
      });
    })
    .catch(err => console.error("Error loading header:", err));
});
