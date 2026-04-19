import { useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppLoader } from "@/src/components/AppLoader";
import { PrimaryButton } from "@/src/components/PrimaryButton";
import { colors, fontFamily } from "@/src/constants/uiTheme";
import { getDocumentWorkspace } from "@/src/lib/documents";
import type { DocumentWorkspace } from "@/src/types/app";

interface DocumentWorkspaceScreenProps {
  documentId: string;
}

export default function DocumentWorkspaceScreen({
  documentId,
}: DocumentWorkspaceScreenProps) {
  const [workspace, setWorkspace] = useState<DocumentWorkspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadWorkspace() {
      setLoading(true);
      setError("");

      try {
        const nextWorkspace = await getDocumentWorkspace(documentId);
        if (mounted) {
          setWorkspace(nextWorkspace);
        }
      } catch (nextError) {
        if (mounted) {
          setError(
            nextError instanceof Error
              ? nextError.message
              : "Could not load this workspace.",
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    void loadWorkspace();

    return () => {
      mounted = false;
    };
  }, [documentId]);

  if (loading) {
    return <AppLoader label="Loading document workspace..." />;
  }

  if (!workspace) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.content}>
          <Text style={styles.title}>Workspace unavailable</Text>
          <Text style={styles.error}>
            {error || "This document workspace could not be loaded."}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{workspace.document.title}</Text>
        <Text style={styles.body}>
          Status: {workspace.document.status || "Unknown"} · Flashcards:{" "}
          {workspace.flashcardsCount}
        </Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Study pack</Text>
          <Text style={styles.body}>
            {workspace.studyPack?.overview ||
              "No study pack has been generated for this document yet."}
          </Text>
        </View>

        <View style={styles.actions}>
          {["Quiz", "Flashcards", "Study Together", "AI Call"].map((label) => (
            <PrimaryButton
              key={label}
              label={label}
              onPress={() => Alert.alert("Placeholder", `${label} is next.`)}
            />
          ))}
        </View>
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
    fontSize: 30,
    lineHeight: 36,
  },
  body: {
    color: colors.inkMuted,
    fontFamily: fontFamily.body,
    fontSize: 16,
    lineHeight: 22,
  },
  error: {
    color: colors.danger,
    fontFamily: fontFamily.bodySemi,
    fontSize: 15,
  },
  card: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.card,
    padding: 18,
    gap: 10,
  },
  cardTitle: {
    color: colors.ink,
    fontFamily: fontFamily.subheading,
    fontSize: 20,
  },
  actions: {
    gap: 10,
  },
});
