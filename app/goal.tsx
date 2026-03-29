import { Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, fontFamily } from '@/src/constants/uiTheme';
import { useApp } from '@/src/context/AppContext';
import type { StudyGoal } from '@/src/types';

const goalOptions: {
  goal: StudyGoal;
  title: string;
  icon: ReactNode;
}[] = [
  {
    goal: 'exam',
    title: 'Preparing for an exam',
    icon: <MaterialCommunityIcons name="certificate-outline" size={28} color="#B85AFF" />,
  },
  {
    goal: 'flashcards',
    title: 'Creating my own flashcards',
    icon: <MaterialCommunityIcons name="cards-outline" size={28} color="#3A6DFF" />,
  },
  {
    goal: 'other',
    title: 'Studying something else',
    icon: <MaterialIcons name="travel-explore" size={28} color="#9E65DE" />,
  },
];

function routeForStage(stage: ReturnType<typeof useApp>['stage']) {
  if (stage === 'auth') {
    return '/';
  }
  if (stage === 'paywall') {
    return '/paywall';
  }
  return '/home';
}

export default function GoalScreen() {
  const { loading, stage, setStudyGoal } = useApp();

  useEffect(() => {
    if (!loading && stage !== 'goal') {
      router.replace(routeForStage(stage));
    }
  }, [loading, stage]);

  if (loading || stage !== 'goal') {
    return (
      <View style={styles.loaderWrap}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.page}>
        <View style={styles.progressTrack}>
          <View style={styles.progressFill} />
        </View>

        <View style={styles.headerWrap}>
          <Text style={styles.title}>What are you studying for today?</Text>
          <Text style={styles.subtitle}>
            Tell us your focus and we&apos;ll tune your oral practice sessions.
          </Text>
        </View>

        <View style={styles.optionStack}>
          {goalOptions.map((item) => (
            <Pressable
              key={item.goal}
              style={({ pressed }) => [styles.option, pressed ? styles.optionPressed : null]}
              onPress={() => {
                setStudyGoal(item.goal);
                router.replace('/home');
              }}>
              <View style={styles.optionIcon}>{item.icon}</View>
              <Text style={styles.optionText}>{item.title}</Text>
              <Ionicons name="chevron-forward" size={20} color="#9BA4C6" />
            </Pressable>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F7F8FD',
  },
  page: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  progressTrack: {
    width: '100%',
    height: 14,
    borderRadius: 999,
    backgroundColor: '#DBE0EF',
    overflow: 'hidden',
    marginBottom: 38,
  },
  progressFill: {
    width: '26%',
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#6980FF',
  },
  headerWrap: {
    gap: 14,
    marginBottom: 34,
  },
  title: {
    fontFamily: fontFamily.heading,
    color: colors.ink,
    fontSize: 44,
    lineHeight: 50,
    maxWidth: 700,
  },
  subtitle: {
    fontFamily: fontFamily.body,
    color: colors.inkMuted,
    fontSize: 22,
    lineHeight: 31,
  },
  optionStack: {
    gap: 16,
  },
  option: {
    backgroundColor: '#EEF1F9',
    minHeight: 92,
    borderRadius: 20,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  optionPressed: {
    transform: [{ scale: 0.99 }],
    backgroundColor: '#E4E9F7',
  },
  optionIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionText: {
    flex: 1,
    color: colors.ink,
    fontFamily: fontFamily.subheading,
    fontSize: 25,
  },
  loaderWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.page,
  },
});
