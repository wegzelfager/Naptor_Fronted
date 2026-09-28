import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { map, take } from 'rxjs/operators';

import { AppState } from '../../../core/store/app.state';
import { selectIsLoggedIn } from '../store/auth.selectors';

/** GuestGuard: redirects already-authenticated users away from login/register to /dashboard. */
export const guestGuard: CanActivateFn = () => {
  const store = inject<Store<AppState>>(Store);
  const router = inject(Router);

  return store.select(selectIsLoggedIn).pipe(
    take(1),
    map(isLoggedIn => {
      if (!isLoggedIn) return true;
      return router.createUrlTree(['/dashboard']);
    })
  );
};
