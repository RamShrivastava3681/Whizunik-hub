import { useState, useEffect } from 'react';
import { authService, User } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';

export interface UserProfile {
  id: string;
  user_id: string;
  username: string;
  role: 'salesman' | 'evaluator' | 'admin';
  created_at: string;
  updated_at: string;
}

export function useJWTAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      // Check for existing token first for instant response
      const existingToken = authService.getToken();
      
      if (!existingToken) {
        // No token, immediately set not authenticated
        setUser(null);
        setProfile(null);
        setLoading(false);
        console.log('🚫 JWT Auth: No token found - immediate logout');
        return;
      }
      
      setLoading(true);
      
      // Check for current user with existing token
      const currentUser = await authService.getCurrentUser();
      
      if (currentUser) {
        setUser(currentUser);
        
        // Create profile from user data
        const userProfile: UserProfile = {
          id: currentUser.id,
          user_id: currentUser.id,
          username: currentUser.username,
          role: currentUser.role,
          created_at: currentUser.created_at || new Date().toISOString(),
          updated_at: currentUser.created_at || new Date().toISOString(),
        };
        
        setProfile(userProfile);
        console.log('✅ JWT Auth: User authenticated', currentUser);
      } else {
        setUser(null);
        setProfile(null);
        console.log('🚫 JWT Auth: No authenticated user');
      }
    } catch (error) {
      console.error('❌ JWT Auth: Error checking auth status:', error);
      setUser(null);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      console.log('🔐 JWT Auth: Signing in with:', email);
      setLoading(true);
      
      const result = await authService.signIn(email, password);
      console.log('🔐 JWT Auth: Auth service returned:', result);
      
      const { user, token } = result;
      
      // Create profile from user data
      const userProfile: UserProfile = {
        id: user.id,
        user_id: user.id,
        username: user.username,
        role: user.role,
        created_at: user.created_at || new Date().toISOString(),
        updated_at: user.created_at || new Date().toISOString(),
      };
      
      // Set user and profile state immediately for instant transition
      setUser(user);
      setProfile(userProfile);
      setLoading(false); // Immediately set loading to false for instant transition
      
      console.log('✅ JWT Auth: Sign in successful, user state updated');
      console.log('✅ JWT Auth: User:', user);
      console.log('✅ JWT Auth: Profile:', userProfile);
      
      // Show success toast
      toast({
        title: "Login Successful",
        description: `Welcome back, ${user.username}!`,
      });
      
      return { error: null };
      
    } catch (error: any) {
      console.error('❌ JWT Auth: Sign in error:', error);
      console.error('❌ JWT Auth: Full error object:', error);
      
      toast({
        title: "Login Failed",
        description: error.message || "Invalid credentials",
        variant: "destructive",
      });
      
      setLoading(false);
      setUser(null);
      setProfile(null);
      return { error };
    }
  };

  const signUp = async (email: string, password: string, username: string, role: 'salesman' | 'evaluator') => {
    try {
      setLoading(true);
      console.log('📝 JWT Auth: Signing up...');
      
      const result = await authService.signUp(email, password, username, role);
      const { user, token } = result;
      
      if (token) {
        // User was immediately approved (shouldn't happen with new system)
        setUser(user);
        
        // Create profile from user data
        const userProfile: UserProfile = {
          id: user.id,
          user_id: user.id,
          username: user.username,
          role: user.role,
          created_at: user.created_at || new Date().toISOString(),
          updated_at: user.created_at || new Date().toISOString(),
        };
        
        setProfile(userProfile);
        
        toast({
          title: "Account Created",
          description: `Welcome to Whizunik, ${user.username}!`,
        });
      } else {
        // User is pending approval
        setUser(null);
        setProfile(null);
        
        toast({
          title: "Registration Submitted",
          description: "Your account is pending admin approval. You will be notified once approved.",
          duration: 6000,
        });
      }
      
      console.log('✅ JWT Auth: Sign up successful', user);
      return { error: null };
      
    } catch (error: any) {
      console.error('❌ JWT Auth: Sign up error:', error);
      
      toast({
        title: "Signup Failed",
        description: error.message || "Failed to create account",
        variant: "destructive",
      });
      
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      console.log('🚪 JWT Auth: Signing out...');
      
      // Clear user state immediately for instant transition
      setUser(null);
      setProfile(null);
      
      // Clear token from storage
      await authService.signOut();
      
      toast({
        title: "Logged Out",
        description: "See you next time!",
      });
      
      console.log('✅ JWT Auth: Sign out successful');
      
    } catch (error) {
      console.error('❌ JWT Auth: Sign out error:', error);
      
      // Still clear state even if there's an error
      setUser(null);
      setProfile(null);
      
      toast({
        title: "Logout Failed",
        description: "There was an issue logging out",
        variant: "destructive",
      });
    }
  };

  return {
    user,
    session: user ? { user } : null, // Compatibility with existing code
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    isAuthenticated: authService.isAuthenticated(),
    token: authService.getToken(),
  };
}
