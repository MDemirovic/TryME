import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/src/components/PrimaryButton';
import { colors, fontFamily } from '@/src/constants/uiTheme';
import { useApp } from '@/src/context/AppContext';

const examiners = [
  { name: 'Mila Novak', subject: 'Biology', tone: ['#7CB6FF', '#5F86FF'] as const },
  { name: 'David Klein', subject: 'History', tone: ['#9ECFA3', '#53A875'] as const },
  { name: 'Nora Hale', subject: 'Law', tone: ['#F4B67D', '#E07948'] as const },
  { name: 'Mia Torres', subject: 'Medicine', tone: ['#CBABFF', '#8460E9'] as const },
];

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

export default function HomeTabScreen() {
  const { loading, stage, state, remainingCalls, freeCallLimit, registerCallStart } = useApp();

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
        <LinearGradient colors={['#E8EEFF', '#EEF8FF']} style={styles.topArea}>
          <View style={styles.searchRow}>
            <View style={styles.searchBox}>
              <Ionicons name="search-outline" size={20} color="#7F8CB4" />
              <Text style={styles.searchText}>Search study sets</Text>
            </View>
            <View style={styles.profileCircle}>
              <Text style={styles.profileLetter}>M</Text>
            </View>
          </View>

          <Text style={styles.heading}>Recents</Text>

          <View style={styles.recentCard}>
            <View style={styles.recentIcon}>
              <MaterialCommunityIcons name="file-document-outline" size={22} color="#1E8BCE" />
            </View>
            <View style={styles.recentTextWrap}>
              <Text style={styles.recentTitle}>{state.document?.name ?? 'No notes selected yet'}</Text>
                <Text style={styles.recentSub}>
                  {state.document
                    ? `${state.document.fileType.toUpperCase()} • ${
                        state.document.extractedText.split(/\s+/).length
                      } words`
                  : 'Use Library tab to upload .docx/.pdf/.doc or paste plain text'}
                </Text>
              </View>
            </View>
        </LinearGradient>

        <Text style={styles.sectionTitle}>Your Examiners</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.peopleRow}>
          {examiners.map((examiner) => (
            <View style={styles.personCard} key={examiner.name}>
              <LinearGradient colors={[...examiner.tone]} style={styles.personAvatar}>
                <Text style={styles.personInitial}>
                  {examiner.name
                    .split(' ')
                    .map((part) => part[0])
                    .slice(0, 2)
                    .join('')}
                </Text>
              </LinearGradient>
              <Text style={styles.personName}>{examiner.name}</Text>
              <Text style={styles.personSubject}>{examiner.subject}</Text>
            </View>
          ))}
        </ScrollView>

        <View style={styles.practiceCard}>
          <Text style={styles.practiceTitle}>Oral Exam Call</Text>
          <Text style={styles.practiceBody}>
            {state.document
              ? 'Your selected notes are ready. Start the call and answer the examiner live.'
              : 'Select notes first in Library tab, then return here to start a live oral simulation.'}
          </Text>
          <Text style={styles.callsLine}>
            {state.plan === 'premium'
              ? 'Premium plan: unlimited calls.'
              : `${remainingCalls}/${freeCallLimit} calls left this month.`}
          </Text>

          <View style={styles.ctaGroup}>
            <PrimaryButton
              label="Test Me"
              onPress={() => {
                if (!state.document) {
                  Alert.alert('No notes selected', 'Open Library tab to upload or paste notes first.');
                  return;
                }

                const allowed = registerCallStart();
                if (!allowed) {
                  Alert.alert(
                    'Call limit reached',
                    'Free users have 3 calls per month. Upgrade plan to remove the limit.',
                  );
                  return;
                }

                router.push('/call');
              }}
              icon={<Ionicons name="call-outline" size={20} color="#FFFFFF" />}
            />

            <PrimaryButton
              label="Go to Library"
              variant="secondary"
              onPress={() => router.push('/library')}
              icon={<Ionicons name="folder-outline" size={20} color={colors.inkMuted} />}
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
    backgroundColor: '#F4F7FF',
  },
  content: {
    paddingBottom: 24,
  },
  topArea: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchBox: {
    flex: 1,
    height: 52,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5EAF7',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
  },
  searchText: {
    color: '#7A86AD',
    fontFamily: fontFamily.body,
    fontSize: 18,
  },
  profileCircle: {
    width: 48,
    height: 48,
    borderRadius: 999,
    backgroundColor: '#8CA1B1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileLetter: {
    color: '#FFFFFF',
    fontFamily: fontFamily.subheading,
    fontSize: 24,
  },
  heading: {
    marginTop: 24,
    color: colors.ink,
    fontFamily: fontFamily.heading,
    fontSize: 40,
  },
  recentCard: {
    marginTop: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5EAF7',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  recentIcon: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#EAF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recentTextWrap: {
    flex: 1,
  },
  recentTitle: {
    color: colors.ink,
    fontFamily: fontFamily.subheading,
    fontSize: 20,
  },
  recentSub: {
    marginTop: 2,
    color: colors.inkMuted,
    fontFamily: fontFamily.body,
    fontSize: 16,
  },
  sectionTitle: {
    marginTop: 18,
    marginHorizontal: 20,
    color: colors.ink,
    fontFamily: fontFamily.heading,
    fontSize: 32,
  },
  peopleRow: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 12,
  },
  personCard: {
    width: 132,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E5EAF7',
    padding: 12,
    alignItems: 'center',
  },
  personAvatar: {
    width: 72,
    height: 72,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  personInitial: {
    color: '#FFFFFF',
    fontFamily: fontFamily.heading,
    fontSize: 22,
  },
  personName: {
    marginTop: 9,
    color: colors.ink,
    fontFamily: fontFamily.subheading,
    textAlign: 'center',
    fontSize: 15,
  },
  personSubject: {
    marginTop: 3,
    color: colors.inkMuted,
    fontFamily: fontFamily.body,
    fontSize: 14,
  },
  practiceCard: {
    marginHorizontal: 20,
    marginTop: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5EAF7',
    padding: 18,
    gap: 10,
  },
  practiceTitle: {
    color: colors.ink,
    fontFamily: fontFamily.subheading,
    fontSize: 28,
  },
  practiceBody: {
    color: colors.inkMuted,
    fontFamily: fontFamily.body,
    fontSize: 18,
    lineHeight: 25,
  },
  callsLine: {
    color: '#5562A0',
    fontFamily: fontFamily.bodySemi,
    fontSize: 16,
  },
  ctaGroup: {
    gap: 10,
    marginTop: 4,
  },
  loaderWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.page,
  },
});
