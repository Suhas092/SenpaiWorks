/**
 * SenpaiWorks Admin Console - Registered Users Module
 * scripts/admin/admin-users.js
 */

let allUsersList = [];
let usersCurrentPage = 1;
let usersPageSize = 10;

window.changeUsersPage = function (p) {
  usersCurrentPage = p;
  window.loadUsers();
};

window.loadUsers = async function () {
  const tbody = document.getElementById("users-list-body");
  const countSpan = document.getElementById("users-table-count");
  const searchInput = document.getElementById("users-search");
  const pageSizeSelect = document.getElementById("users-page-size");
  if (!tbody) return;

  if (pageSizeSelect) usersPageSize = parseInt(pageSizeSelect.value) || 10;

  try {
    const res = await fetch("/api/users");
    if (res.ok) {
      const dbUsers = await res.json();
      if (Array.isArray(dbUsers)) {
        allUsersList = dbUsers.map(u => ({
          id: u.id,
          username: u.username || u.name || "User",
          email: u.email,
          avatar: u.avatar || "https://pub-fcaa22b002b74b8a93604c85b4342984.r2.dev/avatars/rem_happy_evhesz.webp",
          provider: u.provider || "Email & Password",
          joined: u.createdAt ? new Date(u.createdAt).toISOString().split('T')[0] : "2026-08-01",
          ordersCount: u.ordersCount || 0,
          status: "Verified"
        }));
      }
    }
  } catch (err) {
    console.warn("Backend user fetch offline, using current list:", err);
  }

  let filtered = [...allUsersList];

  const query = searchInput ? searchInput.value.toLowerCase().trim() : "";
  if (query) {
    filtered = filtered.filter(u =>
      (u.username || "").toLowerCase().includes(query) ||
      (u.email || "").toLowerCase().includes(query) ||
      (u.provider || "").toLowerCase().includes(query)
    );
  }

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: #999; padding: 20px;">No matching user accounts found.</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(u => `
    <tr>
      <td>
        <div class="user-cell-wrap">
          <img src="${u.avatar}" alt="${window.escapeHtml(u.username)}" class="user-avatar-small">
          <strong class="user-name-text">@${window.escapeHtml(u.username)}</strong>
        </div>
      </td>
      <td>${window.escapeHtml(u.email)}</td>
      <td><span class="status-pill status-pill-provider"><i class="fa-brands fa-shield"></i> ${window.escapeHtml(u.provider)}</span></td>
      <td>${u.joined}</td>
      <td><strong class="orders-count-text">${u.ordersCount} Order${u.ordersCount === 1 ? '' : 's'}</strong></td>
      <td><span class="status-pill status-delivered"><i class="fa-solid fa-circle-check"></i> ${u.status}</span></td>
      <td>
        <button class="action-btn btn-edit" onclick="window.showAdminToast('Account: @${window.escapeHtml(u.username)}', 'info')" title="View Account Details"><i class="fa-solid fa-eye"></i></button>
      </td>
    </tr>
  `).join("");
};
