import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ReactiveFormsModule, NonNullableFormBuilder, Validators } from '@angular/forms';
import { Store } from '@ngrx/store';

import { ButtonComponent } from '../../../shared/components/ui/button/button.component';
import { InputComponent } from '../../../shared/components/ui/input/input.component';

import { authActions, LoginPayload } from '../store/auth.actions';
import { AppState } from '../../../core/store/app.state';
import { selectIsSubmitting, selectAuthError, selectIsLoggedIn } from '../store/auth.selectors';

@Component({
    selector: 'app-login-form',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, ButtonComponent, InputComponent, RouterLink],
    templateUrl: './login-form.component.html',
})
export class LoginFormComponent {
    private readonly store = inject<Store<AppState>>(Store);
    private readonly router = inject(Router);
    private readonly fb = inject(NonNullableFormBuilder);

    form = this.fb.group({
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(3)]]
    });

    emailControl = this.form.controls.email;
    passwordControl = this.form.controls.password;

    submitting = this.store.selectSignal(selectIsSubmitting);
    error = this.store.selectSignal(selectAuthError);

    constructor() {
        // Automatically navigate if already logged in
        this.store.select(selectIsLoggedIn).subscribe((isLoggedIn: boolean) => {
            if (isLoggedIn) {
                this.router.navigate(['/dashboard'], { replaceUrl: true });
            }
        });
    }

    onSubmit() {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        const payload: LoginPayload = this.form.getRawValue();
        this.store.dispatch(authActions.login({ payload }));
    }
}
