import { supabase } from './supabaseClient'

export async function checkNameInDatabase(lastName, firstName, birthday, middleName = '', extension = '') {
  console.log('Searching for:', { lastName, firstName, birthday, middleName, extension });
  
  try {
    let query = supabase
      .from('names')
      .select('*')
      .eq('last_name', lastName)
      .eq('first_name', firstName)
      .eq('birthday', birthday)

    // Handle middle name - more flexible matching
    if (middleName && middleName.trim()) {
      // Try exact match first
      query = query.eq('middle_name', middleName)
    } else {
      query = query.is('middle_name', null)
    }

    // Handle extension - more flexible matching
    if (extension && extension.trim()) {
      // Convert common variations
      const ext = extension.toUpperCase().replace('.', '')
      // This will match JR, JR., Jr., etc.
      query = query.or(`extension.eq.${extension},extension.eq.${extension.toUpperCase()},extension.eq.${ext},extension.eq.${ext}.`)
    } else {
      query = query.is('extension', null)
    }

    const { data, error } = await query.maybeSingle()
    
    console.log('Query result:', { data, error });

    if (error) throw error
    
    // If no exact match found, try a more flexible search
    if (!data && middleName) {
      console.log('No exact match, trying flexible search...');
      
      // Remove the middle name constraint and try again
      let flexibleQuery = supabase
        .from('names')
        .select('*')
        .eq('last_name', lastName)
        .eq('first_name', firstName)
        .eq('birthday', birthday)
      
      const { data: flexibleData, error: flexibleError } = await flexibleQuery.maybeSingle()
      
      if (!flexibleError && flexibleData) {
        console.log('Found with flexible search:', flexibleData);
        return { exists: true, data: flexibleData }
      }
    }
    
    return { exists: !!data, data: data || null }

  } catch (error) {
    console.error('Error in checkNameInDatabase:', error)
    return { exists: false, error: error.message }
  }
}