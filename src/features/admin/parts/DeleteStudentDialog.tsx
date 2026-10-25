/* Delete a student completely, with "remove access" offered as the gentler option. */
import React, { useEffect, useState } from "react";
import type { RegistrationEntry } from "../../../../services/registrationStore";
import { adminStudents } from "../../../../services/adminStudents";
import { Button, Field, inputClass } from "../../../ui";
import { useAdmin } from "../AdminWorkspaceContext";
import { Dialog } from "../ui";

export const DeleteStudentDialog: React.FC<{
  open: boolean;
  onClose: () => void;
  reg: RegistrationEntry | null;
  onDeleted?: () => void;
}> = ({ open, onClose, reg, onDeleted }) => {
  const { fetchRegistrations, fetchPaymentRecords, handleToggleStatus, notify } = useAdmin();
  const [typed, setTyped] = useState("");
  const [deleteAccount, setDeleteAccount] = useState(true);
  const [busy, setBusy] = useState<"" | "delete" | "remove">("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setTyped("");
    setDeleteAccount(true);
    setError("");
  }, [open]);

  if (!reg) return null;
  const enrolled = reg.status === "Complete";

  const remove = async () => {
    setBusy("delete");
    setError("");
    try {
      await adminStudents.remove(reg.uid, deleteAccount);
      await Promise.all([fetchRegistrations(), fetchPaymentRecords()]);
      notify("success", `${reg.fullName} was deleted.`);
      onClose();
      onDeleted?.();
    } catch (err: any) {
      setError(err?.message || "Couldn't delete the student.");
    } finally {
      setBusy("");
    }
  };

  const removeAccess = async () => {
    setBusy("remove");
    try {
      await handleToggleStatus(reg.uid, reg.status as any);
      notify("success", `${reg.fullName} no longer has access.`);
      onClose();
    } finally {
      setBusy("");
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={`Delete ${reg.fullName}?`}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="danger" onClick={remove} loading={busy === "delete"} disabled={typed.trim().toUpperCase() !== "DELETE" || !!busy}>
            Delete for good
          </Button>
        </>
      }
    >
      <div className="space-y-4 text-sm text-slate-700 dark:text-slate-200">
        <p>This permanently removes their profile, payment history, watch progress, chat and screenshots. It can't be undone.</p>
        {enrolled ? (
          <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">
            <p>Just want them to stop seeing classes? Remove their access instead. Everything is kept and they can pay again later.</p>
            <Button size="sm" variant="secondary" className="mt-2" onClick={removeAccess} loading={busy === "remove"}>
              Remove access instead
            </Button>
          </div>
        ) : null}
        <label className="flex items-start gap-2">
          <input type="checkbox" checked={deleteAccount} onChange={(e) => setDeleteAccount(e.target.checked)} className="mt-1 h-4 w-4" />
          <span>
            Also delete their sign-in
            <span className="block text-xs text-slate-500">Leave unticked if they might sign up again with the same email and Google account.</span>
          </span>
        </label>
        <Field label='Type DELETE to confirm' htmlFor="del-confirm">
          <input id="del-confirm" value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" className={inputClass} />
        </Field>
        {error ? <p className="font-semibold text-red-600">{error}</p> : null}
      </div>
    </Dialog>
  );
};
