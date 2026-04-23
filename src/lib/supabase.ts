import "react-native-url-polyfill/auto";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import { Platform } from "react-native";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase env vars. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.",
  );
}

const isWeb = Platform.OS === "web";
const isWebBrowser =
  isWeb &&
  typeof window !== "undefined" &&
  typeof window.localStorage !== "undefined";

const storage = {
  getItem(key: string) {
    if (isWebBrowser) {
      return Promise.resolve(window.localStorage.getItem(key));
    }

    if (isWeb) {
      return Promise.resolve(null);
    }

    return AsyncStorage.getItem(key);
  },
  setItem(key: string, value: string) {
    if (isWebBrowser) {
      window.localStorage.setItem(key, value);
      return Promise.resolve();
    }

    if (isWeb) {
      return Promise.resolve();
    }

    return AsyncStorage.setItem(key, value);
  },
  removeItem(key: string) {
    if (isWebBrowser) {
      window.localStorage.removeItem(key);
      return Promise.resolve();
    }

    if (isWeb) {
      return Promise.resolve();
    }

    return AsyncStorage.removeItem(key);
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
