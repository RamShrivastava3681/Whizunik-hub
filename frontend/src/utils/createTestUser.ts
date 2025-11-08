import { supabase } from '@/integrations/supabase/client';

export const createTestUser = async (email: string, password: string, username: string = 'Test User', role: string = 'salesman') => {
  try {
    console.log('Creating test user...');
    
    // Create a test user
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
          role
        }
      }
    });

    if (error) {
      console.error('Error creating test user:', error);
      return { success: false, error: error.message };
    }

    console.log('Test user created:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Unexpected error:', error);
    return { success: false, error: 'Unexpected error occurred' };
  }
};

// You can call this from the browser console:
// import { createTestUser } from '@/utils/createTestUser';
// createTestUser('email@example.com', 'password123', 'Username', 'role');
