import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/src/components/PrimaryButton';
import { colors, fontFamily } from '@/src/constants/uiTheme';
import { useApp } from '@/src/context/AppContext';

const premiumPoints = [
  'Unlimited AI oral exam calls',
  'Higher usage caps across documents, quiz runs, and flashcards',
  'Priority processing for new study packs',
  'Longer-term personalization as your weak topics evolve',
];

export default function PaywallScreen() {
  const { loading, stage, state, choosePlan } = useApp();

  useEffect(() => {
    if (!loading && stage !== 'workspace') {
      router.replace('/');
    }
  }, [loading, stage]);

  if (loading || stage !== 'workspace') {
    return (
      <View style={styles.loaderWrap}>
        <ActivityIndicator size="large" color="#FFFFFF" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <LinearGradient colors={['#17345F', '#0E4C55', '#11273F']} style={styles.page}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.eyebrow}>Premium access</Text>
          <Text style={styles.title}>Keep the free plan lean, then unlock the flagship voice experience.</Text>
          <Text style={styles.subtitle}>
            The pricing shell now matches the plan: monthly plus annual, no free trial in v1, and unlimited calls as the premium hook.
          </Text>

          <View style={styles.pricingRow}>
            <View style={styles.priceCard}>
              <Text style={styles.priceLabel}>Monthly</Text>
              <Text style={styles.priceValue}>$12.99</Text>
              <Text style={styles.priceHint}>Flexible for active exam periods</Text>
            </View>
            <View style={[styles.priceCard, styles.priceCardAccent]}>
              <Text style={styles.priceLabelDark}>Annual</Text>
              <Text style={styles.priceValueDark}>$69.99</Text>
              <Text style={styles.priceHintDark}>Best value for year-round study</Text>
            </View>
          </View>

          <View style={styles.listCard}>
            {premiumPoints.map((point) => (
              <View key={point} style={styles.listRow}>
                <Ionicons name="checkmark-circle" size={20} color="#F0B44C" />
                <Text style={styles.listText}>{point}</Text>
              </View>
            ))}
          </View>

          <View style={styles.freeCard}>
            <Text style={styles.freeTitle}>Free plan stays useful</Text>
            <Text style={styles.freeBody}>
              Limited uploads, limited call usage, and full basic study-pack previews so users feel value before paying.
            </Text>
            <Text style={styles.freeBody}>
              Current status: {state.plan === 'premium' ? 'Premium active' : 'Free plan active'}.
            </Text>
          </View>

          <View style={styles.actions}>
            <PrimaryButton
              label={state.plan === 'premium' ? 'Premium already active' : 'Unlock premium'}
              variant="secondary"
              onPress={() => {
                choosePlan('premium');
                router.back();
              }}
              style={styles.primaryAction}
              textStyle={styles.primaryActionText}
            />
            <PrimaryButton
              label="Keep free plan"
              variant="ghost"
              onPress={() => router.back()}
              textStyle={styles.secondaryText}
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
    backgroundColor: '#17345F',
  },
  page: {
    flex: 1,
  },
  content: {
    padding: 22,
    paddingBottom: 28,
    gap: 18,
  },
  eyebrow: {
    color: '#9CC9CA',
    fontFamily: fontFamily.bodySemi,
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  title: {
    color: '#FFFFFF',
    fontFamily: fontFamily.heading,
    fontSize: 34,
    lineHeight: 40,
  },
  subtitle: {
    color: '#C9DAE7',
    fontFamily: fontFamily.body,
    fontSize: 17,
    lineHeight: 24,
  },
  pricingRow: {
    gap: 12,
  },
  priceCard: {
    borderRadius: 24,
    padding: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    gap: 4,
  },
  priceCardAccent: {
    backgroundColor: '#F0B44C',
    borderColor: '#F0B44C',
  },
  priceLabel: {
    color: '#AFC9E1',
    fontFamily: fontFamily.bodySemi,
    fontSize: 14,
    textTransform: 'uppercase',
  },
  priceValue: {
    color: '#FFFFFF',
    fontFamily: fontFamily.heading,
    fontSize: 32,
  },
  priceHint: {
    color: '#D3E0EC',
    fontFamily: fontFamily.body,
    fontSize: 15,
  },
  priceLabelDark: {
    color: '#5D4110',
    fontFamily: fontFamily.bodySemi,
    fontSize: 14,
    textTransform: 'uppercase',
  },
  priceValueDark: {
    color: '#2D2617',
    fontFamily: fontFamily.heading,
    fontSize: 32,
  },
  priceHintDark: {
    color: '#5D4110',
    fontFamily: fontFamily.body,
    fontSize: 15,
  },
  listCard: {
    borderRadius: 24,
    padding: 18,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    gap: 12,
  },
  listRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  listText: {
    flex: 1,
    color: '#FFFFFF',
    fontFamily: fontFamily.body,
    fontSize: 16,
    lineHeight: 22,
  },
  freeCard: {
    borderRadius: 24,
    padding: 18,
    backgroundColor: '#FFF7E8',
    gap: 8,
  },
  freeTitle: {
    color: colors.ink,
    fontFamily: fontFamily.subheading,
    fontSize: 20,
  },
  freeBody: {
    color: colors.inkMuted,
    fontFamily: fontFamily.body,
    fontSize: 15,
    lineHeight: 21,
  },
  actions: {
    gap: 10,
  },
  primaryAction: {
    backgroundColor: '#FFF7E8',
  },
  primaryActionText: {
    color: '#20324C',
  },
  secondaryText: {
    color: '#C9DAE7',
  },
  loaderWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#17345F',
  },
});
