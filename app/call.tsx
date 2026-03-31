import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import * as Speech from 'expo-speech';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CallVisualizer } from '@/src/components/CallVisualizer';
import { colors, fontFamily } from '@/src/constants/uiTheme';
import { useApp } from '@/src/context/AppContext';
import { transcribeAudioAsync, startRecordingAsync, stopRecordingAsync } from '@/src/services/audioService';
import { generateCallSummary, generateExamTurn } from '@/src/services/examEngine';
import type { CallSummary, ConversationTurn } from '@/src/types';

function formatDuration(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, '0');
  const seconds = Math.floor(totalSeconds % 60)
    .toString()
    .padStart(2, '0');
  return `${minutes}:${seconds}`;
}

export default function CallScreen() {
  const { stage, currentDocument, recordStudyAction } = useApp();
  const document = currentDocument;

  const historyRef = useRef<ConversationTurn[]>([]);
  const voiceEnabledRef = useRef(true);
  const startRef = useRef<number>(Date.now());
  const completionLoggedRef = useRef(false);

  const [connecting, setConnecting] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [assistantLine, setAssistantLine] = useState('Connecting to your document-grounded examiner...');
  const [lastAnswer, setLastAnswer] = useState('');
  const [answerDraft, setAnswerDraft] = useState('');
  const [answerSheetVisible, setAnswerSheetVisible] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [transcribing, setTranscribing] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [ended, setEnded] = useState(false);
  const [summary, setSummary] = useState<CallSummary | null>(null);

  useEffect(() => {
    voiceEnabledRef.current = voiceEnabled;
  }, [voiceEnabled]);

  useEffect(() => {
    if (stage !== 'workspace' || !document) {
      router.replace('/home');
    }
  }, [document, stage]);

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startRef.current) / 1000));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const deliverAssistantLine = useCallback((line: string, shouldSpeak = true) => {
    setAssistantLine(line);

    if (!shouldSpeak || !voiceEnabledRef.current) {
      setSpeaking(false);
      return;
    }

    setSpeaking(true);
    Speech.stop();
    Speech.speak(line, {
      language: 'en-US',
      rate: 0.98,
      onDone: () => setSpeaking(false),
      onStopped: () => setSpeaking(false),
      onError: () => setSpeaking(false),
    });
  }, []);

  useEffect(() => {
    let mounted = true;

    async function beginCall() {
      if (!document?.extractedText) {
        return;
      }

      setProcessing(true);
      try {
        const firstTurn = await generateExamTurn({
          mode: 'start',
          notes: document.extractedText,
          history: [],
        });

        if (!mounted) {
          return;
        }

        historyRef.current = [{ role: 'assistant', content: firstTurn }];
        setConnecting(false);
        deliverAssistantLine(firstTurn, true);
      } catch {
        if (!mounted) {
          return;
        }

        setConnecting(false);
        deliverAssistantLine('I am ready. Answer from your notes, and I will keep the oral exam moving.', true);
      } finally {
        if (mounted) {
          setProcessing(false);
        }
      }
    }

    void beginCall();

    return () => {
      mounted = false;
      Speech.stop();
    };
  }, [deliverAssistantLine, document?.extractedText]);

  const statusText = useMemo(() => {
    if (connecting) {
      return 'Connecting';
    }
    if (transcribing) {
      return 'Fallback input mode';
    }
    if (processing) {
      return 'Thinking';
    }
    if (recording) {
      return 'Listening';
    }
    if (speaking) {
      return 'Assistant speaking';
    }
    return 'Waiting for your answer';
  }, [connecting, processing, recording, speaking, transcribing]);

  const finishCall = useCallback(() => {
    if (!document) {
      router.replace('/home');
      return;
    }

    Speech.stop();
    if (recording) {
      recording.stopAndUnloadAsync().catch(() => undefined);
    }

    const nextSummary = generateCallSummary(document.extractedText, historyRef.current);
    setSummary(nextSummary);
    setEnded(true);
  }, [document, recording]);

  const leaveWithSummary = useCallback(() => {
    if (summary && !completionLoggedRef.current) {
      recordStudyAction('call', summary.weakConcepts);
      completionLoggedRef.current = true;
    }
    router.replace('/home');
  }, [recordStudyAction, summary]);

  const submitAnswer = useCallback(
    async (raw: string) => {
      if (!document?.extractedText || processing || connecting || ended) {
        return;
      }

      const cleaned = raw.trim();
      if (!cleaned) {
        return;
      }

      setAnswerDraft('');
      setAnswerSheetVisible(false);
      setLastAnswer(cleaned);
      setProcessing(true);
      setSpeaking(false);

      const nextHistory = [...historyRef.current, { role: 'user', content: cleaned } as ConversationTurn];
      historyRef.current = nextHistory;

      try {
        const assistantTurn = await generateExamTurn({
          mode: 'followup',
          notes: document.extractedText,
          history: nextHistory,
          userAnswer: cleaned,
        });

        historyRef.current = [...nextHistory, { role: 'assistant', content: assistantTurn }];
        deliverAssistantLine(assistantTurn, true);
      } catch {
        deliverAssistantLine('I need a little more detail from the document. Try one more answer grounded in your notes.', true);
      } finally {
        setProcessing(false);
      }
    },
    [connecting, deliverAssistantLine, document?.extractedText, ended, processing],
  );

  const toggleRecording = useCallback(async () => {
    if (processing || connecting || transcribing || ended) {
      return;
    }

    if (recording) {
      try {
        setTranscribing(true);
        const uri = await stopRecordingAsync(recording);
        setRecording(null);

        const transcript = await transcribeAudioAsync(uri);
        if (transcript) {
          await submitAnswer(transcript);
        } else {
          setAnswerSheetVisible(true);
          Alert.alert('Typed fallback active', 'Voice transcription is disabled in the client prototype, so type your answer and send it.');
        }
      } catch (error) {
        setRecording(null);
        Alert.alert('Recording issue', error instanceof Error ? error.message : 'Could not process the recording.');
      } finally {
        setTranscribing(false);
      }
      return;
    }

    try {
      const nextRecording = await startRecordingAsync();
      setRecording(nextRecording);
    } catch (error) {
      Alert.alert('Microphone unavailable', error instanceof Error ? error.message : 'Could not start recording.');
    }
  }, [connecting, ended, processing, recording, submitAnswer, transcribing]);

  if (!document) {
    return (
      <View style={styles.loaderWrap}>
        <ActivityIndicator size="large" color="#FFFFFF" />
      </View>
    );
  }

  if (ended && summary) {
    return (
      <SafeAreaView style={styles.safe}>
        <LinearGradient colors={[colors.callBgA, colors.callBgB]} style={styles.page}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Call summary</Text>
            <Text style={styles.summaryBody}>Only the summary is kept in this prototype flow, not the raw audio or a full transcript.</Text>

            <View style={styles.summarySection}>
              <Text style={styles.summarySectionTitle}>Strengths</Text>
              {summary.strengths.map((item) => (
                <Text key={item} style={styles.summaryItem}>{`\u2022 ${item}`}</Text>
              ))}
            </View>

            <View style={styles.summarySection}>
              <Text style={styles.summarySectionTitle}>Weak concepts</Text>
              {summary.weakConcepts.map((item) => (
                <Text key={item} style={styles.summaryItem}>{`\u2022 ${item}`}</Text>
              ))}
            </View>

            <View style={styles.summarySection}>
              <Text style={styles.summarySectionTitle}>Next move</Text>
              <Text style={styles.summaryItem}>{summary.coachNote}</Text>
            </View>

            <Pressable style={styles.primaryButton} onPress={leaveWithSummary}>
              <Text style={styles.primaryButtonText}>Return to workspace</Text>
            </Pressable>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <LinearGradient colors={[colors.callBgA, colors.callBgB]} style={styles.page}>
        <View style={styles.topRow}>
          <Text style={styles.topText}>{formatDuration(elapsed)}</Text>
          <Text style={styles.topText}>AI oral exam call</Text>
        </View>

        <View style={styles.avatarWrap}>
          <LinearGradient colors={['#F0B44C', '#D86C4D']} style={styles.avatarBubble}>
            <MaterialCommunityIcons name="account-voice" size={86} color="#FFF8EE" />
          </LinearGradient>
          <CallVisualizer active={speaking || processing || transcribing || Boolean(recording)} />
        </View>

        <View style={styles.panel}>
          <Text style={styles.status}>{statusText}</Text>
          <Text style={styles.promptText}>{assistantLine}</Text>
          {lastAnswer ? <Text style={styles.lastAnswer}>You: {lastAnswer}</Text> : null}
        </View>

        <View style={styles.controls}>
          <Pressable
            onPress={() => setVoiceEnabled((prev) => !prev)}
            style={[styles.roundButton, voiceEnabled ? styles.roundNeutral : styles.roundDim]}>
            <Ionicons name={voiceEnabled ? 'volume-high' : 'volume-mute'} size={24} color="#FFFFFF" />
          </Pressable>

          <Pressable onPress={() => setAnswerSheetVisible((prev) => !prev)} style={[styles.roundButton, styles.roundNeutral]}>
            <Ionicons name="create-outline" size={24} color="#FFFFFF" />
          </Pressable>

          <Pressable
            onPress={() => {
              if (speaking) {
                Speech.stop();
                setSpeaking(false);
              }
              void toggleRecording();
            }}
            style={[styles.roundButton, recording ? styles.roundRecording : styles.roundPrimary]}>
            <Ionicons name={recording ? 'stop' : 'mic'} size={24} color="#FFFFFF" />
          </Pressable>
        </View>

        <Pressable onPress={finishCall} style={styles.endCall}>
          <Ionicons name="call" size={26} color="#FFFFFF" style={{ transform: [{ rotate: '135deg' }] }} />
        </Pressable>

        {answerSheetVisible ? (
          <View style={styles.answerSheet}>
            <TextInput
              value={answerDraft}
              onChangeText={setAnswerDraft}
              multiline
              placeholder="Type your answer based only on the uploaded material..."
              placeholderTextColor="#8CA3B8"
              style={styles.input}
              editable={!processing && !connecting}
            />
            <Pressable style={styles.primaryButton} onPress={() => void submitAnswer(answerDraft)}>
              <Text style={styles.primaryButtonText}>Send answer</Text>
            </Pressable>
          </View>
        ) : null}
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.callBgA,
  },
  page: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 22,
    alignItems: 'center',
  },
  topRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  topText: {
    color: '#D9ECF3',
    fontFamily: fontFamily.bodySemi,
    fontSize: 16,
  },
  avatarWrap: {
    marginTop: 34,
    alignItems: 'center',
    gap: 16,
  },
  avatarBubble: {
    width: 220,
    height: 220,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  panel: {
    marginTop: 18,
    width: '100%',
    minHeight: 190,
    borderRadius: 22,
    padding: 16,
    backgroundColor: 'rgba(10, 18, 40, 0.34)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    gap: 10,
  },
  status: {
    color: '#AFC9D8',
    fontFamily: fontFamily.bodySemi,
    fontSize: 15,
  },
  promptText: {
    color: '#FFFFFF',
    fontFamily: fontFamily.body,
    fontSize: 22,
    lineHeight: 30,
  },
  lastAnswer: {
    color: '#D4E3ED',
    fontFamily: fontFamily.body,
    fontSize: 16,
    lineHeight: 22,
  },
  controls: {
    marginTop: 20,
    flexDirection: 'row',
    gap: 12,
  },
  roundButton: {
    width: 64,
    height: 64,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roundNeutral: {
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  roundDim: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  roundPrimary: {
    backgroundColor: '#2A8282',
  },
  roundRecording: {
    backgroundColor: '#D45D4B',
  },
  endCall: {
    marginTop: 18,
    width: 76,
    height: 76,
    borderRadius: 999,
    backgroundColor: '#D45D4B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  answerSheet: {
    width: '100%',
    marginTop: 18,
    borderRadius: 18,
    backgroundColor: '#F5F8FB',
    padding: 12,
    gap: 10,
  },
  input: {
    minHeight: 96,
    color: '#1B2C39',
    fontFamily: fontFamily.body,
    fontSize: 17,
    lineHeight: 23,
    textAlignVertical: 'top',
  },
  summaryCard: {
    marginTop: 32,
    width: '100%',
    borderRadius: 24,
    padding: 18,
    backgroundColor: 'rgba(10,18,40,0.34)',
    gap: 12,
  },
  summaryTitle: {
    color: '#FFFFFF',
    fontFamily: fontFamily.heading,
    fontSize: 32,
  },
  summaryBody: {
    color: '#D4E3ED',
    fontFamily: fontFamily.body,
    fontSize: 16,
    lineHeight: 22,
  },
  summarySection: {
    gap: 6,
  },
  summarySectionTitle: {
    color: '#F0B44C',
    fontFamily: fontFamily.subheading,
    fontSize: 18,
  },
  summaryItem: {
    color: '#E5EEF6',
    fontFamily: fontFamily.body,
    fontSize: 15,
    lineHeight: 21,
  },
  primaryButton: {
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
  loaderWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.callBgA,
  },
});
