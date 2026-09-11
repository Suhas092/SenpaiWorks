/**
 * SenpaiWorks Autonomous 14-Day Trash Purge Cron
 *
 * Runs daily at midnight to permanently purge items that have been in the
 * 14-day soft-delete grace period.
 *
 * 1. Checks Artwork, NewsArticle, HomeHeroSlide, HomeShowcaseItem for records with
 *    deletedAt <= (now - 14 days).
 * 2. Permanently deletes their objects from R2 bucket.
 * 3. Permanently removes the expired database row.
 */

'use strict';

const { purgeTrashObject } = require('../utils/r2upload');

const RETENTION_DAYS = 14;

async function runTrashPurge(prisma) {
  const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000);
  console.log(`[TrashPurge] Running purge check for items deleted before ${cutoff.toISOString()}`);

  let totalPurged = 0;

  try {
    // 1. Artworks
    const expiredArtworks = await prisma.artwork.findMany({
      where: { deletedAt: { lte: cutoff } }
    });

    for (const art of expiredArtworks) {
      console.log(`[TrashPurge] Purging expired Artwork ID ${art.id} (${art.charname})`);
      if (art.trashMeta) {
        try {
          const meta = JSON.parse(art.trashMeta);
          if (Array.isArray(meta.keys)) {
            for (const k of meta.keys) await purgeTrashObject(k);
          }
        } catch (e) {}
      } else if (art.img) {
        await purgeTrashObject(art.img);
      }
      await prisma.artwork.delete({ where: { id: art.id } });
      totalPurged++;
    }

    // 2. News Articles
    const expiredNews = await prisma.newsArticle.findMany({
      where: { deletedAt: { lte: cutoff } }
    });

    for (const n of expiredNews) {
      console.log(`[TrashPurge] Purging expired NewsArticle ID ${n.id} (${n.title})`);
      if (n.img) await purgeTrashObject(n.img);
      await prisma.newsArticle.delete({ where: { id: n.id } });
      totalPurged++;
    }

    // 3. Home Hero Slides
    const expiredSlides = await prisma.homeHeroSlide.findMany({
      where: { deletedAt: { lte: cutoff } }
    });

    for (const s of expiredSlides) {
      console.log(`[TrashPurge] Purging expired HomeHeroSlide ID ${s.id} (${s.title})`);
      if (s.bgUrl) await purgeTrashObject(s.bgUrl);
      await prisma.homeHeroSlide.delete({ where: { id: s.id } });
      totalPurged++;
    }

    // 4. Home Showcase Items
    const expiredShowcases = await prisma.homeShowcaseItem.findMany({
      where: { deletedAt: { lte: cutoff } }
    });

    for (const sc of expiredShowcases) {
      console.log(`[TrashPurge] Purging expired HomeShowcaseItem ID ${sc.id} (${sc.title})`);
      if (sc.imageUrl) await purgeTrashObject(sc.imageUrl);
      await prisma.homeShowcaseItem.delete({ where: { id: sc.id } });
      totalPurged++;
    }

    console.log(`[TrashPurge] Completed. Total items permanently purged: ${totalPurged}`);
  } catch (err) {
    console.error('[TrashPurge] Error during trash purge run:', err);
  }

  return totalPurged;
}

function initTrashPurgeCron(prisma) {
  // Run once on server startup after a small delay (5 seconds)
  setTimeout(() => {
    runTrashPurge(prisma).catch(() => {});
  }, 5000);

  // Run every 24 hours (86,400,000 ms)
  setInterval(() => {
    runTrashPurge(prisma).catch(() => {});
  }, 24 * 60 * 60 * 1000);

  console.log('[TrashPurge] 14-day autonomous trash purge cron initialized.');
}

module.exports = { initTrashPurgeCron, runTrashPurge };
