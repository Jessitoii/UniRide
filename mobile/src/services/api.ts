import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '@/env';

const api = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use(async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, async (error) => {
    if (error.response) {
        console.error('API Error Response:', error.response.data);
        console.error('API Error Status:', error.response.status);

        if (error.response.status === 403) {
            // Token is invalid or expired
            await AsyncStorage.removeItem('token');
            // We cannot easily redirect from here without a navigation ref, 
            // but clearing the token will likely trigger a re-render in AuthContext or next app launch.
            // For immediate effect, the UI catching this error should redirect.
        }
    } else if (error.request) {
        // Network Error (Server likely offline)
        console.error('API Error Request (Network Error):', error.request);
        error.isNetworkError = true;
    } else {
        console.error('API Error Message:', error.message);
    }
    return Promise.reject(error);
});

export default api;
