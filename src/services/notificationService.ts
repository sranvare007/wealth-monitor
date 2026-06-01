import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { Asset } from '../types';
import { formatMoney } from '../utils/currency';

const CHANNEL_ID = 'recurring-contributions';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function initNotifications(): Promise<void> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Recurring Contributions',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
  await Notifications.requestPermissionsAsync();
}

async function ensurePermission(): Promise<boolean> {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function scheduleContributionReminder(asset: Asset): Promise<void> {
  if (!asset.recurringContributionEnabled || !asset.recurringContributionNextDue || !asset.recurringContributionAmount) return;
  if (asset.recurringContributionNextDue <= Date.now()) return;
  if (!(await ensurePermission())) return;

  await Notifications.scheduleNotificationAsync({
    identifier: `contribution_${asset.id}`,
    content: {
      title: 'Contribution Due',
      body: `${formatMoney(asset.recurringContributionAmount, asset.currency)} ready to be added to ${asset.name}. Open the app to apply.`,
      data: { assetId: asset.id },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: new Date(asset.recurringContributionNextDue),
    },
  });
}

export async function cancelContributionReminder(assetId: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(`contribution_${assetId}`).catch(() => {});
}

export async function cancelAllContributionReminders(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync().catch(() => {});
}

export async function notifyContributionApplied(
  asset: Asset,
  totalAdded: number,
  periods: number,
): Promise<void> {
  if (!(await ensurePermission())) return;

  const body =
    periods > 1
      ? `${periods} contributions totalling ${formatMoney(totalAdded, asset.currency)} added to ${asset.name}`
      : `${formatMoney(totalAdded, asset.currency)} added to ${asset.name}`;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Contribution Applied',
      body,
      data: { assetId: asset.id },
    },
    trigger: null,
  });
}
