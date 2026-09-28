import { AuthUser } from './auth.actions';

export interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isLoggedIn: boolean;
  isSubmitting: boolean;
  error: string | null;
  registrationSuccess: boolean;
  registeredEmail: string | null;
  emailVerified: boolean;
  verifyEmailError: string | null;
}

const getStoredToken = (): string | null => {
  try {
    return localStorage.getItem('token');
  } catch {
    return null;
  }
};

const getStoredUser = (): AuthUser | null => {
  try {
    const raw = localStorage.getItem('user');
    if (raw) return JSON.parse(raw);
    const token = getStoredToken();
    if (token) return { id: 'user_session', email: 'user@naptor.io', name: 'User', role: 'user' };
    return null;
  } catch {
    return null;
  }
};

const token = getStoredToken();

export const initialAuthState: AuthState = {
  user: getStoredUser(),
  token: token,
  isLoggedIn: !!token,
  isSubmitting: false,
  error: null,
  registrationSuccess: false,
  registeredEmail: null,
  emailVerified: false,
  verifyEmailError: null,
};
