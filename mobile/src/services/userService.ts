import api from './api';
import { BASE_URL } from '@/env';

export interface UserProfile {
    id: string;
    name: string;
    email: string;
    phone?: string;
    profilePhoto?: string;
    hasCustomPhoto?: boolean;
    notificationsEnabled?: boolean;
    emailNotifications?: boolean;
    pushNotifications?: boolean;
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
        const response = await api.patch('/api/users/profile-photo', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            }
        });
        return response.data;
    },

    updateVehicleInfo: async (brand: string, model: string) => {
        const response = await api.post('/api/cars', { brand, model });
        return response.data;
    },

    uploadCarPhoto: async (carId: string, formData: FormData) => {
        const response = await api.post(`/api/cars/${carId}/photo`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            }
        });
        return response.data;
    },

    submitReview: async (reviewData: { reviewedUserId: string; star: number; comment?: string; postId?: string }) => {
        const response = await api.post('/api/review', reviewData);
        return response.data;
    },

    changePassword: async (passwordData: { oldPassword: string; newPassword: string }) => {
        const response = await api.patch('/api/users/change-password', passwordData);
        return response.data;
    }
};
