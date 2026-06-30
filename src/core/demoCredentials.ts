import { ADMIN_EMAIL } from "@/services/authService";

/** Shown on sign-in for demo / console access — must match Supabase seed + [AuthService]. */
export const DEMO_ADMIN_CREDENTIALS = {
  label: "Console admin",
  email: ADMIN_EMAIL,
  password: "admin123",
} as const;
