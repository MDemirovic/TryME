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
  const params = useLocalSearchParams<{
    docId?: string;
    difficulty?: string;
    count?: string;
  }>();
  const { state, selectStudyDocument } = useApp();

  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [inputText, setInputText] = useState('');
  const [pickedOption, setPickedOption] = useState<number | null>(null);
  const [review, setReview] = useState<{
    correct: boolean;
    feedback: string;
    answerLabel: string;
  } | null>(null);
  const [records, setRecords] = useState<AnswerRecord[]>([]);

  const selectedDocument = useMemo(() => {
    const fromParam = params.docId ? state.documents.find((doc) => doc.id === params.docId) : null;
    return fromParam ?? state.document ?? null;
  }, [params.docId, state.document, state.documents]);

  const difficulty = parseDifficulty(params.difficulty);
  const count = parseQuestionCount(params.count);

  useEffect(() => {
    let mounted = true;
    async function setup() {
      if (!selectedDocument) {
        Alert.alert('No notes selected', 'Please select a file from Library first.');
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
        Alert.alert('Quiz setup failed', error instanceof Error ? error.message : 'Could not generate quiz.');
        router.replace('/library');
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    setup();
    return () => {
      mounted = false;
    };
  }, [count, difficulty, selectStudyDocument, selectedDocument]);

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
    const wrongAnswers = records.length - correctAnswers;
    const percentage = records.length > 0 ? Math.round((correctAnswers / records.length) * 100) : 0;

    return (
      <SafeAreaView style={styles.safe}>
        <LinearGradient colors={['#06114B', '#160D5E']} style={styles.page}>
          <View style={styles.resultCard}>
            <Text style={styles.resultTitle}>Quiz Finished</Text>
            <Text style={styles.resultScore}>Score: {score}</Text>
            <Text style={styles.resultMeta}>Correct: {correctAnswers}</Text>
            <Text style={styles.resultMeta}>Wrong: {wrongAnswers}</Text>
            <Text style={styles.resultMeta}>Accuracy: {percentage}%</Text>

            <Text style={styles.resultHint}>
              Review your weak points and repeat the quiz for stronger retention.
            </Text>

            <Pressable
              style={styles.resultButton}
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
              <Text style={styles.resultButtonText}>Play Again</Text>
            </Pressable>

            <Pressable style={[styles.resultButton, styles.resultButtonSecondary]} onPress={() => router.replace('/library')}>
              <Text style={[styles.resultButtonText, styles.resultButtonTextSecondary]}>Back to Library</Text>
            </Pressable>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <LinearGradient colors={['#06114B', '#160D5E']} style={styles.page}>
        <View style={styles.topRow}>
          <Pressable onPress={() => router.replace('/library')} style={styles.backButton}>
            <Ionicons name="close" size={24} color="#E6EAFF" />
          </Pressable>
          <Text style={styles.roundText}>
            Round {index + 1}/{questions.length}
          </Text>
          <Text style={styles.scoreText}>Score {score}</Text>
        </View>

        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${Math.max(progress * 100, 8)}%` }]} />
        </View>

        <ScrollView style={styles.centerArea} contentContainerStyle={styles.centerContent}>
          <Text style={styles.typeLabel}>
            {current.type === 'multiple'
              ? 'MULTIPLE CHOICE'
              : current.type === 'fill_blank'
              ? 'FILL IN THE BLANK'
              : 'DEFINITION'}
          </Text>
          <Text style={styles.questionText}>{current.prompt}</Text>

          {current.type === 'multiple' ? (
            <View style={styles.answersWrap}>
              {current.options.map((option, optionIndex) => (
                <Pressable
                  key={`${current.id}-${optionIndex}`}
                  onPress={() => setPickedOption(optionIndex)}
                  style={[
                    styles.answerOption,
                    pickedOption === optionIndex ? styles.answerOptionSelected : null,
                  ]}>
                  <Text style={styles.answerLabel}>{String.fromCharCode(65 + optionIndex)}</Text>
                  <Text style={styles.answerText}>{option}</Text>
                </Pressable>
              ))}
            </View>
          ) : (
            <View style={styles.inputWrap}>
              <TextInput
                multiline
                value={inputText}
                onChangeText={setInputText}
                placeholder={
                  current.type === 'fill_blank'
                    ? 'Type the missing term...'
                    : 'Write your definition based only on your notes...'
                }
                placeholderTextColor="#9AA4CC"
                style={styles.input}
              />
            </View>
          )}
        </ScrollView>

        {review ? (
          <View style={styles.reviewCard}>
            <Text style={[styles.reviewTitle, review.correct ? styles.reviewCorrect : styles.reviewWrong]}>
              {review.correct ? 'Correct' : 'Not Correct'}
            </Text>
            <Text style={styles.reviewFeedback}>{review.feedback}</Text>
            {!review.correct ? <Text style={styles.reviewAnswer}>Expected: {review.answerLabel}</Text> : null}
            <Pressable style={styles.nextButton} onPress={goNext}>
              <Text style={styles.nextButtonText}>Next Round</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable
            style={styles.submitButton}
            onPress={submitAnswer}
            disabled={current.type === 'multiple' ? pickedOption === null : inputText.trim().length === 0}>
            <Text style={styles.submitText}>Lock Answer</Text>
          </Pressable>
        )}
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#06114B',
  },
  page: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  roundText: {
    color: '#D9E0FF',
    fontFamily: fontFamily.bodySemi,
    fontSize: 14,
  },
  scoreText: {
    color: '#D9E0FF',
    fontFamily: fontFamily.bodySemi,
    fontSize: 14,
  },
  progressTrack: {
    marginTop: 10,
    height: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.16)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#40D58A',
    borderRadius: 999,
  },
  centerArea: {
    flex: 1,
    marginTop: 16,
  },
  centerContent: {
    paddingBottom: 24,
    gap: 12,
  },
  typeLabel: {
    color: '#A8B7FF',
    fontFamily: fontFamily.bodySemi,
    fontSize: 12,
    letterSpacing: 0.7,
  },
  questionText: {
    color: '#FFFFFF',
    fontFamily: fontFamily.heading,
    fontSize: 30,
    lineHeight: 37,
  },
  answersWrap: {
    marginTop: 6,
    gap: 10,
  },
  answerOption: {
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.13)',
    padding: 12,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  answerOptionSelected: {
    borderColor: '#69A6FF',
    backgroundColor: 'rgba(105,166,255,0.2)',
  },
  answerLabel: {
    color: '#A7BAFF',
    fontFamily: fontFamily.heading,
    fontSize: 18,
    marginTop: 1,
  },
  answerText: {
    flex: 1,
    color: '#E9EDFF',
    fontFamily: fontFamily.body,
    fontSize: 18,
    lineHeight: 24,
  },
  inputWrap: {
    marginTop: 8,
  },
  input: {
    minHeight: 140,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    color: '#FFFFFF',
    fontFamily: fontFamily.body,
    fontSize: 18,
    lineHeight: 24,
    padding: 12,
    textAlignVertical: 'top',
  },
  submitButton: {
    marginTop: 8,
    height: 54,
    borderRadius: 999,
    backgroundColor: '#F6C730',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitText: {
    color: '#202D60',
    fontFamily: fontFamily.subheading,
    fontSize: 20,
  },
  reviewCard: {
    marginTop: 8,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    padding: 12,
    gap: 8,
  },
  reviewTitle: {
    fontFamily: fontFamily.subheading,
    fontSize: 20,
  },
  reviewCorrect: {
    color: '#67E3A3',
  },
  reviewWrong: {
    color: '#FF8C9F',
  },
  reviewFeedback: {
    color: '#DCE4FF',
    fontFamily: fontFamily.body,
    fontSize: 16,
    lineHeight: 22,
  },
  reviewAnswer: {
    color: '#BBC7FF',
    fontFamily: fontFamily.body,
    fontSize: 14,
    lineHeight: 20,
  },
  nextButton: {
    height: 46,
    borderRadius: 999,
    backgroundColor: '#4B6DFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontFamily: fontFamily.subheading,
    fontSize: 17,
  },
  resultCard: {
    marginTop: 36,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    padding: 18,
    gap: 8,
  },
  resultTitle: {
    color: '#FFFFFF',
    fontFamily: fontFamily.heading,
    fontSize: 36,
  },
  resultScore: {
    color: '#F5CB3C',
    fontFamily: fontFamily.subheading,
    fontSize: 26,
  },
  resultMeta: {
    color: '#DBE3FF',
    fontFamily: fontFamily.body,
    fontSize: 18,
  },
  resultHint: {
    marginTop: 4,
    color: '#B8C4F8',
    fontFamily: fontFamily.body,
    fontSize: 16,
    lineHeight: 22,
  },
  resultButton: {
    marginTop: 10,
    height: 52,
    borderRadius: 999,
    backgroundColor: '#F6C730',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultButtonSecondary: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    marginTop: 0,
  },
  resultButtonText: {
    color: '#202D60',
    fontFamily: fontFamily.subheading,
    fontSize: 18,
  },
  resultButtonTextSecondary: {
    color: '#E4EAFF',
  },
  loaderWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#06114B',
  },
});
