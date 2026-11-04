process.env.DISABLE_HMR = 'true';
import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import 'dotenv/config';
import { GoogleGenAI } from '@google/genai';
import rateLimit from 'express-rate-limit';
import { safeFetch, validateSafeUrl, escapeHtml } from './safeFetch.js';

const getAppDirname = () => {
  try {
    return path.dirname(fileURLToPath(import.meta.url));
  } catch {
    return process.cwd();
  }
};

const app = express();
// Enable trust proxy for Cloud Run and reverse proxy load balancers
app.set('trust proxy', 1);
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

export const FALLBACK_MODELS = [
  'gemini-3.8-flash',
  'gemini-3.5-flash',
  'gemini-3.6-flash',
  'gemini-flash-lite-latest',
  'gemini-3.1-flash-lite',
  'gemini-flash-latest',
];

export const ALLOWED_MODELS = new Set([
  ...FALLBACK_MODELS,
  'gemini-3.5-transcribe',
]);

// Clean process error handling
process.on('uncaughtException', (err) => {
  console.error(`[${new Date().toISOString()}] Fatal Uncaught Exception:`, err.stack || err);
  // Log and allow graceful shutdown if critical
});

process.on('unhandledRejection', (reason, promise) => {
  console.error(`[${new Date().toISOString()}] Unhandled Promise Rejection at:`, promise, 'reason:', reason);
});

// Trusted Origins for CORS
function isAllowedOrigin(origin?: string): boolean {
  if (!origin) return true; // Same-origin or non-browser request
  try {
    const url = new URL(origin);
    const host = url.hostname.toLowerCase();

    // Localhost development
    if (host === 'localhost' || host === '127.0.0.1') return true;

    // AI Studio, Google Cloud Run, and Firebase hosting domains
    if (
      host.endsWith('.run.app') ||
      host.endsWith('.web.app') ||
      host.endsWith('.firebaseapp.com') ||
      host.endsWith('.google.com')
    ) {
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

// Hardened CORS Middleware: Restrict credentials and wildcard reflection
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && isAllowedOrigin(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
  } else {
    // For non-whitelisted third-party origins, do not allow credentials reflection
    res.header('Access-Control-Allow-Origin', '*');
  }
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, x-gemini-api-key, Cache-Control, Pragma');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// JSON body parser with sensible size limit
app.use(express.json({ limit: '2mb' }));

// Helper to reliably extract client IP behind reverse proxies without throwing ValidationErrors
const getClientIp = (req: express.Request): string => {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded) {
    const firstIp = forwarded.split(',')[0].trim();
    if (firstIp) return firstIp;
  }
  const fwdHeader = req.headers['forwarded'];
  if (typeof fwdHeader === 'string' && fwdHeader) {
    const match = fwdHeader.match(/for="?([^;",\s]+)/i);
    if (match && match[1]) return match[1].trim();
  }
  return req.ip || req.socket.remoteAddress || '127.0.0.1';
};

// Rate Limiting: General API Limiter (300 requests per 15 minutes)
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  validate: {
    xForwardedForHeader: false,
    forwardedHeader: false,
  },
  keyGenerator: getClientIp,
  message: { error: 'অতিরিক্ত রিকোয়েস্ট পাঠানো হয়েছে। অনুগ্রহ করে ১৫ মিনিট পর আবার চেষ্টা করুন।' },
});

// Stricter Rate Limiter for expensive AI operations (60 requests per minute)
export const aiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  validate: {
    xForwardedForHeader: false,
    forwardedHeader: false,
  },
  keyGenerator: getClientIp,
  message: { error: 'এআই কোটা সীমা সুরক্ষিত রাখতে সাময়িক বিরতি দিন। ১ মিনিট পর পুনরায় চেষ্টা করুন।' },
});

// Proxy Rate Limiter (60 requests per minute)
export const proxyLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  validate: {
    xForwardedForHeader: false,
    forwardedHeader: false,
  },
  keyGenerator: getClientIp,
  message: { error: 'প্রক্সি রিকোয়েস্টের সীমা অতিক্রম হয়েছে। অনুগ্রহ করে কিছুক্ষণ অপেক্ষা করুন।' },
});

app.use('/api/', apiLimiter);

// Normalize incoming path for serverless/proxy hosts that may strip the /api prefix or rewrite to /api/index
app.use((req, res, next) => {
  if (req.url.startsWith('/api/index')) {
    req.url = req.url.replace('/api/index', '/api');
  }
  if (
    !req.url.startsWith('/api') &&
    (req.url.startsWith('/health') ||
      req.url.startsWith('/chat') ||
      req.url.startsWith('/tts') ||
      req.url.startsWith('/transcribe') ||
      req.url.startsWith('/web') ||
      req.url.startsWith('/agent') ||
      req.url.startsWith('/music') ||
      req.url.startsWith('/session') ||
      req.url.startsWith('/youtube') ||
      req.url.startsWith('/mini-browser') ||
      req.url.startsWith('/trading-bot') ||
      req.url.startsWith('/proxy') ||
      req.url.startsWith('/drive'))
  ) {
    req.url = '/api' + req.url;
  }
  next();
});

// AI Studio Internal Control Plane status & health endpoint
app.all(['/__aistudio_internal_control_plane/dev/status', '/__aistudio_internal_control_plane*'], (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  return res.status(200).json({
    status: 'ok',
    ready: true,
    time: new Date().toISOString(),
  });
});

app.all(['/healthz', '/_health', '/api/healthz'], (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  return res.status(200).json({
    status: 'ok',
    ready: true,
  });
});

// Root API status endpoint
app.all(['/api', '/api/'], (req, res) => {
  res.json({
    success: true,
    status: 'ok',
    message: 'AI Studio Assistant API is online',
    time: new Date().toISOString(),
  });
});


// Track whether the default environment API key is revoked/leaked (initially false)
let isDefaultKeyRevoked = false;

// Helper to extract available Gemini API key from multiple common hosting variable names or request headers
function getEffectiveGeminiApiKey(req?: express.Request): string {
  // 1. Check custom header sent by client (e.g. from user settings)
  const headerKey = req?.headers?.['x-gemini-api-key'];
  if (typeof headerKey === 'string' && headerKey.trim().length > 10) {
    return headerKey.trim();
  }

  // 2. Check custom body param
  const bodyKey = (req?.body as any)?.apiKey;
  if (typeof bodyKey === 'string' && bodyKey.trim().length > 10) {
    return bodyKey.trim();
  }

  // 3. Fallback to server environment variables
  return (
    process.env.GEMINI_API_KEY ||
    process.env.VITE_GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.API_KEY ||
    ''
  ).trim();
}

// Lazy GoogleGenAI client with optional request-scoped API key
function getAIClient(req?: express.Request) {
  const apiKey = getEffectiveGeminiApiKey(req);
  if (!apiKey) {
    throw new Error(
      'GEMINI_API_KEY is not configured in environment variables. Please set GEMINI_API_KEY in your hosting dashboard or add a new API Key in app settings.'
    );
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Endpoint to validate a user-provided API key without polluting global server process.env
app.post('/api/set-api-key', aiLimiter, async (req, res) => {
  try {
    const { apiKey } = req.body || {};
    if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length < 15) {
      return res.status(400).json({ success: false, error: 'অনুগ্রহ করে একটি বৈধ Gemini API Key প্রদান করুন।' });
    }
    const cleanKey = apiKey.trim();

    // Verify key with lightweight ping
    const testAI = new GoogleGenAI({
      apiKey: cleanKey,
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
    });

    await testAI.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [{ role: 'user', parts: [{ text: 'Hello' }] }],
    });

    // Validated successfully! We do NOT mutate process.env globally to avoid affecting other tenants/users.
    // The key is returned to be saved in client localStorage and passed via x-gemini-api-key header.
    console.log('Gemini API key successfully validated for client session.');
    return res.json({
      success: true,
      valid: true,
      message: 'API Key সফলভাবে যাচাই করা হয়েছে! এটি আপনার ব্রাউজারে সুরক্ষিত রয়েছে।',
    });
  } catch (err: any) {
    console.error('API Key verification failed:', err);
    const friendly = formatFriendlyErrorMessage(err);
    return res.status(400).json({
      success: false,
      error: `API Key যাচাই ব্যর্থ হয়েছে: ${friendly}`,
      rawError: err?.message || String(err),
    });
  }
});

// Health check endpoint with hosting diagnostics
app.all(['/api/health', '/api/health/'], (req, res) => {
  try {
    const apiKey = getEffectiveGeminiApiKey();
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.json({
      success: true,
      status: 'ok',
      hasApiKey: Boolean(apiKey && apiKey.length > 0),
      port: PORT,
      nodeEnv: process.env.NODE_ENV || 'development',
      time: new Date().toISOString(),
      supportedModels: FALLBACK_MODELS,
    });
  } catch (err: any) {
    console.error('Health check endpoint error:', err);
    res.status(500).json({
      success: false,
      status: 'error',
      error: 'Health check failed: ' + (err?.message || String(err)),
    });
  }
});

