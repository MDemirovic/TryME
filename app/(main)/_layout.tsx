import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

import { colors, fontFamily } from '@/src/constants/uiTheme';

export default function MainTabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: '#7A846E',
        tabBarStyle: {
          height: 84,
          paddingBottom: 10,
          paddingTop: 8,
          borderTopColor: '#E3DACA',
          backgroundColor: '#FFFDF8',
        },
        tabBarLabelStyle: {
          fontFamily: fontFamily.bodySemi,
          fontSize: 13,
        },
      }}>
      <Tabs.Screen
        name="home"
        options={{
          title: 'Workspace',
          tabBarIcon: ({ color }) => <Ionicons name="sparkles-outline" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="library"
        options={{
          title: 'Library',
          tabBarIcon: ({ color }) => <Ionicons name="folder-outline" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Progress',
          tabBarIcon: ({ color }) => <Ionicons name="stats-chart-outline" size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}
