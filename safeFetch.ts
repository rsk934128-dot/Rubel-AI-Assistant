import dns from 'dns';
import net from 'net';

/**
 * Validates whether an IP address belongs to private, loopback, link-local,
 * carrier-grade NAT, or metadata ranges to prevent Server-Side Request Forgery (SSRF).
 */
export function isPrivateOrBlockedIP(ip: string): boolean {
  if (!ip) return true;

  // Handle IPv4-mapped IPv6 addresses like "::ffff:127.0.0.1" or "::ffff:169.254.169.254"
  if (ip.startsWith('::ffff:')) {
    ip = ip.substring(7);
  }

  const family = net.isIP(ip);
  if (!family) return true; // Invalid IP is blocked by default

  if (family === 4) {
    const parts = ip.split('.').map(p => parseInt(p, 10));
    if (parts.length !== 4 || parts.some(p => isNaN(p) || p < 0 || p > 255)) {
      return true;
    }

    const [a, b] = parts;

    // 0.0.0.0/8 (Current network)
    if (a === 0) return true;

    // 10.0.0.0/8 (Private network)
    if (a === 10) return true;

    // 100.64.0.0/10 (Shared Address Space / CGNAT)
    if (a === 100 && b >= 64 && b <= 127) return true;

    // 127.0.0.0/8 (Loopback)
    if (a === 127) return true;

    // 169.254.0.0/16 (Link-local & Cloud Metadata e.g. 169.254.169.254)
    if (a === 169 && b === 254) return true;

    // 172.16.0.0/12 (Private network)
    if (a === 172 && b >= 16 && b <= 31) return true;

    // 192.0.0.0/24 (IETF Protocol Assignments)
    if (a === 192 && b === 0 && parts[2] === 0) return true;

    // 192.0.2.0/24 (TEST-NET-1)
    if (a === 192 && b === 0 && parts[2] === 2) return true;

    // 192.88.99.0/24 (6to4 Relay Anycast)
    if (a === 192 && b === 88 && parts[2] === 99) return true;

    // 192.168.0.0/16 (Private network)
    if (a === 192 && b === 168) return true;

    // 198.18.0.0/15 (Network benchmark tests)
    if (a === 198 && (b === 18 || b === 19)) return true;

    // 198.51.100.0/24 (TEST-NET-2)
    if (a === 198 && b === 51 && parts[2] === 100) return true;

    // 203.0.113.0/24 (TEST-NET-3)
    if (a === 203 && b === 0 && parts[2] === 113) return true;

    // 224.0.0.0/4 (Multicast)
    if (a >= 224 && a <= 239) return true;

    // 240.0.0.0/4 (Reserved for future use / broadcast)
    if (a >= 240) return true;

    return false;
  }

  if (family === 6) {
    const lower = ip.toLowerCase();

    // Loopback ::1
    if (lower === '::1' || lower === '0000:0000:0000:0000:0000:0000:0000:0001') return true;

    // Unspecified ::
    if (lower === '::' || lower === '0000:0000:0000:0000:0000:0000:0000:0000') return true;

    // Unique Local (fc00::/7 -> fc.. and fd..)
    if (lower.startsWith('fc') || lower.startsWith('fd')) return true;

    // Link-local (fe80::/10)
    if (lower.startsWith('fe8') || lower.startsWith('fe9') || lower.startsWith('fea') || lower.startsWith('feb')) return true;

    // Documentation (2001:db8::/32)
    if (lower.startsWith('2001:db8')) return true;

    return false;
  }

  return true;
}

const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  'metadata.google.internal',
  'metadata',
  'instance-data',
  '169.254.169.254',
  'metadata.packet.net',
]);

/**
 * Validates a target URL against SSRF attacks (checking protocol, hostname, and resolved IP).
 */
