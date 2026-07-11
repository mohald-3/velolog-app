import * as Notifications from 'expo-notifications';

import { componentRepository } from '../data/repositories/componentRepository';
import { maintenanceRuleRepository } from '../data/repositories/maintenanceRuleRepository';
import { computeDueInfo, shouldNotifyOnStatusChange, type DueStatus } from '../domain/maintenance';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

let permissionRequested = false;

async function ensurePermissionAsync(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') {
    return true;
  }
  if (permissionRequested) {
    return false;
  }
  permissionRequested = true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

const STATUS_LABEL: Record<DueStatus, string> = {
  OK: 'OK',
  DueSoon: 'due soon',
  Overdue: 'overdue',
};

async function notifyMaintenanceDue(action: string, status: DueStatus): Promise<void> {
  const granted = await ensurePermissionAsync();
  if (!granted) {
    return;
  }
  await Notifications.scheduleNotificationAsync({
    content: {
      title: status === 'Overdue' ? 'Maintenance overdue' : 'Maintenance due soon',
      body: `${action} is ${STATUS_LABEL[status]}.`,
    },
    trigger: null,
  });
}

/** Call after a bike's odometer changes (ride saved or deleted) to notify on any rule that
 * crossed into a more urgent due-status as a result. Odometer values in meters. */
export async function checkMaintenanceNotifications(
  bikeId: string,
  previousOdometerM: number,
  newOdometerM: number
): Promise<void> {
  const components = await componentRepository.listByBike(bikeId);

  for (const component of components) {
    const rules = await maintenanceRuleRepository.listByComponent(component.id);
    for (const rule of rules) {
      const previousStatus = computeDueInfo(rule, previousOdometerM).status;
      const newStatus = computeDueInfo(rule, newOdometerM).status;
      if (shouldNotifyOnStatusChange(previousStatus, newStatus)) {
        await notifyMaintenanceDue(rule.action, newStatus);
      }
    }
  }
}
