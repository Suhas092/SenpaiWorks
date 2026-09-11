/**
 * SenpaiWorks Admin Console - Notifications & Broadcasts Module
 * scripts/admin/admin-notifications.js
 */

window.loadAdminNotifications = async function () {
  await Promise.all([loadBroadcastHistory(), loadNotificationTriggers(), window.loadAdminAlerts()]);
};

window.loadAdminAlerts = async function () {
  const badge = document.getElementById('admin-notif-badge');
  const list = document.getElementById('admin-notif-list');
  if (!badge && !list) return;

  try {
    const res = await fetch('/api/admin/alerts', {
      headers: window.getAdminTokenHeaders()
    });
    if (window.handleAdminResponse) window.handleAdminResponse(res);
    if (!res.ok) return;
    const data = await res.json();
    const alerts = data.alerts || [];
    const unreadCount = data.unreadCount || 0;

    if (badge) {
      if (unreadCount > 0) {
        badge.innerText = unreadCount > 99 ? '99+' : unreadCount;
        badge.style.display = 'inline-block';
      } else {
        badge.style.display = 'none';
      }
    }

    if (list) {
      if (alerts.length === 0) {
        list.innerHTML = '<div style="padding: 24px; text-align: center; color: #64748b; font-size: 0.85rem;">No alerts right now.</div>';
      } else {
        list.innerHTML = alerts.map(a => {
          const isOrder = a.type === 'order_created';
          const isReplace = a.type === 'replacement_requested';
          const icon = a.icon || (isOrder ? '📦' : isReplace ? '🔄' : '🔔');
          const bg = !a.isRead ? 'rgba(59, 130, 246, 0.08)' : 'transparent';
          const targetTab = isOrder ? 'tab-orders' : isReplace ? 'tab-replacements' : 'tab-notifications';
          const timeAgo = formatTimeAgo(new Date(a.createdAt));

          return `
            <div class="admin-notif-item" onclick="window.handleAdminAlertClick(${a.id}, '${targetTab}')" style="padding: 10px 16px; border-bottom: 1px solid var(--border-color, rgba(255,255,255,0.05)); cursor: pointer; background: ${bg}; transition: background 0.2s ease;">
              <div style="display: flex; gap: 10px; align-items: flex-start;">
                <span style="font-size: 1.2rem;">${icon}</span>
                <div style="flex: 1; min-width: 0;">
                  <div style="display: flex; justify-content: space-between; align-items: baseline;">
                    <strong style="font-size: 0.83rem; color: var(--text-main, #f8fafc); font-weight: 700;">${window.escapeHtml(a.title)}</strong>
                    <span style="font-size: 0.7rem; color: #94a3b8;">${timeAgo}</span>
                  </div>
                  <p style="margin: 2px 0 0; font-size: 0.78rem; color: var(--text-muted, #94a3b8); line-height: 1.35;">${window.escapeHtml(a.message)}</p>
                </div>
              </div>
            </div>
          `;
        }).join('');
      }
    }
  } catch (e) {
    console.error('Failed to load admin alerts', e);
  }
};

window.handleAdminAlertClick = async function (id, targetTab) {
  try {
    await fetch(`/api/admin/alerts/${id}/read`, {
      method: 'PATCH',
      headers: window.getAdminTokenHeaders()
    });
    window.loadAdminAlerts();
  } catch (e) {}

  const dropdown = document.getElementById('admin-notif-dropdown');
  if (dropdown) dropdown.style.display = 'none';

  if (targetTab && typeof window.switchAdminTab === 'function') {
    window.switchAdminTab(targetTab);
  }
};

