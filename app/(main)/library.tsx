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
import type { QuizDifficulty } from '@/src/services/quizEngine';

function routeForStage(stage: ReturnType<typeof useApp>['stage']) {
  if (stage === 'auth') {
    return '/';
  }
  if (stage === 'paywall') {
    return '/paywall';
  }
  if (stage === 'goal') {
    return '/goal';
  }
  return '/home';
}

export default function LibraryTabScreen() {
  const { loading, stage, state, setStudyDocument, selectStudyDocument, removeStudyDocument } = useApp();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pastedText, setPastedText] = useState('');

  const [selectedDoc, setSelectedDoc] = useState<StudyDocument | null>(null);
  const [fileActionVisible, setFileActionVisible] = useState(false);
  const [quizSetupVisible, setQuizSetupVisible] = useState(false);
  const [difficulty, setDifficulty] = useState<QuizDifficulty>('medium');
  const [questionCount, setQuestionCount] = useState<5 | 10 | 20>(10);

  useEffect(() => {
    if (!loading && stage !== 'home') {
      router.replace(routeForStage(stage));
    }
  }, [loading, stage]);

  const sortedDocuments = useMemo(
    () => [...state.documents].sort((a, b) => +new Date(b.uploadedAt) - +new Date(a.uploadedAt)),
    [state.documents],
  );

  if (loading || stage !== 'home') {
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
        <Text style={styles.subtitle}>History of uploaded notes + create new source</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Create New File</Text>
          <Text style={styles.cardBody}>Upload `.docx`, `.pdf`, `.doc`, `.txt` or paste plain text.</Text>

          <PrimaryButton
            label={busy ? 'Importing...' : 'Upload File'}
            disabled={busy}
            onPress={async () => {
              setBusy(true);
              setError(null);
              try {
                const document = await pickStudyDocument();
                if (!document) {
                  return;
                }
                setStudyDocument(document);
                Alert.alert('Saved', 'File imported and added to your library history.');
              } catch (importError) {
                setError(importError instanceof Error ? importError.message : 'Could not import file.');
              } finally {
                setBusy(false);
              }
            }}
            icon={<Ionicons name="document-attach-outline" size={20} color="#FFFFFF" />}
          />

          <TextInput
            value={pastedText}
            onChangeText={setPastedText}
            multiline
            style={styles.input}
            placeholder="Or paste plain text notes here..."
            placeholderTextColor="#8B95B8"
          />

          <PrimaryButton
            label="Save Pasted Notes"
            onPress={() => {
              try {
                setError(null);
                const document = createPastedStudyDocument(pastedText);
                setStudyDocument(document);
                setPastedText('');
                Alert.alert('Saved', 'Pasted notes added to your library history.');
              } catch (pasteError) {
                setError(pasteError instanceof Error ? pasteError.message : 'Could not save pasted notes.');
              }
            }}
            icon={<Ionicons name="clipboard-outline" size={20} color="#FFFFFF" />}
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}
        </View>

        <Text style={styles.sectionTitle}>History</Text>
        {sortedDocuments.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No files yet. Create one above and it will appear here.</Text>
          </View>
        ) : (
          sortedDocuments.map((doc) => {
            const isActive = state.document?.id === doc.id;
            return (
              <Pressable
                key={doc.id}
                onPress={() => {
                  setSelectedDoc(doc);
                  setFileActionVisible(true);
                }}
                style={styles.docCard}>
                <View style={styles.docHeader}>
                  <Text style={styles.docName}>{doc.name}</Text>
                  <View style={[styles.badge, isActive ? styles.badgeActive : null]}>
                    <Text style={[styles.badgeText, isActive ? styles.badgeTextActive : null]}>
                      {isActive ? 'Active' : doc.fileType.toUpperCase()}
                    </Text>
                  </View>
                </View>
                <Text style={styles.docMeta}>
                  {doc.extractedText.split(/\s+/).length} words • {new Date(doc.uploadedAt).toLocaleString()}
                </Text>
              </Pressable>
            );
          })
        )}
      </ScrollView>

      <Modal transparent visible={fileActionVisible} animationType="fade" onRequestClose={() => setFileActionVisible(false)}>
        <View style={styles.overlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{selectedDoc?.name ?? 'Selected file'}</Text>
            <Text style={styles.modalSub}>Choose what you want to do.</Text>

            <PrimaryButton
              label="Start AI Call"
              onPress={() => {
                if (!selectedDoc) {
                  return;
                }
                selectStudyDocument(selectedDoc.id);
                setFileActionVisible(false);
                router.push('/call');
              }}
              icon={<Ionicons name="call-outline" size={20} color="#FFFFFF" />}
            />

            <PrimaryButton
              label="Quiz Game"
              variant="secondary"
              onPress={() => {
                if (!selectedDoc) {
                  return;
                }
                selectStudyDocument(selectedDoc.id);
                setFileActionVisible(false);
                setQuizSetupVisible(true);
              }}
              icon={<Ionicons name="help-circle-outline" size={20} color={colors.inkMuted} />}
            />

            <PrimaryButton
              label="Delete File"
              variant="ghost"
              textStyle={{ color: colors.danger }}
              onPress={() => {
                if (!selectedDoc) {
                  return;
                }
                removeStudyDocument(selectedDoc.id);
                setFileActionVisible(false);
              }}
            />

            <PrimaryButton label="Close" variant="ghost" onPress={() => setFileActionVisible(false)} />
          </View>
        </View>
      </Modal>

      <Modal transparent visible={quizSetupVisible} animationType="fade" onRequestClose={() => setQuizSetupVisible(false)}>
        <View style={styles.overlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Quiz Setup</Text>
            <Text style={styles.modalSub}>Pick difficulty and number of questions.</Text>

            <Text style={styles.groupLabel}>Difficulty</Text>
            <View style={styles.chipRow}>
              {(['easy', 'medium', 'hard'] as QuizDifficulty[]).map((value) => (
                <Pressable
                  key={value}
                  onPress={() => setDifficulty(value)}
                  style={[styles.chip, difficulty === value ? styles.chipActive : null]}>
                  <Text style={[styles.chipText, difficulty === value ? styles.chipTextActive : null]}>
                    {value.toUpperCase()}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.groupLabel}>Questions</Text>
            <View style={styles.chipRow}>
              {[5, 10, 20].map((value) => (
                <Pressable
                  key={value}
                  onPress={() => setQuestionCount(value as 5 | 10 | 20)}
                  style={[styles.chip, questionCount === value ? styles.chipActive : null]}>
                  <Text style={[styles.chipText, questionCount === value ? styles.chipTextActive : null]}>
                    {value}
                  </Text>
                </Pressable>
              ))}
            </View>

            <PrimaryButton
              label="Start Quiz"
              onPress={() => {
                if (!selectedDoc) {
                  setQuizSetupVisible(false);
                  return;
                }

                setQuizSetupVisible(false);
                router.push({
                  pathname: '/quiz',
                  params: {
                    docId: selectedDoc.id,
                    difficulty,
                    count: `${questionCount}`,
                  },
                });
              }}
              icon={<Ionicons name="play-outline" size={20} color="#FFFFFF" />}
            />
            <PrimaryButton label="Cancel" variant="ghost" onPress={() => setQuizSetupVisible(false)} />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F4F7FF',
  },
  content: {
    padding: 20,
    paddingBottom: 30,
    gap: 12,
  },
  title: {
    color: colors.ink,
    fontFamily: fontFamily.heading,
    fontSize: 34,
  },
  subtitle: {
    marginTop: -4,
    color: colors.inkMuted,
    fontFamily: fontFamily.body,
    fontSize: 18,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E5EAF7',
    padding: 16,
    gap: 10,
  },
  cardTitle: {
    color: colors.ink,
    fontFamily: fontFamily.subheading,
    fontSize: 24,
  },
  cardBody: {
    color: colors.inkMuted,
    fontFamily: fontFamily.body,
    fontSize: 16,
  },
  input: {
    minHeight: 130,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#D9E0F6',
    backgroundColor: '#F7F9FF',
    padding: 12,
    color: '#1A1F35',
    fontSize: 17,
    fontFamily: fontFamily.body,
    lineHeight: 24,
    textAlignVertical: 'top',
  },
  error: {
    color: '#C24558',
    fontFamily: fontFamily.bodySemi,
    fontSize: 16,
  },
  sectionTitle: {
    color: colors.ink,
    fontFamily: fontFamily.heading,
    fontSize: 30,
    marginTop: 8,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E5EAF7',
    padding: 16,
  },
  emptyText: {
    color: '#6B769F',
    fontFamily: fontFamily.body,
    fontSize: 17,
    lineHeight: 24,
  },
  docCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E5EAF7',
    padding: 14,
    gap: 8,
  },
  docHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  docName: {
    flex: 1,
    color: colors.ink,
    fontFamily: fontFamily.subheading,
    fontSize: 18,
  },
  docMeta: {
    color: '#69759F',
    fontFamily: fontFamily.body,
    fontSize: 14,
  },
  badge: {
    backgroundColor: '#EEF2FF',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  badgeActive: {
    backgroundColor: '#E9F8E6',
  },
  badgeText: {
    color: '#4965E0',
    fontFamily: fontFamily.bodySemi,
    fontSize: 12,
  },
  badgeTextActive: {
    color: '#2C6A22',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(14, 21, 51, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    padding: 16,
    gap: 10,
  },
  modalTitle: {
    color: colors.ink,
    fontFamily: fontFamily.subheading,
    fontSize: 24,
  },
  modalSub: {
    color: colors.inkMuted,
    fontFamily: fontFamily.body,
    fontSize: 16,
    marginBottom: 4,
  },
  groupLabel: {
    color: '#39456D',
    fontFamily: fontFamily.bodySemi,
    fontSize: 14,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: 2,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 4,
  },
  chip: {
    flex: 1,
    minHeight: 40,
    borderRadius: 999,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipActive: {
    backgroundColor: '#4364F5',
  },
  chipText: {
    color: '#4257B8',
    fontFamily: fontFamily.bodySemi,
    fontSize: 13,
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  loaderWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.page,
  },
});
