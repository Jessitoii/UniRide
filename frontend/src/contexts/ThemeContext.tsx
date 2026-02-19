import React, { createContext, useState, useContext, useEffect, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { lightTheme, darkTheme, ThemeType } from '../styles/theme';
import { getMapStyle } from '../styles/mapStyle';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ThemeContextType = {
  theme: ThemeType;
  isDark: boolean;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  themePreference: 'light' | 'dark' | 'system';
  mapStyle: any[];
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_PREFERENCE_KEY = '@kampustaxi_theme_preference';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [themePreference, setThemePreference] = useState<'light' | 'dark' | 'system'>('system');
  const [currentTheme, setCurrentTheme] = useState<ThemeType>(
    systemColorScheme === 'dark' ? darkTheme : lightTheme
  );

  // Load saved theme preference on mount
  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        const savedPreference = await AsyncStorage.getItem(THEME_PREFERENCE_KEY);
        if (savedPreference && (savedPreference === 'light' || savedPreference === 'dark' || savedPreference === 'system')) {
          setThemePreference(savedPreference);
          applyTheme(savedPreference);
        }
      } catch (error) {
        console.error('Error loading theme preference:', error);
      }
    };

    loadThemePreference();
  }, []);

  // Listen for system theme changes
  useEffect(() => {
    if (themePreference === 'system') {
      setCurrentTheme(systemColorScheme === 'dark' ? darkTheme : lightTheme);
    }
  }, [systemColorScheme, themePreference]);

  const applyTheme = (preference: 'light' | 'dark' | 'system') => {
    switch (preference) {
      case 'light':
        setCurrentTheme(lightTheme);
        break;
      case 'dark':
        setCurrentTheme(darkTheme);
        break;
      case 'system':
        setCurrentTheme(systemColorScheme === 'dark' ? darkTheme : lightTheme);
        break;
    }
  };

  const handleThemeChange = async (preference: 'light' | 'dark' | 'system') => {
    setThemePreference(preference);
    applyTheme(preference);

    try {
      await AsyncStorage.setItem(THEME_PREFERENCE_KEY, preference);
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  const mapStyle = useMemo(() => getMapStyle(currentTheme), [currentTheme]);

  return (
    <ThemeContext.Provider
      value={{
        theme: currentTheme,
        isDark: currentTheme.isDark,
        setTheme: handleThemeChange,
        themePreference,
        mapStyle,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}; 