function formatTimeAgo(date) {
  const seconds = Math.floor((new Date() - date) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

async function loadBroadcastHistory() {
  try {
    const res = await fetch('/api/admin/notifications/history', {
      headers: window.getAdminTokenHeaders()
    });
    if (window.handleAdminResponse) window.handleAdminResponse(res);
    if (!res.ok) return;
    const data = await res.json();
    const tbody = document.getElementById('broadcast-history-table');
    if (!tbody) return;
    
    const countEl = document.getElementById('stat-total-broadcasts');
    if (countEl) countEl.innerText = (data.history || []).length;
    
    let html = '';
    if (!data.history || data.history.length === 0) {
      html = '<tr><td colspan="7" style="text-align: center; color: #64748b; padding: 24px;">No broadcasts found.</td></tr>';
    } else {
      data.history.forEach(b => {
        let statusColor = '#94a3b8';
        if (b.status === 'sent') statusColor = '#22c55e';
        if (b.status === 'scheduled') statusColor = '#3b82f6';
        if (b.status === 'cancelled') statusColor = '#ef4444';
        
        const dateStr = new Date(b.sendAt).toLocaleString();
        
        let cancelBtn = b.status === 'scheduled' 
          ? `<button onclick="window.cancelBroadcast(${b.id})" class="btn-cancel-broadcast">Cancel</button>` 
          : '';

        html += `
          <tr>
            <td style="font-weight: 600;">${window.escapeHtml(b.title)}</td>
            <td><span class="badge badge-type">${window.escapeHtml(b.category || 'Studio')}</span></td>
            <td><span class="badge-audience">${window.escapeHtml(b.audience)}</span></td>
            <td style="white-space:nowrap; font-size: 0.85rem;">${dateStr}</td>
            <td><span style="color: ${statusColor}; font-weight: 700; font-size: 0.8rem; text-transform: uppercase;">${b.status}</span></td>
            <td style="font-size: 0.85rem; color: #94a3b8;">${b.readCount || 0} / ${b.totalCount || 0}</td>
            <td>${cancelBtn}</td>
          </tr>
        `;
      });
    }
    tbody.innerHTML = html;
  } catch (e) {
    console.error('Failed to load broadcast history', e);
  }
}

async function loadNotificationTriggers() {
  try {
    const res = await fetch('/api/admin/notifications/triggers', {
      headers: window.getAdminTokenHeaders()
    });
    if (window.handleAdminResponse) window.handleAdminResponse(res);
    if (!res.ok) return;
    const data = await res.json();
    const list = document.getElementById('triggers-list');
    if (!list) return;

    const availableTriggers = [
      { type: 'order_update', title: 'Order Status Update', desc: 'Fires when an admin changes an order status.' },
      { type: 'order_delivered', title: 'Order Delivered', desc: 'Fires when an order is marked as delivered.' },
      { type: 'post_reply', title: 'Post/Comment Reply', desc: 'Fires when someone replies to a user\'s post.' },
      { type: 'new_offer', title: 'New Promo Code/Offer', desc: 'Fires globally when a new coupon is published.' },
      { type: 'sale', title: 'Flash Sale Activated', desc: 'Fires globally when a sale event starts.' },
      { type: 'new_article', title: 'New News Article', desc: 'Fires globally when an article is published.' },
      { type: 'new_course', title: 'New Course Added', desc: 'Fires globally when a new course is added.' },
      { type: 'new_product', title: 'New Product Added', desc: 'Fires globally when a new product is added.' },
      { type: 'wishlist_restock', title: 'Wishlist Restock', desc: 'Fires to specific users when a wishlisted item restocks.' },
      { type: 'support_reply', title: 'Support Ticket Reply', desc: 'Fires when an admin replies to a support ticket.' }
    ];

    let activeCount = 0;
    
    let html = '';
    availableTriggers.forEach(t => {
      const dbTrigger = (data.triggers || []).find(dt => dt.type === t.type);
      const isEnabled = dbTrigger ? dbTrigger.enabled : true;
      if (isEnabled) activeCount++;
      
      html += `
        <div class="trigger-toggle-row">
          <div>
            <div class="trigger-title-text">${t.title} <span class="trigger-type-slug">(${t.type})</span></div>
            <div class="trigger-desc-text">${t.desc}</div>
          </div>
          <label class="switch">
            <input type="checkbox" onchange="window.toggleAutoTrigger('${t.type}', this.checked)" ${isEnabled ? 'checked' : ''}>
            <span class="slider round"></span>
          </label>
        </div>
      `;
    });
    
    list.innerHTML = html;
    const activeStatEl = document.getElementById('stat-active-triggers');
    if (activeStatEl) activeStatEl.innerText = `${activeCount} / ${availableTriggers.length}`;
  } catch (e) {
    console.error('Failed to load triggers', e);
  }
}

window.toggleAutoTrigger = async function (type, enabled) {
  try {
    await fetch(`/api/admin/notifications/triggers/${type}`, {
      method: 'PATCH',
      headers: window.getAdminTokenHeaders(),
      body: JSON.stringify({ enabled })
    });
    loadNotificationTriggers();
    window.showAdminToast(`Trigger '${type}' ${enabled ? 'enabled' : 'disabled'}`, 'success');
  } catch (e) {
    window.showAdminToast('Failed to update trigger', 'danger');
  }
};

window.openComposeBroadcastModal = function () {
  const modal = document.getElementById('compose-broadcast-modal');
  const form = document.getElementById('form-compose-broadcast');
  if (modal) modal.style.display = 'flex';
  if (form) form.reset();
  const emailGrp = document.getElementById('broadcast-email-group');
  const schedGrp = document.getElementById('broadcast-schedule-group');
  if (emailGrp) emailGrp.style.display = 'none';
  if (schedGrp) schedGrp.style.display = 'none';
};

window.closeComposeBroadcastModal = function () {
  const modal = document.getElementById('compose-broadcast-modal');
  if (modal) modal.style.display = 'none';
};

window.cancelBroadcast = async function (id) {
  const confirmed = await window.showAdminConfirm(
    "Cancel Broadcast",
    "Are you sure you want to cancel this scheduled broadcast?",
    "Cancel Broadcast",
    "danger"
  );
  if (!confirmed) return;

  try {
    const res = await fetch(`/api/admin/notifications/${id}`, {
      method: 'PATCH',
      headers: window.getAdminTokenHeaders(),
      body: JSON.stringify({ status: 'cancelled' })
    });
    if (res.ok) {
      window.showAdminToast('Broadcast cancelled', 'success');
      loadBroadcastHistory();
    }
  } catch (err) {
    window.showAdminToast('Failed to cancel broadcast', 'danger');
  }
};

// Form listeners setup
document.addEventListener("DOMContentLoaded", () => {
  const bAudience = document.getElementById('broadcast-audience');
  if (bAudience) {
    bAudience.addEventListener('change', function (e) {
      const emailGrp = document.getElementById('broadcast-email-group');
      if (emailGrp) emailGrp.style.display = e.target.value === 'specific' ? 'block' : 'none';
      const bEmail = document.getElementById('broadcast-email');
      if (bEmail) bEmail.required = (e.target.value === 'specific');
    });
  }

  const bForm = document.getElementById('form-compose-broadcast');
  if (bForm) {
    bForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const payload = {
        title: document.getElementById('broadcast-title').value,
        message: document.getElementById('broadcast-message').value,
        icon: document.getElementById('broadcast-icon').value,
        link: document.getElementById('broadcast-link').value,
        audience: document.getElementById('broadcast-audience').value === 'specific' ? document.getElementById('broadcast-email').value : 'all',
        category: document.getElementById('broadcast-category') ? document.getElementById('broadcast-category').value : 'Studio',
      };
      
      const sendType = document.getElementById('broadcast-send-type') ? document.getElementById('broadcast-send-type').value : 'now';
      if (sendType === 'schedule') {
        const sendAt = document.getElementById('broadcast-send-at').value;
        if (!sendAt) return window.showAdminToast('Please provide a schedule date/time', 'danger');
        payload.sendAt = sendAt;
      }
      
      try {
        const res = await fetch('/api/admin/notifications/broadcast', {
          method: 'POST',
          headers: window.getAdminTokenHeaders(),
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (res.ok && data.success) {
          window.showAdminToast('Broadcast created successfully!', 'success');
          window.closeComposeBroadcastModal();
          loadBroadcastHistory();
        } else {
          window.showAdminToast(data.error || 'Failed to create broadcast', 'danger');
        }
      } catch (err) {
        window.showAdminToast('Server error creating broadcast', 'danger');
      }
    });
  }

  // Setup Admin Notification Bell Toggle & Actions
  const bellBtn = document.getElementById('admin-notif-bell');
  const notifDropdown = document.getElementById('admin-notif-dropdown');
  const markReadBtn = document.getElementById('btn-admin-mark-read');

  if (bellBtn && notifDropdown) {
    bellBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isVisible = notifDropdown.style.display === 'block';
      notifDropdown.style.display = isVisible ? 'none' : 'block';
      if (!isVisible && typeof window.loadAdminAlerts === 'function') {
        window.loadAdminAlerts();
      }
    });

    document.addEventListener('click', (e) => {
      if (!notifDropdown.contains(e.target) && e.target !== bellBtn) {
        notifDropdown.style.display = 'none';
      }
    });
  }

  if (markReadBtn) {
    markReadBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      try {
        await fetch('/api/admin/alerts/read-all', {
          method: 'PATCH',
          headers: window.getAdminTokenHeaders()
        });
        window.loadAdminAlerts();
      } catch (e) {}
    });
  }

  // Initial load of admin alert count
  if (typeof window.loadAdminAlerts === 'function') {
    window.loadAdminAlerts();
  }
});
