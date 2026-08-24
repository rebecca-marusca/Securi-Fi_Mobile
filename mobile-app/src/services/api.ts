import { getAuth } from '@react-native-firebase/auth';

// Swap this for your laptop's actual LAN IP. Only good for local testing —
// this whole approach gets replaced once the backend is actually deployed
// somewhere reachable from anywhere (not just your home WiFi).
export const API_BASE_URL = 'http://172.20.10.2:8000';

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