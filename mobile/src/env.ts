import Constants from 'expo-constants';

const getBaseUrl = () => {
    // 1. Identify the environment
    const isProduction = !__DEV__;

    // 2. Production URL (Render)
    if (isProduction) {
        return 'https://uniride-7g6w.onrender.com';
    }

    // 3. Fallback for Local Development (Debugger Host)
    const debuggerHost =
        Constants.expoConfig?.hostUri || Constants.manifest2?.extra?.expoGo?.debuggerHost;

    const host = debuggerHost?.split(':').shift();

    // Use your local IP for development
    return `http://${host}:5000`;
};

export const BASE_URL = getBaseUrl();