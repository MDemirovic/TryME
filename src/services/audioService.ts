import { Audio } from 'expo-av';

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
  void uri;

  // Production transcription belongs on the backend. The mobile prototype falls back to typed answers.
  return null;
}
