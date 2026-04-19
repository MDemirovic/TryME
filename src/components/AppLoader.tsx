import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { colors, fontFamily } from "@/src/constants/uiTheme";

interface AppLoaderProps {
  label?: string;
}

export function AppLoader({ label = "Loading..." }: AppLoaderProps) {
  return (
    <View style={styles.wrap}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.page,
    padding: 24,
    gap: 12,
  },
  label: {
    color: colors.inkMuted,
    fontFamily: fontFamily.body,
    fontSize: 15,
  },
});
