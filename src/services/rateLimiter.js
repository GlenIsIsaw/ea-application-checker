// Simple but effective rate limiter
const requestLog = new Map();

export function checkRateLimit(identifier = 'default') {
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

// Generate a simple fingerprint for the user
export function getUserFingerprint() {
  // Combine multiple factors to identify user
  const fingerprint = {
    userAgent: navigator.userAgent,
    language: navigator.language,
    screenSize: `${screen.width}x${screen.height}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    sessionId: sessionStorage.getItem('session_id') || Math.random().toString(36).substring(7)
  };
  
  // Store session ID if not exists
  if (!sessionStorage.getItem('session_id')) {
    sessionStorage.setItem('session_id', fingerprint.sessionId);
  }
  
  // Create a simple hash
  return btoa(JSON.stringify(fingerprint)).substring(0, 50);
}