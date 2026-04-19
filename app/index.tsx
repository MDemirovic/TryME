import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Redirect, router } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppLoader } from "@/src/components/AppLoader";
import { PrimaryButton } from "@/src/components/PrimaryButton";
import { colors, fontFamily } from "@/src/constants/uiTheme";
import { signIn } from "@/src/lib/auth";
import { useAuth } from "@/src/providers/AuthProvider";

type EntryMode = "welcome" | "signin";

export default function EntryScreen() {
  const { loading, user, profile } = useAuth();
  const { width, height } = useWindowDimensions();
  const [mode, setMode] = useState<EntryMode>("welcome");
  const [signinEmail, setSigninEmail] = useState("");
  const [signinPassword, setSigninPassword] = useState("");
  const [signinBusy, setSigninBusy] = useState(false);
  const [signinError, setSigninError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const compactWelcome = width < 390 || height < 780;
  const compactSignin = width < 390 || height < 820;
  const ultraCompactSignin = width < 370 || height < 740;

  if (loading) {
    return <AppLoader label="Checking your session..." />;
  }

  if (user) {
    if (!profile?.onboarding_completed) {
      return <Redirect href="/(onboarding)" />;
    }

    return <Redirect href="/(main)/library" />;
  }

  async function handleInlineSignIn() {
    const normalizedEmail = signinEmail.trim();
    if (!normalizedEmail) {
      setSigninError("Email is required.");
      return;
    }

    if (signinPassword.length < 8) {
      setSigninError("Password must be at least 8 characters.");
      return;
    }

    setSigninBusy(true);
    setSigninError("");

    try {
      await signIn(normalizedEmail, signinPassword);
    } catch (error) {
      setSigninError(
        error instanceof Error
          ? error.message
          : "Could not sign in. Please try again.",
      );
    } finally {
      setSigninBusy(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <LinearGradient
        colors={["#FFF8EA", "#F4EFE5", "#E6F0EA"]}
        style={styles.page}
      >
        {mode === "welcome" ? (
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
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
                  onPress={() =>
                    router.push({
                      pathname: "/(auth)",
                      params: { mode: "signup" },
                    })
                  }
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
          </ScrollView>
        ) : null}

        {mode === "signin" ? (
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={styles.signinViewport}
          >
            <View
              style={[
                styles.signinShell,
                compactSignin ? styles.signinShellCompact : null,
                ultraCompactSignin ? styles.signinShellUltraCompact : null,
              ]}
            >
              <View style={styles.signinHero}>
                <View
                  style={[
                    styles.avatarGlow,
                    compactSignin ? styles.avatarGlowCompact : null,
                  ]}
                />
                <View
                  style={[
                    styles.avatarRing,
                    compactSignin ? styles.avatarRingCompact : null,
                  ]}
                >
                  <Image
                    source={require("../assets/images/exa.png")}
                    style={styles.avatarImage}
                    resizeMode="cover"
                  />
                </View>
                <Text
                  style={[
                    styles.signinTitle,
                    compactSignin ? styles.signinTitleCompact : null,
                    ultraCompactSignin ? styles.signinTitleUltraCompact : null,
                  ]}
                >
                  Welcome Back
                </Text>
                <Text
                  style={[
                    styles.signinSubtitle,
                    compactSignin ? styles.signinSubtitleCompact : null,
                  ]}
                >
                  Continue your journey of discovery.
                </Text>
              </View>

              <View
                style={[
                  styles.formBlock,
                  compactSignin ? styles.formBlockCompact : null,
                ]}
              >
                <Text style={styles.fieldLabel}>Email</Text>
                <View style={styles.inputRow}>
                  <TextInput
                    value={signinEmail}
                    onChangeText={setSigninEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    placeholder="scholar@examigo.com"
                    placeholderTextColor="#969B92"
                    style={styles.authInput}
                  />
                  <Ionicons name="mail-outline" size={20} color="#979D92" />
                </View>

                <View style={styles.passwordLabelRow}>
                  <Text style={styles.fieldLabel}>Password</Text>
                  <Pressable
                    onPress={() =>
                      Alert.alert(
                        "Forgot password",
                        "Password reset flow will be connected next.",
                      )
                    }
                  >
                    <Text style={styles.forgotText}>Forgot Password?</Text>
                  </Pressable>
                </View>
                <View style={styles.inputRow}>
                  <TextInput
                    value={signinPassword}
                    onChangeText={setSigninPassword}
                    placeholder="••••••••"
                    secureTextEntry={!showPassword}
                    placeholderTextColor="#969B92"
                    style={styles.authInput}
                  />
                  <Pressable onPress={() => setShowPassword((prev) => !prev)}>
                    <Ionicons
                      name={showPassword ? "eye-outline" : "lock-closed-outline"}
                      size={20}
                      color="#979D92"
                    />
                  </Pressable>
                </View>

                {signinError ? (
                  <Text style={styles.signinError}>{signinError}</Text>
                ) : null}

                <PrimaryButton
                  label={signinBusy ? "Signing in..." : "Sign In"}
                  onPress={() => {
                    void handleInlineSignIn();
                  }}
                  disabled={signinBusy}
                  style={styles.signinPrimaryButton}
                  textStyle={styles.signinPrimaryButtonText}
                />

                <View style={styles.separatorRow}>
                  <View style={styles.separatorLine} />
                  <Text style={styles.separatorText}>OR SCHOLAR ACCESS</Text>
                  <View style={styles.separatorLine} />
                </View>

                <View style={styles.providerRow}>
                  <Pressable
                    style={styles.providerButton}
                    onPress={() =>
                      Alert.alert(
                        "Google sign-in not wired yet",
                        "Email sign-in is active now. Google will be added next.",
                      )
                    }
                  >
                    <Ionicons name="logo-google" size={16} color="#111111" />
                    <Text style={styles.providerText}>Google</Text>
                  </Pressable>
                  <Pressable
                    style={styles.providerButton}
                    onPress={() =>
                      Alert.alert(
                        "Edu ID not wired yet",
                        "Email sign-in is active now. Edu ID will be added next.",
                      )
                    }
                  >
                    <Ionicons name="school-outline" size={16} color="#111111" />
                    <Text style={styles.providerText}>Edu ID</Text>
                  </Pressable>
                </View>

                <Pressable
                  style={styles.signupPromptRow}
                  onPress={() =>
                    router.push({
                      pathname: "/(auth)",
                      params: { mode: "signup" },
                    })
                  }
                >
                  <Text style={styles.signupPromptText}>
                    Don&apos;t have an account?
                  </Text>
                  <Text style={styles.signupPromptLink}> Sign Up</Text>
                </Pressable>

                <Pressable onPress={() => setMode("welcome")}>
                  <Text style={styles.backText}>Back</Text>
                </Pressable>
              </View>
            </View>
          </KeyboardAvoidingView>
        ) : null}
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
  signinViewport: {
    flex: 1,
    paddingHorizontal: 22,
    paddingTop: 6,
    paddingBottom: 8,
  },
  signinShell: {
    flex: 1,
    justifyContent: "space-between",
    gap: 10,
  },
  signinShellCompact: {
    gap: 8,
    paddingTop: 2,
    paddingBottom: 4,
  },
  signinShellUltraCompact: {
    gap: 6,
    paddingTop: 0,
    paddingBottom: 2,
  },
  signinHero: {
    alignItems: "center",
    gap: 6,
  },
  avatarGlow: {
    position: "absolute",
    top: 2,
    width: 100,
    height: 100,
    borderRadius: 999,
    backgroundColor: "rgba(31,108,104,0.2)",
    transform: [{ scale: 1.28 }],
  },
  avatarGlowCompact: {
    width: 88,
    height: 88,
    transform: [{ scale: 1.22 }],
  },
  avatarRing: {
    width: 96,
    height: 96,
    borderRadius: 999,
    backgroundColor: "#1F6C68",
    padding: 4,
    overflow: "hidden",
  },
  avatarRingCompact: {
    width: 84,
    height: 84,
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: 999,
  },
  signinTitle: {
    marginTop: 8,
    color: "#111111",
    fontFamily: fontFamily.heading,
    fontSize: 54,
    lineHeight: 58,
    letterSpacing: -1.2,
    textAlign: "center",
  },
  signinTitleCompact: {
    marginTop: 4,
    fontSize: 46,
    lineHeight: 50,
    letterSpacing: -0.8,
  },
  signinTitleUltraCompact: {
    fontSize: 40,
    lineHeight: 44,
  },
  signinSubtitle: {
    color: "#2B3B3A",
    fontFamily: fontFamily.body,
    fontSize: 16,
    lineHeight: 21,
    textAlign: "center",
    maxWidth: 320,
  },
  signinSubtitleCompact: {
    fontSize: 15,
    lineHeight: 20,
    maxWidth: 300,
  },
  formBlock: {
    gap: 10,
  },
  formBlockCompact: {
    gap: 8,
  },
  fieldLabel: {
    color: "#24312F",
    fontFamily: fontFamily.bodySemi,
    fontSize: 14,
  },
  passwordLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  forgotText: {
    color: colors.primary,
    fontFamily: fontFamily.bodySemi,
    fontSize: 12,
  },
  inputRow: {
    minHeight: 50,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#DDD9CF",
    backgroundColor: "#E5E2D9",
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  authInput: {
    flex: 1,
    color: "#1E2433",
    fontFamily: fontFamily.body,
    fontSize: 15,
    paddingVertical: 8,
  },
  signinError: {
    color: "#B04B3D",
    fontFamily: fontFamily.bodySemi,
    fontSize: 13,
    lineHeight: 18,
  },
  signinPrimaryButton: {
    marginTop: 2,
    minHeight: 56,
    borderRadius: 999,
    backgroundColor: "#1F6C68",
  },
  signinPrimaryButtonText: {
    fontSize: 20,
  },
  separatorRow: {
    marginTop: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#D7D3C8",
  },
  separatorText: {
    color: "#8A8E86",
    fontFamily: fontFamily.bodySemi,
    fontSize: 12,
    letterSpacing: 0.8,
  },
  providerRow: {
    flexDirection: "row",
    gap: 8,
  },
  providerButton: {
    flex: 1,
    minHeight: 50,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#E3DACA",
    backgroundColor: "#F2EFE6",
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  providerText: {
    color: "#131823",
    fontFamily: fontFamily.subheading,
    fontSize: 16,
  },
  signupPromptRow: {
    marginTop: 4,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  signupPromptText: {
    color: "#2B3B3A",
    fontFamily: fontFamily.body,
    fontSize: 16,
  },
  signupPromptLink: {
    color: colors.primary,
    fontFamily: fontFamily.subheading,
    fontSize: 16,
  },
  backText: {
    alignSelf: "center",
    color: "#64706F",
    fontFamily: fontFamily.bodySemi,
    fontSize: 14,
    marginTop: 0,
  },
});
