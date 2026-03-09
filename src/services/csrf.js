// Simple CSRF token generator
let csrfToken = null;

export function generateCSRFToken() {
  if (!csrfToken) {
    csrfToken = Math.random().toString(36).substring(2) + 
               Math.random().toString(36).substring(2);
    // Store in session
    sessionStorage.setItem('csrf_token', csrfToken);
  }
  return csrfToken;
}

export function validateCSRFToken(token) {
  const storedToken = sessionStorage.getItem('csrf_token');
  return storedToken && token === storedToken;
}

// Add token to forms
export function getCSRFField() {
  const token = generateCSRFToken();
  return `<input type="hidden" name="_csrf" value="${token}">`;
}