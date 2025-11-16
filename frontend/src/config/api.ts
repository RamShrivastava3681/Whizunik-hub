// API Configuration
const getApiUrl = () => {
  // First check for environment variable
  if (import.meta.env.VITE_API_URL) {
    const url = import.meta.env.VITE_API_URL;
    const baseUrl = url.replace('/api', '');
    console.log('🔧 API Config: Using environment URL:', baseUrl);
    return baseUrl;
  }
  
  // Check if we're running on whizunikhub.com or portal.whizunikhub.com
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    console.log('🔧 API Config: Current hostname:', hostname);
    
    if (hostname === 'whizunikhub.com' || hostname === 'portal.whizunikhub.com') {
      console.log('🔧 API Config: Using production domain:', 'https://portal.whizunikhub.com');
      return 'https://portal.whizunikhub.com';
    }
  }
  
  // Default to localhost for development
  console.log('🔧 API Config: Using localhost development server');
  return 'http://localhost:5003';
};

// Initialize API configuration
const apiUrl = getApiUrl();
const baseUrl = `${apiUrl}/api`;

console.log('🔧 API Config initialized:');
console.log('  - Server URL:', apiUrl);
console.log('  - Base API URL:', baseUrl);
console.log('  - Environment:', import.meta.env.MODE);

export const API_CONFIG = {
  BASE_URL: baseUrl,
  SERVER_URL: apiUrl,
  TIMEOUT: 10000,
};

// API Endpoints
export const API_ENDPOINTS = {
  // Auth
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  ME: '/auth/me',
  
  // Applications
  APPLICATIONS: '/applications',
  APPLICATION_BY_TOKEN: (token: string) => `/applications/token/${token}`,
  APPLICATION_BY_ID: (id: string) => `/applications/${id}`,
  APPLICATION_DOCUMENTS: (id: string) => `/applications/${id}/documents`,
  
  // Potential Clients
  POTENTIAL_CLIENTS: '/potential-clients',
  POTENTIAL_CLIENT_BY_ID: (id: string) => `/potential-clients/${id}`,
  
  // Evaluations
  EVALUATIONS: '/evaluations',
  EVALUATIONS_PENDING: '/evaluations/pending-applications',
  EVALUATION_BY_APPLICATION: (applicationId: string) => `/evaluations/application/${applicationId}`,
};
