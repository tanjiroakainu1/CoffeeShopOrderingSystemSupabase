import { getSupabase } from "@/lib/supabase/client";
import { userFromProfile } from "@/lib/supabase/maps";
import type { UserAccount, UserRole } from "@/types";

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthError";
  }
}

export async function getSessionUser(): Promise<UserAccount | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const { data: auth } = await sb.auth.getUser();
  if (!auth.user) return null;
  const { data, error } = await sb
    .from("profiles")
    .select("*")
    .eq("id", auth.user.id)
    .maybeSingle();
  if (error || !data) return null;
  return userFromProfile(data as Record<string, unknown>);
}

export async function signIn(email: string, password: string): Promise<UserAccount> {
  const sb = getSupabase();
  if (!sb) throw new AuthError("Supabase is not configured.");
  const norm = email.trim().toLowerCase();
  const { error } = await sb.auth.signInWithPassword({ email: norm, password });
  if (error) throw new AuthError(error.message);
  const user = await getSessionUser();
  if (!user) throw new AuthError("Could not load profile.");
  return user;
}

export async function signOut(): Promise<void> {
  const sb = getSupabase();
  if (sb) await sb.auth.signOut();
  const { resetSupabaseClient } = await import("@/lib/supabase/client");
  resetSupabaseClient();
}

export async function registerCustomer(input: {
  email: string;
  password: string;
  displayName?: string;
  birthdayIso?: string;
  sex?: string;
}): Promise<UserAccount> {
  const sb = getSupabase();
  if (!sb) throw new AuthError("Supabase is not configured.");
  const norm = input.email.trim().toLowerCase();
  const meta: Record<string, string> = {
    role: "customer",
    display_name: (input.displayName ?? "").trim(),
  };
  if (input.birthdayIso) meta.birthday_iso = input.birthdayIso;
  if (input.sex) meta.sex = input.sex;
  const { error } = await sb.auth.signUp({
    email: norm,
    password: input.password,
    options: { data: meta },
  });
  if (error) throw new AuthError(error.message);
  const { error: signInErr } = await sb.auth.signInWithPassword({
    email: norm,
    password: input.password,
  });
  if (signInErr) throw new AuthError(signInErr.message);
  const user = await getSessionUser();
  if (!user) throw new AuthError("Account created but profile missing.");
  return user;
}

export async function updateProfile(input: {
  accountId: string;
  displayName: string;
  birthdayIso?: string | null;
  sex?: string | null;
}): Promise<void> {
  const sb = getSupabase();
  if (!sb) throw new AuthError("Supabase is not configured.");
  const { error } = await sb
    .from("profiles")
    .update({
      display_name: input.displayName.trim(),
      birthday_iso: input.birthdayIso,
      sex: input.sex,
    })
    .eq("account_id", input.accountId);
  if (error) throw new AuthError(error.message);
}

export async function changeOwnPassword(input: {
  accountId: string;
  email: string;
  currentPassword: string;
  newPassword: string;
}): Promise<void> {
  const sb = getSupabase();
  if (!sb) throw new AuthError("Supabase is not configured.");
  const { email, currentPassword, newPassword } = input;
  if (newPassword.length < 6) {
    throw new AuthError("New password must be at least 6 characters.");
  }
  if (currentPassword === newPassword) {
    throw new AuthError("Choose a password different from your current one.");
  }
  const norm = email.trim().toLowerCase();
  const { error: signInErr } = await sb.auth.signInWithPassword({
    email: norm,
    password: currentPassword,
  });
  if (signInErr) {
    throw new AuthError("Current password is incorrect.");
  }
  const { error } = await sb.auth.updateUser({ password: newPassword });
  if (error) throw new AuthError(error.message);
}

/** @deprecated Use changeOwnPassword — kept for internal callers */
export async function changePassword(newPassword: string): Promise<void> {
  const sb = getSupabase();
  if (!sb) throw new AuthError("Supabase is not configured.");
  if (newPassword.length < 6) {
    throw new AuthError("New password must be at least 6 characters.");
  }
  const { error } = await sb.auth.updateUser({ password: newPassword });
  if (error) throw new AuthError(error.message);
}

export const ADMIN_EMAIL = "admin@gmail.com";
export const DEMO_CUSTOMER_EMAIL = "customer@gmail.com";

