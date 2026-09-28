import { createActionGroup, emptyProps, props } from '@ngrx/store';

export interface LoginPayload {
    email: string;
    password: string;
}

export interface RegisterPayload {
    name: string;
    email: string;
    password: string;
}

export interface AuthUser {
    id: string;
    _id?: string;
    email: string;
    name: string;
    role: string;
    avatar?: string;
}

export const authActions = createActionGroup({
    source: 'Auth',
    events: {
        // Login flow
        'Login': props<{ payload: LoginPayload }>(),
        'Login Success': props<{ user: AuthUser; token: string }>(),
        'Login Failure': props<{ error: string }>(),

        // Register flow
        'Register': props<{ payload: RegisterPayload }>(),
        'Register Success': props<{ email: string }>(),
        'Register Failure': props<{ error: string }>(),
        'Reset Registration Status': emptyProps(),

        // Verify email flow
        'Verify Email': props<{ token: string }>(),
        'Verify Email Success': emptyProps(),
        'Verify Email Failure': props<{ error: string }>(),

        // Logout
        'Logout': emptyProps(),
        'Logout Success': emptyProps(),

        // Session restore
        'Restore Session': emptyProps(),
        'Restore Session Success': props<{ user: AuthUser; token: string }>(),
        'Restore Session Failure': emptyProps(),

        // Profile update
        'Update User': props<{ user: Partial<AuthUser> }>(),
    },
});
