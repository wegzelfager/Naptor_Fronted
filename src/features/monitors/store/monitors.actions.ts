import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { MonitorItem, MonitorStatus, CreateMonitorRequest } from '../api/monitors.api';

export const monitorsActions = createActionGroup({
  source: 'Monitors',
  events: {
    // Load all monitors
    'Load Monitors': emptyProps(),
    'Load Monitors Success': props<{ monitors: MonitorItem[] }>(),
    'Load Monitors Failure': props<{ error: string }>(),

    // Load single monitor detail
    'Load Monitor Detail': props<{ id: string }>(),
    'Load Monitor Detail Success': props<{ monitor: MonitorItem }>(),
    'Load Monitor Detail Failure': props<{ error: string }>(),

    // Create monitor
    'Create Monitor': props<{ payload: CreateMonitorRequest }>(),
    'Create Monitor Success': props<{ monitor: MonitorItem }>(),
    'Create Monitor Failure': props<{ error: string }>(),

    // Update monitor status
    'Update Status': props<{ id: string; status: MonitorStatus }>(),
    'Update Status Success': props<{ monitor: MonitorItem }>(),
    'Update Status Failure': props<{ error: string }>(),

    // Update monitor configuration
    'Update Monitor': props<{ id: string; payload: import('../api/monitors.api').UpdateMonitorRequest }>(),
    'Update Monitor Success': props<{ monitor: MonitorItem }>(),
    'Update Monitor Failure': props<{ error: string }>(),

    // Delete monitor
    'Delete Monitor': props<{ id: string }>(),
    'Delete Monitor Success': props<{ id: string }>(),
    'Delete Monitor Failure': props<{ error: string }>(),
  }
});
