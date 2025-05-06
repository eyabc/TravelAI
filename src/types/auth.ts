export interface User {
  id: string;
  email: string;
  name: string;
  photoUrl?: string;
  preferences?: UserPreferences;
  travelHistory?: TravelHistory[];
  companions?: Companion[];
}

export interface UserPreferences {
  language: string;
  currency: string;
  notifications: boolean;
  darkMode: boolean;
  preferredTransportation: string[];
  dietaryRestrictions: string[];
}

export interface TravelHistory {
  id: string;
  destination: string;
  startDate: string;
  endDate: string;
  companions: Companion[];
  activities: Activity[];
}

export interface Companion {
  id: string;
  name: string;
  relationship: string;
  preferences?: UserPreferences;
}

export interface Activity {
  id: string;
  name: string;
  location: string;
  date: string;
  type: string;
  rating?: number;
  notes?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
} 