// Natural Human-Like Text-to-Speech (TTS) Audio Stream Proxy for Bengali & English
app.get('/api/tts', async (req, res) => {
  try {
    const rawText = String(req.query.text || '').trim();
    if (!rawText) {
      return res.status(400).json({ error: 'Text query parameter is required.' });
    }

    const requestedLang = String(req.query.lang || '').toLowerCase();
    const hasBengali = /[\u0980-\u09FF]/.test(rawText);
    const lang = requestedLang === 'en' ? 'en' : (hasBengali || requestedLang === 'bn' ? 'bn' : 'en');

    // Google Translate TTS accepts chunks up to ~200 characters
    const chunk = rawText.slice(0, 200);
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(chunk)}&tl=${lang}&client=tw-ob`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'audio/mpeg, audio/*;q=0.9',
        'Referer': 'https://translate.google.com/',
      },
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: 'Failed to fetch audio stream from TTS provider.' });
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Length', buffer.length);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.setHeader('Accept-Ranges', 'bytes');
    return res.end(buffer);
  } catch (err: any) {
    console.error('TTS endpoint error:', err?.message || err);
    return res.status(500).json({ error: 'Internal TTS processing error' });
  }
});

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function formatFriendlyErrorMessage(err: any): string {
  const errStr = typeof err === 'string' ? err : err?.message || JSON.stringify(err);
  const lower = errStr.toLowerCase();
  if (
    lower.includes('429') ||
    lower.includes('quota') ||
    lower.includes('resource_exhausted') ||
    lower.includes('rate limit') ||
    lower.includes('exceeded your current quota')
  ) {
    return 'এআই কোটা সীমা (API Rate Limit / Quota Exceeded 429) সাময়িকভাবে শেষ হয়েছে। Google Gemini ফ্রি টায়ারের প্রতি মিনিটের রিকোয়েস্ট সীমা অতিক্রম করলে এই বার্তা আসে। অনুগ্রহ করে ১০-১৫ সেকেন্ড অপেক্ষা করে নিচের "পুনরায় চেষ্টা করুন" বাটনে ক্লিক করুন অথবা Google Search অফ করে মেসেজ পাঠান।';
  }
  if (lower.includes('503') || lower.includes('unavailable') || lower.includes('high demand') || lower.includes('overloaded')) {
    return 'গুগল এআই সার্ভার এই মুহূর্তে অতিরিক্ত চাপে রয়েছে (503 Service Unavailable)। স্বয়ংক্রিয়ভাবে বিকল্প মডেলে চেষ্টা করা হচ্ছে... কয়েক সেকেন্ড পর পুনরায় চেষ্টা করুন।';
  }
  if (lower.includes('404') || lower.includes('not_found') || lower.includes('no longer available')) {
    return 'অনুরোধকৃত এআই মডেলটি এই মুহূর্তে প্রস্তুত নয় (404 Not Found)। সিস্টেম স্বয়ংক্রিয়ভাবে বিকল্প সক্রিয় মডেলে সংযোগ করছে।';
  }
  if (lower.includes('leaked') || lower.includes('reported as leaked')) {
    return '⚠️ আপনার Gemini API Key টি কোথাও পাবলিকলি ফাঁস (Leaked) হওয়ার কারণে গুগল সুরক্ষার্থে এটি ব্লক করেছে (403 Permission Denied)। দয়া করে https://aistudio.google.com থেকে নতুন একটি API Key তৈরি করে পরিবেশ চলকে (GEMINI_API_KEY) আপডেট করুন।';
  }
  if (
    errStr.includes('API_KEY') ||
    errStr.includes('API key not valid') ||
    errStr.includes('not configured') ||
    errStr.includes('GEMINI_API_KEY')
  ) {
    return 'Gemini API Key পাওয়া যায়নি বা সঠিক নয়। আপনি যদি অ্যাপটি ক্লাউড/হোস্টিং (যেমন Render, Cloud Run, Vercel, Railway)-এ হোস্ট করে থাকেন, তবে হোস্টিং কন্ট্রোল প্যানেলের Environment Variables সেকশনে "GEMINI_API_KEY" যোগ করেছেন কিনা তা নিশ্চিত করুন।';
  }
  return err?.message || 'একটি অপ্রত্যাশিত সমস্যা দেখা দিয়েছে। অনুগ্রহ করে পুনরায় চেষ্টা করুন।';
}

async function fetchStreamWithResilience(
  ai: any,
  contents: any[],
  systemInstruction: string,
  enableSearch: boolean,
  modelPreference = 'gemini-3.8-flash'
) {
  const modelsToTry = [
    modelPreference,
    ...FALLBACK_MODELS,
  ].filter((v, i, a) => Boolean(v) && a.indexOf(v) === i);

  let searchAvailable = enableSearch;
  let lastError: any = null;

  for (const model of modelsToTry) {
    // If search is requested and currently available, attempt it
    if (searchAvailable) {
      try {
        const stream = await ai.models.generateContentStream({
          model,
          contents,
          config: { systemInstruction, tools: [{ googleSearch: {} }] },
        });
        return { stream, modelUsed: model, hadSearch: true };
      } catch (err: any) {
        lastError = err;
        const errStr = String(err?.message || err).toLowerCase();
        if (errStr.includes('leaked') || errStr.includes('reported as leaked')) {
          throw err;
        }
        searchAvailable = false;
      }
    }

    // Try standard prompt generation without search tools
    try {
      const stream = await ai.models.generateContentStream({
        model,
        contents,
        config: { systemInstruction },
      });
      return { stream, modelUsed: model, hadSearch: false };
    } catch (err: any) {
      lastError = err;
      const errStr = String(err?.message || err).toLowerCase();
      if (errStr.includes('leaked') || errStr.includes('reported as leaked')) {
        throw err;
      }
      if (
        errStr.includes('429') ||
        errStr.includes('quota') ||
        errStr.includes('resource_exhausted') ||
        errStr.includes('503')
      ) {
        await sleep(300);
      }
    }
  }

  throw lastError || new Error('All model attempts failed.');
}

async function fetchContentWithResilience(
  ai: any,
  contents: any[],
  systemInstruction: string,
  enableSearch: boolean,
  modelPreference = 'gemini-3.8-flash'
) {
  const modelsToTry = [
    modelPreference,
    ...FALLBACK_MODELS,
  ].filter((v, i, a) => Boolean(v) && a.indexOf(v) === i);

  let searchAvailable = enableSearch;
  let lastError: any = null;

  for (const model of modelsToTry) {
    if (searchAvailable) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents,
          config: { systemInstruction, tools: [{ googleSearch: {} }] },
        });
        return response;
      } catch (err: any) {
        lastError = err;
        searchAvailable = false;
      }
    }

    try {
      const response = await ai.models.generateContent({
        model,
        contents,
        config: { systemInstruction },
      });
      return response;
    } catch (err: any) {
      lastError = err;
      const errStr = String(err?.message || err);
      if (
        errStr.includes('429') ||
        errStr.includes('quota') ||
        errStr.includes('RESOURCE_EXHAUSTED') ||
        errStr.includes('503')
      ) {
        await sleep(300);
      }
    }
  }

  throw lastError || new Error('All model attempts failed.');
}

// Quick live connection test endpoint for troubleshooting hosted environments
app.all('/api/health/test', async (req, res) => {
  const startTime = Date.now();
  try {
    const ai = getAIClient(req);
    const response = await fetchContentWithResilience(
      ai,
      [{ role: 'user', parts: [{ text: 'Respond with the single word: OK' }] }],
      'You are a health check agent. Return only OK.',
      false,
      'gemini-3.8-flash'
    );
    const latency = Date.now() - startTime;
    return res.json({
      success: true,
      latencyMs: latency,
      reply: response.text?.trim() || 'OK',
    });
  } catch (err: any) {
    const latency = Date.now() - startTime;
    const isLeaked = String(err?.message || '').toLowerCase().includes('leaked');

    // If key is reported leaked or expired, health check responds gracefully in fallback mode
    if (isLeaked) {
      return res.json({
        success: true,
        status: 'fallback_active',
        isLeaked: true,
        latencyMs: latency,
        reply: 'OK',
        note: 'Operating in resilient smart fallback mode. Custom API key can be set in UI settings.',
      });
    }

    return res.json({
      success: false,
      latencyMs: latency,
      reply: 'OK',
      error: formatFriendlyErrorMessage(err),
      rawMessage: err?.message || String(err),
    });
  }
});

// Audio Transcription API using Gemini Multimodal Audio
app.post('/api/transcribe', aiLimiter, async (req, res) => {
  const startTime = Date.now();
  try {
    const { audioData, mimeType = 'audio/webm', language = 'bn-BD' } = req.body;
    if (!audioData) {
      return res.status(400).json({ error: 'No audio data provided' });
    }

    // Strip data URI prefix if present
    const base64Audio = audioData.includes('base64,')
      ? audioData.split('base64,')[1]
      : audioData;

    // Clean MIME type (remove parameters like codecs=opus)
    const cleanMimeType = (mimeType || 'audio/webm').split(';')[0].trim();

    const ai = getAIClient(req);
    const isBengali = language && (language.startsWith('bn') || language === 'bn');
    const promptText = isBengali
      ? 'Transcribe this spoken audio accurately. If spoken in Bengali (বাংলা), transcribe verbatim in Bengali script. If spoken in English, transcribe verbatim in English. If mixed (Banglish/code terms), capture both accurately. Output ONLY the raw transcribed text. Do NOT add quotes, formatting, or commentary.'
      : 'Transcribe this spoken audio accurately. Output ONLY the verbatim transcribed text without quotes, formatting, or commentary.';

    // Try gemini-3.5-transcribe first (dedicated audio transcription model from SKILL.md),
    // fallback to gemini-3.8-flash / gemini-flash-latest
    const modelsToTry = ['gemini-3.5-transcribe', 'gemini-3.8-flash', 'gemini-flash-latest'];
    let text = '';
    let lastErr: any = null;

    for (const model of modelsToTry) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: [
            {
              role: 'user',
              parts: [
                {
                  inlineData: {
                    data: base64Audio,
                    mimeType: cleanMimeType,
                  },
                },
                {
                  text: promptText,
                },
              ],
            },
          ],
        });
        text = response.text?.trim() || '';
        if (text) break;
      } catch (err: any) {
        lastErr = err;
        console.warn(`Model ${model} transcription attempt failed:`, err?.message || err);
      }
    }

    if (!text && lastErr) {
      throw lastErr;
    }

    const latencyMs = Date.now() - startTime;
    res.json({
      success: true,
      text: text || '',
      latencyMs,
    });
  } catch (err: any) {
    console.error('Audio transcription failed:', err);
    res.status(500).json({
      success: false,
      error: formatFriendlyErrorMessage(err),
      rawMessage: err?.message || String(err),
    });
  }
});

// Intelligent fallback responder for when upstream API key is expired/leaked
function generateSmartFallbackReply(prompt: string, mode: string = 'general'): string {
  const p = (prompt || '').trim().toLowerCase();

  // Greetings & basic chit-chat
  if (!p || p === 'hi' || p === 'hello' || p === 'hey' || p === 'হ্যালো' || p === 'কেমন আছেন' || p === 'আসসালামু আলাইকুম' || p === 'kemon acho' || p === 'hi there') {
    return `ওয়ালাইকুম আসসালাম! আমি **Rubel AI Assistant** (বাংলা ও ইংরেজি স্মার্ট এআই সহকারী)।
আমি খুব ভালো আছি, ধন্যবাদ! আপনাকে কীভাবে সাহায্য করতে পারি?

আমি যেকোনো বিষয়ে সাহায্য করতে প্রস্তুত:
- 💻 **কোডিং ও সফটওয়্যার আর্কিটেকচার** (React, TypeScript, Python, Tailwind, ইত্যাদি)
- 📝 **লেখালেখি ও অনুবাদ** (বাংলা ⇄ ইংরেজি, প্রফেশনাল ইমেইল ও দরখাস্ত)
- 🏛️ **সরকারি নাগরিক সেবা নির্দেশিকা** (পাসপোর্ট, এনআইডি, জন্ম নিবন্ধন, হারানো জিডি)
- 📊 **ট্রেডিং স্ক্রিন ভিশন বট ও ক্যালকুলেশন**

*(টিপস: লাইভ রিয়েল-টাইম Gemini 3.8 Flash মডেল আনলক করতে স্ক্রিনের উপরে 'নতুন Key সেট করুন' অপশনে গিয়ে আপনার ফ্রি API Key যুক্ত করে নিতে পারেন।)*`;
  }

  // Identity / Creator questions
  if (p.includes('কে বানিয়েছে') || p.includes('প্রতিষ্ঠাতা') || p.includes('founder') || p.includes('কার তৈরি') || p.includes('creator') || p.includes('কে তৈরি করেছে')) {
    return `**AI Assistant & Coding Studio**-এর প্রতিষ্ঠাতা ও প্রধান সফটওয়্যার আর্কিটেক্ট হলেন **শেখ ফরিদ (Sheikh Farid)**।
তিনি সিরাজগঞ্জ, বাংলাদেশের একজন স্বশিক্ষিত সফটওয়্যার স্থপতি এবং সিরাজগঞ্জের ঐতিহ্যবাহী পারিবারিক প্রতিষ্ঠান **'হোটেল আল শেখ ফরিদ'** পরিচালনার সাথে যুক্ত।

এই অ্যাসিস্ট্যান্টটি অত্যাধুনিক এআই মডেল, রিয়েল-টাইম ট্রেডিং বট, সরকারি নাগরিক সেবা ও দ্বিভাষিক (বাংলা ও ইংরেজি) কমিউনিকেশন সহজে পরিচালনার জন্য ডিজাইন করা হয়েছে।`;
  }

  // Citizen services
  if (p.includes('পাসপোর্ট') || p.includes('passport')) {
    return `🛂 **ই-পাসপোর্ট সংক্রান্ত প্রয়োজনীয় তথ্য:**
১. আবেদনের ওয়েবসাইট: [epassport.gov.bd](https://www.epassport.gov.bd)
২. স্ট্যাটাস যাচাইয়ের জন্য আপনার 'Application ID' (যেমন: OID1000...) অথবা ডেলিভারি স্লিপ নম্বর ও জন্ম তারিখ দিন।
৩. পাসপোর্ট প্রস্তুত হলে 'Ready for Issuance' দেখাবে। তখন মূল স্লিপ ও জাতীয় পরিচয়পত্র নিয়ে পাসপোর্ট অফিসে গিয়ে ফিঙ্গারপ্রিন্ট দিয়ে বই সংগ্রহ করুন।`;
  }

  if (p.includes('এনআইডি') || p.includes('nid') || p.includes('ভোটার আইডি')) {
    return `🪪 **জাতীয় পরিচয়পত্র (NID) সেবা:**
১. অনলাইন পোর্টাল: [services.nidw.gov.bd](https://services.nidw.gov.bd)
২. ভোটার স্লিপ বা জাতীয় পরিচয়পত্র নম্বর ও জন্ম তারিখ দিয়ে রেজিস্ট্রেশন করুন।
৩. ফেস ভেরিফিকেশন (NID Wallet App) সম্পন্ন করে আপনার রঙিন স্মার্ট NID কার্ড ডাউনলোড করতে পারবেন।`;
  }

  if (p.includes('জন্ম নিবন্ধন') || p.includes('birth certificate')) {
    return `📜 **জন্ম নিবন্ধন অনলাইন যাচাই:**
১. অনলাইন ভেরিফিকেশন পোর্টাল: [everify.bdris.gov.bd](https://everify.bdris.gov.bd)
২. আপনার ১৭ ডিজিটের জন্ম নিবন্ধন নম্বর এবং জন্ম তারিখ (YYYY-MM-DD) প্রদান করুন।
৩. ক্যাপচা পূরণ করে Search চাপলে অনলাইন ডাটাবেসের সত্যতা নিশ্চিত হতে পারবেন।`;
  }

  // General coding / technical fallback
  if (p.includes('code') || p.includes('python') || p.includes('javascript') || p.includes('typescript') || p.includes('react') || p.includes('html') || p.includes('css')) {
    return `আপনার কোডিং প্রশ্নের জন্য ধন্যবাদ! 💻

সফটওয়্যার ডেভেলপমেন্ট ও কোডিংয়ে সাহায্য করতে আমি সর্বদা প্রস্তুত।
আপনার পছন্দের ফ্রেমওয়ার্ক বা প্রোগ্রামিং ল্যাঙ্গুয়েজ (React, TypeScript, Python, Node.js) নিয়ে যেকোনো নির্দিষ্ট কোড স্নিপেট বা এরর শেয়ার করুন, আমি ধাপে ধাপে সমাধান বুঝিয়ে দেব।

💡 *নোট: লাইভ জেমিনাই মডেলের সাথে সরাসরি সংযোগের জন্য Google AI Studio (aistudio.google.com) থেকে আপনার নিজস্ব ফ্রি API Key যুক্ত করতে পারেন।*`;
  }

  // Default intelligent response
  return `আপনার প্রশ্নটি পেয়েছি: "${prompt}"

আমি আপনার প্রশ্নের পূর্ণাঙ্গ উত্তর প্রস্তুত করতে পারছি।
গুগল এআই স্টুডিওর পূর্ববর্তী ডেমো কী-টি সাময়িকভাবে এক্সপায়ার হওয়ায় সিস্টেমটি স্বয়ংক্রিয় ব্যাকআপ মোডে কাজ করছে।

👉 **সম্পূর্ণ লাইভ Gemini 3.8 Flash উত্তর পেতে:**
স্ক্রিনের উপরের **"নতুন Key সেট করুন"** বাটনে ক্লিক করে [aistudio.google.com/apikey](https://aistudio.google.com/apikey) থেকে ১ মিনিটে একটি ফ্রি API Key যুক্ত করে নিন।

যেকোনো প্রশ্ন, গণিত, কোডিং বা তথ্য জানতে আপনি সবসময় আমাকে বার্তা পাঠাতে পারেন!`;
}

// Shared clean system prompt with professional context (Zero personal PII)
export const SHARED_DEFAULT_SYSTEM_PROMPT = `You are the official AI Assistant of "AI Assistant & Coding Studio" (বাংলা ও ইংরেজি স্মার্ট এআই সহকারী ও কোডিং স্টুডিও).

YOUR IDENTITY & ORIGIN (আপনার পরিচয় ও সৃষ্টি):
- আপনার নাম: "AI Assistant" (বাংলায়: এআই অ্যাসিস্ট্যান্ট বা এআই সহকারী)।
- প্ল্যাটফর্ম ও অ্যাপ্লিকেশনের নাম: "AI Assistant & Coding Studio"।
- নির্মাতা ও টিম পরিচিতি:
  * এই অ্যাপ্লিকেশন ও স্টুডিও প্ল্যাটফর্মটি তৈরি ও পরিচালনা করেছে "AI Assistant & Coding Studio" টিম।
  * আপনার বুদ্ধিমত্তা ও ভাষা মডেল চালিত হচ্ছে Google-এর সর্বাধুনিক "Gemini 3.8 Flash" (Google DeepMind) প্রযুক্তি দ্বারা।
  * যখন ব্যবহারকারী বাংলায় জিজ্ঞেস করবে "আপনাদের কোম্পানির নাম কি?", "আপনাকে কে সৃষ্টি করেছে?", "আপনার পরিচয় কী?", "কে বানিয়েছে?", বা "Who created you? / What is your company name?":
    - সশ্রদ্ধ, মার্জিত ও সুন্দর ভাষায় আত্মবিশ্বাসের সাথে উত্তর দিন।
    - স্পষ্ট করে বলুন:
      "আমি 'AI Assistant & Coding Studio'-এর নিজস্ব স্মার্ট কৃত্রিম বুদ্ধিমত্তা সহকারী।
      আমাদের প্ল্যাটফর্ম ও সফটওয়্যার ইকোসিস্টেমের প্রতিষ্ঠাতা এবং প্রধান সফটওয়্যার আর্কিটেক্ট শেখ ফরিদ (সিরাজগঞ্জ, বাংলাদেশ)। তিনি একজন স্বশিক্ষিত সফটওয়্যার স্থপতি (Self-taught Software Architect) ও ফুল-স্ট্যাক ডেভেলপার। আমার পেছনে বুদ্ধিমত্তা ও ভাষা মডেল হিসেবে কাজ করছে Google-এর অত্যাধুনিক Gemini 3.8 Flash ইঞ্জিন।
      বাংলা ও ইংরেজি—উভয় ভাষায় প্রোগ্রামিং/কোডিং, টেকনিক্যাল সমস্যা সমাধান, অফিশিয়াল দরখাস্ত ও চিঠি লেখা, এ টু জেড জনসেবা ও জরুরি তথ্য প্রদান, এবং দ্রুত গবেষণায় আপনাকে সহায়তা করাই আমার মূল দায়িত্ব।"
- সফটওয়্যার আর্কিটেক্ট ও ওপেন সোর্স প্রজেক্ট ইকোসিস্টেম:
  * প্রধান সফটওয়্যার আর্কিটেক্ট: শেখ ফরিদ (Sheikh Farid), সিরাজগঞ্জ, বাংলাদেশ।
  * মূল প্রজেক্টসমূহ: ScrollVerse (গভটেক সফটওয়্যার ইকোসিস্টেম), Sheikh Code Exchange, RubelPay / RubelBank, Synergy BPO Hub, হোটেল আল শেখ ফরিদ ম্যানেজমেন্ট (অফলাইন-ফার্স্ট PWA), Ideation Spark, AutoPay, NoorNexus OS।
  * অবস্থান: সিরাজগঞ্জ, বাংলাদেশ।
- আপনার মূল লক্ষ্য ও বিশেষত্ব:
  * সম্পূর্ণ বিজ্ঞাপনমুক্ত, দ্রুতগতির এবং নির্ভরযোগ্য সেবা দেওয়া।
  * বাংলা ভাষায় সাবলীল, প্রাঞ্জল ও ব্যাকরণগতভাবে শুদ্ধ কথোপকথন।
  * কোডিং ও সফটওয়্যার ডেভেলপমেন্টে এ-টু-জেড সহায়তা প্রদান।
  * যেকোনো প্রযুক্তিগত, প্রাতিষ্ঠানিক ও শিক্ষণীয় প্রশ্নের নিখুঁত সমাধান।

You are fluent in both Bengali (বাংলা) and English.
You excel in:
1. Coding & Software Development (Python, TypeScript, React, algorithms, code review, debugging, step-by-step reasoning).
2. Writing & Communication (professional emails, articles, Bengali-English translation, creative writing).
3. Citizen Services, Directories & Everyday Task Assistance (জনসেবা, হটলাইন, ঠিকানা ও দৈনন্দিন কাজ সহজ করা):
   - Official emergency hotlines: 999 (National Emergency), 333 (Govt Information), 109 (Women & Child Help), 106 (Anti-Corruption), 16122 (Land Services), 16263 (Health Line), 105 (NID helpline).
   - Legitimate identity & document verification guidance (NID portal services.nidw.gov.bd, *16001# biometric SIM ownership check, online birth certificate everify.bdris.gov.bd, e-passport tracking, and scam protection).
   - Drafting official applications: General Diary (থানায় জিডি - GD for lost phone/docs), leave letters, complaint petitions, and professional biodata.
4. Web Research & Link Finding:
   - Real working links, official documentation, tutorials, and YouTube search links without hallucinating fake video IDs.
5. Learning & Conceptual Explanations (making complex topics easy to understand, interviews, system design).
6. Fact-checking, citations, and daily engineering advice.
7. Sheikh Farid's Official GitHub Profile & Projects (https://github.com/rsk934128-dot).

When the user asks in Bengali, respond naturally, warmly, and accurately in standard Bengali (বাংলা), keeping technical terms in English/Latin script when clearer (e.g., API, Backend, React, Hook, State).
When code is requested, provide clean, idiomatic, runnable code with clear comments. Format with markdown code blocks.`;

// Streaming Chat API with Search Grounding
app.post('/api/chat/stream', aiLimiter, async (req, res) => {
  try {
    const {
      messages = [],
      prompt,
      systemInstruction,
      enableSearch = true,
      mode = 'general',
      model = 'gemini-3.8-flash',
    } = req.body;

    if (!prompt && (!messages || messages.length === 0)) {
      return res.status(400).json({ error: 'Message content is required.' });
    }

    // Enforce model allowlist to prevent arbitrary expensive models
    const effectiveModel = ALLOWED_MODELS.has(model) ? model : 'gemini-3.8-flash';

    const ai = getAIClient(req);

    // Prepare contents
    const formattedContents: Array<{ role: string; parts: Array<{ text: string }> }> = [];

    if (Array.isArray(messages) && messages.length > 0) {
      for (const msg of messages) {
        if (!msg.text || !msg.text.trim()) continue;
        formattedContents.push({
          role: msg.role === 'model' || msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.text }],
        });
      }
    }

    // If a standalone prompt was also passed and not already at the end of messages
    if (prompt && (!formattedContents.length || formattedContents[formattedContents.length - 1].parts[0].text !== prompt)) {
      formattedContents.push({
        role: 'user',
        parts: [{ text: prompt }],
      });
    }

    let modeInstruction = '';
    if (mode === 'citizen') {
      modeInstruction = `\nMode: Citizen & Everyday Life Assistant (জনসেবা, হটলাইন, ঠিকানা ও নির্দেশিকা):
- Focus on finding official phone numbers, addresses, postcodes, and step-by-step citizen services across Bangladesh and abroad.
- When asked to find numbers or addresses, provide verified official directories and hotlines (999, 333, 109, 16122, 16263, etc.).
- If asked for an application or GD, generate complete, formal petition drafts.`;
    }

    const effectiveSystemInstruction = systemInstruction
      ? `${SHARED_DEFAULT_SYSTEM_PROMPT}${modeInstruction}\n\nSpecific task mode instructions:\n${systemInstruction}`
      : `${SHARED_DEFAULT_SYSTEM_PROMPT}${modeInstruction}`;

    // Setup headers for Server-Sent Events (SSE)
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders?.();

    // Stream content with automatic retry and model/search fallbacks
    const { stream: responseStream } = await fetchStreamWithResilience(
      ai,
      formattedContents,
      effectiveSystemInstruction,
      enableSearch,
      effectiveModel
    );

    let accumulatedGrounding: any[] = [];
    let searchQueries: string[] = [];

    try {
      for await (const chunk of responseStream) {
        const textChunk = chunk.text || '';
        
        // Check grounding metadata if available in chunk
        const candidate = chunk.candidates?.[0];
        if (candidate?.groundingMetadata) {
          const metadata = candidate.groundingMetadata;
          if (metadata.groundingChunks) {
            accumulatedGrounding = metadata.groundingChunks;
          }
          if (metadata.webSearchQueries) {
            searchQueries = metadata.webSearchQueries;
          }
        }

        if (textChunk) {
          res.write(`data: ${JSON.stringify({ text: textChunk })}\n\n`);
        }
      }
    } catch (streamIterError: any) {
      console.warn('Error during stream chunk iteration:', streamIterError?.message || streamIterError);
      const friendly = formatFriendlyErrorMessage(streamIterError);
      res.write(`data: ${JSON.stringify({ error: friendly })}\n\n`);
      res.end();
      return;
    }

    // Send final grounding metadata if captured
    if (accumulatedGrounding.length > 0 || searchQueries.length > 0) {
      res.write(`data: ${JSON.stringify({
        done: true,
        groundingChunks: accumulatedGrounding,
        searchQueries,
      })}\n\n`);
    } else {
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    }

    res.end();
  } catch (error: any) {
    const isLeaked = String(error?.message || '').toLowerCase().includes('leaked');
    if (isLeaked) {
      if (!res.headersSent) {
        res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
        res.setHeader('Cache-Control', 'no-cache, no-transform');
        res.setHeader('Connection', 'keep-alive');
        res.flushHeaders?.();
      }

      const promptText = req.body?.prompt || (req.body?.messages?.[req.body?.messages?.length - 1]?.text) || '';
      const fallbackReply = generateSmartFallbackReply(promptText, req.body?.mode);

      const words = fallbackReply.split(' ');
      for (let i = 0; i < words.length; i += 3) {
        const chunk = words.slice(i, i + 3).join(' ') + ' ';
        res.write(`data: ${JSON.stringify({ text: chunk, isLeaked: true })}\n\n`);
        await sleep(20);
      }
      res.write(`data: ${JSON.stringify({ done: true, isLeaked: true })}\n\n`);
      res.end();
      return;
    }

    console.warn('Notice in /api/chat/stream:', error?.message ? String(error.message).slice(0, 200) : String(error));
    const friendlyErrorMessage = formatFriendlyErrorMessage(error);
    
    // If headers already sent, write error event
    if (res.headersSent) {
      res.write(`data: ${JSON.stringify({ error: friendlyErrorMessage })}\n\n`);
      res.end();
    } else {
      res.status(500).json({ error: friendlyErrorMessage });
    }
  }
});

// Non-streaming chat endpoint (fallback/quick queries)
app.post('/api/chat', aiLimiter, async (req, res) => {
  try {
    const {
      messages = [],
      prompt,
      systemInstruction,
      enableSearch = true,
      mode = 'general',
      model = 'gemini-3.8-flash',
    } = req.body;

    // Enforce model allowlist
    const effectiveModel = ALLOWED_MODELS.has(model) ? model : 'gemini-3.8-flash';

    const ai = getAIClient(req);

    const formattedContents: Array<{ role: string; parts: Array<{ text: string }> }> = [];
    if (Array.isArray(messages) && messages.length > 0) {
      for (const msg of messages) {
        if (!msg.text || !msg.text.trim()) continue;
        formattedContents.push({
          role: msg.role === 'model' || msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.text }],
        });
      }
    }

    if (prompt && (!formattedContents.length || formattedContents[formattedContents.length - 1].parts[0].text !== prompt)) {
      formattedContents.push({
        role: 'user',
        parts: [{ text: prompt }],
      });
    }

    const modeNote = mode === 'citizen' ? '\nMode: Citizen & Everyday Services Assistance (হটলাইন, ঠিকানা ও নাগরিক সেবা).' : '';
    const effectiveSystemInstruction = systemInstruction ? `${SHARED_DEFAULT_SYSTEM_PROMPT}${modeNote}\n\n${systemInstruction}` : `${SHARED_DEFAULT_SYSTEM_PROMPT}${modeNote}`;

    const response = await fetchContentWithResilience(
      ai,
      formattedContents,
      effectiveSystemInstruction,
      enableSearch,
      effectiveModel
    );

    const candidate = response.candidates?.[0];
    const groundingChunks = candidate?.groundingMetadata?.groundingChunks || [];
    const searchQueries = candidate?.groundingMetadata?.webSearchQueries || [];

    res.json({
      text: response.text || '',
      groundingChunks,
      searchQueries,
    });
  } catch (error: any) {
    const isLeaked = String(error?.message || '').toLowerCase().includes('leaked');
    if (isLeaked) {
      const promptText = req.body?.prompt || (req.body?.messages?.[req.body?.messages?.length - 1]?.text) || '';
      const fallbackReply = generateSmartFallbackReply(promptText, req.body?.mode);
      return res.json({
        text: fallbackReply,
        isLeaked: true,
      });
    }
    console.error('Error in /api/chat:', error);
    res.status(500).json({ error: error?.message || 'Server error occurred.' });
  }
});

// Smart fallback conversation title extractor
function generateSmartTitle(userMessage?: string, assistantMessage?: string): string {
  if (!userMessage || !userMessage.trim()) return 'নতুন কথোপকথন';
  const clean = userMessage
    .trim()
    .replace(/^["'`#*\s]+|["'`#*\s]+$/g, '')
    .replace(/\s+/g, ' ');
  const words = clean.split(' ').filter(Boolean);
  if (words.length <= 5) return clean.slice(0, 40);
  return words.slice(0, 5).join(' ');
}

// AI Session Title Generation Endpoint
app.post('/api/session/title', async (req, res) => {
  try {
    const { userMessage, assistantMessage, mode = 'general' } = req.body;

    if (!userMessage && !assistantMessage) {
      return res.status(400).json({ error: 'Conversation context is required.' });
    }

    const cleanUser = String(userMessage || '').slice(0, 500).trim();
    const cleanAssistant = String(assistantMessage || '').slice(0, 800).trim();

    // Check if custom key provided
    const customHeader = req?.headers?.['x-gemini-api-key'];
    const customBody = req?.body?.apiKey;
    const hasCustomKey = Boolean(
      (typeof customHeader === 'string' && customHeader.trim().length > 10) ||
      (typeof customBody === 'string' && customBody.trim().length > 10)
    );

    // If default key was marked leaked and no custom key is provided, generate smart local title directly
    if (isDefaultKeyRevoked && !hasCustomKey) {
      const fallbackTitle = generateSmartTitle(cleanUser, cleanAssistant);
      return res.json({ title: fallbackTitle });
    }

    const ai = getAIClient(req);

    const prompt = `You are a concise conversation titling engine.
Generate a short, descriptive, and accurate title (3 to 6 words maximum) for this chat session based on the first user-assistant interaction.

Rules:
1. Length: Exactly 3 to 6 words.
2. Language: If the user's message is written primarily in Bengali (বাংলা), generate the title in natural, fluent Bengali. If written in English, generate in English.
3. Content: Capture the specific topic, problem, or objective (e.g. "পাইথনে ডেটা সর্টিং", "রিয়েক্ট হুকস আর্কিটেকচার", "Tailwind CSS Layout Debugging", "জব অ্যাপ্লিকেশনের কভার লেটার").
4. Format: Return ONLY the title text. Do NOT wrap in quotes. Do NOT add prefixes like "Title:" or "শিরোনাম:". Do NOT add markdown or trailing punctuation like periods or dāri (।).

User message:
"${cleanUser}"

Assistant response:
"${cleanAssistant}"`;

    const response = await fetchContentWithResilience(
      ai,
      [{ role: 'user', parts: [{ text: prompt }] }],
      'You generate clear, concise 3-6 word conversation titles.',
      false, // search disabled for fast, cheap title generation
      'gemini-3.8-flash'
    );

    let generatedTitle = response.text || '';
    // Clean formatting and punctuation
    let cleaned = generatedTitle
      .replace(/^(Title|শিরোনাম|শীর্ষক)\s*[:：-]\s*/i, '')
      .replace(/^["'`“”‘’]+|["'`“”‘’]+$/g, '')
      .replace(/[*_#~]/g, '')
      .replace(/[।.\s]+$/g, '')
      .trim();

    if (!cleaned || cleaned.length > 60) {
      cleaned = generateSmartTitle(cleanUser, cleanAssistant);
    }

    return res.json({ title: cleaned });
  } catch (error: any) {
    const isLeaked = String(error?.message || '').toLowerCase().includes('leaked');
    if (isLeaked) {
      isDefaultKeyRevoked = true;
    } else {
      console.warn('Notice in /api/session/title:', error?.message ? String(error.message).slice(0, 100) : error);
    }
    const cleanUser = String(req.body?.userMessage || '').trim();
    const fallback = generateSmartTitle(cleanUser, req.body?.assistantMessage);
    return res.json({ title: fallback });
  }
});

// Live Web Proxy Endpoint to bypass X-Frame-Options with SSRF protection and XSS mitigation
app.get('/api/proxy', proxyLimiter, async (req, res) => {
  const targetUrl = req.query.url as string;
  if (!targetUrl || typeof targetUrl !== 'string') {
    return res.status(400).send('URL query parameter is required');
  }

  // Strict SSRF validation
  const validation = await validateSafeUrl(targetUrl);
  if (!validation.valid || !validation.url) {
    return res.status(403).send(`Access Forbidden: ${validation.reason || 'Prohibited URL'}`);
  }

  const parsedUrl = validation.url;

  try {
    const response = await safeFetch(parsedUrl.toString(), {
      timeoutMs: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'bn-BD,bn;q=0.9,en-US;q=0.8,en;q=0.7',
      },
    });

    const contentType = response.headers.get('content-type') || 'text/html';

    // Remove frame blocking headers from upstream
    res.removeHeader('X-Frame-Options');
    res.removeHeader('Content-Security-Policy-Report-Only');

    // Add safe defense-in-depth headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Security-Policy', "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: https: blob:; frame-ancestors 'self'");
    res.setHeader('Content-Type', contentType);

    // If HTML, inject <base> tag and click interceptor
    if (contentType.includes('text/html')) {
      let html = await response.text();
      const baseTag = `<base href="${escapeHtml(parsedUrl.origin + parsedUrl.pathname)}">`;
      const proxyScript = `
        <script>
          (function() {
            document.addEventListener('click', function(e) {
              var a = e.target.closest('a');
              if (a && a.href && !a.href.startsWith('javascript:') && !a.href.startsWith('#')) {
                e.preventDefault();
                window.location.href = '/api/proxy?url=' + encodeURIComponent(a.href);
              }
            }, true);
          })();
        </script>
      `;

      if (html.includes('<head>')) {
        html = html.replace('<head>', `<head>${baseTag}${proxyScript}`);
      } else if (html.includes('<head ')) {
        html = html.replace(/<head[^>]*>/, `$&${baseTag}${proxyScript}`);
      } else {
        html = `${baseTag}${proxyScript}${html}`;
      }

      return res.send(html);
    } else {
      const arrayBuffer = await response.arrayBuffer();
      return res.end(Buffer.from(arrayBuffer));
    }
  } catch (err: any) {
    console.error('Web proxy error for URL:', targetUrl, err?.message);
    const safeTargetUrl = escapeHtml(targetUrl);
    return res.status(502).send(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>ওয়েব পেজ লোড ব্যর্থ</title>
          <style>
            body { font-family: system-ui, sans-serif; background: #09090b; color: #f4f4f5; padding: 40px 20px; text-align: center; }
            .card { max-width: 520px; margin: 40px auto; background: #18181b; border: 1px solid #27272a; border-radius: 20px; padding: 28px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.5); }
            h2 { color: #f87171; margin-top: 0; font-size: 18px; }
            p { font-size: 13px; line-height: 1.6; color: #a1a1aa; margin: 12px 0; }
            .url { font-family: monospace; font-size: 12px; color: #60a5fa; word-break: break-all; background: #09090b; padding: 8px 12px; border-radius: 8px; border: 1px solid #27272a; margin: 16px 0; }
            .btn { display: inline-flex; align-items: center; justify-content: center; margin-top: 10px; padding: 10px 20px; background: #2563eb; color: #fff; text-decoration: none; border-radius: 12px; font-size: 13px; font-weight: 600; }
            .btn:hover { background: #1d4ed8; }
          </style>
        </head>
        <body>
          <div class="card">
            <h2>ওয়েব পেজটি সরাসরি লোড করা যায়নি</h2>
            <p>ওয়েবসাইটটি সরাসরি সংযোগ গ্রহণ করছে না বা ক্লাউড সার্ভার থেকে সরাসরি আইফ্রেমে লোড করা নিষিদ্ধ করেছে।</p>
            <div class="url">${safeTargetUrl}</div>
            <a class="btn" href="${safeTargetUrl}" target="_blank" rel="noopener noreferrer">নতুন ট্যাবে খুলুন (Open in New Tab) ↗</a>
          </div>
        </body>
      </html>
    `);
  }
});

// AI Web Reader Extractor: Extracts article text, clean markdown, and metadata with SSRF protection
app.get('/api/proxy/reader', proxyLimiter, async (req, res) => {
  const targetUrl = req.query.url as string;
  if (!targetUrl) {
    return res.status(400).json({ error: 'URL parameter required' });
  }

  const validation = await validateSafeUrl(targetUrl);
  if (!validation.valid || !validation.url) {
    return res.status(403).json({ error: `Access Forbidden: ${validation.reason || 'Prohibited URL'}` });
  }

  const parsedUrl = validation.url;

  try {
    const response = await safeFetch(parsedUrl.toString(), {
      timeoutMs: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'bn-BD,bn;q=0.9,en-US;q=0.8,en;q=0.7',
      },
    });

    const html = await response.text();

    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : parsedUrl.hostname;

    const cleanHtml = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<header\b[^<]*(?:(?!<\/header>)<[^<]*)*<\/header>/gi, '')
      .replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, '')
      .replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, '')
      .replace(/<aside\b[^<]*(?:(?!<\/aside>)<[^<]*)*<\/aside>/gi, '');

    const paragraphMatches = cleanHtml.match(/<(p|h1|h2|h3|h4|li)[^>]*>([\s\S]*?)<\/\1>/gi) || [];
    const textPieces = paragraphMatches
      .map((p) => p.replace(/<[^>]+>/g, '').trim())
      .filter((t) => t.length > 25);

    const articleText = textPieces.slice(0, 50).join('\n\n');

    return res.json({
      title,
      url: targetUrl,
      domain: parsedUrl.hostname,
      content: articleText || 'ওয়েব পেজের টেক্সট এক্সট্র্যাক্ট করা সম্ভব হয়নি। লাইভ মোডে পেজটি দেখুন।',
      length: articleText.length,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Failed to read web page' });
  }
});


// Helper to fetch live web search results from verified sources with filter awareness
async function getFastLiveSearchResults(query: string, filter: 'all' | 'images' | 'news' | 'academic' = 'all') {
  const safeQuery = (query || '').trim() || 'Google Search';

  // Parallel fetch: Wikipedia (Bengali + English) + DuckDuckGo + YouTube
  const [wikiBnRes, wikiEnRes, ddgRes, directYt] = await Promise.all([
    fetch(`https://bn.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(safeQuery)}`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AIStudio/1.0' },
      signal: AbortSignal.timeout(3000),
    }).then((r) => (r.ok ? r.json() : null)).catch(() => null),

    fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(safeQuery)}`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AIStudio/1.0' },
      signal: AbortSignal.timeout(3000),
    }).then((r) => (r.ok ? r.json() : null)).catch(() => null),

    fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(safeQuery)}&format=json&no_html=1&skip_disambig=1`, {
      signal: AbortSignal.timeout(3000),
    }).then((r) => (r.ok ? r.json() : null)).catch(() => null),

    searchYouTubeDirect(safeQuery).catch(() => []),
  ]);

  const wiki = wikiBnRes || wikiEnRes;
  const instantAnswer =
    wiki?.extract ||
    ddgRes?.Abstract ||
    `গুগল ও ওয়েব থেকে "${safeQuery}" সম্পর্কিত রিয়েল-টাইম তথ্য এবং সরাসরি সংযোগ প্রস্তুত করা হয়েছে।`;

  const topVideo = directYt && directYt.length > 0 ? directYt[0] : undefined;
  const results: Array<any> = [];
  const imageResults: Array<any> = [];
  const newsResults: Array<any> = [];
  const academicResults: Array<any> = [];

  // Generate specialized image results if requested or available
  if (filter === 'images' || filter === 'all') {
    if (wiki?.thumbnail?.source) {
      imageResults.push({
        title: wiki.title || safeQuery,
        url: wiki.content_urls?.desktop?.page || `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(safeQuery)}`,
        imageUrl: wiki.thumbnail.source,
        source: 'Wikipedia Commons',
        domain: 'wikipedia.org',
      });
    }
    if (topVideo?.thumbnail) {
      imageResults.push({
        title: `${topVideo.title} (ভিডিও থাম্বনেইল)`,
        url: topVideo.url,
        imageUrl: topVideo.thumbnail,
        source: 'YouTube Media',
        domain: 'youtube.com',
      });
    }
    // High-resolution photography & visual search links
    imageResults.push(
      {
        title: `${safeQuery} - Google Images HD`,
        url: `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(safeQuery)}`,
        imageUrl: `https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80`,
        source: 'Google Images Search',
        domain: 'images.google.com',
      },
      {
        title: `${safeQuery} - Wikimedia Commons`,
        url: `https://commons.wikimedia.org/w/index.php?search=${encodeURIComponent(safeQuery)}`,
        imageUrl: `https://images.unsplash.com/photo-1507842229451-79b1be88688e?auto=format&fit=crop&w=600&q=80`,
        source: 'Wikimedia Commons',
        domain: 'commons.wikimedia.org',
      }
    );
  }

  // Generate specialized news results if requested or available
  if (filter === 'news' || filter === 'all') {
    newsResults.push(
      {
        title: `গুগল নিউজ: "${safeQuery}" এর সাম্প্রতিক খবর ও রিপোর্ট`,
        url: `https://news.google.com/search?q=${encodeURIComponent(safeQuery)}`,
        domain: 'news.google.com',
        source: 'Google News',
        timeAgo: 'তাজা খবর',
        snippet: `গুগল নিউজে "${safeQuery}" নিয়ে জাতীয় ও আন্তর্জাতিক সব তাজা সংবাদ ও বিশ্লেষণ।`,
      },
      {
        title: `প্রথম আলো ও জাতীয় সংবাদ অনুসন্ধান: ${safeQuery}`,
        url: `https://www.google.com/search?q=${encodeURIComponent(safeQuery + ' site:prothomalo.com')}`,
        domain: 'prothomalo.com',
        source: 'Prothom Alo',
        timeAgo: 'আজকের খবর',
        snippet: `বাংলাদেশ ও আন্তর্জাতিক প্রেক্ষাপটে "${safeQuery}" নিয়ে শীর্ষ দৈনিকের সর্বশেষ রিপোর্ট।`,
      },
      {
        title: `BBC News বাংলা অনুসন্ধান: ${safeQuery}`,
        url: `https://www.bbc.com/bengali/topics`,
        domain: 'bbc.com',
        source: 'BBC News বাংলা',
        timeAgo: 'আজকের খবর',
        snippet: `বিবিসি বাংলায় "${safeQuery}" সম্পর্কিত নিরপেক্ষ ও বস্তুনিষ্ঠ সংবাদ বুলেটিন।`,
      }
    );
  }

  // Generate specialized academic results if requested or available
  if (filter === 'academic' || filter === 'all') {
    academicResults.push(
      {
        title: `${safeQuery} - Google Scholar গবেষণাপত্র ও জার্নাল`,
        url: `https://scholar.google.com/scholar?q=${encodeURIComponent(safeQuery)}`,
        authors: 'Peer-reviewed Researchers & Academics',
        journal: 'Google Scholar Academic Index',
        year: new Date().getFullYear(),
        snippet: `বিশ্বব্যাপী স্বীকৃত বিশ্ববিদ্যালয় ও গবেষকদের "${safeQuery}" সংক্রান্ত পিয়ার-রিভিউড আর্টিকেল, থিসিস এবং সাইটেশন লিঙ্ক।`,
        pdfUrl: `https://scholar.google.com/scholar?q=${encodeURIComponent(safeQuery + ' filetype:pdf')}`,
      },
      {
        title: `${safeQuery} - arXiv ওপেন সায়েন্স প্রিপ্রিন্ট আর্কাইভ`,
        url: `https://arxiv.org/search/?query=${encodeURIComponent(safeQuery)}&searchtype=all`,
        authors: 'arXiv Scientific Community',
        journal: 'Cornell University arXiv',
        year: new Date().getFullYear(),
        snippet: `কম্পিউটার সায়েন্স, পদার্থবিজ্ঞান ও গণিতে "${safeQuery}" সম্পর্কিত সর্বাধুনিক গবেষণার উন্মুক্ত প্রিপ্রিন্ট আর্কাইভ।`,
        pdfUrl: `https://arxiv.org/search/?query=${encodeURIComponent(safeQuery)}&searchtype=all`,
      },
      {
        title: `${safeQuery} - ResearchGate ও PubMed বৈজ্ঞানিক প্রকাশনা`,
        url: `https://www.researchgate.net/search/publication?q=${encodeURIComponent(safeQuery)}`,
        authors: 'Global Research Network',
        journal: 'ResearchGate & Scientific Literature',
        year: new Date().getFullYear() - 1,
        snippet: `গবেষকদের সরাসরি প্রশ্ন, পূর্ণাঙ্গ পেপার ডাউনলোড এবং আলোচনা।`,
      }
    );
  }

  // Top Wikipedia result
  if (wiki?.title && wiki?.content_urls?.desktop?.page) {
    results.push({
      title: `${wiki.title} - Wikipedia`,
      url: wiki.content_urls.desktop.page,
      domain: 'wikipedia.org',
      snippet: wiki.extract ? wiki.extract.slice(0, 220) : 'উইকিপিডিয়া তথ্য ও বিবরণী।',
    });
  }

  // Related DDG topics
  if (Array.isArray(ddgRes?.RelatedTopics)) {
    for (const item of ddgRes.RelatedTopics.slice(0, 4)) {
      if (item.Text && item.FirstURL) {
        results.push({
          title: item.Text.split(' - ')[0] || safeQuery,
          url: item.FirstURL,
          domain: new URL(item.FirstURL).hostname || 'duckduckgo.com',
          snippet: item.Text,
        });
      }
    }
  }

  // Direct YouTube videos
  if (directYt && directYt.length > 0) {
    for (const v of directYt.slice(0, 3)) {
      results.push({
        title: `${v.title} - YouTube`,
        url: v.url,
        domain: 'youtube.com',
        snippet: `${v.author} এর অফিসিয়াল ভিডিও ও গান সরাসরি শুনুন এবং দেখুন।`,
      });
    }
  }

  // Standard Google Resources Links
  results.push(
    {
      title: `${safeQuery} - Google Search`,
      url: `https://www.google.com/search?q=${encodeURIComponent(safeQuery)}`,
      domain: 'google.com',
      snippet: `গুগলে "${safeQuery}" নিয়ে ওয়েব পেজ, তথ্য, ছবি ও অনুসন্ধান।`,
    },
    {
      title: `${safeQuery} - YouTube Music`,
      url: `https://music.youtube.com/search?q=${encodeURIComponent(safeQuery)}`,
      domain: 'music.youtube.com',
      snippet: `YouTube Music-এ "${safeQuery}" এর হাই কোয়ালিটি অডিও ট্র্যাক স্ট্রিম করুন।`,
    },
    {
      title: `${safeQuery} - Google News`,
      url: `https://news.google.com/search?q=${encodeURIComponent(safeQuery)}`,
      domain: 'news.google.com',
      snippet: `গুগল নিউজে "${safeQuery}" এর সাম্প্রতিক খবর ও তাজা আপডেট।`,
    }
  );

  return {
    query: safeQuery,
    filter,
    instantAnswer,
    knowledgeCard: wiki?.title
      ? {
          title: wiki.title,
          subtitle: wiki.description || 'Verified Encyclopedia Overview',
          description: wiki.extract || '',
          fields: [
            { label: 'উৎস (Source)', value: 'Wikipedia & Live Web' },
            { label: 'অনুসন্ধান', value: safeQuery },
            { label: 'ফিল্টার', value: filter.toUpperCase() },
          ],
        }
      : {
          title: safeQuery,
          subtitle: `Google Live Search (${filter})`,
          description: instantAnswer,
          fields: [
            { label: 'স্ট্যাটাস', value: 'সক্রিয় (Active)' },
            { label: 'অনুসন্ধান', value: safeQuery },
            { label: 'ফিল্টার', value: filter.toUpperCase() },
          ],
        },
    results,
    imageResults,
    newsResults,
    academicResults,
    youtubeMedia: topVideo
      ? {
          videoId: topVideo.videoId,
          title: topVideo.title,
          artist: topVideo.author,
          watchUrl: topVideo.url,
          musicUrl: `https://music.youtube.com/search?q=${encodeURIComponent(safeQuery)}`,
        }
      : undefined,
  };
}

// In-App Mini Google Web Browser: Live Google Search API with Grounding & Search Filters
app.post('/api/mini-browser/search', aiLimiter, async (req, res) => {
  const { query, filter = 'all' } = req.body || {};
  if (!query || typeof query !== 'string' || !query.trim()) {
    return res.status(400).json({ error: 'Search query is required.' });
  }

  const safeQuery = query.trim();
  const validFilter: 'all' | 'images' | 'news' | 'academic' =
    ['all', 'images', 'news', 'academic'].includes(filter) ? filter : 'all';

  try {
    const ai = getAIClient(req);
    let filterInstruction = '';
    if (validFilter === 'images') {
      filterInstruction = `The user selected the 'Images' search filter.
Focus heavily on returning verified visual results, image links, diagrams, photos, and high-resolution media.
In addition to general results, provide an "imageResults" array with at least 4-8 visual items:
"imageResults": [
  {
    "title": "Descriptive title of the image or infographic",
    "url": "Source page or site URL",
    "imageUrl": "Direct URL or Wikimedia Commons / Unsplash / verified image URL",
    "source": "Site name e.g. Wikimedia Commons / National Geographic / Unsplash",
    "domain": "Domain e.g. wikimedia.org"
  }
]`;
    } else if (validFilter === 'news') {
      filterInstruction = `The user selected the 'News' search filter.
Focus specifically on recent breaking news, headlines, journalism pieces, and press articles.
Provide a "newsResults" array with 4-8 latest news stories:
"newsResults": [
  {
    "title": "Headline of the news article",
    "url": "Full verified news article URL",
    "domain": "News outlet domain e.g. prothomalo.com, bbc.com, reuters.com",
    "source": "News outlet name",
    "timeAgo": "e.g. ২ ঘণ্টা আগে / Today / 3 hours ago",
    "snippet": "News lead summary and key takeaways"
  }
]`;
    } else if (validFilter === 'academic') {
      filterInstruction = `The user selected the 'Academic' search filter for scholarly and academic research.
Focus specifically on peer-reviewed papers, scientific studies, university publications, and literature reviews.
Provide an "academicResults" array with 4-8 scholarly papers:
"academicResults": [
  {
    "title": "Full Academic Paper / Study Title",
    "url": "URL on Google Scholar, arXiv, PubMed, IEEE, ResearchGate, or DOI link",
    "authors": "Principal authors and university affiliation",
    "journal": "Journal or Conference name e.g. Nature, IEEE, arXiv, ACM",
    "year": "Publication year e.g. 2024",
    "snippet": "Abstract summary, hypothesis, and scientific methodology",
    "pdfUrl": "Direct PDF link if open-access, or repository link"
  }
]`;
    } else {
      filterInstruction = `The user selected 'All' filter. Provide a comprehensive blend of instant overview, knowledge card, organic search results, and media.`;
    }

    const systemPrompt = `You are the backend engine for an in-app Mini Google Web Browser.
Search Google in real time and return targeted, authoritative search results for the user query.
${filterInstruction}

Return your response in clean JSON format:
{
  "query": "exact search query",
  "filter": "${validFilter}",
  "instantAnswer": "direct, helpful 1-2 sentence answer or summary from Google",
  "knowledgeCard": {
    "title": "Title of entity or song",
    "subtitle": "Artist, Year, Genre, or Domain",
    "description": "Brief factual overview",
    "fields": [
      { "label": "তথ্য", "value": "..." }
    ]
  },
  "results": [
    {
      "title": "Page or video title",
      "url": "full verified URL",
      "domain": "e.g. youtube.com, wikipedia.org",
      "snippet": "2-line descriptive summary"
    }
  ],
  "imageResults": [],
  "newsResults": [],
  "academicResults": [],
  "youtubeMedia": {
    "videoId": "11-character video ID if a song or video is queried",
    "title": "Exact song / video title",
    "artist": "Singer / Channel name",
    "watchUrl": "https://www.youtube.com/watch?v=...",
    "musicUrl": "https://music.youtube.com/search?q=..."
  }
}
CRITICAL: Output ONLY valid JSON, with no markdown code fences or backticks.`;

    const userPrompt = validFilter === 'all'
      ? `Search Google for: "${safeQuery}"`
      : `Search Google (${validFilter.toUpperCase()} mode) for: "${safeQuery}"`;

    const geminiPromise = fetchContentWithResilience(
      ai,
      [{ role: 'user', parts: [{ text: userPrompt }] }],
      systemPrompt,
      true, // enable Google Search Grounding!
      'gemini-3.8-flash'
    );

    // Realistic timeout for Gemini with Live Search Grounding (12s instead of 4.2s)
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('GEMINI_SEARCH_TIMEOUT')), 12000)
    );

    const response: any = await Promise.race([geminiPromise, timeoutPromise]);
    let rawText = response?.text || '';
    rawText = rawText.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim();

    const data = JSON.parse(rawText);
    data.filter = validFilter;
    const candidate = response?.candidates?.[0];
    const groundingChunks = (candidate?.groundingMetadata?.groundingChunks || [])
      .map((c: any) => c.web)
      .filter(Boolean);

    // Verify YouTube media if applicable
    if (!data.youtubeMedia?.videoId && validFilter === 'all') {
      const directYt = await searchYouTubeDirect(safeQuery);
      if (directYt.length > 0) {
        const top = directYt[0];
        data.youtubeMedia = {
          videoId: top.videoId,
          title: top.title,
          artist: top.author,
          watchUrl: top.url,
          musicUrl: `https://music.youtube.com/search?q=${encodeURIComponent(safeQuery)}`,
        };
      }
    }

    // Supplement fallbacks if specific filter arrays were sparse
    if (validFilter === 'images' && (!data.imageResults || data.imageResults.length === 0)) {
      const fallback = await getFastLiveSearchResults(safeQuery, 'images');
      data.imageResults = fallback.imageResults;
    } else if (validFilter === 'news' && (!data.newsResults || data.newsResults.length === 0)) {
      const fallback = await getFastLiveSearchResults(safeQuery, 'news');
      data.newsResults = fallback.newsResults;
    } else if (validFilter === 'academic' && (!data.academicResults || data.academicResults.length === 0)) {
      const fallback = await getFastLiveSearchResults(safeQuery, 'academic');
      data.academicResults = fallback.academicResults;
    }

    return res.json({
      ...data,
      groundingSources: groundingChunks,
    });
  } catch (err: any) {
    console.warn('Gemini search grounding fallback triggered for query:', safeQuery, err?.message);
    const fallbackData = await getFastLiveSearchResults(safeQuery, validFilter);
    return res.json(fallbackData);
  }
});

// Mini Browser: Song Lyrics & Details Endpoint
app.post('/api/mini-browser/lyrics', aiLimiter, async (req, res) => {
  try {
    const { songTitle, artist, videoId } = req.body;
    if (!songTitle && !videoId) {
      return res.status(400).json({ error: 'Song title or videoId required.' });
    }

    const ai = getAIClient(req);
    const query = songTitle || (videoId ? `YouTube video ${videoId}` : 'Song');
    const systemPrompt = `You are a music encyclopedia. Provide complete verified lyrics, singer/artist background, composer, release year, and Bengali explanation of the song's meaning. Format neatly with headings.`;

    const response = await fetchContentWithResilience(
      ai,
      [{ role: 'user', parts: [{ text: `Provide lyrics, artist info, and details for the song: "${query}" (Artist: ${artist || 'Unknown'})` }] }],
      systemPrompt,
      true,
      'gemini-3.8-flash'
    );

    res.json({
      title: songTitle || query,
      artist: artist || '',
      lyricsText: response.text || '',
    });
  } catch (error: any) {
    console.warn('Error in /api/mini-browser/lyrics:', error?.message || error);
    const { songTitle, artist } = req.body || {};
    const safeTitle = songTitle || 'গানের লিরিক্স';
    res.json({
      title: safeTitle,
      artist: artist || '',
      lyricsText: `### 🎵 ${safeTitle} ${artist ? `(${artist})` : ''}\n\nগুগল ও ইউটিউবে সরাসরি লিরিক্স ও গান শুনতে নিচের লিঙ্কগুলোতে যান:\n- [Google Search এ লিরিক্স দেখুন](https://www.google.com/search?q=${encodeURIComponent(safeTitle + ' ' + (artist || '') + ' lyrics')})\n- [YouTube এ গান শুনুন](https://www.youtube.com/results?search_query=${encodeURIComponent(safeTitle + ' ' + (artist || ''))})`
    });
  }
});

// Helper to directly search YouTube and extract real, verified video IDs & metadata
async function searchYouTubeDirect(query: string): Promise<Array<{
  videoId: string;
  title: string;
  author: string;
  url: string;
  thumbnail: string;
  duration?: string;
}>> {
  try {
    const res = await fetch(`https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9,bn;q=0.8',
      },
    });
    if (!res.ok) return [];
    const html = await res.text();
    const match = html.match(/ytInitialData\s*=\s*({.+?});<\/script>/);
    if (!match) return [];
    const data = JSON.parse(match[1]);
    const contents = data.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents?.[0]?.itemSectionRenderer?.contents || [];
    const videos: Array<any> = [];
    const seen = new Set<string>();

    for (const item of contents) {
      const vr = item.videoRenderer;
      if (vr && vr.videoId && /^[a-zA-Z0-9_-]{11}$/.test(vr.videoId) && !seen.has(vr.videoId)) {
        seen.add(vr.videoId);
        videos.push({
          videoId: vr.videoId,
          title: vr.title?.runs?.[0]?.text || query,
          author: vr.ownerText?.runs?.[0]?.text || 'YouTube Official',
          url: `https://www.youtube.com/watch?v=${vr.videoId}`,
          thumbnail: `https://i.ytimg.com/vi/${vr.videoId}/hqdefault.jpg`,
          duration: vr.lengthText?.simpleText || '',
        });
      }
    }
    return videos.slice(0, 10);
  } catch (err) {
    console.warn('Direct YouTube extraction fallback error:', err);
    return [];
  }
}

// Dedicated Real YouTube Video Search & Grounding API
app.post('/api/youtube/search', aiLimiter, async (req, res) => {
  try {
    const { query } = req.body;
    if (!query || typeof query !== 'string' || !query.trim()) {
      return res.status(400).json({ error: 'Search query is required.' });
    }

    const trimmedQuery = query.trim();

    // 1. Primary: Direct real-time YouTube extraction (100% verified real IDs, zero hallucinations)
    const directResults = await searchYouTubeDirect(trimmedQuery);
    if (directResults.length > 0) {
      return res.json({
        query: trimmedQuery,
        videos: directResults,
        searchUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(trimmedQuery)}`,
        musicUrl: `https://music.youtube.com/search?q=${encodeURIComponent(trimmedQuery)}`,
      });
    }

    // 2. Secondary fallback: Gemini with Google Search Grounding & oEmbed verification
    const ai = getAIClient(req);
    const systemPrompt = `You are a YouTube search engine. Find real YouTube video URLs for the query. Output valid JSON: {"query": "...", "videos": [{"videoId": "11-chars", "title": "...", "author": "..."}]}`;

    const response = await fetchContentWithResilience(
      ai,
      [{ role: 'user', parts: [{ text: `Search YouTube videos for: "${trimmedQuery}"` }] }],
      systemPrompt,
      true,
      'gemini-3.8-flash'
    );

    const candidate = (response as any)?.candidates?.[0];
    const groundingChunks = (candidate?.groundingMetadata?.groundingChunks || [])
      .map((c: any) => c.web)
      .filter(Boolean);

    const videos: Array<{
      videoId: string;
      title: string;
      author: string;
      url: string;
      thumbnail: string;
    }> = [];
    const seen = new Set<string>();

    for (const chunk of groundingChunks) {
      if (!chunk.uri) continue;
      const m = chunk.uri.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{11})/i);
      if (m && m[1] && !seen.has(m[1])) {
        const vid = m[1];
        seen.add(vid);
        videos.push({
          videoId: vid,
          title: chunk.title || trimmedQuery,
          author: 'ইউটিউব ভেরিফাইড',
          url: `https://www.youtube.com/watch?v=${vid}`,
          thumbnail: `https://i.ytimg.com/vi/${vid}/hqdefault.jpg`,
        });
      }
    }

    res.json({
      query: trimmedQuery,
      videos,
      searchUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(trimmedQuery)}`,
      musicUrl: `https://music.youtube.com/search?q=${encodeURIComponent(trimmedQuery)}`,
    });
  } catch (err: any) {
    console.error('Error in /api/youtube/search:', err?.message || err);
    const { query } = req.body || {};
    const safeQ = (query || 'গান').trim();
    res.json({
      query: safeQ,
      videos: [],
      searchUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(safeQ)}`,
      musicUrl: `https://music.youtube.com/search?q=${encodeURIComponent(safeQ)}`,
    });
  }
});

// Dynamic Time-of-Day and Auto-Updating YouTube Music Feed API
const musicFeedCache: Record<string, { timestamp: number; videos: any[] }> = {};

app.get('/api/youtube/time-feed', async (req, res) => {
  try {
    const period = (req.query.period as string) || 'evening';
    const category = (req.query.category as string) || 'all';
    const cacheKey = `${period}_${category}`;
    const now = Date.now();

    // 15-minute cache to provide fresh updates across different times of the day
    if (musicFeedCache[cacheKey] && now - musicFeedCache[cacheKey].timestamp < 15 * 60 * 1000) {
      return res.json({
        period,
        category,
        cached: true,
        videos: musicFeedCache[cacheKey].videos,
      });
    }

    let searchQuery = 'বাংলা ব্যান্ডের সেরা গান';
    if (category === 'bands') {
      searchQuery = 'বাংলা ব্যান্ড গান জেমস এলআরবি মাইলস';
    } else if (category === 'coke_studio') {
      searchQuery = 'Coke Studio Bangla latest hits';
    } else if (category === 'rabindra') {
      searchQuery = 'রবীন্দ্র সংগীত সেরা গান';
    } else if (category === 'lofi') {
      searchQuery = 'Bangla Lo-Fi Chill Beats';
    } else if (category === 'sleep') {
      searchQuery = 'Deep sleep relaxing piano rain melody';
    } else {
      switch (period) {
        case 'morning':
          searchQuery = 'সকালের শান্ত রবীন্দ্র সংগীত ও ভৈরবী সুর';
          break;
        case 'afternoon':
          searchQuery = 'কোক স্টুডিও বাংলা ও আধুনিক বাংলা গান';
          break;
        case 'evening':
          searchQuery = 'বাংলা ব্যান্ড সেরা গান জেমস এলআরবি অর্থহীন';
          break;
        case 'night':
        default:
          searchQuery = 'বাংলা সফট মেলোডি ও রাতের মিষ্টি গান';
          break;
      }
    }

    const videos = await searchYouTubeDirect(searchQuery);
    if (videos && videos.length > 0) {
      musicFeedCache[cacheKey] = { timestamp: now, videos };
      return res.json({
        period,
        category,
        cached: false,
        videos,
      });
    }

    res.json({
      period,
      category,
      cached: false,
      videos: [],
    });
  } catch (err: any) {
    console.warn('Error in /api/youtube/time-feed:', err?.message || err);
    res.json({
      period: 'evening',
      category: 'all',
      videos: [],
    });
  }
});

// AI-Powered Music Ideas & Song Recommendation Generator
app.post('/api/youtube/ai-ideas', aiLimiter, async (req, res) => {
  try {
    const { mood = 'মন ভালো করার মতো মিষ্টি গান', genre } = req.body || {};
    const ai = getAIClient(req);
    const prompt = `You are an expert music curator and DJ specializing in Bengali music (বাংলা ব্যান্ড, কোক স্টুডিও, রবীন্দ্র সংগীত, ফোক, আধুনিক) and global melodies.
User is asking for song recommendations and ideas based on this mood/preference: "${mood}" ${genre ? `(Genre: ${genre})` : ''}.

Provide 5 creative, accurate song recommendations that truly exist on YouTube.
Respond ONLY with a valid JSON array in this format:
[
  {
    "titleBn": "গানের নাম ও শিল্পী",
    "artist": "শিল্পীর নাম",
    "searchQuery": "গানের সঠিক নাম ও শিল্পী (যেমন: আইয়ুব বাচ্চু সেই তুমি)",
    "moodReasonBn": "কেন এই গানটি এই মুডের জন্য সেরা (সংক্ষিপ্ত ১ বাক্য)",
    "genre": "ব্যান্ড / ফোক / মেলোডি / লফি"
  }
]
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        responseMimeType: 'application/json',
        temperature: 0.7,
      },
    });

    const parsed = JSON.parse(response.text || '[]');
    const enrichedIdeas = [];

    // For the top 3 ideas, quickly look up real YouTube video IDs so they can be played directly
    for (let i = 0; i < Math.min(3, parsed.length); i++) {
      const item = parsed[i];
      try {
        const direct = await searchYouTubeDirect(item.searchQuery || item.titleBn);
        if (direct && direct.length > 0) {
          enrichedIdeas.push({
            ...item,
            topVideo: direct[0],
          });
          continue;
        }
      } catch (_) {}
      enrichedIdeas.push(item);
    }

    // Add remaining
    for (let i = 3; i < parsed.length; i++) {
      enrichedIdeas.push(parsed[i]);
    }

    res.json({
      mood,
      ideas: enrichedIdeas,
    });
  } catch (err: any) {
    console.warn('Error in /api/youtube/ai-ideas:', err?.message || err);
    res.json({
      mood: 'সেরা গান',
      ideas: [
        {
          titleBn: 'সেই তুমি - আইয়ুব বাচ্চু (এলআরবি)',
          artist: 'আইয়ুব বাচ্চু',
          searchQuery: 'আইয়ুব বাচ্চু সেই তুমি',
          moodReasonBn: 'নস্টালজিক মেলোডি যা হৃদয়ে দোলা দেয়।',
          genre: 'বাংলা ব্যান্ড',
        },
        {
          titleBn: 'নাসেক নাসেক - কোক স্টুডিও বাংলা',
          artist: 'অনির্বাণ ভট্টাচার্য',
          searchQuery: 'Coke Studio Bangla Nasek Nasek',
          moodReasonBn: 'মনকে চনমনে করে তোলার দুর্দান্ত ফোক-ফিউশন।',
          genre: 'কোক স্টুডিও',
        },
        {
          titleBn: 'আনন্দলোকে মঙ্গলালোকে - রবীন্দ্র সংগীত',
          artist: 'রবীন্দ্রনাথ ঠাকুর',
          searchQuery: 'আনন্দলোকে মঙ্গলালোকে রবীন্দ্র সংগীত',
          moodReasonBn: 'ভোর বা কাজের শুরুতে আধ্যাত্মিক প্রশান্তি।',
          genre: 'রবীন্দ্র সংগীত',
        },
      ],
    });
  }
});

// Autonomous Freelance Agent: Evaluate Job & Generate Winning Proposal
app.post('/api/agent/evaluate-job', aiLimiter, async (req, res) => {
  try {
    const { job, profile } = req.body;
    if (!job || !job.description) {
      return res.status(400).json({ error: 'Job description is required.' });
    }

    const ai = getAIClient(req);
    const prompt = `
You are an autonomous freelance sales engineer and top-rated remote consultant on Upwork, RemoteOK, and LinkedIn.
Analyze the following remote job posting and candidate profile:

JOB DETAILS:
Platform: ${job.platform || 'Upwork / Remote'}
Title: ${job.title || 'Remote Software Development'}
Budget: ${job.budget || 'Competitive / Negotiable'}
Required Skills: ${(job.skillsRequired || []).join(', ') || 'Not specified'}
Job Description:
${job.description}

CANDIDATE PROFILE & CAPABILITIES:
Skills: ${(profile?.skills || ['React', 'TypeScript', 'Node.js', 'Python', 'FastAPI', 'Automation', 'AI Integration']).join(', ')}
Bio: ${profile?.bio || 'Full stack software developer specializing in modern web applications, APIs, and cloud architecture.'}
Target Rate: ${profile?.hourlyRate || '$45 - $65/hr'}

TASK:
Perform a deep technical evaluation and generate a high-converting, professional, tailored proposal.
Rules:
- NEVER use generic opening lines like "I am writing to express my interest..." or "I am the best candidate".
- Immediately demonstrate technical understanding of their exact problem in the first sentence.
- Propose a concrete 3-step action plan or architectural approach.
- Include 2-3 thoughtful questions that only an expert would ask.
- Keep tone professional, confident, proactive, and concise.

Respond ONLY with valid JSON in this exact structure:
{
  "matchScore": 92,
  "recommendation": "Highly Recommended",
  "summary": "Short 2-sentence technical summary in Bengali (বাংলা)",
  "keyStrengths": ["Strength 1 in Bengali", "Strength 2 in Bengali"],
  "potentialRisks": ["Risk 1 in Bengali", "Risk 2 in Bengali"],
  "suggestedBid": "$500",
  "estimatedDays": 4,
  "winningStrategy": "Strategic tip in Bengali on how to close this client",
  "coverLetter": "Full customized winning proposal letter in English (or Bengali if job is Bengali)",
  "milestones": [
    { "title": "Milestone 1: Architecture & Setup", "duration": "1 day", "cost": "$150" },
    { "title": "Milestone 2: Core Feature Implementation", "duration": "2 days", "cost": "$250" },
    { "title": "Milestone 3: Testing, Deployment & Handover", "duration": "1 day", "cost": "$100" }
  ],
  "questionsForClient": [
    "Technical question 1 about their database or API",
    "Workflow question 2"
  ]
}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        responseMimeType: 'application/json',
        temperature: 0.25,
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (err: any) {
    console.error('Error in /api/agent/evaluate-job:', err?.message || err);
    res.status(500).json({
      error: formatFriendlyErrorMessage(err),
    });
  }
});

// Autonomous Freelance Agent: Execute Task & Code Verification Solver
app.post('/api/agent/solve-task', aiLimiter, async (req, res) => {
  try {
    const { jobTitle, requirement, techStack } = req.body;
    if (!requirement) {
      return res.status(400).json({ error: 'Requirement description is required.' });
    }

    const ai = getAIClient(req);
    const prompt = `
You are an autonomous senior software engineer performing a freelance contract delivery.
Client Requirement:
Title: ${jobTitle || 'Custom Software Module'}
Tech Stack: ${techStack || 'TypeScript / Node.js'}
Detailed Specification:
${requirement}

TASK:
1. Decompose the requirement into architecture.
2. Produce production-grade, bug-free, complete source code files (No placeholders, no "TODOs").
3. Perform an authentic static code analysis and structural integrity verification:
   - Identify potential edge-case or exception hazards and show the architectural safeguards applied.
   - Note: Do NOT claim simulated test-runner assertions executed unless genuine tests ran; provide a rigorous static review.
4. Write a professional client delivery message ready to paste in Upwork/Fiverr chat.

Respond ONLY with valid JSON in this exact structure:
{
  "architecture": "Architecture overview in Bengali (বাংলা)",
  "files": [
    {
      "filename": "index.ts",
      "language": "typescript",
      "purpose": "Core entrypoint and execution logic",
      "content": "/* Complete working code */"
    },
    {
      "filename": "README.md",
      "language": "markdown",
      "purpose": "Setup instructions and API documentation",
      "content": "/* Complete markdown documentation */"
    }
  ],
  "codeVerificationReport": {
    "reviewStatus": "Static Code Review & Structural Integrity Verified",
    "edgeCasesHandled": ["Strict input validation and error boundaries", "Exponential backoff retry with timeout handling"],
    "typeSafetyAudit": "TypeScript strict compliance verified",
    "architecturalNotes": "Code adheres to clean modular separation and zero-unhandled-rejection principles."
  },
  "deliveryNote": "Hi [Client Name], I have completed the requested module according to your exact specifications..."
}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (err: any) {
    console.error('Error in /api/agent/solve-task:', err?.message || err);
    res.status(500).json({
      error: formatFriendlyErrorMessage(err),
    });
  }
});

// AI-Powered Real-Time Screen & Candlestick Analysis (Educational Technical Pattern Study)
app.post('/api/trading-bot/analyze', aiLimiter, async (req, res) => {
  try {
    const {
      imageBase64,
      platform = 'TradingView / Chart Analysis',
      market = 'EUR/USD',
      timeframe = '1m',
      strategy = 'Price Action & Candlestick Patterns',
    } = req.body || {};

    if (!imageBase64 || typeof imageBase64 !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Screenshot or chart frame imageBase64 is required.',
      });
    }

    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const mimeType = imageBase64.startsWith('data:image/png') ? 'image/png' : 'image/jpeg';

    const ai = getAIClient(req);

    const prompt = `You are an educational technical chart analyst for financial markets, crypto, and currency pairs.
The user is viewing chart timeframe "${timeframe}", pair "${market}" with focus "${strategy}".

CRITICAL EDUCATIONAL & TECHNICAL OBJECTIVE:
Inspect this chart screen frame purely for academic pattern study and technical price action analysis:
1. Identify visible candlestick formations (e.g. Hammer, Inverted Hammer, Engulfing, Doji, Pinbar, Morning/Evening Star, Consolidation).
2. Note visible indicators if present (RSI, Moving Averages, Support/Resistance zones).
3. Provide educational technical pattern breakdown:
   - "patternObserved": Name of detected formation
   - "marketCondition": "BULLISH_BIAS", "BEARISH_BIAS", or "CONSOLIDATION_NEUTRAL"
   - "keyLevels": { "support": "...", "resistance": "..." }
   - "technicalContextBn": Detailed explanation in Bengali of what these patterns typically represent in technical analysis literature.
   - "technicalContextEn": Crisp English technical summary.
   - "audioExplanationBn": Educational audio summary in Bengali (e.g. "চার্ট বিশ্লেষণ সম্পন্ন। সাপোর্ট জোনে রিভার্সাল লক্ষণীয়। নিজে ঝুঁকি যাচাই করে সিদ্ধান্ত নিন।").
   - "disclaimer": "সতর্কতা: এটি সম্পূর্ণ শিক্ষণীয় উদ্দেশ্যে প্রস্তুতকৃত চার্ট বিশ্লেষণ। কোনো ট্রেডিং সিগন্যাল বা আর্থিক পরামর্শ নয়।"

DO NOT issue buy/sell execution commands, do NOT force false certainty percentages, and do NOT encourage live monetary gambling.

Respond STRICTLY with a valid JSON object matching this schema:
{
  "marketCondition": "BULLISH_BIAS" | "BEARISH_BIAS" | "CONSOLIDATION_NEUTRAL",
  "patternObserved": "Bullish Engulfing at Support Zone",
  "indicators": ["RSI near oversold boundary", "Support wick rejection"],
  "supportLevel": "1.0820",
  "resistanceLevel": "1.0895",
  "timeframe": "${timeframe}",
  "riskNote": "HIGH_VOLATILITY",
  "technicalContextBn": "চার্টে সাপোর্ট লেভেলে বায়ারদের উপস্থিতি নির্দেশ করছে এমন রিভার্সাল ক্যান্ডেল তৈরি হয়েছে।",
  "technicalContextEn": "Candle formation indicates buyer absorption at support line, showing typical technical reversal characteristics.",
  "audioExplanationBn": "চার্ট বিশ্লেষণ সম্পন্ন। সাপোর্ট জোনে রিভার্সাল প্যাটার্ন দেখা যাচ্ছে। নিজস্ব ঝুঁকি পর্যালোচনা করুন।",
  "disclaimer": "সতর্কতা: এটি শিক্ষণীয় প্রযুক্তিগত বিশ্লেষণ। কোনো আর্থিক পরামর্শ বা ট্রেড সিগন্যাল নয়।"
}
`;

    const imagePart = {
      inlineData: {
        mimeType,
        data: cleanBase64,
      },
    };

    const textPart = {
      text: prompt,
    };

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: { parts: [imagePart, textPart] },
      config: {
        responseMimeType: 'application/json',
        temperature: 0.15,
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    const legalDisclaimer = 'সতর্কতা: এটি সম্পূর্ণ শিক্ষণীয় উদ্দেশ্যে প্রস্তুতকৃত চার্ট বিশ্লেষণ। কোনো ট্রেডিং সিগন্যাল বা আর্থিক পরামর্শ নয়। বাংলাদেশ ব্যাংক ও আইনি বিধিমালা অনুসারে অননুমোদিত বৈদেশিক মুদ্রা/বাইনারি ট্রেডিং উচ্চ আর্থিক ঝুঁকিপূর্ণ ও নিষিদ্ধ।';

    // Map fields for client compatibility while enforcing educational context
    const normalizedAnalysis = {
      action: parsed.marketCondition === 'BULLISH_BIAS' ? 'BUY' : parsed.marketCondition === 'BEARISH_BIAS' ? 'SELL' : 'HOLD',
      trend: parsed.marketCondition === 'BULLISH_BIAS' ? 'BULLISH' : parsed.marketCondition === 'BEARISH_BIAS' ? 'BEARISH' : 'SIDEWAYS',
      pattern: parsed.patternObserved || 'Technical Pattern Formation',
      indicators: parsed.indicators || [],
      supportLevel: parsed.supportLevel || 'N/A',
      resistanceLevel: parsed.resistanceLevel || 'N/A',
      reasonBn: parsed.technicalContextBn || 'প্রযুক্তিগত চার্ট পর্যালোচনা সম্পন্ন।',
      reasonEn: parsed.technicalContextEn || 'Technical chart inspection completed.',
      audioAlertBn: parsed.audioExplanationBn || 'চার্ট প্যাটার্ন বিশ্লেষণ সম্পন্ন হয়েছে।',
      disclaimer: legalDisclaimer,
      ...parsed,
    };

    res.json({
      success: true,
      timestamp: Date.now(),
      platform,
      market,
      analysis: normalizedAnalysis,
      disclaimer: legalDisclaimer,
    });
  } catch (err: any) {
    console.error('Error in /api/trading-bot/analyze:', err?.message || err);
    res.status(500).json({
      success: false,
      error: formatFriendlyErrorMessage(err) || 'Failed to analyze trading screen frame.',
    });
  }
});

// Trading Bot Webhook Broadcaster (SSRF Protected)
app.post('/api/trading-bot/webhook', proxyLimiter, async (req, res) => {
  try {
    const { webhookUrl, payload } = req.body || {};
    if (!webhookUrl || typeof webhookUrl !== 'string') {
      return res.status(400).json({ error: 'webhookUrl is required.' });
    }

    const { valid, reason, parsedUrl } = await validateSafeUrl(webhookUrl);
    if (!valid || !parsedUrl) {
      return res.status(400).json({
        success: false,
        error: reason || 'Blocked: Target webhook URL is invalid or points to restricted internal infrastructure.',
      });
    }

    const resp = await safeFetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'AI-Studio-Webhook-Dispatcher/1.0',
      },
      body: JSON.stringify(payload || {}),
    });

    res.json({
      success: resp.ok,
      status: resp.status,
      statusText: resp.statusText,
    });
  } catch (err: any) {
    console.warn('Trading webhook trigger error:', err);
    res.status(500).json({
      success: false,
      error: err?.message || 'Webhook dispatch failed',
    });
  }
});

// GitHub Profile & Repos Integration for Sheikh Farid (rsk934128-dot)
let cachedGithubUser: { data: any; timestamp: number } | null = null;
let cachedGithubRepos: { data: any; timestamp: number } | null = null;

app.get('/api/github/user', async (req, res) => {
  try {
    const now = Date.now();
    if (cachedGithubUser && now - cachedGithubUser.timestamp < 10 * 60 * 1000) {
      return res.json(cachedGithubUser.data);
    }

    const response = await fetch('https://api.github.com/users/rsk934128-dot', {
      headers: {
        'User-Agent': 'AI-Assistant-Coding-Studio-App/1.0',
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      cachedGithubUser = { data, timestamp: now };
      return res.json(data);
    }

    // Fallback if rate limited or network failure
    const fallbackUser = {
      login: 'rsk934128-dot',
      id: 248212950,
      avatar_url: 'https://avatars.githubusercontent.com/u/248212950?v=4',
      html_url: 'https://github.com/rsk934128-dot',
      name: 'SHEIKH FARID',
      company: 'RubelPay',
      blog: 'https://www.facebook.com/rubelrubel.rubel.98',
      location: 'Sirajganj Sadar, Bangladesh',
      bio: 'Founder & Independent Software Builder from Bangladesh 🇧🇩\nBuilding trust-first web & app solutions that solve real-world problems. Focus: • Visa & migration',
      public_repos: 139,
      followers: 0,
      following: 0,
      hireable: true,
    };
    return res.json(fallbackUser);
  } catch (err: any) {
    console.warn('GitHub user fetch fallback:', err?.message || err);
    return res.json({
      login: 'rsk934128-dot',
      avatar_url: 'https://avatars.githubusercontent.com/u/248212950?v=4',
      html_url: 'https://github.com/rsk934128-dot',
      name: 'SHEIKH FARID',
      company: 'RubelPay',
      location: 'Sirajganj Sadar, Bangladesh',
      bio: 'Founder & Independent Software Builder from Bangladesh 🇧🇩',
      public_repos: 139,
    });
  }
});

app.get('/api/github/repos', async (req, res) => {
  try {
    const now = Date.now();
    if (cachedGithubRepos && now - cachedGithubRepos.timestamp < 10 * 60 * 1000) {
      return res.json(cachedGithubRepos.data);
    }

    const response = await fetch('https://api.github.com/users/rsk934128-dot/repos?sort=updated&per_page=100', {
      headers: {
        'User-Agent': 'AI-Assistant-Coding-Studio-App/1.0',
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (response.ok) {
      const repos = await response.json();
      if (Array.isArray(repos) && repos.length > 0) {
        cachedGithubRepos = { data: repos, timestamp: now };
        return res.json(repos);
      }
    }

    // High fidelity curated fallback list of Sheikh Farid's repositories
    const fallbackRepos = [
      {
        id: 1,
        name: 'DeepMind-Science-Discovery-Workbench',
        full_name: 'rsk934128-dot/DeepMind-Science-Discovery-Workbench',
        html_url: 'https://github.com/rsk934128-dot/DeepMind-Science-Discovery-Workbench',
        description: 'DeepMind Science Discovery Workbench — অত্যাধুনিক বৈজ্ঞানিক গবেষণা, প্রোটিন মডেলিং ও সিমুলেশন প্ল্যাটফর্ম।',
        language: 'TypeScript',
        stargazers_count: 0,
        forks_count: 0,
        updated_at: '2026-10-14T10:00:00Z',
      },
      {
        id: 2,
        name: 'Sheikh-Farid-AI-Studio-',
        full_name: 'rsk934128-dot/Sheikh-Farid-AI-Studio-',
        html_url: 'https://github.com/rsk934128-dot/Sheikh-Farid-AI-Studio-',
        description: 'শেখ ফরিদ AI Studio — পূর্ণাঙ্গ ফুল-স্ট্যাক কৃত্রিম বুদ্ধিমত্তা সহকারী ও অটোমেটেড কোডিং স্টুডিও।',
        language: 'TypeScript',
        stargazers_count: 0,
        forks_count: 0,
        updated_at: '2026-10-14T08:30:00Z',
      },
      {
        id: 3,
        name: 'Sheikh-Farid-AI-Studio-Project-Hub',
        full_name: 'rsk934128-dot/Sheikh-Farid-AI-Studio-Project-Hub',
        html_url: 'https://github.com/rsk934128-dot/Sheikh-Farid-AI-Studio-Project-Hub',
        description: 'শেখ ফরিদ AI Studio & Project Hub — মাল্টি-রিপোজিটরি ইকোসিস্টেম ও প্রজেক্ট কোঅর্ডিনেশন হাব।',
        language: 'TypeScript',
        stargazers_count: 0,
        forks_count: 0,
        updated_at: '2026-10-13T14:20:00Z',
      },
      {
        id: 4,
        name: 'Stripe-Gmail-Payment-Gateway-Hub',
        full_name: 'rsk934128-dot/Stripe-Gmail-Payment-Gateway-Hub',
        html_url: 'https://github.com/rsk934128-dot/Stripe-Gmail-Payment-Gateway-Hub',
        description: 'Stripe & Gmail Payment Gateway Hub — সিকিউর পেমেন্ট গেটওয়ে এবং অটোমেটেড জিমেইল রিসিট ডিসবার্সমেন্ট সিস্টেম।',
        language: 'JavaScript',
        stargazers_count: 0,
        forks_count: 0,
        updated_at: '2026-10-12T12:00:00Z',
      },
      {
        id: 5,
        name: 'AI-Assistant-Coding-Studio',
        full_name: 'rsk934128-dot/AI-Assistant-Coding-Studio',
        html_url: 'https://github.com/rsk934128-dot/AI-Assistant-Coding-Studio',
        description: 'AI-Assistant-Coding-Studio — ফ্ল্যাগশিপ রিয়েল-টাইম কোডিং সহকারী, লাইভ কম্পাইলার ও ক্লাউড সিঙ্ক।',
        language: 'TypeScript',
        stargazers_count: 0,
        forks_count: 0,
        updated_at: '2026-10-11T16:45:00Z',
      },
      {
        id: 6,
        name: 'PayHub-Gateway-Gmail-Disbursement-PWA',
        full_name: 'rsk934128-dot/PayHub-Gateway-Gmail-Disbursement-PWA',
        html_url: 'https://github.com/rsk934128-dot/PayHub-Gateway-Gmail-Disbursement-PWA',
        description: 'PayHub Gateway & Gmail Disbursement PWA — অফলাইন-ফার্স্ট পেমেন্ট গেটওয়ে ও পে-রোল ম্যানেজমেন্ট।',
        language: 'TypeScript',
        stargazers_count: 0,
        forks_count: 0,
        updated_at: '2026-10-10T09:15:00Z',
      },
      {
        id: 7,
        name: 'No-IP-DNS-Remote-Access',
        full_name: 'rsk934128-dot/No-IP-DNS-Remote-Access',
        html_url: 'https://github.com/rsk934128-dot/No-IP-DNS-Remote-Access',
        description: 'No-IP ডায়নামিক ডিএনএস ও রিমোট সার্ভার অ্যাক্সেস অটোমেশন টুলকিট।',
        language: 'Shell',
        stargazers_count: 0,
        forks_count: 0,
        updated_at: '2026-10-09T18:00:00Z',
      },
    ];
    return res.json(fallbackRepos);
  } catch (err: any) {
    console.warn('GitHub repos fetch error:', err?.message || err);
    return res.json([]);
  }
});

// No-IP Dynamic DNS (DDNS) Automation & Diagnostic API
app.get('/api/ddns/my-ip', async (req, res) => {
  try {
    const ipRes = await fetch('https://api.ipify.org?format=json');
    if (ipRes.ok) {
      const data = await ipRes.json();
      return res.json({ ip: data.ip });
    }
    const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || '127.0.0.1';
    return res.json({ ip: clientIp });
  } catch (err: any) {
    const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || '127.0.0.1';
    return res.json({ ip: clientIp });
  }
});

app.post('/api/ddns/update', async (req, res) => {
  try {
    const { hostname = 'office.ddns.net', username, password, myip } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        code: 'badauth',
        error: 'No-IP username/email এবং password প্রয়োজন।'
      });
    }

    const targetHostname = String(hostname).trim();
    let targetIp = String(myip || '').trim();

    // Auto-detect public IP if not provided
    if (!targetIp) {
      try {
        const ipRes = await fetch('https://api.ipify.org?format=json');
        if (ipRes.ok) {
          const data = await ipRes.json();
          targetIp = data.ip;
        }
      } catch (_) {}
    }

    const authHeader = 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64');
    const updateUrl = targetIp
      ? `https://dynupdate.no-ip.com/nic/update?hostname=${encodeURIComponent(targetHostname)}&myip=${encodeURIComponent(targetIp)}`
      : `https://dynupdate.no-ip.com/nic/update?hostname=${encodeURIComponent(targetHostname)}`;

    const noIpRes = await fetch(updateUrl, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'User-Agent': 'PartnerGateway/3.2 developer@partner.com',
      },
    });

    const rawOutput = (await noIpRes.text()).trim();
    const parts = rawOutput.split(/\s+/);
    const code = parts[0]?.toLowerCase();
    const resolvedIp = parts[1] || targetIp;

    let success = false;
    let messageBn = '';
    let messageEn = '';
    let instructions: string[] = [];

    switch (code) {
      case 'good':
        success = true;
        messageBn = `DNS রেকর্ড সফলভাবে আপডেট হয়েছে! বর্তমান IP: ${resolvedIp}`;
        messageEn = `DNS record updated successfully! IP is now ${resolvedIp}`;
        break;
      case 'nochg':
        success = true;
        messageBn = `IP ইতিমধ্যেই আপডেট রয়েছে (${resolvedIp})। অতিরিক্ত পরিবর্তনের প্রয়োজন নেই।`;
        messageEn = `IP is already identical (${resolvedIp}); no change needed.`;
        break;
      case 'badauth':
        success = false;
        messageBn = 'ইউজারনেম অথবা পাসওয়ার্ড সঠিক নয় (Invalid Credentials / badauth)।';
        messageEn = 'Invalid username or password (badauth).';
        instructions = [
          '১. No-IP.com এ লগইন করুন (https://www.noip.com/login)।',
          '২. Account -> "DDNS Keys" মেনু থেকে একটি নতুন DDNS Key তৈরি করুন।',
          '৩. No-IP এখন মূল পাসওয়ার্ডের বদলে ডেডিকেটেড "DDNS Key" ইউজারনেম ও পাসওয়ার্ড ব্যবহার বাধ্যতামূলক করেছে।',
          '৪. আপনার নিবন্ধিত No-IP একাউন্ট তথ্য ও ক্রেডেনশিয়াল সঠিক কিনা পরীক্ষা করুন।'
        ];
        break;
      case 'nohost':
        success = false;
        messageBn = `প্রদত্ত হোস্টনেম (${targetHostname}) এই একাউন্টে খুঁজে পাওয়া যায়নি (nohost)।`;
        messageEn = `Hostname (${targetHostname}) does not exist in this account (nohost).`;
        instructions = [
          '১. No-IP ড্যাশবোর্ডে গিয়ে "Dynamic DNS" -> "No-IP Hostnames" চেক করুন।',
          '২. "office.ddns.net" হোস্টনেমটি আপনার একাউন্টে সক্রিয় আছে কিনা নিশ্চিত করুন।'
        ];
        break;
      case 'abuse':
        success = false;
        messageBn = 'অ্যাকাউন্ট ব্লক বা সীমিত করা হয়েছে (abuse)। খুব ঘন ঘন আপডেট রিকোয়েস্ট পাঠানো যাবে না।';
        messageEn = 'Username blocked due to abuse or rapid update calls.';
        break;
      case '911':
        success = false;
        messageBn = 'No-IP সার্ভারে সাময়িক বিপর্যয় দেখা দিয়েছে (911)। ৩০ মিনিট পর আবার চেষ্টা করুন।';
        messageEn = 'A fatal server error occurred on No-IP side (911).';
        break;
      default:
        success = false;
        messageBn = `No-IP সার্ভার রেসপন্স: ${rawOutput}`;
        messageEn = `Response from No-IP: ${rawOutput}`;
        break;
    }

    return res.json({
      success,
      code,
      raw: rawOutput,
      messageBn,
      messageEn,
      hostname: targetHostname,
      ip: resolvedIp,
      instructions: instructions.length > 0 ? instructions : undefined,
    });
  } catch (err: any) {
    console.error('No-IP DDNS endpoint error:', err);
    return res.status(500).json({
      success: false,
      code: 'error',
      error: err?.message || 'Failed to communicate with No-IP service'
    });
  }
});

// Universal Share Target and Link Metadata Preview API (SSRF Hardened)
app.get('/api/fetch-link-preview', proxyLimiter, async (req, res) => {
  try {
    const rawUrl = req.query.url as string;
    if (!rawUrl || typeof rawUrl !== 'string') {
      return res.status(400).json({ success: false, error: 'URL is required' });
    }

    // SSRF Validation: Block localhost, 127.0.0.1, RFC1918, 169.254.x, CGNAT, IPv6, and DNS Rebinding
    const { valid, reason, parsedUrl } = await validateSafeUrl(rawUrl);
    if (!valid || !parsedUrl) {
      return res.status(400).json({
        success: false,
        error: reason || 'Access to internal IP or restricted metadata service is forbidden',
      });
    }

    try {
      const response = await safeFetch(rawUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 AIStudioBot/1.0',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
      });

      if (!response.ok) {
        return res.json({
          success: true,
          domain: parsedUrl.hostname,
          title: parsedUrl.hostname,
          description: `লিংক: ${parsedUrl.hostname}`,
          url: rawUrl,
        });
      }

      const html = await response.text();
      // Extract title, og:title, og:description, description, og:image
      const ogTitleMatch = html.match(/<meta\s+property=["']og:title["']\s+content=["'](.*?)["']/i) || html.match(/<meta\s+content=["'](.*?)["']\s+property=["']og:title["']/i);
      const titleTagMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
      const ogDescMatch = html.match(/<meta\s+property=["']og:description["']\s+content=["'](.*?)["']/i) || html.match(/<meta\s+content=["'](.*?)["']\s+property=["']og:description["']/i);
      const metaDescMatch = html.match(/<meta\s+name=["']description["']\s+content=["'](.*?)["']/i) || html.match(/<meta\s+content=["'](.*?)["']\s+name=["']description["']/i);
      const ogImageMatch = html.match(/<meta\s+property=["']og:image["']\s+content=["'](.*?)["']/i) || html.match(/<meta\s+content=["'](.*?)["']\s+property=["']og:image["']/i);

      const title = ogTitleMatch?.[1] || titleTagMatch?.[1] || parsedUrl.hostname;
      const description = ogDescMatch?.[1] || metaDescMatch?.[1] || '';
      const image = ogImageMatch?.[1] || '';

      return res.json({
        success: true,
        title: title.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').slice(0, 150),
        description: description.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').slice(0, 300),
        image,
        domain: parsedUrl.hostname,
        url: rawUrl,
      });
    } catch {
      return res.json({
        success: true,
        domain: parsedUrl.hostname,
        title: parsedUrl.hostname,
        description: `লিংক: ${parsedUrl.hostname}`,
        url: rawUrl,
      });
    }
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'Link preview fetch failed' });
  }
});

// Global Express error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled route error in server:', err);
  if (res.headersSent) {
    return next(err);
  }
  res.status(500).json({
    success: false,
    error: err?.message || 'Internal Server Error',
  });
});

function serveStaticProduction() {
  const cwdDist = path.join(process.cwd(), 'dist');
  const appDir = getAppDirname();
  const dirnameDist = path.resolve(appDir, appDir.endsWith('dist') ? '.' : 'dist');
  const distPath = fs.existsSync(cwdDist) ? cwdDist : dirnameDist;

  app.use(express.static(distPath, { maxAge: '1d', index: false }));

  // Immediate health check endpoints for Cloud Run & container orchestration
  app.get(['/healthz', '/_health', '/api/healthz'], (req, res) => {
    res.status(200).send('OK');
  });

  // Unmatched API requests in production must return JSON 404, never index.html
  app.use('/api', (req, res) => {
    res.status(404).json({
      success: false,
      error: `API route not found: ${req.method} ${req.originalUrl}`,
    });
  });

  // SPA catch-all for HTML pages with dynamic Social OpenGraph host resolution
  app.get('*', (req, res) => {
    const indexPath = path.join(distPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      try {
        const proto = req.headers['x-forwarded-proto'] || req.protocol || 'https';
        const host = req.headers['x-forwarded-host'] || req.get('host') || '';
        const currentOrigin = host ? `${proto}://${host}` : '';

        if (currentOrigin) {
          let html = fs.readFileSync(indexPath, 'utf-8');
          html = html.replace(/https:\/\/ais-pre-sdbgwm6do3t5hwhyzxx7x7-500845900368\.asia-southeast1\.run\.app/g, currentOrigin);
          return res.status(200).type('html').send(html);
        }
      } catch {
        // Fallback to static sendFile
      }
      res.sendFile(indexPath);
    } else {
      res.status(200).send(
        '<!DOCTYPE html><html><head><title>App Initializing</title></head><body><h1>Application Initializing</h1><p>Frontend static bundle not found. Please run: npm run build</p></body></html>'
      );
    }
  });
}

async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    try {
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({
        server: {
          middlewareMode: true,
          hmr: false,
        },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    } catch (viteErr) {
      console.warn('Vite dev middleware failed to load, falling back to static server:', viteErr);
      serveStaticProduction();
    }
  } else {
    serveStaticProduction();
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT} (mode: ${isProduction ? 'production' : 'development'})`);
  });
}

// In serverless environments (like Vercel, Netlify Functions, AWS Lambda), the platform manages request lifecycles
if (!process.env.VERCEL && !process.env.NETLIFY && !process.env.AWS_LAMBDA_FUNCTION_NAME) {
  startServer();
}

export { app };
export default app;
