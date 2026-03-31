import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { fontFamily } from '@/src/constants/uiTheme';
import { useApp } from '@/src/context/AppContext';
import {
  evaluateQuizAnswer,
  generateQuizQuestions,
  type QuizDifficulty,
  type QuizQuestion,
} from '@/src/services/quizEngine';

interface AnswerRecord {
  questionId: string;
  correct: boolean;
  feedback: string;
}

function parseDifficulty(raw: string | undefined): QuizDifficulty {
  if (raw === 'easy' || raw === 'medium' || raw === 'hard') {
    return raw;
  }
  return 'medium';
}

function parseQuestionCount(raw: string | undefined): number {
  if (raw === '5' || raw === '10' || raw === '20') {
    return Number(raw);
  }
  return 10;
}

export default function QuizScreen() {
  const params = useLocalSearchParams<{ docId?: string; difficulty?: string; count?: string }>();
  const { stage, state, currentDocument, selectStudyDocument, recordStudyAction } = useApp();

  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [inputText, setInputText] = useState('');
  const [pickedOption, setPickedOption] = useState<number | null>(null);
  const [review, setReview] = useState<{ correct: boolean; feedback: string; answerLabel: string } | null>(null);
  const [records, setRecords] = useState<AnswerRecord[]>([]);
  const [completionLogged, setCompletionLogged] = useState(false);

  const difficulty = parseDifficulty(params.difficulty);
  const count = parseQuestionCount(params.count);

  const selectedDocument = useMemo(() => {
    const fromParam = params.docId ? state.documents.find((doc) => doc.id === params.docId) : null;
    return fromParam ?? currentDocument ?? null;
  }, [currentDocument, params.docId, state.documents]);

  useEffect(() => {
    if (stage !== 'workspace') {
      router.replace('/');
    }
  }, [stage]);

  useEffect(() => {
    let mounted = true;

    async function setup() {
      if (!selectedDocument) {
        Alert.alert('No document selected', 'Choose a study source from the library first.');
        router.replace('/library');
        return;
      }

      try {
        const generated = generateQuizQuestions({
          document: selectedDocument,
          difficulty,
          questionCount: count,
        });

        if (!mounted) {
          return;
        }

        selectStudyDocument(selectedDocument.id);
        setQuestions(generated);
      } catch (error) {
        Alert.alert('Quiz setup failed', error instanceof Error ? error.message : 'Could not generate a quiz.');
        router.replace('/library');
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    void setup();

    return () => {
      mounted = false;
    };
  }, [count, difficulty, selectStudyDocument, selectedDocument]);

  useEffect(() => {
    if (!loading && !completionLogged && questions.length > 0 && index >= questions.length && selectedDocument) {
      recordStudyAction('quiz', selectedDocument.studyPack.weakTopicSuggestions.slice(0, 2));
      setCompletionLogged(true);
    }
  }, [completionLogged, index, loading, questions.length, recordStudyAction, selectedDocument]);

  const current = questions[index];
  const progress = questions.length > 0 ? (index + 1) / questions.length : 0;

  function submitAnswer() {
    if (!current) {
      return;
    }

    let answerValue: string | number;
    if (current.type === 'multiple') {
      if (typeof pickedOption !== 'number') {
        return;
      }
      answerValue = pickedOption;
    } else {
      const trimmed = inputText.trim();
      if (!trimmed) {
        return;
      }
      answerValue = trimmed;
    }

    const result = evaluateQuizAnswer(current, answerValue);
    setScore((prev) => prev + result.scoreDelta);
    setRecords((prev) => [...prev, { questionId: current.id, correct: result.correct, feedback: result.feedback }]);

    const answerLabel =
      current.type === 'multiple'
        ? current.options[current.correctOptionIndex]
        : current.type === 'fill_blank'
          ? current.expectedAnswer
          : current.reference;

    setReview({
      correct: result.correct,
      feedback: result.feedback,
      answerLabel,
    });
  }

  function goNext() {
    setReview(null);
    setInputText('');
    setPickedOption(null);
    setIndex((prev) => prev + 1);
  }

  if (loading) {
    return (
      <View style={styles.loaderWrap}>
        <ActivityIndicator size="large" color="#FFFFFF" />
      </View>
    );
  }

  if (!current) {
    const correctAnswers = records.filter((record) => record.correct).length;
    const percentage = records.length > 0 ? Math.round((correctAnswers / records.length) * 100) : 0;

    return (
      <SafeAreaView style={styles.safe}>
        <LinearGradient colors={['#17345F', '#0E4C55']} style={styles.page}>
          <View style={styles.resultCard}>
            <Text style={styles.resultTitle}>Quiz complete</Text>
            <Text style={styles.resultScore}>Score {score}</Text>
            <Text style={styles.resultMeta}>Accuracy {percentage}%</Text>
            <Text style={styles.resultMeta}>
              {selectedDocument?.studyPack.quizTargets.slice(0, 3).join(' • ') ?? 'Stay grounded in your document.'}
            </Text>

            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Recommended next focus</Text>
              {(selectedDocument?.studyPack.weakTopicSuggestions ?? []).slice(0, 3).map((item) => (
                <Text key={item} style={styles.summaryItem}>{`\u2022 ${item}`}</Text>
              ))}
            </View>

            <Pressable
              style={styles.primaryButton}
              onPress={() => {
                if (!selectedDocument) {
                  router.replace('/library');
                  return;
                }

                router.replace({
                  pathname: '/quiz',
                  params: {
                    docId: selectedDocument.id,
                    difficulty,
                    count: `${count}`,
                  },
                });
              }}>
              <Text style={styles.primaryButtonText}>Run another quiz</Text>
            </Pressable>

            <Pressable style={styles.secondaryButton} onPress={() => router.replace('/home')}>
              <Text style={styles.secondaryButtonText}>Back to workspace</Text>
            </Pressable>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <LinearGradient colors={['#17345F', '#0E4C55']} style={styles.page}>
        <View style={styles.topRow}>
          <Pressable onPress={() => router.replace('/home')} style={styles.iconButton}>
            <Ionicons name="close" size={22} color="#F0F6FF" />
          </Pressable>
          <Text style={styles.topText}>
            Question {index + 1}/{questions.length}
          </Text>
          <Text style={styles.topText}>Score {score}</Text>
        </View>

        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${Math.max(progress * 100, 8)}%` }]} />
        </View>

        <ScrollView style={styles.centerArea} contentContainerStyle={styles.centerContent}>
          <Text style={styles.typeLabel}>
            {current.type === 'multiple' ? 'MULTIPLE CHOICE' : current.type === 'fill_blank' ? 'FILL IN' : 'SHORT ANSWER'}
          </Text>
          <Text style={styles.questionText}>{current.prompt}</Text>

          {current.type === 'multiple' ? (
            <View style={styles.answersWrap}>
              {current.options.map((option, optionIndex) => (
                <Pressable
                  key={`${current.id}-${optionIndex}`}
                  onPress={() => setPickedOption(optionIndex)}
                  style={[styles.answerOption, pickedOption === optionIndex ? styles.answerOptionSelected : null]}>
                  <Text style={styles.answerLabel}>{String.fromCharCode(65 + optionIndex)}</Text>
                  <Text style={styles.answerText}>{option}</Text>
                </Pressable>
              ))}
            </View>
          ) : (
            <TextInput
              multiline
              value={inputText}
              onChangeText={setInputText}
              placeholder={current.type === 'fill_blank' ? 'Type the missing term...' : 'Answer using only the document...'}
              placeholderTextColor="#A8C0CF"
              style={styles.input}
            />
          )}
        </ScrollView>

        {review ? (
          <View style={styles.reviewCard}>
            <Text style={[styles.reviewTitle, review.correct ? styles.reviewGood : styles.reviewBad]}>
              {review.correct ? 'Strong answer' : 'Needs one more pass'}
            </Text>
            <Text style={styles.reviewText}>{review.feedback}</Text>
            {!review.correct ? <Text style={styles.reviewExpected}>Expected anchor: {review.answerLabel}</Text> : null}
            <Pressable style={styles.primaryButton} onPress={goNext}>
              <Text style={styles.primaryButtonText}>Next question</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable
            style={styles.primaryButton}
            onPress={submitAnswer}
            disabled={current.type === 'multiple' ? pickedOption === null : inputText.trim().length === 0}>
            <Text style={styles.primaryButtonText}>Submit answer</Text>
          </Pressable>
        )}
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#17345F',
  },
  page: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  topRow: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topText: {
    color: '#E5EEF6',
    fontFamily: fontFamily.bodySemi,
    fontSize: 14,
  },
  progressTrack: {
    marginTop: 12,
    height: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.16)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#F0B44C',
    borderRadius: 999,
  },
  centerArea: {
    flex: 1,
    marginTop: 18,
  },
  centerContent: {
    gap: 14,
    paddingBottom: 24,
  },
  typeLabel: {
    color: '#BFD4DF',
    fontFamily: fontFamily.bodySemi,
    fontSize: 12,
    letterSpacing: 1,
  },
  questionText: {
    color: '#FFFFFF',
    fontFamily: fontFamily.heading,
    fontSize: 28,
    lineHeight: 34,
  },
  answersWrap: {
    gap: 10,
  },
  answerOption: {
    borderRadius: 18,
    padding: 14,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    flexDirection: 'row',
    gap: 10,
  },
  answerOptionSelected: {
    backgroundColor: 'rgba(240,180,76,0.18)',
    borderColor: '#F0B44C',
  },
  answerLabel: {
    color: '#F0D08F',
    fontFamily: fontFamily.subheading,
    fontSize: 18,
  },
  answerText: {
    flex: 1,
    color: '#E9F3F7',
    fontFamily: fontFamily.body,
    fontSize: 17,
    lineHeight: 23,
  },
  input: {
    minHeight: 150,
    borderRadius: 18,
    padding: 14,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    color: '#FFFFFF',
    fontFamily: fontFamily.body,
    fontSize: 17,
    lineHeight: 23,
    textAlignVertical: 'top',
  },
  reviewCard: {
    gap: 10,
    padding: 14,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  reviewTitle: {
    fontFamily: fontFamily.subheading,
    fontSize: 20,
  },
  reviewGood: {
    color: '#8EE2B2',
  },
  reviewBad: {
    color: '#FFD3A1',
  },
  reviewText: {
    color: '#E5EEF6',
    fontFamily: fontFamily.body,
    fontSize: 16,
    lineHeight: 22,
  },
  reviewExpected: {
    color: '#C6D9E4',
    fontFamily: fontFamily.body,
    fontSize: 14,
    lineHeight: 20,
  },
  resultCard: {
    marginTop: 34,
    borderRadius: 24,
    padding: 18,
    backgroundColor: 'rgba(255,255,255,0.12)',
    gap: 10,
  },
  resultTitle: {
    color: '#FFFFFF',
    fontFamily: fontFamily.heading,
    fontSize: 34,
  },
  resultScore: {
    color: '#F0B44C',
    fontFamily: fontFamily.subheading,
    fontSize: 28,
  },
  resultMeta: {
    color: '#E5EEF6',
    fontFamily: fontFamily.body,
    fontSize: 16,
    lineHeight: 22,
  },
  summaryCard: {
    borderRadius: 18,
    padding: 14,
    backgroundColor: 'rgba(255,255,255,0.08)',
    gap: 8,
  },
  summaryTitle: {
    color: '#FFFFFF',
    fontFamily: fontFamily.subheading,
    fontSize: 18,
  },
  summaryItem: {
    color: '#D8E6F0',
    fontFamily: fontFamily.body,
    fontSize: 15,
    lineHeight: 21,
  },
  primaryButton: {
    marginTop: 8,
    height: 54,
    borderRadius: 999,
    backgroundColor: '#F0B44C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#213147',
    fontFamily: fontFamily.subheading,
    fontSize: 18,
  },
  secondaryButton: {
    height: 52,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: '#FFFFFF',
    fontFamily: fontFamily.subheading,
    fontSize: 17,
  },
  loaderWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#17345F',
  },
});
