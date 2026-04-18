import { createServerSupabaseClient, createServiceRoleSupabaseClient } from "@/lib/supabase-server";
import { isAdmin } from "@/lib/roles";

export async function requireUser() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return { supabase, user };
}

export async function requireAdmin() {
  const { supabase, user } = await requireUser();
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role,email,full_name")
    .eq("id", user.id)
    .maybeSingle();

  if (error || !profile || !isAdmin(profile)) {
    throw new Error("Forbidden");
  }

  return {
    supabase,
    service: createServiceRoleSupabaseClient(),
    user,
    profile,
  };
}
