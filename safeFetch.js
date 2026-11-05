import dns from "dns";
import net from "net";
function isPrivateOrBlockedIP(ip) {
  if (!ip) return true;
  if (ip.startsWith("::ffff:")) {
    ip = ip.substring(7);
  }
  const family = net.isIP(ip);
  if (!family) return true;
  if (family === 4) {
    const parts = ip.split(".").map((p) => parseInt(p, 10));
    if (parts.length !== 4 || parts.some((p) => isNaN(p) || p < 0 || p > 255)) {
      return true;
    }
    const [a, b] = parts;
    if (a === 0) return true;
    if (a === 10) return true;
    if (a === 100 && b >= 64 && b <= 127) return true;
    if (a === 127) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 0 && parts[2] === 0) return true;
    if (a === 192 && b === 0 && parts[2] === 2) return true;
    if (a === 192 && b === 88 && parts[2] === 99) return true;
    if (a === 192 && b === 168) return true;
    if (a === 198 && (b === 18 || b === 19)) return true;
    if (a === 198 && b === 51 && parts[2] === 100) return true;
    if (a === 203 && b === 0 && parts[2] === 113) return true;
    if (a >= 224 && a <= 239) return true;
    if (a >= 240) return true;
    return false;
  }
  if (family === 6) {
    const lower = ip.toLowerCase();
    if (lower === "::1" || lower === "0000:0000:0000:0000:0000:0000:0000:0001") return true;
    if (lower === "::" || lower === "0000:0000:0000:0000:0000:0000:0000:0000") return true;
    if (lower.startsWith("fc") || lower.startsWith("fd")) return true;
    if (lower.startsWith("fe8") || lower.startsWith("fe9") || lower.startsWith("fea") || lower.startsWith("feb")) return true;
    if (lower.startsWith("2001:db8")) return true;
    return false;
  }
  return true;
}
const BLOCKED_HOSTNAMES = /* @__PURE__ */ new Set([
  "localhost",
  "metadata.google.internal",
  "metadata",
  "instance-data",
  "169.254.169.254",
  "metadata.packet.net"
]);
async function validateSafeUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== "string") {
    return { valid: false, reason: "URL string is required" };
  }
  let parsed;
  try {
    parsed = new URL(rawUrl.startsWith("http://") || rawUrl.startsWith("https://") ? rawUrl : `https://${rawUrl}`);
  } catch {
    return { valid: false, reason: "Invalid URL format" };
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { valid: false, reason: "Only HTTP and HTTPS protocols are allowed" };
  }
  const hostname = parsed.hostname.toLowerCase().trim();
  const normalizedHost = hostname.replace(/^\[/, "").replace(/\]$/, "");
  if (BLOCKED_HOSTNAMES.has(normalizedHost) || normalizedHost.endsWith(".localhost") || normalizedHost.endsWith(".internal")) {
    return { valid: false, reason: "Access to internal metadata or local hosts is strictly prohibited" };
  }
  if (net.isIP(normalizedHost)) {
    if (isPrivateOrBlockedIP(normalizedHost)) {
      return { valid: false, reason: "Access to private or link-local IP addresses is strictly prohibited" };
    }
    return { valid: true, url: parsed, parsedUrl: parsed };
  }
  try {
    const lookupResults = await dns.promises.lookup(normalizedHost, { all: true });
    if (!lookupResults || lookupResults.length === 0) {
      return { valid: false, reason: "Could not resolve domain name" };
    }
    for (const record of lookupResults) {
      if (isPrivateOrBlockedIP(record.address)) {
        return { valid: false, reason: `Domain resolves to prohibited internal IP address (${record.address})` };
      }
    }
  } catch (dnsErr) {
    return { valid: false, reason: `DNS resolution failed: ${dnsErr?.message || "Host not found"}` };
  }
  return { valid: true, url: parsed, parsedUrl: parsed };
}
async function safeFetch(rawUrl, init) {
  const validation = await validateSafeUrl(rawUrl);
  if (!validation.valid || !validation.url) {
    throw new Error(`SSRF Prevention: ${validation.reason || "Prohibited URL"}`);
  }
  const timeoutMs = init?.timeoutMs || 8e3;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const signal = init?.signal ? anySignal([init.signal, controller.signal]) : controller.signal;
  try {
    const response = await fetch(validation.url.toString(), {
      ...init,
      signal,
      redirect: "manual"
      // Manually handle redirects to validate each step against SSRF!
    });
    if (response.status >= 300 && response.status < 400 && response.headers.has("location")) {
      const location = response.headers.get("location");
      if (location) {
        const nextUrl = new URL(location, validation.url).toString();
        const maxRedirects = init?.maxRedirects ?? 3;
        if (maxRedirects <= 0) {
          throw new Error("Too many redirects");
        }
        clearTimeout(timer);
        return safeFetch(nextUrl, {
          ...init,
          maxRedirects: maxRedirects - 1,
          timeoutMs
        });
      }
    }
    return response;
  } finally {
    clearTimeout(timer);
  }
}
function anySignal(signals) {
  const controller = new AbortController();
  for (const sig of signals) {
    if (!sig) continue;
    if (sig.aborted) {
      controller.abort();
      return controller.signal;
    }
    sig.addEventListener("abort", () => controller.abort(), { once: true });
  }
  return controller.signal;
}
function escapeHtml(unsafe) {
  if (!unsafe) return "";
  return String(unsafe).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}
export {
  escapeHtml,
  isPrivateOrBlockedIP,
  safeFetch,
  validateSafeUrl
};
