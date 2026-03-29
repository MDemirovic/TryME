import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, fontFamily } from '@/src/constants/uiTheme';
import { useApp } from '@/src/context/AppContext';
import { PrimaryButton } from '@/src/components/PrimaryButton';

const perks = [
  'Unlimited oral exam calls',
  'Smarter examiner follow-up questions',
  'Faster voice transcription',
  'Priority study session generation',
];

function routeForStage(stage: ReturnType<typeof useApp>['stage']) {
  if (stage === 'auth') {
    return '/';
  }
  if (stage === 'goal') {
    return '/goal';
  }
  return '/home';
}

export default function PaywallScreen() {
  const { loading, stage, state, choosePlan, skipPaywall } = useApp();
  const { width, height } = useWindowDimensions();
  const compact = width < 390 || height < 800;

  const headerSize = compact ? 34 : 42;
  const headerLineHeight = compact ? 38 : 46;
  const titleSize = compact ? 48 : 54;
  const titleLineHeight = compact ? 54 : 60;
  const descSize = compact ? 18 : 22;
  const descLineHeight = compact ? 26 : 31;
  const perkSize = compact ? 20 : 26;

  useEffect(() => {
    if (!loading && stage !== 'paywall') {
      router.replace(routeForStage(stage));
    }
  }, [loading, stage]);

  if (loading || stage !== 'paywall') {
    return (
      <View style={styles.loaderWrap}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <LinearGradient colors={['#050B4D', '#090434']} style={styles.page}>
        <ScrollView
          bounces={false}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}>
          <View style={[styles.hero, compact ? styles.heroCompact : null]}>
            <Text
              maxFontSizeMultiplier={1.05}
              style={[styles.header, { fontSize: headerSize, lineHeight: headerLineHeight }]}>
              TryME Unlimited
            </Text>
            <Text
              maxFontSizeMultiplier={1.05}
              style={[styles.title, { fontSize: titleSize, lineHeight: titleLineHeight }]}>
              7 days of focused exam prep
            </Text>
            <Text
              maxFontSizeMultiplier={1.08}
              style={[styles.desc, { fontSize: descSize, lineHeight: descLineHeight }]}>
              Start your free trial and practice oral exams without limits. Cancel anytime.
            </Text>
          </View>

          <View style={[styles.list, compact ? styles.listCompact : null]}>
            {perks.map((perk) => (
              <View style={styles.perkRow} key={perk}>
                <Ionicons name="checkmark" size={26} color={colors.accent} />
                <Text maxFontSizeMultiplier={1.05} style={[styles.perkText, { fontSize: perkSize }]}>
                  {perk}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.freePlanNote}>
            <Text maxFontSizeMultiplier={1.08} style={styles.freePlanLine}>
              Free plan includes {state.plan === 'free' ? '3 calls per month' : 'no call limit'}.
            </Text>
          </View>

          <View style={styles.ctaWrap}>
            <PrimaryButton
              label="Start free trial"
              variant="secondary"
              style={styles.primaryCta}
              textStyle={styles.primaryCtaText}
              onPress={() => {
                choosePlan('premium');
                router.replace('/goal');
              }}
            />
            <PrimaryButton
              label="Skip for now"
              variant="ghost"
              textStyle={styles.skipText}
              onPress={() => {
                skipPaywall();
                router.replace('/goal');
              }}
            />
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#050B4D',
  },
  page: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  hero: {
    gap: 12,
  },
  heroCompact: {
    gap: 9,
  },
  header: {
    color: '#FFFFFF',
    fontFamily: fontFamily.heading,
  },
  title: {
    color: '#FFFFFF',
    fontFamily: fontFamily.heading,
    maxWidth: 760,
  },
  desc: {
    color: '#D2D8FF',
    fontFamily: fontFamily.body,
    maxWidth: 760,
  },
  list: {
    marginTop: 24,
    gap: 20,
  },
  listCompact: {
    marginTop: 18,
    gap: 16,
  },
  perkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  perkText: {
    color: '#FFFFFF',
    fontFamily: fontFamily.subheading,
    flex: 1,
    lineHeight: 32,
  },
  freePlanNote: {
    marginTop: 20,
    marginBottom: 14,
  },
  freePlanLine: {
    color: '#ADB6EE',
    fontFamily: fontFamily.body,
    fontSize: 18,
  },
  ctaWrap: {
    gap: 10,
    paddingTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(173,182,238,0.35)',
  },
  primaryCta: {
    backgroundColor: '#F9D12E',
  },
  primaryCtaText: {
    color: '#28325E',
  },
  skipText: {
    color: '#AAB6FE',
  },
  loaderWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#050B4D',
  },
});
