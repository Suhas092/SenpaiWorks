const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { PrismaClient } = require('@prisma/client');

dotenv.config();

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

// Merchandise Votes Endpoints
app.get('/api/merch/votes', async (req, res) => {
  const { itemId } = req.query;
  if (!itemId) {
    return res.status(400).json({ error: 'itemId is required' });
  }
  try {
    const vote = await prisma.merchVote.findUnique({
      where: { itemId }
    });
    res.json({ count: vote ? vote.count : 0 });
  } catch (error) {
    console.error('Error fetching merch votes:', error);
    res.status(500).json({ error: 'Failed to fetch votes' });
  }
});

app.post('/api/merch/votes', async (req, res) => {
  const { itemId } = req.body;
  if (!itemId) {
    return res.status(400).json({ error: 'itemId is required' });
  }
  try {
    const vote = await prisma.merchVote.upsert({
      where: { itemId },
      update: { count: { increment: 1 } },
      create: { itemId, count: 1 }
    });
    res.json({ count: vote.count });
  } catch (error) {
    console.error('Error updating merch votes:', error);
    res.status(500).json({ error: 'Failed to submit vote' });
  }
});

// Anime Likes Endpoints
app.get('/api/anime/likes', async (req, res) => {
  const { animeId } = req.query;
  if (!animeId) {
    return res.status(400).json({ error: 'animeId is required' });
  }
  try {
    const like = await prisma.like.findUnique({
      where: { animeId }
    });
    res.json({ count: like ? like.count : 0 });
  } catch (error) {
    console.error('Error fetching anime likes:', error);
    res.status(500).json({ error: 'Failed to fetch likes' });
  }
});

app.post('/api/anime/likes', async (req, res) => {
  const { animeId, action } = req.body;
  if (!animeId) {
    return res.status(400).json({ error: 'animeId is required' });
  }
  const isUnlike = action === 'unlike';
  const incrementValue = isUnlike ? -1 : 1;
  try {
    const like = await prisma.like.upsert({
      where: { animeId },
      update: { count: { increment: incrementValue } },
      create: { animeId, count: isUnlike ? 0 : 1 }
    });
    if (like.count < 0) {
      await prisma.like.update({
        where: { animeId },
        data: { count: 0 }
      });
      return res.json({ count: 0 });
    }
    res.json({ count: like.count });
  } catch (error) {
    console.error('Error updating anime likes:', error);
    res.status(500).json({ error: 'Failed to submit like' });
  }
});

