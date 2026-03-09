// Strict input validation
export function sanitizeInput(input) {
  if (!input) return "";

  // Convert to string and trim
  let sanitized = String(input).trim();

  // Remove any potentially dangerous characters
  sanitized = sanitized.replace(/[<>'";()]/g, "");

  // Limit length (prevent DOS attacks)
  sanitized = sanitized.substring(0, 100);

  return sanitized;
}

// Validate name format (allow letters, spaces, hyphens, apostrophes, ñ)
export function isValidName(name) {
  if (!name || name.length === 0) return false;
  return /^[A-Za-z\s\-'ñÑ]+$/.test(name);
}

// Validate date
export function isValidDate(month, day, year) {
  const monthNum = parseInt(month);
  const dayNum = parseInt(day);
  const yearNum = parseInt(year);

  // Basic range checks
  if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) return false;
  if (isNaN(dayNum) || dayNum < 1 || dayNum > 31) return false;
  if (isNaN(yearNum) || yearNum < 1900 || yearNum > new Date().getFullYear())
    return false;

  // Check if it's a real date (e.g., not Feb 30)
  const date = new Date(yearNum, monthNum - 1, dayNum);
  return date.getDate() === dayNum;
}

// Check for suspicious patterns (SQL injection, XSS attempts)
export function isSuspiciousInput(input) {
  if (!input) return false;

  const suspicious = [
    "--",
    ";",
    "/*",
    "*/",
    "@@",
    "char(",
    "nchar(",
    "varchar(",
    "alter",
    "create",
    "delete",
    "drop",
    "exec",
    "insert",
    "select",
    "union",
    "update",
    "<script",
    "javascript:",
    "onerror=",
    "onload=",
  ];

  const lowerInput = input.toLowerCase();
  return suspicious.some((pattern) => lowerInput.includes(pattern));
}
