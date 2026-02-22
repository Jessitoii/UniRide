import { ImageSourcePropType } from 'react-native';
import { BASE_URL } from '@/env';

// Try to use local asset, fall back to remote if not found (handled by error boundary or just try-catch in require which is not possible at runtime).
// Using require is synchronous. If file is missing, app crashes on bundle load.
// So I will use a try-catch block for require? No, require is processed by bundler.
// I will assume curl worked. If not, I should have used a remote URI directly.
// To be safe, I will use a remote URI for default if file is missing (I can't check at runtime safely in RN easily without fs).
// But user explicitly asked for local asset. I'll rely on the curl.
// If curl failed, the require will fail the build.
// Let's check if the file exists first.

const DEFAULT_AVATAR = require('@/assets/images/default-avatar.png');

export interface UserPhotoData {
    id: string;
    hasCustomPhoto?: boolean;
    gender?: string;
}

export const getAvatarSource = (user: UserPhotoData | null | undefined): ImageSourcePropType => {
    if (!user) {
        return DEFAULT_AVATAR;
    }

    if (user.hasCustomPhoto) {
        // Add timestamp to bust cache if needed
        return { uri: `${BASE_URL}/api/users/profilePhoto/${user.id}?t=${new Date().getTime()}` };
    }

    return DEFAULT_AVATAR;
};

export interface VehiclePhotoData {
    brand: string;
    model: string;
    photoPath?: string;
    photoUrl?: string;
}

export const getVehicleSource = (vehicle: VehiclePhotoData | null | undefined): ImageSourcePropType | undefined => {
    if (!vehicle) return undefined;

    // If we have a full URL (legacy or external), use it, but ensure it's valid
    if (vehicle.photoUrl) {
        if (vehicle.photoUrl.startsWith('http')) {
            return { uri: vehicle.photoUrl };
        }
    }

    // If we have a path, prepend BASE_URL and handle uploads structure
    if (vehicle.photoPath) {
        // Remove leading slash if present to avoid double slashes
        const cleanPath = vehicle.photoPath.startsWith('/') ? vehicle.photoPath.substring(1) : vehicle.photoPath;
        // Check if path already includes 'uploads/'
        const pathPart = cleanPath.startsWith('uploads/') ? cleanPath : `uploads/cars/${cleanPath}`;

        return {
            uri: `${BASE_URL}/${pathPart}?v=${new Date().getTime()}` // Cache bust
        };
    }

    return undefined; // Let component handle fallback (e.g. standard car image)
};
