import { useCallback, useState } from "react";
import { Link } from "react-router-dom";
import { RefreshCw } from "lucide-react";
import { AdminQueryState, useSupabaseQuery } from "@/hooks/useSupabaseQuery";
import {
  approveRecoveryRequest,
  loadRecoveryRequests,
  rejectRecoveryRequest,
  ServiceError,
} from "@/services/supabaseService";
import { Button, Card, PageHeader, StatusBadge } from "@/components/ui";
import { ADMIN_SECTIONS } from "@/core/appRoutes";
import { base64ImageDataUrl } from "@/core/formatters";
import type { AccountRecoveryRequest } from "@/types";

function formatWhen(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString();
}

function RecoveryActionModal({
  request,
  mode,
  onClose,
  onDone,
}: {
  request: AccountRecoveryRequest;
  mode: "approve" | "reject";
  onClose: () => void;
  onDone: (message: string) => void;
}) {
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async () => {
    setBusy(true);
    setErr(null);
    try {
      if (mode === "approve") {
        await approveRecoveryRequest(request.id, note);
        onDone("Approved — customer can set a new password.");
      } else {
        await rejectRecoveryRequest(request.id, note);
        onDone("Request rejected.");
      }
      onClose();
    } catch (e) {
      setErr(e instanceof ServiceError || e instanceof Error ? e.message : "Action failed.");
    } finally {
      setBusy(false);
    }
  };

  const isApprove = mode === "approve";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-brown-deep/40 p-4 sm:items-center">
      <div
        className="w-full max-w-md rounded-card border border-brown-deep/10 bg-white p-5 shadow-2xl sm:p-6"
        role="dialog"
        aria-modal="true"
      >
        <h2 className="font-serif text-xl font-bold text-brown-deep">
          {isApprove ? "Approve recovery?" : "Reject request?"}
        </h2>
        <p className="mt-2 text-sm text-muted">
          {isApprove
            ? `Allow ${request.email} to set a new password after verification?`
            : `Reject recovery for ${request.email}? They can submit again later.`}
        </p>
        <label className="form-label mt-5 block">
          {isApprove ? "Note to customer (optional)" : "Reason for customer (optional)"}
          <textarea
            className="input-field mt-1 min-h-[5rem] text-sm"
            placeholder={
              isApprove
                ? "e.g. Verified — use Set new password on the recovery page."
                : "e.g. Photo unclear — please resubmit with ID visible."
            }
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </label>
        {err ? <p className="alert-error mt-3">{err}</p> : null}
        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <Button variant="ghost" disabled={busy} onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant={isApprove ? "primary" : "ghost"}
            className={isApprove ? "" : "text-red-700 hover:bg-red-50"}
            disabled={busy}
            onClick={() => void submit()}
          >
            {busy ? "Saving…" : isApprove ? "Approve" : "Reject"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function AdminRecoveryPanel() {
  const load = useCallback(() => loadRecoveryRequests(), []);
  const { data: rows, loading, error, reload } = useSupabaseQuery(load, []);
  const list = rows ?? [];
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [modal, setModal] = useState<{ request: AccountRecoveryRequest; mode: "approve" | "reject" } | null>(
    null,
  );

  const pendingCount = list.filter((r) => r.status === "pending").length;

  return (
    <div>
      <PageHeader
        eyebrow="Admin"
        title={ADMIN_SECTIONS.recovery.title}
        subtitle={
          pendingCount > 0
            ? `${ADMIN_SECTIONS.recovery.subtitle} · ${pendingCount} pending`
            : ADMIN_SECTIONS.recovery.subtitle
        }
        action={
          <Button variant="toolbar" onClick={() => void reload()}>
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        }
      />

      {actionMsg ? (
        <p className={`mb-4 ${actionMsg.includes("reject") ? "alert-error" : "alert-success"}`}>{actionMsg}</p>
      ) : null}

      <AdminQueryState
        loading={loading}
        error={error}
        empty={!loading && !error && list.length === 0}
        emptyMessage="No recovery requests yet"
        emptyHint='When customers use "Forgot account?" on the sign-in page, their requests appear here for review.'
        onRetry={() => void reload()}
      >
        <div className="admin-card-grid">
          {list.map((r) => {
            const preview = base64ImageDataUrl(r.imageBase64);
            const submitted = formatWhen(r.createdAt);
            const reviewed = formatWhen(r.resolvedAt);
            const passwordDone = formatWhen(r.passwordResetCompletedAt);

            return (
              <Card key={r.id} className="space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-bold text-brown-deep">{r.email}</p>
                    {submitted ? <p className="mt-1 text-xs text-muted">Submitted {submitted}</p> : null}
                    {reviewed ? <p className="text-xs text-muted">Reviewed {reviewed}</p> : null}
                    {passwordDone ? (
                      <p className="text-xs text-muted">Password reset {passwordDone}</p>
                    ) : null}
                  </div>
                  <StatusBadge status={r.status} />
                </div>

                <p className="text-sm leading-relaxed">{r.description}</p>

                {r.adminNote ? (
                  <div className="rounded-xl bg-[#FAF7F4] px-3 py-2">
                    <p className="text-[0.65rem] font-bold uppercase tracking-wide text-muted">Message to customer</p>
                    <p className="mt-1 text-sm leading-relaxed">{r.adminNote}</p>
                  </div>
                ) : null}

                {preview ? (
                  <img
                    src={preview}
                    alt="Recovery ID"
                    className="max-h-44 w-full rounded-xl border border-brown-deep/10 object-cover shadow-sm"
                  />
                ) : null}

                {r.status === "pending" ? (
                  <div className="flex flex-wrap gap-2 border-t border-brown-deep/10 pt-3">
                    <Button onClick={() => setModal({ request: r, mode: "approve" })}>Approve</Button>
                    <Button variant="ghost" className="text-red-700" onClick={() => setModal({ request: r, mode: "reject" })}>
                      Reject
                    </Button>
                  </div>
                ) : null}
              </Card>
            );
          })}
        </div>
      </AdminQueryState>

      <p className="mt-6 text-center text-xs text-muted">
        Customer flow:{" "}
        <Link to="/forgot-account" className="font-semibold text-emerald hover:text-emerald-deep">
          /forgot-account
        </Link>{" "}
        · status at /recovery/status
      </p>

      {modal ? (
        <RecoveryActionModal
          request={modal.request}
          mode={modal.mode}
          onClose={() => setModal(null)}
          onDone={(message) => {
            setActionMsg(message);
            void reload();
          }}
        />
      ) : null}
    </div>
  );
}
