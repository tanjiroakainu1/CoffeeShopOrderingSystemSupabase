import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Lock, LogIn, Mail, UtensilsCrossed, User, UserPlus } from "lucide-react";
import { AuthField, AuthLayout } from "@/components/AuthLayout";
import { AuthDemoCredentials } from "@/components/AuthDemoCredentials";
import { DEMO_ADMIN_CREDENTIALS } from "@/core/demoCredentials";
import { AuthError } from "@/services/authService";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui";

export function SignInPage() {
  const { signIn } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const u = await signIn(email, password);
      nav(u.role === "admin" ? "/admin/dashboard" : "/app/home");
    } catch (ex) {
      setErr(ex instanceof AuthError ? ex.message : "Sign in failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle={
        <>
          Sign in to build your bag, pay with GCash, and track orders — or browse the{" "}
          <Link to="/menu" className="font-semibold text-emerald hover:text-emerald-deep">
            public menu
          </Link>{" "}
          first.
        </>
      }
      heroImage="/images/4.webp"
      altLink={{ to: "/register", label: "Create account →" }}
      perks={["GCash checkout", "Reservations & delivery", "Android app download"]}
      footer={
        <>
          <p className="auth-link-row">
            <Link to="/forgot-account">Forgot account?</Link>
          </p>
          <p className="auth-link-row">
            Don&apos;t have an account? <Link to="/register">Sign up free</Link>
          </p>
        </>
      }
    >
      <>
        <Link
          to="/menu"
          className="btn-outline-emerald mb-6 flex w-full items-center justify-center gap-2 text-sm sm:text-base"
        >
          <UtensilsCrossed className="h-4 w-4 shrink-0" />
          Browse menu (no sign-in)
        </Link>
        <AuthDemoCredentials
          className="mb-6"
          onUseAdmin={() => {
            setEmail(DEMO_ADMIN_CREDENTIALS.email);
            setPassword(DEMO_ADMIN_CREDENTIALS.password);
            setErr(null);
          }}
        />
        <form className="auth-form" onSubmit={(e) => void submit(e)}>
          <AuthField
            id="sign-in-email"
            label="Email"
            type="email"
            autoComplete="email"
            icon={Mail}
            value={email}
            onChange={setEmail}
            placeholder="you@example.com"
            required
          />
          <AuthField
            id="sign-in-password"
            label="Password"
            type="password"
            autoComplete="current-password"
            icon={Lock}
            value={password}
            onChange={setPassword}
            placeholder="Your password"
            required
          />
          {err ? <p className="alert-error">{err}</p> : null}
          <Button className="auth-submit gap-2" disabled={busy} type="submit">
            <LogIn className="h-4 w-4 shrink-0" />
            {busy ? "Signing in…" : "Sign in"}
          </Button>
        </form>
      </>
    </AuthLayout>
  );
}

export function RegisterPage() {
  const { register } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [birthdayIso, setBirthdayIso] = useState("");
  const [sex, setSex] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      await register({
        email,
        password,
        displayName,
        birthdayIso: birthdayIso || undefined,
        sex: sex || undefined,
      });
      nav("/app/home");
    } catch (ex) {
      setErr(ex instanceof AuthError ? ex.message : "Registration failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle={
        <>
          Join for free — order coffee, set reservations, and upload GCash receipts. Browse the{" "}
          <Link to="/menu" className="font-semibold text-emerald hover:text-emerald-deep">
            menu
          </Link>{" "}
          anytime without signing in.
        </>
      }
      heroImage="/images1/2.jpeg"
      altLink={{ to: "/sign-in", label: "Sign in →" }}
      perks={["Free to join", "Live Supabase menu", "Android app download"]}
      footer={
        <p className="auth-link-row">
          Already have an account? <Link to="/sign-in">Sign in</Link>
        </p>
      }
    >
      <>
        <Link
          to="/menu"
          className="btn-outline-emerald mb-6 flex w-full items-center justify-center gap-2 text-sm sm:text-base"
        >
          <UtensilsCrossed className="h-4 w-4 shrink-0" />
          Browse menu (no sign-in)
        </Link>
        <form className="auth-form" onSubmit={(e) => void submit(e)}>
        <AuthField
          id="register-name"
          label="Display name"
          autoComplete="name"
          icon={User}
          value={displayName}
          onChange={setDisplayName}
          placeholder="How should we greet you?"
        />
        <label className="auth-field">
          <span className="auth-field-label">Birthday (optional)</span>
          <input
            className="input-field"
            type="date"
            value={birthdayIso}
            onChange={(e) => setBirthdayIso(e.target.value)}
          />
        </label>
        <label className="auth-field">
          <span className="auth-field-label">Sex (optional)</span>
          <select className="input-field" value={sex} onChange={(e) => setSex(e.target.value)}>
            <option value="">Select</option>
            <option value="Female">Female</option>
            <option value="Male">Male</option>
            <option value="other">Other</option>
          </select>
        </label>
        <AuthField
          id="register-email"
          label="Email"
          type="email"
          autoComplete="email"
          icon={Mail}
          value={email}
          onChange={setEmail}
          placeholder="you@example.com"
          required
        />
        <AuthField
          id="register-password"
          label="Password"
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
        <Button className="auth-submit gap-2" type="submit" disabled={busy}>
          <UserPlus className="h-4 w-4 shrink-0" />
          {busy ? "Creating account…" : "Create free account"}
        </Button>
      </form>
      </>
    </AuthLayout>
  );
}
