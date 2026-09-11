"use strict";

// 8. NOTIFICATIONS INBOX
let notifsCurrentPage = 1;
let notifsCategory = 'All';
let notifsHasMore = false;
let currentPreviewNotifId = null;
window.notificationDataStore = {};

window.loadNotificationsInbox = async function(page = 1) {
  const container = document.getElementById("notifications-inbox-list");
  const paginationDiv = document.getElementById("notifications-pagination");
  if (!container) return;

  function getCurrentUserEmail() {
    let currentUserStr = localStorage.getItem("currentUser");
    if (!currentUserStr) return null;
    try {
      return JSON.parse(currentUserStr).email;
    } catch (e) {
      return null;
    }
  }

  const email = getCurrentUserEmail();
  if (!email) {
    container.innerHTML = '<div style="padding: 20px; text-align: center;">Please log in to view notifications.</div>';
    return;
  }

  if (page === 1) {
    container.innerHTML = '<div style="padding: 40px 20px; text-align: center; color: #64748b;"><i class="fa-solid fa-spinner fa-spin" style="font-size: 2rem;"></i><div style="margin-top: 12px;">Loading...</div></div>';
  }

  try {
    const res = await fetch(`/api/notifications?page=${page}&limit=10&category=${encodeURIComponent(notifsCategory)}`, {
      headers: { "Authorization": "Bearer " + localStorage.getItem("userToken"), "x-user-email": (() => { try { return JSON.parse(localStorage.getItem("currentUser")).email; } catch(e){return "";} })() }
    });

    if (res.status === 401) {
      container.innerHTML = `
        <div style="padding: 60px 20px; text-align: center; color: #ef4444; background: #fef2f2; border-radius: 12px; border: 1px solid #fecaca;">
          <i class="fa-solid fa-triangle-exclamation" style="font-size: 3rem; margin-bottom: 16px; color: #ef4444;"></i>
          <div style="font-size: 1.1rem; font-weight: 600; color: #991b1b;">Authentication Required</div>
          <div style="font-size: 0.9rem; margin-top: 4px;">Your session has expired. Please sign out and sign back in to view your notifications.</div>
        </div>
      `;
      if(paginationDiv) paginationDiv.style.display = 'none';
      return;
    }

    const data = await res.json();
    
    if (page === 1 && (!data.notifications || data.notifications.length === 0)) {
      const isTrash = typeof notifsCategory !== 'undefined' && notifsCategory === 'Trash';
      container.innerHTML = `
        <div style="padding: 60px 20px; text-align: center; color: #64748b; background: #f8fafc; border-radius: 12px; border: 1px dashed #cbd5e1;">
          <i class="${isTrash ? 'fa-solid fa-trash-can' : 'fa-regular fa-bell-slash'}" style="font-size: 3rem; margin-bottom: 16px; color: #94a3b8;"></i>
          <div style="font-size: 1.1rem; font-weight: 600; color: #334155;">${isTrash ? 'Trash is empty.' : 'You\'re all caught up.'}</div>
          <div style="font-size: 0.9rem; margin-top: 4px;">${isTrash ? 'No deleted notifications here.' : 'No new notifications right now.'}</div>
        </div>
      `;
      if(paginationDiv) paginationDiv.style.display = 'none';
      return;
    }

    notifsHasMore = page < data.totalPages;
    if(paginationDiv) {
      const total = data.total || 0;
      const limit = 10;
      const startIdx = total === 0 ? 0 : (page - 1) * limit + 1;
      const endIdx = Math.min(page * limit, total);

      paginationDiv.style.display = total > 0 ? 'flex' : 'none';

      const btnPrev = document.getElementById('btn-prev-notifs');
      const btnNext = document.getElementById('btn-next-notifs');
      if(btnPrev) {
        btnPrev.disabled = page === 1;
        btnPrev.style.opacity = page === 1 ? '0.4' : '1';
        btnPrev.style.cursor = page === 1 ? 'default' : 'pointer';
      }
      if(btnNext) {
        btnNext.disabled = !notifsHasMore;
        btnNext.style.opacity = !notifsHasMore ? '0.4' : '1';
        btnNext.style.cursor = !notifsHasMore ? 'default' : 'pointer';
      }
      const pageInfoEl = document.getElementById('notifs-page-info');
      if (pageInfoEl) {
        pageInfoEl.textContent = `${startIdx}–${endIdx} of ${total}`;
      }
    }

    let html = "";
    data.notifications.forEach(n => {
      const timeStr = new Date(n.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

      let iconClass = 'fa-regular fa-bell';
      let categoryName = 'General';
      if (n.type.includes('order')) { iconClass = 'fa-solid fa-box'; categoryName = 'Order Updates'; }
      else if (n.type.includes('post') || n.type.includes('support')) { iconClass = 'fa-regular fa-comment-dots'; categoryName = 'Community'; }
      else if (n.type.includes('product') || n.type.includes('wishlist') || n.type.includes('offer') || n.type.includes('sale')) { iconClass = 'fa-solid fa-cart-shopping'; categoryName = 'Store Updates'; }
      else if (n.type.includes('article') || n.type.includes('course') || n.type.includes('broadcast')) { iconClass = 'fa-regular fa-newspaper'; categoryName = 'Studio News'; }
      else { iconClass = 'fa-regular fa-bell'; categoryName = 'Other'; }

      window.notificationDataStore[n.id] = {
        id: n.id,
        title: n.title,
        message: n.message,
        isRead: n.isRead,
        link: n.link,
        type: n.type,
        date: timeStr,
        iconClass: iconClass,
        categoryName: categoryName
      };

      if (typeof window.renderNotificationRowHTML === 'function') {
        html += window.renderNotificationRowHTML(n, false);
      }
    });

    // With pagination, always replace the content
    container.innerHTML = html;
    attachNotificationCheckboxListeners();

    try {
      const bRes = await fetch(`/api/notifications/unread-count?t=${new Date().getTime()}`, {
        headers: { "Authorization": "Bearer " + localStorage.getItem("userToken"), "x-user-email": email }
      });
      if (bRes.ok) {
        const bData = await bRes.json();
        const unreadTotal = bData.unreadCount || 0;

        // Update nav-notif-count badge on profile page sidebar
        const navNotifCount = document.getElementById("nav-notif-count");
        if (navNotifCount) {
          if (unreadTotal > 0) {
            navNotifCount.textContent = unreadTotal > 9 ? "9+" : unreadTotal;
            navNotifCount.style.display = "inline-block";
          } else {
            navNotifCount.textContent = "0";
            navNotifCount.style.display = "none";
          }
        }

        // Update notifications-badge on header bar
        const headerBadge = document.getElementById("notifications-badge");
        if (headerBadge) {
          if (unreadTotal > 0 && localStorage.getItem('notif-muted') !== 'true') {
            headerBadge.textContent = unreadTotal > 9 ? "9+" : unreadTotal;
            headerBadge.style.display = "inline-flex";
          } else {
            headerBadge.textContent = "0";
            headerBadge.style.display = "none";
          }
        }

        const counts = bData.countsByCategory;
        if (counts) {
          document.querySelectorAll('.notif-tab-btn').forEach(btn => {
            const cat = btn.getAttribute('data-category');
            if (cat === 'Trash') return;
            const badge = btn.querySelector('.notif-badge');
            const count = counts[cat] || 0;
            if (badge) {
              if (count > 0) {
                badge.textContent = ` (${count})`;
                badge.style.display = 'inline';
              } else {
                badge.style.display = 'none';
              }
            }
            if (cat === 'Other') {
              if (count > 0 || bData.hasOther) {
                btn.style.display = 'inline-flex';
              } else {
                btn.style.display = 'none';
              }
            }
          });
        }
      }
    } catch (e) {
      console.error(e);
    }

  } catch (err) {
    console.error("Failed to load notifications:", err);
    if(page === 1) container.innerHTML = '<div style="padding: 20px; text-align: center; color: #ef4444;">Failed to load.</div>';
  }
};

function attachNotificationCheckboxListeners() {
  const checkboxes = document.querySelectorAll('.notif-checkbox');
  const selectAllBtn = document.getElementById('notif-select-all-btn');
  const mainCheckbox = document.getElementById('notif-select-all');
  const selectCountDisplay = document.getElementById('notif-select-count');
  
  const selectedActions = document.getElementById('notif-selected-actions');
  const markUnreadSelectedBtn = document.getElementById('notif-mark-unread-selected-btn');
  const markReadSelectedBtn = document.getElementById('notif-mark-read-selected-btn');
  const markAllReadBtn = document.getElementById('notif-mark-all-read-btn');
  
  const updateToolbar = () => {
    const checkedBoxes = document.querySelectorAll('.notif-checkbox:checked');
    const checked = checkedBoxes.length;
    const total = checkboxes.length;
    
    const inboxList = document.getElementById('notifications-inbox-list');
    if (inboxList) {
      if (checked > 0) {
        inboxList.classList.add('selection-mode');
      } else {
        inboxList.classList.remove('selection-mode');
      }
    }
    
    if (selectCountDisplay) {
      selectCountDisplay.textContent = checked > 0 ? `${checked} selected` : '';
    }
    
    if (mainCheckbox) {
      mainCheckbox.checked = checked > 0 && checked === total;
      mainCheckbox.indeterminate = checked > 0 && checked < total;
    }
    
    if (selectAllBtn) {
      if (total > 0 && checked === total) {
        selectAllBtn.textContent = 'Deselect All';
      } else {
        selectAllBtn.textContent = 'Select All';
      }
    }
    
    if (selectedActions) {
      if (checked > 0) {
        selectedActions.style.display = 'flex';
        if (markUnreadSelectedBtn) markUnreadSelectedBtn.style.display = 'block';
      } else {
        selectedActions.style.display = 'none';
      }
    }

    const delBtn = document.getElementById('notif-delete-selected-btn');
    const restoreBtn = document.getElementById('notif-restore-selected-btn');
    const permDelBtn = document.getElementById('notif-permanent-delete-selected-btn');
    const emptyTrashBtn = document.getElementById('notif-empty-trash-btn');
    
    if (typeof notifsCategory !== 'undefined' && notifsCategory === 'Trash') {
      if (delBtn) delBtn.style.display = 'none';
      if (markReadSelectedBtn) markReadSelectedBtn.style.display = 'none';
      if (markUnreadSelectedBtn) markUnreadSelectedBtn.style.display = 'none';
      if (restoreBtn) restoreBtn.style.display = 'flex';
      if (permDelBtn) permDelBtn.style.display = 'flex';
      if (emptyTrashBtn) emptyTrashBtn.style.display = checked > 0 ? 'none' : 'flex';
      // Select dropdown: hide Move to Trash, show Restore
      const moveToTrashItem = document.getElementById('notif-move-to-trash-btn');
      const restoreDropdownItem = document.getElementById('notif-restore-dropdown-btn');
      if (moveToTrashItem) moveToTrashItem.style.display = 'none';
      if (restoreDropdownItem) restoreDropdownItem.style.display = 'block';
    } else {
      if (delBtn) delBtn.style.display = 'flex';
      if (restoreBtn) restoreBtn.style.display = 'none';
      if (permDelBtn) permDelBtn.style.display = 'none';
      if (emptyTrashBtn) emptyTrashBtn.style.display = 'none';
      // Select dropdown: show Move to Trash, hide Restore
      const moveToTrashItem = document.getElementById('notif-move-to-trash-btn');
      const restoreDropdownItem = document.getElementById('notif-restore-dropdown-btn');
      if (moveToTrashItem) moveToTrashItem.style.display = 'block';
      if (restoreDropdownItem) restoreDropdownItem.style.display = 'none';

      if (checked > 0) {
        if (markUnreadSelectedBtn) markUnreadSelectedBtn.style.display = 'block';
        if (markReadSelectedBtn) markReadSelectedBtn.style.display = 'block';
        if (markAllReadBtn) markAllReadBtn.style.display = 'none';
      } else {
        if (markUnreadSelectedBtn) markUnreadSelectedBtn.style.display = 'none';
        if (markReadSelectedBtn) markReadSelectedBtn.style.display = 'none';
        if (markAllReadBtn) markAllReadBtn.style.display = 'block';
      }
    }
  };

  checkboxes.forEach(cb => {
    cb.addEventListener('change', updateToolbar);
  });
  
  if (mainCheckbox) {
    mainCheckbox.onclick = () => {
      const isChecked = mainCheckbox.checked;
      if (isChecked) {
        const inboxList = document.getElementById('notifications-inbox-list');
        if (inboxList) inboxList.classList.add('selection-mode');
      } else {
        checkboxes.forEach(cb => cb.checked = false);
        updateToolbar();
      }
    };
  }
  
  if (selectAllBtn) {
    selectAllBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const checkedBoxes = document.querySelectorAll('.notif-checkbox:checked');
      const isAllChecked = checkboxes.length > 0 && checkedBoxes.length === checkboxes.length;
      checkboxes.forEach(cb => cb.checked = !isAllChecked);
      updateToolbar();
      // Update button text
      selectAllBtn.textContent = isAllChecked ? 'Select All' : 'Deselect All';
    });
  }
}

