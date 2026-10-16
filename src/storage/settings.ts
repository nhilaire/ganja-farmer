import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Settings {
  sound: boolean;
  music: boolean;
  vibration: boolean;
}

export const DEFAULT_SETTINGS: Settings = { sound: true, music: true, vibration: true };

const KEY = 'settings.v1';

export async function loadSettings(): Promise<Settings> {
  try {
    const json = await AsyncStorage.getItem(KEY);
    const stored = json ? (JSON.parse(json) as Partial<Settings>) : {};
    return {
      sound: typeof stored.sound === 'boolean' ? stored.sound : DEFAULT_SETTINGS.sound,
      music: typeof stored.music === 'boolean' ? stored.music : DEFAULT_SETTINGS.music,
      vibration: typeof stored.vibration === 'boolean' ? stored.vibration : DEFAULT_SETTINGS.vibration,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(settings: Settings): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(settings));
}
