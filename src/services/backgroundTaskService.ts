import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import { openAndMigrateDb } from '../db/database';
import { syncStocksIfNeeded } from './stocksSyncService';

export const STOCKS_SYNC_TASK = 'wealth-monitor-stocks-sync';

// Must be defined at module level before any React component renders.
// This is the handler the OS invokes when the app is in the background or killed.
TaskManager.defineTask(STOCKS_SYNC_TASK, async () => {
  console.log('[BackgroundTask] stocks-sync task fired by OS');
  try {
    const db = await openAndMigrateDb();
    await syncStocksIfNeeded(db);
    console.log('[BackgroundTask] stocks-sync completed');
    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (err) {
    console.error('[BackgroundTask] stocks-sync failed:', err);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

export async function registerStocksSyncTask(): Promise<void> {
  try {
    const status = await BackgroundFetch.getStatusAsync();
    console.log('[BackgroundTask] BackgroundFetch status:', status);

    if (
      status === BackgroundFetch.BackgroundFetchStatus.Restricted ||
      status === BackgroundFetch.BackgroundFetchStatus.Denied
    ) {
      console.warn('[BackgroundTask] background fetch not available on this device/OS settings');
      return;
    }

    const isRegistered = await TaskManager.isTaskRegisteredAsync(STOCKS_SYNC_TASK);
    if (isRegistered) {
      console.log('[BackgroundTask] task already registered, skipping');
      return;
    }

    await BackgroundFetch.registerTaskAsync(STOCKS_SYNC_TASK, {
      minimumInterval: 15 * 60, // 15 min — iOS minimum; Android (WorkManager) may run sooner
      stopOnTerminate: false,   // keep running after the app is killed (Android)
      startOnBoot: true,        // resume after device restart (Android)
    });
    console.log('[BackgroundTask] task registered successfully');
  } catch (err) {
    console.error('[BackgroundTask] registerStocksSyncTask failed:', err);
  }
}

export async function unregisterStocksSyncTask(): Promise<void> {
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(STOCKS_SYNC_TASK);
    if (isRegistered) {
      await BackgroundFetch.unregisterTaskAsync(STOCKS_SYNC_TASK);
      console.log('[BackgroundTask] task unregistered — sync is complete');
    }
  } catch (err) {
    console.error('[BackgroundTask] unregisterStocksSyncTask failed:', err);
  }
}
