import { supabase } from "@/src/lib/supabase";
import type { OnboardingProfileInput, Profile } from "@/src/types/app";

function mapProfile(row: Record<string, unknown>): Profile {
  return {
    id: String(row.id),
    email: typeof row.email === "string" ? row.email : null,
    first_name: typeof row.first_name === "string" ? row.first_name : null,
    age: typeof row.age === "string" ? row.age : null,
    app_language:
      typeof row.app_language === "string" ? row.app_language : null,
    onboarding_completed: Boolean(row.onboarding_completed),
    notifications_recommended_seen: Boolean(
      row.notifications_recommended_seen,
    ),
    created_at:
      typeof row.created_at === "string" ? row.created_at : null,
    updated_at:
      typeof row.updated_at === "string" ? row.updated_at : null,
  };
}

export async function getProfileByUserId(userId: string): Promise<Profile> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) {
    throw new Error(error.message || "Could not load your profile.");
  }

  return mapProfile(data as Record<string, unknown>);
}

export async function updateMyOnboardingProfile(
  updates: OnboardingProfileInput,
): Promise<Profile> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw new Error(userError.message || "Could not resolve the current user.");
  }

  if (!user) {
    throw new Error("You must be signed in to complete onboarding.");
  }

  const { data, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", user.id)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message || "Could not save onboarding progress.");
  }

  return mapProfile(data as Record<string, unknown>);
}
