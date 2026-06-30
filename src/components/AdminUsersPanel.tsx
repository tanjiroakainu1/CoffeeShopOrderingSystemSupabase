import { useCallback, useMemo, useState } from "react";
import { KeyRound, Pencil, Trash2, UserPlus } from "lucide-react";
import { AdminQueryState, useSupabaseQuery } from "@/hooks/useSupabaseQuery";
import { useAuth } from "@/context/AuthContext";
import { ADMIN_SECTIONS } from "@/core/appRoutes";
import { formatDateLong } from "@/core/formatters";
import { loadProfiles, type ProfileRow } from "@/services/supabaseService";
import {
  adminCreateUser,
  adminDeleteUser,
  adminUpdateUser,
  ADMIN_EMAIL,
  AuthError,
} from "@/services/authService";
import { Button, Card, PageHeader, StatusBadge } from "@/components/ui";
import type { UserRole } from "@/types";

const SEX_OPTIONS = ["Female", "Male"] as const;

type UserFormState = {
  email: string;
  role: UserRole;
  displayName: string;
  password: string;
  passwordConfirm: string;
  birthdayIso: string;
  sex: string;
};

const emptyForm = (): UserFormState => ({
  email: "",
  role: "customer",
  displayName: "",
  password: "",
  passwordConfirm: "",
  birthdayIso: "",
  sex: "",
});