export async function customerAccountExists(email: string): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;
  const norm = email.trim().toLowerCase();
  const { data } = await sb
    .from("profiles")
    .select("account_id")
    .eq("email", norm)
    .eq("role", "customer")
    .maybeSingle();
  return !!data;
}

export async function adminCreateUser(input: {
  email: string;
  password: string;
  role: UserRole;
  displayName?: string;
  birthdayIso?: string | null;
  sex?: string | null;
}): Promise<void> {
  const sb = getSupabase();
  if (!sb) throw new AuthError("Supabase is not configured.");
  const norm = input.email.trim().toLowerCase();
  if (!norm || !input.password) throw new AuthError("Email and password are required.");
  if (input.password.length < 6) throw new AuthError("Password must be at least 6 characters.");
  if (norm === ADMIN_EMAIL || norm === DEMO_CUSTOMER_EMAIL) {
    throw new AuthError("This email is reserved.");
  }
  const { error } = await sb.rpc("admin_create_user", {
    p_email: norm,
    p_password: input.password,
    p_role: input.role,
    p_display_name: (input.displayName ?? "").trim(),
    p_birthday_iso: input.role === "customer" ? input.birthdayIso ?? null : null,
    p_sex: input.role === "customer" ? input.sex ?? null : null,
  });
  if (error) throw new AuthError(error.message);
}

export async function adminUpdateUser(input: {
  authUserId: string;
  accountId: string;
  email: string;
  role: UserRole;
  displayName: string;
  birthdayIso?: string | null;
  sex?: string | null;
  newPassword?: string;
}): Promise<void> {
  const sb = getSupabase();
  if (!sb) throw new AuthError("Supabase is not configured.");
  const norm = input.email.trim().toLowerCase();
  if (input.newPassword && input.newPassword.length < 6) {
    throw new AuthError("Password must be at least 6 characters.");
  }
  const { data: targetRow } = await sb
    .from("profiles")
    .select("email, role")
    .eq("account_id", input.accountId)
    .maybeSingle();
  if (!targetRow) throw new AuthError("Account not found.");
  const currentEmail = (targetRow as Record<string, unknown>).email as string;
  if (currentEmail.toLowerCase() === ADMIN_EMAIL) {
    if (norm !== ADMIN_EMAIL) {
      throw new AuthError("The console login email cannot be changed.");
    }
    if (input.role !== "admin") {
      throw new AuthError("The console login must stay an admin account.");
    }
  }
  if (norm !== currentEmail.toLowerCase()) {
    const { error } = await sb.rpc("admin_set_user_email", {
      p_target: input.authUserId,
      p_email: norm,
    });
    if (error) throw new AuthError(error.message);
  }
  const { error: profileErr } = await sb
    .from("profiles")
    .update({
      role: input.role,
      display_name: input.displayName.trim(),
      birthday_iso: input.role === "customer" ? input.birthdayIso : null,
      sex: input.role === "customer" ? input.sex : null,
    })
    .eq("account_id", input.accountId);
  if (profileErr) throw new AuthError(profileErr.message);
  if (input.newPassword) {
    const { error } = await sb.rpc("admin_set_user_password", {
      p_target: input.authUserId,
      p_password: input.newPassword,
    });
    if (error) throw new AuthError(error.message);
  }
}

export async function adminDeleteUser(authUserId: string, accountId: string): Promise<void> {
  const sb = getSupabase();
  if (!sb) throw new AuthError("Supabase is not configured.");
  const { data: auth } = await sb.auth.getUser();
  if (auth.user?.id === authUserId) {
    throw new AuthError("You cannot delete the account you are signed in with.");
  }
  const { data: row } = await sb
    .from("profiles")
    .select("email, role")
    .eq("account_id", accountId)
    .maybeSingle();
  if (!row) throw new AuthError("Account not found.");
  const em = ((row as Record<string, unknown>).email as string).toLowerCase();
  if (em === ADMIN_EMAIL) throw new AuthError("Cannot delete the primary console admin account.");
  const { data: admins } = await sb.from("profiles").select("account_id").eq("role", "admin");
  if ((row as Record<string, unknown>).role === "admin" && (admins?.length ?? 0) <= 1) {
    throw new AuthError("Cannot delete the last admin.");
  }
  const { error } = await sb.rpc("admin_delete_user", { p_target: authUserId });
  if (error) throw new AuthError(error.message);
}
