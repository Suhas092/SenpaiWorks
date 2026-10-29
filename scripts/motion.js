/* Motion page: fills showcase blocks from the admin-managed MotionRig list.
 * Each block in motion.html carries data-motion-id matching a MotionRig id.
 * The hardcoded HTML stays as the fallback if the request fails, and empty
 * admin values never overwrite existing content. */
(function () {
  "use strict";

  var DESC_SELECTOR = "p.mv-hero-track-desc, p.mv-split-desc, p.editorial-body-text, p.vfx-desc";

  function setText(root, selector, value) {
    var el = root.querySelector(selector);
    if (el && value) el.textContent = value;
  }

  function applyRig(root, rig) {
    setText(root, "h3", rig.title);
    setText(root, DESC_SELECTOR, rig.description);
    setText(root, ".mv-duration-text", rig.duration);

    if (rig.videoUrl) {
      var links = root.querySelectorAll("a.mv-play-link-btn");
      for (var i = 0; i < links.length; i++) links[i].setAttribute("href", rig.videoUrl);
    }
  }

  function init() {
    var blocks = document.querySelectorAll("[data-motion-id]");
    if (!blocks.length) return;

    fetch("/api/motion-rigs", { cache: "no-store" })
      .then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.json();
      })
      .then(function (rigs) {
        if (!Array.isArray(rigs)) return;
        var byId = {};
        rigs.forEach(function (rig) { byId[String(rig.id)] = rig; });
        for (var i = 0; i < blocks.length; i++) {
          var rig = byId[blocks[i].getAttribute("data-motion-id")];
          if (rig) applyRig(blocks[i], rig);
        }
      })
      .catch(function (err) {
        console.warn("Motion details unavailable, showing defaults:", err);
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
