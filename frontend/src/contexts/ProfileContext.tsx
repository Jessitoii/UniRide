import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { userService, UserProfile } from '@/services/userService';
import AsyncStorage from '@react-native-async-storage/async-storage';
interface ProfileContextType {
    profile: UserProfile | null;
    isLoading: boolean;
    refreshProfile: () => Promise<void>;
    updateCoordinates: (lat: number, long: number) => void;
}

const ProfileContext = createContext<ProfileContextType>({
    profile: null,
    isLoading: true,
    refreshProfile: async () => { },
    updateCoordinates: () => { },
});

export const useProfile = () => useContext(ProfileContext);

export const ProfileProvider = ({ children }: { children: ReactNode }) => {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const refreshProfile = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            if (token) {
                const data = await userService.getProfile();
                setProfile(data);
            } else {
                setProfile(null);
            }
        } catch (error) {
            console.error('Failed to refresh profile:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        refreshProfile();
    }, []);

    const updateCoordinates = async (lat: number, long: number) => {
        // Optional: backend update or just state management
    };

    return (
        <ProfileContext.Provider value={{ profile, isLoading, refreshProfile, updateCoordinates }}>
            {children}
        </ProfileContext.Provider>
    );
};
