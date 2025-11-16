import React, { useState, useEffect } from 'react';
import { API_CONFIG } from '@/config/api';
import { Button } from '@/components/ui/button';

interface TestResult {
  endpoint: string;
  status: 'loading' | 'success' | 'error';
  message: string;
  response?: any;
  time?: number;
}

export function APIConnectionTester() {
  const [results, setResults] = useState<TestResult[]>([]);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    // Show API configuration on mount
    console.log('🔧 API Configuration:');
    console.log('  Base URL:', API_CONFIG.BASE_URL);
    console.log('  Server URL:', API_CONFIG.SERVER_URL);
    console.log('  Environment:', import.meta.env.MODE);
    console.log('  VITE_API_URL:', import.meta.env.VITE_API_URL);
    console.log('  Current hostname:', window.location.hostname);
    console.log('  Current protocol:', window.location.protocol);
  }, []);

  const testEndpoint = async (endpoint: string, description: string, options: RequestInit = {}): Promise<TestResult> => {
    const startTime = Date.now();
    const fullUrl = endpoint.startsWith('http') ? endpoint : `${API_CONFIG.SERVER_URL}${endpoint}`;
    
    try {
      console.log(`🔍 Testing: ${description} - ${fullUrl}`);
      
      const response = await fetch(fullUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Origin': window.location.origin,
          ...options.headers,
        },
        ...options,
      });

      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      let responseData;
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        responseData = await response.json();
      } else {
        responseData = await response.text();
      }

      console.log(`✅ ${description} - Status: ${response.status}, Time: ${responseTime}ms`);
      console.log('Response:', responseData);

      return {
        endpoint: description,
        status: response.ok ? 'success' : 'error',
        message: response.ok ? `Success (${response.status})` : `HTTP ${response.status}: ${response.statusText}`,
        response: responseData,
        time: responseTime,
      };
    } catch (error: any) {
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      console.error(`❌ ${description} - Error:`, error);
      
      return {
        endpoint: description,
        status: 'error',
        message: error.message || 'Network error',
        time: responseTime,
      };
    }
  };

  const runAllTests = async () => {
    setTesting(true);
    setResults([]);

    const tests = [
      { endpoint: '/health', description: 'Backend Health Check' },
      { endpoint: '/api/health', description: 'API Health Check' },
      { 
        endpoint: '/api/auth/login', 
        description: 'Login Endpoint (POST test)',
        options: {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'test@test.com', password: 'test123' })
        }
      },
    ];

    const testResults: TestResult[] = [];

    for (const test of tests) {
      const result = await testEndpoint(test.endpoint, test.description, test.options || {});
      testResults.push(result);
      setResults([...testResults]); // Update UI after each test
    }

    setTesting(false);
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'success': return 'text-green-600';
      case 'error': return 'text-red-600';
      case 'loading': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'loading': return '🔄';
      default: return '⏳';
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">API Connection Tester</h2>
        <p className="text-gray-600 mb-4">Test your WhizUnik Portal API configuration and connectivity</p>
        
        <div className="bg-gray-50 p-4 rounded-lg mb-4">
          <h3 className="font-semibold text-gray-900 mb-2">Configuration</h3>
          <div className="text-sm text-gray-700 space-y-1">
            <div><strong>Base URL:</strong> {API_CONFIG.BASE_URL}</div>
            <div><strong>Server URL:</strong> {API_CONFIG.SERVER_URL}</div>
            <div><strong>Environment:</strong> {import.meta.env.MODE}</div>
            <div><strong>Current Origin:</strong> {window.location.origin}</div>
            <div><strong>VITE_API_URL:</strong> {import.meta.env.VITE_API_URL || 'Not set'}</div>
          </div>
        </div>
        
        <Button 
          onClick={runAllTests} 
          disabled={testing}
          className="mb-4"
        >
          {testing ? '🔄 Testing...' : '🚀 Run API Tests'}
        </Button>
      </div>

      <div className="space-y-4">
        {results.map((result, index) => (
          <div key={index} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className={`font-medium ${getStatusColor(result.status)}`}>
                {getStatusIcon(result.status)} {result.endpoint}
              </h3>
              {result.time && (
                <span className="text-sm text-gray-500">{result.time}ms</span>
              )}
            </div>
            
            <div className="text-sm">
              <div className={`mb-2 ${getStatusColor(result.status)}`}>
                {result.message}
              </div>
              
              {result.response && (
                <details className="bg-gray-50 p-3 rounded">
                  <summary className="cursor-pointer font-medium text-gray-700 mb-2">
                    Response Data
                  </summary>
                  <pre className="text-xs text-gray-600 overflow-x-auto">
                    {typeof result.response === 'string' 
                      ? result.response 
                      : JSON.stringify(result.response, null, 2)
                    }
                  </pre>
                </details>
              )}
            </div>
          </div>
        ))}
      </div>

      {results.length > 0 && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">Troubleshooting Tips</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• If health checks fail: Ensure your backend server is running on the configured port</li>
            <li>• If you get CORS errors: Check CORS_ORIGIN in your backend .env.production file</li>
            <li>• If login returns 500 error: Check your database connection</li>
            <li>• If requests fail entirely: Verify your reverse proxy or port configuration</li>
          </ul>
        </div>
      )}
    </div>
  );
}