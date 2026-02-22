import { BASE_URL } from '@/env';

interface ApiResponse<T> {
  data?: T;
  error?: string;
} // Adjust the URL as needed

const api = {
  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return { error: data.message || 'Bir hata oluştu' };
      }

      return { data };
    } catch (error: any) {
      console.error('API Error:', error);
      return { error: 'Sunucuya bağlanılamadı' };
    }
  },

  async post<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const responseData = await response.json();

      if (!response.ok) {
        return { error: responseData.message || 'Bir hata oluştu' };
      }

      return { data: responseData };
    } catch (error: any) {
      console.error('API Error:', error);
      return { error: 'Sunucuya bağlanılamadı' };
    }
  },
};

export default api; 