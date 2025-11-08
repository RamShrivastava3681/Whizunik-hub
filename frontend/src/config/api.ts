// API Configuration
const getApiUrl = () => {
  // Check if we're running on whizunikhub.com
  if (typeof window !== 'undefined' && window.location.hostname === 'whizunikhub.com') {
    return 'https://whizunikhub.com:5000';
  }
  
  // Check for environment variable (remove /api if present since we'll add it below)
  if (import.meta.env.VITE_API_URL) {
    const url = import.meta.env.VITE_API_URL;
    return url.replace('/api', '');
  }
  
  // Default to localhost
  return 'http://localhost:5000';
};

export const API_CONFIG = {
  BASE_URL: `${getApiUrl()}/api`,
  SERVER_URL: getApiUrl(),
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
