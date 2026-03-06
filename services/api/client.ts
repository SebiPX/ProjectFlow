import { Session } from '../../types/auth';

const API_URL = import.meta.env.VITE_API_URL;

export async function fetchApi(endpoint: string, options: RequestInit = {}) {
  const sessionStr = localStorage.getItem('agency_session');
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };

  if (sessionStr) {
    try {
      const session = JSON.parse(sessionStr) as Session;
      headers['Authorization'] = `Bearer ${session.access_token}`;
    } catch (e) {
      console.error('Failed to parse session token', e);
    }
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMessage = `API Error: ${response.statusText}`;
    try {
      const errorData = await response.json();
      if (errorData.error || errorData.message) {
        errorMessage = errorData.error || errorData.message;
      }
    } catch (e) {
      // Ignore
    }
    throw new Error(errorMessage);
  }

  // If response is a 204 No Content, return null
  if (response.status === 204) return null;

  return response.json();
}
