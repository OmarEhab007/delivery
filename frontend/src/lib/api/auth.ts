/**
 * Auth API Methods
 */

import { apiClient, setTokens, clearTokens, getTokens } from './client';
import { API_ENDPOINTS } from './endpoints';
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  RefreshTokenResponse,
  AuthMeResponse,
  ApiResponse,
} from '@/types/api';

export const authApi = {
  async login(data: LoginRequest): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>(API_ENDPOINTS.auth.login, data);
    setTokens(response.accessToken, response.refreshToken);
    return response;
  },

  async register(data: RegisterRequest): Promise<RegisterResponse> {
    if (data.role === 'Merchant') {
      return apiClient.post<RegisterResponse>(API_ENDPOINTS.auth.registerMerchant, data);
    }
    if (data.role === 'TruckOwner') {
      return apiClient.post<RegisterResponse>(API_ENDPOINTS.auth.registerTruckOwner, data);
    }
    throw new Error('Unsupported registration role');
  },

  async logout(): Promise<void> {
    try {
      const { refreshToken } = getTokens();
      await apiClient.post(API_ENDPOINTS.auth.logout, refreshToken ? { refreshToken } : undefined);
    } finally {
      clearTokens();
    }
  },

  async refreshToken(token: string): Promise<RefreshTokenResponse> {
    const response = await apiClient.post<RefreshTokenResponse>(API_ENDPOINTS.auth.refresh, {
      refreshToken: token,
    });
    setTokens(response.accessToken, response.refreshToken);
    return response;
  },

  async getMe(): Promise<AuthMeResponse> {
    return apiClient.get<AuthMeResponse>(API_ENDPOINTS.auth.me);
  },

  async sendOtp(phone: string): Promise<ApiResponse<{ message: string }>> {
    return apiClient.post<ApiResponse<{ message: string }>>(API_ENDPOINTS.auth.requestOtp, {
      phone,
    });
  },

  async verifyOtp(phone: string, otp: string): Promise<ApiResponse<{ verified: boolean }>> {
    return apiClient.post<ApiResponse<{ verified: boolean }>>(API_ENDPOINTS.auth.verifyOtp, {
      phone,
      otp,
    });
  },
};

export default authApi;
