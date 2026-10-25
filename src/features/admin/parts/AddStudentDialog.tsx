/* Add a student who signed up in person or on WhatsApp. Creates their sign-in
   and profile, then gives you a link to send them to set a password. */
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import { adminStudents, type CreatedStudent } from "../../../../services/adminStudents";
import { Button, Field, inputClass } from "../../../ui";
import { useAdmin } from "../AdminWorkspaceContext";
import { CopyButton, Dialog } from "../ui";
import { whatsappLink } from "../lib";

export const AddStudentDialog: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  const { paths, fetchRegistrations } = useAdmin();
  const [form, setForm] = useState({ fullName: "", email: "", phone: "", pathId: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<(CreatedStudent & { fullName: string; phone: string }) | null>(null);

  useEffect(() => {
    if (!open) return;
    setForm({ fullName: "", email: "", phone: "", pathId: paths[0]?.id || "" });
    setError("");
    setDone(null);
  }, [open, paths]);

  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await adminStudents.create(form);
      await fetchRegistrations();
      setDone({ ...res, fullName: form.fullName.trim(), phone: form.phone.trim() });
    } catch (err: any) {
      setError(err?.message || "Couldn't add the student.");
    } finally {
      setSaving(false);
    }
  };

  const first = done?.fullName.split(" ")[0] || "";
  const message = done
    ? `Hi ${first}, your Code with Gideon account is ready. Set your password here: ${done.setPasswordLink}\n\nThen sign in at https://codewithgideon.com/student/login`
    : "";
  const wa = done ? whatsappLink(done.phone) : "";

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={done ? "Student added" : "Add a student"}
      description={done ? undefined : "For someone who joined in person or on WhatsApp."}
      size="sm"
      footer={
        done ? (
          <>
            <Button variant="secondary" onClick={onClose}>Done</Button>
            <Link
              to={`/admin/students/${encodeURIComponent(done.uid)}`}
              onClick={onClose}
              className="inline-flex h-11 items-center justify-center rounded-xl bg-blue-900 px-5 text-sm font-semibold text-white hover:bg-blue-800 dark:bg-teal-500 dark:text-slate-950"
            >
              Open student
            </Link>
          </>
        ) : (
          <>
            <Button variant="secondary" onClick={onClose}>Cancel</Button>
            <Button type="submit" form="add-student-form" loading={saving}>Add student</Button>
          </>
        )
      }
    >
      {done ? (
        <div className="space-y-4 text-sm text-slate-700 dark:text-slate-200">
          <p className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" aria-hidden />
            <span>
              {done.fullName} can now sign in{done.existingAccount ? " with the account they already had" : ""}. Next, open their page and confirm their payment so they get their weeks.
            </span>
          </p>
          {done.setPasswordLink ? (
            <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">
              <p className="font-semibold">Send them this so they can set a password</p>
              <p className="mt-1 text-xs text-slate-500">The link works once and expires after a while. They can also use "Forgot password" or Google.</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <CopyButton text={message} label="Copy message" className="border border-slate-200 px-3 py-2 dark:border-slate-700" />
                {wa ? (
                  <a
                    href={`${wa}?text=${encodeURIComponent(message)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center rounded-lg border border-emerald-200 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 dark:border-emerald-500/30 dark:text-emerald-300"
                  >
                    Send on WhatsApp
                  </a>
                ) : null}
              </div>
            </div>
          ) : (
            <p className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">Ask them to use "Forgot password" on the sign-in page to set a password, or sign in with Google.</p>
          )}
        </div>
      ) : (
        <form id="add-student-form" onSubmit={save} className="space-y-4">
          <Field label="Full name" htmlFor="as-name">
            <input id="as-name" value={form.fullName} onChange={(e) => set({ fullName: e.target.value })} className={inputClass} required minLength={2} data-autofocus />
          </Field>
          <Field label="Email" htmlFor="as-email" hint="This becomes their sign-in.">
            <input id="as-email" type="email" value={form.email} onChange={(e) => set({ email: e.target.value })} className={inputClass} required />
          </Field>
          <Field label="Phone (WhatsApp)" htmlFor="as-phone">
            <input id="as-phone" type="tel" value={form.phone} onChange={(e) => set({ phone: e.target.value })} className={inputClass} required placeholder="0803 000 0000" />
          </Field>
          <Field label="Course" htmlFor="as-path">
            <select id="as-path" value={form.pathId} onChange={(e) => set({ pathId: e.target.value })} className={inputClass} required>
              {paths.map((p) => (
                <option key={p.id} value={p.id}>{p.title}</option>
              ))}
            </select>
          </Field>
          {error ? <p className="text-sm font-semibold text-red-600">{error}</p> : null}
        </form>
      )}
    </Dialog>
  );
};
