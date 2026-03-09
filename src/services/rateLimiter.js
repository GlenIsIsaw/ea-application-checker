// Simple but effective rate limiter
const requestLog = new Map();

export function checkRateLimit(identifier = "default") {
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxRequests = 10; // Max 10 requests per minute per user

  // Clean up old entries
  if (!requestLog.has(identifier)) {
    requestLog.set(identifier, []);
  }

  const timestamps = requestLog.get(identifier);

  // Remove timestamps older than 1 minute
  while (timestamps.length > 0 && timestamps[0] < now - windowMs) {
    timestamps.shift();
  }

  // Check if over limit
  if (timestamps.length >= maxRequests) {
    return false; // Rate limit exceeded
  }

  // Add current request
  timestamps.push(now);
  return true; // Request allowed
}

// Generate a simple fingerprint for the user (without using 'screen')
export function getUserFingerprint() {
  // Check if we're in a browser environment
  const isBrowser = typeof window !== "undefined";

  // Combine multiple factors to identify user
  const fingerprint = {
    userAgent: isBrowser ? navigator.userAgent : "server",
    language: isBrowser ? navigator.language : "unknown",
    // Safely get screen dimensions if available
    screenSize:
      isBrowser && window.screen
        ? `${window.screen.width || 0}x${window.screen.height || 0}`
        : "unknown",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    sessionId: isBrowser
      ? sessionStorage.getItem("session_id") ||
        Math.random().toString(36).substring(7)
      : Math.random().toString(36).substring(7),
  };

  // Store session ID if not exists (only in browser)
  if (isBrowser && !sessionStorage.getItem("session_id")) {
    sessionStorage.setItem("session_id", fingerprint.sessionId);
  }

  // Create a simple hash
  return btoa(JSON.stringify(fingerprint)).substring(0, 50);
}
