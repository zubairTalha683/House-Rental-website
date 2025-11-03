import { projectId, publicAnonKey } from '../utils/supabase/info';

const API_BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-5dcf8578`;

// Store access token in memory
let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
  if (token) {
    localStorage.setItem('rental_access_token', token);
  } else {
    localStorage.removeItem('rental_access_token');
  }
}

export function getAccessToken(): string | null {
  if (!accessToken) {
    accessToken = localStorage.getItem('rental_access_token');
  }
  return accessToken;
}

async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  const token = getAccessToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token || publicAnonKey}`,
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    console.error(`API Error on ${endpoint}:`, data);
    throw new Error(data.error || 'API request failed');
  }

  return data;
}

export const api = {
  // Auth APIs
  signup: async (userData: {
    username: string;
    location: string;
    phoneNumber: string;
    nidNumber: string;
    userType: string;
    password: string;
  }) => {
    return fetchAPI('/signup', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  signin: async (username: string, password: string) => {
    const data = await fetchAPI('/signin', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    
    if (data.accessToken) {
      setAccessToken(data.accessToken);
    }
    
    return data;
  },

  signout: async () => {
    const data = await fetchAPI('/signout', {
      method: 'POST',
    });
    setAccessToken(null);
    return data;
  },

  // User APIs
  getUser: async () => {
    return fetchAPI('/user');
  },

  updateProfile: async (profileData: {
    location?: string;
    phoneNumber?: string;
    nidNumber?: string;
    userType?: string;
  }) => {
    return fetchAPI('/user/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  },

  uploadImage: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    
    const token = getAccessToken();
    const response = await fetch(`${API_BASE_URL}/upload-image`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token || publicAnonKey}`,
      },
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Upload image error:', data);
      throw new Error(data.error || 'Image upload failed');
    }

    return data;
  },

  updateProfilePicture: async (imageUrl: string) => {
    return fetchAPI('/user/profile-picture', {
      method: 'PUT',
      body: JSON.stringify({ imageUrl }),
    });
  },

  // Property APIs
  createProperty: async (propertyData: {
    location: string;
    monthlyPriceRange?: string;
    phoneNumber: string;
    roomDetails: string;
    propertyType: string;
    images?: string[];
    temporaryRent?: boolean;
    temporaryRentDays?: number;
  }) => {
    return fetchAPI('/property', {
      method: 'POST',
      body: JSON.stringify(propertyData),
    });
  },

  getProperties: async (filters?: {
    location?: string;
    rentType?: 'temporary' | 'monthly';
    propertyType?: 'bachelor' | 'family';
  }) => {
    const params = new URLSearchParams();
    if (filters?.location) params.append('location', filters.location);
    if (filters?.rentType) params.append('rentType', filters.rentType);
    if (filters?.propertyType) params.append('propertyType', filters.propertyType);
    
    const query = params.toString();
    return fetchAPI(`/properties${query ? `?${query}` : ''}`);
  },

  getUserProperties: async () => {
    return fetchAPI('/user-properties');
  },
};
