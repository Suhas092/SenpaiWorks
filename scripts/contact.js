function loadContactSection(imageSrc) {
  fetch("contact.html")
    .then(response => response.text())
    .then(html => {
      document.getElementById("contact-container").innerHTML = html;
      // After injection, set the image source dynamically
      document.getElementById("contact-dynamic-img").src = imageSrc;
    })
    .catch(err => console.error("Failed to load contact section:", err));
}
