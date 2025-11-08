import { useEffect } from "react";
import Login from "./Login";
import Dashboard from "./Dashboard";
import { useJWTAuth } from "@/hooks/useJWTAuth";

const Index = () => {
  const { user, profile, loading } = useJWTAuth();

  // Debug logging
  useEffect(() => {
    console.log('🏠 Index Component - Auth State Update:');
    console.log('  - User:', user);
    console.log('  - Profile:', profile);
    console.log('  - Loading:', loading);
    console.log('  - Should show Dashboard:', !!(user && profile));
  }, [user, profile, loading]);

  // Show loading only during initial auth check
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-foreground mx-auto mb-2"></div>
          <div className="text-primary-foreground text-sm">Loading...</div>
        </div>
      </div>
    );
  }

  // Instant transition between login and dashboard
  if (!user || !profile) {
    return (
      <div className="page-transition">
        <Login />
      </div>
    );
  }

  return (
    <div className="page-transition">
      <Dashboard userRole={profile.role} userName={profile.username} />
    </div>
  );
};

export default Index;