window.openNotificationPreview = async function(notif) {
  const listView = document.getElementById('notifications-inbox-view') || document.getElementById('notifications-list-view');
  const previewView = document.getElementById('notification-preview-view');
  
  if(!listView || !previewView || !notif) return;
  
  const titleEl = document.getElementById('notif-preview-title');
  const bodyEl = document.getElementById('notif-preview-body');
  const dateEl = document.getElementById('notif-preview-date');
  if (titleEl) titleEl.textContent = notif.title || '';
  if (bodyEl) bodyEl.textContent = notif.message || '';
  if (dateEl) dateEl.textContent = notif.date || '';
  
  const iconEl = document.getElementById('notif-preview-icon');
  if (iconEl) {
    iconEl.className = notif.iconClass || 'fa-regular fa-bell';
  }
  
  const catEl = document.getElementById('notif-preview-category-name');
  if (catEl) {
    catEl.textContent = notif.categoryName ? `• ${notif.categoryName}` : '';
  }
  
  currentPreviewNotifId = notif.id;
  
  // Switch view
  listView.style.display = 'none';
  previewView.style.display = 'block';
  
  // Trigger mark as read automatically
  if (!notif.isRead) {
    try {
      await fetch(`/api/notifications/${notif.id}/read`, {
        method: 'PATCH',
        headers: { "Authorization": "Bearer " + localStorage.getItem("userToken"), "x-user-email": (() => { try { return JSON.parse(localStorage.getItem("currentUser")).email; } catch(e){return "";} })() }
      });
      notif.isRead = true;
      if (typeof window.fetchUnreadCount === 'function') window.fetchUnreadCount();
    } catch(e) {}
  }
};

