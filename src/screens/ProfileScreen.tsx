import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { PrimaryButton } from "@/src/components/PrimaryButton";
import { colors, fontFamily } from "@/src/constants/uiTheme";
import { signOut } from "@/src/lib/auth";
import { useAuth } from "@/src/providers/AuthProvider";

export default function ProfileScreen() {
  const { user, profile, refreshProfile } = useAuth();

  async function handleSignOut() {
    try {
      await signOut();
    } catch (error) {
      Alert.alert(
        "Sign out problem",
        error instanceof Error ? error.message : "Could not sign out.",
      );
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Profile</Text>

        <View style={styles.card}>
          <Text style={styles.label}>Email</Text>
          <Text style={styles.value}>{user?.email || "No email"}</Text>

          <Text style={styles.label}>First name</Text>
          <Text style={styles.value}>{profile?.first_name || "Not set"}</Text>

          <Text style={styles.label}>Age</Text>
          <Text style={styles.value}>{profile?.age || "Not set"}</Text>

          <Text style={styles.label}>App language</Text>
          <Text style={styles.value}>{profile?.app_language || "Not set"}</Text>
        </View>

        <PrimaryButton
          label="Refresh profile"
          variant="secondary"
          onPress={() => {
            void refreshProfile().catch((error) => {
              Alert.alert(
                "Refresh problem",
                error instanceof Error
                  ? error.message
                  : "Could not refresh your profile.",
              );
            });
          }}
        />

        <PrimaryButton label="Sign out" variant="danger" onPress={() => void handleSignOut()} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.page,
  },
  content: {
    padding: 20,
    gap: 14,
    paddingBottom: 28,
  },
  title: {
    color: colors.ink,
    fontFamily: fontFamily.heading,
    fontSize: 32,
  },
  card: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.card,
    padding: 18,
    gap: 8,
  },
  label: {
    color: colors.inkMuted,
    fontFamily: fontFamily.bodySemi,
    fontSize: 13,
    textTransform: "uppercase",
  },
  value: {
    color: colors.ink,
    fontFamily: fontFamily.body,
    fontSize: 16,
    lineHeight: 22,
  },
});
