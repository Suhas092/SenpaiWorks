const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

async function createOutlinedLogo(srcPath, outlineRadius, outPaths) {
  const { data: alphaData, info } = await sharp(srcPath).ensureAlpha().extractChannel(3).raw().toBuffer({ resolveWithObject: true });
  const w = info.width;
  const h = info.height;
  
  const pad = outlineRadius + 2;
  const newW = w + pad * 2;
  const newH = h + pad * 2;
  
  const dilatedAlpha = Buffer.alloc(newW * newH, 0);
  
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const a = alphaData[y * w + x];
      if (a > 25) {
        for (let dy = -outlineRadius; dy <= outlineRadius; dy++) {
          for (let dx = -outlineRadius; dx <= outlineRadius; dx++) {
            const distSq = dx * dx + dy * dy;
            if (distSq <= outlineRadius * outlineRadius) {
              const ny = (y + pad) + dy;
              const nx = (x + pad) + dx;
              if (ny >= 0 && ny < newH && nx >= 0 && nx < newW) {
                const idx = ny * newW + nx;
                const dist = Math.sqrt(distSq);
                const strength = Math.max(0, Math.min(255, Math.round(255 * (1 - (dist - (outlineRadius - 1.2))))));
                const targetA = Math.min(a, strength);
                if (targetA > dilatedAlpha[idx]) {
                  dilatedAlpha[idx] = targetA;
                }
              }
            }
          }
        }
      }
    }
  }

  const blackPixels = Buffer.alloc(newW * newH * 4);
  for (let i = 0; i < newW * newH; i++) {
    blackPixels[i * 4] = 0;
    blackPixels[i * 4 + 1] = 0;
    blackPixels[i * 4 + 2] = 0;
    blackPixels[i * 4 + 3] = dilatedAlpha[i];
  }

  const originalPadded = await sharp(srcPath)
    .extend({
      top: pad,
      bottom: pad,
      left: pad,
      right: pad,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .toBuffer();

  const finalBuffer = await sharp(blackPixels, { raw: { width: newW, height: newH, channels: 4 } })
    .composite([{ input: originalPadded, top: 0, left: 0 }])
    .png()
    .toBuffer();

  for (const outPath of outPaths) {
    const dir = path.dirname(outPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(outPath, finalBuffer);
    console.log('Saved:', outPath, `(${newW}x${newH})`);
  }
}

async function main() {
  const rootDir = path.resolve(__dirname, '../..');
  
  // 1. Mark logo
  const srcLogo = path.join(rootDir, 'assets/Videos/SenpaiWorks logo.png');
  const logoTargets = [
    path.join(rootDir, 'admin-frontend/public/brand/senpaiworks-logo.png'),
    path.join(rootDir, 'admin-frontend/dist/client/brand/senpaiworks-logo.png'),
    path.join(rootDir, 'assets/Videos/senpaiworks_logo_outlined.png')
  ];
  await createOutlinedLogo(srcLogo, 4, logoTargets);

  // 2. Name text logo
  const srcName = path.join(rootDir, 'assets/Videos/senpaiworks name logo no bg.png');
  const nameTargets = [
    path.join(rootDir, 'admin-frontend/public/brand/senpaiworks-name-logo.png'),
    path.join(rootDir, 'admin-frontend/dist/client/brand/senpaiworks-name-logo.png'),
    path.join(rootDir, 'assets/Videos/senpaiworks_name_logo_outlined.png')
  ];
  await createOutlinedLogo(srcName, 6, nameTargets);

  console.log('All brand logos successfully generated with clean black outlines!');
}

main().catch(console.error);
