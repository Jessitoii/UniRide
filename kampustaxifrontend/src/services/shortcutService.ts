import api from './api';

export interface Shortcut {
    id: string;
    label: string;
    address: string;
    latitude: number;
    longitude: number;
}

export const getShortcuts = async (): Promise<Shortcut[]> => {
    const response = await api.get('/api/users/shortcuts');
    return response.data;
};

export const createShortcut = async (data: Omit<Shortcut, 'id'>): Promise<Shortcut> => {
    const response = await api.post('/api/users/shortcuts', data);
    return response.data;
};

export const deleteShortcut = async (id: string): Promise<void> => {
    await api.delete(`/api/users/shortcuts/${id}`);
};
