interface ApiResponse<T> {
  data?: T;
  error?: string;
}

const BASE_URL = 'http://10.0.2.2:5000'; // Adjust the URL as needed

const api = {
  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      return { data };
    } catch (error: any) {
      console.error('API Error:', error);
      return { error: error.message };
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

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const responseData = await response.json();
      return { data: responseData };
    } catch (error: any) {
      console.error('API Error:', error);
      return { error: error.message };
    }
  },
};

export default api; 