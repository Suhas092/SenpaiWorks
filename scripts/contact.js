"use strict";
function loadContactSection(imageSrc) {
    // Ensure contact.css is present in head
    if (!document.querySelector('link[href*="contact.css"]')) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "contact.css?v=2.0";
        document.head.appendChild(link);
    }

    fetch("contact-section.html")
        .then(response => response.text())
        .then(html => {
            const container = document.getElementById("contact-container");
            if (container) {
                container.innerHTML = html;
            }
            // After injection, set the image source dynamically
            const img = document.getElementById("contact-dynamic-img");
            if (img && imageSrc) {
                img.src = imageSrc;
            }
        })
        .catch(err => console.error("Failed to load contact section:", err));
}
