// User type
export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

// Auth State type
export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

// Root State type
export interface RootState {
  auth: AuthState;
}