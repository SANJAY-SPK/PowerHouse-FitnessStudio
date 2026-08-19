import axios from 'axios';
import { Platform } from 'react-native';

// When running on an Android Emulator, localhost points to the emulator itself.
// 10.0.2.2 is the special alias to your host machine's localhost.
const BASE_URL = Platform.OS === 'android' 
  ? 'http://10.0.2.2:8080/api'
  : 'http://localhost:8080/api';

export const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 seconds
});
