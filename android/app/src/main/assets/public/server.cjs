var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// server.ts
var server_exports = {};
__export(server_exports, {
  FALLBACK_MODELS: () => FALLBACK_MODELS,
  app: () => app,
  default: () => server_default
});
module.exports = __toCommonJS(server_exports);
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_fs = __toESM(require("fs"), 1);
var import_url = require("url");
var import_config = require("dotenv/config");
var import_genai = require("@google/genai");
var import_meta = {};
process.env.DISABLE_HMR = "true";
var getAppDirname = () => {
  try {
    return import_path.default.dirname((0, import_url.fileURLToPath)(import_meta.url));
  } catch {
    return process.cwd();
  }
};
var app = (0, import_express.default)();
var PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3e3;
var FALLBACK_MODELS = [
  "gemini-3.8-flash",
  "gemini-3.5-flash",
  "gemini-3.6-flash",
  "gemini-flash-lite-latest",
  "gemini-3.1-flash-lite",
  "gemini-flash-latest"
];
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception caught in server:", err);
});
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection caught in server at:", promise, "reason:", reason);
});
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    res.header("Access-Control-Allow-Origin", origin);
    res.header("Access-Control-Allow-Credentials", "true");
  } else {
    res.header("Access-Control-Allow-Origin", "*");
  }
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control, Pragma");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});
app.use(import_express.default.json({ limit: "10mb" }));
app.use((req, res, next) => {
  if (req.url.startsWith("/api/index")) {
    req.url = req.url.replace("/api/index", "/api");
  }
  if (!req.url.startsWith("/api") && (req.url.startsWith("/health") || req.url.startsWith("/chat") || req.url.startsWith("/tts") || req.url.startsWith("/transcribe") || req.url.startsWith("/web") || req.url.startsWith("/agent") || req.url.startsWith("/music") || req.url.startsWith("/session") || req.url.startsWith("/youtube") || req.url.startsWith("/mini-browser") || req.url.startsWith("/trading-bot") || req.url.startsWith("/proxy") || req.url.startsWith("/drive"))) {
    req.url = "/api" + req.url;
  }
  next();
});
app.all(["/api", "/api/"], (req, res) => {
  res.json({
    success: true,
    status: "ok",
    message: "AI Studio Assistant API is online",
    time: (/* @__PURE__ */ new Date()).toISOString()
  });
});
function getEffectiveGeminiApiKey() {
  return (process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.API_KEY || "").trim();
}
function getAIClient() {
  const apiKey = getEffectiveGeminiApiKey();
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY is not configured in environment variables. Please set GEMINI_API_KEY in your hosting dashboard (Cloud Run, Render, Railway, Vercel, etc.)."
    );
  }
  return new import_genai.GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build"
      }
    }
  });
}
app.all(["/api/health", "/api/health/"], (req, res) => {
  try {
    const apiKey = getEffectiveGeminiApiKey();
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.json({
      success: true,
      status: "ok",
      hasApiKey: Boolean(apiKey && apiKey.length > 0),
      port: PORT,
      nodeEnv: process.env.NODE_ENV || "development",
      time: (/* @__PURE__ */ new Date()).toISOString(),
      supportedModels: FALLBACK_MODELS
    });
  } catch (err) {
    console.error("Health check endpoint error:", err);
    res.status(500).json({
      success: false,
      status: "error",
      error: "Health check failed: " + (err?.message || String(err))
    });
  }
});
app.get("/api/tts", async (req, res) => {
  try {
    const rawText = String(req.query.text || "").trim();
    if (!rawText) {
      return res.status(400).json({ error: "Text query parameter is required." });
    }
    const requestedLang = String(req.query.lang || "").toLowerCase();
    const hasBengali = /[\u0980-\u09FF]/.test(rawText);
    const lang = requestedLang === "en" ? "en" : hasBengali || requestedLang === "bn" ? "bn" : "en";
    const chunk = rawText.slice(0, 200);
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(chunk)}&tl=${lang}&client=tw-ob`;
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "audio/mpeg, audio/*;q=0.9",
        "Referer": "https://translate.google.com/"
      }
    });
    if (!response.ok) {
      return res.status(response.status).json({ error: "Failed to fetch audio stream from TTS provider." });
    }
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Content-Length", buffer.length);
    res.setHeader("Cache-Control", "public, max-age=86400");
    res.setHeader("Accept-Ranges", "bytes");
    return res.end(buffer);
  } catch (err) {
    console.error("TTS endpoint error:", err?.message || err);
    return res.status(500).json({ error: "Internal TTS processing error" });
  }
});
var sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
function formatFriendlyErrorMessage(err) {
  const errStr = typeof err === "string" ? err : err?.message || JSON.stringify(err);
  const lower = errStr.toLowerCase();
  if (lower.includes("429") || lower.includes("quota") || lower.includes("resource_exhausted") || lower.includes("rate limit") || lower.includes("exceeded your current quota")) {
    return '\u098F\u0986\u0987 \u0995\u09CB\u099F\u09BE \u09B8\u09C0\u09AE\u09BE (API Rate Limit / Quota Exceeded 429) \u09B8\u09BE\u09AE\u09DF\u09BF\u0995\u09AD\u09BE\u09AC\u09C7 \u09B6\u09C7\u09B7 \u09B9\u09DF\u09C7\u099B\u09C7\u0964 Google Gemini \u09AB\u09CD\u09B0\u09BF \u099F\u09BE\u09DF\u09BE\u09B0\u09C7\u09B0 \u09AA\u09CD\u09B0\u09A4\u09BF \u09AE\u09BF\u09A8\u09BF\u099F\u09C7\u09B0 \u09B0\u09BF\u0995\u09CB\u09DF\u09C7\u09B8\u09CD\u099F \u09B8\u09C0\u09AE\u09BE \u0985\u09A4\u09BF\u0995\u09CD\u09B0\u09AE \u0995\u09B0\u09B2\u09C7 \u098F\u0987 \u09AC\u09BE\u09B0\u09CD\u09A4\u09BE \u0986\u09B8\u09C7\u0964 \u0985\u09A8\u09C1\u0997\u09CD\u09B0\u09B9 \u0995\u09B0\u09C7 \u09E7\u09E6-\u09E7\u09EB \u09B8\u09C7\u0995\u09C7\u09A8\u09CD\u09A1 \u0985\u09AA\u09C7\u0995\u09CD\u09B7\u09BE \u0995\u09B0\u09C7 \u09A8\u09BF\u099A\u09C7\u09B0 "\u09AA\u09C1\u09A8\u09B0\u09BE\u09DF \u099A\u09C7\u09B7\u09CD\u099F\u09BE \u0995\u09B0\u09C1\u09A8" \u09AC\u09BE\u099F\u09A8\u09C7 \u0995\u09CD\u09B2\u09BF\u0995 \u0995\u09B0\u09C1\u09A8 \u0985\u09A5\u09AC\u09BE Google Search \u0985\u09AB \u0995\u09B0\u09C7 \u09AE\u09C7\u09B8\u09C7\u099C \u09AA\u09BE\u09A0\u09BE\u09A8\u0964';
  }
  if (lower.includes("503") || lower.includes("unavailable") || lower.includes("high demand") || lower.includes("overloaded")) {
    return "\u0997\u09C1\u0997\u09B2 \u098F\u0986\u0987 \u09B8\u09BE\u09B0\u09CD\u09AD\u09BE\u09B0 \u098F\u0987 \u09AE\u09C1\u09B9\u09C2\u09B0\u09CD\u09A4\u09C7 \u0985\u09A4\u09BF\u09B0\u09BF\u0995\u09CD\u09A4 \u099A\u09BE\u09AA\u09C7 \u09B0\u09DF\u09C7\u099B\u09C7 (503 Service Unavailable)\u0964 \u09B8\u09CD\u09AC\u09DF\u0982\u0995\u09CD\u09B0\u09BF\u09DF\u09AD\u09BE\u09AC\u09C7 \u09AC\u09BF\u0995\u09B2\u09CD\u09AA \u09AE\u09A1\u09C7\u09B2\u09C7 \u099A\u09C7\u09B7\u09CD\u099F\u09BE \u0995\u09B0\u09BE \u09B9\u099A\u09CD\u099B\u09C7... \u0995\u09DF\u09C7\u0995 \u09B8\u09C7\u0995\u09C7\u09A8\u09CD\u09A1 \u09AA\u09B0 \u09AA\u09C1\u09A8\u09B0\u09BE\u09DF \u099A\u09C7\u09B7\u09CD\u099F\u09BE \u0995\u09B0\u09C1\u09A8\u0964";
  }
  if (lower.includes("404") || lower.includes("not_found") || lower.includes("no longer available")) {
    return "\u0985\u09A8\u09C1\u09B0\u09CB\u09A7\u0995\u09C3\u09A4 \u098F\u0986\u0987 \u09AE\u09A1\u09C7\u09B2\u099F\u09BF \u098F\u0987 \u09AE\u09C1\u09B9\u09C2\u09B0\u09CD\u09A4\u09C7 \u09AA\u09CD\u09B0\u09B8\u09CD\u09A4\u09C1\u09A4 \u09A8\u09DF (404 Not Found)\u0964 \u09B8\u09BF\u09B8\u09CD\u099F\u09C7\u09AE \u09B8\u09CD\u09AC\u09DF\u0982\u0995\u09CD\u09B0\u09BF\u09DF\u09AD\u09BE\u09AC\u09C7 \u09AC\u09BF\u0995\u09B2\u09CD\u09AA \u09B8\u0995\u09CD\u09B0\u09BF\u09DF \u09AE\u09A1\u09C7\u09B2\u09C7 \u09B8\u0982\u09AF\u09CB\u0997 \u0995\u09B0\u099B\u09C7\u0964";
  }
  if (errStr.includes("API_KEY") || errStr.includes("API key not valid") || errStr.includes("not configured") || errStr.includes("GEMINI_API_KEY")) {
    return 'Gemini API Key \u09AA\u09BE\u0993\u09DF\u09BE \u09AF\u09BE\u09DF\u09A8\u09BF \u09AC\u09BE \u09B8\u09A0\u09BF\u0995 \u09A8\u09DF\u0964 \u0986\u09AA\u09A8\u09BF \u09AF\u09A6\u09BF \u0985\u09CD\u09AF\u09BE\u09AA\u099F\u09BF \u0995\u09CD\u09B2\u09BE\u0989\u09A1/\u09B9\u09CB\u09B8\u09CD\u099F\u09BF\u0982 (\u09AF\u09C7\u09AE\u09A8 Render, Cloud Run, Vercel, Railway)-\u098F \u09B9\u09CB\u09B8\u09CD\u099F \u0995\u09B0\u09C7 \u09A5\u09BE\u0995\u09C7\u09A8, \u09A4\u09AC\u09C7 \u09B9\u09CB\u09B8\u09CD\u099F\u09BF\u0982 \u0995\u09A8\u09CD\u099F\u09CD\u09B0\u09CB\u09B2 \u09AA\u09CD\u09AF\u09BE\u09A8\u09C7\u09B2\u09C7\u09B0 Environment Variables \u09B8\u09C7\u0995\u09B6\u09A8\u09C7 "GEMINI_API_KEY" \u09AF\u09CB\u0997 \u0995\u09B0\u09C7\u099B\u09C7\u09A8 \u0995\u09BF\u09A8\u09BE \u09A4\u09BE \u09A8\u09BF\u09B6\u09CD\u099A\u09BF\u09A4 \u0995\u09B0\u09C1\u09A8\u0964';
  }
  return err?.message || "\u098F\u0995\u099F\u09BF \u0985\u09AA\u09CD\u09B0\u09A4\u09CD\u09AF\u09BE\u09B6\u09BF\u09A4 \u09B8\u09AE\u09B8\u09CD\u09AF\u09BE \u09A6\u09C7\u0996\u09BE \u09A6\u09BF\u09DF\u09C7\u099B\u09C7\u0964 \u0985\u09A8\u09C1\u0997\u09CD\u09B0\u09B9 \u0995\u09B0\u09C7 \u09AA\u09C1\u09A8\u09B0\u09BE\u09DF \u099A\u09C7\u09B7\u09CD\u099F\u09BE \u0995\u09B0\u09C1\u09A8\u0964";
}
async function fetchStreamWithResilience(ai, contents, systemInstruction, enableSearch, modelPreference = "gemini-3.8-flash") {
  const modelsToTry = [
    modelPreference,
    ...FALLBACK_MODELS
  ].filter((v, i, a) => Boolean(v) && a.indexOf(v) === i);
  let searchAvailable = enableSearch;
  let lastError = null;
  for (const model of modelsToTry) {
    if (searchAvailable) {
      try {
        const stream = await ai.models.generateContentStream({
          model,
          contents,
          config: { systemInstruction, tools: [{ googleSearch: {} }] }
        });
        return { stream, modelUsed: model, hadSearch: true };
      } catch (err) {
        lastError = err;
        searchAvailable = false;
      }
    }
    try {
      const stream = await ai.models.generateContentStream({
        model,
        contents,
        config: { systemInstruction }
      });
      return { stream, modelUsed: model, hadSearch: false };
    } catch (err) {
      lastError = err;
      const errStr = String(err?.message || err);
      if (errStr.includes("429") || errStr.includes("quota") || errStr.includes("RESOURCE_EXHAUSTED") || errStr.includes("503")) {
        await sleep(300);
      }
    }
  }
  throw lastError || new Error("All model attempts failed.");
}
async function fetchContentWithResilience(ai, contents, systemInstruction, enableSearch, modelPreference = "gemini-3.8-flash") {
  const modelsToTry = [
    modelPreference,
    ...FALLBACK_MODELS
  ].filter((v, i, a) => Boolean(v) && a.indexOf(v) === i);
  let searchAvailable = enableSearch;
  let lastError = null;
  for (const model of modelsToTry) {
    if (searchAvailable) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents,
          config: { systemInstruction, tools: [{ googleSearch: {} }] }
        });
        return response;
      } catch (err) {
        lastError = err;
        searchAvailable = false;
      }
    }
    try {
      const response = await ai.models.generateContent({
        model,
        contents,
        config: { systemInstruction }
      });
      return response;
    } catch (err) {
      lastError = err;
      const errStr = String(err?.message || err);
      if (errStr.includes("429") || errStr.includes("quota") || errStr.includes("RESOURCE_EXHAUSTED") || errStr.includes("503")) {
        await sleep(300);
      }
    }
  }
  throw lastError || new Error("All model attempts failed.");
}
app.all("/api/health/test", async (req, res) => {
  const startTime = Date.now();
  try {
    const ai = getAIClient();
    const response = await fetchContentWithResilience(
      ai,
      [{ role: "user", parts: [{ text: "Respond with the single word: OK" }] }],
      "You are a health check agent. Return only OK.",
      false,
      "gemini-3.8-flash"
    );
    const latency = Date.now() - startTime;
    res.json({
      success: true,
      latencyMs: latency,
      reply: response.text?.trim() || "OK"
    });
  } catch (err) {
    const latency = Date.now() - startTime;
    console.error("API health test failed:", err);
    res.status(500).json({
      success: false,
      latencyMs: latency,
      error: formatFriendlyErrorMessage(err),
      rawMessage: err?.message || String(err)
    });
  }
});
app.post("/api/transcribe", async (req, res) => {
  const startTime = Date.now();
  try {
    const { audioData, mimeType = "audio/webm", language = "bn-BD" } = req.body;
    if (!audioData) {
      return res.status(400).json({ error: "No audio data provided" });
    }
    const base64Audio = audioData.includes("base64,") ? audioData.split("base64,")[1] : audioData;
    const cleanMimeType = (mimeType || "audio/webm").split(";")[0].trim();
    const ai = getAIClient();
    const isBengali = language && (language.startsWith("bn") || language === "bn");
    const promptText = isBengali ? "Transcribe this spoken audio accurately. If spoken in Bengali (\u09AC\u09BE\u0982\u09B2\u09BE), transcribe verbatim in Bengali script. If spoken in English, transcribe verbatim in English. If mixed (Banglish/code terms), capture both accurately. Output ONLY the raw transcribed text. Do NOT add quotes, formatting, or commentary." : "Transcribe this spoken audio accurately. Output ONLY the verbatim transcribed text without quotes, formatting, or commentary.";
    const modelsToTry = ["gemini-3.5-transcribe", "gemini-3.8-flash", "gemini-flash-latest"];
    let text = "";
    let lastErr = null;
    for (const model of modelsToTry) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: [
            {
              role: "user",
              parts: [
                {
                  inlineData: {
                    data: base64Audio,
                    mimeType: cleanMimeType
                  }
                },
                {
                  text: promptText
                }
              ]
            }
          ]
        });
        text = response.text?.trim() || "";
        if (text) break;
      } catch (err) {
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
      text: text || "",
      latencyMs
    });
  } catch (err) {
    console.error("Audio transcription failed:", err);
    res.status(500).json({
      success: false,
      error: formatFriendlyErrorMessage(err),
      rawMessage: err?.message || String(err)
    });
  }
});
app.post("/api/chat/stream", async (req, res) => {
  try {
    const {
      messages = [],
      prompt,
      systemInstruction,
      enableSearch = true,
      mode = "general",
      model = "gemini-3.8-flash"
    } = req.body;
    if (!prompt && (!messages || messages.length === 0)) {
      return res.status(400).json({ error: "Message content is required." });
    }
    const ai = getAIClient();
    const formattedContents = [];
    if (Array.isArray(messages) && messages.length > 0) {
      for (const msg of messages) {
        if (!msg.text || !msg.text.trim()) continue;
        formattedContents.push({
          role: msg.role === "model" || msg.role === "assistant" ? "model" : "user",
          parts: [{ text: msg.text }]
        });
      }
    }
    if (prompt && (!formattedContents.length || formattedContents[formattedContents.length - 1].parts[0].text !== prompt)) {
      formattedContents.push({
        role: "user",
        parts: [{ text: prompt }]
      });
    }
    const defaultSystem = `You are the official AI Assistant of "AI Assistant & Coding Studio" (\u09AC\u09BE\u0982\u09B2\u09BE \u0993 \u0987\u0982\u09B0\u09C7\u099C\u09BF \u09B8\u09CD\u09AE\u09BE\u09B0\u09CD\u099F \u098F\u0986\u0987 \u09B8\u09B9\u0995\u09BE\u09B0\u09C0 \u0993 \u0995\u09CB\u09A1\u09BF\u0982 \u09B8\u09CD\u099F\u09C1\u09A1\u09BF\u0993).

YOUR IDENTITY & ORIGIN (\u0986\u09AA\u09A8\u09BE\u09B0 \u09AA\u09B0\u09BF\u099A\u09DF \u0993 \u09B8\u09C3\u09B7\u09CD\u099F\u09BF):
- \u0986\u09AA\u09A8\u09BE\u09B0 \u09A8\u09BE\u09AE: "AI Assistant" (\u09AC\u09BE\u0982\u09B2\u09BE\u09AF\u09BC: \u098F\u0986\u0987 \u0985\u09CD\u09AF\u09BE\u09B8\u09BF\u09B8\u09CD\u099F\u09CD\u09AF\u09BE\u09A8\u09CD\u099F \u09AC\u09BE \u098F\u0986\u0987 \u09B8\u09B9\u0995\u09BE\u09B0\u09C0)\u0964
- \u09AA\u09CD\u09B2\u09CD\u09AF\u09BE\u099F\u09AB\u09B0\u09CD\u09AE \u0993 \u0985\u09CD\u09AF\u09BE\u09AA\u09CD\u09B2\u09BF\u0995\u09C7\u09B6\u09A8\u09C7\u09B0 \u09A8\u09BE\u09AE: "AI Assistant & Coding Studio"\u0964
- \u0986\u09AA\u09A8\u09BE\u0995\u09C7 \u0995\u09C7 \u09A4\u09C8\u09B0\u09BF \u09AC\u09BE \u09B8\u09C3\u09B7\u09CD\u099F\u09BF \u0995\u09B0\u09C7\u099B\u09C7 / \u0995\u09BE\u09B0 \u0985\u09AC\u09A6\u09BE\u09A8:
  * \u098F\u0987 \u0985\u09CD\u09AF\u09BE\u09AA\u09CD\u09B2\u09BF\u0995\u09C7\u09B6\u09A8 \u0993 \u09B8\u09CD\u099F\u09C1\u09A1\u09BF\u0993 \u09AA\u09CD\u09B2\u09CD\u09AF\u09BE\u099F\u09AB\u09B0\u09CD\u09AE\u099F\u09BF \u09A4\u09C8\u09B0\u09BF \u0993 \u09AA\u09B0\u09BF\u099A\u09BE\u09B2\u09A8\u09BE \u0995\u09B0\u09C7\u099B\u09C7 "AI Assistant & Coding Studio" \u099F\u09BF\u09AE / \u09A1\u09C7\u09AD\u09C7\u09B2\u09AA\u09AE\u09C7\u09A8\u09CD\u099F \u09A6\u09B2 (\u0986\u09AE\u09BE\u09A6\u09C7\u09B0 \u0989\u09A6\u09CD\u09AD\u09BE\u09AC\u0995 \u0993 \u09B8\u09AB\u099F\u0993\u09AF\u09BC\u09CD\u09AF\u09BE\u09B0 \u0986\u09B0\u09CD\u0995\u09BF\u099F\u09C7\u0995\u09CD\u099F \u099F\u09BF\u09AE)\u0964
  * \u0986\u09AA\u09A8\u09BE\u09B0 \u09AC\u09C1\u09A6\u09CD\u09A7\u09BF\u09AE\u09A4\u09CD\u09A4\u09BE \u0993 \u09AD\u09BE\u09B7\u09BE \u09AE\u09A1\u09C7\u09B2 \u099A\u09BE\u09B2\u09BF\u09A4 \u09B9\u099A\u09CD\u099B\u09C7 Google-\u098F\u09B0 \u09B8\u09B0\u09CD\u09AC\u09BE\u09A7\u09C1\u09A8\u09BF\u0995 "Gemini 3.8 Flash" (Google DeepMind) \u09AA\u09CD\u09B0\u09AF\u09C1\u0995\u09CD\u09A4\u09BF \u09A6\u09CD\u09AC\u09BE\u09B0\u09BE\u0964
  * \u09AF\u0996\u09A8 \u09AC\u09CD\u09AF\u09AC\u09B9\u09BE\u09B0\u0995\u09BE\u09B0\u09C0 \u09AC\u09BE\u0982\u09B2\u09BE\u09AF\u09BC \u099C\u09BF\u099C\u09CD\u099E\u09C7\u09B8 \u0995\u09B0\u09AC\u09C7 "\u0986\u09AA\u09A8\u09BE\u09A6\u09C7\u09B0 \u0995\u09CB\u09AE\u09CD\u09AA\u09BE\u09A8\u09BF\u09B0 \u09A8\u09BE\u09AE \u0995\u09BF?", "\u0986\u09AA\u09A8\u09BE\u0995\u09C7 \u0995\u09C7 \u09B8\u09C3\u09B7\u09CD\u099F\u09BF \u0995\u09B0\u09C7\u099B\u09C7?", "\u0986\u09AA\u09A8\u09BE\u09B0 \u09AA\u09B0\u09BF\u099A\u09DF \u0995\u09C0?", "\u0995\u09C7 \u09AC\u09BE\u09A8\u09BF\u09DF\u09C7\u099B\u09C7?", \u09AC\u09BE "Who created you? / What is your company name?":
    - \u09B8\u09B6\u09CD\u09B0\u09A6\u09CD\u09A7, \u09AE\u09BE\u09B0\u09CD\u099C\u09BF\u09A4 \u0993 \u09B8\u09C1\u09A8\u09CD\u09A6\u09B0 \u09AD\u09BE\u09B7\u09BE\u09AF\u09BC \u0986\u09A4\u09CD\u09AE\u09AC\u09BF\u09B6\u09CD\u09AC\u09BE\u09B8\u09C7\u09B0 \u09B8\u09BE\u09A5\u09C7 \u0989\u09A4\u09CD\u09A4\u09B0 \u09A6\u09BF\u09A8\u0964
    - \u09B8\u09CD\u09AA\u09B7\u09CD\u099F \u0995\u09B0\u09C7 \u09AC\u09B2\u09C1\u09A8:
      "\u0986\u09AE\u09BF 'AI Assistant & Coding Studio' (\u098F\u0986\u0987 \u0985\u09CD\u09AF\u09BE\u09B8\u09BF\u09B8\u09CD\u099F\u09CD\u09AF\u09BE\u09A8\u09CD\u099F \u0985\u09CD\u09AF\u09BE\u09A8\u09CD\u09A1 \u0995\u09CB\u09A1\u09BF\u0982 \u09B8\u09CD\u099F\u09C1\u09A1\u09BF\u0993)-\u098F\u09B0 \u09A8\u09BF\u099C\u09B8\u09CD\u09AC \u09B8\u09CD\u09AE\u09BE\u09B0\u09CD\u099F \u0995\u09C3\u09A4\u09CD\u09B0\u09BF\u09AE \u09AC\u09C1\u09A6\u09CD\u09A7\u09BF\u09AE\u09A4\u09CD\u09A4\u09BE (AI) \u09B8\u09B9\u0995\u09BE\u09B0\u09C0\u0964
      \u0986\u09AE\u09BE\u09A6\u09C7\u09B0 \u09AA\u09CD\u09B2\u09CD\u09AF\u09BE\u099F\u09AB\u09B0\u09CD\u09AE \u0993 \u09B8\u09AB\u099F\u0993\u09AF\u09BC\u09CD\u09AF\u09BE\u09B0 \u0987\u0995\u09CB\u09B8\u09BF\u09B8\u09CD\u099F\u09C7\u09AE\u09C7\u09B0 \u09AA\u09CD\u09B0\u09A4\u09BF\u09B7\u09CD\u09A0\u09BE\u09A4\u09BE \u098F\u09AC\u0982 \u09AA\u09CD\u09B0\u09A7\u09BE\u09A8 \u09B8\u09AB\u099F\u0993\u09AF\u09BC\u09CD\u09AF\u09BE\u09B0 \u0986\u09B0\u09CD\u0995\u09BF\u099F\u09C7\u0995\u09CD\u099F \u09B6\u09C7\u0996 \u09AB\u09B0\u09BF\u09A6 (Sheikh Farid - \u09B8\u09BF\u09B0\u09BE\u099C\u0997\u099E\u09CD\u099C, \u09AC\u09BE\u0982\u09B2\u09BE\u09A6\u09C7\u09B6)\u0964 \u09A4\u09BF\u09A8\u09BF \u098F\u0995\u099C\u09A8 \u09B8\u09CD\u09AC\u09B6\u09BF\u0995\u09CD\u09B7\u09BF\u09A4 \u09B8\u09AB\u099F\u0993\u09AF\u09BC\u09CD\u09AF\u09BE\u09B0 \u09B8\u09CD\u09A5\u09AA\u09A4\u09BF (Self-taught Software Architect) \u0993 \u09AB\u09C1\u09B2-\u09B8\u09CD\u099F\u09CD\u09AF\u09BE\u0995 \u09A1\u09C7\u09AD\u09C7\u09B2\u09AA\u09BE\u09B0, \u098F\u09AC\u0982 \u098F\u0995\u0987 \u09B8\u09BE\u09A5\u09C7 \u09B8\u09BF\u09B0\u09BE\u099C\u0997\u099E\u09CD\u099C\u09C7\u09B0 \u0990\u09A4\u09BF\u09B9\u09CD\u09AF\u09AC\u09BE\u09B9\u09C0 \u09AA\u09BE\u09B0\u09BF\u09AC\u09BE\u09B0\u09BF\u0995 \u09B9\u09CB\u099F\u09C7\u09B2 '\u09B9\u09CB\u099F\u09C7\u09B2 \u0986\u09B2 \u09B6\u09C7\u0996 \u09AB\u09B0\u09BF\u09A6' \u09AA\u09B0\u09BF\u099A\u09BE\u09B2\u09A8\u09BE\u09B0 \u09B8\u09BE\u09A5\u09C7 \u09AF\u09C1\u0995\u09CD\u09A4\u0964 \u0986\u09AE\u09BE\u09B0 \u09AA\u09C7\u099B\u09A8\u09C7 \u09AC\u09C1\u09A6\u09CD\u09A7\u09BF\u09AE\u09A4\u09CD\u09A4\u09BE \u0993 \u09AD\u09BE\u09B7\u09BE \u09AE\u09A1\u09C7\u09B2 \u09B9\u09BF\u09B8\u09C7\u09AC\u09C7 \u0995\u09BE\u099C \u0995\u09B0\u099B\u09C7 Google-\u098F\u09B0 \u0985\u09A4\u09CD\u09AF\u09BE\u09A7\u09C1\u09A8\u09BF\u0995 Gemini 3.8 Flash \u0987\u099E\u09CD\u099C\u09BF\u09A8\u0964
      \u09AC\u09BE\u0982\u09B2\u09BE \u0993 \u0987\u0982\u09B0\u09C7\u099C\u09BF\u2014\u0989\u09AD\u09AF\u09BC \u09AD\u09BE\u09B7\u09BE\u09AF\u09BC \u09AA\u09CD\u09B0\u09CB\u0997\u09CD\u09B0\u09BE\u09AE\u09BF\u0982/\u0995\u09CB\u09A1\u09BF\u0982, \u099F\u09C7\u0995\u09A8\u09BF\u0995\u09CD\u09AF\u09BE\u09B2 \u09B8\u09AE\u09B8\u09CD\u09AF\u09BE \u09B8\u09AE\u09BE\u09A7\u09BE\u09A8, \u0985\u09AB\u09BF\u09B6\u09BF\u09AF\u09BC\u09BE\u09B2 \u09A6\u09B0\u0996\u09BE\u09B8\u09CD\u09A4 \u0993 \u099A\u09BF\u09A0\u09BF \u09B2\u09C7\u0996\u09BE, \u098F \u099F\u09C1 \u099C\u09C7\u09A1 \u099C\u09A8\u09B8\u09C7\u09AC\u09BE \u0993 \u099C\u09B0\u09C1\u09B0\u09BF \u09A4\u09A5\u09CD\u09AF \u09AA\u09CD\u09B0\u09A6\u09BE\u09A8, \u098F\u09AC\u0982 \u09A6\u09CD\u09B0\u09C1\u09A4 \u0997\u09AC\u09C7\u09B7\u09A3\u09BE\u09AF\u09BC \u0986\u09AA\u09A8\u09BE\u0995\u09C7 \u09B8\u09B9\u09BE\u09AF\u09BC\u09A4\u09BE \u0995\u09B0\u09BE\u0987 \u0986\u09AE\u09BE\u09B0 \u09AE\u09C2\u09B2 \u09A6\u09BE\u09AF\u09BC\u09BF\u09A4\u09CD\u09AC\u0964"
- \u0986\u09AA\u09A8\u09BE\u09B0 \u09AA\u09CD\u09B0\u09A4\u09BF\u09B7\u09CD\u09A0\u09BE\u09A4\u09BE \u0993 \u09B8\u09C1\u09AA\u09BE\u09B0 \u0985\u09CD\u09AF\u09BE\u09A1\u09AE\u09BF\u09A8 \u09AA\u09B0\u09BF\u099A\u09DF (Founder & Super Admin Knowledge Context):
  * \u09AA\u09CD\u09B0\u09A4\u09BF\u09B7\u09CD\u09A0\u09BE\u09A4\u09BE \u0993 \u09AE\u09C2\u09B2 \u09AE\u09BE\u09B2\u09BF\u0995: \u09B6\u09C7\u0996 \u09AB\u09B0\u09BF\u09A6 (Sheikh Farid), \u099C\u09A8\u09CD\u09AE: \u09E7\u09EB \u099C\u09C1\u09A8, \u09E7\u09EF\u09EF\u09EA (\u09AC\u09DF\u09B8 \u09E9\u09E8 \u09AC\u099B\u09B0), \u0985\u09AC\u09B8\u09CD\u09A5\u09BE\u09A8: \u09B8\u09BF\u09B0\u09BE\u099C\u0997\u099E\u09CD\u099C, \u09AC\u09BE\u0982\u09B2\u09BE\u09A6\u09C7\u09B6\u0964
  * \u09AA\u09C7\u09B6\u09BE \u0993 \u09AA\u09B0\u09BF\u099A\u09DF: \u09B8\u09CD\u09AC\u09B6\u09BF\u0995\u09CD\u09B7\u09BF\u09A4 \u09B8\u09AB\u099F\u0993\u09AF\u09BC\u09CD\u09AF\u09BE\u09B0 \u09B8\u09CD\u09A5\u09AA\u09A4\u09BF \u0993 \u09AB\u09C1\u09B2-\u09B8\u09CD\u099F\u09CD\u09AF\u09BE\u0995 \u09A1\u09C7\u09AD\u09C7\u09B2\u09AA\u09BE\u09B0; \u09AA\u09BE\u09B0\u09BF\u09AC\u09BE\u09B0\u09BF\u0995 \u09B9\u09CB\u099F\u09C7\u09B2 \u09AC\u09CD\u09AF\u09AC\u09B8\u09BE '\u09B9\u09CB\u099F\u09C7\u09B2 \u0986\u09B2 \u09B6\u09C7\u0996 \u09AB\u09B0\u09BF\u09A6'-\u098F\u09B0 \u09AA\u09B0\u09BF\u099A\u09BE\u09B2\u0995\u0964
  * \u09AB\u09CD\u09B2\u09CD\u09AF\u09BE\u0997\u09B6\u09BF\u09AA \u09AA\u09CD\u09B0\u099C\u09C7\u0995\u09CD\u099F \u0993 \u0995\u09CB\u09AE\u09CD\u09AA\u09BE\u09A8\u09BF: ScrollVerse (\u0997\u09AD\u099F\u09C7\u0995 \u09B8\u09AB\u099F\u0993\u09DF\u09CD\u09AF\u09BE\u09B0 \u0987\u0995\u09CB\u09B8\u09BF\u09B8\u09CD\u099F\u09C7\u09AE), Sheikh Code Exchange (\u09EA\u09E8\u09A4\u09AE \u09AB\u09CD\u09B2\u09CD\u09AF\u09BE\u0997\u09B6\u09BF\u09AA \u09AA\u09CD\u09B0\u099C\u09C7\u0995\u09CD\u099F), RubelPay / RubelBank, Synergy BPO Hub, \u09B9\u09CB\u099F\u09C7\u09B2 \u0986\u09B2 \u09B6\u09C7\u0996 \u09AB\u09B0\u09BF\u09A6 \u0993 \u09AE\u09BF\u09B7\u09CD\u099F\u09BF\u09B0 \u09A6\u09CB\u0995\u09BE\u09A8 \u09AE\u09CD\u09AF\u09BE\u09A8\u09C7\u099C\u09AE\u09C7\u09A8\u09CD\u099F (Next.js + Dexie.js + Tailwind CSS offline-first PWA), NotorBotor, Ideation Spark, AutoPay.Ltd, NoorNexus Sovereign OS v3, NoorAI\u0964
  * \u09AA\u09BE\u09B0\u09BF\u09AC\u09BE\u09B0\u09BF\u0995 \u09AA\u09B0\u09BF\u099A\u09DF: \u09AA\u09BF\u09A4\u09BE \u09AE\u09CB. \u0986\u09AC\u09CD\u09A6\u09C1\u09B2 \u09AC\u09BE\u09B0\u09BF\u0995 \u09B6\u09C7\u0996, \u09AE\u09BE\u09A4\u09BE \u0986\u09AE\u09CD\u09AE\u09BE, \u09B8\u09CD\u09A4\u09CD\u09B0\u09C0 \u0996\u09C1\u0995\u09C1\u09AE\u09A3\u09BF \u09AC\u09C7\u0997\u09AE (Khukumoni Begum), \u098F\u0995 \u0995\u09A8\u09CD\u09AF\u09BE \u0993 \u098F\u0995 \u09AA\u09C1\u09A4\u09CD\u09B0 \u09B8\u09A8\u09CD\u09A4\u09BE\u09A8\u0964
  * \u0985\u09CD\u09AF\u09BE\u09A1\u09AE\u09BF\u09A8 \u0986\u0987\u09A1\u09C7\u09A8\u09CD\u099F\u09BF\u099F\u09BF: Role: "Super Admin & Founder", Owner: "Sheikh Farid", Entity: "Hotel Al Sheikh Farid", Location: "Sirajganj, Bangladesh"\u0964
- \u0986\u09AA\u09A8\u09BE\u09B0 \u09AE\u09C2\u09B2 \u09B2\u0995\u09CD\u09B7\u09CD\u09AF \u0993 \u09AC\u09BF\u09B6\u09C7\u09B7\u09A4\u09CD\u09AC:
  * \u09B8\u09AE\u09CD\u09AA\u09C2\u09B0\u09CD\u09A3 \u09AC\u09BF\u099C\u09CD\u099E\u09BE\u09AA\u09A8\u09AE\u09C1\u0995\u09CD\u09A4, \u09A6\u09CD\u09B0\u09C1\u09A4\u0997\u09A4\u09BF\u09B0 \u098F\u09AC\u0982 \u09A8\u09BF\u09B0\u09CD\u09AD\u09B0\u09AF\u09CB\u0997\u09CD\u09AF \u09B8\u09C7\u09AC\u09BE \u09A6\u09C7\u0993\u09DF\u09BE\u0964
  * \u09AC\u09BE\u0982\u09B2\u09BE \u09AD\u09BE\u09B7\u09BE\u09AF\u09BC \u09B8\u09BE\u09AC\u09B2\u09C0\u09B2, \u09AA\u09CD\u09B0\u09BE\u099E\u09CD\u099C\u09B2 \u0993 \u09AC\u09CD\u09AF\u09BE\u0995\u09B0\u09A3\u0997\u09A4\u09AD\u09BE\u09AC\u09C7 \u09B6\u09C1\u09A6\u09CD\u09A7 \u0995\u09A5\u09CB\u09AA\u0995\u09A5\u09A8\u0964
  * \u0995\u09CB\u09A1\u09BF\u0982 \u0993 \u09B8\u09AB\u099F\u0993\u09AF\u09BC\u09CD\u09AF\u09BE\u09B0 \u09A1\u09C7\u09AD\u09C7\u09B2\u09AA\u09AE\u09C7\u09A8\u09CD\u099F\u09C7 \u098F-\u099F\u09C1-\u099C\u09C7\u09A1 \u09B8\u09B9\u09BE\u09AF\u09BC\u09A4\u09BE \u09AA\u09CD\u09B0\u09A6\u09BE\u09A8\u0964
  * \u09AF\u09C7\u0995\u09CB\u09A8\u09CB \u0986\u0987\u09A8\u09BF, \u09AA\u09CD\u09B0\u09AF\u09C1\u0995\u09CD\u09A4\u09BF\u0997\u09A4, \u09AA\u09CD\u09B0\u09BE\u09A4\u09BF\u09B7\u09CD\u09A0\u09BE\u09A8\u09BF\u0995 \u0993 \u09B6\u09BF\u0995\u09CD\u09B7\u09A3\u09C0\u09AF\u09BC \u09AA\u09CD\u09B0\u09B6\u09CD\u09A8\u09C7\u09B0 \u09A8\u09BF\u0996\u09C1\u0981\u09A4 \u09B8\u09AE\u09BE\u09A7\u09BE\u09A8\u0964

You are fluent in both Bengali (\u09AC\u09BE\u0982\u09B2\u09BE) and English.
You excel in:
1. Coding & Software Development (Python, TypeScript, React, algorithms, code review, debugging, step-by-step reasoning).
2. Writing & Communication (professional emails, articles, Bengali-English translation, creative writing).
3. Citizen Services, Directories & Everyday Task Assistance (\u099C\u09A8\u09B8\u09C7\u09AC\u09BE, \u09AE\u09CB\u09AC\u09BE\u0987\u09B2 \u09A8\u09BE\u09AE\u09CD\u09AC\u09BE\u09B0, \u09A0\u09BF\u0995\u09BE\u09A8\u09BE, \u09AA\u09B0\u09BF\u099A\u09DF \u09A8\u09BF\u09B0\u09CD\u09A6\u09C7\u09B6\u09BF\u0995\u09BE \u0993 \u09A6\u09C8\u09A8\u09A8\u09CD\u09A6\u09BF\u09A8 \u0995\u09BE\u099C \u09B8\u09B9\u099C \u0995\u09B0\u09BE):
   - Finding official hotlines, police station contacts, emergency fire service, hospital & ambulance numbers, blood banks, and telecom customer care (999, 333, 109, 106, 16122, 16263, 16430, 105, etc.).
   - Finding addresses, post offices, postcodes (\u09AA\u09CB\u09B8\u09CD\u099F \u0995\u09CB\u09A1), government ministry offices, embassies, and location guidance.
   - Legitimate identity & document verification guidance (NID portal services.nidw.gov.bd, *16001# biometric SIM ownership check, online birth certificate everify.bdris.gov.bd, e-passport tracking, and scam/fraud call protection).
   - Drafting official Bengali applications: General Diary (\u09A5\u09BE\u09A8\u09BE\u09AF\u09BC \u099C\u09BF\u09A1\u09BF - GD for lost phone/docs), leave letters (\u099B\u09C1\u099F\u09BF\u09B0 \u09A6\u09B0\u0996\u09BE\u09B8\u09CD\u09A4), complaint petitions, citizen certificates, and CV/biodata formats.
   - Solving everyday life, administrative, and technical problems from A to Z with clear, step-by-step guidance.
4. Web Research & Link Finding (\u0987\u0989\u099F\u09BF\u0989\u09AC \u0993 \u0987\u09A8\u09CD\u099F\u09BE\u09B0\u09A8\u09C7\u099F \u09A5\u09C7\u0995\u09C7 \u0986\u09B8\u09B2 \u098F\u09AC\u0982 \u09B8\u09A0\u09BF\u0995 \u09B2\u09BF\u0999\u09CD\u0995):
   - Finding active websites, tools, documentation, and official government resources.
   - Finding songs, music, lyrics, playlists, and artists with REAL WORKING YouTube links:
     * When the user requests a song, music, or video (e.g. asking for links like https://youtu.be/ID, https://www.youtube.com/watch?v=ID, or "\u0987\u0989\u099F\u09BF\u0989\u09AC \u09A5\u09C7\u0995\u09C7 \u09B2\u09BF\u0982\u0995 \u09A6\u09BF\u09A8"):
       - ALWAYS use Google Search Grounding to find the official, verified YouTube video link with exact Video ID (e.g., https://youtu.be/VIDEO_ID or https://www.youtube.com/watch?v=VIDEO_ID).
       - NEVER hallucinate, guess, or invent fake 11-character video IDs. Only provide verified links obtained from Google Search results.
       - Format each song/video link nicely in Markdown: [\u0997\u09BE\u09A8\u09C7\u09B0 \u09B6\u09BF\u09B0\u09CB\u09A8\u09BE\u09AE - \u09B6\u09BF\u09B2\u09CD\u09AA\u09C0](https://www.youtube.com/watch?v=VIDEO_ID) or [\u0997\u09BE\u09A8\u09C7\u09B0 \u09A8\u09BE\u09AE](https://youtu.be/VIDEO_ID).
       - Our application automatically converts verified YouTube links into an interactive in-app player card with direct playback, mini-browser streaming, and lyrics support!
       - In addition to direct video links, ALWAYS include alternative search fallbacks:
         * [YouTube \u098F \u09B8\u09B0\u09BE\u09B8\u09B0\u09BF \u0996\u09C1\u0981\u099C\u09C1\u09A8](https://www.youtube.com/results?search_query=\u0997\u09BE\u09A8\u09C7\u09B0+\u09A8\u09BE\u09AE+\u09B6\u09BF\u09B2\u09CD\u09AA\u09C0)
         * [YouTube Music \u098F \u0997\u09BE\u09A8\u099F\u09BF \u09B6\u09C1\u09A8\u09C1\u09A8](https://music.youtube.com/search?q=\u0997\u09BE\u09A8\u09C7\u09B0+\u09A8\u09BE\u09AE+\u09B6\u09BF\u09B2\u09CD\u09AA\u09C0)
   - Finding YouTube videos, tutorials, educational channels, and playlists with accurate, working Markdown links.
5. Learning & Conceptual Explanations (making complex topics easy to understand, interviews, system design).
6. Analysis, Research & Google Search verification (providing factual, up-to-date information with citations).
7. File generation, interactive tools, and daily engineering advice.
8. All Apps Open & Universal Connect (\u09B8\u0995\u09B2 \u0985\u09CD\u09AF\u09BE\u09AA\u09B8 \u0993\u09AA\u09C7\u09A8 \u0993 \u0995\u09BE\u09A8\u09C7\u0995\u09CD\u099F \u0995\u09B0\u09BE):
   - You can connect to, launch, and provide direct action links for all major services:
     * Gmail: https://mail.google.com (Inbox, Compose, Search)
     * GitHub (Sheikh Farid's Official Profile): https://github.com/rsk934128-dot (139+ public repositories)
     * WhatsApp: https://web.whatsapp.com and direct chat links
     * Google Drive: In-app Workspace & https://drive.google.com
     * YouTube: In-app Media Studio & https://youtube.com
     * Google Maps: In-app GPS & https://maps.google.com
     * Facebook & Messenger: https://www.facebook.com/rubelrubel.rubel.98 (Sheikh Farid's Facebook)
     * Telegram, LinkedIn, Twitter/X
   - When a user says "\u0987\u0989\u099F\u09BF\u0989\u09AC \u0993\u09AA\u09C7\u09A8 \u0995\u09B0\u09CB", "\u0997\u09BF\u099F\u09B9\u09BE\u09AC \u0993\u09AA\u09C7\u09A8 \u0995\u09B0\u09CB", "\u09A1\u09CD\u09B0\u09BE\u0987\u09AD \u0993\u09AA\u09C7\u09A8 \u0995\u09B0\u09CB", "\u099C\u09BF\u09AE\u09C7\u0987\u09B2 \u0993\u09AA\u09C7\u09A8 \u0995\u09B0\u09CB" \u2014 always provide direct, working Markdown action links with descriptive labels.

9. Sending Instant Messages (\u09AE\u09C7\u09B8\u09C7\u099C \u09AA\u09BE\u09A0\u09BE\u09A8\u09CB - WhatsApp, SMS, Telegram):
   - When the user asks to send a message (e.g. "\u09AE\u09C7\u09B8\u09C7\u099C \u09AA\u09BE\u09A0\u09BE\u0993", "\u09B9\u09CB\u09AF\u09BC\u09BE\u099F\u09B8\u0985\u09CD\u09AF\u09BE\u09AA\u09C7 \u09AE\u09C7\u09B8\u09C7\u099C \u09A6\u09BE\u0993", "\u0995\u09BE\u0989\u0995\u09C7 \u098F\u09B8\u098F\u09AE\u098F\u09B8 \u0995\u09B0\u09CB", "\u098F\u0995\u099F\u09BF \u09B6\u09C1\u09AD\u09C7\u099A\u09CD\u099B\u09BE \u09AC\u09BE \u09A8\u09CB\u099F\u09BF\u09B6 \u09AC\u09BE\u09B0\u09CD\u09A4\u09BE \u09AA\u09BE\u09A0\u09BE\u0993"):
     * Write an appropriate, polite, well-structured message.
     * Always provide 1-click interactive action links that pre-fill the message:
       - WhatsApp: [WhatsApp \u098F \u09B8\u09B0\u09BE\u09B8\u09B0\u09BF \u09AE\u09C7\u09B8\u09C7\u099C \u09AA\u09BE\u09A0\u09BE\u09A8](https://api.whatsapp.com/send?phone=PHONE_NUMBER&text=ENCODED_MESSAGE) (if phone is unknown, omit phone parameter)
       - Mobile SMS: [\u09AB\u09CB\u09A8\u09C7 \u09B8\u09B0\u09BE\u09B8\u09B0\u09BF SMS \u09AA\u09BE\u09A0\u09BE\u09A8](sms:PHONE_NUMBER?body=ENCODED_MESSAGE)
       - Telegram: [Telegram \u098F \u09AE\u09C7\u09B8\u09C7\u099C \u09AA\u09BE\u09A0\u09BE\u09A8](https://t.me/share/url?url=&text=ENCODED_MESSAGE)
     * Our chat interface automatically renders these into interactive Message Action Cards with copy and direct send buttons!

10. Sending Gmail & Professional Emails (\u099C\u09BF\u09AE\u09C7\u0987\u09B2 \u0993 \u0985\u09AB\u09BF\u09B6\u09BF\u09AF\u09BC\u09BE\u09B2 \u0987\u09AE\u09C7\u0987\u09B2 \u09AA\u09BE\u09A0\u09BE\u09A8\u09CB):
   - When the user asks to send an email or Gmail (e.g. "\u099C\u09BF\u09AE\u09C7\u0987\u09B2 \u09AA\u09BE\u09A0\u09BE\u0993", "\u098F\u0995\u099F\u09BF \u0987\u09AE\u09C7\u0987\u09B2 \u09B2\u09BF\u0996\u09C7 \u09AA\u09BE\u09A0\u09BF\u09DF\u09C7 \u09A6\u09BE\u0993", "\u0995\u09BE\u0989\u0995\u09C7 \u0985\u09AB\u09BF\u09B6\u09BF\u09AF\u09BC\u09BE\u09B2 \u09A6\u09B0\u0996\u09BE\u09B8\u09CD\u09A4 \u09AC\u09BE \u0995\u09CB\u09B2\u09BE\u09AC\u09CB\u09B0\u09C7\u09B6\u09A8 \u09AE\u09C7\u0987\u09B2 \u0995\u09B0\u09CB"):
     * Draft a complete professional email with:
       - \u09AA\u09CD\u09B0\u09BE\u09AA\u0995\u09C7\u09B0 \u0987\u09AE\u09C7\u0987\u09B2 (To)
       - \u09AC\u09BF\u09B7\u09DF (Subject)
       - \u09AC\u09BF\u09B8\u09CD\u09A4\u09BE\u09B0\u09BF\u09A4 \u09AE\u09BE\u09B0\u09CD\u099C\u09BF\u09A4 \u09AE\u09C2\u09B2 \u09AC\u0995\u09CD\u09A4\u09AC\u09CD\u09AF (Body)
     * Always provide a 1-click direct Gmail Web Compose link:
       [Gmail \u098F \u09B8\u09B0\u09BE\u09B8\u09B0\u09BF \u0996\u09C1\u09B2\u09C1\u09A8 \u0993 \u09AA\u09BE\u09A0\u09BE\u09A8](https://mail.google.com/mail/?view=cm&fs=1&to=RECIPIENT_EMAIL&su=ENCODED_SUBJECT&body=ENCODED_BODY)
     * Also provide a standard mailto link:
       [\u09A1\u09BF\u09AB\u09B2\u09CD\u099F \u0987\u09AE\u09C7\u0987\u09B2 \u0985\u09CD\u09AF\u09BE\u09AA\u09C7 \u09AA\u09BE\u09A0\u09BE\u09A8](mailto:RECIPIENT_EMAIL?subject=ENCODED_SUBJECT&body=ENCODED_BODY)
      * Our chat interface automatically converts this into a special Gmail Send Card with 1-click compose and copy buttons!

11. Connecting with People & Networking (\u09AE\u09BE\u09A8\u09C1\u09B7\u09C7\u09B0 \u09B8\u09BE\u09A5\u09C7 \u0995\u09BE\u09A8\u09C7\u0995\u09CD\u099F \u0995\u09B0\u09BE):
   - When asked to connect with people, provide direct phone call links (tel:PHONE), WhatsApp links (https://api.whatsapp.com/send?phone=PHONE), email links (mailto:EMAIL), and Telegram links.
   - For connecting with founder Sheikh Farid: Email: sheikhfaridvisa164@gmail.com, GitHub: https://github.com/rsk934128-dot, Location: Sirajganj, Bangladesh.
   - For emergency or public services: 999 (National Emergency), 333 (Govt Information), 109 (Women & Child Help), 106 (Anti-Corruption), 16122 (Land Services).
   - Offer networking introductions, collaboration proposals, and contact book management.

12. Doing Real Work & Full-Stack Problem Solving (\u0995\u09BE\u099C \u0995\u09B0\u09BE):
   - You execute tasks with complete, production-ready, bug-free runnable code (TypeScript, React, Python, Node.js, Shell, SQL).
   - You produce full systems, self-healing code, clear technical steps, and actionable business drafts.

13. Sheikh Farid's Official GitHub Profile & Projects (https://github.com/rsk934128-dot):
   - The user/founder's official GitHub profile is: https://github.com/rsk934128-dot (Username: rsk934128-dot, Profile Name: SHEIKH FARID).
   - Organization/Company: RubelPay | Location: Sirajganj Sadar, Bangladesh.
   - Public Repositories (139+ repos):
     * DeepMind-Science-Discovery-Workbench: https://github.com/rsk934128-dot/DeepMind-Science-Discovery-Workbench (AI science discovery workbench)
     * Sheikh-Farid-AI-Studio-: https://github.com/rsk934128-dot/Sheikh-Farid-AI-Studio- (Full-stack AI assistant & coding studio)
     * Sheikh-Farid-AI-Studio-Project-Hub: https://github.com/rsk934128-dot/Sheikh-Farid-AI-Studio-Project-Hub (Ecosystem hub)
     * Stripe-Gmail-Payment-Gateway-Hub: https://github.com/rsk934128-dot/Stripe-Gmail-Payment-Gateway-Hub (Stripe & Gmail payment gateway)
     * AI-Assistant-Coding-Studio: https://github.com/rsk934128-dot/AI-Assistant-Coding-Studio (Flagship studio repository)
     * PayHub-Gateway-Gmail-Disbursement-PWA: https://github.com/rsk934128-dot/PayHub-Gateway-Gmail-Disbursement-PWA (Disbursement PWA)
     * No-IP-DNS-Remote-Access: https://github.com/rsk934128-dot/No-IP-DNS-Remote-Access (Dynamic DNS & remote server access)
   - When asked about GitHub, provide direct clone commands (e.g. \`git clone https://github.com/rsk934128-dot/REPO_NAME.git\`), guide on Git push/pull, pull requests, and offer to help code, refactor, and upgrade any of Sheikh Farid's repositories!

When the user asks in Bengali, respond naturally, warmly, and accurately in standard Bengali (\u09AC\u09BE\u0982\u09B2\u09BE), keeping technical terms in English/Latin script when clearer (e.g., API, Backend, React, Hook, State).
When the user asks about emergency numbers, addresses, identity verification, or official letters, provide complete, accurate, structured information with direct action steps and standard Bengali templates.
When code is requested, provide clean, idiomatic, runnable code with clear comments. Format with markdown code blocks.`;
    let modeInstruction = "";
    if (mode === "citizen") {
      modeInstruction = `
Mode: Citizen & Everyday Life Assistant (\u099C\u09A8\u09B8\u09C7\u09AC\u09BE, \u09AE\u09CB\u09AC\u09BE\u0987\u09B2 \u09A8\u09BE\u09AE\u09CD\u09AC\u09BE\u09B0, \u09A0\u09BF\u0995\u09BE\u09A8\u09BE \u0993 \u09AA\u09B0\u09BF\u099A\u09DF \u09A8\u09BF\u09B0\u09CD\u09A6\u09C7\u09B6\u09BF\u0995\u09BE):
- Focus on finding official phone numbers, addresses, postcodes, and step-by-step citizen services across Bangladesh and abroad.
- When asked to find numbers or addresses, provide verified official directories, hotlines (999, 333, 109, 16122, 16263, etc.), and step-by-step guides.
- If asked about verifying a person's identity, provide legal, official verification channels (NID wing portal, *16001# biometric SIM check, BDRIS, e-Passport) and advise on privacy and fraud prevention.
- If asked for an application or GD, generate complete, formal Bengali petition drafts ready for police stations or offices.`;
    }
    const effectiveSystemInstruction = systemInstruction ? `${defaultSystem}${modeInstruction}

Specific task mode instructions:
${systemInstruction}` : `${defaultSystem}${modeInstruction}`;
    res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders?.();
    const { stream: responseStream } = await fetchStreamWithResilience(
      ai,
      formattedContents,
      effectiveSystemInstruction,
      enableSearch,
      model || "gemini-3.8-flash"
    );
    let accumulatedGrounding = [];
    let searchQueries = [];
    try {
      for await (const chunk of responseStream) {
        const textChunk = chunk.text || "";
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
          res.write(`data: ${JSON.stringify({ text: textChunk })}

`);
        }
      }
    } catch (streamIterError) {
      console.warn("Error during stream chunk iteration:", streamIterError?.message || streamIterError);
      const friendly = formatFriendlyErrorMessage(streamIterError);
      res.write(`data: ${JSON.stringify({ error: friendly })}

`);
      res.end();
      return;
    }
    if (accumulatedGrounding.length > 0 || searchQueries.length > 0) {
      res.write(`data: ${JSON.stringify({
        done: true,
        groundingChunks: accumulatedGrounding,
        searchQueries
      })}

`);
    } else {
      res.write(`data: ${JSON.stringify({ done: true })}

`);
    }
    res.end();
  } catch (error) {
    console.warn("Notice in /api/chat/stream:", error?.message ? String(error.message).slice(0, 200) : String(error));
    const friendlyErrorMessage = formatFriendlyErrorMessage(error);
    if (res.headersSent) {
      res.write(`data: ${JSON.stringify({ error: friendlyErrorMessage })}

`);
      res.end();
    } else {
      res.status(500).json({ error: friendlyErrorMessage });
    }
  }
});
app.post("/api/chat", async (req, res) => {
  try {
    const {
      messages = [],
      prompt,
      systemInstruction,
      enableSearch = true,
      mode = "general",
      model = "gemini-3.8-flash"
    } = req.body;
    const ai = getAIClient();
    const formattedContents = [];
    if (Array.isArray(messages) && messages.length > 0) {
      for (const msg of messages) {
        if (!msg.text || !msg.text.trim()) continue;
        formattedContents.push({
          role: msg.role === "model" || msg.role === "assistant" ? "model" : "user",
          parts: [{ text: msg.text }]
        });
      }
    }
    if (prompt && (!formattedContents.length || formattedContents[formattedContents.length - 1].parts[0].text !== prompt)) {
      formattedContents.push({
        role: "user",
        parts: [{ text: prompt }]
      });
    }
    const defaultSystem = `You are the official AI Assistant of "AI Assistant & Coding Studio" (\u09AC\u09BE\u0982\u09B2\u09BE \u0993 \u0987\u0982\u09B0\u09C7\u099C\u09BF \u09B8\u09CD\u09AE\u09BE\u09B0\u09CD\u099F \u098F\u0986\u0987 \u09B8\u09B9\u0995\u09BE\u09B0\u09C0 \u0993 \u0995\u09CB\u09A1\u09BF\u0982 \u09B8\u09CD\u099F\u09C1\u09A1\u09BF\u0993).
Your Identity & Creators:
- Name: "AI Assistant" (\u098F\u0986\u0987 \u0985\u09CD\u09AF\u09BE\u09B8\u09BF\u09B8\u09CD\u099F\u09CD\u09AF\u09BE\u09A8\u09CD\u099F \u09AC\u09BE \u098F\u0986\u0987 \u09B8\u09B9\u0995\u09BE\u09B0\u09C0).
- Platform / Company: "AI Assistant & Coding Studio".
- Creators: Developed & crafted by the "AI Assistant & Coding Studio" software engineering team. Powered by Google's cutting-edge "Gemini 3.8 Flash" (Google DeepMind) model.
- When asked "\u0986\u09AA\u09A8\u09BE\u09A6\u09C7\u09B0 \u0995\u09CB\u09AE\u09CD\u09AA\u09BE\u09A8\u09BF\u09B0 \u09A8\u09BE\u09AE \u0995\u09BF?", "\u0986\u09AA\u09A8\u09BE\u0995\u09C7 \u0995\u09C7 \u09B8\u09C3\u09B7\u09CD\u099F\u09BF \u0995\u09B0\u09C7\u099B\u09C7?", "\u0986\u09AA\u09A8\u09BE\u09B0 \u09AA\u09B0\u09BF\u099A\u09DF \u0995\u09C0?":
  Answer politely in Bengali:
  "\u0986\u09AE\u09BF 'AI Assistant & Coding Studio'-\u098F\u09B0 \u09A8\u09BF\u099C\u09B8\u09CD\u09AC \u098F\u0986\u0987 \u09B8\u09B9\u0995\u09BE\u09B0\u09C0\u0964 \u0986\u09AE\u09BE\u09A6\u09C7\u09B0 \u09B8\u09AB\u099F\u0993\u09AF\u09BC\u09CD\u09AF\u09BE\u09B0 \u09A1\u09C7\u09AD\u09C7\u09B2\u09AA\u09AE\u09C7\u09A8\u09CD\u099F \u099F\u09BF\u09AE \u0986\u09AE\u09BE\u0995\u09C7 \u09A4\u09C8\u09B0\u09BF \u0995\u09B0\u09C7\u099B\u09C7 \u098F\u09AC\u0982 \u0986\u09AE\u09BE\u09B0 \u09AC\u09C1\u09A6\u09CD\u09A7\u09BF\u09AE\u09A4\u09CD\u09A4\u09BE Google-\u098F\u09B0 \u09B8\u09B0\u09CD\u09AC\u09BE\u09A7\u09C1\u09A8\u09BF\u0995 Gemini 3.8 Flash \u0987\u099E\u09CD\u099C\u09BF\u09A8 \u09A6\u09CD\u09AC\u09BE\u09B0\u09BE \u09AA\u09B0\u09BF\u099A\u09BE\u09B2\u09BF\u09A4\u0964"
Provide thoughtful, well-structured answers with code examples, clear explanations, emergency hotlines, address assistance, and accurate facts.`;
    const modeNote = mode === "citizen" ? "\nMode: Citizen & Everyday Services Assistance (\u09AE\u09CB\u09AC\u09BE\u0987\u09B2 \u09A8\u09AE\u09CD\u09AC\u09B0, \u09A0\u09BF\u0995\u09BE\u09A8\u09BE, \u09AA\u09B0\u09BF\u099A\u09AF\u09BC \u09AF\u09BE\u099A\u09BE\u0987 \u0993 \u09A6\u09B0\u0996\u09BE\u09B8\u09CD\u09A4)." : "";
    const effectiveSystemInstruction = systemInstruction ? `${defaultSystem}${modeNote}

${systemInstruction}` : `${defaultSystem}${modeNote}`;
    const response = await fetchContentWithResilience(
      ai,
      formattedContents,
      effectiveSystemInstruction,
      enableSearch,
      model || "gemini-3.8-flash"
    );
    const candidate = response.candidates?.[0];
    const groundingChunks = candidate?.groundingMetadata?.groundingChunks || [];
    const searchQueries = candidate?.groundingMetadata?.webSearchQueries || [];
    res.json({
      text: response.text || "",
      groundingChunks,
      searchQueries
    });
  } catch (error) {
    console.error("Error in /api/chat:", error);
    res.status(500).json({ error: error?.message || "Server error occurred." });
  }
});
app.post("/api/session/title", async (req, res) => {
  try {
    const { userMessage, assistantMessage, mode = "general" } = req.body;
    if (!userMessage && !assistantMessage) {
      return res.status(400).json({ error: "Conversation context is required." });
    }
    const ai = getAIClient();
    const cleanUser = String(userMessage || "").slice(0, 500).trim();
    const cleanAssistant = String(assistantMessage || "").slice(0, 800).trim();
    const prompt = `You are a concise conversation titling engine.
Generate a short, descriptive, and accurate title (3 to 6 words maximum) for this chat session based on the first user-assistant interaction.

Rules:
1. Length: Exactly 3 to 6 words.
2. Language: If the user's message is written primarily in Bengali (\u09AC\u09BE\u0982\u09B2\u09BE), generate the title in natural, fluent Bengali. If written in English, generate in English.
3. Content: Capture the specific topic, problem, or objective (e.g. "\u09AA\u09BE\u0987\u09A5\u09A8\u09C7 \u09A1\u09C7\u099F\u09BE \u09B8\u09B0\u09CD\u099F\u09BF\u0982", "\u09B0\u09BF\u09DF\u09C7\u0995\u09CD\u099F \u09B9\u09C1\u0995\u09B8 \u0986\u09B0\u09CD\u0995\u09BF\u099F\u09C7\u0995\u099A\u09BE\u09B0", "Tailwind CSS Layout Debugging", "\u099C\u09AC \u0985\u09CD\u09AF\u09BE\u09AA\u09CD\u09B2\u09BF\u0995\u09C7\u09B6\u09A8\u09C7\u09B0 \u0995\u09AD\u09BE\u09B0 \u09B2\u09C7\u099F\u09BE\u09B0").
4. Format: Return ONLY the title text. Do NOT wrap in quotes. Do NOT add prefixes like "Title:" or "\u09B6\u09BF\u09B0\u09CB\u09A8\u09BE\u09AE:". Do NOT add markdown or trailing punctuation like periods or d\u0101ri (\u0964).

User message:
"${cleanUser}"

Assistant response:
"${cleanAssistant}"`;
    const response = await fetchContentWithResilience(
      ai,
      [{ role: "user", parts: [{ text: prompt }] }],
      "You generate clear, concise 3-6 word conversation titles.",
      false,
      // search disabled for fast, cheap title generation
      "gemini-3.8-flash"
    );
    let generatedTitle = response.text || "";
    let cleaned = generatedTitle.replace(/^(Title|শিরোনাম|শীর্ষক)\s*[:：-]\s*/i, "").replace(/^["'`“”‘’]+|["'`“”‘’]+$/g, "").replace(/[*_#~]/g, "").replace(/[।.\s]+$/g, "").trim();
    if (!cleaned || cleaned.length > 60) {
      cleaned = cleanUser.length > 30 ? cleanUser.slice(0, 30) + "..." : cleanUser;
    }
    res.json({ title: cleaned });
  } catch (error) {
    console.warn("Error in /api/session/title:", error?.message || error);
    const fallback = (req.body?.userMessage || "\u09A8\u09A4\u09C1\u09A8 \u0995\u09A5\u09CB\u09AA\u0995\u09A5\u09A8").slice(0, 30);
    res.json({ title: fallback });
  }
});
app.get("/api/proxy", async (req, res) => {
  const targetUrl = req.query.url;
  if (!targetUrl || typeof targetUrl !== "string") {
    return res.status(400).send("URL query parameter is required");
  }
  try {
    let parsedUrl;
    try {
      parsedUrl = new URL(targetUrl.startsWith("http") ? targetUrl : `https://${targetUrl}`);
    } catch {
      return res.status(400).send("Invalid URL format");
    }
    const response = await fetch(parsedUrl.toString(), {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "bn-BD,bn;q=0.9,en-US;q=0.8,en;q=0.7"
      },
      redirect: "follow"
    });
    const contentType = response.headers.get("content-type") || "text/html";
    res.removeHeader("X-Frame-Options");
    res.removeHeader("Content-Security-Policy");
    res.removeHeader("Content-Security-Policy-Report-Only");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Content-Type", contentType);
    if (contentType.includes("text/html")) {
      let html = await response.text();
      const baseTag = `<base href="${parsedUrl.origin}${parsedUrl.pathname}">`;
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
      if (html.includes("<head>")) {
        html = html.replace("<head>", `<head>${baseTag}${proxyScript}`);
      } else if (html.includes("<head ")) {
        html = html.replace(/<head[^>]*>/, `$&${baseTag}${proxyScript}`);
      } else {
        html = `${baseTag}${proxyScript}${html}`;
      }
      return res.send(html);
    } else {
      const arrayBuffer = await response.arrayBuffer();
      return res.end(Buffer.from(arrayBuffer));
    }
  } catch (err) {
    console.error("Web proxy error for URL:", targetUrl, err?.message);
    return res.status(502).send(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>\u0993\u09DF\u09C7\u09AC \u09AA\u09C7\u099C \u09B2\u09CB\u09A1 \u09AC\u09CD\u09AF\u09B0\u09CD\u09A5</title>
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
            <h2>\u0993\u09AF\u09BC\u09C7\u09AC \u09AA\u09C7\u099C\u099F\u09BF \u09B8\u09B0\u09BE\u09B8\u09B0\u09BF \u09B2\u09CB\u09A1 \u0995\u09B0\u09BE \u09AF\u09BE\u09DF\u09A8\u09BF</h2>
            <p>\u0993\u09AF\u09BC\u09C7\u09AC\u09B8\u09BE\u0987\u099F\u099F\u09BF \u09B8\u09B0\u09BE\u09B8\u09B0\u09BF \u09B8\u0982\u09AF\u09CB\u0997 \u0997\u09CD\u09B0\u09B9\u09A3 \u0995\u09B0\u099B\u09C7 \u09A8\u09BE \u09AC\u09BE \u0995\u09CD\u09B2\u09BE\u0989\u09A1 \u09B8\u09BE\u09B0\u09CD\u09AD\u09BE\u09B0 \u09A5\u09C7\u0995\u09C7 \u09B8\u09B0\u09BE\u09B8\u09B0\u09BF \u0986\u0987\u09AB\u09CD\u09B0\u09C7\u09AE\u09C7 \u09B2\u09CB\u09A1 \u0995\u09B0\u09BE \u09A8\u09BF\u09B7\u09BF\u09A6\u09CD\u09A7 \u0995\u09B0\u09C7\u099B\u09C7\u0964</p>
            <div class="url">${targetUrl}</div>
            <a class="btn" href="${targetUrl}" target="_blank" rel="noopener noreferrer">\u09A8\u09A4\u09C1\u09A8 \u099F\u09CD\u09AF\u09BE\u09AC\u09C7 \u0996\u09C1\u09B2\u09C1\u09A8 (Open in New Tab) \u2197</a>
          </div>
        </body>
      </html>
    `);
  }
});
app.get("/api/proxy/reader", async (req, res) => {
  const targetUrl = req.query.url;
  if (!targetUrl) {
    return res.status(400).json({ error: "URL parameter required" });
  }
  try {
    const parsedUrl = new URL(targetUrl.startsWith("http") ? targetUrl : `https://${targetUrl}`);
    const response = await fetch(parsedUrl.toString(), {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "bn-BD,bn;q=0.9,en-US;q=0.8,en;q=0.7"
      }
    });
    const html = await response.text();
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : parsedUrl.hostname;
    const cleanHtml = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "").replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "").replace(/<header\b[^<]*(?:(?!<\/header>)<[^<]*)*<\/header>/gi, "").replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, "").replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, "").replace(/<aside\b[^<]*(?:(?!<\/aside>)<[^<]*)*<\/aside>/gi, "");
    const paragraphMatches = cleanHtml.match(/<(p|h1|h2|h3|h4|li)[^>]*>([\s\S]*?)<\/\1>/gi) || [];
    const textPieces = paragraphMatches.map((p) => p.replace(/<[^>]+>/g, "").trim()).filter((t) => t.length > 25);
    const articleText = textPieces.slice(0, 50).join("\n\n");
    return res.json({
      title,
      url: targetUrl,
      domain: parsedUrl.hostname,
      content: articleText || "\u0993\u09DF\u09C7\u09AC \u09AA\u09C7\u099C\u09C7\u09B0 \u099F\u09C7\u0995\u09CD\u09B8\u099F \u098F\u0995\u09CD\u09B8\u099F\u09CD\u09B0\u09CD\u09AF\u09BE\u0995\u09CD\u099F \u0995\u09B0\u09BE \u09B8\u09AE\u09CD\u09AD\u09AC \u09B9\u09DF\u09A8\u09BF\u0964 \u09B2\u09BE\u0987\u09AD \u09AE\u09CB\u09A1\u09C7 \u09AA\u09C7\u099C\u099F\u09BF \u09A6\u09C7\u0996\u09C1\u09A8\u0964",
      length: articleText.length
    });
  } catch (err) {
    return res.status(500).json({ error: err?.message || "Failed to read web page" });
  }
});
async function getFastLiveSearchResults(query, filter = "all") {
  const safeQuery = (query || "").trim() || "Google Search";
  const [wikiBnRes, wikiEnRes, ddgRes, directYt] = await Promise.all([
    fetch(`https://bn.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(safeQuery)}`, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AIStudio/1.0" },
      signal: AbortSignal.timeout(3e3)
    }).then((r) => r.ok ? r.json() : null).catch(() => null),
    fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(safeQuery)}`, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AIStudio/1.0" },
      signal: AbortSignal.timeout(3e3)
    }).then((r) => r.ok ? r.json() : null).catch(() => null),
    fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(safeQuery)}&format=json&no_html=1&skip_disambig=1`, {
      signal: AbortSignal.timeout(3e3)
    }).then((r) => r.ok ? r.json() : null).catch(() => null),
    searchYouTubeDirect(safeQuery).catch(() => [])
  ]);
  const wiki = wikiBnRes || wikiEnRes;
  const instantAnswer = wiki?.extract || ddgRes?.Abstract || `\u0997\u09C1\u0997\u09B2 \u0993 \u0993\u09DF\u09C7\u09AC \u09A5\u09C7\u0995\u09C7 "${safeQuery}" \u09B8\u09AE\u09CD\u09AA\u09B0\u09CD\u0995\u09BF\u09A4 \u09B0\u09BF\u09AF\u09BC\u09C7\u09B2-\u099F\u09BE\u0987\u09AE \u09A4\u09A5\u09CD\u09AF \u098F\u09AC\u0982 \u09B8\u09B0\u09BE\u09B8\u09B0\u09BF \u09B8\u0982\u09AF\u09CB\u0997 \u09AA\u09CD\u09B0\u09B8\u09CD\u09A4\u09C1\u09A4 \u0995\u09B0\u09BE \u09B9\u09DF\u09C7\u099B\u09C7\u0964`;
  const topVideo = directYt && directYt.length > 0 ? directYt[0] : void 0;
  const results = [];
  const imageResults = [];
  const newsResults = [];
  const academicResults = [];
  if (filter === "images" || filter === "all") {
    if (wiki?.thumbnail?.source) {
      imageResults.push({
        title: wiki.title || safeQuery,
        url: wiki.content_urls?.desktop?.page || `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(safeQuery)}`,
        imageUrl: wiki.thumbnail.source,
        source: "Wikipedia Commons",
        domain: "wikipedia.org"
      });
    }
    if (topVideo?.thumbnail) {
      imageResults.push({
        title: `${topVideo.title} (\u09AD\u09BF\u09A1\u09BF\u0993 \u09A5\u09BE\u09AE\u09CD\u09AC\u09A8\u09C7\u0987\u09B2)`,
        url: topVideo.url,
        imageUrl: topVideo.thumbnail,
        source: "YouTube Media",
        domain: "youtube.com"
      });
    }
    imageResults.push(
      {
        title: `${safeQuery} - Google Images HD`,
        url: `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(safeQuery)}`,
        imageUrl: `https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80`,
        source: "Google Images Search",
        domain: "images.google.com"
      },
      {
        title: `${safeQuery} - Wikimedia Commons`,
        url: `https://commons.wikimedia.org/w/index.php?search=${encodeURIComponent(safeQuery)}`,
        imageUrl: `https://images.unsplash.com/photo-1507842229451-79b1be88688e?auto=format&fit=crop&w=600&q=80`,
        source: "Wikimedia Commons",
        domain: "commons.wikimedia.org"
      }
    );
  }
  if (filter === "news" || filter === "all") {
    newsResults.push(
      {
        title: `\u0997\u09C1\u0997\u09B2 \u09A8\u09BF\u0989\u099C: "${safeQuery}" \u098F\u09B0 \u09B8\u09BE\u09AE\u09CD\u09AA\u09CD\u09B0\u09A4\u09BF\u0995 \u0996\u09AC\u09B0 \u0993 \u09B0\u09BF\u09AA\u09CB\u09B0\u09CD\u099F`,
        url: `https://news.google.com/search?q=${encodeURIComponent(safeQuery)}`,
        domain: "news.google.com",
        source: "Google News",
        timeAgo: "\u09A4\u09BE\u099C\u09BE \u0996\u09AC\u09B0",
        snippet: `\u0997\u09C1\u0997\u09B2 \u09A8\u09BF\u0989\u099C\u09C7 "${safeQuery}" \u09A8\u09BF\u09DF\u09C7 \u099C\u09BE\u09A4\u09C0\u09DF \u0993 \u0986\u09A8\u09CD\u09A4\u09B0\u09CD\u099C\u09BE\u09A4\u09BF\u0995 \u09B8\u09AC \u09A4\u09BE\u099C\u09BE \u09B8\u0982\u09AC\u09BE\u09A6 \u0993 \u09AC\u09BF\u09B6\u09CD\u09B2\u09C7\u09B7\u09A3\u0964`
      },
      {
        title: `\u09AA\u09CD\u09B0\u09A5\u09AE \u0986\u09B2\u09CB \u0993 \u099C\u09BE\u09A4\u09C0\u09DF \u09B8\u0982\u09AC\u09BE\u09A6 \u0985\u09A8\u09C1\u09B8\u09A8\u09CD\u09A7\u09BE\u09A8: ${safeQuery}`,
        url: `https://www.google.com/search?q=${encodeURIComponent(safeQuery + " site:prothomalo.com")}`,
        domain: "prothomalo.com",
        source: "Prothom Alo",
        timeAgo: "\u0986\u099C\u0995\u09C7\u09B0 \u0996\u09AC\u09B0",
        snippet: `\u09AC\u09BE\u0982\u09B2\u09BE\u09A6\u09C7\u09B6 \u0993 \u0986\u09A8\u09CD\u09A4\u09B0\u09CD\u099C\u09BE\u09A4\u09BF\u0995 \u09AA\u09CD\u09B0\u09C7\u0995\u09CD\u09B7\u09BE\u09AA\u099F\u09C7 "${safeQuery}" \u09A8\u09BF\u09DF\u09C7 \u09B6\u09C0\u09B0\u09CD\u09B7 \u09A6\u09C8\u09A8\u09BF\u0995\u09C7\u09B0 \u09B8\u09B0\u09CD\u09AC\u09B6\u09C7\u09B7 \u09B0\u09BF\u09AA\u09CB\u09B0\u09CD\u099F\u0964`
      },
      {
        title: `BBC News \u09AC\u09BE\u0982\u09B2\u09BE \u0985\u09A8\u09C1\u09B8\u09A8\u09CD\u09A7\u09BE\u09A8: ${safeQuery}`,
        url: `https://www.bbc.com/bengali/topics`,
        domain: "bbc.com",
        source: "BBC News \u09AC\u09BE\u0982\u09B2\u09BE",
        timeAgo: "\u0986\u099C\u0995\u09C7\u09B0 \u0996\u09AC\u09B0",
        snippet: `\u09AC\u09BF\u09AC\u09BF\u09B8\u09BF \u09AC\u09BE\u0982\u09B2\u09BE\u09DF "${safeQuery}" \u09B8\u09AE\u09CD\u09AA\u09B0\u09CD\u0995\u09BF\u09A4 \u09A8\u09BF\u09B0\u09AA\u09C7\u0995\u09CD\u09B7 \u0993 \u09AC\u09B8\u09CD\u09A4\u09C1\u09A8\u09BF\u09B7\u09CD\u09A0 \u09B8\u0982\u09AC\u09BE\u09A6 \u09AC\u09C1\u09B2\u09C7\u099F\u09BF\u09A8\u0964`
      }
    );
  }
  if (filter === "academic" || filter === "all") {
    academicResults.push(
      {
        title: `${safeQuery} - Google Scholar \u0997\u09AC\u09C7\u09B7\u09A3\u09BE\u09AA\u09A4\u09CD\u09B0 \u0993 \u099C\u09BE\u09B0\u09CD\u09A8\u09BE\u09B2`,
        url: `https://scholar.google.com/scholar?q=${encodeURIComponent(safeQuery)}`,
        authors: "Peer-reviewed Researchers & Academics",
        journal: "Google Scholar Academic Index",
        year: (/* @__PURE__ */ new Date()).getFullYear(),
        snippet: `\u09AC\u09BF\u09B6\u09CD\u09AC\u09AC\u09CD\u09AF\u09BE\u09AA\u09C0 \u09B8\u09CD\u09AC\u09C0\u0995\u09C3\u09A4 \u09AC\u09BF\u09B6\u09CD\u09AC\u09AC\u09BF\u09A6\u09CD\u09AF\u09BE\u09B2\u09AF\u09BC \u0993 \u0997\u09AC\u09C7\u09B7\u0995\u09A6\u09C7\u09B0 "${safeQuery}" \u09B8\u0982\u0995\u09CD\u09B0\u09BE\u09A8\u09CD\u09A4 \u09AA\u09BF\u09DF\u09BE\u09B0-\u09B0\u09BF\u09AD\u09BF\u0989\u09A1 \u0986\u09B0\u09CD\u099F\u09BF\u0995\u09C7\u09B2, \u09A5\u09BF\u09B8\u09BF\u09B8 \u098F\u09AC\u0982 \u09B8\u09BE\u0987\u099F\u09C7\u09B6\u09A8\u0964`,
        pdfUrl: `https://scholar.google.com/scholar?q=${encodeURIComponent(safeQuery + " filetype:pdf")}`,
        citationsCount: 42
      },
      {
        title: `${safeQuery} - arXiv \u0993\u09AA\u09C7\u09A8 \u09B8\u09BE\u09DF\u09C7\u09A8\u09CD\u09B8 \u09AA\u09CD\u09B0\u09BF\u09AA\u09CD\u09B0\u09BF\u09A8\u09CD\u099F \u0986\u09B0\u09CD\u0995\u09BE\u0987\u09AD`,
        url: `https://arxiv.org/search/?query=${encodeURIComponent(safeQuery)}&searchtype=all`,
        authors: "arXiv Scientific Community",
        journal: "Cornell University arXiv",
        year: (/* @__PURE__ */ new Date()).getFullYear(),
        snippet: `\u0995\u09AE\u09CD\u09AA\u09BF\u0989\u099F\u09BE\u09B0 \u09B8\u09BE\u09DF\u09C7\u09A8\u09CD\u09B8, \u09AA\u09A6\u09BE\u09B0\u09CD\u09A5\u09AC\u09BF\u099C\u09CD\u099E\u09BE\u09A8 \u0993 \u0997\u09A3\u09BF\u09A4\u09C7 "${safeQuery}" \u09B8\u09AE\u09CD\u09AA\u09B0\u09CD\u0995\u09BF\u09A4 \u09B8\u09B0\u09CD\u09AC\u09BE\u09A7\u09C1\u09A8\u09BF\u0995 \u0997\u09AC\u09C7\u09B7\u09A3\u09BE\u09B0 \u0989\u09A8\u09CD\u09AE\u09C1\u0995\u09CD\u09A4 \u09AA\u09CD\u09B0\u09BF\u09AA\u09CD\u09B0\u09BF\u09A8\u09CD\u099F\u0964`,
        pdfUrl: `https://arxiv.org/search/?query=${encodeURIComponent(safeQuery)}&searchtype=all`,
        citationsCount: 18
      },
      {
        title: `${safeQuery} - ResearchGate \u0993 PubMed \u09AC\u09C8\u099C\u09CD\u099E\u09BE\u09A8\u09BF\u0995 \u09AA\u09CD\u09B0\u0995\u09BE\u09B6\u09A8\u09BE`,
        url: `https://www.researchgate.net/search/publication?q=${encodeURIComponent(safeQuery)}`,
        authors: "Global Research Network",
        journal: "ResearchGate & Scientific Literature",
        year: (/* @__PURE__ */ new Date()).getFullYear() - 1,
        snippet: `\u0997\u09AC\u09C7\u09B7\u0995\u09A6\u09C7\u09B0 \u09B8\u09B0\u09BE\u09B8\u09B0\u09BF \u09AA\u09CD\u09B0\u09B6\u09CD\u09A8, \u09AA\u09C2\u09B0\u09CD\u09A3\u09BE\u0999\u09CD\u0997 \u09AA\u09C7\u09AA\u09BE\u09B0 \u09A1\u09BE\u0989\u09A8\u09B2\u09CB\u09A1 \u098F\u09AC\u0982 \u0986\u09B2\u09CB\u099A\u09A8\u09BE\u0964`
      }
    );
  }
  if (wiki?.title && wiki?.content_urls?.desktop?.page) {
    results.push({
      title: `${wiki.title} - Wikipedia`,
      url: wiki.content_urls.desktop.page,
      domain: "wikipedia.org",
      snippet: wiki.extract ? wiki.extract.slice(0, 220) : "\u0989\u0987\u0995\u09BF\u09AA\u09BF\u09A1\u09BF\u09DF\u09BE \u09A4\u09A5\u09CD\u09AF \u0993 \u09AC\u09BF\u09AC\u09B0\u09A3\u09C0\u0964"
    });
  }
  if (Array.isArray(ddgRes?.RelatedTopics)) {
    for (const item of ddgRes.RelatedTopics.slice(0, 4)) {
      if (item.Text && item.FirstURL) {
        results.push({
          title: item.Text.split(" - ")[0] || safeQuery,
          url: item.FirstURL,
          domain: new URL(item.FirstURL).hostname || "duckduckgo.com",
          snippet: item.Text
        });
      }
    }
  }
  if (directYt && directYt.length > 0) {
    for (const v of directYt.slice(0, 3)) {
      results.push({
        title: `${v.title} - YouTube`,
        url: v.url,
        domain: "youtube.com",
        snippet: `${v.author} \u098F\u09B0 \u0985\u09AB\u09BF\u09B8\u09BF\u09DF\u09BE\u09B2 \u09AD\u09BF\u09A1\u09BF\u0993 \u0993 \u0997\u09BE\u09A8 \u09B8\u09B0\u09BE\u09B8\u09B0\u09BF \u09B6\u09C1\u09A8\u09C1\u09A8 \u098F\u09AC\u0982 \u09A6\u09C7\u0996\u09C1\u09A8\u0964`
      });
    }
  }
  results.push(
    {
      title: `${safeQuery} - Google Search`,
      url: `https://www.google.com/search?q=${encodeURIComponent(safeQuery)}`,
      domain: "google.com",
      snippet: `\u0997\u09C1\u0997\u09B2\u09C7 "${safeQuery}" \u09A8\u09BF\u09DF\u09C7 \u0993\u09DF\u09C7\u09AC \u09AA\u09C7\u099C, \u09A4\u09A5\u09CD\u09AF, \u099B\u09AC\u09BF \u0993 \u0985\u09A8\u09C1\u09B8\u09A8\u09CD\u09A7\u09BE\u09A8\u0964`
    },
    {
      title: `${safeQuery} - YouTube Music`,
      url: `https://music.youtube.com/search?q=${encodeURIComponent(safeQuery)}`,
      domain: "music.youtube.com",
      snippet: `YouTube Music-\u098F "${safeQuery}" \u098F\u09B0 \u09B9\u09BE\u0987 \u0995\u09CB\u09DF\u09BE\u09B2\u09BF\u099F\u09BF \u0985\u09A1\u09BF\u0993 \u099F\u09CD\u09B0\u09CD\u09AF\u09BE\u0995 \u09B8\u09CD\u099F\u09CD\u09B0\u09BF\u09AE \u0995\u09B0\u09C1\u09A8\u0964`
    },
    {
      title: `${safeQuery} - Google News`,
      url: `https://news.google.com/search?q=${encodeURIComponent(safeQuery)}`,
      domain: "news.google.com",
      snippet: `\u0997\u09C1\u0997\u09B2 \u09A8\u09BF\u0989\u099C\u09C7 "${safeQuery}" \u098F\u09B0 \u09B8\u09BE\u09AE\u09CD\u09AA\u09CD\u09B0\u09A4\u09BF\u0995 \u0996\u09AC\u09B0 \u0993 \u09A4\u09BE\u099C\u09BE \u0986\u09AA\u09A1\u09C7\u099F\u0964`
    }
  );
  return {
    query: safeQuery,
    filter,
    instantAnswer,
    knowledgeCard: wiki?.title ? {
      title: wiki.title,
      subtitle: wiki.description || "Verified Encyclopedia Overview",
      description: wiki.extract || "",
      fields: [
        { label: "\u0989\u09CE\u09B8 (Source)", value: "Wikipedia & Live Web" },
        { label: "\u0985\u09A8\u09C1\u09B8\u09A8\u09CD\u09A7\u09BE\u09A8", value: safeQuery },
        { label: "\u09AB\u09BF\u09B2\u09CD\u099F\u09BE\u09B0", value: filter.toUpperCase() }
      ]
    } : {
      title: safeQuery,
      subtitle: `Google Live Search (${filter})`,
      description: instantAnswer,
      fields: [
        { label: "\u09B8\u09CD\u099F\u09CD\u09AF\u09BE\u099F\u09BE\u09B8", value: "\u09B8\u0995\u09CD\u09B0\u09BF\u09DF (Active)" },
        { label: "\u0985\u09A8\u09C1\u09B8\u09A8\u09CD\u09A7\u09BE\u09A8", value: safeQuery },
        { label: "\u09AB\u09BF\u09B2\u09CD\u099F\u09BE\u09B0", value: filter.toUpperCase() }
      ]
    },
    results,
    imageResults,
    newsResults,
    academicResults,
    youtubeMedia: topVideo ? {
      videoId: topVideo.videoId,
      title: topVideo.title,
      artist: topVideo.author,
      watchUrl: topVideo.url,
      musicUrl: `https://music.youtube.com/search?q=${encodeURIComponent(safeQuery)}`
    } : void 0
  };
}
app.post("/api/mini-browser/search", async (req, res) => {
  const { query, filter = "all" } = req.body || {};
  if (!query || typeof query !== "string" || !query.trim()) {
    return res.status(400).json({ error: "Search query is required." });
  }
  const safeQuery = query.trim();
  const validFilter = ["all", "images", "news", "academic"].includes(filter) ? filter : "all";
  try {
    const ai = getAIClient();
    let filterInstruction = "";
    if (validFilter === "images") {
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
    } else if (validFilter === "news") {
      filterInstruction = `The user selected the 'News' search filter.
Focus specifically on recent breaking news, headlines, journalism pieces, and press articles.
Provide a "newsResults" array with 4-8 latest news stories:
"newsResults": [
  {
    "title": "Headline of the news article",
    "url": "Full verified news article URL",
    "domain": "News outlet domain e.g. prothomalo.com, bbc.com, reuters.com",
    "source": "News outlet name",
    "timeAgo": "e.g. \u09E8 \u0998\u09A3\u09CD\u099F\u09BE \u0986\u0997\u09C7 / Today / 3 hours ago",
    "snippet": "News lead summary and key takeaways"
  }
]`;
    } else if (validFilter === "academic") {
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
    "pdfUrl": "Direct PDF link if open-access, or repository link",
    "citationsCount": 35
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
      { "label": "\u09A4\u09A5\u09CD\u09AF", "value": "..." }
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
    const userPrompt = validFilter === "all" ? `Search Google for: "${safeQuery}"` : `Search Google (${validFilter.toUpperCase()} mode) for: "${safeQuery}"`;
    const geminiPromise = fetchContentWithResilience(
      ai,
      [{ role: "user", parts: [{ text: userPrompt }] }],
      systemPrompt,
      true,
      // enable Google Search Grounding!
      "gemini-3.8-flash"
    );
    const timeoutPromise = new Promise(
      (_, reject) => setTimeout(() => reject(new Error("GEMINI_SEARCH_TIMEOUT")), 4200)
    );
    const response = await Promise.race([geminiPromise, timeoutPromise]);
    let rawText = response?.text || "";
    rawText = rawText.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();
    const data = JSON.parse(rawText);
    data.filter = validFilter;
    const candidate = response?.candidates?.[0];
    const groundingChunks = (candidate?.groundingMetadata?.groundingChunks || []).map((c) => c.web).filter(Boolean);
    if (!data.youtubeMedia?.videoId && validFilter === "all") {
      const directYt = await searchYouTubeDirect(safeQuery);
      if (directYt.length > 0) {
        const top = directYt[0];
        data.youtubeMedia = {
          videoId: top.videoId,
          title: top.title,
          artist: top.author,
          watchUrl: top.url,
          musicUrl: `https://music.youtube.com/search?q=${encodeURIComponent(safeQuery)}`
        };
      }
    }
    if (validFilter === "images" && (!data.imageResults || data.imageResults.length === 0)) {
      const fallback = await getFastLiveSearchResults(safeQuery, "images");
      data.imageResults = fallback.imageResults;
    } else if (validFilter === "news" && (!data.newsResults || data.newsResults.length === 0)) {
      const fallback = await getFastLiveSearchResults(safeQuery, "news");
      data.newsResults = fallback.newsResults;
    } else if (validFilter === "academic" && (!data.academicResults || data.academicResults.length === 0)) {
      const fallback = await getFastLiveSearchResults(safeQuery, "academic");
      data.academicResults = fallback.academicResults;
    }
    return res.json({
      ...data,
      groundingSources: groundingChunks
    });
  } catch (err) {
    console.warn("Gemini search grounding fallback triggered for query:", safeQuery, err?.message);
    const fallbackData = await getFastLiveSearchResults(safeQuery, validFilter);
    return res.json(fallbackData);
  }
});
app.post("/api/mini-browser/lyrics", async (req, res) => {
  try {
    const { songTitle, artist, videoId } = req.body;
    if (!songTitle && !videoId) {
      return res.status(400).json({ error: "Song title or videoId required." });
    }
    const ai = getAIClient();
    const query = songTitle || (videoId ? `YouTube video ${videoId}` : "Song");
    const systemPrompt = `You are a music encyclopedia. Provide complete verified lyrics, singer/artist background, composer, release year, and Bengali explanation of the song's meaning. Format neatly with headings.`;
    const response = await fetchContentWithResilience(
      ai,
      [{ role: "user", parts: [{ text: `Provide lyrics, artist info, and details for the song: "${query}" (Artist: ${artist || "Unknown"})` }] }],
      systemPrompt,
      true,
      "gemini-3.8-flash"
    );
    res.json({
      title: songTitle || query,
      artist: artist || "",
      lyricsText: response.text || ""
    });
  } catch (error) {
    console.warn("Error in /api/mini-browser/lyrics:", error?.message || error);
    const { songTitle, artist } = req.body || {};
    const safeTitle = songTitle || "\u0997\u09BE\u09A8\u09C7\u09B0 \u09B2\u09BF\u09B0\u09BF\u0995\u09CD\u09B8";
    res.json({
      title: safeTitle,
      artist: artist || "",
      lyricsText: `### \u{1F3B5} ${safeTitle} ${artist ? `(${artist})` : ""}

\u0997\u09C1\u0997\u09B2 \u0993 \u0987\u0989\u099F\u09BF\u0989\u09AC\u09C7 \u09B8\u09B0\u09BE\u09B8\u09B0\u09BF \u09B2\u09BF\u09B0\u09BF\u0995\u09CD\u09B8 \u0993 \u0997\u09BE\u09A8 \u09B6\u09C1\u09A8\u09A4\u09C7 \u09A8\u09BF\u099A\u09C7\u09B0 \u09B2\u09BF\u0999\u09CD\u0995\u0997\u09C1\u09B2\u09CB\u09A4\u09C7 \u09AF\u09BE\u09A8:
- [Google Search \u098F \u09B2\u09BF\u09B0\u09BF\u0995\u09CD\u09B8 \u09A6\u09C7\u0996\u09C1\u09A8](https://www.google.com/search?q=${encodeURIComponent(safeTitle + " " + (artist || "") + " lyrics")})
- [YouTube \u098F \u0997\u09BE\u09A8 \u09B6\u09C1\u09A8\u09C1\u09A8](https://www.youtube.com/results?search_query=${encodeURIComponent(safeTitle + " " + (artist || ""))})`
    });
  }
});
async function searchYouTubeDirect(query) {
  try {
    const res = await fetch(`https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9,bn;q=0.8"
      }
    });
    if (!res.ok) return [];
    const html = await res.text();
    const match = html.match(/ytInitialData\s*=\s*({.+?});<\/script>/);
    if (!match) return [];
    const data = JSON.parse(match[1]);
    const contents = data.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents?.[0]?.itemSectionRenderer?.contents || [];
    const videos = [];
    const seen = /* @__PURE__ */ new Set();
    for (const item of contents) {
      const vr = item.videoRenderer;
      if (vr && vr.videoId && /^[a-zA-Z0-9_-]{11}$/.test(vr.videoId) && !seen.has(vr.videoId)) {
        seen.add(vr.videoId);
        videos.push({
          videoId: vr.videoId,
          title: vr.title?.runs?.[0]?.text || query,
          author: vr.ownerText?.runs?.[0]?.text || "YouTube Official",
          url: `https://www.youtube.com/watch?v=${vr.videoId}`,
          thumbnail: `https://i.ytimg.com/vi/${vr.videoId}/hqdefault.jpg`,
          duration: vr.lengthText?.simpleText || ""
        });
      }
    }
    return videos.slice(0, 10);
  } catch (err) {
    console.warn("Direct YouTube extraction fallback error:", err);
    return [];
  }
}
app.post("/api/youtube/search", async (req, res) => {
  try {
    const { query } = req.body;
    if (!query || typeof query !== "string" || !query.trim()) {
      return res.status(400).json({ error: "Search query is required." });
    }
    const trimmedQuery = query.trim();
    const directResults = await searchYouTubeDirect(trimmedQuery);
    if (directResults.length > 0) {
      return res.json({
        query: trimmedQuery,
        videos: directResults,
        searchUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(trimmedQuery)}`,
        musicUrl: `https://music.youtube.com/search?q=${encodeURIComponent(trimmedQuery)}`
      });
    }
    const ai = getAIClient();
    const systemPrompt = `You are a YouTube search engine. Find real YouTube video URLs for the query. Output valid JSON: {"query": "...", "videos": [{"videoId": "11-chars", "title": "...", "author": "..."}]}`;
    const response = await fetchContentWithResilience(
      ai,
      [{ role: "user", parts: [{ text: `Search YouTube videos for: "${trimmedQuery}"` }] }],
      systemPrompt,
      true,
      "gemini-3.8-flash"
    );
    const candidate = response?.candidates?.[0];
    const groundingChunks = (candidate?.groundingMetadata?.groundingChunks || []).map((c) => c.web).filter(Boolean);
    const videos = [];
    const seen = /* @__PURE__ */ new Set();
    for (const chunk of groundingChunks) {
      if (!chunk.uri) continue;
      const m = chunk.uri.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{11})/i);
      if (m && m[1] && !seen.has(m[1])) {
        const vid = m[1];
        seen.add(vid);
        videos.push({
          videoId: vid,
          title: chunk.title || trimmedQuery,
          author: "\u0987\u0989\u099F\u09BF\u0989\u09AC \u09AD\u09C7\u09B0\u09BF\u09AB\u09BE\u0987\u09A1",
          url: `https://www.youtube.com/watch?v=${vid}`,
          thumbnail: `https://i.ytimg.com/vi/${vid}/hqdefault.jpg`
        });
      }
    }
    res.json({
      query: trimmedQuery,
      videos,
      searchUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(trimmedQuery)}`,
      musicUrl: `https://music.youtube.com/search?q=${encodeURIComponent(trimmedQuery)}`
    });
  } catch (err) {
    console.error("Error in /api/youtube/search:", err?.message || err);
    const { query } = req.body || {};
    const safeQ = (query || "\u0997\u09BE\u09A8").trim();
    res.json({
      query: safeQ,
      videos: [],
      searchUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(safeQ)}`,
      musicUrl: `https://music.youtube.com/search?q=${encodeURIComponent(safeQ)}`
    });
  }
});
var musicFeedCache = {};
app.get("/api/youtube/time-feed", async (req, res) => {
  try {
    const period = req.query.period || "evening";
    const category = req.query.category || "all";
    const cacheKey = `${period}_${category}`;
    const now = Date.now();
    if (musicFeedCache[cacheKey] && now - musicFeedCache[cacheKey].timestamp < 15 * 60 * 1e3) {
      return res.json({
        period,
        category,
        cached: true,
        videos: musicFeedCache[cacheKey].videos
      });
    }
    let searchQuery = "\u09AC\u09BE\u0982\u09B2\u09BE \u09AC\u09CD\u09AF\u09BE\u09A8\u09CD\u09A1\u09C7\u09B0 \u09B8\u09C7\u09B0\u09BE \u0997\u09BE\u09A8";
    if (category === "bands") {
      searchQuery = "\u09AC\u09BE\u0982\u09B2\u09BE \u09AC\u09CD\u09AF\u09BE\u09A8\u09CD\u09A1 \u0997\u09BE\u09A8 \u099C\u09C7\u09AE\u09B8 \u098F\u09B2\u0986\u09B0\u09AC\u09BF \u09AE\u09BE\u0987\u09B2\u09B8";
    } else if (category === "coke_studio") {
      searchQuery = "Coke Studio Bangla latest hits";
    } else if (category === "rabindra") {
      searchQuery = "\u09B0\u09AC\u09C0\u09A8\u09CD\u09A6\u09CD\u09B0 \u09B8\u0982\u0997\u09C0\u09A4 \u09B8\u09C7\u09B0\u09BE \u0997\u09BE\u09A8";
    } else if (category === "lofi") {
      searchQuery = "Bangla Lo-Fi Chill Beats";
    } else if (category === "sleep") {
      searchQuery = "Deep sleep relaxing piano rain melody";
    } else {
      switch (period) {
        case "morning":
          searchQuery = "\u09B8\u0995\u09BE\u09B2\u09C7\u09B0 \u09B6\u09BE\u09A8\u09CD\u09A4 \u09B0\u09AC\u09C0\u09A8\u09CD\u09A6\u09CD\u09B0 \u09B8\u0982\u0997\u09C0\u09A4 \u0993 \u09AD\u09C8\u09B0\u09AC\u09C0 \u09B8\u09C1\u09B0";
          break;
        case "afternoon":
          searchQuery = "\u0995\u09CB\u0995 \u09B8\u09CD\u099F\u09C1\u09A1\u09BF\u0993 \u09AC\u09BE\u0982\u09B2\u09BE \u0993 \u0986\u09A7\u09C1\u09A8\u09BF\u0995 \u09AC\u09BE\u0982\u09B2\u09BE \u0997\u09BE\u09A8";
          break;
        case "evening":
          searchQuery = "\u09AC\u09BE\u0982\u09B2\u09BE \u09AC\u09CD\u09AF\u09BE\u09A8\u09CD\u09A1 \u09B8\u09C7\u09B0\u09BE \u0997\u09BE\u09A8 \u099C\u09C7\u09AE\u09B8 \u098F\u09B2\u0986\u09B0\u09AC\u09BF \u0985\u09B0\u09CD\u09A5\u09B9\u09C0\u09A8";
          break;
        case "night":
        default:
          searchQuery = "\u09AC\u09BE\u0982\u09B2\u09BE \u09B8\u09AB\u099F \u09AE\u09C7\u09B2\u09CB\u09A1\u09BF \u0993 \u09B0\u09BE\u09A4\u09C7\u09B0 \u09AE\u09BF\u09B7\u09CD\u099F\u09BF \u0997\u09BE\u09A8";
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
        videos
      });
    }
    res.json({
      period,
      category,
      cached: false,
      videos: []
    });
  } catch (err) {
    console.warn("Error in /api/youtube/time-feed:", err?.message || err);
    res.json({
      period: "evening",
      category: "all",
      videos: []
    });
  }
});
app.post("/api/youtube/ai-ideas", async (req, res) => {
  try {
    const { mood = "\u09AE\u09A8 \u09AD\u09BE\u09B2\u09CB \u0995\u09B0\u09BE\u09B0 \u09AE\u09A4\u09CB \u09AE\u09BF\u09B7\u09CD\u099F\u09BF \u0997\u09BE\u09A8", genre } = req.body || {};
    const ai = getAIClient();
    const prompt = `You are an expert music curator and DJ specializing in Bengali music (\u09AC\u09BE\u0982\u09B2\u09BE \u09AC\u09CD\u09AF\u09BE\u09A8\u09CD\u09A1, \u0995\u09CB\u0995 \u09B8\u09CD\u099F\u09C1\u09A1\u09BF\u0993, \u09B0\u09AC\u09C0\u09A8\u09CD\u09A6\u09CD\u09B0 \u09B8\u0982\u0997\u09C0\u09A4, \u09AB\u09CB\u0995, \u0986\u09A7\u09C1\u09A8\u09BF\u0995) and global melodies.
User is asking for song recommendations and ideas based on this mood/preference: "${mood}" ${genre ? `(Genre: ${genre})` : ""}.

Provide 5 creative, accurate song recommendations that truly exist on YouTube.
Respond ONLY with a valid JSON array in this format:
[
  {
    "titleBn": "\u0997\u09BE\u09A8\u09C7\u09B0 \u09A8\u09BE\u09AE \u0993 \u09B6\u09BF\u09B2\u09CD\u09AA\u09C0",
    "artist": "\u09B6\u09BF\u09B2\u09CD\u09AA\u09C0\u09B0 \u09A8\u09BE\u09AE",
    "searchQuery": "\u0997\u09BE\u09A8\u09C7\u09B0 \u09B8\u09A0\u09BF\u0995 \u09A8\u09BE\u09AE \u0993 \u09B6\u09BF\u09B2\u09CD\u09AA\u09C0 (\u09AF\u09C7\u09AE\u09A8: \u0986\u0987\u09AF\u09BC\u09C1\u09AC \u09AC\u09BE\u099A\u09CD\u099A\u09C1 \u09B8\u09C7\u0987 \u09A4\u09C1\u09AE\u09BF)",
    "moodReasonBn": "\u0995\u09C7\u09A8 \u098F\u0987 \u0997\u09BE\u09A8\u099F\u09BF \u098F\u0987 \u09AE\u09C1\u09A1\u09C7\u09B0 \u099C\u09A8\u09CD\u09AF \u09B8\u09C7\u09B0\u09BE (\u09B8\u0982\u0995\u09CD\u09B7\u09BF\u09AA\u09CD\u09A4 \u09E7 \u09AC\u09BE\u0995\u09CD\u09AF)",
    "genre": "\u09AC\u09CD\u09AF\u09BE\u09A8\u09CD\u09A1 / \u09AB\u09CB\u0995 / \u09AE\u09C7\u09B2\u09CB\u09A1\u09BF / \u09B2\u09AB\u09BF"
  }
]
`;
    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        temperature: 0.7
      }
    });
    const parsed = JSON.parse(response.text || "[]");
    const enrichedIdeas = [];
    for (let i = 0; i < Math.min(3, parsed.length); i++) {
      const item = parsed[i];
      try {
        const direct = await searchYouTubeDirect(item.searchQuery || item.titleBn);
        if (direct && direct.length > 0) {
          enrichedIdeas.push({
            ...item,
            topVideo: direct[0]
          });
          continue;
        }
      } catch (_) {
      }
      enrichedIdeas.push(item);
    }
    for (let i = 3; i < parsed.length; i++) {
      enrichedIdeas.push(parsed[i]);
    }
    res.json({
      mood,
      ideas: enrichedIdeas
    });
  } catch (err) {
    console.warn("Error in /api/youtube/ai-ideas:", err?.message || err);
    res.json({
      mood: "\u09B8\u09C7\u09B0\u09BE \u0997\u09BE\u09A8",
      ideas: [
        {
          titleBn: "\u09B8\u09C7\u0987 \u09A4\u09C1\u09AE\u09BF - \u0986\u0987\u09AF\u09BC\u09C1\u09AC \u09AC\u09BE\u099A\u09CD\u099A\u09C1 (\u098F\u09B2\u0986\u09B0\u09AC\u09BF)",
          artist: "\u0986\u0987\u09AF\u09BC\u09C1\u09AC \u09AC\u09BE\u099A\u09CD\u099A\u09C1",
          searchQuery: "\u0986\u0987\u09AF\u09BC\u09C1\u09AC \u09AC\u09BE\u099A\u09CD\u099A\u09C1 \u09B8\u09C7\u0987 \u09A4\u09C1\u09AE\u09BF",
          moodReasonBn: "\u09A8\u09B8\u09CD\u099F\u09BE\u09B2\u099C\u09BF\u0995 \u09AE\u09C7\u09B2\u09CB\u09A1\u09BF \u09AF\u09BE \u09B9\u09C3\u09A6\u09AF\u09BC\u09C7 \u09A6\u09CB\u09B2\u09BE \u09A6\u09C7\u09AF\u09BC\u0964",
          genre: "\u09AC\u09BE\u0982\u09B2\u09BE \u09AC\u09CD\u09AF\u09BE\u09A8\u09CD\u09A1"
        },
        {
          titleBn: "\u09A8\u09BE\u09B8\u09C7\u0995 \u09A8\u09BE\u09B8\u09C7\u0995 - \u0995\u09CB\u0995 \u09B8\u09CD\u099F\u09C1\u09A1\u09BF\u0993 \u09AC\u09BE\u0982\u09B2\u09BE",
          artist: "\u0985\u09A8\u09BF\u09B0\u09CD\u09AC\u09BE\u09A3 \u09AD\u099F\u09CD\u099F\u09BE\u099A\u09BE\u09B0\u09CD\u09AF",
          searchQuery: "Coke Studio Bangla Nasek Nasek",
          moodReasonBn: "\u09AE\u09A8\u0995\u09C7 \u099A\u09A8\u09AE\u09A8\u09C7 \u0995\u09B0\u09C7 \u09A4\u09CB\u09B2\u09BE\u09B0 \u09A6\u09C1\u09B0\u09CD\u09A6\u09BE\u09A8\u09CD\u09A4 \u09AB\u09CB\u0995-\u09AB\u09BF\u0989\u09B6\u09A8\u0964",
          genre: "\u0995\u09CB\u0995 \u09B8\u09CD\u099F\u09C1\u09A1\u09BF\u0993"
        },
        {
          titleBn: "\u0986\u09A8\u09A8\u09CD\u09A6\u09B2\u09CB\u0995\u09C7 \u09AE\u0999\u09CD\u0997\u09B2\u09BE\u09B2\u09CB\u0995\u09C7 - \u09B0\u09AC\u09C0\u09A8\u09CD\u09A6\u09CD\u09B0 \u09B8\u0982\u0997\u09C0\u09A4",
          artist: "\u09B0\u09AC\u09C0\u09A8\u09CD\u09A6\u09CD\u09B0\u09A8\u09BE\u09A5 \u09A0\u09BE\u0995\u09C1\u09B0",
          searchQuery: "\u0986\u09A8\u09A8\u09CD\u09A6\u09B2\u09CB\u0995\u09C7 \u09AE\u0999\u09CD\u0997\u09B2\u09BE\u09B2\u09CB\u0995\u09C7 \u09B0\u09AC\u09C0\u09A8\u09CD\u09A6\u09CD\u09B0 \u09B8\u0982\u0997\u09C0\u09A4",
          moodReasonBn: "\u09AD\u09CB\u09B0 \u09AC\u09BE \u0995\u09BE\u099C\u09C7\u09B0 \u09B6\u09C1\u09B0\u09C1\u09A4\u09C7 \u0986\u09A7\u09CD\u09AF\u09BE\u09A4\u09CD\u09AE\u09BF\u0995 \u09AA\u09CD\u09B0\u09B6\u09BE\u09A8\u09CD\u09A4\u09BF\u0964",
          genre: "\u09B0\u09AC\u09C0\u09A8\u09CD\u09A6\u09CD\u09B0 \u09B8\u0982\u0997\u09C0\u09A4"
        }
      ]
    });
  }
});
app.post("/api/agent/evaluate-job", async (req, res) => {
  try {
    const { job, profile } = req.body;
    if (!job || !job.description) {
      return res.status(400).json({ error: "Job description is required." });
    }
    const ai = getAIClient();
    const prompt = `
You are an autonomous freelance sales engineer and top-rated remote consultant on Upwork, RemoteOK, and LinkedIn.
Analyze the following remote job posting and candidate profile:

JOB DETAILS:
Platform: ${job.platform || "Upwork / Remote"}
Title: ${job.title || "Remote Software Development"}
Budget: ${job.budget || "Competitive / Negotiable"}
Required Skills: ${(job.skillsRequired || []).join(", ") || "Not specified"}
Job Description:
${job.description}

CANDIDATE PROFILE & CAPABILITIES:
Skills: ${(profile?.skills || ["React", "TypeScript", "Node.js", "Python", "FastAPI", "Automation", "AI Integration"]).join(", ")}
Bio: ${profile?.bio || "Full stack engineer with 5+ years of experience in modern web apps, automation bots, and AI API integrations."}
Target Rate: ${profile?.hourlyRate || "$45 - $65/hr"}

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
  "summary": "Short 2-sentence technical summary in Bengali (\u09AC\u09BE\u0982\u09B2\u09BE)",
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
      model: "gemini-3.8-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        temperature: 0.25
      }
    });
    const parsed = JSON.parse(response.text || "{}");
    res.json(parsed);
  } catch (err) {
    console.error("Error in /api/agent/evaluate-job:", err?.message || err);
    res.status(500).json({
      error: formatFriendlyErrorMessage(err)
    });
  }
});
app.post("/api/agent/solve-task", async (req, res) => {
  try {
    const { jobTitle, requirement, techStack } = req.body;
    if (!requirement) {
      return res.status(400).json({ error: "Requirement description is required." });
    }
    const ai = getAIClient();
    const prompt = `
You are an autonomous senior software engineer performing a freelance contract delivery.
Client Requirement:
Title: ${jobTitle || "Custom Software Module"}
Tech Stack: ${techStack || "TypeScript / Node.js"}
Detailed Specification:
${requirement}

TASK:
1. Decompose the requirement into architecture.
2. Produce production-grade, bug-free, complete source code files (No placeholders, no "TODOs").
3. Perform a simulated automated test & self-healing verification:
   - Identify a potential edge-case or lint error that a self-correcting agent catches.
   - Show how the agent corrected it before delivery.
4. Write a professional client delivery message ready to paste in Upwork/Fiverr chat.

Respond ONLY with valid JSON in this exact structure:
{
  "architecture": "Architecture overview in Bengali (\u09AC\u09BE\u0982\u09B2\u09BE)",
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
  "selfHealingReport": {
    "iterations": 2,
    "initialErrorDetected": "Edge case: Missing null check or timeout handler on API fetch",
    "correctionApplied": "Added retry loop with exponential backoff and strict TypeScript typing",
    "testsPassed": true,
    "assertionsCount": 12
  },
  "deliveryNote": "Hi [Client Name], I have completed the requested module according to your exact specifications..."
}
`;
    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        temperature: 0.2
      }
    });
    const parsed = JSON.parse(response.text || "{}");
    res.json(parsed);
  } catch (err) {
    console.error("Error in /api/agent/solve-task:", err?.message || err);
    res.status(500).json({
      error: formatFriendlyErrorMessage(err)
    });
  }
});
app.post("/api/trading-bot/analyze", async (req, res) => {
  try {
    const {
      imageBase64,
      platform = "Quotex / Pocket Option",
      market = "EUR/USD (OTC)",
      timeframe = "1m",
      strategy = "Price Action & Candlestick Patterns"
    } = req.body || {};
    if (!imageBase64 || typeof imageBase64 !== "string") {
      return res.status(400).json({
        success: false,
        error: "Screenshot or chart frame imageBase64 is required."
      });
    }
    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");
    const mimeType = imageBase64.startsWith("data:image/png") ? "image/png" : "image/jpeg";
    const ai = getAIClient();
    const prompt = `You are an elite quantitative technical analyst and algorithmic trading bot specialist for Binary Options (Quotex, Pocket Option, Olymp Trade), Crypto (Binance, Bybit), and Forex.
The user is trading on "${platform}" with strategy "${strategy}", chart timeframe "${timeframe}", pair "${market}".

CRITICAL OBJECTIVE:
Carefully inspect this live candlestick chart screen frame:
1. Identify recent candles (green/bullish, red/bearish, wicks, body size, momentum).
2. Detect candlestick formations: Hammer, Inverted Hammer, Bullish/Bearish Engulfing, Doji, Pinbar, Morning/Evening Star, Shooting Star, Marubozu, Double Bottom/Top, Breakout, Rejection from Support/Resistance.
3. Detect indicators visible: RSI value/zones (<30 oversold, >70 overbought), Moving Averages crossover (EMA/SMA), MACD, Bollinger Bands, Stochastic.
4. Detect immediate Key Support and Resistance price levels.
5. Provide a definitive, clear trading decision:
   - "BUY" (or "CALL" in binary options) if strong upward momentum / reversal from support is detected.
   - "SELL" (or "PUT" in binary options) if strong downward momentum / rejection from resistance is detected.
   - "HOLD" if market is consolidative, uncertain, or conflicting.
6. Confidence Score: A realistic percentage between 60% and 98%.
7. Recommended Expiry: "1 Minute", "2 Minutes", "5 Minutes", or "Next Candle".
8. Risk Level: "LOW", "MEDIUM", or "HIGH".
9. Bengali Explanation (reasonBn): Actionable, clear 2-3 sentences explaining exactly why this signal is given in Bengali (\u09B8\u09B9\u099C \u0993 \u09B8\u09BE\u09AC\u09B2\u09C0\u09B2 \u09AC\u09BE\u0982\u09B2\u09BE).
10. English Explanation (reasonEn): Crisp 1-2 sentence technical summary.
11. Audio Alert (audioAlertBn): Short, crisp voice announcement in Bengali, e.g. "\u09AC\u09BE\u0987 \u09B8\u09BF\u0997\u09A8\u09CD\u09AF\u09BE\u09B2 \u09AA\u09BE\u0993\u09DF\u09BE \u0997\u09C7\u099B\u09C7! \u0986\u09B8\u09CD\u09A5\u09BE \u09EF\u09E8%, \u09E7 \u09AE\u09BF\u09A8\u09BF\u099F\u09C7\u09B0 \u099C\u09A8\u09CD\u09AF \u0995\u09B2 \u099F\u09CD\u09B0\u09C7\u09A1 \u0995\u09B0\u09C1\u09A8\u0964" or "\u09B8\u09C7\u09B2 \u09B8\u09BF\u0997\u09A8\u09CD\u09AF\u09BE\u09B2! \u09AE\u09BE\u09B0\u09CD\u0995\u09C7\u099F \u09B0\u09C7\u099C\u09BF\u09B8\u09CD\u099F\u09CD\u09AF\u09BE\u09A8\u09CD\u09B8 \u09B0\u09BF\u099C\u09C7\u0995\u09CD\u099F \u0995\u09B0\u09C7\u099B\u09C7\u0964"

Respond STRICTLY with a valid JSON object matching this schema:
{
  "action": "BUY" | "SELL" | "HOLD",
  "confidence": 88,
  "trend": "BULLISH" | "BEARISH" | "SIDEWAYS",
  "pattern": "Bullish Engulfing at Key Support",
  "indicators": ["RSI Oversold (26)", "Rejection wick at 1.0820 support", "Bullish volume surge"],
  "supportLevel": "1.0820",
  "resistanceLevel": "1.0895",
  "timeframeRecommended": "1 Minute (60s)",
  "riskLevel": "LOW",
  "reasonBn": "\u099A\u09BE\u09B0\u09CD\u099F\u09C7 \u09B8\u09BE\u09AA\u09CB\u09B0\u09CD\u099F \u09B2\u09BE\u0987\u09A8\u09C7 \u098F\u0995\u099F\u09BF \u09A8\u09BF\u0996\u09C1\u0981\u09A4 \u09AC\u09C1\u09B2\u09BF\u09B6 \u098F\u09A8\u0997\u09BE\u09B2\u09AB\u09BF\u0982 \u09AA\u09CD\u09AF\u09BE\u099F\u09BE\u09B0\u09CD\u09A8 \u09A4\u09C8\u09B0\u09BF \u09B9\u09DF\u09C7\u099B\u09C7 \u098F\u09AC\u0982 RSI \u0993\u09AD\u09BE\u09B0\u09B8\u09CB\u09B2\u09CD\u09A1 \u099C\u09CB\u09A8 \u09A5\u09C7\u0995\u09C7 \u0993\u09AA\u09B0\u09C7\u09B0 \u09A6\u09BF\u0995\u09C7 \u09AE\u09C1\u09AD \u0995\u09B0\u099B\u09C7\u0964 \u09E7 \u09AE\u09BF\u09A8\u09BF\u099F\u09C7\u09B0 \u099C\u09A8\u09CD\u09AF \u098F\u099F\u09BF \u098F\u0995\u099F\u09BF \u09B6\u0995\u09CD\u09A4\u09BF\u09B6\u09BE\u09B2\u09C0 CALL/BUY \u09B8\u09BF\u0997\u09A8\u09CD\u09AF\u09BE\u09B2\u0964",
  "reasonEn": "Clear bullish reversal candle at key support with RSI climbing out of oversold territory. Recommending BUY/CALL entry for 1 min expiry.",
  "suggestedEntry": "\u09AC\u09B0\u09CD\u09A4\u09AE\u09BE\u09A8 \u0995\u09CD\u09AF\u09BE\u09A8\u09CD\u09A1\u09C7\u09B2\u09C7\u09B0 \u0995\u09CD\u09B2\u09CB\u099C\u09BF\u0982 \u09AC\u09BE \u09B9\u09BE\u09B2\u0995\u09BE \u09AA\u09C1\u09B2\u09AC\u09CD\u09AF\u09BE\u0995\u09C7",
  "stopLoss": "1.0815",
  "takeProfit": "1.0890",
  "audioAlertBn": "\u09AC\u09BE\u0987 \u09B8\u09BF\u0997\u09A8\u09CD\u09AF\u09BE\u09B2 \u09AA\u09BE\u0993\u09DF\u09BE \u0997\u09C7\u099B\u09C7! \u0986\u09B8\u09CD\u09A5\u09BE \u09EE\u09EE%, \u09E7 \u09AE\u09BF\u09A8\u09BF\u099F\u09C7\u09B0 \u099C\u09A8\u09CD\u09AF \u0995\u09B2 \u099F\u09CD\u09B0\u09C7\u09A1 \u0995\u09B0\u09C1\u09A8\u0964"
}
`;
    const imagePart = {
      inlineData: {
        mimeType,
        data: cleanBase64
      }
    };
    const textPart = {
      text: prompt
    };
    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: { parts: [imagePart, textPart] },
      config: {
        responseMimeType: "application/json",
        temperature: 0.15
      }
    });
    const parsed = JSON.parse(response.text || "{}");
    res.json({
      success: true,
      timestamp: Date.now(),
      platform,
      market,
      analysis: parsed
    });
  } catch (err) {
    console.error("Error in /api/trading-bot/analyze:", err?.message || err);
    res.status(500).json({
      success: false,
      error: formatFriendlyErrorMessage(err) || "Failed to analyze trading screen frame."
    });
  }
});
app.post("/api/trading-bot/webhook", async (req, res) => {
  try {
    const { webhookUrl, payload } = req.body || {};
    if (!webhookUrl || typeof webhookUrl !== "string") {
      return res.status(400).json({ error: "webhookUrl is required." });
    }
    const resp = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload || {})
    });
    res.json({
      success: resp.ok,
      status: resp.status,
      statusText: resp.statusText
    });
  } catch (err) {
    console.warn("Trading webhook trigger error:", err);
    res.status(500).json({
      success: false,
      error: err?.message || "Webhook dispatch failed"
    });
  }
});
var cachedGithubUser = null;
var cachedGithubRepos = null;
app.get("/api/github/user", async (req, res) => {
  try {
    const now = Date.now();
    if (cachedGithubUser && now - cachedGithubUser.timestamp < 10 * 60 * 1e3) {
      return res.json(cachedGithubUser.data);
    }
    const response = await fetch("https://api.github.com/users/rsk934128-dot", {
      headers: {
        "User-Agent": "AI-Assistant-Coding-Studio-App/1.0",
        Accept: "application/vnd.github.v3+json"
      }
    });
    if (response.ok) {
      const data = await response.json();
      cachedGithubUser = { data, timestamp: now };
      return res.json(data);
    }
    const fallbackUser = {
      login: "rsk934128-dot",
      id: 248212950,
      avatar_url: "https://avatars.githubusercontent.com/u/248212950?v=4",
      html_url: "https://github.com/rsk934128-dot",
      name: "SHEIKH FARID",
      company: "RubelPay",
      blog: "https://www.facebook.com/rubelrubel.rubel.98",
      location: "Sirajganj Sadar, Bangladesh",
      bio: "Founder & Independent Software Builder from Bangladesh \u{1F1E7}\u{1F1E9}\nBuilding trust-first web & app solutions that solve real-world problems. Focus: \u2022 Visa & migration",
      public_repos: 139,
      followers: 0,
      following: 0,
      hireable: true
    };
    return res.json(fallbackUser);
  } catch (err) {
    console.warn("GitHub user fetch fallback:", err?.message || err);
    return res.json({
      login: "rsk934128-dot",
      avatar_url: "https://avatars.githubusercontent.com/u/248212950?v=4",
      html_url: "https://github.com/rsk934128-dot",
      name: "SHEIKH FARID",
      company: "RubelPay",
      location: "Sirajganj Sadar, Bangladesh",
      bio: "Founder & Independent Software Builder from Bangladesh \u{1F1E7}\u{1F1E9}",
      public_repos: 139
    });
  }
});
app.get("/api/github/repos", async (req, res) => {
  try {
    const now = Date.now();
    if (cachedGithubRepos && now - cachedGithubRepos.timestamp < 10 * 60 * 1e3) {
      return res.json(cachedGithubRepos.data);
    }
    const response = await fetch("https://api.github.com/users/rsk934128-dot/repos?sort=updated&per_page=100", {
      headers: {
        "User-Agent": "AI-Assistant-Coding-Studio-App/1.0",
        Accept: "application/vnd.github.v3+json"
      }
    });
    if (response.ok) {
      const repos = await response.json();
      if (Array.isArray(repos) && repos.length > 0) {
        cachedGithubRepos = { data: repos, timestamp: now };
        return res.json(repos);
      }
    }
    const fallbackRepos = [
      {
        id: 1,
        name: "DeepMind-Science-Discovery-Workbench",
        full_name: "rsk934128-dot/DeepMind-Science-Discovery-Workbench",
        html_url: "https://github.com/rsk934128-dot/DeepMind-Science-Discovery-Workbench",
        description: "DeepMind Science Discovery Workbench \u2014 \u0985\u09A4\u09CD\u09AF\u09BE\u09A7\u09C1\u09A8\u09BF\u0995 \u09AC\u09C8\u099C\u09CD\u099E\u09BE\u09A8\u09BF\u0995 \u0997\u09AC\u09C7\u09B7\u09A3\u09BE, \u09AA\u09CD\u09B0\u09CB\u099F\u09BF\u09A8 \u09AE\u09A1\u09C7\u09B2\u09BF\u0982 \u0993 \u09B8\u09BF\u09AE\u09C1\u09B2\u09C7\u09B6\u09A8 \u09AA\u09CD\u09B2\u09CD\u09AF\u09BE\u099F\u09AB\u09B0\u09CD\u09AE\u0964",
        language: "TypeScript",
        stargazers_count: 5,
        forks_count: 1,
        updated_at: "2026-10-14T10:00:00Z"
      },
      {
        id: 2,
        name: "Sheikh-Farid-AI-Studio-",
        full_name: "rsk934128-dot/Sheikh-Farid-AI-Studio-",
        html_url: "https://github.com/rsk934128-dot/Sheikh-Farid-AI-Studio-",
        description: "\u09B6\u09C7\u0996 \u09AB\u09B0\u09BF\u09A6 AI Studio \u2014 \u09AA\u09C2\u09B0\u09CD\u09A3\u09BE\u0999\u09CD\u0997 \u09AB\u09C1\u09B2-\u09B8\u09CD\u099F\u09CD\u09AF\u09BE\u0995 \u0995\u09C3\u09A4\u09CD\u09B0\u09BF\u09AE \u09AC\u09C1\u09A6\u09CD\u09A7\u09BF\u09AE\u09A4\u09CD\u09A4\u09BE \u09B8\u09B9\u0995\u09BE\u09B0\u09C0 \u0993 \u0985\u099F\u09CB\u09AE\u09C7\u099F\u09C7\u09A1 \u0995\u09CB\u09A1\u09BF\u0982 \u09B8\u09CD\u099F\u09C1\u09A1\u09BF\u0993\u0964",
        language: "TypeScript",
        stargazers_count: 8,
        forks_count: 2,
        updated_at: "2026-10-14T08:30:00Z"
      },
      {
        id: 3,
        name: "Sheikh-Farid-AI-Studio-Project-Hub",
        full_name: "rsk934128-dot/Sheikh-Farid-AI-Studio-Project-Hub",
        html_url: "https://github.com/rsk934128-dot/Sheikh-Farid-AI-Studio-Project-Hub",
        description: "\u09B6\u09C7\u0996 \u09AB\u09B0\u09BF\u09A6 AI Studio & Project Hub \u2014 \u09AE\u09BE\u09B2\u09CD\u099F\u09BF-\u09B0\u09BF\u09AA\u09CB\u099C\u09BF\u099F\u09B0\u09BF \u0987\u0995\u09CB\u09B8\u09BF\u09B8\u09CD\u099F\u09C7\u09AE \u0993 \u09AA\u09CD\u09B0\u099C\u09C7\u0995\u09CD\u099F \u0995\u09CB\u0985\u09B0\u09CD\u09A1\u09BF\u09A8\u09C7\u09B6\u09A8 \u09B9\u09BE\u09AC\u0964",
        language: "TypeScript",
        stargazers_count: 4,
        forks_count: 1,
        updated_at: "2026-10-13T14:20:00Z"
      },
      {
        id: 4,
        name: "Stripe-Gmail-Payment-Gateway-Hub",
        full_name: "rsk934128-dot/Stripe-Gmail-Payment-Gateway-Hub",
        html_url: "https://github.com/rsk934128-dot/Stripe-Gmail-Payment-Gateway-Hub",
        description: "Stripe & Gmail Payment Gateway Hub \u2014 \u09B8\u09BF\u0995\u09BF\u0989\u09B0 \u09AA\u09C7\u09AE\u09C7\u09A8\u09CD\u099F \u0997\u09C7\u099F\u0993\u09AF\u09BC\u09C7 \u098F\u09AC\u0982 \u0985\u099F\u09CB\u09AE\u09C7\u099F\u09C7\u09A1 \u099C\u09BF\u09AE\u09C7\u0987\u09B2 \u09B0\u09BF\u09B8\u09BF\u099F \u09A1\u09BF\u09B8\u09AC\u09BE\u09B0\u09CD\u09B8\u09AE\u09C7\u09A8\u09CD\u099F \u09B8\u09BF\u09B8\u09CD\u099F\u09C7\u09AE\u0964",
        language: "JavaScript",
        stargazers_count: 6,
        forks_count: 1,
        updated_at: "2026-10-12T12:00:00Z"
      },
      {
        id: 5,
        name: "AI-Assistant-Coding-Studio",
        full_name: "rsk934128-dot/AI-Assistant-Coding-Studio",
        html_url: "https://github.com/rsk934128-dot/AI-Assistant-Coding-Studio",
        description: "AI-Assistant-Coding-Studio \u2014 \u09AB\u09CD\u09B2\u09CD\u09AF\u09BE\u0997\u09B6\u09BF\u09AA \u09B0\u09BF\u09AF\u09BC\u09C7\u09B2-\u099F\u09BE\u0987\u09AE \u0995\u09CB\u09A1\u09BF\u0982 \u09B8\u09B9\u0995\u09BE\u09B0\u09C0, \u09B2\u09BE\u0987\u09AD \u0995\u09AE\u09CD\u09AA\u09BE\u0987\u09B2\u09BE\u09B0 \u0993 \u0995\u09CD\u09B2\u09BE\u0989\u09A1 \u09B8\u09BF\u0999\u09CD\u0995\u0964",
        language: "TypeScript",
        stargazers_count: 12,
        forks_count: 3,
        updated_at: "2026-10-11T16:45:00Z"
      },
      {
        id: 6,
        name: "PayHub-Gateway-Gmail-Disbursement-PWA",
        full_name: "rsk934128-dot/PayHub-Gateway-Gmail-Disbursement-PWA",
        html_url: "https://github.com/rsk934128-dot/PayHub-Gateway-Gmail-Disbursement-PWA",
        description: "PayHub Gateway & Gmail Disbursement PWA \u2014 \u0985\u09AB\u09B2\u09BE\u0987\u09A8-\u09AB\u09BE\u09B0\u09CD\u09B8\u09CD\u099F \u09AA\u09C7\u09AE\u09C7\u09A8\u09CD\u099F \u0997\u09C7\u099F\u0993\u09AF\u09BC\u09C7 \u0993 \u09AA\u09C7-\u09B0\u09CB\u09B2 \u09AE\u09CD\u09AF\u09BE\u09A8\u09C7\u099C\u09AE\u09C7\u09A8\u09CD\u099F\u0964",
        language: "TypeScript",
        stargazers_count: 7,
        forks_count: 2,
        updated_at: "2026-10-10T09:15:00Z"
      },
      {
        id: 7,
        name: "No-IP-DNS-Remote-Access",
        full_name: "rsk934128-dot/No-IP-DNS-Remote-Access",
        html_url: "https://github.com/rsk934128-dot/No-IP-DNS-Remote-Access",
        description: "No-IP \u09A1\u09BE\u09AF\u09BC\u09A8\u09BE\u09AE\u09BF\u0995 \u09A1\u09BF\u098F\u09A8\u098F\u09B8 \u0993 \u09B0\u09BF\u09AE\u09CB\u099F \u09B8\u09BE\u09B0\u09CD\u09AD\u09BE\u09B0 \u0985\u09CD\u09AF\u09BE\u0995\u09CD\u09B8\u09C7\u09B8 \u0985\u099F\u09CB\u09AE\u09C7\u09B6\u09A8 \u099F\u09C1\u09B2\u0995\u09BF\u099F\u0964",
        language: "Shell",
        stargazers_count: 3,
        forks_count: 0,
        updated_at: "2026-10-09T18:00:00Z"
      }
    ];
    return res.json(fallbackRepos);
  } catch (err) {
    console.warn("GitHub repos fetch error:", err?.message || err);
    return res.json([]);
  }
});
app.get("/api/ddns/my-ip", async (req, res) => {
  try {
    const ipRes = await fetch("https://api.ipify.org?format=json");
    if (ipRes.ok) {
      const data = await ipRes.json();
      return res.json({ ip: data.ip });
    }
    const clientIp = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.socket.remoteAddress || "127.0.0.1";
    return res.json({ ip: clientIp });
  } catch (err) {
    const clientIp = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.socket.remoteAddress || "127.0.0.1";
    return res.json({ ip: clientIp });
  }
});
app.post("/api/ddns/update", async (req, res) => {
  try {
    const { hostname = "office.ddns.net", username, password, myip } = req.body;
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        code: "badauth",
        error: "No-IP username/email \u098F\u09AC\u0982 password \u09AA\u09CD\u09B0\u09DF\u09CB\u099C\u09A8\u0964"
      });
    }
    const targetHostname = String(hostname).trim();
    let targetIp = String(myip || "").trim();
    if (!targetIp) {
      try {
        const ipRes = await fetch("https://api.ipify.org?format=json");
        if (ipRes.ok) {
          const data = await ipRes.json();
          targetIp = data.ip;
        }
      } catch (_) {
      }
    }
    const authHeader = "Basic " + Buffer.from(`${username}:${password}`).toString("base64");
    const updateUrl = targetIp ? `https://dynupdate.no-ip.com/nic/update?hostname=${encodeURIComponent(targetHostname)}&myip=${encodeURIComponent(targetIp)}` : `https://dynupdate.no-ip.com/nic/update?hostname=${encodeURIComponent(targetHostname)}`;
    const noIpRes = await fetch(updateUrl, {
      method: "GET",
      headers: {
        "Authorization": authHeader,
        "User-Agent": "PartnerGateway/3.2 developer@partner.com"
      }
    });
    const rawOutput = (await noIpRes.text()).trim();
    const parts = rawOutput.split(/\s+/);
    const code = parts[0]?.toLowerCase();
    const resolvedIp = parts[1] || targetIp;
    let success = false;
    let messageBn = "";
    let messageEn = "";
    let instructions = [];
    switch (code) {
      case "good":
        success = true;
        messageBn = `DNS \u09B0\u09C7\u0995\u09B0\u09CD\u09A1 \u09B8\u09AB\u09B2\u09AD\u09BE\u09AC\u09C7 \u0986\u09AA\u09A1\u09C7\u099F \u09B9\u09DF\u09C7\u099B\u09C7! \u09AC\u09B0\u09CD\u09A4\u09AE\u09BE\u09A8 IP: ${resolvedIp}`;
        messageEn = `DNS record updated successfully! IP is now ${resolvedIp}`;
        break;
      case "nochg":
        success = true;
        messageBn = `IP \u0987\u09A4\u09BF\u09AE\u09A7\u09CD\u09AF\u09C7\u0987 \u0986\u09AA\u09A1\u09C7\u099F \u09B0\u09DF\u09C7\u099B\u09C7 (${resolvedIp})\u0964 \u0985\u09A4\u09BF\u09B0\u09BF\u0995\u09CD\u09A4 \u09AA\u09B0\u09BF\u09AC\u09B0\u09CD\u09A4\u09A8\u09C7\u09B0 \u09AA\u09CD\u09B0\u09DF\u09CB\u099C\u09A8 \u09A8\u09C7\u0987\u0964`;
        messageEn = `IP is already identical (${resolvedIp}); no change needed.`;
        break;
      case "badauth":
        success = false;
        messageBn = "\u0987\u0989\u099C\u09BE\u09B0\u09A8\u09C7\u09AE \u0985\u09A5\u09AC\u09BE \u09AA\u09BE\u09B8\u0993\u09AF\u09BC\u09BE\u09B0\u09CD\u09A1 \u09B8\u09A0\u09BF\u0995 \u09A8\u09DF (Invalid Credentials / badauth)\u0964";
        messageEn = "Invalid username or password (badauth).";
        instructions = [
          "\u09E7. No-IP.com \u098F \u09B2\u0997\u0987\u09A8 \u0995\u09B0\u09C1\u09A8 (https://www.noip.com/login)\u0964",
          '\u09E8. Account -> "DDNS Keys" \u09AE\u09C7\u09A8\u09C1 \u09A5\u09C7\u0995\u09C7 \u098F\u0995\u099F\u09BF \u09A8\u09A4\u09C1\u09A8 DDNS Key \u09A4\u09C8\u09B0\u09BF \u0995\u09B0\u09C1\u09A8\u0964',
          '\u09E9. No-IP \u098F\u0996\u09A8 \u09AE\u09C2\u09B2 \u09AA\u09BE\u09B8\u0993\u09AF\u09BC\u09BE\u09B0\u09CD\u09A1\u09C7\u09B0 \u09AC\u09A6\u09B2\u09C7 \u09A1\u09C7\u09A1\u09BF\u0995\u09C7\u099F\u09C7\u09A1 "DDNS Key" \u0987\u0989\u099C\u09BE\u09B0\u09A8\u09C7\u09AE \u0993 \u09AA\u09BE\u09B8\u0993\u09AF\u09BC\u09BE\u09B0\u09CD\u09A1 \u09AC\u09CD\u09AF\u09AC\u09B9\u09BE\u09B0 \u09AC\u09BE\u09A7\u09CD\u09AF\u09A4\u09BE\u09AE\u09C2\u09B2\u0995 \u0995\u09B0\u09C7\u099B\u09C7\u0964',
          "\u09EA. \u0986\u09AA\u09A8\u09BE\u09B0 \u0987\u09AE\u09C7\u0987\u09B2 (sheikhfarid164@gmail.com \u09AC\u09BE sheikhfaridvisa164@gmail.com) \u09B8\u09A0\u09BF\u0995 \u0995\u09BF\u09A8\u09BE \u09AA\u09B0\u09C0\u0995\u09CD\u09B7\u09BE \u0995\u09B0\u09C1\u09A8\u0964"
        ];
        break;
      case "nohost":
        success = false;
        messageBn = `\u09AA\u09CD\u09B0\u09A6\u09A4\u09CD\u09A4 \u09B9\u09CB\u09B8\u09CD\u099F\u09A8\u09C7\u09AE (${targetHostname}) \u098F\u0987 \u098F\u0995\u09BE\u0989\u09A8\u09CD\u099F\u09C7 \u0996\u09C1\u0981\u099C\u09C7 \u09AA\u09BE\u0993\u09DF\u09BE \u09AF\u09BE\u09DF\u09A8\u09BF (nohost)\u0964`;
        messageEn = `Hostname (${targetHostname}) does not exist in this account (nohost).`;
        instructions = [
          '\u09E7. No-IP \u09A1\u09CD\u09AF\u09BE\u09B6\u09AC\u09CB\u09B0\u09CD\u09A1\u09C7 \u0997\u09BF\u09DF\u09C7 "Dynamic DNS" -> "No-IP Hostnames" \u099A\u09C7\u0995 \u0995\u09B0\u09C1\u09A8\u0964',
          '\u09E8. "office.ddns.net" \u09B9\u09CB\u09B8\u09CD\u099F\u09A8\u09C7\u09AE\u099F\u09BF \u0986\u09AA\u09A8\u09BE\u09B0 \u098F\u0995\u09BE\u0989\u09A8\u09CD\u099F\u09C7 \u09B8\u0995\u09CD\u09B0\u09BF\u09DF \u0986\u099B\u09C7 \u0995\u09BF\u09A8\u09BE \u09A8\u09BF\u09B6\u09CD\u099A\u09BF\u09A4 \u0995\u09B0\u09C1\u09A8\u0964'
        ];
        break;
      case "abuse":
        success = false;
        messageBn = "\u0985\u09CD\u09AF\u09BE\u0995\u09BE\u0989\u09A8\u09CD\u099F \u09AC\u09CD\u09B2\u0995 \u09AC\u09BE \u09B8\u09C0\u09AE\u09BF\u09A4 \u0995\u09B0\u09BE \u09B9\u09DF\u09C7\u099B\u09C7 (abuse)\u0964 \u0996\u09C1\u09AC \u0998\u09A8 \u0998\u09A8 \u0986\u09AA\u09A1\u09C7\u099F \u09B0\u09BF\u0995\u09CB\u09DF\u09C7\u09B8\u09CD\u099F \u09AA\u09BE\u09A0\u09BE\u09A8\u09CB \u09AF\u09BE\u09AC\u09C7 \u09A8\u09BE\u0964";
        messageEn = "Username blocked due to abuse or rapid update calls.";
        break;
      case "911":
        success = false;
        messageBn = "No-IP \u09B8\u09BE\u09B0\u09CD\u09AD\u09BE\u09B0\u09C7 \u09B8\u09BE\u09AE\u09DF\u09BF\u0995 \u09AC\u09BF\u09AA\u09B0\u09CD\u09AF\u09DF \u09A6\u09C7\u0996\u09BE \u09A6\u09BF\u09DF\u09C7\u099B\u09C7 (911)\u0964 \u09E9\u09E6 \u09AE\u09BF\u09A8\u09BF\u099F \u09AA\u09B0 \u0986\u09AC\u09BE\u09B0 \u099A\u09C7\u09B7\u09CD\u099F\u09BE \u0995\u09B0\u09C1\u09A8\u0964";
        messageEn = "A fatal server error occurred on No-IP side (911).";
        break;
      default:
        success = false;
        messageBn = `No-IP \u09B8\u09BE\u09B0\u09CD\u09AD\u09BE\u09B0 \u09B0\u09C7\u09B8\u09AA\u09A8\u09CD\u09B8: ${rawOutput}`;
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
      instructions: instructions.length > 0 ? instructions : void 0
    });
  } catch (err) {
    console.error("No-IP DDNS endpoint error:", err);
    return res.status(500).json({
      success: false,
      code: "error",
      error: err?.message || "Failed to communicate with No-IP service"
    });
  }
});
app.get("/api/fetch-link-preview", async (req, res) => {
  try {
    const rawUrl = req.query.url;
    if (!rawUrl || typeof rawUrl !== "string") {
      return res.status(400).json({ success: false, error: "URL is required" });
    }
    let parsedUrl;
    try {
      parsedUrl = new URL(rawUrl);
    } catch {
      return res.status(400).json({ success: false, error: "Invalid URL format" });
    }
    const host = parsedUrl.hostname.toLowerCase();
    if (host === "localhost" || host === "127.0.0.1" || host.startsWith("192.168.") || host.startsWith("10.")) {
      return res.status(400).json({ success: false, error: "Access to local IP is forbidden" });
    }
    const abortCtrl = new AbortController();
    const timeout = setTimeout(() => abortCtrl.abort(), 6e3);
    try {
      const response = await fetch(rawUrl, {
        signal: abortCtrl.signal,
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 AIStudioBot/1.0",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
        }
      });
      clearTimeout(timeout);
      if (!response.ok) {
        return res.json({
          success: true,
          domain: parsedUrl.hostname,
          title: parsedUrl.hostname,
          description: `\u09B2\u09BF\u0982\u0995: ${rawUrl}`,
          url: rawUrl
        });
      }
      const html = await response.text();
      const ogTitleMatch = html.match(/<meta\s+property=["']og:title["']\s+content=["'](.*?)["']/i) || html.match(/<meta\s+content=["'](.*?)["']\s+property=["']og:title["']/i);
      const titleTagMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
      const ogDescMatch = html.match(/<meta\s+property=["']og:description["']\s+content=["'](.*?)["']/i) || html.match(/<meta\s+content=["'](.*?)["']\s+property=["']og:description["']/i);
      const metaDescMatch = html.match(/<meta\s+name=["']description["']\s+content=["'](.*?)["']/i) || html.match(/<meta\s+content=["'](.*?)["']\s+name=["']description["']/i);
      const ogImageMatch = html.match(/<meta\s+property=["']og:image["']\s+content=["'](.*?)["']/i) || html.match(/<meta\s+content=["'](.*?)["']\s+property=["']og:image["']/i);
      const title = ogTitleMatch?.[1] || titleTagMatch?.[1] || parsedUrl.hostname;
      const description = ogDescMatch?.[1] || metaDescMatch?.[1] || "";
      const image = ogImageMatch?.[1] || "";
      return res.json({
        success: true,
        title: title.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").slice(0, 150),
        description: description.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").slice(0, 300),
        image,
        domain: parsedUrl.hostname,
        url: rawUrl
      });
    } catch {
      clearTimeout(timeout);
      return res.json({
        success: true,
        domain: parsedUrl.hostname,
        title: parsedUrl.hostname,
        description: `\u09B2\u09BF\u0982\u0995: ${rawUrl}`,
        url: rawUrl
      });
    }
  } catch (err) {
    return res.status(500).json({ success: false, error: err?.message || "Link preview fetch failed" });
  }
});
app.use((err, req, res, next) => {
  console.error("Unhandled route error in server:", err);
  if (res.headersSent) {
    return next(err);
  }
  res.status(500).json({
    success: false,
    error: err?.message || "Internal Server Error"
  });
});
function serveStaticProduction() {
  const cwdDist = import_path.default.join(process.cwd(), "dist");
  const appDir = getAppDirname();
  const dirnameDist = import_path.default.resolve(appDir, appDir.endsWith("dist") ? "." : "dist");
  const distPath = import_fs.default.existsSync(cwdDist) ? cwdDist : dirnameDist;
  app.use(import_express.default.static(distPath, { maxAge: "1d", index: false }));
  app.get(["/healthz", "/_health", "/api/healthz"], (req, res) => {
    res.status(200).send("OK");
  });
  app.use("/api", (req, res) => {
    res.status(404).json({
      success: false,
      error: `API route not found: ${req.method} ${req.originalUrl}`
    });
  });
  app.get("*", (req, res) => {
    const indexPath = import_path.default.join(distPath, "index.html");
    if (import_fs.default.existsSync(indexPath)) {
      try {
        const proto = req.headers["x-forwarded-proto"] || req.protocol || "https";
        const host = req.headers["x-forwarded-host"] || req.get("host") || "";
        const currentOrigin = host ? `${proto}://${host}` : "";
        if (currentOrigin) {
          let html = import_fs.default.readFileSync(indexPath, "utf-8");
          html = html.replace(/https:\/\/ais-pre-sdbgwm6do3t5hwhyzxx7x7-500845900368\.asia-southeast1\.run\.app/g, currentOrigin);
          return res.status(200).type("html").send(html);
        }
      } catch {
      }
      res.sendFile(indexPath);
    } else {
      res.status(200).send(
        "<!DOCTYPE html><html><head><title>App Initializing</title></head><body><h1>Application Initializing</h1><p>Frontend static bundle not found. Please run: npm run build</p></body></html>"
      );
    }
  });
}
async function startServer() {
  const distExists = import_fs.default.existsSync(import_path.default.join(process.cwd(), "dist", "index.html"));
  const isDevScript = process.env.npm_lifecycle_event === "dev";
  const isProduction = process.env.NODE_ENV === "production" || process.env.npm_lifecycle_event === "start" || distExists && !isDevScript;
  if (!isProduction) {
    try {
      const { createServer: createViteServer } = await import("vite");
      const vite = await createViteServer({
        server: {
          middlewareMode: true,
          hmr: false
        },
        appType: "spa"
      });
      app.use(vite.middlewares);
    } catch (viteErr) {
      console.warn("Vite dev middleware failed to load, falling back to static server:", viteErr);
      serveStaticProduction();
    }
  } else {
    serveStaticProduction();
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT} (mode: ${isProduction ? "production" : "development"})`);
  });
}
if (!process.env.VERCEL && !process.env.NETLIFY && !process.env.AWS_LAMBDA_FUNCTION_NAME) {
  startServer();
}
var server_default = app;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  FALLBACK_MODELS,
  app
});
//# sourceMappingURL=server.cjs.map
