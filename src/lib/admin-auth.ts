import { createServerSupabaseClient, createServiceRoleSupabaseClient } from "@/lib/supabase-server";
import {
  adminOpenToAnyAuthenticatedUser,
  emailHasAdminAccess,
} from "@/lib/admin-access";
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
  const loginEmail = user.email?.trim().toLowerCase() ?? null;

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role,email,full_name")
    .eq("id", user.id)
    .maybeSingle();

  const open = adminOpenToAnyAuthenticatedUser();
  const allowlisted = emailHasAdminAccess(loginEmail);
  const roleOk = profile && !error && isAdmin(profile);

  if (!open && !allowlisted && !roleOk) {
    throw new Error("Forbidden");
  }

  const treatAsAdmin = open || allowlisted;

  const profileOut =
    profile && !error
      ? treatAsAdmin && profile.role !== "admin"
        ? { ...profile, role: "admin" as const }
        : profile
      : {
          role: "admin" as const,
          email: loginEmail ?? user.email ?? null,
          full_name:
            (user.user_metadata as { full_name?: string } | undefined)
              ?.full_name ?? null,
        };

  return {
    supabase,
    service: createServiceRoleSupabaseClient(),
    user,
    profile: profileOut,
  };
}
