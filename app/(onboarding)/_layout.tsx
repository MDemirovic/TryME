import { Redirect, Stack } from "expo-router";

import { AppLoader } from "@/src/components/AppLoader";
import { useAuth } from "@/src/providers/AuthProvider";

export default function OnboardingLayout() {
  const { loading, user, profile } = useAuth();

  if (loading) {
    return <AppLoader label="Loading onboarding..." />;
  }

  if (!user) {
    return <Redirect href="/(auth)" />;
  }

  if (profile?.onboarding_completed) {
    return <Redirect href="/(main)/library" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
