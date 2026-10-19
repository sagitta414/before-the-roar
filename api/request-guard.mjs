import { isIP } from "node:net";

const cleanIp = (value = "") => {
  let ip = String(value).trim();
  if (ip.startsWith("[")) ip = ip.slice(1, ip.indexOf("]"));
  if (ip.startsWith("::ffff:")) ip = ip.slice(7);
  if (/^\d+\.\d+\.\d+\.\d+:\d+$/.test(ip)) ip = ip.split(":")[0];
  return isIP(ip) ? ip.toLowerCase() : null;
};

const privateV4 = (ip) => {
  const parts = ip.split(".").map(Number);
  return (
    parts[0] === 10 ||
    parts[0] === 127 ||
    (parts[0] === 169 && parts[1] === 254) ||
    (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
    (parts[0] === 192 && parts[1] === 168)
  );
};

export function trustedProxy(ip, configured = process.env.BTR_TRUSTED_PROXY_IPS || "") {
  ip = cleanIp(ip);
  if (!ip) return false;
  if (configured.split(",").map(cleanIp).filter(Boolean).includes(ip)) return true;
  if (isIP(ip) === 4) return privateV4(ip);
  return ip === "::1" || ip.startsWith("fc") || ip.startsWith("fd") || ip.startsWith("fe80:");
}

// Container Apps appends the verified hop to the right of any caller-supplied
// chain. Walk right-to-left from a trusted ingress socket and stop at the first
// untrusted address. A public direct peer never gets to supply its own identity.
export function clientIdentity(req) {
  const remote = cleanIp(req.socket?.remoteAddress) || "unknown";
  if (!trustedProxy(remote)) return remote;
  const chain = String(req.headers?.["x-forwarded-for"] || "")
    .split(",")
    .map(cleanIp)
    .filter(Boolean);
  for (let i = chain.length - 1; i >= 0; i--) {
    if (!trustedProxy(chain[i])) return chain[i];
  }
  return remote;
}

export class RateTable {
  constructor({ clock = () => Date.now(), windowMs = 600000, maxKeys = 1024 } = {}) {
    this.clock = clock;
    this.windowMs = windowMs;
    this.maxKeys = maxKeys;
    this.entries = new Map();
  }
  prune(now = this.clock()) {
    for (const [key, value] of this.entries)
      if (value.until <= now && value.pending === 0) this.entries.delete(key);
  }
  reserve(key, limit) {
    const now = this.clock();
    this.prune(now);
    let entry = this.entries.get(key);
    if (!entry) {
      if (this.entries.size >= this.maxKeys) return null;
      entry = { used: 0, pending: 0, until: now + this.windowMs };
      this.entries.set(key, entry);
    } else if (entry.until <= now && entry.pending === 0) {
      entry.used = 0;
      entry.until = now + this.windowMs;
    }
    if (entry.used + entry.pending >= limit) return null;
    entry.pending++;
    let settled = false;
    return {
      commit: () => {
        if (settled) return;
        settled = true;
        entry.pending--;
        entry.used++;
      },
      release: () => {
        if (settled) return;
        settled = true;
        entry.pending--;
        if (entry.used === 0 && entry.pending === 0) this.entries.delete(key);
      },
    };
  }
  get size() {
    return this.entries.size;
  }
}

export function combinedSignal(signal, timeoutMs) {
  const timeout = AbortSignal.timeout(timeoutMs);
  return signal ? AbortSignal.any([signal, timeout]) : timeout;
}
