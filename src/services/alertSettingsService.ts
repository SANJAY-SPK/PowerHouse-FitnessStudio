import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = '@powerhouse:alert_settings';

export interface AlertSettings {
  /** Days before expiry to show alert (1, 3, 7, 14...) */
  leadTime: number;
  /** Days without check-in before showing inactive alert */
  inactiveDays: number;
}

const DEFAULTS: AlertSettings = {
  leadTime: 7,
  inactiveDays: 14,
};

export const alertSettingsService = {
  load: async (): Promise<AlertSettings> => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (!raw) return DEFAULTS;
      const parsed = JSON.parse(raw);
      return {
        leadTime: typeof parsed.leadTime === 'number' ? parsed.leadTime : DEFAULTS.leadTime,
        inactiveDays: typeof parsed.inactiveDays === 'number' ? parsed.inactiveDays : DEFAULTS.inactiveDays,
      };
    } catch {
      return DEFAULTS;
    }
  },

  save: async (settings: Partial<AlertSettings>): Promise<void> => {
    try {
      const current = await alertSettingsService.load();
      const merged = { ...current, ...settings };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    } catch {
      // silently fail
    }
  },
};
