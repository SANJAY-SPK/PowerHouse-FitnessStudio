export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL 
  ? `${process.env.EXPO_PUBLIC_API_URL}/api`
  : 'http://10.125.102.132:8082/api';
// ↑ Uses your .env URL, or falls back to local IP