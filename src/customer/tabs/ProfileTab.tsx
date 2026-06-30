import { useEffect, useState } from "react";
import { Calendar, Eye, EyeOff, Lock, Mail, User } from "lucide-react";
import { formatDateLong, formatDateTime } from "@/core/formatters";
import { Button, Card, PageHeader, SectionLabel } from "@/components/ui";
import { CUSTOMER_SECTIONS } from "@/core/appRoutes";
import { useAuth } from "@/context/AuthContext";
import { AuthError, changeOwnPassword, updateProfile } from "@/services/authService";
import type { UserAccount } from "@/types";

function avatarLetter(user: UserAccount): string {
  const n = user.displayName.trim();
  if (n) return n.slice(0, 1).toUpperCase();
  return user.email.slice(0, 1).toUpperCase();
}

function ProfileDataRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="profile-data-row">
      <dt className="profile-data-label">{label}</dt>
      <dd className="profile-data-value">{value}</dd>
    </div>
  );
}

function PasswordField({
  id,
  label,
  value,
  onChange,
  placeholder,
  visible,
  onToggleVisible,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  visible: boolean;
  onToggleVisible: () => void;
}) {
  return (
    <label className="form-label" htmlFor={id}>
      {label}
      <span className="relative mt-1.5 block">
        <Lock className="auth-field-icon" aria-hidden />
        <input
          id={id}
          className="input-field auth-field-input auth-field-input-icon pr-11"
          type={visible ? "text" : "password"}
          autoComplete={id.includes("current") ? "current-password" : "new-password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
        <button
          type="button"
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-muted transition hover:text-brown-deep"
          aria-label={visible ? "Hide password" : "Show password"}
          onClick={onToggleVisible}
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </span>
    </label>
  );
}

export function CustomerProfileTab({ user }: { user: UserAccount }) {
  const { refresh } = useAuth();
  const [editing, setEditing] = useState(false);
  const [editingPassword, setEditingPassword] = useState(false);
  const [displayName, setDisplayName] = useState(user.displayName);
  const [birthdayIso, setBirthdayIso] = useState(user.birthdayIso ?? "");
  const [sex, setSex] = useState(user.sex ?? "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setDisplayName(user.displayName);
    setBirthdayIso(user.birthdayIso ?? "");
    setSex(user.sex ?? "");
  }, [user]);

  const resetPasswordForm = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setShowCurrent(false);
    setShowNew(false);
    setShowConfirm(false);
  };

  const saveProfile = async () => {
    setBusy(true);
    setErr(null);
    setMsg(null);
    try {
      await updateProfile({
        accountId: user.accountId,
        displayName,
        birthdayIso: birthdayIso || null,
        sex: sex || null,
      });
      await refresh();
      setEditing(false);
      setMsg("Profile saved to Supabase.");
    } catch (e) {
      setErr(e instanceof AuthError ? e.message : "Could not save profile.");
    } finally {
      setBusy(false);
    }
  };

  const savePassword = async () => {
    setErr(null);
    setMsg(null);
    if (!currentPassword) {
      setErr("Enter your current password.");
      return;
    }
    if (newPassword.length < 6) {
      setErr("New password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setErr("New passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      await changeOwnPassword({
        accountId: user.accountId,
        email: user.email,
        currentPassword,
        newPassword,
      });
      resetPasswordForm();
      setEditingPassword(false);
      setMsg("Password updated.");
    } catch (e) {
      setErr(e instanceof AuthError ? e.message : "Could not change password.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="page-section">
      <PageHeader
        eyebrow="Your account"
        title={CUSTOMER_SECTIONS.profile.title}
        subtitle={CUSTOMER_SECTIONS.profile.subtitle}
        action={
          !editing ? (
            <Button variant="ghost" className="min-h-10" onClick={() => setEditing(true)}>
              Edit profile
            </Button>
          ) : (
            <Button variant="ghost" className="min-h-10" onClick={() => setEditing(false)}>
              Cancel
            </Button>
          )
        }
      />

      {msg ? <p className="alert-success">{msg}</p> : null}
      {err ? <p className="alert-error">{err}</p> : null}

      <Card className="profile-hero overflow-hidden border-yellow/40 bg-gradient-to-br from-white via-cream to-emerald-light p-0">
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:p-6">
          <div className="profile-hero-avatar">{avatarLetter(user)}</div>
          <div className="min-w-0 flex-1">
            <p className="font-serif text-2xl font-extrabold text-brown-deep">
              {user.displayName.trim() || "Your profile"}
            </p>
            <p className="mt-1 truncate text-sm text-muted">{user.email}</p>
            <p className="mt-2 inline-flex rounded-full bg-yellow/30 px-3 py-1 text-xs font-bold uppercase tracking-wide text-emerald-deep">
              {user.role}
            </p>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="space-y-4">
          <SectionLabel>Registration data</SectionLabel>
          <dl className="profile-data-grid">
            <ProfileDataRow label="Display name" value={user.displayName.trim() || "—"} />
            <ProfileDataRow label="Email" value={user.email} />
            <ProfileDataRow label="Birthday" value={formatDateLong(user.birthdayIso)} />
            <ProfileDataRow label="Sex" value={user.sex?.trim() || "—"} />
            <ProfileDataRow label="Account ID" value={user.accountId} />
            <ProfileDataRow label="Member since" value={formatDateTime(user.createdAt)} />
            <ProfileDataRow label="Last updated" value={formatDateTime(user.updatedAt)} />
          </dl>
        </Card>

        <Card className="space-y-4">
          <SectionLabel>{editing ? "Edit registration details" : "Update your details"}</SectionLabel>
          {editing ? (
            <div className="space-y-3">
              <label className="form-label">
                Full name
                <input
                  className="input-field mt-1.5"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your name"
                  required
                />
              </label>
              <label className="form-label">
                Birthday
                <input
                  className="input-field mt-1.5"
                  type="date"
                  value={birthdayIso}
                  onChange={(e) => setBirthdayIso(e.target.value)}
                />
              </label>
              <label className="form-label">
                Sex
                <select className="input-field mt-1.5" value={sex} onChange={(e) => setSex(e.target.value)}>
                  <option value="">Select (optional)</option>
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="other">Other</option>
                </select>
              </label>
              <label className="form-label">
                Email
                <input className="input-field mt-1.5 bg-emerald-light/80" value={user.email} readOnly />
              </label>
              <Button className="w-full gap-2" disabled={busy} onClick={() => void saveProfile()}>
                <User className="h-4 w-4 shrink-0" />
                {busy ? "Saving…" : "Save to Supabase"}
              </Button>
            </div>
          ) : (
            <div className="space-y-3 text-sm text-muted">
              <p className="flex items-center gap-2">
                <User className="h-4 w-4 shrink-0 text-emerald" />
                Name, birthday, and sex sync with the mobile app.
              </p>
              <p className="flex items-center gap-2">
                <Mail className="h-4 w-4 shrink-0 text-emerald" />
                Email is tied to Supabase Auth and cannot be changed here.
              </p>
              <p className="flex items-center gap-2">
                <Calendar className="h-4 w-4 shrink-0 text-emerald" />
                Data is stored in the <code className="font-mono text-xs">profiles</code> table.
              </p>
              <Button className="mt-2 w-full" onClick={() => setEditing(true)}>
                Edit profile
              </Button>
            </div>
          )}
        </Card>
      </div>

      <Card className="profile-password-card">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <SectionLabel>Security</SectionLabel>
            <p className="mt-1 font-bold text-brown-deep">Change password</p>
            <p className="text-sm text-muted">
              Verify your current password, then set a new one via Supabase Auth.
            </p>
          </div>
          <Button
            variant="ghost"
            className="text-sm"
            onClick={() => {
              setEditingPassword((v) => !v);
              if (editingPassword) resetPasswordForm();
            }}
          >
            {editingPassword ? "Cancel" : "Change password"}
          </Button>
        </div>
        {editingPassword ? (
          <div className="mt-4 space-y-3 border-t border-emerald-deep/10 pt-4">
            <p className="text-sm font-semibold text-brown-deep">{user.email}</p>
            <PasswordField
              id="profile-current-password"
              label="Current password"
              value={currentPassword}
              onChange={setCurrentPassword}
              placeholder="Enter current password"
              visible={showCurrent}
              onToggleVisible={() => setShowCurrent((v) => !v)}
            />
            <PasswordField
              id="profile-new-password"
              label="New password"
              value={newPassword}
              onChange={setNewPassword}
              placeholder="Min. 6 characters"
              visible={showNew}
              onToggleVisible={() => setShowNew((v) => !v)}
            />
            <PasswordField
              id="profile-confirm-password"
              label="Confirm new password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              placeholder="Re-enter new password"
              visible={showConfirm}
              onToggleVisible={() => setShowConfirm((v) => !v)}
            />
            <Button className="w-full gap-2" disabled={busy} onClick={() => void savePassword()}>
              <Lock className="h-4 w-4 shrink-0" />
              {busy ? "Updating…" : "Update password"}
            </Button>
          </div>
        ) : null}
      </Card>
    </div>
  );
}
