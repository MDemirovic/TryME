import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/src/components/PrimaryButton';
import { colors, fontFamily } from '@/src/constants/uiTheme';
import { useApp } from '@/src/context/AppContext';
import { createPastedStudyDocument, pickStudyDocument } from '@/src/services/docxParser';
import type { StudyDocument } from '@/src/types';

function qualityTone(status: StudyDocument['status']) {
  return status === 'ready' ? '#2B8C67' : '#B4682C';
}

export default function LibraryScreen() {
  const { loading, stage, state, currentDocument, setStudyDocument, selectStudyDocument, removeStudyDocument } = useApp();
  const [busy, setBusy] = useState(false);
  const [pastedText, setPastedText] = useState('');
  const [selected, setSelected] = useState<StudyDocument | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    if (!loading && stage !== 'workspace') {
      router.replace('/');
    }
  }, [loading, stage]);

  const documents = useMemo(
    () => [...state.documents].sort((a, b) => +new Date(b.uploadedAt) - +new Date(a.uploadedAt)),
    [state.documents],
  );

  async function importFile() {
    try {
      setBusy(true);
      const document = await pickStudyDocument();
      if (!document) {
        return;
      }
      setStudyDocument(document);
      Alert.alert('Document ready', 'The new document was processed and set as your active study source.');
    } catch (error) {
      Alert.alert('Import problem', error instanceof Error ? error.message : 'Could not prepare the file.');
    } finally {
      setBusy(false);
    }
  }

  function importPastedText() {
    try {
      const document = createPastedStudyDocument(pastedText);
      setStudyDocument(document);
      setPastedText('');
      Alert.alert('Notes saved', 'Your pasted notes are now available in the workspace.');
    } catch (error) {
      Alert.alert('Paste problem', error instanceof Error ? error.message : 'Could not prepare those notes.');
    }
  }

  if (loading || stage !== 'workspace') {
    return (
      <View style={styles.loaderWrap}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Library</Text>
        <Text style={styles.subtitle}>Import notes, switch the active study source, or recover weaker uploads.</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Import methods</Text>
          <Text style={styles.cardBody}>Primary path: PDF, DOCX, TXT, or pasted notes.</Text>
          <PrimaryButton
            label={busy ? 'Importing...' : 'Upload document'}
            onPress={() => {
              void importFile();
            }}
            disabled={busy}
            icon={<Ionicons name="cloud-upload-outline" size={20} color="#FFFFFF" />}
          />
          <TextInput
            value={pastedText}
            onChangeText={setPastedText}
            multiline
            textAlignVertical="top"
            placeholder="Paste notes or a study script here..."
            placeholderTextColor="#8A927C"
            style={styles.textarea}
          />
          <PrimaryButton
            label="Save pasted notes"
            variant="secondary"
            onPress={importPastedText}
            icon={<Ionicons name="document-text-outline" size={20} color={colors.ink} />}
          />
        </View>

        <View style={styles.activeCard}>
          <Text style={styles.cardTitle}>Current active source</Text>
          <Text style={styles.activeName}>{currentDocument?.name ?? 'No active document selected'}</Text>
          <Text style={styles.cardBody}>
            {currentDocument
              ? `${currentDocument.detectedLanguage} • ${currentDocument.wordCount} words • ${currentDocument.studyPack.estimatedStudyMinutes} min study pack`
              : 'Select a document below to drive the workspace.'}
          </Text>
        </View>

        <Text style={styles.sectionTitle}>All documents</Text>
        {documents.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.cardBody}>No documents yet. Add one above and it will appear here.</Text>
          </View>
        ) : (
          documents.map((document) => (
            <Pressable
              key={document.id}
              onPress={() => {
                setSelected(document);
                setModalVisible(true);
              }}
              style={styles.documentCard}>
              <View style={styles.documentTop}>
                <Text style={styles.documentName}>{document.name}</Text>
                {currentDocument?.id === document.id ? (
                  <View style={styles.activeBadge}>
                    <Text style={styles.activeBadgeText}>Active</Text>
                  </View>
                ) : null}
              </View>
              <Text style={styles.documentMeta}>
                {document.fileType.toUpperCase()} • {document.detectedLanguage} • {document.wordCount} words
              </Text>
              <Text style={[styles.documentQuality, { color: qualityTone(document.status) }]}>
                Quality {document.studyPack.qualityScore}/100
              </Text>
              <Text style={styles.documentPreview} numberOfLines={2}>
                {document.studyPack.overview}
              </Text>
            </Pressable>
          ))
        )}
      </ScrollView>

      <Modal transparent visible={modalVisible} animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.overlay}>
          <View style={styles.modalCard}>
            <Text style={styles.cardTitle}>{selected?.name ?? 'Document options'}</Text>
            <Text style={styles.cardBody}>Choose what to do with this source.</Text>

            <PrimaryButton
              label="Set active"
              onPress={() => {
                if (!selected) {
                  return;
                }

                selectStudyDocument(selected.id);
                setModalVisible(false);
              }}
            />

            <PrimaryButton
              label="Open workspace"
              variant="secondary"
              onPress={() => {
                if (!selected) {
                  return;
                }

                selectStudyDocument(selected.id);
                setModalVisible(false);
                router.push('/home');
              }}
            />

            <PrimaryButton
              label="Delete"
              variant="danger"
              onPress={() => {
                if (!selected) {
                  return;
                }

                removeStudyDocument(selected.id);
                setModalVisible(false);
              }}
            />

            <PrimaryButton label="Close" variant="ghost" onPress={() => setModalVisible(false)} />
          </View>
        </View>
      </Modal>
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
    paddingBottom: 30,
    gap: 14,
  },
  title: {
    color: colors.ink,
    fontFamily: fontFamily.heading,
    fontSize: 34,
  },
  subtitle: {
    marginTop: -2,
    color: colors.inkMuted,
    fontFamily: fontFamily.body,
    fontSize: 17,
    lineHeight: 24,
  },
  card: {
    borderRadius: 24,
    padding: 18,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    gap: 12,
  },
  activeCard: {
    borderRadius: 24,
    padding: 18,
    backgroundColor: '#E7F0EA',
    borderWidth: 1,
    borderColor: '#C9DDD5',
    gap: 6,
  },
  cardTitle: {
    color: colors.ink,
    fontFamily: fontFamily.subheading,
    fontSize: 21,
  },
  cardBody: {
    color: colors.inkMuted,
    fontFamily: fontFamily.body,
    fontSize: 15,
    lineHeight: 21,
  },
  activeName: {
    color: colors.ink,
    fontFamily: fontFamily.subheading,
    fontSize: 18,
  },
  textarea: {
    minHeight: 130,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: '#FFFCF7',
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: colors.ink,
    fontFamily: fontFamily.body,
    fontSize: 16,
  },
  sectionTitle: {
    color: colors.ink,
    fontFamily: fontFamily.heading,
    fontSize: 24,
    marginTop: 4,
  },
  emptyCard: {
    borderRadius: 24,
    padding: 18,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
  },
  documentCard: {
    borderRadius: 24,
    padding: 18,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    gap: 6,
  },
  documentTop: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  documentName: {
    flex: 1,
    color: colors.ink,
    fontFamily: fontFamily.subheading,
    fontSize: 18,
  },
  activeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#E7F0EA',
  },
  activeBadgeText: {
    color: '#2B8C67',
    fontFamily: fontFamily.bodySemi,
    fontSize: 12,
  },
  documentMeta: {
    color: colors.inkMuted,
    fontFamily: fontFamily.body,
    fontSize: 14,
  },
  documentQuality: {
    fontFamily: fontFamily.bodySemi,
    fontSize: 14,
  },
  documentPreview: {
    color: colors.ink,
    fontFamily: fontFamily.body,
    fontSize: 15,
    lineHeight: 21,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(22,29,45,0.45)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    borderRadius: 24,
    padding: 18,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    gap: 10,
  },
  loaderWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.page,
  },
});
