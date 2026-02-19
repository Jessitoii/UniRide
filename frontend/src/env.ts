import Constants from 'expo-constants';

const getBaseUrl = () => {
    const debuggerHost =
        Constants.expoConfig?.hostUri || Constants.manifest2?.extra?.expoGo?.debuggerHost;

    const host = debuggerHost?.split(':').shift();

    return `http://${host}:5000`;
};

export const BASE_URL = getBaseUrl();
