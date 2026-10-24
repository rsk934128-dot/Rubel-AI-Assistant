import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const ogBannerSvg = `
<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Background Gradient -->
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#021a14" />
      <stop offset="40%" stop-color="#062e24" />
      <stop offset="80%" stop-color="#0b171f" />
      <stop offset="100%" stop-color="#05090f" />
    </linearGradient>

    <!-- Radial Emerald Glow -->
    <radialGradient id="centerGlow" cx="28%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#10b981" stop-opacity="0.35" />
      <stop offset="60%" stop-color="#059669" stop-opacity="0.1" />
      <stop offset="100%" stop-color="#000000" stop-opacity="0" />
    </radialGradient>

    <!-- Text Gradient -->
    <linearGradient id="textGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#ffffff" />
      <stop offset="50%" stop-color="#a7f3d0" />
      <stop offset="100%" stop-color="#34d399" />
    </linearGradient>

    <!-- Logo Gradients -->
    <linearGradient id="logoBgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#065f46" />
      <stop offset="50%" stop-color="#047857" />
      <stop offset="100%" stop-color="#064e3b" />
    </linearGradient>
    <linearGradient id="logoCoreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#34d399" />
      <stop offset="50%" stop-color="#10b981" />
      <stop offset="100%" stop-color="#059669" />
    </linearGradient>
    <linearGradient id="logoSparkleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fef08a" />
      <stop offset="50%" stop-color="#6ee7b7" />
      <stop offset="100%" stop-color="#34d399" />
    </linearGradient>
    <filter id="glowFilter" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="16" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>

  <!-- Background Canvas -->
  <rect width="1200" height="630" fill="url(#bgGrad)" />
  <rect width="1200" height="630" fill="url(#centerGlow)" />

  <!-- Outer Frame Subtle Border -->
  <rect x="20" y="20" width="1160" height="590" rx="36" fill="none" stroke="#10b981" stroke-width="2" stroke-opacity="0.25" />

  <!-- LEFT: App Logo Squircle Emblem -->
  <g transform="translate(110, 145)">
    <!-- Glow Backdrop -->
    <rect x="-10" y="-10" width="360" height="360" rx="84" fill="#059669" opacity="0.3" filter="url(#glowFilter)" />
    
    <!-- Base Squircle -->
    <rect width="340" height="340" rx="76" fill="url(#logoBgGrad)" stroke="#34d399" stroke-width="5" stroke-opacity="0.8" />
    
    <!-- Inner Dark Layer -->
    <rect x="30" y="30" width="280" height="280" rx="56" fill="#09121d" stroke="#10b981" stroke-width="2.5" stroke-opacity="0.5" />
    
    <!-- Center Symbol -->
    <g transform="translate(170, 170)">
      <!-- Neural Orbit -->
      <circle cx="0" cy="0" r="74" fill="none" stroke="#059669" stroke-width="2.5" stroke-dasharray="5 6" stroke-opacity="0.5" />
      
      <!-- Code Brackets < > -->
      <path d="M-60,-46 L-106,0 L-60,46" fill="none" stroke="url(#logoCoreGrad)" stroke-width="19" stroke-linecap="round" stroke-linejoin="round" />
      <path d="M60,-46 L106,0 L60,46" fill="none" stroke="url(#logoCoreGrad)" stroke-width="19" stroke-linecap="round" stroke-linejoin="round" />
      
      <!-- Forward Slash / -->
      <path d="M14,-64 L-14,64" fill="none" stroke="#10b981" stroke-width="10" stroke-linecap="round" stroke-opacity="0.4" />
      
      <!-- AI Sparkle Star ✦ -->
      <path d="M0,-44 C0,-10 -10,0 -44,0 C-10,0 0,10 0,44 C0,10 10,0 44,0 C10,0 0,-10 0,-44 Z" fill="url(#logoSparkleGrad)" />
      
      <!-- Center Dot & Nodes -->
      <circle cx="0" cy="0" r="7.5" fill="#ffffff" />
      <circle cx="-106" cy="0" r="8" fill="#6ee7b7" />
      <circle cx="106" cy="0" r="8" fill="#6ee7b7" />
      <circle cx="0" cy="-74" r="6.5" fill="#34d399" />
      <circle cx="0" cy="74" r="6.5" fill="#34d399" />
    </g>
  </g>

  <!-- RIGHT: Typography & Badges -->
  <g transform="translate(510, 155)">
    <!-- Top Pill Badge -->
    <rect x="0" y="0" width="270" height="38" rx="19" fill="#064e3b" stroke="#10b981" stroke-width="1.5" />
    <text x="135" y="24" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="700" fill="#6ee7b7" text-anchor="middle" letter-spacing="1.5">RUBEL AI ECOSYSTEM</text>

    <!-- Main Title -->
    <text x="0" y="105" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="54" font-weight="800" fill="url(#textGrad)" letter-spacing="-0.5">Rubel AI Assistant</text>
    
    <!-- Subtitle & Tagline -->
    <text x="0" y="160" font-family="DejaVu Sans, Arial, Helvetica, sans-serif" font-size="34" font-weight="600" fill="#94a3b8">&amp; Coding Studio</text>

    <!-- Description -->
    <text x="0" y="215" font-family="DejaVu Sans, Arial, Helvetica, sans-serif" font-size="20" font-weight="400" fill="#cbd5e1">
      Next-Gen AI Assistant • Real-Time Trading Bot • YouTube Music Studio
    </text>

    <!-- Feature Pills -->
    <g transform="translate(0, 260)">
      <!-- Pill 1: AI Assistant -->
      <rect x="0" y="0" width="160" height="42" rx="12" fill="#0f172a" stroke="#334155" stroke-width="1.5" />
      <text x="80" y="26" font-family="DejaVu Sans, Arial, Helvetica, sans-serif" font-size="14" font-weight="600" fill="#38bdf8" text-anchor="middle">AI &amp; Coding</text>

      <!-- Pill 2: Trading Bot -->
      <rect x="175" y="0" width="180" height="42" rx="12" fill="#0f172a" stroke="#334155" stroke-width="1.5" />
      <text x="265" y="26" font-family="DejaVu Sans, Arial, Helvetica, sans-serif" font-size="14" font-weight="600" fill="#34d399" text-anchor="middle">Trading Signals</text>

      <!-- Pill 3: YouTube Studio -->
      <rect x="370" y="0" width="180" height="42" rx="12" fill="#0f172a" stroke="#334155" stroke-width="1.5" />
      <text x="460" y="26" font-family="DejaVu Sans, Arial, Helvetica, sans-serif" font-size="14" font-weight="600" fill="#f43f5e" text-anchor="middle">YouTube Studio</text>
    </g>
  </g>

  <!-- Bottom Footer Line -->
  <g transform="translate(110, 565)">
    <text x="0" y="0" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="15" font-weight="500" fill="#64748b">
      https://rubel-ai-studio.app • Fast, Secure &amp; Multilingual
    </text>
  </g>
</svg>
`;

async function generate() {
  const publicDir = path.resolve(process.cwd(), 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  // 1. Generate 1200x630 og-banner.png
  const ogBannerBuffer = Buffer.from(ogBannerSvg);
  await sharp(ogBannerBuffer)
    .png({ quality: 95 })
    .toFile(path.join(publicDir, 'og-banner.png'));

  console.log('Successfully generated public/og-banner.png (1200x630)');

  // 2. Ensure public/og-image.png exists (copy or symlink for standard compatibility)
  fs.copyFileSync(
    path.join(publicDir, 'og-banner.png'),
    path.join(publicDir, 'og-image.png')
  );
  console.log('Successfully copied to public/og-image.png');

  // 3. Generate a dedicated square 512x512 logo share image for WhatsApp & chat previews
  if (fs.existsSync(path.join(publicDir, 'pwa-512x512.png'))) {
    fs.copyFileSync(
      path.join(publicDir, 'pwa-512x512.png'),
      path.join(publicDir, 'logo-share.png')
    );
    console.log('Successfully copied public/logo-share.png (512x512)');
  }
}

generate().catch((err) => {
  console.error('Error generating banners:', err);
  process.exit(1);
});
