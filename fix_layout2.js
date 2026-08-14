const fs = require('fs');
let content = fs.readFileSync('d:/Projects/SenpaiWorks/admin.html', 'utf8');

// 1. Sidebar link
content = content.replace(
  /\s*<a href="#" class="sidebar-link" data-tab="tab-account">/,
  \n        <a href="#" class="sidebar-link" data-tab="tab-notifications">\n          <i class="fa-solid fa-bell"></i>\n          <span>Notifications</span>\n        </a>\n        <a href="#" class="sidebar-link" data-tab="tab-account">
);

// 2 & 3. Move and change to section
// First extract the block
const startMatch = content.match(/<!-- 12\. NOTIFICATIONS TAB -->/);
if (startMatch) {
  const startIdx = startMatch.index;
  // find the end of the main tag
  const mainEndIdx = content.indexOf('</main>', startIdx);
  // find the end of the tab-notifications div
  const blockRegex = /<!-- 12\. NOTIFICATIONS TAB -->[\s\S]*?<div class="inner-tab-content" id="notif-triggers" style="display: none;">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/;
  let blockMatch = content.match(blockRegex);
  
  if (blockMatch) {
    let blockStr = blockMatch[0];
    // remove it from current location
    content = content.replace(blockStr, '');
    
    // change div to section
    blockStr = blockStr.replace(/<div class="admin-tab-content" id="tab-notifications" style="display: none;">/, '<section class="admin-subpage" id="tab-notifications">');
    // change closing div to section
    blockStr = blockStr.replace(/<\/div>$/, '</section>');
    
    // insert inside pane-content-wrapper (before its closing div, which is just before the old block location)
    // find where pane-content-wrapper ends: it is the last </div> before </main>
    content = content.replace(/(\s*<\/div>\s*<\/main>)/, \n\n       + blockStr + $1);
  }
}

// 4. Fix tab-header-flex
content = content.replace(
  /<div class="tab-header-flex">/,
  <div class="subpage-controls" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
);

// 5. Fix inner tabs
content = content.replace(
  /<button class="inner-tab active"/,
  <button class="inner-tab-btn active"
);
content = content.replace(
  /<button class="inner-tab" data-target="notif-triggers">/,
  <button class="inner-tab-btn" data-target="notif-triggers">
);

// 6. Wrap history table in admin-card
content = content.replace(
  /<div class="table-container">/,
  <div class="admin-card list-card">\n            <h2 style="margin-bottom:16px;"><i class="fa-solid fa-clock-rotate-left"></i> Broadcast History</h2>\n            <div class="table-responsive">
);
content = content.replace(
  /<\/table>\s*<\/div>\s*<\/div>/,
  </table>\n            </div>\n          </div>\n        </div>
);

// 7. Wrap triggers in admin-card
content = content.replace(
  /<div class="card-base" style="max-width: 600px;">/,
  <div class="admin-card list-card" style="max-width: 600px;">
);

fs.writeFileSync('d:/Projects/SenpaiWorks/admin.html', content);
console.log('Layout fixed successfully');
