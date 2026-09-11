/**
 * SenpaiWorks R2 Upload Utility
 * Replaces local disk storage for admin-uploaded images.
 * Uses @aws-sdk/client-s3 (S3-compatible) + sharp for resizing.
 */

'use strict';

const { S3Client, PutObjectCommand, DeleteObjectCommand, CopyObjectCommand } = require('@aws-sdk/client-s3');
const sharp = require('sharp');

const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const BUCKET = process.env.R2_BUCKET_NAME;
const PUBLIC_URL = (process.env.R2_PUBLIC_URL || '').replace(/\/$/, '');

/**
 * Upload an image buffer to R2, generating multiple sizes.
 *
 * @param {Buffer} fileBuffer   - Raw image buffer
 * @param {string} baseName     - Base filename without extension (e.g. "art_1725123456_42")
 * @returns {Promise<{ thumb: string, medium: string, full: string }>} Public URLs
 */
async function uploadImageToR2(fileBuffer, baseName) {
  const sizes = [
    { suffix: 'thumb',  width: 400  },  // Grid card thumbnails
    { suffix: 'medium', width: 900  },  // Detail panel view
    { suffix: 'full',   width: null },  // Full-res for downloads
  ];

  const urls = {};

  for (const { suffix, width } of sizes) {
    let pipeline = sharp(fileBuffer).webp({ quality: 85 });
    if (width) {
      pipeline = pipeline.resize(width, null, { withoutEnlargement: true });
    }

    const buffer = await pipeline.toBuffer();
    const key = `artworks/${baseName}_${suffix}.webp`;

    await r2.send(new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: 'image/webp',
      CacheControl: 'public, max-age=31536000, immutable',
    }));

    urls[suffix] = `${PUBLIC_URL}/${key}`;
  }

  return urls; // { thumb, medium, full }
}

/**
 * Delete a single object from R2 by its key path.
 *
 * @param {string} key - e.g. "artworks/art_123_full.webp"
 */
async function deleteFromR2(key) {
  await r2.send(new DeleteObjectCommand({
    Bucket: BUCKET,
    Key: key,
  }));
}

/**
 * Extract the R2 key from a full public URL.
 * e.g. "https://pub-xxx.r2.dev/artworks/art_123_full.webp" → "artworks/art_123_full.webp"
 */
function keyFromUrl(url) {
  if (!url) return '';
  return url.replace(`${PUBLIC_URL}/`, '');
}

/**
 * Upload a profile avatar to R2.
 * Generates a single 256×256 WebP stored under avatars/.
 *
 * @param {Buffer} fileBuffer  - Raw image buffer
 * @param {string} baseName    - Base filename without extension
 * @returns {Promise<string>}  Public URL of the avatar
 */
async function uploadAvatarToR2(fileBuffer, baseName) {
  const buffer = await sharp(fileBuffer)
    .resize(256, 256, { fit: 'cover', position: 'centre' })
    .webp({ quality: 88 })
    .toBuffer();

  const key = `avatars/${baseName}.webp`;

  await r2.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: buffer,
    ContentType: 'image/webp',
    CacheControl: 'public, max-age=31536000, immutable',
  }));

  return `${PUBLIC_URL}/${key}`;
}

/**
 * Move a file in R2 to the trash/ prefix for a 14-day retention window.
 * e.g. "artworks/art_123_medium.webp" -> "trash/artworks/art_123_medium.webp"
 *
 * @param {string} key - Active R2 object key or public URL
 * @returns {Promise<{ trashKey: string, trashUrl: string } | null>}
 */
async function moveToTrash(keyOrUrl) {
  if (!keyOrUrl) return null;
  const key = keyFromUrl(keyOrUrl);
  if (!key) return null;
  if (key.startsWith('trash/')) {
    return { trashKey: key, trashUrl: `${PUBLIC_URL}/${key}` };
  }

  const trashKey = `trash/${key}`;

  await r2.send(new CopyObjectCommand({
    Bucket: BUCKET,
    CopySource: `${BUCKET}/${key}`,
    Key: trashKey,
    MetadataDirective: 'COPY',
  }));

  await r2.send(new DeleteObjectCommand({
    Bucket: BUCKET,
    Key: key,
  }));

  return { trashKey, trashUrl: `${PUBLIC_URL}/${trashKey}` };
}

/**
 * Restore a file from trash/ back to its active path in R2.
 * e.g. "trash/artworks/art_123_medium.webp" -> "artworks/art_123_medium.webp"
 *
 * @param {string} trashKeyOrUrl - Trashed key or public URL
 * @returns {Promise<{ activeKey: string, activeUrl: string } | null>}
 */
async function restoreFromTrash(trashKeyOrUrl) {
  if (!trashKeyOrUrl) return null;
  const trashKey = keyFromUrl(trashKeyOrUrl);
  if (!trashKey || !trashKey.startsWith('trash/')) return null;

  const activeKey = trashKey.replace(/^trash\//, '');

  await r2.send(new CopyObjectCommand({
    Bucket: BUCKET,
    CopySource: `${BUCKET}/${trashKey}`,
    Key: activeKey,
    MetadataDirective: 'COPY',
  }));

  await r2.send(new DeleteObjectCommand({
    Bucket: BUCKET,
    Key: trashKey,
  }));

  return { activeKey, activeUrl: `${PUBLIC_URL}/${activeKey}` };
}

/**
 * Permanently purge an object from R2 trash.
 *
 * @param {string} trashKeyOrUrl
 */
async function purgeTrashObject(trashKeyOrUrl) {
  if (!trashKeyOrUrl) return;
  const trashKey = keyFromUrl(trashKeyOrUrl);
  if (!trashKey) return;
  await r2.send(new DeleteObjectCommand({
    Bucket: BUCKET,
    Key: trashKey,
  }));
}

module.exports = {
  uploadImageToR2,
  uploadAvatarToR2,
  deleteFromR2,
  keyFromUrl,
  moveToTrash,
  restoreFromTrash,
  purgeTrashObject,
};