export async function validateSafeUrl(rawUrl: string): Promise<{ valid: boolean; url?: URL; parsedUrl?: URL; reason?: string }> {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return { valid: false, reason: 'URL string is required' };
  }

  let parsed: URL;
  try {
    parsed = new URL(rawUrl.startsWith('http://') || rawUrl.startsWith('https://') ? rawUrl : `https://${rawUrl}`);
  } catch {
    return { valid: false, reason: 'Invalid URL format' };
  }

  // Enforce strictly http or https
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { valid: false, reason: 'Only HTTP and HTTPS protocols are allowed' };
  }

  const hostname = parsed.hostname.toLowerCase().trim();

  // Strip enclosing brackets for IPv6 hostnames
  const normalizedHost = hostname.replace(/^\[/, '').replace(/\]$/, '');

  // Check known blocked hostnames
  if (BLOCKED_HOSTNAMES.has(normalizedHost) || normalizedHost.endsWith('.localhost') || normalizedHost.endsWith('.internal')) {
    return { valid: false, reason: 'Access to internal metadata or local hosts is strictly prohibited' };
  }

  // If host is already an IP, check directly
  if (net.isIP(normalizedHost)) {
    if (isPrivateOrBlockedIP(normalizedHost)) {
      return { valid: false, reason: 'Access to private or link-local IP addresses is strictly prohibited' };
    }
    return { valid: true, url: parsed, parsedUrl: parsed };
  }

  // Resolve hostname via DNS to prevent DNS rebinding
  try {
    const lookupResults = await dns.promises.lookup(normalizedHost, { all: true });
    if (!lookupResults || lookupResults.length === 0) {
      return { valid: false, reason: 'Could not resolve domain name' };
    }

    for (const record of lookupResults) {
      if (isPrivateOrBlockedIP(record.address)) {
        return { valid: false, reason: `Domain resolves to prohibited internal IP address (${record.address})` };
      }
    }
  } catch (dnsErr: any) {
    return { valid: false, reason: `DNS resolution failed: ${dnsErr?.message || 'Host not found'}` };
  }

  return { valid: true, url: parsed, parsedUrl: parsed };
}

/**
 * Safe fetch wrapper with SSRF protection, timeout, and redirect-target validation.
 */
export async function safeFetch(
  rawUrl: string,
  init?: RequestInit & { timeoutMs?: number; maxRedirects?: number }
): Promise<Response> {
  const validation = await validateSafeUrl(rawUrl);
  if (!validation.valid || !validation.url) {
    throw new Error(`SSRF Prevention: ${validation.reason || 'Prohibited URL'}`);
  }

  const timeoutMs = init?.timeoutMs || 8000;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const signal = init?.signal
    ? anySignal([init.signal, controller.signal])
    : controller.signal;

  try {
    const response = await fetch(validation.url.toString(), {
      ...init,
      signal,
      redirect: 'manual', // Manually handle redirects to validate each step against SSRF!
    });

    // Check if redirect
    if (response.status >= 300 && response.status < 400 && response.headers.has('location')) {
      const location = response.headers.get('location');
      if (location) {
        const nextUrl = new URL(location, validation.url).toString();
        const maxRedirects = init?.maxRedirects ?? 3;
        if (maxRedirects <= 0) {
          throw new Error('Too many redirects');
        }
        clearTimeout(timer);
        return safeFetch(nextUrl, {
          ...init,
          maxRedirects: maxRedirects - 1,
          timeoutMs,
        });
      }
    }

    return response;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Combine multiple AbortSignals safely.
 */
function anySignal(signals: (AbortSignal | undefined)[]): AbortSignal {
  const controller = new AbortController();
  for (const sig of signals) {
    if (!sig) continue;
    if (sig.aborted) {
      controller.abort();
      return controller.signal;
    }
    sig.addEventListener('abort', () => controller.abort(), { once: true });
  }
  return controller.signal;
}

/**
 * Escapes unsafe HTML characters to prevent XSS.
 */
export function escapeHtml(unsafe: string): string {
  if (!unsafe) return '';
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