function UserFormModal({
  mode,
  user,
  onClose,
  onSaved,
}: {
  mode: "add" | "edit";
  user: ProfileRow | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isReservedAdmin = user?.email.toLowerCase() === ADMIN_EMAIL;
  const [form, setForm] = useState<UserFormState>(() =>
    mode === "edit" && user
      ? {
          email: user.email,
          role: user.role,
          displayName: user.displayName,
          password: "",
          passwordConfirm: "",
          birthdayIso: user.birthdayIso?.slice(0, 10) ?? "",
          sex: user.sex ?? "",
        }
      : emptyForm(),
  );
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const patch = (p: Partial<UserFormState>) => setForm((f) => ({ ...f, ...p }));

  const submit = async () => {
    const email = form.email.trim().toLowerCase();
    if (!email) {
      setErr("Email is required.");
      return;
    }
    if (mode === "add") {
      if (form.password.length < 6) {
        setErr("Password must be at least 6 characters.");
        return;
      }
      if (form.password !== form.passwordConfirm) {
        setErr("Passwords do not match.");
        return;
      }
    } else if (form.password && form.password.length < 6) {
      setErr("Password must be at least 6 characters.");
      return;
    } else if (form.password && form.password !== form.passwordConfirm) {
      setErr("Passwords do not match.");
      return;
    }

    setBusy(true);
    setErr(null);
    try {
      if (mode === "add") {
        await adminCreateUser({
          email,
          password: form.password,
          role: form.role,
          displayName: form.displayName,
          birthdayIso: form.role === "customer" ? form.birthdayIso || null : null,
          sex: form.role === "customer" ? form.sex || null : null,
        });
      } else if (user) {
        await adminUpdateUser({
          authUserId: user.authUserId,
          accountId: user.accountId,
          email: isReservedAdmin ? ADMIN_EMAIL : email,
          role: isReservedAdmin ? "admin" : form.role,
          displayName: form.displayName,
          birthdayIso: form.role === "customer" ? form.birthdayIso || null : null,
          sex: form.role === "customer" ? form.sex || null : null,
          newPassword: form.password || undefined,
        });
      }
      onSaved();
      onClose();
    } catch (e) {
      setErr(e instanceof AuthError ? e.message : "Save failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="admin-modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="admin-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="user-form-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id="user-form-title" className="admin-modal-title">
          {mode === "add" ? "Add account" : `Edit · ${user?.email ?? ""}`}
        </h3>
        {mode === "add" ? (
          <p className="admin-modal-subtitle">
            Creates a Supabase auth user and profile — same store as customer sign-up.
          </p>
        ) : null}
        {err ? <p className="form-error">{err}</p> : null}
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="form-label sm:col-span-2">
            Email
            <input
              className="input-field mt-1"
              type="email"
              value={form.email}
              disabled={isReservedAdmin}
              onChange={(e) => patch({ email: e.target.value })}
            />
          </label>
          {isReservedAdmin ? (
            <p className="sm:col-span-2 text-xs text-muted">Primary console email is fixed.</p>
          ) : null}
          <label className="form-label">
            Role
            <select
              className="input-field mt-1 capitalize"
              value={form.role}
              disabled={isReservedAdmin}
              onChange={(e) => patch({ role: e.target.value as UserRole })}
            >
              <option value="customer">customer</option>
              <option value="admin">admin</option>
            </select>
          </label>
          <label className="form-label">
            Display name
            <input
              className="input-field mt-1"
              value={form.displayName}
              onChange={(e) => patch({ displayName: e.target.value })}
            />
          </label>
          {form.role === "customer" ? (
            <>
              <label className="form-label">
                Birthday
                <input
                  className="input-field mt-1"
                  type="date"
                  value={form.birthdayIso}
                  onChange={(e) => patch({ birthdayIso: e.target.value })}
                />
              </label>
              <label className="form-label">
                Sex
                <select className="input-field mt-1" value={form.sex} onChange={(e) => patch({ sex: e.target.value })}>
                  <option value="">—</option>
                  {SEX_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
            </>
          ) : null}
          <label className="form-label sm:col-span-2">
            {mode === "add" ? "Password" : "New password (optional)"}
            <input
              className="input-field mt-1"
              type="password"
              autoComplete="new-password"
              value={form.password}
              onChange={(e) => patch({ password: e.target.value })}
            />
          </label>
          <label className="form-label sm:col-span-2">
            Confirm password
            <input
              className="input-field mt-1"
              type="password"
              autoComplete="new-password"
              value={form.passwordConfirm}
              onChange={(e) => patch({ passwordConfirm: e.target.value })}
            />
          </label>
        </div>
        <div className="admin-modal-actions">
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button variant="primary" onClick={() => void submit()} disabled={busy}>
            {busy ? "Saving…" : mode === "add" ? "Create account" : "Save changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function PasswordModal({
  user,
  onClose,
  onSaved,
}: {
  user: ProfileRow;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async () => {
    if (password.length < 6) {
      setErr("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setErr("Passwords do not match.");
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      await adminUpdateUser({
        authUserId: user.authUserId,
        accountId: user.accountId,
        email: user.email,
        role: user.role,
        displayName: user.displayName,
        birthdayIso: user.birthdayIso,
        sex: user.sex,
        newPassword: password,
      });
      onSaved();
      onClose();
    } catch (e) {
      setErr(e instanceof AuthError ? e.message : "Update failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="admin-modal-backdrop" role="presentation" onClick={onClose}>
      <div className="admin-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <h3 className="admin-modal-title">Change password</h3>
        <p className="admin-modal-subtitle">{user.email}</p>
        {err ? <p className="form-error">{err}</p> : null}
        <div className="grid gap-3">
          <label className="form-label">
            New password
            <input
              className="input-field mt-1"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          <label className="form-label">
            Confirm new password
            <input
              className="input-field mt-1"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </label>
        </div>
        <div className="admin-modal-actions">
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button variant="primary" onClick={() => void submit()} disabled={busy}>
            {busy ? "Updating…" : "Update password"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function AdminUsersPanel() {
  const { user: sessionUser } = useAuth();
  const load = useCallback(() => loadProfiles(), []);
  const { data: rows, loading, error, reload } = useSupabaseQuery(load, []);
  const list = rows ?? [];

  const [modal, setModal] = useState<"add" | "edit" | "password" | null>(null);
  const [selected, setSelected] = useState<ProfileRow | null>(null);

  const adminCount = useMemo(() => list.filter((u) => u.role === "admin").length, [list]);

  const openEdit = (u: ProfileRow) => {
    setSelected(u);
    setModal("edit");
  };

  const openPassword = (u: ProfileRow) => {
    setSelected(u);
    setModal("password");
  };

  const removeUser = async (u: ProfileRow) => {
    if (u.email.toLowerCase() === ADMIN_EMAIL) {
      alert("Cannot delete the primary console admin account.");
      return;
    }
    if (u.accountId === sessionUser?.accountId) {
      alert("You cannot delete the account you are signed in with.");
      return;
    }
    if (u.role === "admin" && adminCount <= 1) {
      alert("Cannot delete the last admin.");
      return;
    }
    if (!window.confirm(`Delete ${u.email} (${u.accountId})? This cannot be undone.`)) return;
    try {
      await adminDeleteUser(u.authUserId, u.accountId);
      reload();
    } catch (e) {
      alert(e instanceof AuthError ? e.message : "Delete failed.");
    }
  };

  const canDelete = (u: ProfileRow) =>
    u.email.toLowerCase() !== ADMIN_EMAIL &&
    u.accountId !== sessionUser?.accountId &&
    !(u.role === "admin" && adminCount <= 1);

  return (
    <div>
      <PageHeader
        eyebrow="Admin"
        title={ADMIN_SECTIONS.users.title}
        subtitle={`${ADMIN_SECTIONS.users.subtitle} · ${list.length} account${list.length === 1 ? "" : "s"}`}
        action={
          <Button variant="primary" onClick={() => setModal("add")}>
            <UserPlus className="h-4 w-4" />
            Add account
          </Button>
        }
      />

      <Card className="mb-5 border-emerald/20 bg-emerald-light/40 p-4 text-sm text-brown-deep">
        Everyone listed here lives in Supabase <code className="text-xs">profiles</code> + auth — customers
        from registration and profile edits, plus admins. Add, edit, change password, or remove below (aligned
        with Flutter admin).
      </Card>

      <AdminQueryState
        loading={loading}
        error={error}
        empty={!loading && !error && list.length === 0}
        emptyMessage="No users yet — add an account to get started."
        onRetry={() => void reload()}
      >
        <div className="admin-card-grid">
          {list.map((u) => {
            const isSelf = u.accountId === sessionUser?.accountId;
            return (
              <Card key={u.accountId} className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-foam font-serif text-lg font-bold text-brown-deep">
                    {(u.displayName || u.email).slice(0, 1).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold">{u.displayName || "No name"}</p>
                    <p className="truncate text-sm text-muted">{u.email}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <StatusBadge status={u.role} />
                      {isSelf ? (
                        <span className="text-xs font-semibold text-emerald-deep">You</span>
                      ) : null}
                    </div>
                  </div>
                </div>
                <dl className="grid gap-1 text-xs text-muted">
                  <div>
                    <span className="font-semibold text-brown-deep">ID</span> · {u.accountId}
                  </div>
                  {u.role === "customer" && u.birthdayIso ? (
                    <div>
                      <span className="font-semibold text-brown-deep">Birthday</span> ·{" "}
                      {formatDateLong(u.birthdayIso)}
                    </div>
                  ) : null}
                  {u.role === "customer" && u.sex ? (
                    <div>
                      <span className="font-semibold text-brown-deep">Sex</span> · {u.sex}
                    </div>
                  ) : null}
                  <div>
                    <span className="font-semibold text-brown-deep">Password</span> · ••••••••
                  </div>
                </dl>
                <div className="flex flex-wrap gap-2 border-t border-brown-deep/10 pt-3">
                  <Button variant="toolbar" className="text-xs" onClick={() => openEdit(u)}>
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </Button>
                  <Button variant="toolbar" className="text-xs" onClick={() => openPassword(u)}>
                    <KeyRound className="h-3.5 w-3.5" />
                    Password
                  </Button>
                  <Button
                    variant="ghost"
                    className="text-xs text-red-700"
                    disabled={!canDelete(u)}
                    onClick={() => void removeUser(u)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      </AdminQueryState>

      {modal === "add" ? <UserFormModal mode="add" user={null} onClose={() => setModal(null)} onSaved={() => reload()} /> : null}
      {modal === "edit" && selected ? (
        <UserFormModal mode="edit" user={selected} onClose={() => setModal(null)} onSaved={() => reload()} />
      ) : null}
      {modal === "password" && selected ? (
        <PasswordModal user={selected} onClose={() => setModal(null)} onSaved={() => reload()} />
      ) : null}
    </div>
  );
}
