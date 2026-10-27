import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const imagePath = path.resolve(process.cwd(), 'src/assets/images/android_app_logo_1793116778829.jpg');
const publicDir = path.resolve(process.cwd(), 'public');
const resDir = path.resolve(process.cwd(), 'android/app/src/main/res');

async function processIcons() {
  if (!fs.existsSync(imagePath)) {
    console.error('Source image not found:', imagePath);
    return;
  }

  console.log('Generating beautiful app icons from source image...');

  // 1. Generate Public PWA & Favicon Icons
  await sharp(imagePath)
    .resize(512, 512)
    .png({ quality: 95 })
    .toFile(path.join(publicDir, 'android-logo.png'));

  await sharp(imagePath)
    .resize(512, 512)
    .png({ quality: 95 })
    .toFile(path.join(publicDir, 'pwa-512x512.png'));

  await sharp(imagePath)
    .resize(512, 512)
    .png({ quality: 95 })
    .toFile(path.join(publicDir, 'pwa-maskable-512x512.png'));

  await sharp(imagePath)
    .resize(192, 192)
    .png({ quality: 95 })
    .toFile(path.join(publicDir, 'pwa-192x192.png'));

  await sharp(imagePath)
    .resize(180, 180)
    .png({ quality: 95 })
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));

  await sharp(imagePath)
    .resize(64, 64)
    .png({ quality: 95 })
    .toFile(path.join(publicDir, 'favicon.png'));

  console.log('Public icons generated successfully!');

  // 2. Generate Android Mipmap Icons
  const mipmapSizes = [
    { dir: 'mipmap-mdpi', iconSize: 48, fgSize: 108 },
    { dir: 'mipmap-hdpi', iconSize: 72, fgSize: 162 },
    { dir: 'mipmap-xhdpi', iconSize: 96, fgSize: 216 },
    { dir: 'mipmap-xxhdpi', iconSize: 144, fgSize: 324 },
    { dir: 'mipmap-xxxhdpi', iconSize: 192, fgSize: 432 },
  ];

  for (const { dir, iconSize, fgSize } of mipmapSizes) {
    const targetDir = path.join(resDir, dir);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    // Standard square/squircle launcher
    await sharp(imagePath)
      .resize(iconSize, iconSize)
      .png()
      .toFile(path.join(targetDir, 'ic_launcher.png'));

    // Round launcher (circular mask)
    const circleSvg = Buffer.from(
      `<svg width="${iconSize}" height="${iconSize}"><circle cx="${iconSize/2}" cy="${iconSize/2}" r="${iconSize/2}" fill="white"/></svg>`
    );
    await sharp(imagePath)
      .resize(iconSize, iconSize)
      .composite([{ input: circleSvg, blend: 'dest-in' }])
      .png()
      .toFile(path.join(targetDir, 'ic_launcher_round.png'));

    // Foreground icon for adaptive icons
    await sharp(imagePath)
      .resize(fgSize, fgSize)
      .png()
      .toFile(path.join(targetDir, 'ic_launcher_foreground.png'));

    console.log(`Updated Android icons in ${dir} (${iconSize}x${iconSize})`);
  }

  console.log('All Android app icons successfully generated!');
}

processIcons().catch((err) => {
  console.error('Error generating icons:', err);
});
