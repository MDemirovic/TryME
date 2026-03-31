import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { PrimaryButton } from "@/src/components/PrimaryButton";
import { colors, fontFamily } from "@/src/constants/uiTheme";
import { useApp } from "@/src/context/AppContext";
import {
  createPastedStudyDocument,
  pickStudyDocument,
} from "@/src/services/docxParser";
import type { AgeBracket, AppLanguage } from "@/src/types";

type EntryMode = "welcome" | "signin" | "onboarding";

const languageOptions: { value: AppLanguage; title: string; hint: string }[] = [
  {
    value: "english",
    title: "English",
    hint: "Recommended for the current product experience.",
  },
  {
    value: "spanish",
    title: "Spanish",
    hint: "UI still stays English in this prototype.",
  },
  {
    value: "german",
    title: "German",
    hint: "UI still stays English in this prototype.",
  },
];

const ageOptions: { value: AgeBracket; title: string }[] = [
  { value: "under_16", title: "Under 16" },
  { value: "16_18", title: "16-18" },
  { value: "19_22", title: "19-22" },
  { value: "23_plus", title: "23+" },
];

const onboardingSteps = [
  "Language",
  "Age",
  "Name",
  "Notifications",
  "How it works",
  "Import",
];

const processingLines = [
  "Cleaning your document",
  "Mapping concepts and likely oral-exam topics",
  "Preparing flashcards, quiz targets, and call snippets",
];

