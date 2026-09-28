import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterModule } from '@angular/router';

/** RootLayout: Top-level shell. */
@Component({
  standalone: true,
  selector: 'app-root-layout',
  imports: [RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen flex flex-col bg-slate-50">
      <router-outlet></router-outlet>
    </div>
  `
})
export class RootLayoutComponent {}
