import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function AuthTester() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [results, setResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const log = (message: string) => {
    console.log(message);
    setResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testConnection = async () => {
    try {
      log('Testing Supabase connection...');
      const { data, error } = await supabase.from('profiles').select('count').limit(1);
      
      if (error) {
        log(`Connection error: ${error.message}`);
      } else {
        log('Connection successful!');
      }
    } catch (err) {
      log(`Connection failed: ${err}`);
    }
  };

  const createTestAccount = async () => {
    setLoading(true);
    try {
      log('Creating test account...');
      
      // First, try to sign up
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
            role: 'salesman'
          }
        }
      });

      if (signUpError) {
        log(`Signup error: ${signUpError.message}`);
        
        // If user already exists, try to sign in
        if (signUpError.message.includes('already registered')) {
          log('User exists, trying to sign in...');
          await signInTestAccount();
          return;
        }
      } else {
        log(`Signup successful! User ID: ${signUpData.user?.id}`);
        
        // If user is immediately confirmed, sign them in
        if (signUpData.user?.email_confirmed_at) {
          log('Email already confirmed, signing in...');
          await signInTestAccount();
        } else {
          log('Check your email for confirmation link, or try signing in if already confirmed');
        }
      }
    } catch (err) {
      log(`Unexpected error: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const signInTestAccount = async () => {
    setLoading(true);
    try {
      log('Signing in...');
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        log(`Sign in error: ${error.message}`);
        return;
      }

      log(`Sign in successful! User: ${data.user?.email}`);
      
      // Check if profile exists
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', data.user.id)
        .single();

      if (profileError) {
        log(`Profile error: ${profileError.message}`);
        
        if (profileError.code === 'PGRST116') {
          log('Profile not found, creating...');
          await createProfileManually(data.user.id);
        }
      } else {
        log(`Profile found: ${JSON.stringify(profile)}`);
        log('🎉 LOGIN SUCCESSFUL! You can now use the app!');
      }
    } catch (err) {
      log(`Unexpected sign in error: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const createProfileManually = async (userId: string) => {
    try {
      log('Creating profile manually...');
      
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          user_id: userId,
          username: username,
          role: 'salesman'
        })
        .select()
        .single();

      if (error) {
        log(`Profile creation error: ${error.message}`);
        log(`Error code: ${error.code}`);
        log(`Error details: ${JSON.stringify(error)}`);
        
        // If it's a unique constraint violation, the profile might already exist
        if (error.code === '23505') {
          log('Profile already exists, trying to fetch it...');
          const { data: existingProfile, error: fetchError } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', userId)
            .single();
          
          if (fetchError) {
            log(`Still cannot fetch profile: ${fetchError.message}`);
          } else {
            log(`Found existing profile: ${JSON.stringify(existingProfile)}`);
            log('🎉 PROFILE FOUND! You can now use the app!');
          }
        }
      } else {
        log(`Profile created successfully: ${JSON.stringify(data)}`);
        log('🎉 PROFILE CREATED! You can now use the app!');
      }
    } catch (err) {
      log(`Unexpected profile creation error: ${err}`);
    }
  };

  const testProfileCreation = async () => {
    try {
      log('Testing profile creation without authentication...');
      
      // First check if we can access the profiles table
      const { data, error } = await supabase
        .from('profiles')
        .select('count')
        .limit(1);
      
      if (error) {
        log(`Cannot access profiles table: ${error.message}`);
        log(`Error code: ${error.code}`);
        log('This suggests RLS (Row Level Security) is blocking access');
        log('You need to be authenticated to create profiles');
      } else {
        log('Profiles table is accessible');
      }
    } catch (err) {
      log(`Profile table test error: ${err}`);
    }
  };

  const checkCurrentUser = async () => {
    try {
      log('Checking current user...');
      
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        log('No user is currently signed in');
        return;
      }

      log(`Current user: ${user.email} (ID: ${user.id})`);
      
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        log(`Profile check error: ${error.message}`);
      } else {
        log(`Profile: ${JSON.stringify(profile)}`);
        log('✅ User is properly authenticated with profile!');
      }
    } catch (err) {
      log(`Error checking user: ${err}`);
    }
  };

  const signOut = async () => {
    try {
      log('Signing out...');
      await supabase.auth.signOut();
      log('Signed out successfully');
    } catch (err) {
      log(`Sign out error: ${err}`);
    }
  };

  const clearResults = () => setResults([]);

  return (
    <Card className="p-6 max-w-md mx-auto mt-4">
      <h3 className="text-lg font-semibold mb-4">Authentication Tester</h3>
      
      <div className="space-y-4 mb-4">
        <div>
          <Label htmlFor="email">Test Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        
        <div>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        
        <div>
          <Label htmlFor="username">Username</Label>
          <Input
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-4">
        <Button onClick={testConnection} variant="outline" size="sm">
          Test Connection
        </Button>
        <Button onClick={checkCurrentUser} variant="outline" size="sm">
          Check User
        </Button>
        <Button 
          onClick={createTestAccount} 
          variant="financial" 
          size="sm"
          disabled={loading}
        >
          {loading ? 'Creating...' : 'Create Account'}
        </Button>
        <Button onClick={signInTestAccount} variant="secondary" size="sm">
          Sign In
        </Button>
        <Button onClick={testProfileCreation} variant="outline" size="sm">
          Test Profiles
        </Button>
        <Button onClick={signOut} variant="destructive" size="sm">
          Sign Out
        </Button>
        <Button onClick={clearResults} variant="ghost" size="sm" className="col-span-2">
          Clear Log
        </Button>
      </div>

      <div className="bg-gray-100 p-3 rounded text-xs max-h-40 overflow-y-auto">
        {results.length === 0 ? (
          <p className="text-gray-500">Click buttons above to test authentication...</p>
        ) : (
          results.map((result, i) => (
            <div key={i} className="mb-1 font-mono text-xs">
              {result}
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
