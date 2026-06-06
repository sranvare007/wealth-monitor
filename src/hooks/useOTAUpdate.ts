import { useEffect } from 'react';
import * as Updates from 'expo-updates';
import { useToast } from '../store/ToastContext';
import { useAppForeground } from './useAppForeground';

// Called once in AppShell. Handles the full background update lifecycle:
//   1. When expo-updates detects a new update, silently fetch it.
//   2. Once downloaded, notify the user via toast so they can restart from Settings.
//   3. Re-check on every foreground resume so long-running sessions catch new releases.
export function useOTAUpdate(): void {
  const toast = useToast();
  const { isUpdateAvailable, isUpdatePending, isDownloading } = Updates.useUpdates();

  useEffect(() => {
    if (!Updates.isEnabled || !isUpdateAvailable || isDownloading || isUpdatePending) return;
    Updates.fetchUpdateAsync().catch(() => {});
  }, [isUpdateAvailable, isDownloading, isUpdatePending]);

  useEffect(() => {
    if (!isUpdatePending) return;
    toast('Update downloaded — tap Restart in Settings to apply it.', 'info', 7000);
  }, [isUpdatePending, toast]);

  useAppForeground(() => {
    if (!Updates.isEnabled) return;
    Updates.checkForUpdateAsync().catch(() => {});
  });
}
