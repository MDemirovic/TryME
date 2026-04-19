import { supabase } from "@/src/lib/supabase";
import { getProfileByUserId } from "@/src/lib/profile";

function normalizeAuthMessage(message: string) {
  const lowered = message.toLowerCase();

  if (lowered.includes("invalid login credentials")) {
    return "Email or password is not correct.";
  }

  if (lowered.includes("already registered")) {
    return "This email is already registered. Try signing in instead.";
  }

  if (lowered.includes("email not confirmed")) {
    return "Check your inbox and confirm your email before signing in.";
  }

  if (lowered.includes("password")) {
    return message;
  }

  return message || "Something went wrong. Please try again.";
}

export async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
  });

  if (error) {
    throw new Error(normalizeAuthMessage(error.message));
  }

  return data;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });

  if (error) {
    throw new Error(normalizeAuthMessage(error.message));
  }

  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw new Error(normalizeAuthMessage(error.message));
  }
}

export async function getCurrentSession() {
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    throw new Error(normalizeAuthMessage(error.message));
  }

  return data.session;
}

export async function getCurrentUserProfile() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    throw new Error(normalizeAuthMessage(error.message));
  }

  if (!user) {
    return null;
  }

  return getProfileByUserId(user.id);
}