export default function EntryScreen() {
  const { loading, stage, completeOnboarding, signInReturningUser } = useApp();
  const { width, height } = useWindowDimensions();

  const [mode, setMode] = useState<EntryMode>("welcome");
  const [stepIndex, setStepIndex] = useState(0);
  const [language, setLanguage] = useState<AppLanguage>("english");
  const [ageBracket, setAgeBracket] = useState<AgeBracket>("19_22");
  const [firstName, setFirstName] = useState("");
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [pastedText, setPastedText] = useState("");
  const [busy, setBusy] = useState(false);
  const [processingIndex, setProcessingIndex] = useState(0);

  useEffect(() => {
    if (!loading && stage === "workspace") {
      router.replace("/home");
    }
  }, [loading, stage]);

  useEffect(() => {
    if (!busy) {
      return;
    }

    const timer = setInterval(() => {
      setProcessingIndex((prev) =>
        prev < processingLines.length - 1 ? prev + 1 : prev,
      );
    }, 900);

    return () => clearInterval(timer);
  }, [busy]);

  const progress = useMemo(
    () => (stepIndex + 1) / onboardingSteps.length,
    [stepIndex],
  );
  const compactWelcome = width < 390 || height < 780;

  async function handleDocumentReady(source: "file" | "paste") {
    try {
      setBusy(true);
      setProcessingIndex(0);

      const document =
        source === "file"
          ? await pickStudyDocument()
          : createPastedStudyDocument(pastedText);

      if (!document) {
        setBusy(false);
        return;
      }

      if (source === "paste") {
        setPastedText("");
      }

      await new Promise((resolve) => setTimeout(resolve, 1900));
      completeOnboarding({
        firstName: firstName.trim() || "Scholar",
        ageBracket,
        appLanguage: language,
        notificationsEnabled,
        document,
      });
      router.replace("/home");
    } catch (error) {
      Alert.alert(
        "Import problem",
        error instanceof Error
          ? error.message
          : "Could not prepare the document.",
      );
      setBusy(false);
    }
  }

  if (loading || stage === "workspace") {
    return (
      <View style={styles.loaderWrap}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <LinearGradient
        colors={["#FFF8EA", "#F4EFE5", "#E6F0EA"]}
        style={styles.page}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {mode === "welcome" ? (
            <View
              style={[
                styles.welcomePage,
                compactWelcome ? styles.welcomePageCompact : null,
              ]}
            >
              <View style={styles.welcomeCenterReplica}>
                <Image
                  source={require("../assets/images/exa.png")}
                  style={[
                    styles.exaImage,
                    compactWelcome ? styles.exaImageCompact : null,
                  ]}
                  resizeMode="contain"
                />
                <Text style={styles.welcomeWordmark}>Examigo</Text>
                <Text style={styles.tagline}>
                  Turn your notes into real exam practice.
                </Text>
              </View>

              <View style={styles.ctaStackWelcome}>
                <PrimaryButton
                  label="Get started"
                  onPress={() => setMode("onboarding")}
                  style={styles.welcomePrimaryButton}
                  textStyle={styles.welcomePrimaryButtonText}
                />
                <PrimaryButton
                  label="I already have an account"
                  variant="secondary"
                  onPress={() => setMode("signin")}
                  style={styles.welcomeSecondaryButton}
                  textStyle={styles.welcomeSecondaryButtonText}
                />
              </View>
            </View>
          ) : null}

          {mode === "signin" ? (
            <View style={styles.panel}>
              <Text style={styles.panelEyebrow}>Sign in</Text>
              <Text style={styles.panelTitle}>
                Pick how you want to continue back into your workspace.
              </Text>
              <Text style={styles.panelBody}>
                This prototype uses a local sign-in placeholder, but the product
                shell now supports the planned Apple, Google, and email entry
                points.
              </Text>

              <View style={styles.ctaStack}>
                <PrimaryButton
                  label="Continue with Apple"
                  onPress={() => {
                    signInReturningUser("apple");
                    router.replace("/home");
                  }}
                  icon={
                    <Ionicons name="logo-apple" size={20} color="#FFFFFF" />
                  }
                />
                <PrimaryButton
                  label="Continue with Google"
                  variant="secondary"
                  onPress={() => {
                    signInReturningUser("google");
                    router.replace("/home");
                  }}
                  icon={
                    <Ionicons name="logo-google" size={20} color={colors.ink} />
                  }
                />
                <PrimaryButton
                  label="Use email"
                  variant="ghost"
                  onPress={() => {
                    signInReturningUser("email");
                    router.replace("/home");
                  }}
                />
                <PrimaryButton
                  label="Back"
                  variant="ghost"
                  onPress={() => setMode("welcome")}
                />
              </View>
            </View>
          ) : null}

          {mode === "onboarding" ? (
            <View style={styles.panel}>
              <View style={styles.progressHead}>
                <Text style={styles.panelEyebrow}>
                  Step {stepIndex + 1} of {onboardingSteps.length}
                </Text>
                <Text style={styles.progressLabel}>
                  {onboardingSteps[stepIndex]}
                </Text>
              </View>

              <View style={styles.progressTrack}>
                <View
                  style={[styles.progressFill, { width: `${progress * 100}%` }]}
                />
              </View>

              {stepIndex === 0 ? (
                <>
                  <Text style={styles.panelTitle}>
                    Which language should the app use for you?
                  </Text>
                  <Text style={styles.panelBody}>
                    The product is English-first right now, but your documents
                    can still be multilingual.
                  </Text>
                  <View style={styles.choiceStack}>
                    {languageOptions.map((option) => (
                      <Pressable
                        key={option.value}
                        onPress={() => setLanguage(option.value)}
                        style={[
                          styles.choiceCard,
                          language === option.value
                            ? styles.choiceCardActive
                            : null,
                        ]}
                      >
                        <Text style={styles.choiceTitle}>{option.title}</Text>
                        <Text style={styles.choiceHint}>{option.hint}</Text>
                      </Pressable>
                    ))}
                  </View>
                </>
              ) : null}

              {stepIndex === 1 ? (
                <>
                  <Text style={styles.panelTitle}>How old are you?</Text>
                  <Text style={styles.panelBody}>
                    We use this to keep the tone and examples feeling
                    appropriate, not to wall off features.
                  </Text>
                  <View style={styles.inlineOptions}>
                    {ageOptions.map((option) => (
                      <Pressable
                        key={option.value}
                        onPress={() => setAgeBracket(option.value)}
                        style={[
                          styles.pill,
                          ageBracket === option.value
                            ? styles.pillActive
                            : null,
                        ]}
                      >
                        <Text
                          style={[
                            styles.pillText,
                            ageBracket === option.value
                              ? styles.pillTextActive
                              : null,
                          ]}
                        >
                          {option.title}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </>
              ) : null}

              {stepIndex === 2 ? (
                <>
                  <Text style={styles.panelTitle}>
                    What should your study companion call you?
                  </Text>
                  <Text style={styles.panelBody}>
                    First name is enough. We’ll use it in encouragement,
                    summaries, and reminders.
                  </Text>
                  <TextInput
                    value={firstName}
                    onChangeText={setFirstName}
                    placeholder="Enter your first name"
                    placeholderTextColor="#8A927C"
                    style={styles.input}
                  />
                </>
              ) : null}

              {stepIndex === 3 ? (
                <>
                  <Text style={styles.panelTitle}>
                    Want a gentle reminder system?
                  </Text>
                  <Text style={styles.panelBody}>
                    We recommend notifications for unfinished study packs,
                    flashcard due dates, and streak nudges, but this stays a
                    soft choice.
                  </Text>
                  <View style={styles.toggleCard}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.choiceTitle}>Study reminders</Text>
                      <Text style={styles.choiceHint}>
                        Supportive, low-pressure nudges only.
                      </Text>
                    </View>
                    <Pressable
                      onPress={() => setNotificationsEnabled((prev) => !prev)}
                      style={[
                        styles.toggle,
                        notificationsEnabled
                          ? styles.toggleOn
                          : styles.toggleOff,
                      ]}
                    >
                      <View
                        style={[
                          styles.toggleKnob,
                          notificationsEnabled ? styles.toggleKnobOn : null,
                        ]}
                      />
                    </Pressable>
                  </View>
                </>
              ) : null}

              {stepIndex === 4 ? (
                <>
                  <Text style={styles.panelTitle}>
                    Here’s how the product works.
                  </Text>
                  <View style={styles.educationCard}>
                    {[
                      "Add a document or paste notes.",
                      "TryME turns it into a study pack, flashcards, quiz targets, and call prompts.",
                      "You land directly inside that document workspace and choose what to do next.",
                    ].map((item, index) => (
                      <View key={item} style={styles.educationRow}>
                        <View style={styles.educationIndex}>
                          <Text style={styles.educationIndexText}>
                            {index + 1}
                          </Text>
                        </View>
                        <Text style={styles.educationText}>{item}</Text>
                      </View>
                    ))}
                  </View>
                </>
              ) : null}

              {stepIndex === 5 ? (
                <>
                  <Text style={styles.panelTitle}>
                    Bring in your first learning material.
                  </Text>
                  <Text style={styles.panelBody}>
                    PDF, DOCX, TXT, or pasted notes. As soon as we process it,
                    you’ll drop straight into the document workspace.
                  </Text>

                  {busy ? (
                    <View style={styles.processingCard}>
                      <ActivityIndicator size="small" color={colors.primary} />
                      <Text style={styles.processingTitle}>
                        Building your first study pack
                      </Text>
                      <Text style={styles.processingBody}>
                        {processingLines[processingIndex]}
                      </Text>
                      <View style={styles.processingDots}>
                        {processingLines.map((line) => (
                          <View
                            key={line}
                            style={[
                              styles.processingDot,
                              processingLines[processingIndex] === line
                                ? styles.processingDotActive
                                : null,
                            ]}
                          />
                        ))}
                      </View>
                    </View>
                  ) : (
                    <>
                      <PrimaryButton
                        label="Upload document"
                        onPress={() => {
                          void handleDocumentReady("file");
                        }}
                        icon={
                          <Ionicons
                            name="cloud-upload-outline"
                            size={20}
                            color="#FFFFFF"
                          />
                        }
                      />

                      <TextInput
                        value={pastedText}
                        onChangeText={setPastedText}
                        multiline
                        textAlignVertical="top"
                        placeholder="Or paste your notes here..."
                        placeholderTextColor="#8A927C"
                        style={[styles.input, styles.textarea]}
                      />

                      <PrimaryButton
                        label="Use pasted notes"
                        variant="secondary"
                        onPress={() => {
                          void handleDocumentReady("paste");
                        }}
                        icon={
                          <Ionicons
                            name="document-text-outline"
                            size={20}
                            color={colors.ink}
                          />
                        }
                      />
                    </>
                  )}
                </>
              ) : null}

              {!busy ? (
                <View style={styles.footerActions}>
                  <PrimaryButton
                    label={
                      stepIndex === onboardingSteps.length - 1
                        ? "Stay here"
                        : "Continue"
                    }
                    onPress={() =>
                      setStepIndex((prev) =>
                        Math.min(onboardingSteps.length - 1, prev + 1),
                      )
                    }
                    disabled={stepIndex === 2 && firstName.trim().length < 2}
                    style={
                      stepIndex === onboardingSteps.length - 1
                        ? styles.hiddenButton
                        : null
                    }
                  />
                  <PrimaryButton
                    label={stepIndex === 0 ? "Back" : "Previous"}
                    variant="ghost"
                    onPress={() => {
                      if (stepIndex === 0) {
                        setMode("welcome");
                        return;
                      }
                      setStepIndex((prev) => Math.max(0, prev - 1));
                    }}
                  />
                </View>
              ) : null}
            </View>
          ) : null}
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#FFF7E8",
  },
  page: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 22,
    justifyContent: "center",
  },
  welcomePage: {
    flex: 1,
    justifyContent: "space-between",
    minHeight: "100%",
    paddingTop: 10,
    paddingBottom: 8,
  },
  welcomePageCompact: {
    paddingTop: 0,
  },
  welcomeCenterReplica: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    paddingTop: 6,
  },
  exaImage: {
    width: 460,
    height: 460,
    marginBottom: -92,
  },
  exaImageCompact: {
    width: 392,
    height: 392,
    marginBottom: -74,
  },
  welcomeWordmark: {
    color: colors.ink,
    fontFamily: fontFamily.heading,
    fontSize: 48,
    lineHeight: 60,
    textAlign: "center",
    letterSpacing: -1.8,
    marginBottom: 2,
  },
  tagline: {
    marginTop: 0,
    color: colors.inkMuted,
    fontFamily: fontFamily.bodySemi,
    fontSize: 15,
    lineHeight: 20,
    textAlign: "center",
    maxWidth: 240,
  },
  ctaStackWelcome: {
    marginTop: 12,
    gap: 12,
  },
  welcomePrimaryButton: {
    minHeight: 56,
  },
  welcomePrimaryButtonText: {
    fontSize: 17,
  },
  welcomeSecondaryButton: {
    minHeight: 52,
    paddingHorizontal: 12,
  },
  welcomeSecondaryButtonText: {
    fontSize: 15,
  },
  ctaStack: {
    marginTop: 24,
    gap: 12,
  },
  panel: {
    backgroundColor: "rgba(255,253,248,0.92)",
    borderRadius: 28,
    padding: 22,
    borderWidth: 1,
    borderColor: "#E3DACA",
    gap: 16,
  },
  panelEyebrow: {
    color: "#7D6A45",
    fontFamily: fontFamily.bodySemi,
    fontSize: 13,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  panelTitle: {
    color: colors.ink,
    fontFamily: fontFamily.heading,
    fontSize: 30,
    lineHeight: 36,
  },
  panelBody: {
    color: colors.inkMuted,
    fontFamily: fontFamily.body,
    fontSize: 17,
    lineHeight: 24,
  },
  progressHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  progressLabel: {
    color: "#7D6A45",
    fontFamily: fontFamily.bodySemi,
    fontSize: 15,
  },
  progressTrack: {
    height: 12,
    borderRadius: 999,
    backgroundColor: "#E9E1D3",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: colors.primary,
    borderRadius: 999,
  },
  choiceStack: {
    gap: 10,
  },
  choiceCard: {
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E3DACA",
    backgroundColor: "#FFFCF7",
    gap: 4,
  },
  choiceCardActive: {
    borderColor: "#1F6C68",
    backgroundColor: "#E7F0EA",
  },
  choiceTitle: {
    color: colors.ink,
    fontFamily: fontFamily.subheading,
    fontSize: 18,
  },
  choiceHint: {
    color: colors.inkMuted,
    fontFamily: fontFamily.body,
    fontSize: 15,
    lineHeight: 21,
  },
  inlineOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: "#F2EBDF",
  },
  pillActive: {
    backgroundColor: colors.primary,
  },
  pillText: {
    color: "#49625C",
    fontFamily: fontFamily.bodySemi,
    fontSize: 15,
  },
  pillTextActive: {
    color: "#FFFFFF",
  },
  input: {
    minHeight: 58,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E3DACA",
    backgroundColor: "#FFFCF7",
    paddingHorizontal: 16,
    paddingVertical: 15,
    color: colors.ink,
    fontFamily: fontFamily.body,
    fontSize: 17,
  },
  textarea: {
    minHeight: 140,
  },
  toggleCard: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    padding: 16,
    borderRadius: 20,
    backgroundColor: "#FFFCF7",
    borderWidth: 1,
    borderColor: "#E3DACA",
  },
  toggle: {
    width: 56,
    height: 32,
    borderRadius: 999,
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  toggleOn: {
    backgroundColor: colors.primary,
  },
  toggleOff: {
    backgroundColor: "#D8D1C4",
  },
  toggleKnob: {
    width: 24,
    height: 24,
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
  },
  toggleKnobOn: {
    alignSelf: "flex-end",
  },
  educationCard: {
    gap: 12,
  },
  educationRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
    padding: 14,
    borderRadius: 18,
    backgroundColor: "#FFFCF7",
    borderWidth: 1,
    borderColor: "#E3DACA",
  },
  educationIndex: {
    width: 28,
    height: 28,
    borderRadius: 999,
    backgroundColor: "#E7F0EA",
    alignItems: "center",
    justifyContent: "center",
  },
  educationIndexText: {
    color: colors.primary,
    fontFamily: fontFamily.bodySemi,
    fontSize: 14,
  },
  educationText: {
    flex: 1,
    color: colors.ink,
    fontFamily: fontFamily.body,
    fontSize: 16,
    lineHeight: 22,
  },
  processingCard: {
    alignItems: "center",
    paddingVertical: 22,
    paddingHorizontal: 16,
    borderRadius: 22,
    backgroundColor: "#FFFCF7",
    borderWidth: 1,
    borderColor: "#E3DACA",
    gap: 10,
  },
  processingTitle: {
    color: colors.ink,
    fontFamily: fontFamily.subheading,
    fontSize: 20,
  },
  processingBody: {
    color: colors.inkMuted,
    fontFamily: fontFamily.body,
    fontSize: 16,
    lineHeight: 22,
    textAlign: "center",
  },
  processingDots: {
    flexDirection: "row",
    gap: 8,
  },
  processingDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    backgroundColor: "#D8D1C4",
  },
  processingDotActive: {
    backgroundColor: colors.primary,
  },
  footerActions: {
    marginTop: 8,
    gap: 8,
  },
  hiddenButton: {
    display: "none",
  },
  loaderWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.page,
  },
});
