import Constants from 'expo-constants';


const extra = (Constants.expoConfig?.extra ?? {}) as { apiUrl?: string };

export const API_URL = extra.apiUrl ?? 'http://localhost:3000';
