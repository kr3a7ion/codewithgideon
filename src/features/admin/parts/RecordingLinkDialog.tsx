/* Add or change a class recording link without opening the full class form. */
import React, { useEffect, useState } from "react";
import { Button, Field, inputClass } from "../../../ui";
import { useAdmin } from "../AdminWorkspaceContext";
import { sessionStart } from "../insights";
import { Dialog, classWhen } from "../ui";
import type { OverviewSession } from "../useAdminWorkspace";

export const RecordingLinkDialog: React.FC<{
  item: OverviewSession | null;
  onClose: () => void;
}> = ({ item, onClose }) => {
  const { patchSession, notify } = useAdmin();
  const [url, setUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setUrl(String((item?.session as any)?.recordingUrl || ""));
    setError("");
  }, [item]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!item) return;
    const clean = url.trim();
    if (clean && !/^https?:\/\//i.test(clean)) {
      setError("Paste the full link, starting with https://");
      return;
    }
    setSaving(true);
    try {
      await patchSession(item.cohortId, item.session.id, { recordingUrl: clean });
      notify("success", clean ? "Recording link saved. Students can watch it now." : "Recording link removed.");
      onClose();
    } catch (err: any) {
      setError(err?.message || "Couldn't save the link.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={!!item}
      onClose={onClose}
      title="Recording link"
      description={
        item ? `Week ${item.session.week}: ${item.session.title} · ${item.cohortLabel} · ${classWhen(sessionStart(item))}` : ""
      }
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" form="recording-link-form" loading={saving}>Save link</Button>
        </>
      }
    >
      <form id="recording-link-form" onSubmit={save}>
        <Field label="Link to the recording" htmlFor="recording-url" hint="YouTube (unlisted), Google Drive or any link students can open." error={error}>
          <input
            id="recording-url"
            type="url"
            inputMode="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://youtube.com/watch?v=..."
            className={inputClass}
            data-autofocus
          />
        </Field>
      </form>
    </Dialog>
  );
};
