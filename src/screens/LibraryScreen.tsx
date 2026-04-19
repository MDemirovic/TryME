import { useEffect, useState } from "react";
import { router } from "expo-router";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppLoader } from "@/src/components/AppLoader";
import { PrimaryButton } from "@/src/components/PrimaryButton";
import { colors, fontFamily } from "@/src/constants/uiTheme";
import { getMyDocuments } from "@/src/lib/documents";
import type { SourceDocument } from "@/src/types/app";

export default function LibraryScreen() {
  const [documents, setDocuments] = useState<SourceDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadDocuments() {
    setLoading(true);
    setError("");

    try {
      const nextDocuments = await getMyDocuments();
      setDocuments(nextDocuments);
    } catch (nextError) {
      setError(
        nextError instanceof Error
          ? nextError.message
          : "Could not load documents.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadDocuments();
  }, []);

  if (loading) {
    return <AppLoader label="Loading your library..." />;
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Library</Text>
        <Text style={styles.body}>
          Your Supabase-backed documents appear here. This is the starting point
          for the document-first flow.
        </Text>

        <PrimaryButton
          label="Add notes/content"
          onPress={() =>
            Alert.alert(
              "Upload placeholder",
              "This is where the real upload and processing flow will plug in next.",
            )
          }
        />

        {error ? (
          <View style={styles.card}>
            <Text style={styles.error}>{error}</Text>
            <PrimaryButton
              label="Try again"
              variant="secondary"
              onPress={() => {
                void loadDocuments();
              }}
            />
          </View>
        ) : null}

        {documents.length === 0 && !error ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>No documents yet</Text>
            <Text style={styles.body}>
              Once documents are inserted into `source_documents`, they will show
              up here for the current signed-in user.
            </Text>
          </View>
        ) : null}

        {documents.map((document) => (
          <Pressable
            key={document.id}
            style={styles.documentCard}
            onPress={() =>
              router.push({
                pathname: "/document/[documentId]",
                params: { documentId: document.id },
              })
            }
          >
            <Text style={styles.documentTitle}>{document.title}</Text>
            <Text style={styles.documentMeta}>
              {document.file_type || "Unknown type"} · {document.status || "No status"}
            </Text>
            <Text style={styles.documentMeta}>
              {document.created_at
                ? new Date(document.created_at).toLocaleString()
                : "No creation date"}
            </Text>
          </Pressable>
        ))}
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
  body: {
    color: colors.inkMuted,
    fontFamily: fontFamily.body,
    fontSize: 16,
    lineHeight: 22,
  },
  card: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.card,
    padding: 18,
    gap: 12,
  },
  cardTitle: {
    color: colors.ink,
    fontFamily: fontFamily.subheading,
    fontSize: 20,
  },
  error: {
    color: colors.danger,
    fontFamily: fontFamily.bodySemi,
    fontSize: 15,
  },
  documentCard: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.card,
    padding: 18,
    gap: 8,
  },
  documentTitle: {
    color: colors.ink,
    fontFamily: fontFamily.subheading,
    fontSize: 18,
  },
  documentMeta: {
    color: colors.inkMuted,
    fontFamily: fontFamily.body,
    fontSize: 14,
  },
});
