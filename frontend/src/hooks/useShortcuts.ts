
import { useState, useCallback, useEffect } from 'react';
import { getShortcuts, Shortcut } from '@/services/shortcutService';
import { useFocusEffect } from 'expo-router';

// This custom hook manages the fetching and state of user shortcuts.
// It is designed to be used across different screens (Passenger, Post, Search)
// to provide a consistent "Quick Select" experience. 

export const useShortcuts = () => {
    const [shortcuts, setShortcuts] = useState<Shortcut[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchShortcuts = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getShortcuts();
            setShortcuts(data);
        } catch (err) {
            setError('Failed to load shortcuts');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    // Refresh shortcuts whenever the screen comes into focus.
    // This ensures that if a user updates shortcuts in Settings,
    // the changes are reflected immediately when they return to a search screen.
    useFocusEffect(
        useCallback(() => {
            fetchShortcuts();
        }, [fetchShortcuts])
    );

    return { shortcuts, loading, error, refreshShortcuts: fetchShortcuts };
};
