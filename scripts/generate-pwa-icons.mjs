import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// 1. Standard SVG Icon
const standardSvg = fs.readFileSync(path.join(publicDir, 'icon.svg'));

// 2. Full-bleed Maskable SVG with 20% safe zone padding
const maskableSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#047857"/>
      <stop offset="50%" stop-color="#059669"/>
      <stop offset="100%" stop-color="#0f766e"/>
    </linearGradient>
    <linearGradient id="glow" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#34d399"/>
      <stop offset="100%" stop-color="#6ee7b7"/>
    </linearGradient>
    <linearGradient id="cardGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#1e293b"/>
      <stop offset="100%" stop-color="#0f172a"/>
    </linearGradient>
  </defs>

  <!-- Full-bleed background with NO corner radius for Android maskable cropping -->
  <rect width="512" height="512" fill="url(#bg)"/>

  <!-- Scaled content within 75% safe area (central circle) -->
  <g transform="translate(256, 256) scale(0.78) translate(-256, -256)">
    <rect x="56" y="56" width="400" height="400" rx="80" fill="url(#cardGrad)" stroke="#10b981" stroke-width="4" stroke-opacity="0.5"/>
    <g transform="translate(256, 256)">
      <polygon points="0,-85 74,-42 74,42 0,85 -74,42 -74,-42" fill="none" stroke="url(#glow)" stroke-width="12" stroke-linejoin="round" stroke-linecap="round"/>
      <path d="M-135,-35 L-175,0 L-135,35" fill="none" stroke="#6ee7b7" stroke-width="14" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M135,-35 L175,0 L135,35" fill="none" stroke="#6ee7b7" stroke-width="14" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M0,-45 Q0,0 -45,0 Q0,0 0,45 Q0,0 45,0 Q0,0 0,-45 Z" fill="url(#glow)"/>
      <circle cx="0" cy="-85" r="8" fill="#a7f3d0"/>
      <circle cx="74" cy="-42" r="8" fill="#a7f3d0"/>
      <circle cx="74" cy="42" r="8" fill="#a7f3d0"/>
      <circle cx="0" cy="85" r="8" fill="#a7f3d0"/>
      <circle cx="-74" cy="42" r="8" fill="#a7f3d0"/>
      <circle cx="-74" cy="-42" r="8" fill="#a7f3d0"/>
    </g>
  </g>
</svg>
`;

async function generate() {
  console.log('Generating PWA icons...');
  
  // pwa-192x192.png
  await sharp(Buffer.from(standardSvg))
    .resize(192, 192)
    .png()
    .toFile(path.join(publicDir, 'pwa-192x192.png'));
  console.log('Generated pwa-192x192.png');

  // pwa-512x512.png
  await sharp(Buffer.from(standardSvg))
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'pwa-512x512.png'));
  console.log('Generated pwa-512x512.png');

  // pwa-maskable-512x512.png
  await sharp(Buffer.from(maskableSvg))
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'pwa-maskable-512x512.png'));
  console.log('Generated pwa-maskable-512x512.png');

  // apple-touch-icon.png (180x180)
  await sharp(Buffer.from(standardSvg))
    .resize(180, 180)
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));
  console.log('Generated apple-touch-icon.png');

  // favicon.ico / 64x64 favicon.png
  await sharp(Buffer.from(standardSvg))
    .resize(64, 64)
    .png()
    .toFile(path.join(publicDir, 'favicon.png'));
  console.log('Generated favicon.png');

  console.log('All PWA icons generated successfully!');
}

generate().catch((err) => {
  console.error(err);
  process.exit(1);
});
