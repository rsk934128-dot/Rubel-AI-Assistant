import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';
import { AuthProvider } from './context/AuthContext';
import { SpeedInsights } from '@vercel/speed-insights/react';

// In development, automatically unregister any stale service workers to ensure API requests reach Express
if (import.meta.env.DEV) {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const registration of registrations) {
        registration.unregister();
      }
    });
    if ('caches' in window) {
      caches.keys().then((keys) => {
        keys.forEach((key) => {
          if (key.includes('workbox') || key.includes('pwa')) {
            caches.delete(key);
          }
        });
      });
    }
  }
  // Dynamically set canonical og:url and absolute og:image to current origin per applet-seo guidelines
  try {
    const currentOrigin = window.location.origin;
    const currentUrl = currentOrigin + window.location.pathname;
    
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = currentUrl;

    let ogUrl = document.querySelector('meta[property="og:url"]') as HTMLMetaElement;
    if (!ogUrl) {
      ogUrl = document.createElement('meta');
      ogUrl.setAttribute('property', 'og:url');
      document.head.appendChild(ogUrl);
    }
    ogUrl.content = currentUrl;

    const ogImages = document.querySelectorAll('meta[property="og:image"]');
    if (ogImages.length > 0) {
      (ogImages[0] as HTMLMetaElement).content = `${currentOrigin}/og-banner.png`;
    }
    const twitterImg = document.querySelector('meta[name="twitter:image"]') as HTMLMetaElement;
    if (twitterImg) {
      twitterImg.content = `${currentOrigin}/og-banner.png`;
    }
  } catch (e) {
    // Non-blocking metadata sync
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <App />
      <SpeedInsights />
    </AuthProvider>
  </StrictMode>,
);


