const fs = require('fs');

let content = fs.readFileSync('d:/Projects/SenpaiWorks/admin.html', 'utf8');

// 1. Move tab-notifications inside pane-content-wrapper
// Find the closing div of pane-content-wrapper, which is just before <!-- 12. NOTIFICATIONS TAB -->
content = content.replace(
  /\s*<\/div>\s*<!-- 12\. NOTIFICATIONS TAB -->\s*<section class="admin-subpage" id="tab-notifications">/,
  \n\n        <!-- 12. NOTIFICATIONS TAB -->\n        <section class="admin-subpage" id="tab-notifications">
);

// Close pane-content-wrapper AFTER tab-notifications
content = content.replace(
  /(\s*<\/section>\s*)<\/main>/,
  $1</div>\n    </main>
);

// 2. Fix tab-header-flex
content = content.replace(
  /<div class="tab-header-flex">/,
  <div class="subpage-controls" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
);

// 3. Fix inner tabs
content = content.replace(
  /<button class="inner-tab active"/,
  <button class="inner-tab-btn active"
);
content = content.replace(
  /<button class="inner-tab" data-target="notif-triggers">/,
  <button class="inner-tab-btn" data-target="notif-triggers">
);

// 4. Wrap history table in admin-card list-card
content = content.replace(
  /<div class="table-container">/,
  <div class="admin-card list-card">\n            <h2><i class="fa-solid fa-list-ul"></i> Broadcast History</h2>\n            <div class="table-responsive">
);
content = content.replace(
  /<\/table>\s*<\/div>\s*<\/div>/,
  </table>\n            </div>\n          </div>\n        </div>
);

// 5. Wrap triggers in admin-card list-card
content = content.replace(
  /<div class="card-base" style="max-width: 600px;">/,
  <div class="admin-card list-card" style="max-width: 600px;">
);

fs.writeFileSync('d:/Projects/SenpaiWorks/admin.html', content);
