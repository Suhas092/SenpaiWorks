// Footer script


  fetch('footer.html')
    .then(response => response.text())
    .then(html => {
      document.getElementById('footer-container').innerHTML = html;
    })
    .catch(err => console.error('Failed to load footer:', err));

function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}

