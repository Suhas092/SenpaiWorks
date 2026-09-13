const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

async function createComposite() {
  const pLogo = path.resolve(__dirname, '../assets/Videos/SenpaiWorks logo.png');
  const pName = path.resolve(__dirname, '../assets/Videos/senpaiworks name logo no bg.png');

  // Let's create a horizontal lockup: Logo on left, Name on right
  // Logo height = 120, width proportional
  const logoResized = await sharp(pLogo)
    .resize({ height: 120, fit: 'inside' })
    .toBuffer();
  const logoMeta = await sharp(logoResized).metadata();

  // Name logo height = 95 (to match visual weight of the spiral mark)
  const nameResized = await sharp(pName)
    .resize({ height: 95, fit: 'inside' })
    .toBuffer();
  const nameMeta = await sharp(nameResized).metadata();

  console.log('Logo resized:', logoMeta.width, 'x', logoMeta.height);
  console.log('Name resized:', nameMeta.width, 'x', nameMeta.height);

  const gap = 20;
  const paddingX = 24;
  const totalWidth = paddingX * 2 + logoMeta.width + gap + nameMeta.width;
  const totalHeight = 160;

  // Background matching razorpay: #000000 black
  const bgBlack = { r: 0, g: 0, b: 0, alpha: 1 };

  const logoY = Math.round((totalHeight - logoMeta.height) / 2);
  const nameY = Math.round((totalHeight - nameMeta.height) / 2);

  const compositeImg = await sharp({
    create: {
      width: totalWidth,
      height: totalHeight,
      channels: 4,
      background: bgBlack
    }
  })
  .composite([
    { input: logoResized, top: logoY, left: paddingX },
    { input: nameResized, top: nameY, left: paddingX + logoMeta.width + gap }
  ])
  .png()
  .toBuffer();

  fs.writeFileSync(path.resolve(__dirname, '../assets/Videos/senpaiworks_razorpay_brand_logo.png'), compositeImg);
  console.log('Saved senpaiworks_razorpay_brand_logo.png:', totalWidth, 'x', totalHeight);

  // Also create a square version for Razorpay's square modal icon (512x512)
  // Inside a 512x512 square, place the composite centered
  const squareWidth = 512;
  const squareHeight = 512;
  
  // Scale the composite to fit nicely in 512x512 with good margin
  const fitted = await sharp(compositeImg)
    .resize({ width: 480, fit: 'inside' })
    .toBuffer();
  const fittedMeta = await sharp(fitted).metadata();

  const squareImg = await sharp({
    create: {
      width: squareWidth,
      height: squareHeight,
      channels: 4,
      background: bgBlack
    }
  })
  .composite([
    {
      input: fitted,
      top: Math.round((squareHeight - fittedMeta.height) / 2),
      left: Math.round((squareWidth - fittedMeta.width) / 2)
    }
  ])
  .png()
  .toBuffer();

  fs.writeFileSync(path.resolve(__dirname, '../assets/Videos/senpaiworks_razorpay_square_logo.png'), squareImg);
  console.log('Saved senpaiworks_razorpay_square_logo.png (512x512)');

  // Also encode both as base64 data URIs for scripts/brand-logo-data.js
  const base64Square = `data:image/png;base64,${squareImg.toString('base64')}`;
  const base64Horiz = `data:image/png;base64,${compositeImg.toString('base64')}`;

  const jsContent = `/* Auto-generated SenpaiWorks Brand Logo base64 data for Razorpay & UI */
window.SENPAIWORKS_LOGO_BLACK_BG = ${JSON.stringify(base64Square)};
window.SENPAIWORKS_LOGO_HORIZ = ${JSON.stringify(base64Horiz)};
`;

  fs.writeFileSync(path.resolve(__dirname, '../scripts/brand-logo-data.js'), jsContent, 'utf8');
  console.log('Updated scripts/brand-logo-data.js with base64 data');
}

createComposite().catch(console.error);
