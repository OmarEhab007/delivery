import { sleep } from '@/lib/utils';

export interface NotificationPreferences {
  emailUpdates: boolean;
  smsUpdates: boolean;
  pushUpdates: boolean;
  shipmentUpdates: boolean;
  bidUpdates: boolean;
  paymentUpdates: boolean;
  marketing: boolean;
}

export interface FleetNotifications {
  maintenanceReminders: boolean;
  documentExpiry: boolean;
  driverStatusAlerts: boolean;
  newShipmentAlerts: boolean;
  idleTruckAlerts: boolean;
}

export interface LocationSettings {
  shareLiveLocation: boolean;
  allowBackgroundUpdates: boolean;
  updateIntervalMinutes: number;
}

export interface SettingsData {
  notificationPreferences: NotificationPreferences;
  fleetNotifications: FleetNotifications;
  locationSettings: LocationSettings;
}

export interface SettingsResponse {
  success: true;
  data: SettingsData;
}

const STORAGE_KEY = 'delivery.settings';

const defaultSettings: SettingsData = {
  notificationPreferences: {
    emailUpdates: true,
    smsUpdates: false,
    pushUpdates: true,
    shipmentUpdates: true,
    bidUpdates: true,
    paymentUpdates: true,
    marketing: false,
  },
  fleetNotifications: {
    maintenanceReminders: true,
    documentExpiry: true,
    driverStatusAlerts: true,
    newShipmentAlerts: true,
    idleTruckAlerts: false,
  },
  locationSettings: {
    shareLiveLocation: true,
    allowBackgroundUpdates: true,
    updateIntervalMinutes: 5,
  },
};

const mergeSettings = (base: SettingsData, patch?: Partial<SettingsData>): SettingsData => {
  if (!patch) return base;
  return {
    notificationPreferences: {
      ...base.notificationPreferences,
      ...patch.notificationPreferences,
    },
    fleetNotifications: {
      ...base.fleetNotifications,
      ...patch.fleetNotifications,
    },
    locationSettings: {
      ...base.locationSettings,
      ...patch.locationSettings,
    },
  };
};

const loadSettings = (): SettingsData => {
  if (typeof window === 'undefined') return defaultSettings;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return defaultSettings;
  try {
    const parsed = JSON.parse(raw) as Partial<SettingsData>;
    return mergeSettings(defaultSettings, parsed);
  } catch {
    return defaultSettings;
  }
};

const persistSettings = (data: SettingsData) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

export const settingsApi = {
  async getSettings(): Promise<SettingsResponse> {
    await sleep(150);
    return { success: true, data: loadSettings() };
  },

  async updateSettings(payload: Partial<SettingsData>): Promise<SettingsResponse> {
    await sleep(250);
    const current = loadSettings();
    const updated = mergeSettings(current, payload);
    persistSettings(updated);
    return { success: true, data: updated };
  },

  async changePassword(payload: { currentPassword: string; newPassword: string }): Promise<{ success: true }>{
    void payload;
    await sleep(300);
    return { success: true };
  },
};

export default settingsApi;
