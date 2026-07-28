"use strict";
// Footer script
fetch('footer.html?v=' + new Date().getTime())
    .then(response => response.text())
    .then(html => {
    const container = document.getElementById('footer-container');
    if (container) {
        container.innerHTML = html;
    }
})
    .catch(err => console.error('Failed to load footer:', err));
function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}
