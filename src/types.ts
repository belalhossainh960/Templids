export interface EmailMessage {
  id: string;
  from: {
    address: string;
    name?: string;
  };
  subject: string;
  date: string;
  timestamp: number;
  htmlBody?: string;
  textBody?: string;
  excerpt?: string;
  isRead: boolean;
  detectedOtp?: string | null;
  serviceLogoUrl?: string;
  size?: number;
}

export interface SavedMailbox {
  address: string;
  login: string;
  domain: string;
  alias?: string;
  sidToken?: string;
  provider: 'guerrilla' | '1sec';
  label?: string;
  createdAt: number;
  lastUsedAt: number;
  messageCount?: number;
}

export type ThemeMode = 'light' | 'dark' | 'system';
