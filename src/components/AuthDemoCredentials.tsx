import { Shield } from "lucide-react";
import { DEMO_ADMIN_CREDENTIALS } from "@/core/demoCredentials";

type AuthDemoCredentialsProps = {
  onUseAdmin?: () => void;
  className?: string;
};

export function AuthDemoCredentials({ onUseAdmin, className = "" }: AuthDemoCredentialsProps) {
  const { label, email, password } = DEMO_ADMIN_CREDENTIALS;

  return (
    <div className={`auth-demo-credentials ${className}`.trim()} aria-label="Admin login credentials">
      <div className="flex items-start gap-3">
        <span className="auth-demo-credentials-icon" aria-hidden>
          <Shield className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="auth-demo-credentials-title">{label}</p>
          <p className="mt-1 text-sm text-muted">Use these credentials to open the admin dashboard.</p>
          <dl className="auth-demo-credentials-list">
            <div>
              <dt>Email</dt>
              <dd>
                <code>{email}</code>
              </dd>
            </div>
            <div>
              <dt>Password</dt>
              <dd>
                <code>{password}</code>
              </dd>
            </div>
          </dl>
          {onUseAdmin ? (
            <button type="button" className="auth-demo-credentials-btn" onClick={onUseAdmin}>
              Fill admin login
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
