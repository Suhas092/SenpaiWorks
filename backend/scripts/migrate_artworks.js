const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function runMigration() {
  console.log("=== STARTING 2D ARTWORKS DATABASE MIGRATION ===");

  const htmlPath = path.join(__dirname, '..', '..', 'art-library.html');
  if (!fs.existsSync(htmlPath)) {
    console.error("Error: art-library.html file not found at", htmlPath);
    process.exit(1);
  }

  const html = fs.readFileSync(htmlPath, 'utf8');

  function extractAttr(tagStr, attrName) {
    const m = tagStr.match(new RegExp(`${attrName}=["']([^"']+)["']`, 'i'));
    return m ? m[1] : '';
  }

  function extractImg(tagStr) {
    const m = tagStr.match(/<img[^>]*src=["']([^"']+)["']/i);
    return m ? m[1] : '';
  }

  const cardBlocks = html.split('class="pinterest-item');
  const itemsToMigrate = [];

  for (let i = 1; i < cardBlocks.length; i++) {
    const block = cardBlocks[i];
    const charname = extractAttr(block, 'data-charname');
    const source = extractAttr(block, 'data-source') || 'Original Artwork';
    const category = extractAttr(block, 'data-category') || 'digital-portrait';
    const sex = extractAttr(block, 'data-sex') || 'Female';
    const artstyle = extractAttr(block, 'data-artstyle') || 'Digital Art';
    const description = extractAttr(block, 'data-description') || `${charname} illustration from ${source}`;
    const img = extractImg(block);

    if (charname && img) {
      itemsToMigrate.push({
        charname,
        source,
        category,
        sex,
        artstyle,
        software: 'Photoshop / Blender',
        description,
        img
      });
    }
  }

  console.log(`Extracted ${itemsToMigrate.length} artwork items from HTML.`);

  let insertedCount = 0;
  for (const item of itemsToMigrate) {
    // Check if artwork already exists by charname and img
    const existing = await prisma.artwork.findFirst({
      where: {
        charname: item.charname,
        img: item.img
      }
    });

    if (!existing) {
      await prisma.artwork.create({
        data: item
      });
      insertedCount++;
      console.log(`[+] Inserted into DB: "${item.charname}" (${item.source}) - ${item.category}`);
    } else {
      console.log(`[=] Existing in DB: "${item.charname}" (Skipped)`);
    }
  }

  const totalInDb = await prisma.artwork.count();
  console.log(`\n=== MIGRATION COMPLETE! ===`);
  console.log(`Newly inserted: ${insertedCount}`);
  console.log(`Total artworks in DB: ${totalInDb}`);

  await prisma.$disconnect();
}

runMigration().catch(err => {
  console.error("Migration Failed:", err);
  prisma.$disconnect();
  process.exit(1);
});
