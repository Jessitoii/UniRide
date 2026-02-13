import api from './api';
import { BASE_URL } from '@/env';

export interface UserProfile {
    id: string;
    name: string;
    email: string;
    phone?: string;
    profilePhoto?: string;
    // Add other fields as needed
}

export const userService = {
    getProfile: async (): Promise<UserProfile> => {
        const response = await api.get('/api/users/profile');
        return response.data;
    },

    getProfilePhotoUrl: (userId: string): string => {
        return `${BASE_URL}/api/users/profilePhoto/${userId}`;
    },

    updateProfilePhoto: async (formData: FormData) => {
        const response = await api.post('/api/users/uploadProfilePhoto', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            }
        });
        return response.data;
    }
};
