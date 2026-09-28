import { createReducer, on } from '@ngrx/store';
import { initialAuthState } from './auth.state';
import { authActions } from './auth.actions';

export const authReducer = createReducer(
  initialAuthState,
  on(authActions.login, (state) => ({
    ...state,
    isSubmitting: true,
    error: null
  })),
  on(authActions.loginSuccess, (state, { user, token }) => ({
    ...state,
    user,
    token,
    isLoggedIn: true,
    isSubmitting: false,
    error: null
  })),
  on(authActions.loginFailure, (state, { error }) => ({
    ...state,
    isSubmitting: false,
    error
  })),
  on(authActions.register, (state) => ({
    ...state,
    isSubmitting: true,
    error: null,
    registrationSuccess: false
  })),
  // Registration success: do NOT log in — wait for email verification
  on(authActions.registerSuccess, (state, { email }) => ({
    ...state,
    isLoggedIn: false,
    isSubmitting: false,
    error: null,
    registrationSuccess: true,
    registeredEmail: email ?? null
  })),
  on(authActions.registerFailure, (state, { error }) => ({
    ...state,
    isSubmitting: false,
    error
  })),
  on(authActions.resetRegistrationStatus, (state) => ({
    ...state,
    registrationSuccess: false,
    registeredEmail: null,
    error: null
  })),
  // Verify email
  on(authActions.verifyEmail, (state) => ({
    ...state,
    isSubmitting: true,
    verifyEmailError: null
  })),
  on(authActions.verifyEmailSuccess, (state) => ({
    ...state,
    isSubmitting: false,
    emailVerified: true,
    verifyEmailError: null
  })),
  on(authActions.verifyEmailFailure, (state, { error }) => ({
    ...state,
    isSubmitting: false,
    emailVerified: false,
    verifyEmailError: error
  })),
  on(authActions.updateUser, (state, { user }) => {
    const updatedUser = state.user ? { ...state.user, ...user } : (user as any);
    try {
      localStorage.setItem('user', JSON.stringify(updatedUser));
    } catch {}
    return {
      ...state,
      user: updatedUser
    };
  }),
  on(authActions.logout, () => ({
    ...initialAuthState,
    // Clear persisted session on logout
    user: null,
    token: null,
    isLoggedIn: false
  }))
);
