import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/src/components/PrimaryButton';
import { colors, fontFamily } from '@/src/constants/uiTheme';
import { useApp } from '@/src/context/AppContext';

const ageLabels = {
  under_16: 'Under 16',
  '16_18': '16-18',
  '19_22': '19-22',
  '23_plus': '23+',
} as const;

export default function ProgressScreen() {
  const {
    loading,
    stage,
    state,
    remainingCalls,
    freeCallLimit,
    choosePlan,
    setNotificationsEnabled,
    logoutToOnboarding,
    deleteAccount,
  } = useApp();

  useEffect(() => {
    if (!loading && stage !== 'workspace') {
      router.replace('/');
    }
  }, [loading, stage]);

  if (loading || stage !== 'workspace') {
    return (
      <View style={styles.loaderWrap}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const sessions = state.sessionStats;
  const profile = state.profile;
  const weeklyProgress = Math.min(1, sessions.completed / sessions.weeklyGoal);

  function handleLogout() {
    Alert.alert(
      'Log out?',
      'This will return the app to the first-time onboarding flow on this device.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log out',
          style: 'destructive',
          onPress: () => {
            void logoutToOnboarding().then(() => {
              router.replace('/');
            });
          },
        },
      ],
    );
  }

  function handleDeleteAccount() {
    Alert.alert(
      'Delete account?',
      'This local prototype will clear your saved profile, documents, and study progress, then return to the first onboarding screen.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            void deleteAccount().then(() => {
              router.replace('/');
            });
          },
        },
      ],
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Progress</Text>
        <Text style={styles.subtitle}>Light gamification, clear next steps, and account controls aligned with the v1 plan.</Text>

        <View style={styles.heroCard}>
          <Text style={styles.heroTitle}>{sessions.streak} day streak</Text>
          <Text style={styles.heroBody}>
            {sessions.completed}/{sessions.weeklyGoal} study sessions completed this week.
          </Text>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${weeklyProgress * 100}%` }]} />
          </View>
        </View>

        <View style={styles.metricsRow}>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{sessions.quizSessions}</Text>
            <Text style={styles.metricLabel}>Quizzes</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{sessions.flashcardSessions}</Text>
            <Text style={styles.metricLabel}>Flashcard sessions</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{sessions.callSessions}</Text>
            <Text style={styles.metricLabel}>AI calls</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Weak topics to revisit</Text>
          {sessions.weakAreas.length > 0 ? (
            sessions.weakAreas.map((item) => (
              <View key={item} style={styles.listRow}>
                <Ionicons name="alert-circle-outline" size={18} color={colors.accent} />
                <Text style={styles.listText}>{item}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.cardBody}>Weak topics will appear here after quizzes, flashcards, and call summaries.</Text>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Plan and usage</Text>
          <Text style={styles.cardBody}>Current plan: {state.plan === 'premium' ? 'Premium' : 'Free'}</Text>
          <Text style={styles.cardBody}>
            {state.plan === 'premium' ? 'Unlimited AI calls are enabled.' : `${remainingCalls}/${freeCallLimit} AI calls left this month.`}
          </Text>
          <PrimaryButton
            label={state.plan === 'premium' ? 'Premium active' : 'Upgrade to premium'}
            variant={state.plan === 'premium' ? 'secondary' : 'primary'}
            onPress={() => {
              if (state.plan === 'premium') {
                return;
              }
              router.push('/paywall');
            }}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Profile</Text>
          <Text style={styles.cardBody}>Name: {profile?.firstName ?? 'Scholar'}</Text>
          <Text style={styles.cardBody}>Age: {profile ? ageLabels[profile.ageBracket] : 'Not set'}</Text>
          <Text style={styles.cardBody}>Language: {profile?.appLanguage ?? 'english'}</Text>
          <Text style={styles.cardBody}>Notifications: {profile?.notificationsEnabled ? 'On' : 'Off'}</Text>
          <Text style={styles.cardBody}>Account: {state.accountStatus === 'member' ? 'Saved account' : 'Guest mode after first value moment'}</Text>
          <View style={styles.inlineActions}>
            <PrimaryButton
              label={profile?.notificationsEnabled ? 'Turn notifications off' : 'Turn notifications on'}
              variant="secondary"
              onPress={() => setNotificationsEnabled(!profile?.notificationsEnabled)}
            />
            {state.plan !== 'premium' ? (
              <PrimaryButton
                label="Quick premium"
                variant="ghost"
                onPress={() => choosePlan('premium')}
              />
            ) : null}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Account actions</Text>
          <Text style={styles.cardBody}>
            Both actions below return the person to the same first-time onboarding start as a fresh install experience.
          </Text>
          <View style={styles.inlineActions}>
            <PrimaryButton
              label="Log out"
              variant="secondary"
              onPress={handleLogout}
            />
            <PrimaryButton
              label="Delete account"
              variant="danger"
              onPress={handleDeleteAccount}
            />
          </View>
        </View>
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
    paddingBottom: 30,
    gap: 14,
  },
  title: {
    color: colors.ink,
    fontFamily: fontFamily.heading,
    fontSize: 34,
  },
  subtitle: {
    color: colors.inkMuted,
    fontFamily: fontFamily.body,
    fontSize: 17,
    lineHeight: 24,
  },
  heroCard: {
    borderRadius: 24,
    padding: 18,
    backgroundColor: '#17345F',
    gap: 10,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontFamily: fontFamily.heading,
    fontSize: 28,
  },
  heroBody: {
    color: '#D7E4F0',
    fontFamily: fontFamily.body,
    fontSize: 16,
    lineHeight: 22,
  },
  progressTrack: {
    height: 12,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.18)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#F0B44C',
    borderRadius: 999,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  metricCard: {
    flex: 1,
    borderRadius: 22,
    padding: 16,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    gap: 4,
  },
  metricValue: {
    color: colors.ink,
    fontFamily: fontFamily.heading,
    fontSize: 24,
  },
  metricLabel: {
    color: colors.inkMuted,
    fontFamily: fontFamily.body,
    fontSize: 14,
  },
  card: {
    borderRadius: 24,
    padding: 18,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    gap: 10,
  },
  cardTitle: {
    color: colors.ink,
    fontFamily: fontFamily.subheading,
    fontSize: 20,
  },
  cardBody: {
    color: colors.inkMuted,
    fontFamily: fontFamily.body,
    fontSize: 15,
    lineHeight: 21,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  listText: {
    flex: 1,
    color: colors.ink,
    fontFamily: fontFamily.body,
    fontSize: 15,
    lineHeight: 21,
  },
  inlineActions: {
    gap: 8,
  },
  loaderWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.page,
  },
});
