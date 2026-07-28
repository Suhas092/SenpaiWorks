function loadContactSection(imageSrc: string): void {
  fetch("contact.html")
    .then(response => response.text())
    .then(html => {
      const container = document.getElementById("contact-container");
      if (container) {
        container.innerHTML = html;
      }
      // After injection, set the image source dynamically
      const img = document.getElementById("contact-dynamic-img") as HTMLImageElement | null;
      if (img) {
        img.src = imageSrc;
      }
    })
    .catch(err => console.error("Failed to load contact section:", err));
}
