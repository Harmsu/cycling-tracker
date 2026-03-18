// Aja kerran ikonien luomiseksi: node generate-icons.js
// Vaatii: npm install canvas (vain kehitysvaiheessa)
const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

const iconsDir = path.join(__dirname, 'icons');
if (!fs.existsSync(iconsDir)) fs.mkdirSync(iconsDir);

function createIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#14532d';
  ctx.beginPath();
  ctx.roundRect(0, 0, size, size, size * 0.2);
  ctx.fill();

  // Bicycle emoji
  ctx.font = `${size * 0.6}px serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('🚴', size / 2, size / 2);

  return canvas.toBuffer('image/png');
}

[192, 512].forEach(size => {
  const buf = createIcon(size);
  fs.writeFileSync(path.join(iconsDir, `icon-${size}.png`), buf);
  console.log(`Luotu: icon-${size}.png`);
});
