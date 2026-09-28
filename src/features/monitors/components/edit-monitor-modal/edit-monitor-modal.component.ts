import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  inject,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MonitorsAPI, MonitorItem, MonitorStatus, MonitorType, UpdateMonitorRequest } from '../../api/monitors.api';

@Component({
  standalone: true,
  selector: 'app-edit-monitor-modal',
  imports: [CommonModule, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './edit-monitor-modal.component.html',
  styleUrls: ['./edit-monitor-modal.component.scss'],
})
export class EditMonitorModalComponent {
  private readonly fb = inject(FormBuilder);
  private readonly monitorsApi = inject(MonitorsAPI);

  @Input() isOpen = false;
  @Input() set monitor(data: MonitorItem | null) {
    this._currentMonitor = data;
    if (data) {
      this.populateForm(data);
    }
  }
  get monitor(): MonitorItem | null {
    return this._currentMonitor;
  }

  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<MonitorItem>();

  private _currentMonitor: MonitorItem | null = null;
  readonly isSaving = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);

  // --- Reactive Form with Non-Negative Validations Aligned with Backend DTO ---
  readonly editForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
    url: ['', [Validators.required]],
    type: ['WEBSITE' as MonitorType | string, [Validators.required]],
    port: [null, [Validators.min(0)]],
    interval: [60, [Validators.required, Validators.min(10), Validators.max(86400)]],
    timeout: [5000, [Validators.required, Validators.min(1000), Validators.max(30000)]],
    status: ['UP' as MonitorStatus],
    isActive: [true],
  });

  readonly monitorTypes = [
    { value: 'WEBSITE', label: 'HTTP / Website', icon: 'fa-globe' },
    { value: 'API', label: 'REST API', icon: 'fa-code' },
    { value: 'PORT', label: 'TCP / Port', icon: 'fa-network-wired' },
    { value: 'SSL', label: 'SSL / TLS Certificate', icon: 'fa-shield-halved' },
  ];

  /**
   * Pre-populates the form using FormBuilder patchValue().
   */
  populateForm(monitor: MonitorItem): void {
    const isPaused = monitor.status === 'PAUSED';
    this.editForm.patchValue({
      name: monitor.name,
      url: monitor.url,
      type: monitor.type || 'WEBSITE',
      port: (monitor as any).port ?? null,
      interval: monitor.interval ?? 60,
      timeout: monitor.timeout ?? 5000,
      status: monitor.status || 'UP',
      isActive: !isPaused,
    });
    this.errorMessage.set(null);
  }

  /**
   * Blocks '-' (minus), 'e', 'E', and '+' keys to strictly prevent negative/exponential numbers.
   */
  preventNegative(event: KeyboardEvent): void {
    if (['-', 'e', 'E', '+'].includes(event.key)) {
      event.preventDefault();
    }
  }

  /**
   * Prevents pasting negative numeric strings.
   */
  preventNegativePaste(event: ClipboardEvent): void {
    const text = event.clipboardData?.getData('text') || '';
    if (text.includes('-') || Number(text) < 0) {
      event.preventDefault();
    }
  }

  /**
   * Form validation helpers.
   */
  isFieldInvalid(fieldName: string): boolean {
    const control = this.editForm.get(fieldName);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  hasNegativeError(fieldName: string): boolean {
    const control = this.editForm.get(fieldName);
    return !!(control && control.hasError('min'));
  }

  toggleActive(checked: boolean): void {
    this.editForm.patchValue({
      isActive: checked,
      status: checked ? 'UP' : 'PAUSED',
    });
  }

  close(): void {
    this.errorMessage.set(null);
    this.closed.emit();
  }

  /**
   * Submits the updated monitor configuration to the backend API.
   */
  submit(): void {
    if (this.editForm.invalid || !this._currentMonitor) {
      this.editForm.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set(null);

    const formValue = this.editForm.value;
    const finalStatus: 'UP' | 'DOWN' | MonitorStatus = formValue.isActive
      ? (formValue.status === 'PAUSED' ? 'UP' : formValue.status)
      : 'DOWN';

    const monitorType = (formValue.type || 'WEBSITE') as MonitorType;

    const payload: UpdateMonitorRequest = {
      name: formValue.name.trim(),
      url: formValue.url.trim(),
      type: monitorType,
      interval: Math.max(10, Number(formValue.interval)),
      timeout: Math.max(1000, Number(formValue.timeout)),
      status: finalStatus,
    };
    if (formValue.port !== null && formValue.port !== '') {
      payload.port = Number(formValue.port);
    }

    this.monitorsApi.updateMonitor(this._currentMonitor._id, payload).subscribe({
      next: (response) => {
        this.isSaving.set(false);
        const updatedItem: MonitorItem = response.data || response.monitor || {
          ...this._currentMonitor!,
          ...payload,
          type: monitorType,
          status: formValue.isActive ? (this._currentMonitor!.status === 'PAUSED' ? 'UP' : this._currentMonitor!.status) : 'PAUSED',
        };
        this.saved.emit(updatedItem);
        this.close();
      },
      error: (err) => {
        this.isSaving.set(false);
        const validationErrors = err?.error?.errors;
        let errorText = '';
        if (Array.isArray(validationErrors) && validationErrors.length > 0) {
          errorText = validationErrors.map((e: any) => e.message).join(' | ');
        } else {
          errorText = err?.error?.message || err?.message || 'Failed to update monitor.';
        }
        this.errorMessage.set(errorText);
      },
    });
  }
}
