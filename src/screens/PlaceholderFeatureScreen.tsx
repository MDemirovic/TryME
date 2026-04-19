import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";

import { PrimaryButton } from "@/src/components/PrimaryButton";
import { colors, fontFamily } from "@/src/constants/uiTheme";

interface PlaceholderFeatureScreenProps {
  title: string;
  body: string;
}

export default function PlaceholderFeatureScreen({
  title,
  body,
}: PlaceholderFeatureScreenProps) {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.body}>{body}</Text>
        <PrimaryButton label="Go back" onPress={() => router.back()} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.page,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    gap: 16,
  },
  title: {
    color: colors.ink,
    fontFamily: fontFamily.heading,
    fontSize: 30,
    lineHeight: 36,
  },
  body: {
    color: colors.inkMuted,
    fontFamily: fontFamily.body,
    fontSize: 16,
    lineHeight: 22,
  },
});
