import { useEffect, useState } from "react";
import { useLocalSearchParams } from "expo-router";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { PrimaryButton } from "@/src/components/PrimaryButton";
import { signIn, signUp } from "@/src/lib/auth";
import { colors, fontFamily } from "@/src/constants/uiTheme";

type AuthMode = "signin" | "signup";

export default function AuthScreen() {
  const params = useLocalSearchParams<{ mode?: string }>();
  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (params.mode === "signup") {
      setMode("signup");
      return;
    }

    if (params.mode === "signin") {
      setMode("signin");
    }
  }, [params.mode]);

  async function handleSubmit() {
    const normalizedEmail = email.trim();

    if (!normalizedEmail) {
      setError("Email is required.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setBusy(true);
    setError("");
    setNotice("");

    try {
      if (mode === "signup") {
        const result = await signUp(normalizedEmail, password);

        if (!result.session) {
          setNotice(
            "Account created. If email confirmation is enabled, check your inbox before signing in.",
          );
        }
      } else {
        await signIn(normalizedEmail, password);
      }
    } catch (nextError) {
      setError(
        nextError instanceof Error
          ? nextError.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
      >
        <View style={styles.content}>
          <View style={styles.hero}>
            <Text style={styles.eyebrow}>Examigo</Text>
            <Text style={styles.title}>
              {mode === "signin" ? "Sign in" : "Create your account"}
            </Text>
            <Text style={styles.body}>
              Email and password auth is live. Google and Apple can slot into
              the same flow later.
            </Text>
          </View>

          <View style={styles.toggleRow}>
            <Pressable
              onPress={() => {
                setMode("signin");
                setError("");
                setNotice("");
              }}
              style={[
                styles.toggleButton,
                mode === "signin" ? styles.toggleButtonActive : null,
              ]}
            >
              <Text
                style={[
                  styles.toggleText,
                  mode === "signin" ? styles.toggleTextActive : null,
                ]}
              >
                Sign in
              </Text>
            </Pressable>
            <Pressable
              onPress={() => {
                setMode("signup");
                setError("");
                setNotice("");
              }}
              style={[
                styles.toggleButton,
                mode === "signup" ? styles.toggleButtonActive : null,
              ]}
            >
              <Text
                style={[
                  styles.toggleText,
                  mode === "signup" ? styles.toggleTextActive : null,
                ]}
              >
                Sign up
              </Text>
            </Pressable>
          </View>

          <View style={styles.form}>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="Email"
              autoCapitalize="none"
              keyboardType="email-address"
              placeholderTextColor="#98A0AD"
              style={styles.input}
            />

            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Password"
              secureTextEntry
              placeholderTextColor="#98A0AD"
              style={styles.input}
            />

            {error ? <Text style={styles.error}>{error}</Text> : null}
            {notice ? <Text style={styles.notice}>{notice}</Text> : null}

            <PrimaryButton
              label={busy ? "Please wait..." : mode === "signin" ? "Sign in" : "Create account"}
              onPress={() => {
                void handleSubmit();
              }}
              disabled={busy}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.page,
  },
  flex: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    gap: 24,
  },
  hero: {
    gap: 8,
  },
  eyebrow: {
    color: colors.primary,
    fontFamily: fontFamily.bodySemi,
    fontSize: 14,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  title: {
    color: colors.ink,
    fontFamily: fontFamily.heading,
    fontSize: 32,
    lineHeight: 38,
  },
  body: {
    color: colors.inkMuted,
    fontFamily: fontFamily.body,
    fontSize: 16,
    lineHeight: 22,
  },
  toggleRow: {
    flexDirection: "row",
    borderRadius: 999,
    backgroundColor: colors.cardSoft,
    padding: 4,
    gap: 4,
  },
  toggleButton: {
    flex: 1,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
  },
  toggleButtonActive: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
  },
  toggleText: {
    color: colors.inkMuted,
    fontFamily: fontFamily.bodySemi,
    fontSize: 15,
  },
  toggleTextActive: {
    color: colors.ink,
  },
  form: {
    gap: 12,
  },
  input: {
    minHeight: 56,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.card,
    paddingHorizontal: 16,
    color: colors.ink,
    fontFamily: fontFamily.body,
    fontSize: 16,
  },
  error: {
    color: colors.danger,
    fontFamily: fontFamily.bodySemi,
    fontSize: 14,
  },
  notice: {
    color: colors.primary,
    fontFamily: fontFamily.bodySemi,
    fontSize: 14,
  },
});
