import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/src/components/PrimaryButton';
import { colors, fontFamily } from '@/src/constants/uiTheme';
import { useApp } from '@/src/context/AppContext';

function qualityCopy(label: 'strong' | 'okay' | 'needs_attention') {
  if (label === 'strong') {
    return 'Strong extraction';
  }
  if (label === 'okay') {
    return 'Usable extraction';
  }
  return 'Needs cleanup';
}

export default function WorkspaceScreen() {
  const {
    loading,
    stage,
    state,
    currentDocument,
    remainingCalls,
    freeCallLimit,
    createAccount,
    registerCallStart,
    recordStudyAction,
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

  if (!currentDocument) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.emptyContent}>
          <Text style={styles.welcomeTitle}>Your workspace is ready for its first document.</Text>
          <Text style={styles.emptyBody}>
            The new shell is document-first, so the fastest next step is to upload notes and let the app create a study pack around them.
          </Text>
          <PrimaryButton
            label="Open library"
            onPress={() => router.push('/library')}
            icon={<Ionicons name="folder-open-outline" size={20} color="#FFFFFF" />}
          />
        </ScrollView>
      </SafeAreaView>
    );
  }

  const profileName = state.profile?.firstName ?? 'Scholar';
  const pack = currentDocument.studyPack;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <LinearGradient colors={['#FFF3D6', '#F7F1E3', '#E3EFE7']} style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <View>
              <Text style={styles.heroEyebrow}>Active workspace</Text>
              <Text style={styles.heroTitle}>{profileName}, your document is ready.</Text>
            </View>
            <View style={styles.mascotBubble}>
              <MaterialCommunityIcons name="robot-love-outline" size={30} color="#FFF7ED" />
            </View>
          </View>

          <Text style={styles.heroBody}>{pack.overview}</Text>

          <View style={styles.heroMetaRow}>
            <View style={styles.metaChip}>
              <Text style={styles.metaChipText}>{currentDocument.fileType.toUpperCase()}</Text>
            </View>
            <View style={styles.metaChip}>
              <Text style={styles.metaChipText}>{currentDocument.wordCount} words</Text>
            </View>
            <View style={styles.metaChip}>
              <Text style={styles.metaChipText}>{qualityCopy(pack.qualityLabel)}</Text>
            </View>
          </View>
        </LinearGradient>

        {state.accountStatus === 'guest' ? (
          <View style={styles.bannerCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.bannerTitle}>Save your progress after this first value moment.</Text>
              <Text style={styles.bannerBody}>Create an account to keep your study history, sync future subscriptions, and protect your library.</Text>
            </View>
            <View style={styles.bannerActions}>
              <PrimaryButton
                label="Apple"
                variant="secondary"
                onPress={() => createAccount('apple')}
                icon={<Ionicons name="logo-apple" size={18} color={colors.ink} />}
              />
              <PrimaryButton
                label="Google"
                variant="ghost"
                onPress={() => createAccount('google')}
              />
            </View>
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Document action hub</Text>
          <View style={styles.actionGrid}>
            <Pressable
              style={styles.actionCard}
              onPress={() => {
                router.push({
                  pathname: '/quiz',
                  params: {
                    docId: currentDocument.id,
                    difficulty: 'medium',
                    count: '10',
                  },
                });
              }}>
              <Ionicons name="help-circle-outline" size={24} color={colors.primary} />
              <Text style={styles.actionTitle}>Quiz</Text>
              <Text style={styles.actionBody}>Challenge the generated bank and expose weak concepts.</Text>
            </Pressable>

            <Pressable
              style={styles.actionCard}
              onPress={() => {
                recordStudyAction('flashcards', pack.keyConcepts.slice(-2));
              }}>
              <Ionicons name="albums-outline" size={24} color={colors.primary} />
              <Text style={styles.actionTitle}>Flashcards</Text>
              <Text style={styles.actionBody}>Use the deck preview below as the first spaced-repetition pass.</Text>
            </Pressable>

            <Pressable
              style={styles.actionCard}
              onPress={() => {
                recordStudyAction('notes', pack.weakTopicSuggestions.slice(0, 2));
              }}>
              <Ionicons name="document-text-outline" size={24} color={colors.primary} />
              <Text style={styles.actionTitle}>Notes / Study Script</Text>
              <Text style={styles.actionBody}>Read the summary, key concepts, and oral prompts before testing yourself.</Text>
            </Pressable>

            <Pressable
              style={styles.actionCard}
              onPress={() => {
                const allowed = registerCallStart();
                if (!allowed) {
                  Alert.alert('Free call limit reached', `Free users get ${freeCallLimit} calls per month. Upgrade to keep going.`);
                  router.push('/paywall');
                  return;
                }

                router.push('/call');
              }}>
              <Ionicons name="call-outline" size={24} color={colors.primary} />
              <Text style={styles.actionTitle}>AI call</Text>
              <Text style={styles.actionBody}>
                {state.plan === 'premium' ? 'Unlimited call access is active.' : `${remainingCalls}/${freeCallLimit} calls left this month.`}
              </Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Study pack</Text>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Key concepts</Text>
            {pack.keyConcepts.map((item) => (
              <View key={item} style={styles.listRow}>
                <Ionicons name="checkmark-circle" size={18} color={colors.success} />
                <Text style={styles.listText}>{item}</Text>
              </View>
            ))}
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Likely oral-exam questions</Text>
            {pack.oralExamQuestions.map((item) => (
              <View key={item} style={styles.questionCard}>
                <Text style={styles.questionText}>{item}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Flashcard preview</Text>
          {pack.flashcards.map((flashcard) => (
            <View key={flashcard.id} style={styles.flashcard}>
              <View style={styles.flashcardTop}>
                <Text style={styles.flashcardFront}>{flashcard.front}</Text>
                <Text style={styles.flashcardDue}>{flashcard.dueLabel}</Text>
              </View>
              <Text style={styles.flashcardBack}>{flashcard.back}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recommended next step</Text>
          <View style={styles.recommendationCard}>
            <Text style={styles.recommendationTitle}>Focus on your weaker edges before the next oral call.</Text>
            {pack.weakTopicSuggestions.map((item) => (
              <Text key={item} style={styles.recommendationItem}>
                {`\u2022 ${item}`}
              </Text>
            ))}
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
    paddingBottom: 28,
    gap: 18,
  },
  heroCard: {
    borderRadius: 30,
    padding: 22,
    gap: 14,
    borderWidth: 1,
    borderColor: '#E3DACA',
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  heroEyebrow: {
    color: '#7D6A45',
    fontFamily: fontFamily.bodySemi,
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  heroTitle: {
    marginTop: 6,
    color: colors.ink,
    fontFamily: fontFamily.heading,
    fontSize: 30,
    lineHeight: 36,
    maxWidth: '82%',
  },
  mascotBubble: {
    width: 58,
    height: 58,
    borderRadius: 999,
    backgroundColor: '#1F6C68',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroBody: {
    color: colors.inkMuted,
    fontFamily: fontFamily.body,
    fontSize: 17,
    lineHeight: 24,
  },
  heroMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  metaChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.72)',
  },
  metaChipText: {
    color: '#395A56',
    fontFamily: fontFamily.bodySemi,
    fontSize: 13,
  },
  bannerCard: {
    flexDirection: 'row',
    gap: 16,
    padding: 18,
    borderRadius: 22,
    backgroundColor: '#FFF8E8',
    borderWidth: 1,
    borderColor: '#E8D6AB',
  },
  bannerTitle: {
    color: colors.ink,
    fontFamily: fontFamily.subheading,
    fontSize: 18,
  },
  bannerBody: {
    marginTop: 4,
    color: colors.inkMuted,
    fontFamily: fontFamily.body,
    fontSize: 15,
    lineHeight: 21,
  },
  bannerActions: {
    justifyContent: 'center',
    width: 110,
    gap: 8,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    color: colors.ink,
    fontFamily: fontFamily.heading,
    fontSize: 24,
  },
  actionGrid: {
    gap: 12,
  },
  actionCard: {
    borderRadius: 22,
    padding: 18,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    gap: 8,
  },
  actionTitle: {
    color: colors.ink,
    fontFamily: fontFamily.subheading,
    fontSize: 19,
  },
  actionBody: {
    color: colors.inkMuted,
    fontFamily: fontFamily.body,
    fontSize: 15,
    lineHeight: 21,
  },
  card: {
    borderRadius: 22,
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
  listRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  listText: {
    flex: 1,
    color: colors.ink,
    fontFamily: fontFamily.body,
    fontSize: 16,
    lineHeight: 22,
  },
  questionCard: {
    borderRadius: 18,
    padding: 14,
    backgroundColor: '#F8F4EC',
  },
  questionText: {
    color: colors.ink,
    fontFamily: fontFamily.body,
    fontSize: 16,
    lineHeight: 22,
  },
  flashcard: {
    borderRadius: 22,
    padding: 18,
    backgroundColor: '#17345F',
    gap: 10,
  },
  flashcardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  flashcardFront: {
    flex: 1,
    color: '#FFFFFF',
    fontFamily: fontFamily.subheading,
    fontSize: 18,
  },
  flashcardDue: {
    color: '#F4D37C',
    fontFamily: fontFamily.bodySemi,
    fontSize: 13,
  },
  flashcardBack: {
    color: '#D9E4F4',
    fontFamily: fontFamily.body,
    fontSize: 15,
    lineHeight: 21,
  },
  recommendationCard: {
    borderRadius: 22,
    padding: 18,
    backgroundColor: '#E7F0EA',
    borderWidth: 1,
    borderColor: '#C9DDD5',
    gap: 8,
  },
  recommendationTitle: {
    color: colors.ink,
    fontFamily: fontFamily.subheading,
    fontSize: 19,
  },
  recommendationItem: {
    color: '#305650',
    fontFamily: fontFamily.body,
    fontSize: 15,
    lineHeight: 21,
  },
  emptyContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
    gap: 14,
  },
  welcomeTitle: {
    color: colors.ink,
    fontFamily: fontFamily.heading,
    fontSize: 32,
    lineHeight: 38,
  },
  emptyBody: {
    color: colors.inkMuted,
    fontFamily: fontFamily.body,
    fontSize: 18,
    lineHeight: 26,
  },
  loaderWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.page,
  },
});
