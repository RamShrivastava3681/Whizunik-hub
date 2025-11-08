import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface UserProfile {
  id: string;
  user_id: string;
  username: string;
  role: 'salesman' | 'evaluator';
  created_at: string;
  updated_at: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    let mounted = true;

    const getSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!mounted) return;

        if (session?.user) {
          setSession(session);
          setUser(session.user);
          
          // Create a simple profile immediately without database dependency
          const simpleProfile: UserProfile = {
            id: session.user.id,
            user_id: session.user.id,
            username: session.user.user_metadata?.username || session.user.email?.split('@')[0] || 'User',
            role: (session.user.user_metadata?.role as 'salesman' | 'evaluator') || 'salesman',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          
          setProfile(simpleProfile);
          console.log('✅ Simple profile created:', simpleProfile);
        } else {
          setSession(null);
          setUser(null);
          setProfile(null);
        }
      } catch (error) {
        console.error('Session error:', error);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      
      console.log('Auth event:', event);
      
      if (session?.user) {
        setSession(session);
        setUser(session.user);
        
        // Create simple profile immediately
        const simpleProfile: UserProfile = {
          id: session.user.id,
          user_id: session.user.id,
          username: session.user.user_metadata?.username || session.user.email?.split('@')[0] || 'User',
          role: (session.user.user_metadata?.role as 'salesman' | 'evaluator') || 'salesman',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        setProfile(simpleProfile);
        console.log('✅ Auth profile created:', simpleProfile);
      } else {
        setSession(null);
        setUser(null);
        setProfile(null);
      }
      
      setLoading(false);
    });

    getSession();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      console.log('Signing in...');
      
      const { error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        toast({
          title: "Login Failed",
          description: error.message,
          variant: "destructive",
        });
        setLoading(false);
        return { error };
      }

      toast({
        title: "Login Successful",
        description: "Welcome back!",
      });

      return { error: null };
    } catch (error) {
      console.error('Sign in error:', error);
      setLoading(false);
      return { error };
    }
  };

  const signUp = async (email: string, password: string, username: string, role: 'salesman' | 'evaluator') => {
    try {
      setLoading(true);
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { username, role }
        }
      });

      if (error) {
        toast({
          title: "Signup Failed",
          description: error.message,
          variant: "destructive",
        });
        setLoading(false);
        return { error };
      }
      
      toast({
        title: "Account Created",
        description: "Please check your email to verify your account.",
      });

      setLoading(false);
      return { error: null };
    } catch (error) {
      console.error('Sign up error:', error);
      setLoading(false);
      return { error };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        toast({
          title: "Logout Failed",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Logged Out",
        description: "See you next time!",
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return {
    user,
    session,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
  };
}