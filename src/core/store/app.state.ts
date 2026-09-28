import { AuthState } from '../../features/auth/store/auth.state';
import { MonitorsState } from '../../features/monitors/store/monitors.state';
import { HeartbeatsState } from '../../features/heartbeats/store/heartbeats.state';

export interface AppState {
  auth: AuthState;
  monitors: MonitorsState;
  heartbeats: HeartbeatsState;
}