// Anime Comments Endpoints
app.get('/api/anime/comments', async (req, res) => {
  const { animeId } = req.query;
  if (!animeId) {
    return res.status(400).json({ error: 'animeId is required' });
  }
  try {
    const comments = await prisma.comment.findMany({
      where: { animeId },
      orderBy: { createdAt: 'desc' }
    });
    res.json(comments);
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

app.post('/api/anime/comments', async (req, res) => {
  const { animeId, username, text } = req.body;
  if (!animeId || !username || !text) {
    return res.status(400).json({ error: 'animeId, username, and text are required' });
  }
  try {
    const comment = await prisma.comment.create({
      data: { animeId, username, text }
    });
    res.json(comment);
  } catch (error) {
    console.error('Error creating comment:', error);
    res.status(500).json({ error: 'Failed to post comment' });
  }
});

// Product Endpoints
app.get('/api/products', async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

app.post('/api/products', async (req, res) => {
  const {
    id, name, category, subCategory, price, description, img,
    additionalImages, badge, software, format, isNew, type, creator,
    whatsIncluded, aboutItem, sizes, colors, material, fabricType,
    printingMethod, washingInstructions, shippingWeight, packageDimensions
  } = req.body;

  if (!id || !name || !category || !price || !description || !img) {
    return res.status(400).json({ error: 'id, name, category, price, description, and img are required' });
  }

  try {
    const product = await prisma.product.create({
      data: {
        id,
        name,
        category,
        subCategory: subCategory || '',
        price: parseFloat(price),
        description,
        img,
        additionalImages: additionalImages || '',
        badge: badge || '',
        software: software || '',
        format: format || '',
        isNew: isNew !== undefined ? Boolean(isNew) : true,
        type: type || 'digital',
        creator: creator || 'SenpaiWorks',
        whatsIncluded: whatsIncluded || '',
        aboutItem: aboutItem || '',
        sizes: sizes || 'N/A',
        colors: colors || 'N/A',
        material: material || 'N/A',
        fabricType: fabricType || 'N/A',
        printingMethod: printingMethod || 'N/A',
        washingInstructions: washingInstructions || 'N/A',
        shippingWeight: shippingWeight || 'N/A',
        packageDimensions: packageDimensions || 'N/A'
      }
    });
    res.json(product);
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

app.delete('/api/products/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.product.delete({
      where: { id }
    });
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// Artwork Endpoints
app.get('/api/artworks', async (req, res) => {
  try {
    const artworks = await prisma.artwork.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(artworks);
  } catch (error) {
    console.error('Error fetching artworks:', error);
    res.status(500).json({ error: 'Failed to fetch artworks' });
  }
});

app.post('/api/artworks', async (req, res) => {
  const { category, charname, source, sex, artstyle, software, description, img } = req.body;

  if (!category || !charname || !source || !description || !img) {
    return res.status(400).json({ error: 'category, charname, source, description, and img are required' });
  }

  try {
    const artwork = await prisma.artwork.create({
      data: {
        category,
        charname,
        source,
        sex: sex || 'Female',
        artstyle: artstyle || 'Digital Art',
        software: software || 'Photoshop',
        description,
        img
      }
    });
    res.json(artwork);
  } catch (error) {
    console.error('Error creating artwork:', error);
    res.status(500).json({ error: 'Failed to create artwork' });
  }
});

app.delete('/api/artworks/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.artwork.delete({
      where: { id: parseInt(id) }
    });
    res.json({ message: 'Artwork deleted successfully' });
  } catch (error) {
    console.error('Error deleting artwork:', error);
    res.status(500).json({ error: 'Failed to delete artwork' });
  }
});

// Update Artwork Endpoint
app.put('/api/artworks/:id', async (req, res) => {
  const { id } = req.params;
  const { category, charname, source, sex, artstyle, software, description, img } = req.body;
  try {
    const artwork = await prisma.artwork.update({
      where: { id: parseInt(id) },
      data: {
        ...(category !== undefined && { category }),
        ...(charname !== undefined && { charname }),
        ...(source !== undefined && { source }),
        ...(sex !== undefined && { sex }),
        ...(artstyle !== undefined && { artstyle }),
        ...(software !== undefined && { software }),
        ...(description !== undefined && { description }),
        ...(img !== undefined && { img })
      }
    });
    res.json(artwork);
  } catch (error) {
    console.error('Error updating artwork:', error);
    res.status(500).json({ error: 'Failed to update artwork' });
  }
});

// Update Product Endpoint
app.put('/api/products/:id', async (req, res) => {
  const { id } = req.params;
  const {
    name, category, subCategory, price, description, img,
    additionalImages, badge, software, format, isNew, type, creator,
    whatsIncluded, aboutItem, sizes, colors, material, fabricType,
    printingMethod, washingInstructions, shippingWeight, packageDimensions
  } = req.body;
  try {
    const data = {};
    if (name !== undefined) data.name = name;
    if (category !== undefined) data.category = category;
    if (subCategory !== undefined) data.subCategory = subCategory;
    if (price !== undefined) data.price = parseFloat(price);
    if (description !== undefined) data.description = description;
    if (img !== undefined) data.img = img;
    if (additionalImages !== undefined) data.additionalImages = additionalImages;
    if (badge !== undefined) data.badge = badge;
    if (software !== undefined) data.software = software;
    if (format !== undefined) data.format = format;
    if (isNew !== undefined) data.isNew = Boolean(isNew);
    if (type !== undefined) data.type = type;
    if (creator !== undefined) data.creator = creator;
    if (whatsIncluded !== undefined) data.whatsIncluded = whatsIncluded;
    if (aboutItem !== undefined) data.aboutItem = aboutItem;
    if (sizes !== undefined) data.sizes = sizes;
    if (colors !== undefined) data.colors = colors;
    if (material !== undefined) data.material = material;
    if (fabricType !== undefined) data.fabricType = fabricType;
    if (printingMethod !== undefined) data.printingMethod = printingMethod;
    if (washingInstructions !== undefined) data.washingInstructions = washingInstructions;
    if (shippingWeight !== undefined) data.shippingWeight = shippingWeight;
    if (packageDimensions !== undefined) data.packageDimensions = packageDimensions;

    const product = await prisma.product.update({
      where: { id },
      data
    });
    res.json(product);
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// Admin Dashboard Stats Aggregation Endpoint
app.get('/api/admin/stats', async (req, res) => {
  try {
    // Counts
    const totalArtworks = await prisma.artwork.count();
    const totalProducts = await prisma.product.count();

    // Revenue stub (sum of product prices as proxy)
    const revenueAgg = await prisma.product.aggregate({ _sum: { price: true } });
    const totalRevenue = revenueAgg._sum.price || 0;

    // All artworks for category breakdown + timeline
    const allArtworks = await prisma.artwork.findMany({
      select: { category: true, sex: true, createdAt: true }
    });

    // All products for category breakdown + timeline
    const allProducts = await prisma.product.findMany({
      select: { category: true, type: true, createdAt: true, price: true }
    });

    // Artworks by category
    const artworksByCategory = {};
    allArtworks.forEach(a => {
      artworksByCategory[a.category] = (artworksByCategory[a.category] || 0) + 1;
    });

    // Products by category
    const productsByCategory = {};
    allProducts.forEach(p => {
      productsByCategory[p.category] = (productsByCategory[p.category] || 0) + 1;
    });

    // Artworks by gender
    const artworksByGender = {};
    allArtworks.forEach(a => {
      artworksByGender[a.sex] = (artworksByGender[a.sex] || 0) + 1;
    });

    // Timeline: group by YYYY-MM
    function buildTimeline(items) {
      const timeline = {};
      items.forEach(item => {
        const d = new Date(item.createdAt);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        timeline[key] = (timeline[key] || 0) + 1;
      });
      // Sort by key
      const sorted = Object.entries(timeline).sort((a, b) => a[0].localeCompare(b[0]));
      return { labels: sorted.map(s => s[0]), data: sorted.map(s => s[1]) };
    }

    const artworkTimeline = buildTimeline(allArtworks);
    const productTimeline = buildTimeline(allProducts);

    // Recent items
    const recentArtworks = await prisma.artwork.findMany({
      orderBy: { createdAt: 'desc' }, take: 5
    });
    const recentProducts = await prisma.product.findMany({
      orderBy: { createdAt: 'desc' }, take: 5
    });

    res.json({
      totalArtworks,
      totalProducts,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalViews: 0, // placeholder for future analytics
      artworksByCategory,
      productsByCategory,
      artworksByGender,
      artworkTimeline,
      productTimeline,
      recentArtworks,
      recentProducts
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ error: 'Failed to fetch admin stats' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