window.openDirectNotificationById = async function(id) {
  if (!id) return;
  const numId = parseInt(id);
  
  if (typeof window.switchAccountTab === 'function') {
    window.switchAccountTab('notifications');
  }

  let notif = window.notificationDataStore ? window.notificationDataStore[numId] : null;
  if (!notif) {
    try {
      const res = await fetch(`/api/notifications/${numId}`, {
        headers: {
          "Authorization": "Bearer " + localStorage.getItem("userToken"),
          "x-user-email": (() => { try { return JSON.parse(localStorage.getItem("currentUser")).email; } catch(e){return "";} })()
        }
      });
      if (res.ok) {
        const n = await res.json();
        const timeStr = new Date(n.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        let iconClass = 'fa-regular fa-bell';
        let categoryName = 'General';
        if (n.type && n.type.includes('order')) { iconClass = 'fa-solid fa-box'; categoryName = 'Order Updates'; }
        else if (n.type && (n.type.includes('post') || n.type.includes('support'))) { iconClass = 'fa-regular fa-comment-dots'; categoryName = 'Community'; }
        else if (n.type && (n.type.includes('product') || n.type.includes('wishlist') || n.type.includes('offer') || n.type.includes('sale'))) { iconClass = 'fa-solid fa-cart-shopping'; categoryName = 'Store Updates'; }
        else if (n.type && (n.type.includes('article') || n.type.includes('course') || n.type.includes('broadcast'))) { iconClass = 'fa-regular fa-newspaper'; categoryName = 'Studio News'; }
        else { iconClass = 'fa-regular fa-bell'; categoryName = 'Other'; }

        notif = {
          id: n.id,
          title: n.title,
          message: n.message,
          isRead: n.isRead,
          link: n.link,
          type: n.type,
          date: timeStr,
          iconClass: iconClass,
          categoryName: categoryName
        };
        if (!window.notificationDataStore) window.notificationDataStore = {};
        window.notificationDataStore[n.id] = notif;
      }
    } catch(err) {
      console.warn("Failed to fetch direct notification:", err);
    }
  }

  if (notif) {
    window.openNotificationPreview(notif);
  }
};

window.closeNotificationPreview = function() {
  const listView = document.getElementById('notifications-inbox-view') || document.getElementById('notifications-list-view');
  const previewView = document.getElementById('notification-preview-view');
  
  if(!listView || !previewView) return;
  
  previewView.style.display = 'none';
  listView.style.display = 'block';
  
  notifsCurrentPage = 1;
  window.loadNotificationsInbox(1);
};

function showCustomConfirmModal(message, onConfirm) {
  const modal = document.getElementById('delete-confirm-modal');
  const msgEl = document.getElementById('delete-confirm-msg');
  const cancelBtn = document.getElementById('btn-cancel-delete');
  const confirmBtn = document.getElementById('btn-confirm-delete');
  
  if (!modal) {
    // fallback if modal not found
    if(confirm(message)) onConfirm();
    return;
  }
  
  msgEl.textContent = message;
  modal.style.display = 'flex';
  setTimeout(() => modal.style.opacity = '1', 10);
  
  const close = () => {
    modal.style.display = 'none';
    cancelBtn.replaceWith(cancelBtn.cloneNode(true));
    confirmBtn.replaceWith(confirmBtn.cloneNode(true));
  };
  
  cancelBtn.addEventListener('click', close, { once: true });
  confirmBtn.addEventListener('click', () => {
    close();
    onConfirm();
  }, { once: true });
}
window.showCustomConfirmModal = showCustomConfirmModal;

window.deleteSelectedNotifications = async function() {
  const checked = document.querySelectorAll('.notif-checkbox:checked');
  if(checked.length === 0) return;
  
  const ids = Array.from(checked).map(cb => parseInt(cb.value));
  
  // In Trash mode, this becomes a permanent delete with a warning
  if (typeof notifsCategory !== 'undefined' && notifsCategory === 'Trash') {
    showCustomConfirmModal(`Permanently delete ${ids.length} notification${ids.length > 1 ? 's' : ''}? This cannot be undone.`, async () => {
      try {
        // Permanent bulk delete via dedicated endpoint
        const res = await fetch('/api/notifications/bulk/permanent', {
          method: 'DELETE',
          headers: { 
            'Content-Type': 'application/json',
            "Authorization": "Bearer " + localStorage.getItem("userToken"),
            "x-user-email": (() => { try { return JSON.parse(localStorage.getItem("currentUser")).email; } catch(e){return "";} })()
          },
          body: JSON.stringify({ ids })
        });
        if(res.ok) {
          await window.loadNotificationsInbox(notifsCurrentPage);
          if (typeof window.fetchUnreadCount === 'function') window.fetchUnreadCount();
        }
      } catch(err) {
        console.error(err);
        alert("Failed to permanently delete notifications.");
      }
    });
    return;
  }

  try {
    const res = await fetch('/api/notifications/bulk', {
      method: 'DELETE',
      headers: { 
        'Content-Type': 'application/json',
        "Authorization": "Bearer " + localStorage.getItem("userToken"),
        "x-user-email": (() => { try { return JSON.parse(localStorage.getItem("currentUser")).email; } catch(e){return "";} })()
      },
      body: JSON.stringify({ ids })
    });
    if(res.ok) {
      await window.loadNotificationsInbox(notifsCurrentPage);
      if (typeof window.fetchUnreadCount === 'function') window.fetchUnreadCount();
    }
  } catch(err) {
    console.error(err);
    alert("Failed to delete notifications.");
  }
};

window.moveSelectedToTrash = async function() {
  const checked = document.querySelectorAll('.notif-checkbox:checked');
  if(checked.length === 0) return;
  const ids = Array.from(checked).map(cb => parseInt(cb.value));
  try {
    const res = await fetch('/api/notifications/bulk', {
      method: 'DELETE',
      headers: { 
        'Content-Type': 'application/json',
        "Authorization": "Bearer " + localStorage.getItem("userToken"),
        "x-user-email": (() => { try { return JSON.parse(localStorage.getItem("currentUser")).email; } catch(e){return "";} })()
      },
      body: JSON.stringify({ ids })
    });
    if(res.ok) {
      await window.loadNotificationsInbox(notifsCurrentPage);
      if (typeof window.fetchUnreadCount === 'function') window.fetchUnreadCount();
    }
  } catch(err) {
    console.error(err);
    alert("Failed to move to trash.");
  }
};

window.restoreSelectedNotifications = async function() {
  const checked = document.querySelectorAll('.notif-checkbox:checked');
  if(checked.length === 0) return;
  
  const ids = Array.from(checked).map(cb => parseInt(cb.value));
  try {
    const res = await fetch('/api/notifications/bulk/restore', {
      method: 'PATCH',
      headers: { 
        'Content-Type': 'application/json',
        "Authorization": "Bearer " + localStorage.getItem("userToken"),
        "x-user-email": (() => { try { return JSON.parse(localStorage.getItem("currentUser")).email; } catch(e){return "";} })() 
      },
      body: JSON.stringify({ ids })
    });
    if(res.ok) {
      await window.loadNotificationsInbox(notifsCurrentPage);
      if (typeof window.fetchUnreadCount === 'function') window.fetchUnreadCount();
    }
  } catch(err) {
    console.error(err);
    alert("Failed to restore notifications.");
  }
};

window.permanentDeleteSelectedNotifications = async function() {
  const checked = document.querySelectorAll('.notif-checkbox:checked');
  if(checked.length === 0) return;
  
  const ids = Array.from(checked).map(cb => parseInt(cb.value));
  
  showCustomConfirmModal(`Permanently delete ${ids.length} notification${ids.length > 1 ? 's' : ''}? This cannot be undone.`, async () => {
    try {
      const res = await fetch('/api/notifications/bulk/permanent', {
        method: 'DELETE',
        headers: { 
          'Content-Type': 'application/json',
          "Authorization": "Bearer " + localStorage.getItem("userToken"),
          "x-user-email": (() => { try { return JSON.parse(localStorage.getItem("currentUser")).email; } catch(e){return "";} })()
        },
        body: JSON.stringify({ ids })
      });
      if(res.ok) {
        await window.loadNotificationsInbox(notifsCurrentPage);
        if (typeof window.fetchUnreadCount === 'function') window.fetchUnreadCount();
      }
    } catch(err) {
      console.error(err);
      alert("Failed to permanently delete notifications.");
    }
  });
};

window.emptyTrash = async function() {
  showCustomConfirmModal("Are you sure you want to permanently delete all items in Trash?", async () => {
    try {
      const res = await fetch('/api/notifications/trash/empty', {
        method: 'DELETE',
        headers: { 
          "Authorization": "Bearer " + localStorage.getItem("userToken"),
          "x-user-email": (() => { try { return JSON.parse(localStorage.getItem("currentUser")).email; } catch(e){return "";} })() 
        }
      });
      if(res.ok) {
        await window.loadNotificationsInbox(notifsCurrentPage);
        if (typeof window.fetchUnreadCount === 'function') window.fetchUnreadCount();
      }
    } catch(err) {
      console.error(err);
      alert("Failed to empty trash.");
    }
  });
};

window.markSelectedAsRead = async function() {
  const checked = document.querySelectorAll('.notif-checkbox:checked');
  if(checked.length === 0) return;
  const ids = Array.from(checked).map(cb => parseInt(cb.value));
  
  try {
    await Promise.all(ids.map(id => fetch(`/api/notifications/${id}/read`, {
      method: 'PATCH',
      headers: { 
        "Authorization": "Bearer " + localStorage.getItem("userToken"),
        "x-user-email": (() => { try { return JSON.parse(localStorage.getItem("currentUser")).email; } catch(e){return "";} })() 
      }
    })));
    await window.loadNotificationsInbox(notifsCurrentPage);
    if (typeof window.fetchUnreadCount === 'function') {
      window.fetchUnreadCount();
    }
  } catch(err) {
    console.error(err);
  }
};

window.markSelectedAsUnread = async function() {
  const checked = document.querySelectorAll('.notif-checkbox:checked');
  if(checked.length === 0) return;
  const ids = Array.from(checked).map(cb => parseInt(cb.value));
  
  try {
    await Promise.all(ids.map(id => fetch(`/api/notifications/${id}/unread`, {
      method: 'PATCH',
      headers: { 
        "Authorization": "Bearer " + localStorage.getItem("userToken"),
        "x-user-email": (() => { try { return JSON.parse(localStorage.getItem("currentUser")).email; } catch(e){return "";} })() 
      }
    })));
    await window.loadNotificationsInbox(notifsCurrentPage);
    if (typeof window.fetchUnreadCount === 'function') {
      window.fetchUnreadCount();
    }
  } catch(err) {
    console.error(err);
  }
};

window.deleteSingleNotification = async function(id) {
  try {
    const res = await fetch(`/api/notifications/${id}`, {
      method: 'DELETE',
      headers: { 
        "Authorization": "Bearer " + localStorage.getItem("userToken"),
        "x-user-email": (() => { try { return JSON.parse(localStorage.getItem("currentUser")).email; } catch(e){return "";} })() 
      }
    });
    if(res.ok) {
      await window.loadNotificationsInbox(notifsCurrentPage);
      if (typeof window.fetchUnreadCount === 'function') {
        window.fetchUnreadCount();
      }
    }
  } catch(err) {
    console.error(err);
    alert("Failed to delete notification.");
  }
};

window.markSingleNotificationRead = async function(id) {
  let currentUserStr = localStorage.getItem("currentUser");
  const email = currentUserStr ? JSON.parse(currentUserStr).email : null;
  if(!email) return;
  try {
    await fetch(`/api/notifications/${id}/read`, {
      method: 'PATCH',
      headers: { "Authorization": "Bearer " + localStorage.getItem("userToken"), "x-user-email": (() => { try { return JSON.parse(localStorage.getItem("currentUser")).email; } catch(e){return "";} })() }
    });
    await window.loadNotificationsInbox(notifsCurrentPage);
    if (typeof window.fetchUnreadCount === 'function') {
      window.fetchUnreadCount();
    }
  } catch(e) {
    console.error(e);
  }
};

window.markAllNotificationsRead = async function () {
  let currentUserStr = localStorage.getItem("currentUser");
  const email = currentUserStr ? JSON.parse(currentUserStr).email : null;
  if(!email) return;
  try {
    await fetch(`/api/notifications/read-all`, {
      method: 'PATCH',
      headers: { "Authorization": "Bearer " + localStorage.getItem("userToken"), "x-user-email": (() => { try { return JSON.parse(localStorage.getItem("currentUser")).email; } catch(e){return "";} })() }
    });
    await window.loadNotificationsInbox(notifsCurrentPage);
    if (typeof window.fetchUnreadCount === 'function') {
      window.fetchUnreadCount();
    }
  } catch(e) {
    console.error(e);
  }
};

document.addEventListener("DOMContentLoaded", () => {
  // Wait for profile info if loading
  let currentUserStr = localStorage.getItem("currentUser");
  if(currentUserStr) {
    let user = JSON.parse(currentUserStr);
    const profileName = document.getElementById("profile-name");
    const profileEmail = document.getElementById("profile-email");
    const profileInitial = document.getElementById("profile-initial");
    if(profileName) profileName.textContent = user.name || user.username || "User";
    if(profileEmail) profileEmail.textContent = user.email || "";
    if(profileInitial && user.name) profileInitial.textContent = user.name.charAt(0).toUpperCase();
  }

  const prevBtn = document.getElementById('btn-prev-notifs');
  const nextBtn = document.getElementById('btn-next-notifs');
  
  if(prevBtn) {
    prevBtn.addEventListener('click', () => {
      if(notifsCurrentPage > 1) {
        notifsCurrentPage--;
        window.loadNotificationsInbox(notifsCurrentPage);
      }
    });
  }
  
  if(nextBtn) {
    nextBtn.addEventListener('click', () => {
      if(notifsHasMore) {
        notifsCurrentPage++;
        window.loadNotificationsInbox(notifsCurrentPage);
      }
    });
  }

  // Category Tabs
  const notifTabs = document.querySelectorAll('.notif-tab-btn');
  const trashTabBtn = document.getElementById('notif-trash-tab-btn');

  notifTabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
      notifTabs.forEach(t => t.classList.remove('active'));
      if(trashTabBtn) trashTabBtn.classList.remove('active-tab');
      
      let target = e.target;
      while (target && !target.classList.contains('notif-tab-btn')) {
        target = target.parentElement;
      }
      if(target) target.classList.add('active');
      
      notifsCategory = target ? target.getAttribute('data-category') : 'All';
      notifsCurrentPage = 1;
      window.loadNotificationsInbox(1);
    });
  });

  if (trashTabBtn) {
    trashTabBtn.addEventListener('click', (e) => {
      notifTabs.forEach(t => t.classList.remove('active'));
      
      let target = e.target;
      while (target && target.id !== 'notif-trash-tab-btn') {
        target = target.parentElement;
      }
      if(target) target.classList.add('active-tab');
      
      notifsCategory = 'Trash';
      notifsCurrentPage = 1;
      window.loadNotificationsInbox(1);
    });
  }

  const delSelectedBtn = document.getElementById('btn-delete-selected-notifs');
  if(delSelectedBtn) {
    delSelectedBtn.addEventListener('click', window.deleteSelectedNotifications);
  }

  // Toolbar buttons
  const moreOptionsBtn = document.getElementById('notif-more-options-btn');
  const moreDropdown = document.getElementById('notif-more-dropdown');
  const selectOptionsBtn = document.getElementById('notif-select-options-btn');
  const selectDropdown = document.getElementById('notif-select-dropdown');

  if (moreOptionsBtn && moreDropdown) {
    moreOptionsBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if(selectDropdown) selectDropdown.style.display = 'none';
      moreDropdown.style.display = moreDropdown.style.display === 'none' ? 'block' : 'none';
    });
  }

  if (selectOptionsBtn && selectDropdown) {
    selectOptionsBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if(moreDropdown) moreDropdown.style.display = 'none';
      selectDropdown.style.display = selectDropdown.style.display === 'none' ? 'block' : 'none';
    });
  }

  document.addEventListener('click', () => {
    if(moreDropdown) moreDropdown.style.display = 'none';
    if(selectDropdown) selectDropdown.style.display = 'none';
  });

  const refreshBtn = document.getElementById('notif-refresh-btn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      notifsCurrentPage = 1;
      window.loadNotificationsInbox(1);
    });
  }
  
  const delSelectedBtn2 = document.getElementById('notif-delete-selected-btn');
  if(delSelectedBtn2) {
    delSelectedBtn2.addEventListener('click', window.deleteSelectedNotifications);
  }

  const restoreSelectedBtn = document.getElementById('notif-restore-selected-btn');
  if(restoreSelectedBtn) {
    restoreSelectedBtn.addEventListener('click', window.restoreSelectedNotifications);
  }

  const permDelSelectedBtn = document.getElementById('notif-permanent-delete-selected-btn');
  if(permDelSelectedBtn) {
    permDelSelectedBtn.addEventListener('click', window.permanentDeleteSelectedNotifications);
  }

  const emptyTrashBtn = document.getElementById('notif-empty-trash-btn');
  if(emptyTrashBtn) {
    emptyTrashBtn.addEventListener('click', window.emptyTrash);
  }

  const moveToTrashDropdownBtn = document.getElementById('notif-move-to-trash-btn');
  if(moveToTrashDropdownBtn) {
    moveToTrashDropdownBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if(selectDropdown) selectDropdown.style.display = 'none';
      window.moveSelectedToTrash();
    });
  }

  const restoreDropdownBtn = document.getElementById('notif-restore-dropdown-btn');
  if(restoreDropdownBtn) {
    restoreDropdownBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if(selectDropdown) selectDropdown.style.display = 'none';
      window.restoreSelectedNotifications();
    });
  }

  const markReadSelectedBtn = document.getElementById('notif-mark-read-selected-btn');
  if(markReadSelectedBtn) {
    markReadSelectedBtn.addEventListener('click', window.markSelectedAsRead);
  }
  
  const markUnreadSelectedBtn = document.getElementById('notif-mark-unread-selected-btn');
  if(markUnreadSelectedBtn) {
    markUnreadSelectedBtn.addEventListener('click', window.markSelectedAsUnread);
  }

  const markAllReadBtn = document.getElementById('notif-mark-all-read-btn');
  if (markAllReadBtn) {
    markAllReadBtn.addEventListener('click', window.markAllNotificationsRead);
  }

  // Preview buttons
  const previewBackBtn = document.getElementById('notif-preview-back-btn');
  if (previewBackBtn) previewBackBtn.addEventListener('click', window.closeNotificationPreview);
  
  const previewDeleteBtn = document.getElementById('notif-preview-delete-btn');
  if (previewDeleteBtn) {
    previewDeleteBtn.addEventListener('click', () => {
      if (currentPreviewNotifId) {
        window.deleteSingleNotification(currentPreviewNotifId);
      }
    });
  }
  
  const previewUnreadBtn = document.getElementById('notif-preview-unread-btn');
  if (previewUnreadBtn) {
    previewUnreadBtn.addEventListener('click', async () => {
      if (currentPreviewNotifId) {
        try {
          await fetch(`/api/notifications/${currentPreviewNotifId}/unread`, {
            method: 'PATCH',
            headers: { "Authorization": "Bearer " + localStorage.getItem("userToken"), "x-user-email": (() => { try { return JSON.parse(localStorage.getItem("currentUser")).email; } catch(e){return "";} })() }
          });
          window.closeNotificationPreview();
        } catch (e) {}
      }
    });
  }

  // Notification mute toggle in 3-dot toolbar menu
  function updateMuteMenuUI(isMuted) {
    const icon = document.getElementById('notif-mute-menu-icon');
    const text = document.getElementById('notif-mute-menu-text');
    if (icon) {
      icon.className = isMuted ? 'fa-solid fa-bell' : 'fa-solid fa-bell-slash';
    }
    if (text) {
      text.textContent = isMuted ? 'Turn on notifications' : 'Turn off notifications';
    }
  }

  window.toggleNotificationMute = function() {
    const isMuted = localStorage.getItem('notif-muted') === 'true';
    if (isMuted) {
      localStorage.removeItem('notif-muted');
      updateMuteMenuUI(false);
      if (typeof window.fetchUnreadCount === 'function') window.fetchUnreadCount();
      if (typeof showAccountToast === 'function') showAccountToast('Notifications turned on', 'success');
    } else {
      localStorage.setItem('notif-muted', 'true');
      updateMuteMenuUI(true);
      const badge = document.getElementById('notifications-badge');
      if (badge) badge.style.display = 'none';
      if (typeof showAccountToast === 'function') showAccountToast('Notifications turned off', 'info');
    }
    const moreDropdown = document.getElementById('notif-more-dropdown');
    if (moreDropdown) moreDropdown.style.display = 'none';
  };

  // Init toggle state from localStorage
  updateMuteMenuUI(localStorage.getItem('notif-muted') === 'true');
});
