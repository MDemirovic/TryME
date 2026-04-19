import { Ionicons } from "@expo/vector-icons";
import { Redirect, Tabs } from "expo-router";

import { AppLoader } from "@/src/components/AppLoader";
import { colors, fontFamily } from "@/src/constants/uiTheme";
import { useAuth } from "@/src/providers/AuthProvider";

export default function MainTabsLayout() {
  const { loading, user, profile } = useAuth();

  if (loading) {
    return <AppLoader label="Loading your app..." />;
  }

  if (!user) {
    return <Redirect href="/(auth)" />;
  }

  if (!profile?.onboarding_completed) {
    return <Redirect href="/(onboarding)" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: "#7A846E",
        tabBarStyle: {
          height: 84,
          paddingBottom: 10,
          paddingTop: 8,
          borderTopColor: "#E3DACA",
          backgroundColor: "#FFFDF8",
        },
        tabBarLabelStyle: {
          fontFamily: fontFamily.bodySemi,
          fontSize: 13,
        },
      }}
    >
      <Tabs.Screen
        name="library"
        options={{
          title: "Library",
          tabBarIcon: ({ color }) => (
            <Ionicons name="folder-outline" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => (
            <Ionicons name="person-outline" size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
