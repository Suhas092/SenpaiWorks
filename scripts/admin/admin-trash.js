/**
 * SenpaiWorks Admin Console - Trash & Recovery Module
 * scripts/admin/admin-trash.js
 */

'use strict';

window.loadAdminTrash = async function () {
  const container = document.getElementById('trash-list-container');
  if (!container) return;

  container.innerHTML = `
    <div style="padding: 40px; text-align: center; color: var(--text-muted, #94a3b8);">
      <i class="fa-solid fa-spinner fa-spin fa-2x"></i>
      <p style="margin-top: 12px; font-weight: 600;">Loading trashed items...</p>
    </div>
  `;

  try {
    const res = await fetch('/api/admin/trash', {
      headers: window.getAdminTokenHeaders ? window.getAdminTokenHeaders() : {}
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const items = data.items || [];

    if (items.length === 0) {
      container.innerHTML = `
        <div style="padding: 60px 20px; text-align: center; background: var(--bg-card, #1e293b); border: 1px dashed var(--border-color, rgba(255,255,255,0.1)); border-radius: 16px;">
          <i class="fa-solid fa-recycle" style="font-size: 3rem; color: #10b981; margin-bottom: 16px;"></i>
          <h3 style="margin: 0; font-size: 1.25rem; font-weight: 800; color: var(--text-main, #f8fafc);">Trash is Empty</h3>
          <p style="margin: 8px 0 0; color: var(--text-muted, #94a3b8); font-size: 0.9rem;">
            No items are currently in the 14-day recovery grace period. When an artwork, article, or slide is deleted, it will appear here.
          </p>
        </div>
      `;
      return;
    }

    let html = `
      <div style="margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center;">
        <span style="font-weight: 700; color: var(--text-muted, #94a3b8); font-size: 0.9rem;">
          ${items.length} item${items.length === 1 ? '' : 's'} in recovery queue
        </span>
      </div>
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 20px;">
    `;

    items.forEach(item => {
      const typeBadges = {
        artwork: '<span style="background: rgba(59, 130, 246, 0.2); color: #60a5fa; padding: 3px 8px; border-radius: 6px; font-size: 0.75rem; font-weight: 700;">Artwork</span>',
        news: '<span style="background: rgba(168, 85, 247, 0.2); color: #c084fc; padding: 3px 8px; border-radius: 6px; font-size: 0.75rem; font-weight: 700;">News Article</span>',
        hero: '<span style="background: rgba(234, 179, 8, 0.2); color: #facc15; padding: 3px 8px; border-radius: 6px; font-size: 0.75rem; font-weight: 700;">Hero Slide</span>',
        showcase: '<span style="background: rgba(236, 72, 153, 0.2); color: #f472b6; padding: 3px 8px; border-radius: 6px; font-size: 0.75rem; font-weight: 700;">Showcase</span>'
      };

      const daysColor = item.daysRemaining <= 3 ? '#ef4444' : (item.daysRemaining <= 7 ? '#f59e0b' : '#10b981');
      const deletedDateStr = new Date(item.deletedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

      html += `
        <div class="trash-card" style="background: var(--bg-card, #1e293b); border: 1px solid var(--border-color, rgba(255,255,255,0.1)); border-radius: 14px; overflow: hidden; display: flex; flex-direction: column;">
          <div style="position: relative; width: 100%; height: 160px; background: #0f172a; overflow: hidden; display: flex; align-items: center; justify-content: center;">
            ${item.img && !item.img.endsWith('.mp4')
              ? `<img src="${window.escapeHtml(item.img)}" alt="${window.escapeHtml(item.title)}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                 <div style="display: none; width: 100%; height: 100%; align-items: center; justify-content: center; background: #0f172a; color: var(--text-muted, #64748b); flex-direction: column; gap: 6px;">
                   <i class="fa-regular fa-image fa-2x"></i>
                   <span style="font-size: 0.75rem; font-weight: 600;">Image Preview Unavailable</span>
                 </div>`
              : `<div style="color: var(--text-muted, #64748b); text-align: center;"><i class="fa-solid fa-film fa-2x"></i><p style="margin: 4px 0 0; font-size: 0.75rem;">Video Asset</p></div>`
            }
            <div style="position: absolute; top: 10px; left: 10px;">
              ${typeBadges[item.type] || ''}
            </div>
            <div style="position: absolute; top: 10px; right: 10px; background: rgba(0,0,0,0.7); backdrop-filter: blur(4px); padding: 4px 8px; border-radius: 6px; font-size: 0.75rem; font-weight: 800; color: ${daysColor};">
              <i class="fa-regular fa-clock"></i> ${item.daysRemaining}d left
            </div>
          </div>

          <div style="padding: 16px; flex: 1; display: flex; flex-direction: column; justify-content: space-between;">
            <div>
              <h4 style="margin: 0 0 6px; font-size: 1rem; font-weight: 700; color: var(--text-main, #f8fafc); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${window.escapeHtml(item.title)}">
                ${window.escapeHtml(item.title)}
              </h4>
              <p style="margin: 0; font-size: 0.8rem; color: var(--text-muted, #94a3b8);">
                Deleted on ${deletedDateStr}
              </p>
            </div>

            <div style="margin-top: 16px; display: flex; gap: 8px;">
              <button type="button" onclick="window.restoreTrashItem('${item.type}', '${item.id}')"
                style="flex: 1; padding: 8px 12px; background: #10b981; color: #fff; border: none; border-radius: 8px; font-weight: 700; font-size: 0.85rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; transition: opacity 0.2s;">
                <i class="fa-solid fa-arrow-rotate-left"></i> Restore
              </button>
              <button type="button" onclick="window.purgeTrashItem('${item.type}', '${item.id}')"
                style="padding: 8px 12px; background: rgba(239, 68, 68, 0.15); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 8px; font-weight: 700; font-size: 0.85rem; cursor: pointer; transition: background 0.2s;" title="Permanently Purge Now">
                <i class="fa-solid fa-trash"></i>
              </button>
            </div>
          </div>
        </div>
      `;
    });

    html += `</div>`;
    container.innerHTML = html;
  } catch (err) {
    console.error('Error loading trash:', err);
    container.innerHTML = `
      <div style="padding: 30px; text-align: center; color: #ef4444;">
        <i class="fa-solid fa-circle-exclamation fa-2x"></i>
        <p style="margin-top: 8px; font-weight: 700;">Failed to load trash list. Please try again.</p>
      </div>
    `;
  }
};

window.restoreTrashItem = async function (type, id) {
  let confirmed = false;
  if (typeof window.showAdminConfirm === 'function') {
    confirmed = await window.showAdminConfirm(
      'Restore Item',
      `Are you sure you want to restore this ${type} back to the live site?`,
      'Restore Now',
      'success'
    );
  } else {
    confirmed = confirm(`Restore this ${type} back to the live site?`);
  }
  if (!confirmed) return;

  try {
    const res = await fetch('/api/admin/trash/restore', {
      method: 'POST',
      headers: {
        ...(window.getAdminTokenHeaders ? window.getAdminTokenHeaders() : {}),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ type, id })
    });

    const data = await res.json();
    if (res.ok && data.success) {
      if (window.showAdminToast) window.showAdminToast('Item restored successfully to live site!', 'success');
      window.loadAdminTrash();
      // Also refresh the relevant main tab lists if initialized
      if (type === 'artwork' && window.loadArtworks) window.loadArtworks();
      if (type === 'news' && window.loadAdminNews) window.loadAdminNews();
    } else {
      if (window.showAdminToast) window.showAdminToast(data.error || 'Failed to restore item.', 'danger');
      else alert(data.error || 'Failed to restore item.');
    }
  } catch (err) {
    console.error('Restore error:', err);
    if (window.showAdminToast) window.showAdminToast('Network error while restoring item.', 'danger');
    else alert('Network error while restoring item.');
  }
};

window.purgeTrashItem = async function (type, id) {
  let confirmed = false;
  if (typeof window.showAdminConfirm === 'function') {
    confirmed = await window.showAdminConfirm(
      'Permanently Purge Item',
      `WARNING: This will permanently delete this ${type} and purge its image from Cloudflare R2 immediately. This action cannot be undone.`,
      'Purge Permanently',
      'danger'
    );
  } else {
    confirmed = confirm(`WARNING: Permanently delete this ${type}? This will immediately purge the file from Cloudflare R2 and cannot be undone.`);
  }
  if (!confirmed) return;

  try {
    const res = await fetch('/api/admin/trash/purge', {
      method: 'DELETE',
      headers: {
        ...(window.getAdminTokenHeaders ? window.getAdminTokenHeaders() : {}),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ type, id })
    });

    const data = await res.json();
    if (res.ok && data.success) {
      if (window.showAdminToast) window.showAdminToast('Item permanently deleted from database and R2.', 'info');
      window.loadAdminTrash();
    } else {
      if (window.showAdminToast) window.showAdminToast(data.error || 'Failed to purge item.', 'danger');
      else alert(data.error || 'Failed to purge item.');
    }
  } catch (err) {
    console.error('Purge error:', err);
    if (window.showAdminToast) window.showAdminToast('Network error while purging item.', 'danger');
    else alert('Network error while purging item.');
  }
};

// Hook into Refresh button and tab initialization
document.addEventListener('DOMContentLoaded', () => {
  const refreshBtn = document.getElementById('btn-refresh-trash');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => window.loadAdminTrash());
  }
});
