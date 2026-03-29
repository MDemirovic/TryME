import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import * as Speech from 'expo-speech';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CallVisualizer } from '@/src/components/CallVisualizer';
import { colors, fontFamily } from '@/src/constants/uiTheme';
import { useApp } from '@/src/context/AppContext';
import { transcribeAudioAsync, startRecordingAsync, stopRecordingAsync } from '@/src/services/audioService';
import { generateExamTurn } from '@/src/services/examEngine';
import type { ConversationTurn } from '@/src/types';

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
  const { loading, state } = useApp();
  const document = state.document;

  const historyRef = useRef<ConversationTurn[]>([]);

  const [connecting, setConnecting] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);

  const [assistantLine, setAssistantLine] = useState('Connecting to your examiner...');
  const [lastAnswer, setLastAnswer] = useState('');
  const [answerDraft, setAnswerDraft] = useState('');
  const [answerSheetVisible, setAnswerSheetVisible] = useState(false);

  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [transcribing, setTranscribing] = useState(false);

  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef<number>(Date.now());
  const voiceEnabledRef = useRef(true);

  useEffect(() => {
    voiceEnabledRef.current = voiceEnabled;
  }, [voiceEnabled]);

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startRef.current) / 1000));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const endCall = useCallback(() => {
    Speech.stop();
    if (recording) {
      recording.stopAndUnloadAsync().catch(() => undefined);
    }
    router.replace('/home');
  }, [recording]);

  useEffect(() => {
    if (!loading && !document) {
      router.replace('/home');
    }
  }, [loading, document]);

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

        const initHistory: ConversationTurn[] = [{ role: 'assistant', content: firstTurn }];
        historyRef.current = initHistory;
        setConnecting(false);
        deliverAssistantLine(firstTurn, true);
      } catch {
        if (mounted) {
          setConnecting(false);
          deliverAssistantLine(
            'I am ready. Please answer when you are ready, and I will continue your oral exam practice.',
            true,
          );
        }
      } finally {
        if (mounted) {
          setProcessing(false);
        }
      }
    }

    beginCall();

    return () => {
      mounted = false;
      Speech.stop();
    };
  }, [deliverAssistantLine, document?.extractedText]);

  const submitAnswer = useCallback(
    async (raw: string) => {
      if (!document?.extractedText || processing || connecting) {
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

      const withUser: ConversationTurn[] = [...historyRef.current, { role: 'user', content: cleaned }];
      historyRef.current = withUser;

      try {
        const assistantTurn = await generateExamTurn({
          mode: 'followup',
          notes: document.extractedText,
          history: withUser,
          userAnswer: cleaned,
        });

        const nextHistory = [
          ...withUser,
          { role: 'assistant', content: assistantTurn } as ConversationTurn,
        ];
        historyRef.current = nextHistory;
        deliverAssistantLine(assistantTurn, true);
      } catch {
        deliverAssistantLine(
          'I did not catch that fully. Please try answering again based on your notes.',
          true,
        );
      } finally {
        setProcessing(false);
      }
    },
    [connecting, deliverAssistantLine, document?.extractedText, processing],
  );

  const toggleRecording = useCallback(async () => {
    if (processing || connecting || transcribing) {
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
          Alert.alert(
            'Transcription unavailable',
            'Voice transcript requires EXPO_PUBLIC_OPENAI_API_KEY. Type your answer and send.',
          );
        }
      } catch (error) {
        setRecording(null);
        Alert.alert(
          'Recording error',
          error instanceof Error ? error.message : 'Could not process your recording.',
        );
      } finally {
        setTranscribing(false);
      }
      return;
    }

    try {
      const activeRecording = await startRecordingAsync();
      setRecording(activeRecording);
    } catch (error) {
      Alert.alert(
        'Microphone unavailable',
        error instanceof Error ? error.message : 'Could not start recording.',
      );
    }
  }, [connecting, processing, recording, submitAnswer, transcribing]);

  const statusText = useMemo(() => {
    if (connecting) {
      return 'Connecting...';
    }
    if (transcribing) {
      return 'Transcribing your answer...';
    }
    if (processing) {
      return 'Examiner is thinking...';
    }
    if (recording) {
      return 'Recording your answer...';
    }
    return 'Listening for your answer';
  }, [connecting, processing, recording, transcribing]);

  if (loading || !document) {
    return (
      <View style={styles.loaderWrap}>
        <ActivityIndicator size="large" color="#FFFFFF" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <LinearGradient colors={[colors.callBgA, colors.callBgB]} style={styles.page}>
        <View style={styles.topRow}>
          <Text style={styles.topText}>{formatDuration(elapsed)}</Text>
          <Text style={styles.topText}>Oral Exam Call</Text>
        </View>

        <View style={styles.avatarWrap}>
          <LinearGradient colors={['#B183FF', '#6742E0']} style={styles.avatarBubble}>
            <MaterialCommunityIcons name="account-voice" size={88} color="#F7EEFF" />
          </LinearGradient>
          <CallVisualizer active={speaking || processing || transcribing} />
        </View>

        <View style={styles.panel}>
          <Text style={styles.status}>{statusText}</Text>
          <Text style={styles.promptText}>{assistantLine}</Text>
          {lastAnswer ? (
            <Text style={styles.lastAnswer}>
              You: {lastAnswer.length > 120 ? `${lastAnswer.slice(0, 120)}...` : lastAnswer}
            </Text>
          ) : null}
        </View>

        <View style={styles.controls}>
          <Pressable
            onPress={() => {
              setVoiceEnabled((prev) => !prev);
            }}
            style={[styles.roundButton, voiceEnabled ? styles.roundNeutral : styles.roundOff]}>
            <Ionicons name={voiceEnabled ? 'volume-high' : 'volume-mute'} size={24} color="#FFFFFF" />
          </Pressable>

          <Pressable
            onPress={() => setAnswerSheetVisible((prev) => !prev)}
            style={[styles.roundButton, styles.roundNeutral]}>
            <Ionicons name="create-outline" size={24} color="#FFFFFF" />
          </Pressable>

          <Pressable
            onPress={toggleRecording}
            style={[styles.roundButton, recording ? styles.roundRecording : styles.roundPrimary]}>
            <Ionicons name={recording ? 'stop' : 'mic'} size={24} color="#FFFFFF" />
          </Pressable>
        </View>

        <Pressable onPress={endCall} style={styles.endCall}>
          <Ionicons name="call" size={26} color="#FFFFFF" style={{ transform: [{ rotate: '135deg' }] }} />
        </Pressable>

        {answerSheetVisible ? (
          <View style={styles.answerSheet}>
            <TextInput
              placeholder="Type your answer"
              placeholderTextColor="#8A92B6"
              style={styles.input}
              value={answerDraft}
              onChangeText={setAnswerDraft}
              multiline
              editable={!processing && !connecting}
            />
            <Pressable
              onPress={() => submitAnswer(answerDraft)}
              style={[styles.sendButton, processing || connecting ? styles.sendDisabled : null]}
              disabled={processing || connecting}>
              <Text style={styles.sendText}>Send Answer</Text>
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
    color: '#DDE2FF',
    fontFamily: fontFamily.bodySemi,
    fontSize: 16,
  },
  avatarWrap: {
    marginTop: 34,
    alignItems: 'center',
    gap: 16,
  },
  avatarBubble: {
    width: 230,
    height: 230,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  panel: {
    marginTop: 20,
    width: '100%',
    borderRadius: 20,
    backgroundColor: 'rgba(15, 22, 66, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 16,
    gap: 10,
    minHeight: 180,
  },
  status: {
    color: '#B7C2FF',
    fontFamily: fontFamily.bodySemi,
    fontSize: 16,
  },
  promptText: {
    color: '#FFFFFF',
    fontFamily: fontFamily.body,
    fontSize: 23,
    lineHeight: 32,
  },
  lastAnswer: {
    color: '#CFD7FF',
    fontFamily: fontFamily.body,
    fontSize: 17,
    lineHeight: 24,
  },
  controls: {
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
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
  roundOff: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  roundPrimary: {
    backgroundColor: '#2D73FF',
  },
  roundRecording: {
    backgroundColor: '#E85467',
  },
  endCall: {
    marginTop: 18,
    width: 76,
    height: 76,
    borderRadius: 999,
    backgroundColor: '#ED4F62',
    alignItems: 'center',
    justifyContent: 'center',
  },
  answerSheet: {
    width: '100%',
    marginTop: 18,
    borderRadius: 16,
    backgroundColor: '#F2F5FF',
    padding: 12,
    gap: 10,
  },
  input: {
    minHeight: 82,
    maxHeight: 130,
    color: '#151B31',
    fontFamily: fontFamily.body,
    fontSize: 18,
    lineHeight: 24,
    textAlignVertical: 'top',
  },
  sendButton: {
    height: 50,
    borderRadius: 999,
    backgroundColor: '#3E5DFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendDisabled: {
    opacity: 0.5,
  },
  sendText: {
    color: '#FFFFFF',
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
