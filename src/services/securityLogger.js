// Log security events (you can send these to Supabase)
export async function logSecurityEvent(eventType, details) {
  try {
    const logEntry = {
      event_type: eventType,
      details: JSON.stringify(details),
      user_agent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      url: window.location.href
    };
    
    // You can send this to a logging service or Supabase table
    console.warn('Security Event:', logEntry);
    
    // Optional: Send to Supabase for tracking
    // await supabase.from('security_logs').insert([logEntry]);
  } catch (error) {
    console.error('Failed to log security event:', error);
  }
}