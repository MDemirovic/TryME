import { FontAwesome5, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, fontFamily } from '@/src/constants/uiTheme';
import { useApp } from '@/src/context/AppContext';
import { PrimaryButton } from '@/src/components/PrimaryButton';

function routeForStage(stage: ReturnType<typeof useApp>['stage']) {
  if (stage === 'paywall') {
    return '/paywall';
  }
  if (stage === 'goal') {
    return '/goal';
  }
  return '/home';
}

export default function AuthEntryScreen() {
  const { loading, stage, startSignup, completeLogin } = useApp();
  const { width, height } = useWindowDimensions();
  const compact = width < 390 || height < 820;

  const heroSize = compact ? 200 : 250;
  const avatarSize = compact ? 108 : 132;
  const titleSize = compact ? 30 : 37;
  const titleLineHeight = compact ? 37 : 45;
  const subtitleSize = compact ? 18 : 20;
  const subtitleLineHeight = compact ? 26 : 30;
  const loginSize = compact ? 18 : 21;

  useEffect(() => {
    if (!loading && stage !== 'auth') {
      router.replace(routeForStage(stage));
    }
  }, [loading, stage]);

  if (loading || stage !== 'auth') {
    return (
      <View style={styles.loaderWrap}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        bounces={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        <View style={styles.page}>
          <View style={[styles.heroWrap, compact ? styles.heroWrapCompact : null]}>
            <LinearGradient
              colors={['#F5B17A', '#FD7E4A', '#E85A35']}
              start={{ x: 0.05, y: 0.05 }}
              end={{ x: 1, y: 1 }}
              style={[styles.heroBubble, { width: heroSize, height: heroSize }]}>
              <View style={[styles.heroAvatar, { width: avatarSize, height: avatarSize }]}>
                <MaterialCommunityIcons
                  name="book-open-page-variant"
                  size={compact ? 60 : 76}
                  color="#FFFFFF"
                />
              </View>
            </LinearGradient>
            <View style={styles.spark} />
          </View>

          <Text
            maxFontSizeMultiplier={1.05}
            style={[styles.title, { fontSize: titleSize, lineHeight: titleLineHeight }]}>
            Your smartest way to prepare for oral exams.
          </Text>
          <Text
            maxFontSizeMultiplier={1.08}
            style={[styles.subtitle, { fontSize: subtitleSize, lineHeight: subtitleLineHeight }]}>
            Upload your study notes and practice with an AI examiner in a call-style experience.
          </Text>

          <View style={[styles.ctaStack, compact ? styles.ctaStackCompact : null]}>
            <PrimaryButton
              label="Continue with Google"
              onPress={() => {
                startSignup('google');
                router.replace('/paywall');
              }}
              icon={<FontAwesome5 name="google" size={20} color="#FFFFFF" />}
            />

            <PrimaryButton
              label="Sign up with email"
              variant="secondary"
              onPress={() => {
                startSignup('email');
                router.replace('/paywall');
              }}
              icon={<Ionicons name="mail-outline" size={22} color={colors.inkMuted} />}
              textStyle={styles.secondaryText}
            />

            <Pressable
              onPress={() => {
                completeLogin();
                router.replace('/goal');
              }}
              style={styles.loginRow}>
              <Text maxFontSizeMultiplier={1.05} style={[styles.loginPlain, { fontSize: loginSize }]}>
                Have an account?
              </Text>
              <Text maxFontSizeMultiplier={1.05} style={[styles.loginAccent, { fontSize: loginSize }]}>
                {' '}
                Log in
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F7F8FD',
  },
  scrollContent: {
    flexGrow: 1,
  },
  page: {
    minHeight: '100%',
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 28,
    alignItems: 'center',
  },
  heroWrap: {
    marginTop: 18,
    marginBottom: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroWrapCompact: {
    marginTop: 6,
    marginBottom: 18,
  },
  heroBubble: {
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#E56A38',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.24,
    shadowRadius: 28,
    elevation: 9,
  },
  heroAvatar: {
    width: 132,
    height: 132,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  spark: {
    width: 86,
    height: 24,
    borderRadius: 999,
    backgroundColor: '#A5B3FF',
    position: 'absolute',
    right: -8,
    top: 30,
    transform: [{ rotate: '-28deg' }],
  },
  title: {
    textAlign: 'center',
    color: colors.ink,
    fontFamily: fontFamily.heading,
    marginBottom: 12,
    maxWidth: 700,
  },
  subtitle: {
    textAlign: 'center',
    color: colors.inkMuted,
    fontFamily: fontFamily.body,
    marginBottom: 22,
    maxWidth: 760,
  },
  ctaStack: {
    width: '100%',
    gap: 14,
    marginTop: 8,
  },
  ctaStackCompact: {
    gap: 10,
  },
  secondaryText: {
    color: colors.ink,
  },
  loginRow: {
    alignSelf: 'center',
    marginTop: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  loginPlain: {
    fontFamily: fontFamily.body,
    color: colors.inkMuted,
  },
  loginAccent: {
    fontFamily: fontFamily.subheading,
    color: colors.primary,
  },
  loaderWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.page,
  },
});
