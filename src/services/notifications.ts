import * as Notifications from 'expo-notifications';

import { componentRepository } from '../data/repositories/componentRepository';
import { maintenanceRuleRepository } from '../data/repositories/maintenanceRuleRepository';
import { computeDueInfo, shouldNotifyOnStatusChange, type DueStatus } from '../domain/maintenance';
import i18n from '../i18n';

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

async function notifyMaintenanceDue(action: string, status: DueStatus): Promise<void> {
  const granted = await ensurePermissionAsync();
  if (!granted) {
    return;
  }
  const overdue = status === 'Overdue';
  await Notifications.scheduleNotificationAsync({
    content: {
      title: i18n.t(overdue ? 'notifications.overdueTitle' : 'notifications.dueSoonTitle'),
      body: i18n.t(overdue ? 'notifications.overdueBody' : 'notifications.dueSoonBody', { action }),
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
