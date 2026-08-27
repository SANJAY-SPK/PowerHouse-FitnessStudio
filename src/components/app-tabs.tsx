import { MaterialCommunityIcons } from '@expo/vector-icons';
import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { Colors } from '@/constants/theme';

export default function AppTabs() {
  return (
    <NativeTabs
      backgroundColor={Colors.surface}
      indicatorColor={Colors.background}
      labelStyle={{ selected: { color: Colors.primary } }}>
      
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
        <MaterialCommunityIcons 
          name="home-variant-outline" 
          size={24} 
          color={Colors.textMuted} 
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="workouts">
        <NativeTabs.Trigger.Label>Workouts</NativeTabs.Trigger.Label>
        <MaterialCommunityIcons 
          name="dumbbell" 
          size={24} 
          color={Colors.textMuted} 
        />
      </NativeTabs.Trigger>
      
      <NativeTabs.Trigger name="profile">
        <NativeTabs.Trigger.Label>Profile</NativeTabs.Trigger.Label>
        <MaterialCommunityIcons 
          name="account-outline" 
          size={24} 
          color={Colors.textMuted} 
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
