const fs = require('fs');

function patchFile(filepath) {
  let content = fs.readFileSync(filepath, 'utf8');
  
  // Replace { "Authorization": "Bearer " + localStorage.getItem("userToken") }
  // With { "Authorization": "Bearer " + localStorage.getItem("userToken"), "x-user-email": (() => { try { return JSON.parse(localStorage.getItem("currentUser")).email; } catch(e){return "";} })() }
  
  const target = '{ "Authorization": "Bearer " + localStorage.getItem("userToken") }';
  const replacement = '{ "Authorization": "Bearer " + localStorage.getItem("userToken"), "x-user-email": (() => { try { return JSON.parse(localStorage.getItem("currentUser")).email; } catch(e){return "";} })() }';
  
  content = content.split(target).join(replacement);
  
  // And for the one with Content-Type:
  const target2 = '{ "Authorization": "Bearer " + localStorage.getItem("userToken"), "Content-Type": "application/json" }';
  const replacement2 = '{ "Authorization": "Bearer " + localStorage.getItem("userToken"), "x-user-email": (() => { try { return JSON.parse(localStorage.getItem("currentUser")).email; } catch(e){return "";} })(), "Content-Type": "application/json" }';
  
  content = content.split(target2).join(replacement2);
  
  fs.writeFileSync(filepath, content);
}

patchFile('d:/Projects/SenpaiWorks/scripts/header.js');
patchFile('d:/Projects/SenpaiWorks/scripts/profile.js');
console.log('Patched headers successfully.');
