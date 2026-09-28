import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
  DestroyRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Store } from '@ngrx/store';
import { AppState } from '../../../core/store/app.state';
import { selectCurrentUser } from '../../auth/store/auth.selectors';
import { authActions } from '../../auth/store/auth.actions';
import { AuthService } from '../../auth/services/auth.service';
import { SettingsService } from '../services/settings.service';
import { ProfileFormComponent } from '../components/profile-form.component';
import { finalize } from 'rxjs/operators';

// ─── Custom validator: passwords must match ────────────────────────────────
function passwordsMatchValidator(group: AbstractControl): ValidationErrors | null {
  const pw   = group.get('newPassword')?.value;
  const conf = group.get('confirmPassword')?.value;
  return pw && conf && pw !== conf ? { passwordsMismatch: true } : null;
}

/** ProfilePage — Section 1 (Profile & Avatar) + Section 2 (Account Security) */
@Component({
  standalone: true,
  selector: 'app-profile-page',
  imports: [CommonModule, ReactiveFormsModule, ProfileFormComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-4 sm:space-y-6 max-w-2xl">

      <!-- Inline Display Name Quick-Editor -->
      <app-profile-form (nameUpdated)="onNameUpdated($event)"></app-profile-form>

      <!-- ═══════════════ SECTION 1: Profile & General Info ═══════════════ -->
      <section class="rounded-2xl bg-slate-900/80 border border-slate-800/60 backdrop-blur-xl overflow-hidden">

        <div class="px-6 py-4 border-b border-slate-800/60 flex items-center gap-3">
          <div class="w-9 h-9 rounded-xl bg-blue-600/20 flex items-center justify-center flex-shrink-0">
            <i class="fa-solid fa-user-pen text-blue-400 text-sm"></i>
          </div>
          <div>
            <h2 class="text-sm font-bold text-white">Profile &amp; General Info</h2>
            <p class="text-xs text-slate-500">Update your display name and avatar</p>
          </div>
        </div>

        <form [formGroup]="profileForm" (ngSubmit)="saveProfile()" class="px-6 py-5 space-y-5">

          <!-- Avatar Row -->
          <div class="flex items-center gap-5">
            <div class="relative flex-shrink-0">
              <div class="w-20 h-20 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-xl shadow-blue-600/30 overflow-hidden border-2 border-blue-500/30">
                <ng-container *ngIf="avatarPreview(); else defaultAvatar">
                  <img [src]="avatarPreview()" alt="Avatar" class="w-full h-full object-cover" />
                </ng-container>
                <ng-template #defaultAvatar>
                  <span class="text-2xl font-black text-white select-none">{{ profileInitial() }}</span>
                </ng-template>
              </div>
              <label for="avatar-upload"
                class="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-full bg-blue-600 hover:bg-blue-500 border-2 border-slate-900 flex items-center justify-center cursor-pointer transition-colors shadow-lg">
                <i class="fa-solid fa-camera text-white text-[10px]"></i>
              </label>
              <input id="avatar-upload" type="file" accept="image/*" class="sr-only" (change)="onAvatarChange($event)" />
            </div>
            <div>
              <p class="text-sm font-semibold text-white">Profile Picture</p>
              <p class="text-xs text-slate-500 mt-0.5">JPG, PNG or GIF — max 2 MB</p>
              <button *ngIf="avatarPreview()" type="button" (click)="removeAvatar()"
                class="mt-2 text-xs text-red-400 hover:text-red-300 font-medium transition-colors">
                <i class="fa-solid fa-trash-can mr-1"></i> Remove
              </button>
            </div>
          </div>

          <!-- Name Field -->
          <div>
            <label for="profile-name" class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Full Name <span class="text-red-400">*</span>
            </label>
            <div class="relative">
              <span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-sm pointer-events-none">
                <i class="fa-solid fa-user"></i>
              </span>
              <input id="profile-name" type="text" formControlName="name"
                placeholder="Your full name"
                [class]="nameInputClass()" />
            </div>
            <p *ngIf="profileForm.get('name')?.hasError('required') && profileForm.get('name')?.touched"
               class="text-xs text-red-400 mt-1 flex items-center gap-1">
              <i class="fa-solid fa-circle-exclamation text-[10px]"></i> Name is required
            </p>
            <p *ngIf="profileForm.get('name')?.hasError('minlength') && profileForm.get('name')?.touched"
               class="text-xs text-red-400 mt-1 flex items-center gap-1">
              <i class="fa-solid fa-circle-exclamation text-[10px]"></i> Name must be at least 2 characters
            </p>
          </div>

          <!-- Email Field (read-only) -->
          <div>
            <label for="profile-email" class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Email Address <span class="text-slate-600 normal-case font-normal">(read-only)</span>
            </label>
            <div class="relative">
              <span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600 text-sm pointer-events-none">
                <i class="fa-solid fa-envelope"></i>
              </span>
              <input id="profile-email" type="email" formControlName="email"
                class="w-full bg-slate-800/30 border border-slate-700/30 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-500 cursor-not-allowed select-none focus:outline-none"
                readonly />
            </div>
            <p class="text-xs text-slate-600 mt-1.5">
              <i class="fa-solid fa-lock text-[10px] mr-1"></i> Contact support to change your email address
            </p>
          </div>

          <!-- Save Button Row -->
          <div class="flex items-center justify-between pt-1">
            <div class="h-5">
              <p *ngIf="profileSuccess()" class="text-xs text-emerald-400 flex items-center gap-1">
                <i class="fa-solid fa-circle-check"></i> Profile updated successfully!
              </p>
              <p *ngIf="profileError()" class="text-xs text-red-400 flex items-center gap-1">
                <i class="fa-solid fa-circle-exclamation"></i> {{ profileError() }}
              </p>
            </div>
            <button type="submit"
              [disabled]="profileForm.invalid || profileSaving()"
              class="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-600/25 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]">
              <i *ngIf="profileSaving()" class="fa-solid fa-spinner fa-spin text-xs"></i>
              <i *ngIf="!profileSaving()" class="fa-solid fa-floppy-disk text-xs"></i>
              {{ profileSaving() ? 'Saving...' : 'Save Profile' }}
            </button>
          </div>

        </form>
      </section>

      <!-- ═══════════════ SECTION 2: Account Security ═══════════════ -->
      <section class="rounded-2xl bg-slate-900/80 border border-slate-800/60 backdrop-blur-xl overflow-hidden">

        <div class="px-6 py-4 border-b border-slate-800/60 flex items-center gap-3">
          <div class="w-9 h-9 rounded-xl bg-amber-600/15 flex items-center justify-center flex-shrink-0">
            <i class="fa-solid fa-shield-halved text-amber-400 text-sm"></i>
          </div>
          <div>
            <h2 class="text-sm font-bold text-white">Account Security</h2>
            <p class="text-xs text-slate-500">Change your password — minimum 6 characters</p>
          </div>
        </div>

        <form [formGroup]="passwordForm" (ngSubmit)="changePassword()" class="px-6 py-5 space-y-4">

          <!-- Current Password -->
          <div>
            <label for="current-pw" class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Current Password <span class="text-red-400">*</span>
            </label>
            <div class="relative">
              <span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-sm pointer-events-none">
                <i class="fa-solid fa-lock"></i>
              </span>
              <input id="current-pw"
                [type]="showCurrentPw() ? 'text' : 'password'"
                formControlName="currentPassword"
                placeholder="Enter current password"
                [class]="currentPwInputClass()" />
              <button type="button" (click)="showCurrentPw.set(!showCurrentPw())"
                class="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                <i [class]="showCurrentPw() ? 'fa-solid fa-eye-slash text-sm' : 'fa-solid fa-eye text-sm'"></i>
              </button>
            </div>
            <p *ngIf="passwordForm.get('currentPassword')?.hasError('required') && passwordForm.get('currentPassword')?.touched"
               class="text-xs text-red-400 mt-1 flex items-center gap-1">
              <i class="fa-solid fa-circle-exclamation text-[10px]"></i> Current password is required
            </p>
            <p *ngIf="wrongPassword()" class="text-xs text-red-400 mt-1 flex items-center gap-1">
              <i class="fa-solid fa-circle-exclamation text-[10px]"></i> Incorrect current password
            </p>
          </div>

          <!-- New Password -->
          <div>
            <label for="new-pw" class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              New Password <span class="text-red-400">*</span>
            </label>
            <div class="relative">
              <span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-sm pointer-events-none">
                <i class="fa-solid fa-key"></i>
              </span>
              <input id="new-pw"
                [type]="showNewPw() ? 'text' : 'password'"
                formControlName="newPassword"
                placeholder="Min. 6 characters"
                [class]="newPwInputClass()" />
              <button type="button" (click)="showNewPw.set(!showNewPw())"
                class="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                <i [class]="showNewPw() ? 'fa-solid fa-eye-slash text-sm' : 'fa-solid fa-eye text-sm'"></i>
              </button>
            </div>

            <!-- Strength Meter -->
            <div *ngIf="passwordForm.get('newPassword')?.value" class="mt-2">
              <div class="flex gap-1">
                <div *ngFor="let s of [0,1,2,3]"
                  class="h-1 flex-1 rounded-full transition-all duration-300"
                  [ngClass]="strengthDotClass(s)">
                </div>
              </div>
              <p class="text-[10px] mt-1 font-medium" [ngClass]="strengthLabelClass()">
                {{ pwStrengthLabel() }}
              </p>
            </div>

            <p *ngIf="passwordForm.get('newPassword')?.hasError('required') && passwordForm.get('newPassword')?.touched"
               class="text-xs text-red-400 mt-1 flex items-center gap-1">
              <i class="fa-solid fa-circle-exclamation text-[10px]"></i> New password is required
            </p>
            <p *ngIf="passwordForm.get('newPassword')?.hasError('minlength') && passwordForm.get('newPassword')?.touched"
               class="text-xs text-red-400 mt-1 flex items-center gap-1">
              <i class="fa-solid fa-circle-exclamation text-[10px]"></i> Password must be at least 6 characters
            </p>
          </div>

          <!-- Confirm Password -->
          <div>
            <label for="confirm-pw" class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Confirm New Password <span class="text-red-400">*</span>
            </label>
            <div class="relative">
              <span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-sm pointer-events-none">
                <i class="fa-solid fa-shield-check"></i>
              </span>
              <input id="confirm-pw"
                [type]="showConfirmPw() ? 'text' : 'password'"
                formControlName="confirmPassword"
                placeholder="Re-enter new password"
                [class]="confirmPwInputClass()" />
              <button type="button" (click)="showConfirmPw.set(!showConfirmPw())"
                class="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                <i [class]="showConfirmPw() ? 'fa-solid fa-eye-slash text-sm' : 'fa-solid fa-eye text-sm'"></i>
              </button>
            </div>
            <p *ngIf="pwMismatch()" class="text-xs text-red-400 mt-1 flex items-center gap-1">
              <i class="fa-solid fa-circle-exclamation text-[10px]"></i> Passwords do not match
            </p>
            <p *ngIf="!pwMismatch() && passwordForm.get('confirmPassword')?.hasError('required') && passwordForm.get('confirmPassword')?.touched"
               class="text-xs text-red-400 mt-1 flex items-center gap-1">
              <i class="fa-solid fa-circle-exclamation text-[10px]"></i> Please confirm your new password
            </p>
          </div>

          <!-- Password Tips -->
          <div class="bg-slate-800/40 border border-slate-700/30 rounded-xl px-4 py-3">
            <p class="text-xs font-semibold text-slate-400 mb-2 flex items-center gap-1.5">
              <i class="fa-solid fa-lightbulb text-amber-400 text-[10px]"></i> Password tips
            </p>
            <ul class="space-y-1">
              <li class="text-xs text-slate-500 flex items-center gap-1.5">
                <i [class]="'fa-solid text-[9px] ' + (pwLen6() ? 'fa-circle-check text-emerald-400' : 'fa-circle text-slate-600')"></i>
                At least 6 characters
              </li>
              <li class="text-xs text-slate-500 flex items-center gap-1.5">
                <i [class]="'fa-solid text-[9px] ' + (pwHasUpper() ? 'fa-circle-check text-emerald-400' : 'fa-circle text-slate-600')"></i>
                One uppercase letter (A–Z)
              </li>
              <li class="text-xs text-slate-500 flex items-center gap-1.5">
                <i [class]="'fa-solid text-[9px] ' + (pwHasNum() ? 'fa-circle-check text-emerald-400' : 'fa-circle text-slate-600')"></i>
                One number (0–9)
              </li>
              <li class="text-xs text-slate-500 flex items-center gap-1.5">
                <i [class]="'fa-solid text-[9px] ' + (pwHasSpecial() ? 'fa-circle-check text-emerald-400' : 'fa-circle text-slate-600')"></i>
                One special character (!&#64;#$...)
              </li>
            </ul>
          </div>

          <!-- Save Button Row -->
          <div class="flex items-center justify-between pt-1">
            <div class="h-5">
              <p *ngIf="pwSuccess()" class="text-xs text-emerald-400 flex items-center gap-1">
                <i class="fa-solid fa-circle-check"></i> Password changed successfully!
              </p>
              <p *ngIf="pwError()" class="text-xs text-red-400 flex items-center gap-1">
                <i class="fa-solid fa-circle-exclamation"></i> {{ pwError() }}
              </p>
            </div>
            <button type="submit"
              [disabled]="passwordForm.invalid || pwSaving()"
              class="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white shadow-lg shadow-amber-600/25 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]">
              <i *ngIf="pwSaving()" class="fa-solid fa-spinner fa-spin text-xs"></i>
              <i *ngIf="!pwSaving()" class="fa-solid fa-rotate-right text-xs"></i>
              {{ pwSaving() ? 'Updating...' : 'Update Password' }}
            </button>
          </div>

        </form>
      </section>

      <!-- Toast -->
      <div *ngIf="toastMessage()" [class]="toastClass()">
        <i [class]="'fa-solid text-base ' + (toastType() === 'success' ? 'fa-circle-check text-emerald-400' : 'fa-circle-exclamation text-red-400')"></i>
        <span class="text-xs font-semibold text-white">{{ toastMessage() }}</span>
        <button (click)="toastMessage.set(null)" class="text-slate-400 hover:text-white ml-2 text-xs p-1 transition-colors">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>

    </div>
  `,
})
export class ProfilePage implements OnInit {
  private readonly fb         = inject(FormBuilder);
  private readonly store      = inject<Store<AppState>>(Store);
  private readonly authService = inject(AuthService);
  private readonly settings   = inject(SettingsService);
  private readonly destroyRef = inject(DestroyRef);

  // ── UI Signals ─────────────────────────────────────────────────────────────
  readonly avatarPreview  = signal<string | null>(null);
  readonly profileSaving  = signal(false);
  readonly profileSuccess = signal(false);
  readonly profileError   = signal<string | null>(null);

  readonly pwSaving      = signal(false);
  readonly pwSuccess     = signal(false);
  readonly pwError       = signal<string | null>(null);
  readonly wrongPassword = signal(false);
  readonly pwMismatch    = signal(false);

  readonly showCurrentPw  = signal(false);
  readonly showNewPw      = signal(false);
  readonly showConfirmPw  = signal(false);

  readonly toastMessage = signal<string | null>(null);
  readonly toastType    = signal<'success' | 'error'>('success');

  // ── Forms ──────────────────────────────────────────────────────────────────
  profileForm!: FormGroup;
  passwordForm!: FormGroup;

  // ── Lifecycle ──────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.profileForm = this.fb.group({
      name:  ['', [Validators.required, Validators.minLength(2)]],
      email: [{ value: '', disabled: true }],
    });

    this.passwordForm = this.fb.group(
      {
        currentPassword: ['', Validators.required],
        newPassword:     ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', Validators.required],
      },
      { validators: passwordsMatchValidator }
    );

    // Keep mismatch signal in sync
    this.passwordForm.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        if (this.passwordForm.get('confirmPassword')?.touched) {
          this.pwMismatch.set(!!this.passwordForm.hasError('passwordsMismatch'));
        }
      });

    // Pre-fill immediately from centralized reactive user signal
    const initialUser = this.authService.currentUser();
    if (initialUser) {
      if (initialUser.name) this.profileForm.patchValue({ name: initialUser.name });
      if (initialUser.email) this.profileForm.patchValue({ email: initialUser.email });
      if (initialUser.avatar) this.avatarPreview.set(initialUser.avatar);
    }

    // Pre-fill from NgRx store
    this.store.select(selectCurrentUser)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(user => {
        if (user) this.profileForm.patchValue({ name: user.name, email: user.email });
      });

    // Try full settings load from API
    this.settings.getUserSettings()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: res => {
          const user = res?.user || res?.data?.profile || (res?.data as any);
          if (user) {
            if (user.name) this.profileForm.patchValue({ name: user.name });
            if (user.email) this.profileForm.patchValue({ email: user.email });
            if (user.avatar) this.avatarPreview.set(user.avatar);
          }
        },
        error: () => {},
      });
  }

  // ── Avatar ─────────────────────────────────────────────────────────────────
  profileInitial(): string {
    const name = this.profileForm?.get('name')?.value as string;
    return name ? name.charAt(0).toUpperCase() : '?';
  }

  onAvatarChange(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { this.showToast('Image must be under 2 MB', 'error'); return; }
    const reader = new FileReader();
    reader.onload = () => this.avatarPreview.set(reader.result as string);
    reader.readAsDataURL(file);
  }

  removeAvatar(): void { this.avatarPreview.set(null); }

  // ── Dynamic CSS class helpers (avoids [class.X] with / or : in X) ─────────
  private get newPwValue(): string { return (this.passwordForm?.get('newPassword')?.value as string) ?? ''; }

  pwLen6()      { return this.newPwValue.length >= 6; }
  pwHasUpper()  { return /[A-Z]/.test(this.newPwValue); }
  pwHasNum()    { return /[0-9]/.test(this.newPwValue); }
  pwHasSpecial(){ return /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(this.newPwValue); }

  pwStrength(): number {
    return [this.pwLen6(), this.pwHasUpper(), this.pwHasNum(), this.pwHasSpecial()]
      .filter(Boolean).length;
  }

  pwStrengthLabel(): string {
    return ['', 'Weak', 'Fair', 'Good', 'Strong'][this.pwStrength()] ?? '';
  }

  strengthDotClass(index: number): string {
    const s = this.pwStrength();
    if (s === 4) return 'bg-emerald-500';
    if (s === 3 && index <= 2) return 'bg-blue-500';
    if (s === 2 && index <= 1) return 'bg-amber-500';
    if (s === 1 && index === 0) return 'bg-red-500';
    return 'bg-slate-700';
  }

  strengthLabelClass(): string {
    const map = ['', 'text-red-400', 'text-amber-400', 'text-blue-400', 'text-emerald-400'];
    return map[this.pwStrength()] ?? '';
  }

  private baseInput(extra: string): string {
    return `w-full bg-slate-800/60 border rounded-xl py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 transition-all duration-200 ${extra}`;
  }

  private inputClass(hasError: boolean, padRight = 'pr-4'): string {
    const state = hasError
      ? 'border-red-500/60 focus:ring-red-500/30'
      : 'border-slate-700/40 focus:ring-blue-500/50 focus:border-blue-500/50';
    return this.baseInput(`pl-10 ${padRight} ${state}`);
  }

  nameInputClass(): string {
    const c = this.profileForm?.get('name');
    return this.inputClass(!!c?.invalid && !!c?.touched, 'pr-4');
  }

  currentPwInputClass(): string {
    const c = this.passwordForm?.get('currentPassword');
    return this.inputClass((!!c?.invalid && !!c?.touched) || this.wrongPassword(), 'pr-11');
  }

  newPwInputClass(): string {
    const c = this.passwordForm?.get('newPassword');
    return this.inputClass(!!c?.invalid && !!c?.touched, 'pr-11');
  }

  confirmPwInputClass(): string {
    const c = this.passwordForm?.get('confirmPassword');
    return this.inputClass(this.pwMismatch() || (!!c?.hasError('required') && !!c?.touched), 'pr-11');
  }

  toastClass(): string {
    const base = 'fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl backdrop-blur-xl border shadow-2xl shadow-black/80 transition-all duration-300 bg-slate-900/95';
    return this.toastType() === 'success' ? `${base} border-emerald-500/50` : `${base} border-red-500/50`;
  }

  // ── Actions ────────────────────────────────────────────────────────────────
  saveProfile(): void {
    if (this.profileForm.invalid || this.profileSaving()) return;
    this.profileSaving.set(true);
    this.profileSuccess.set(false);
    this.profileError.set(null);

    const payload: { name: string; avatar?: string } = { name: this.profileForm.get('name')!.value };
    if (this.avatarPreview()) payload.avatar = this.avatarPreview()!;

    this.authService.updateUserProfile(payload)
      .pipe(finalize(() => this.profileSaving.set(false)), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updatedUser) => {
          this.profileSuccess.set(true);
          this.showToast('Profile updated successfully!', 'success');
          setTimeout(() => this.profileSuccess.set(false), 4000);
        },
        error: (err) => {
          const msg = err?.error?.message ?? 'Failed to update profile. Please try again.';
          this.profileError.set(msg);
          this.showToast(msg, 'error');
          setTimeout(() => this.profileError.set(null), 5000);
        },
      });
  }

  changePassword(): void {
    this.passwordForm.markAllAsTouched();
    this.pwMismatch.set(!!this.passwordForm.hasError('passwordsMismatch'));
    if (this.passwordForm.invalid || this.pwSaving()) return;

    this.pwSaving.set(true);
    this.pwSuccess.set(false);
    this.pwError.set(null);
    this.wrongPassword.set(false);

    const oldPassword = this.passwordForm.get('currentPassword')!.value;
    const password    = this.passwordForm.get('newPassword')!.value;

    this.settings.changePassword({
      oldPassword,
      password,
    }).pipe(finalize(() => this.pwSaving.set(false)), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.pwSuccess.set(true);
          this.passwordForm.reset();
          this.pwMismatch.set(false);
          this.showToast('Password changed successfully!', 'success');
          setTimeout(() => this.pwSuccess.set(false), 4000);
        },
        error: (err) => {
          const status   = err?.status;
          const msg      = err?.error?.message ?? 'Failed to update password.';
          const lowerMsg = msg.toLowerCase();

          // Only flag current password if the backend specifically reports an incorrect old/current password
          const isWrongPw =
            lowerMsg.includes('incorrect old password') ||
            lowerMsg.includes('incorrect current password') ||
            lowerMsg.includes('wrong password') ||
            lowerMsg.includes('invalid password') ||
            (status === 401 && lowerMsg.includes('password'));

          if (isWrongPw) {
            this.wrongPassword.set(true);
          }
          this.pwError.set(msg);
          this.showToast(msg, 'error');
          setTimeout(() => { this.pwError.set(null); this.wrongPassword.set(false); }, 5000);
        },
      });
  }

  onNameUpdated(updatedName: string): void {
    this.profileForm.patchValue({ name: updatedName });
  }

  private showToast(message: string, type: 'success' | 'error'): void {
    this.toastMessage.set(message);
    this.toastType.set(type);
    setTimeout(() => this.toastMessage.set(null), 4500);
  }
}
