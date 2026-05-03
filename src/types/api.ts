export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export interface PreferencesData {
  emailNotifications?: boolean;
  dailyDigest?: boolean;
  instantAlerts?: boolean;
}

export interface PreferencesResponse {
  preferences: PreferencesData;
}

export interface SubscriptionData {
  tier: string;
  status: string;
  autoAppliesLimit: number;
  autoAppliesUsed?: number;
  currentPeriodEnd: string | null;
}

export interface SubscriptionsResponse {
  subscription: SubscriptionData;
}

