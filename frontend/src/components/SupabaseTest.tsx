import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export function SupabaseTest() {
  const [testResults, setTestResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const createProfileForCurrentUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        alert('No authenticated user found');
        return;
      }

      console.log('Creating profile for current user:', user);

      const { data, error } = await supabase
        .from('profiles')
        .insert({
          user_id: user.id,
          username: user.user_metadata?.username || user.email?.split('@')[0] || 'Unknown',
          role: (user.user_metadata?.role as 'salesman' | 'evaluator') || 'salesman'
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating profile:', error);
        alert(`Error creating profile: ${error.message}`);
        return;
      }

      console.log('Profile created successfully:', data);
      alert('Profile created successfully! Try refreshing the page.');
      
    } catch (error) {
      console.error('Error creating profile for current user:', error);
      alert(`Error: ${error}`);
    }
  };

  const createTestUser = async () => {
    try {
      console.log('Creating test user...');
      
      // Create a test user without email confirmation
      const testEmail = `testuser${Date.now()}@test.com`;
      const testPassword = 'test123456';
      
      console.log('Test email:', testEmail);
      
      const { data, error } = await supabase.auth.signUp({
        email: testEmail,
        password: testPassword,
        options: {
          data: {
            username: 'Test User',
            role: 'salesman'
          }
        }
      });

      if (error) {
        console.error('Test user creation failed:', error);
        alert(`Test user creation failed: ${error.message}`);
        return;
      }

      console.log('Test user created:', data);
      alert(`Test user created with email: ${testEmail} and password: ${testPassword}`);
      
      // Don't try to sign in immediately - let user do it manually
      
    } catch (error) {
      console.error('Error creating test user:', error);
      alert(`Error creating test user: ${error}`);
    }
  };

  const runTests = async () => {
    setIsLoading(true);
    const results = [];

    try {
      // Test 1: Basic connection
      console.log('Testing Supabase connection...');
      results.push({ test: 'Connection', status: 'success', message: 'Supabase client initialized' });

      // Test 2: Auth status
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      if (authError) {
        results.push({ test: 'Auth Session', status: 'error', message: authError.message });
      } else {
        results.push({ 
          test: 'Auth Session', 
          status: 'success', 
          message: session ? `User: ${session.user.email}` : 'No active session' 
        });
      }

      // Test 3: Database access (profiles table)
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('count(*)')
        .limit(1);

      if (profilesError) {
        results.push({ test: 'Profiles Table', status: 'error', message: profilesError.message });
      } else {
        results.push({ test: 'Profiles Table', status: 'success', message: 'Accessible' });
      }

      // Test 4: Database access (applications table)
      const { data: apps, error: appsError } = await supabase
        .from('applications')
        .select('count(*)')
        .limit(1);

      if (appsError) {
        results.push({ test: 'Applications Table', status: 'error', message: appsError.message });
      } else {
        results.push({ test: 'Applications Table', status: 'success', message: 'Accessible' });
      }

    } catch (error) {
      results.push({ test: 'General', status: 'error', message: String(error) });
    }

    setTestResults(results);
    setIsLoading(false);
  };

  useEffect(() => {
    runTests();
  }, []);

  return (
    <Card className="p-6 m-4">
      <h3 className="text-lg font-semibold mb-4">Supabase Connection Test</h3>
      
      <div className="flex gap-2 mb-4 flex-wrap">
        <Button onClick={runTests} disabled={isLoading} size="sm">
          {isLoading ? 'Running Tests...' : 'Run Tests Again'}
        </Button>
        <Button onClick={createTestUser} variant="outline" size="sm">
          Create Test User
        </Button>
        <Button onClick={createProfileForCurrentUser} variant="secondary" size="sm">
          Create Profile for Current User
        </Button>
      </div>

      <div className="space-y-2">
        {testResults.map((result, index) => (
          <div 
            key={index} 
            className={`p-2 rounded border text-sm ${
              result.status === 'success' 
                ? 'bg-green-50 border-green-200 text-green-800' 
                : 'bg-red-50 border-red-200 text-red-800'
            }`}
          >
            <strong>{result.test}:</strong> {result.message}
          </div>
        ))}
      </div>
    </Card>
  );
}
