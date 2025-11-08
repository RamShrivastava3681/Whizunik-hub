import React from "react";
import { Navigate } from "react-router-dom";
import { useJWTAuth } from "@/hooks/useJWTAuth";
import Login from "./Login";
import Dashboard from "./Dashboard";

const Index = () => {
  const { user, profile, loading } = useJWTAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <img 
              src="/logo-vertical-light.svg" 
              alt="Whizunik Logo" 
              className="w-8 h-8"
            />
            <div className="text-gray-900 mb-4">Loading...</div>
          </div>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    return <Login />;
  }

  return <Dashboard userRole={profile.role} userName={profile.username} />;
};

export default Index;
