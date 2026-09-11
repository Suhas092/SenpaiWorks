/**
 * SenpaiWorks Admin Console - Community Design Polls Module
 * scripts/admin/admin-community.js
 */

window.loadDesignPollSuggestions = async function () {
  const tbody = document.getElementById("poll-suggestions-list-body");
  if (!tbody) return;

  try {
    const res = await fetch("/api/admin/polls", { headers: window.getAdminTokenHeaders() });
    if (window.handleAdminResponse) window.handleAdminResponse(res);
    if (!res.ok) return;
    const allPolls = await res.json();

    if (!allPolls || allPolls.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: #888; padding: 20px;">No anime character suggestions recorded yet.</td></tr>';
      return;
    }

    tbody.innerHTML = allPolls.map(p => {
      let statusClass = "status-paid";
      if (p.status === "In Progress") statusClass = "status-shipped";
      if (p.status === "Pending") statusClass = "status-active";

      return '<tr>' +
        '<td><strong>' + window.escapeHtml(p.suggestion) + '</strong></td>' +
        '<td><small class="text-muted">' + window.escapeHtml(p.date) + '</small></td>' +
        '<td><span class="status-pill ' + statusClass + '">' + window.escapeHtml(p.status || "Pending") + '</span></td>' +
        '<td>' +
          '<button class="action-btn btn-edit" onclick="window.toggleAdminPollStatus(\'' + p.id + '\')" title="Change Status"><i class="fa-solid fa-rotate"></i></button>' +
          '<button class="action-btn btn-delete" onclick="window.deleteAdminPollSuggestion(\'' + p.id + '\')" title="Delete Suggestion"><i class="fa-solid fa-trash"></i></button>' +
        '</td>' +
      '</tr>';
    }).join("");
  } catch (err) {
    console.error("Failed to fetch polls", err);
  }
};

window.toggleAdminPollStatus = async function (pollId) {
  try {
    const res = await fetch("/api/admin/polls/" + pollId + "/toggle", {
      method: "PATCH",
      headers: window.getAdminTokenHeaders()
    });
    if (window.handleAdminResponse) window.handleAdminResponse(res);
    if (res.ok) {
      window.showAdminToast("Poll status updated", "success");
      window.loadDesignPollSuggestions();
    }
  } catch(e) {
    console.error(e);
  }
};

window.deleteAdminPollSuggestion = async function (pollId) {
  if (!confirm("Are you sure you want to delete this suggestion?")) return;
  try {
    const res = await fetch("/api/admin/polls/" + pollId, {
      method: "DELETE",
      headers: window.getAdminTokenHeaders()
    });
    if (window.handleAdminResponse) window.handleAdminResponse(res);
    if (res.ok) {
      window.showAdminToast("Poll deleted", "danger");
      window.loadDesignPollSuggestions();
    }
  } catch(e) {
    console.error(e);
  }
};
