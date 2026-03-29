import { Audio } from 'expo-av';

const TRANSCRIBE_MODEL = process.env.EXPO_PUBLIC_TRANSCRIBE_MODEL ?? 'gpt-4o-mini-transcribe';
const API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY ?? '';

export async function startRecordingAsync(): Promise<Audio.Recording> {
  const permission = await Audio.requestPermissionsAsync();
  if (!permission.granted) {
    throw new Error('Microphone permission is required to record answers.');
  }

  await Audio.setAudioModeAsync({
    allowsRecordingIOS: true,
    playsInSilentModeIOS: true,
    staysActiveInBackground: false,
  });

  const recording = new Audio.Recording();
  await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
  await recording.startAsync();

  return recording;
}

export async function stopRecordingAsync(recording: Audio.Recording): Promise<string> {
  await recording.stopAndUnloadAsync();
  await Audio.setAudioModeAsync({
    allowsRecordingIOS: false,
    playsInSilentModeIOS: true,
  });

  const uri = recording.getURI();
  if (!uri) {
    throw new Error('Recording failed. No audio file was produced.');
  }

  return uri;
}

export async function transcribeAudioAsync(uri: string): Promise<string | null> {
  if (!API_KEY) {
    return null;
  }

  const fileName = uri.split('/').pop() ?? 'answer.m4a';
  const formData = new FormData();

  formData.append('model', TRANSCRIBE_MODEL);
  formData.append('file', {
    uri,
    type: 'audio/m4a',
    name: fileName,
  } as unknown as Blob);

  const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${API_KEY}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Transcription failed (${response.status}): ${details}`);
  }

  const payload = (await response.json()) as { text?: string };
  return payload.text?.trim() || null;
}
