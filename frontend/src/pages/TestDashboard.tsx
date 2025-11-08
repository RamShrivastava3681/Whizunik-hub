import React from 'react';

// Simple test dashboard to isolate the issue
const TestDashboard = () => {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-4">
        Test Dashboard - Login Successful!
      </h1>
      <div className="bg-white p-6 rounded-lg shadow">
        <p className="text-gray-600">
          If you can see this page, the authentication is working correctly.
          The issue might be with the main Dashboard component.
        </p>
        <div className="mt-4 space-y-2">
          <p><strong>Status:</strong> ✅ Authentication Working</p>
          <p><strong>Location:</strong> You are now logged in</p>
          <p><strong>Next:</strong> Dashboard should load automatically</p>
        </div>
      </div>
    </div>
  );
};

export default TestDashboard;
