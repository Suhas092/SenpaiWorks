const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');

// Cloudinary config
cloudinary.config({ 
  cloud_name: 'dmzchsqms',  
  api_key: '192434742153546',  
  api_secret: 'aS1AyBcUe-Q7Jd8cNVP-IY2m2QE'  
});

// Your local assets folder
const folderPath = 'D:/Projects/SenpaiWorks/assets cloudinary';

// Recursive function to get all files
function getFiles(dir) {
  let files = [];
  fs.readdirSync(dir).forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.lstatSync(fullPath).isDirectory()) {
      files = files.concat(getFiles(fullPath));
    } else {
      files.push(fullPath);
    }
  });
  return files;
}

const files = getFiles(folderPath);

files.forEach(file => {
  const relativePath = path.relative(folderPath, file);
  cloudinary.uploader.upload(file, { folder: 'senpai_assets/' + path.dirname(relativePath) })
    .then(result => console.log(result.secure_url))
    .catch(err => console.error(err));
});
