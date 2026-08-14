const fs = require('fs');

function replaceHeaders(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace(/headers:\s*\{\s*"x-user-email":\s*email\s*\}/g, 'headers: { "Authorization": "Bearer " + localStorage.getItem("userToken") }');
  content = content.replace(/headers:\s*\{\s*"x-user-email":\s*email,\s*"Content-Type":\s*"application\/json"\s*\}/g, 'headers: { "Authorization": "Bearer " + localStorage.getItem("userToken"), "Content-Type": "application/json" }');
  fs.writeFileSync(filePath, content);
}

replaceHeaders('scripts/header.js');
replaceHeaders('scripts/profile.js');
