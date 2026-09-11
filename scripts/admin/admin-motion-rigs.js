/**
 * SenpaiWorks Admin Console - Motion & 3D Character Rigs Module
 * scripts/admin/admin-motion-rigs.js
 */

window.loadMotionAssets = async function () {
  const tbody = document.getElementById("motion-list-body");
  if (!tbody) return;

  try {
    const res = await fetch("/api/admin/motion-rigs", { headers: window.getAdminTokenHeaders() });
    if (window.handleAdminResponse) window.handleAdminResponse(res);
    if (!res.ok) return;
    const motionAssets = await res.json();

    if (!motionAssets || motionAssets.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 20px;">No motion assets found</td></tr>';
      return;
    }

    tbody.innerHTML = motionAssets.map(m => {
      return '<tr>' +
        '<td><img src="' + m.img + '" alt="' + window.escapeHtml(m.title) + '" class="table-thumb"></td>' +
        '<td><strong>' + window.escapeHtml(m.title) + '</strong></td>' +
        '<td>' + window.escapeHtml(m.type) + '</td>' +
        '<td><code>' + window.escapeHtml(m.format) + '</code></td>' +
        '<td><span class="status-pill status-active">' + window.escapeHtml(m.status) + '</span></td>' +
        '<td>' +
          '<button class="action-btn btn-edit" onclick="window.editMotionAsset(\'' + window.escapeHtml(m.id) + '\', \'' + window.escapeHtml(m.title).replace(/'/g, "\\'") + '\')" title="Edit Asset"><i class="fa-solid fa-pen"></i></button>' +
        '</td>' +
      '</tr>';
    }).join("");
  } catch (err) {
    console.error("Failed to fetch motion rigs", err);
  }
};

window.editMotionAsset = async function(id, currentTitle) {
  const newTitle = prompt("Enter new title for rig:", currentTitle);
  if (!newTitle || newTitle === currentTitle) return;
  try {
    const res = await fetch("/api/admin/motion-rigs/" + id, {
      method: "PUT",
      headers: window.getAdminTokenHeaders(),
      body: JSON.stringify({ title: newTitle })
    });
    if (window.handleAdminResponse) window.handleAdminResponse(res);
    if (res.ok) {
      window.showAdminToast("Rig updated", "success");
      window.loadMotionAssets();
    }
  } catch(e) {
    console.error(e);
  }
};

