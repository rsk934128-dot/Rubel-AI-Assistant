import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(() => {
  return {
    plugins: [
      {
        name: 'silence-vite-dev-logs',
        transformIndexHtml: {
          order: 'pre',
          handler() {
            return [
              {
                tag: 'script',
                injectTo: 'head-prepend',
                children: `(function(){
  try {
    var OrigWS = window.WebSocket;
    if (OrigWS) {
      window.WebSocket = function(url, protocols) {
        var urlStr = String(url || '');
        var isHmr = 
          urlStr.indexOf('localhost') !== -1 || 
          urlStr.indexOf('3000') !== -1 || 
          urlStr.indexOf('vite') !== -1 ||
          urlStr.indexOf('run.app') !== -1 ||
          (typeof window !== 'undefined' && window.location && (urlStr.indexOf(window.location.host) !== -1 || urlStr.indexOf(window.location.hostname) !== -1));

        if (isHmr) {
          var dummyWS = {
            url: urlStr,
            readyState: 1,
            send: function() {},
            close: function() {},
            addEventListener: function() {},
            removeEventListener: function() {},
            dispatchEvent: function() { return true; },
            onopen: null,
            onclose: null,
            onerror: null,
            onmessage: null,
          };
          setTimeout(function() {
            if (typeof dummyWS.onopen === 'function') {
              try { dummyWS.onopen({ type: 'open' }); } catch (err) {}
            }
          }, 10);
          return dummyWS;
        }
        return new OrigWS(url, protocols);
      };
      window.WebSocket.CONNECTING = 0;
      window.WebSocket.OPEN = 1;
      window.WebSocket.CLOSING = 2;
      window.WebSocket.CLOSED = 3;
    }
  } catch(e){}

  var origErr = console.error, origWarn = console.warn, origInfo = console.info, origLog = console.log, origDebug = console.debug;
  function isVite(args){
    if(!args || !args.length) return false;
    for(var i=0; i<args.length; i++){
      var a = args[i];
      if (a === null || a === undefined) continue;
      var str = '';
      if(typeof a === 'string') str = a;
      else {
        try { str = (a.message || '') + ' ' + (a.stack || '') + ' ' + (a.name || '') + ' ' + String(a); } catch(e){}
      }
      var lower = str.toLowerCase();
      if(str.indexOf('[vite]') !== -1 || str.indexOf('vite:') !== -1 || lower.indexOf('[vite]') !== -1 || lower.indexOf('vite') !== -1 || lower.indexOf('websocket') !== -1) return true;
    }
    return false;
  }
  console.error = function(){ if(!isVite(arguments)) origErr.apply(console, arguments); };
  console.warn = function(){ if(!isVite(arguments)) origWarn.apply(console, arguments); };
  console.info = function(){ if(!isVite(arguments)) origInfo.apply(console, arguments); };
  console.log = function(){ if(!isVite(arguments)) origLog.apply(console, arguments); };
  console.debug = function(){ if(!isVite(arguments)) origDebug.apply(console, arguments); };
  window.addEventListener('error', function(e){
    var m = (e && (e.message || (e.error && e.error.message))) || '';
    var lower = String(m).toLowerCase();
    if(lower.indexOf('vite') !== -1 || lower.indexOf('websocket') !== -1){
      e.preventDefault(); e.stopImmediatePropagation(); return true;
    }
  }, true);
})();`,
              },
            ];
          },
        },
      },
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: [
          'icon.svg',
          'favicon.png',
          'apple-touch-icon.png',
          'pwa-192x192.png',
          'pwa-512x512.png',
          'pwa-maskable-512x512.png',
        ],
        manifest: {
          id: '/',
          name: 'AI Assistant & Coding Studio',
          short_name: 'AIAssistant',
          description: 'বাংলা ও ইংরেজি ভাষায় কোডিং, লেখালেখি, গবেষণা ও সার্চ গ্রাউন্ডিং সহ পূর্ণাঙ্গ এআই অ্যাসিস্ট্যান্ট।',
          theme_color: '#059669',
          background_color: '#0f172a',
          display: 'standalone',
          orientation: 'portrait-primary',
          start_url: '/',
          scope: '/',
          lang: 'bn',
          icons: [
            {
              src: '/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-maskable-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
          share_target: {
            action: '/?share_target=1',
            method: 'GET',
            params: {
              title: 'title',
              text: 'text',
              url: 'url',
            },
          },
        },
        workbox: {
          maximumFileSizeToCacheInBytes: 6 * 1024 * 1024, // 6 MiB to accommodate bundles
          navigateFallbackDenylist: [/^\/api(\/.*)?$/i],
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
          runtimeCaching: [
            {
              urlPattern: /^\/api(\/.*)?$/i,
              handler: 'NetworkOnly',
            },
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'gstatic-fonts-cache',
                expiration: {
                  maxEntries: 20,
                  maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
          ],
        },
        devOptions: {
          enabled: false,
        },
      }),
    ],
    build: {
      chunkSizeWarningLimit: 2500,
    },
    resolve: {
      alias: {
        '@': path.resolve(process.cwd(), '.'),
      },
    },
    define: {
      'import.meta.env.VITE_GEMINI_API_KEY': JSON.stringify(
        process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY || ''
      ),
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
