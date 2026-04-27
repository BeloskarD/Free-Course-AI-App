const isLocalHost = (hostname) => hostname === 'localhost' || hostname === '127.0.0.1';

export const getPublicAppUrl = () => {
  if (process.env.NEXT_PUBLIC_BASE_URL) {
    return process.env.NEXT_PUBLIC_BASE_URL.replace(/\/$/, '');
  }

  if (typeof window !== 'undefined') {
    return window.location.origin;
  }

  if (process.env.NODE_ENV !== 'production') {
    return 'http://localhost:3000';
  }

  // In production, throw a clear error if missing
  throw new Error('Missing NEXT_PUBLIC_BASE_URL for production runtime. Please set this environment variable.');
};

export const getApiBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_API_BASE_URL) {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL.replace(/\/$/, '');
    return baseUrl.endsWith('/api') ? baseUrl : `${baseUrl}/api`;
  }

  // Dynamically resolve backend host for local development/network access
  if (typeof window !== 'undefined') {
    // If accessing via IP or local hostname, use the same host for backend
    return `http://${window.location.hostname}:5000/api`;
  }

  if (process.env.NODE_ENV !== 'production') {
    return 'http://127.0.0.1:5000/api';
  }

  // In production, throw a clear error if missing
  throw new Error('Missing NEXT_PUBLIC_API_BASE_URL for production runtime. Please set this environment variable.');
};

export const getBackendOrigin = () => getApiBaseUrl().replace(/\/api$/, '');

export const getServerApiBaseUrl = () => {
  if (process.env.API_URL) {
    return process.env.API_URL.replace(/\/$/, '');
  }

  return getApiBaseUrl();
};
