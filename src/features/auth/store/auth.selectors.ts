import { createFeatureSelector, createSelector } from '@ngrx/store';
import { AuthState } from './auth.state';

export const AUTH_FEATURE_KEY = 'auth';

export const selectAuthState = createFeatureSelector<AuthState>(AUTH_FEATURE_KEY);

export const selectCurrentUser = createSelector(
    selectAuthState,
    (state) => state.user
);

export const selectAuthToken = createSelector(
    selectAuthState,
    (state) => state.token
);

export const selectIsLoggedIn = createSelector(
    selectAuthState,
    (state) => state.isLoggedIn
);

export const selectIsSubmitting = createSelector(
    selectAuthState,
    (state) => state.isSubmitting
);

export const selectAuthError = createSelector(
    selectAuthState,
    (state) => state.error
);

export const selectRegistrationSuccess = createSelector(
    selectAuthState,
    (state) => state.registrationSuccess
);

export const selectRegisteredEmail = createSelector(
    selectAuthState,
    (state) => state.registeredEmail
);

export const selectEmailVerified = createSelector(
    selectAuthState,
    (state) => state.emailVerified
);

export const selectVerifyEmailError = createSelector(
    selectAuthState,
    (state) => state.verifyEmailError
);
