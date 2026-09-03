import { getAuth } from '@react-native-firebase/auth';

export const API_BASE_URL = 'https://securi-fi-mobile.onrender.com';

export async function apiFetch(path: string, options: RequestInit = {}) {
  const user = getAuth().currentUser;
  if (!user) {
    throw new Error('Not signed in');
  }

  const token = await user.getIdToken();

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  return response;
}