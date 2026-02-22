export const calculateDistance = (pointA: any, pointB: any) => {
    // Logic to calculate distance
};

export const formatDate = (date: Date | null) => {
    if (!date) return null;
    // Example formatting logic
    return new Date(date); // Ensure it returns a Date object
};

export const fetchWithTimeout = async (url: string, options: RequestInit, timeout = 5000) => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return response;
};

// Add any other utility functions here 