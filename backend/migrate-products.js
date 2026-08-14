const fs = require('fs');
const path = require('path');

const productsPath = path.join(__dirname, 'data', 'products.json');

if (!fs.existsSync(productsPath)) {
  console.log('No products.json found, skipping migration.');
  process.exit(0);
}

let products = JSON.parse(fs.readFileSync(productsPath, 'utf8'));
const now = new Date().toISOString();
let migratedCount = 0;

products = products.map(product => {
  let modified = false;
  
  if (product.status === undefined) {
    product.status = 'Active';
    modified = true;
  }
  if (product.costPrice === undefined) {
    product.costPrice = Math.floor((product.originalPrice || product.price || 500) * 0.4); // Rough estimate
    modified = true;
  }
  if (product.sku === undefined) {
    product.sku = `SW-${product.id.substring(0, 8).toUpperCase()}`;
    modified = true;
  }
  if (product.slug === undefined) {
    product.slug = product.id;
    modified = true;
  }
  if (product.createdAt === undefined) {
    product.createdAt = now;
    modified = true;
  }
  if (product.updatedAt === undefined) {
    product.updatedAt = now;
    modified = true;
  }

  if (modified) migratedCount++;
  return product;
});

if (migratedCount > 0) {
  fs.writeFileSync(productsPath, JSON.stringify(products, null, 2));
  console.log(`Successfully migrated ${migratedCount} products with new fields!`);
} else {
  console.log('All products are already up to date.');
}
