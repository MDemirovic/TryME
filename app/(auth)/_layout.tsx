import { Redirect, Stack } from "expo-router";

import { AppLoader } from "@/src/components/AppLoader";
import { useAuth } from "@/src/providers/AuthProvider";

export default function AuthLayout() {
  const { loading, user, profile } = useAuth();

  if (loading) {
    return <AppLoader label="Loading auth..." />;
  }

  if (user) {
    if (profile?.onboarding_completed) {
      return <Redirect href="/(main)/library" />;
    }

    return <Redirect href="/(onboarding)" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
