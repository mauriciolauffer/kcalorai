export interface ReminderSettings {
  user_id: string;
  enabled: boolean;
  updated_at: string;
}

export interface Reminder {
  id: string;
  user_id: string;
  /**
   * @pattern ^([01]\d|2[0-3]):([0-5]\d)$
   */
  time: string;
  created_at: string;
}

export interface ReminderResponse {
  settings: ReminderSettings;
  reminders: Reminder[];
}

export interface UpdateReminderSettingsRequest {
  enabled: boolean;
}

export interface CreateReminderRequest {
  /**
   * @pattern ^([01]\d|2[0-3]):([0-5]\d)$
   */
  time: string;
}
