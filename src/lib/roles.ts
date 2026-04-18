import type { Database } from "@/lib/database.types";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

export function isAdmin(profile: Pick<ProfileRow, "role"> | null): boolean {
  return profile?.role === "admin";
}
