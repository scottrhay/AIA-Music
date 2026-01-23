const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const svgPath = path.join(__dirname, 'public', 'icons', 'icon.svg');
const iconsDir = path.join(__dirname, 'public', 'icons');

// Icon sizes needed for PWA
const sizes = [72, 96, 128, 144, 152, 167, 180, 192, 384, 512];

async function generateIcons() {
  const svgBuffer = fs.readFileSync(svgPath);

  console.log('Generating PNG icons from SVG...');

  for (const size of sizes) {
    const outputPath = path.join(iconsDir, `icon-${size}x${size}.png`);
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(outputPath);
    console.log(`Created: icon-${size}x${size}.png`);
  }

  // Create apple-touch-icon (180x180 is standard)
  const appleTouchPath = path.join(iconsDir, 'apple-touch-icon.png');
  await sharp(svgBuffer)
    .resize(180, 180)
    .png()
    .toFile(appleTouchPath);
  console.log('Created: apple-touch-icon.png');

  console.log('Done! All icons generated.');
}

generateIcons().catch(console.error);
