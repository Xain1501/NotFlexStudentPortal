/**
 * Shared API Client - Already exists in your structure
 * Used by all role-specific API files
 */

const API_BASE = "http://localhost:5000/api";

// Your existing fetchJson function - keep this pattern
export async function fetchJson(roleBase, endpoint, options = {}) {
  const url = `${API_BASE}${roleBase}${endpoint}`;
  
  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include',
  };

  // Add auth token if available (matches your pattern)
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  console.log(`🔄 API Call: ${config.method || 'GET'} ${url}`);

  try {
    const response = await fetch(url, config);
    
    console.log(`📡 Response status: ${response.status}`);
    
    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch (e) {
        errorMessage = response.statusText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    return await response.json();
  } catch (error) {
    console.error('❌ API call failed:', error);
    throw error;
  }
}

// Add authentication functions to your existing client
export async function login(credentials) {
  const { username, password } = credentials || {};
  
  if (!username || !password) {
    throw new Error('Username and password are required');
  }

  console.log('🔐 Attempting login with:', { username });

  // Use the same pattern but for auth endpoints
  const url = `${API_BASE}/auth/login`;
  const config = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, password }),
    credentials: 'include',
  };

  const response = await fetch(url, config);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP ${response.status}`);
  }

  const data = await response.json();

  if (data.success && data.data?.token) {
    localStorage.setItem('auth_token', data.data.token);
    localStorage.setItem('user_role', data.data.user.role);
    localStorage.setItem('user_id', data.data.user.user_id);
    localStorage.setItem('username', data.data.user.username);
  }

  return data;
}

export async function logout() {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('user_role');
  localStorage.removeItem('user_id');
  localStorage.removeItem('username');
  
  const url = `${API_BASE}/auth/logout`;
  const response = await fetch(url, {
    method: 'POST',
    credentials: 'include',
  });
  
  return response.ok;
}

export function getCurrentUser() {
  return {
    token: localStorage.getItem('auth_token'),
    role: localStorage.getItem('user_role'),
    userId: localStorage.getItem('user_id'),
    username: localStorage.getItem('username')
  };
}

export function isAuthenticated() {
  return !!localStorage.getItem('auth_token');
}

export async function testConnection() {
  const url = `${API_BASE}/health`;
  const response = await fetch(url);
  return await response.json();
}