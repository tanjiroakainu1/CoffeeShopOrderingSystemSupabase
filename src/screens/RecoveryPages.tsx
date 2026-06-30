import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Lock, Mail, MessageSquare } from "lucide-react";
import { AuthField, AuthLayout } from "@/components/AuthLayout";
import { Button, Card, StatusBadge } from "@/components/ui";
import { ADMIN_EMAIL } from "@/services/authService";
import {
  completeRecoveryPasswordReset,
  loadRecoveryForEmail,
  ServiceError,
  submitRecoveryRequest,
} from "@/services/supabaseService";

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => {
      const s = String(r.result ?? "");
      resolve(s.includes(",") ? s.split(",")[1]! : s);
    };
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

export function ForgotAccountPage() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [description, setDescription] = useState("");
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    setMsg(null);
    const norm = email.trim().toLowerCase();
    if (norm === ADMIN_EMAIL) {
      setErr("Admin accounts cannot use customer recovery.");
      setBusy(false);
      return;
    }
    try {
      await submitRecoveryRequest({ email: norm, description, imageBase64 });
      setMsg("Request submitted. Check status below or wait for admin approval.");
      nav(`/recovery/status?email=${encodeURIComponent(norm)}`);
    } catch (ex) {
      setErr(ex instanceof ServiceError ? ex.message : "Could not submit request.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout
      title="Recover your account"
      subtitle="Submit a recovery request with your registered email. An admin will review it in the dashboard."
      altLink={{ to: "/sign-in", label: "Sign in →" }}
      footer={
        <p className="auth-link-row">
          Remember your password? <Link to="/sign-in">Back to sign in</Link>
        </p>
      }
    >
      <form className="auth-form" onSubmit={(e) => void submit(e)}>
        <AuthField
          id="recovery-email"
          label="Registered email"
          type="email"
          autoComplete="email"
          icon={Mail}
          value={email}
          onChange={setEmail}
          placeholder="you@example.com"
          required
        />
        <label className="auth-field" htmlFor="recovery-description">
          <span className="auth-field-label">Why do you need access?</span>
          <span className="auth-field-control">
            <MessageSquare className="auth-field-icon top-4 translate-y-0" aria-hidden />
            <textarea
              id="recovery-description"
              className="input-field auth-field-input auth-field-input-icon min-h-[6rem] resize-y pt-3"
              placeholder="Briefly explain your situation"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </span>
        </label>
        <label className="auth-field">
          <span className="auth-field-label">ID photo (optional)</span>
          <input
            type="file"
            accept="image/*"
            className="file-input-wrap"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              setImageBase64(f ? await fileToBase64(f) : null);
            }}
          />
        </label>
        {err ? <p className="alert-error">{err}</p> : null}
        {msg ? <p className="alert-success">{msg}</p> : null}
        <Button className="auth-submit" type="submit" disabled={busy}>
          {busy ? "Submitting…" : "Submit recovery request"}
        </Button>
      </form>
    </AuthLayout>
  );
}

export function RecoveryStatusPage() {
  const [params] = useSearchParams();
  const email = params.get("email") ?? "";
  const [rows, setRows] = useState<Awaited<ReturnType<typeof loadRecoveryForEmail>>>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!email) return;
    void loadRecoveryForEmail(email)
      .then(setRows)
      .catch((e) => setErr(e instanceof Error ? e.message : "Could not load status."));
  }, [email]);

  const latest = rows[0];
  const canSetPassword = latest?.status === "approved" && !latest.passwordResetCompletedAt;

  return (
    <AuthLayout
      title="Recovery status"
      subtitle={email || "No email provided"}
      altLink={{ to: "/sign-in", label: "Sign in →" }}
    >
      <div className="space-y-4">
        {err ? <p className="alert-error">{err}</p> : null}
        {rows.length === 0 && !err ? (
          <p className="rounded-xl border border-dashed border-emerald-deep/15 bg-emerald-light/50 px-4 py-8 text-center text-sm text-muted">
            No requests found for this email.
          </p>
        ) : (
          rows.map((r) => (
            <Card key={r.id} flat className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <p className="font-bold capitalize text-brown-deep">{r.status}</p>
                <StatusBadge status={r.status} />
              </div>
              <p className="text-sm text-muted">{new Date(r.createdAt).toLocaleString()}</p>
              <p className="text-sm leading-relaxed">{r.description}</p>
              {r.adminNote ? (
                <p className="rounded-lg bg-emerald-light px-3 py-2 text-sm text-muted">Admin: {r.adminNote}</p>
              ) : null}
              {r.passwordResetCompletedAt ? (
                <p className="text-xs text-muted">Password reset completed.</p>
              ) : null}
            </Card>
          ))
        )}
        {canSetPassword ? (
          <Link to={`/recovery/set-password?email=${encodeURIComponent(email)}`}>
            <Button className="auth-submit">Set new password</Button>
          </Link>
        ) : null}
      </div>
    </AuthLayout>
  );
}

export function RecoverySetPasswordPage() {
  const [params] = useSearchParams();
  const nav = useNavigate();
  const email = params.get("email") ?? "";
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      await completeRecoveryPasswordReset(email, password);
      nav("/sign-in");
    } catch (ex) {
      setErr(ex instanceof ServiceError ? ex.message : "Could not reset password.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout
      title="Set new password"
      subtitle={email}
      altLink={{ to: "/sign-in", label: "Sign in →" }}
    >
      <form className="auth-form" onSubmit={(e) => void submit(e)}>
        <AuthField
          id="new-password"
          label="New password"
          type="password"
          autoComplete="new-password"
          icon={Lock}
          value={password}
          onChange={setPassword}
          placeholder="Min. 6 characters"
          required
          minLength={6}
        />
        {err ? <p className="alert-error">{err}</p> : null}
        <Button className="auth-submit" type="submit" disabled={busy}>
          {busy ? "Saving…" : "Complete recovery"}
        </Button>
      </form>
    </AuthLayout>
  );
}
