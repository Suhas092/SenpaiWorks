const fs = require('fs');
let content = fs.readFileSync('d:/Projects/SenpaiWorks/admin.html', 'utf8');

// 1. Sidebar Link
const sidebarTarget =         <a href="#" class="sidebar-link" data-tab="tab-account">;
const sidebarReplace =         <a href="#" class="sidebar-link" data-tab="tab-notifications">
          <i class="fa-solid fa-bell"></i>
          <span>Notifications</span>
        </a>
        <a href="#" class="sidebar-link" data-tab="tab-account">;
content = content.replace(sidebarTarget, sidebarReplace);

// 2. Main Tab Content (Insert inside pane-content-wrapper, before its closing div)
const tabContent = 
        <!-- ========================================== -->
        <!-- SUBPAGE 12: NOTIFICATIONS                  -->
        <!-- ========================================== -->
        <section class="admin-subpage" id="tab-notifications">
          <div class="subpage-controls" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
            <div class="header-titles">
              <h1 class="tab-title">Notifications & Broadcasts</h1>
              <p class="tab-subtitle">Manage automated notification triggers or schedule manual broadcasts.</p>
            </div>
            <button class="action-btn publish-btn" onclick="openComposeBroadcastModal()">
              <i class="fa-solid fa-paper-plane"></i> Compose Broadcast
            </button>
          </div>

          <div class="stats-grid" style="grid-template-columns: 1fr 1fr; margin-bottom: 24px;">
            <div class="stat-card">
              <div class="stat-icon"><i class="fa-solid fa-paper-plane"></i></div>
              <div class="stat-info">
                <h3>Total Broadcasts Sent</h3>
                <p id="stat-total-broadcasts">0</p>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon"><i class="fa-solid fa-bolt"></i></div>
              <div class="stat-info">
                <h3>Active Auto-Triggers</h3>
                <p id="stat-active-triggers">0 / 0</p>
              </div>
            </div>
          </div>

          <div class="inner-tabs" style="margin-bottom: 20px;">
            <button class="inner-tab-btn active" data-target="notif-history">Broadcast History</button>
            <button class="inner-tab-btn" data-target="notif-triggers">Auto-Trigger Settings</button>
          </div>

          <div class="inner-tab-content active" id="notif-history">
            <div class="admin-card list-card">
              <h2 style="margin-bottom: 16px;"><i class="fa-solid fa-clock-rotate-left"></i> Broadcast History</h2>
              <div class="table-responsive">
                <table class="admin-table">
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th>Audience</th>
                      <th>Date</th>
                      <th>Status</th>
                      <th>Read / Total</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody id="broadcast-history-table">
                    <!-- Rendered via JS -->
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div class="inner-tab-content" id="notif-triggers" style="display: none;">
            <div class="admin-card list-card" style="max-width: 600px;">
              <h3 style="margin-bottom: 16px;">Automated Trigger Toggles</h3>
              <p style="font-size: 0.9rem; color: #64748b; margin-bottom: 24px;">Enable or disable system-wide automatic notifications.</p>
              <div id="triggers-list" style="display: flex; flex-direction: column; gap: 16px;">
                <!-- Rendered via JS -->
              </div>
            </div>
          </div>
        </section>
;

// Insert the tab content before the end of pane-content-wrapper
content = content.replace(
  /(\s*<\/div>\s*<\/main>)/,
  tabContent + $1
);

// 3. Compose Broadcast Modal (Insert before EDIT MODAL)
const modalContent = 
  <!-- COMPOSE BROADCAST MODAL -->
  <div id="compose-broadcast-modal" class="edit-modal-overlay" style="display: none;">
    <div class="edit-modal" style="max-width: 500px; width: 92%;">
      <div class="edit-modal-header">
        <h2><i class="fa-solid fa-paper-plane"></i> Compose Broadcast</h2>
        <button class="edit-modal-close" onclick="closeComposeBroadcastModal()">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>
      <form id="form-compose-broadcast" class="admin-form" style="padding: 20px;">
        <div class="form-group">
          <label for="broadcast-title">Notification Title *</label>
          <input type="text" id="broadcast-title" required placeholder="e.g. 50% Off Everything!">
        </div>
        <div class="form-group">
          <label for="broadcast-message">Message Content *</label>
          <textarea id="broadcast-message" required rows="3" placeholder="Enter the notification text..."></textarea>
        </div>
        <div class="form-row-2">
          <div class="form-group">
            <label for="broadcast-icon">Icon (Optional)</label>
            <input type="text" id="broadcast-icon" placeholder="Emoji or fa-icon">
          </div>
          <div class="form-group">
            <label for="broadcast-link">Deep Link (Optional)</label>
            <input type="text" id="broadcast-link" placeholder="/store.html">
          </div>
        </div>
        <div class="form-group">
          <label for="broadcast-audience">Target Audience</label>
          <select id="broadcast-audience" onchange="document.getElementById('broadcast-email-group').style.display = this.value === 'specific' ? 'block' : 'none'">
            <option value="all">All Users</option>
            <option value="specific">Specific User (Email)</option>
          </select>
        </div>
        <div class="form-group" id="broadcast-email-group" style="display: none;">
          <label for="broadcast-email">User Email *</label>
          <input type="email" id="broadcast-email" placeholder="user@example.com">
        </div>
        <div class="form-group">
          <label for="broadcast-send-type">Send Timing</label>
          <select id="broadcast-send-type" onchange="document.getElementById('broadcast-schedule-group').style.display = this.value === 'schedule' ? 'block' : 'none'">
            <option value="now">Send Now</option>
            <option value="schedule">Schedule for Later</option>
          </select>
        </div>
        <div class="form-group" id="broadcast-schedule-group" style="display: none;">
          <label for="broadcast-send-at">Schedule Date & Time *</label>
          <input type="datetime-local" id="broadcast-send-at">
        </div>
        <div class="edit-modal-actions" style="padding: 16px 0 0 0; background: transparent; border: none;">
          <button type="button" class="btn-cancel" onclick="closeComposeBroadcastModal()">Cancel</button>
          <button type="submit" class="admin-submit-btn"><i class="fa-solid fa-paper-plane"></i> Send/Schedule</button>
        </div>
      </form>
    </div>
  </div>
;

content = content.replace(
  /(\s*<!-- EDIT MODAL -->)/,
  modalContent + $1
);

fs.writeFileSync('d:/Projects/SenpaiWorks/admin.html', content);
console.log('Successfully injected notifications tab');
