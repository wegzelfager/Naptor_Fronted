import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  EventEmitter,
  Input,
  OnInit,
  Output,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Store } from '@ngrx/store';
import { finalize } from 'rxjs/operators';
import { AppState } from '../../../core/store/app.state';
import { selectCurrentUser } from '../../auth/store/auth.selectors';
import { authActions } from '../../auth/store/auth.actions';
import { AuthService } from '../../auth/services/auth.service';
import { UserService } from '../services/user.service';
import { SettingsService } from '../services/settings.service';

/**
 * ProfileFormComponent
 * Inline editable field & form for updating the user's name.
 * Features:
 * - Pre-filled with current user name (from Store / UserService API)
 * - Strict validation: Validators.required, Validators.minLength(2)
 * - Calls PUT /api/v1/users/settings with { name: string }
 * - Instantly updates global NgRx Store & UserService Signals
 * - Dark Obsidian Glassmorphism UI with interactive saving states & toasts
 */
@Component({
  standalone: true,
  selector: 'app-profile-form',
  imports: [CommonModule, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="relative rounded-2xl bg-slate-900/80 border border-slate-800/60 backdrop-blur-xl p-5 md:p-6 shadow-2xl shadow-black/40">

      <!-- Header / Section Title -->
      <div class="flex items-center justify-between pb-4 mb-4 border-b border-slate-800/60">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600/30 to-indigo-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-md shadow-blue-500/10">
            <i class="fa-solid fa-signature text-base"></i>
          </div>
          <div>
            <h3 class="text-sm font-bold text-white tracking-tight">Display Name</h3>
            <p class="text-xs text-slate-500">Your public identity across monitoring reports &amp; alerts</p>
          </div>
        </div>

        <!-- Mode Toggle Badge / Button -->
        <button
          *ngIf="!isEditing()"
          type="button"
          (click)="startEditing()"
          id="btn-edit-name"
          class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800/80 hover:bg-slate-700/80 text-blue-400 hover:text-blue-300 border border-slate-700/50 hover:border-blue-500/40 transition-all duration-200 shadow-sm active:scale-95">
          <i class="fa-solid fa-pen-to-square text-[11px]"></i>
          <span>Edit</span>
        </button>
      </div>

      <!-- ── VIEW MODE (Inline Display) ─────────────────────────────────── -->
      <div *ngIf="!isEditing()" class="flex items-center justify-between py-2">
        <div class="flex items-center gap-3.5 min-w-0">
          <!-- Avatar Icon with initial -->
          <div class="w-11 h-11 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white font-extrabold text-base shadow-lg shadow-blue-600/25 border border-blue-400/30 flex-shrink-0 select-none">
            {{ displayInitial() }}
          </div>
          <div class="min-w-0">
            <div class="flex items-center gap-2">
              <span class="text-base font-bold text-white tracking-wide truncate">
                {{ currentName() || 'Not set' }}
              </span>
              <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                Active
              </span>
            </div>
            <p class="text-xs text-slate-400 mt-0.5 truncate flex items-center gap-1.5">
              <i class="fa-regular fa-id-badge text-slate-500 text-xs"></i>
              <span>Click <strong class="text-slate-300 font-medium">Edit</strong> to change your name</span>
            </p>
          </div>
        </div>
      </div>

      <!-- ── EDIT MODE (Inline Form) ────────────────────────────────────── -->
      <form *ngIf="isEditing()" [formGroup]="form" (ngSubmit)="saveName()" class="space-y-4">
        <div>
          <label for="user-display-name-input" class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Full Name <span class="text-red-400">*</span>
          </label>
          <div class="relative">
            <span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-sm pointer-events-none">
              <i class="fa-solid fa-user-pen"></i>
            </span>
            <input
              id="user-display-name-input"
              type="text"
              formControlName="name"
              placeholder="e.g. Alex Morgan"
              (keydown.enter)="saveName()"
              (keydown.escape)="cancelEditing()"
              [class]="inputClassName()"
              autofocus />

            <!-- Input Character Counter -->
            <div class="absolute right-3.5 top-1/2 -translate-y-1/2 text-[11px] text-slate-500 pointer-events-none font-mono">
              {{ (form.get('name')?.value || '').length }}/50
            </div>
          </div>

          <!-- Validation Errors -->
          <div class="mt-1.5 space-y-1">
            <p *ngIf="form.get('name')?.hasError('required') && form.get('name')?.touched"
               class="text-xs text-red-400 flex items-center gap-1.5 font-medium animate-fadeIn">
              <i class="fa-solid fa-circle-exclamation text-[11px]"></i> Name is required
            </p>
            <p *ngIf="form.get('name')?.hasError('minlength') && form.get('name')?.touched"
               class="text-xs text-red-400 flex items-center gap-1.5 font-medium animate-fadeIn">
              <i class="fa-solid fa-circle-exclamation text-[11px]"></i> Name must be at least 2 characters
            </p>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            (click)="cancelEditing()"
            [disabled]="isSaving()"
            id="btn-cancel-name"
            class="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white border border-slate-700/60 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
            Cancel
          </button>

          <button
            type="submit"
            [disabled]="form.invalid || isSaving()"
            id="btn-save-name"
            class="flex items-center gap-2 px-5 py-2 text-xs font-semibold rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-600/25 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]">
            <i *ngIf="isSaving()" class="fa-solid fa-spinner fa-spin text-xs"></i>
            <i *ngIf="!isSaving()" class="fa-solid fa-check text-xs"></i>
            {{ isSaving() ? 'Saving Changes...' : 'Save Name' }}
          </button>
        </div>
      </form>

      <!-- ── Toast Notification ─────────────────────────────────────────── -->
      <div
        *ngIf="toastMessage()"
        [class]="toastClassName()">
        <i [class]="'fa-solid ' + (toastType() === 'success' ? 'fa-circle-check text-emerald-400' : 'fa-circle-exclamation text-red-400')"></i>
        <span class="text-xs font-medium text-white flex-1">{{ toastMessage() }}</span>
        <button
          type="button"
          (click)="toastMessage.set(null)"
          class="text-slate-400 hover:text-white transition-colors ml-1 p-0.5">
          <i class="fa-solid fa-xmark text-xs"></i>
        </button>
      </div>

    </div>
  `,
  styles: [`
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-2px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .animate-fadeIn {
      animation: fadeIn 0.15s ease-out forwards;
    }
  `]
})
export class ProfileFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly store = inject<Store<AppState>>(Store);
  private readonly userService = inject(UserService);
  private readonly settingsService = inject(SettingsService);
  private readonly destroyRef = inject(DestroyRef);

  @Input() initialName?: string;
  @Output() nameUpdated = new EventEmitter<string>();

  // State Signals
  readonly isEditing = signal<boolean>(false);
  readonly isSaving = signal<boolean>(false);
  readonly currentName = signal<string>('');
  readonly toastMessage = signal<string | null>(null);
  readonly toastType = signal<'success' | 'error'>('success');

  form!: FormGroup;

  ngOnInit(): void {
    // Form Validation: Validators.required, Validators.minLength(2)
    this.form = this.fb.group({
      name: [
        this.initialName || '',
        [Validators.required, Validators.minLength(2), Validators.maxLength(50)],
      ],
    });

    // 1. Immediately pre-fill from centralized reactive signal
    const initialUser = this.authService.currentUser();
    if (initialUser?.name) {
      this.currentName.set(initialUser.name);
      if (!this.isEditing()) {
        this.form.patchValue({ name: initialUser.name }, { emitEvent: false });
      }
    }

    // 2. Pre-fill from NgRx Store
    this.store
      .select(selectCurrentUser)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((user) => {
        if (user?.name) {
          this.currentName.set(user.name);
          if (!this.isEditing()) {
            this.form.patchValue({ name: user.name }, { emitEvent: false });
          }
        }
      });

    // 2. Pre-fill / sync with Settings API if needed
    this.settingsService
      .getUserSettings()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          const user = res?.user || res?.data;
          if (user?.name) {
            this.currentName.set(user.name);
            if (!this.isEditing()) {
              this.form.patchValue({ name: user.name }, { emitEvent: false });
            }
          }
        },
        error: () => {},
      });
  }

  displayInitial(): string {
    const name = this.currentName();
    return name ? name.trim().charAt(0).toUpperCase() : 'U';
  }

  startEditing(): void {
    this.form.patchValue({ name: this.currentName() });
    this.isEditing.set(true);
  }

  cancelEditing(): void {
    this.form.patchValue({ name: this.currentName() });
    this.isEditing.set(false);
  }

  saveName(): void {
    if (this.form.invalid || this.isSaving()) {
      this.form.markAllAsTouched();
      return;
    }

    const trimmedName = (this.form.get('name')!.value as string).trim();
    if (trimmedName.length < 2) {
      this.form.get('name')!.setErrors({ minlength: true });
      return;
    }

    this.isSaving.set(true);

    // Centralized updateUserProfile updates Reactive Signal, syncs LocalStorage, and dispatches to NgRx
    this.authService
      .updateUserProfile({ name: trimmedName })
      .pipe(
        finalize(() => this.isSaving.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (updatedUser) => {
          const updatedName = updatedUser.name || trimmedName;

          // 1. Update component local state
          this.currentName.set(updatedName);
          this.isEditing.set(false);

          // 2. Emit output event
          this.nameUpdated.emit(updatedName);

          // 3. Show success toast notification
          this.showToast('Name updated successfully!', 'success');
        },
        error: (err) => {
          const msg =
            err?.error?.message ||
            err?.error?.errors?.[0]?.message ||
            'Failed to update name. Please try again.';
          this.showToast(msg, 'error');
        },
      });
  }

  private showToast(message: string, type: 'success' | 'error'): void {
    this.toastMessage.set(message);
    this.toastType.set(type);
    setTimeout(() => {
      if (this.toastMessage() === message) {
        this.toastMessage.set(null);
      }
    }, 4000);
  }

  inputClassName(): string {
    const control = this.form.get('name');
    const hasError = !!control?.invalid && !!control?.touched;
    const base =
      'w-full bg-slate-950/60 border rounded-xl pl-10 pr-16 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none transition-all duration-200';
    return hasError
      ? `${base} border-red-500/70 focus:border-red-500 focus:ring-2 focus:ring-red-500/20`
      : `${base} border-slate-700/60 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20`;
  }

  toastClassName(): string {
    const isSuccess = this.toastType() === 'success';
    const border = isSuccess ? 'border-emerald-500/40' : 'border-red-500/40';
    return `mt-4 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-slate-950/90 border ${border} backdrop-blur-md shadow-lg animate-fadeIn`;
  }
}
