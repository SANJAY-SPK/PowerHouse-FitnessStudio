import { Redirect } from 'expo-router';

export default function Index() {
  // Later: check auth store — if logged in redirect to /(tabs), else login
  return <Redirect href="/login" />;
}