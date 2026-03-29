import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/src/components/PrimaryButton';
import { colors, fontFamily } from '@/src/constants/uiTheme';
import { useApp } from '@/src/context/AppContext';

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

export default function SettingsTabScreen() {
  const { loading, stage, state, freeCallLimit, remainingCalls } = useApp();

  useEffect(() => {
    if (!loading && stage !== 'home') {
      router.replace(routeForStage(stage));
    }
  }, [loading, stage]);

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
        <Text style={styles.title}>Settings</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Plan</Text>
          <Text style={styles.cardBody}>Current: {state.plan === 'premium' ? 'Premium' : 'Free'}</Text>
          <Text style={styles.cardBody}>
            {state.plan === 'premium'
              ? 'Unlimited oral exam calls.'
              : `Usage: ${remainingCalls}/${freeCallLimit} calls remaining this month.`}
          </Text>
          <PrimaryButton
            label={state.plan === 'premium' ? 'Plan Active' : 'Open Paywall'}
            variant={state.plan === 'premium' ? 'secondary' : 'primary'}
            onPress={() => {
              if (state.plan !== 'premium') {
                router.push('/paywall');
              }
            }}
            icon={<Ionicons name="diamond-outline" size={20} color={state.plan === 'premium' ? '#5E668A' : '#FFFFFF'} />}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Study Source</Text>
          <Text style={styles.cardBody}>
            Active: {state.document ? state.document.name : 'None selected'}
          </Text>
          <PrimaryButton
            label="Manage in Library"
            variant="secondary"
            onPress={() => router.push('/library')}
            icon={<Ionicons name="folder-open-outline" size={20} color="#5E668A" />}
          />
        </View>
      </ScrollView>
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
    paddingBottom: 28,
    gap: 14,
  },
  title: {
    color: colors.ink,
    fontFamily: fontFamily.heading,
    fontSize: 34,
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
    fontSize: 17,
    lineHeight: 24,
  },
  loaderWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.page,
  },
});
