import { supabase } from './supabaseClient';
import { checkRateLimit, getUserFingerprint } from './rateLimiter';
import { sanitizeInput, isValidName, isValidDate, isSuspiciousInput } from './validation';

export async function checkNameInDatabase(lastName, firstName, birthday, middleName = '', extension = '') {
  try {
    // Get user fingerprint for rate limiting
    const userFingerprint = getUserFingerprint();
    
    // Check rate limit
    if (!checkRateLimit(userFingerprint)) {
      return { 
        exists: false, 
        error: 'Too many requests. Please wait a minute and try again.' 
      };
    }
    
    // Sanitize all inputs
    const sanitizedLastName = sanitizeInput(lastName);
    const sanitizedFirstName = sanitizeInput(firstName);
    const sanitizedMiddleName = sanitizeInput(middleName);
    const sanitizedExtension = sanitizeInput(extension);
    
    // Check for suspicious patterns
    if (isSuspiciousInput(sanitizedLastName) || 
        isSuspiciousInput(sanitizedFirstName) ||
        isSuspiciousInput(sanitizedMiddleName)) {
      return { exists: false, error: 'Invalid input detected' };
    }
    
    // Validate name format
    if (!isValidName(sanitizedLastName) || !isValidName(sanitizedFirstName)) {
      return { exists: false, error: 'Name contains invalid characters' };
    }
    
    if (sanitizedMiddleName && !isValidName(sanitizedMiddleName)) {
      return { exists: false, error: 'Middle name contains invalid characters' };
    }
    
    // Validate date format (birthday comes as YYYY-MM-DD string)
    const [year, month, day] = birthday.split('-');
    if (!isValidDate(month, day, year)) {
      return { exists: false, error: 'Invalid date' };
    }
    
    // Build query with sanitized inputs
    let query = supabase
      .from('names')
      .select('*')
      .eq('last_name', sanitizedLastName)
      .eq('first_name', sanitizedFirstName)
      .eq('birthday', birthday) // birthday is already validated

    // Handle middle name
    if (sanitizedMiddleName) {
      query = query.eq('middle_name', sanitizedMiddleName);
    } else {
      query = query.is('middle_name', null);
    }

    // Handle extension
    if (sanitizedExtension) {
      query = query.eq('extension', sanitizedExtension);
    } else {
      query = query.is('extension', null);
    }

    const { data, error } = await query.maybeSingle();
    
    if (error) throw error;
    
    return { exists: !!data, data: data || null };

  } catch (error) {
    console.error('Error in checkNameInDatabase:', error);
    return { exists: false, error: 'An error occurred. Please try again.' };
  }
}