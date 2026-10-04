/* Settings: website content, integrations and data tools. */
import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { AlertTriangle, Download, Save, Sheet } from "lucide-react";
import type { SiteConfig } from "../../../../services/siteConfig";
import { Button, Field, inputClass } from "../../../ui";
import { useAdmin } from "../AdminWorkspaceContext";
import { AdminPage, Dialog, Panel } from "../ui";

type FieldDef = { key: keyof SiteConfig; label: string; hint?: string; type?: "url" | "email" | "textarea" | "date" };

const groups: { id: string; title: string; description: string; fields: FieldDef[] }[] = [
  {
    id: "home",
    title: "Home page",
    description: "Small details on the public home page. The courses shown there come from Courses → “On home page”.",
    fields: [
      {
        key: "nextCohortDate",
        label: "Next cohort start date",
        type: "date",
        hint: "Shows “Enrolling now · next cohort starts …” above the courses. Leave empty to hide it. It hides itself once the date passes.",
      },
    ],
  },
  {
    id: "app",
    title: "Mobile app",
    description: "Where the website's “Download the app” button points. Update it after each new APK.",
    fields: [
      { key: "apkDownloadUrl", label: "APK download link", type: "url" },
      { key: "apkDownloadLabel", label: "Button text" },
      { key: "apkDownloadSubLabel", label: "Small text under the button" },
    ],
  },
  {
    id: "contact",
    title: "Contact page",
    description: "What visitors see on the Contact page, plus the WhatsApp link the whole site uses.",
    fields: [
      { key: "contactEmail", label: "Contact email", type: "email" },
      { key: "whatsappUrl", label: "WhatsApp link", type: "url", hint: "Used by every WhatsApp button on the site, e.g. https://wa.me/message/…" },
      { key: "responseTime", label: "Reply time", hint: "e.g. “Within 24 hours”" },
      { key: "contactHeading", label: "Heading" },
      { key: "contactSubheading", label: "Subheading" },
      { key: "contactIntroTitle", label: "Intro title" },
      { key: "contactIntroText", label: "Intro text", type: "textarea" },
    ],
  },
  {
    id: "social",
    title: "Social links",
    description: "Shown in the footer and on the Contact page.",
    fields: [
      { key: "instagramUrl", label: "Instagram link", type: "url" },
      { key: "instagramHandle", label: "Instagram handle" },
      { key: "tiktokUrl", label: "TikTok link", type: "url" },
      { key: "tiktokHandle", label: "TikTok handle" },
    ],
  },
];

const SettingsPage: React.FC = () => {
  const {
    siteConfigForm,
    siteConfigLoading,
    siteConfigError,
    siteConfigSaved,
    updateSiteConfigField,
    updateSupportTopics,
    handleSaveSiteConfig,
    webhookUrl,
    setWebhookUrl,
    handleSaveWebhook,
    handleSyncToSheets,
    isSyncing,
    handleExportCSV,
    clearAllRegistrationsConfirmed,
    registrations,
    notify,
  } = useAdmin();
  const location = useLocation();
  const [dangerOpen, setDangerOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    if (location.hash) document.getElementById(location.hash.slice(1))?.scrollIntoView({ block: "start" });
  }, [location.hash]);

  const renderField = (f: FieldDef) => {
    const id = `set-${String(f.key)}`;
    const value = String((siteConfigForm as any)[f.key] ?? "");
    return (
      <Field key={String(f.key)} label={f.label} htmlFor={id} hint={f.hint} className={f.type === "textarea" ? "sm:col-span-2" : undefined}>
        {f.type === "textarea" ? (
          <textarea id={id} rows={3} value={value} onChange={(e) => updateSiteConfigField(f.key, e.target.value as any)} className={inputClass} />
        ) : (
          <input
            id={id}
            type={f.type === "url" || f.type === "email" || f.type === "date" ? f.type : "text"}
            value={value}
            onChange={(e) => updateSiteConfigField(f.key, e.target.value as any)}
            className={inputClass}
          />
        )}
      </Field>
    );
  };

  return (
    <AdminPage title="Settings" description="Website content, connections and data tools.">
      <form onSubmit={handleSaveSiteConfig} className="space-y-5 sm:space-y-6">
        {groups.map((g) => (
          <Panel key={g.id} id={g.id} title={g.title} description={g.description}>
            <div className="grid gap-4 sm:grid-cols-2">
              {g.fields.map(renderField)}
              {g.id === "contact" ? (
                <Field label="Contact form topics" htmlFor="set-topics" hint="Separate with commas." className="sm:col-span-2">
                  <input
                    id="set-topics"
                    value={(siteConfigForm.supportTopics || []).join(", ")}
                    onChange={(e) => updateSupportTopics(e.target.value)}
                    className={inputClass}
                  />
                </Field>
              ) : null}
            </div>
          </Panel>
        ))}

        <div className="sticky bottom-20 z-10 flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white/95 px-4 py-3 shadow-lg backdrop-blur dark:border-slate-800 dark:bg-slate-900/95 lg:bottom-4">
          <Button type="submit" loading={siteConfigLoading} leftIcon={<Save className="h-4 w-4" />}>Save website settings</Button>
          {siteConfigSaved ? <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">{siteConfigSaved}</p> : null}
          {siteConfigError ? <p className="text-sm font-semibold text-red-600">{siteConfigError}</p> : null}
        </div>
      </form>

      <Panel
        id="integrations"
        title="Google Sheets"
        description="Send the student list to a Google Sheet through an Apps Script web app. The link is saved in this browser only."
      >
        <form
          onSubmit={(e) => {
            handleSaveWebhook(e);
            notify("success", "Google Sheets link saved in this browser.");
          }}
          className="space-y-3"
        >
          <Field label="Apps Script web app link" htmlFor="set-sheets">
            <input id="set-sheets" type="url" value={webhookUrl} onChange={(e) => setWebhookUrl(e.target.value)} placeholder="https://script.google.com/macros/s/.../exec" className={inputClass} />
          </Field>
          <div className="flex flex-wrap gap-2">
            <Button type="submit" variant="secondary">Save link</Button>
            <Button onClick={handleSyncToSheets} loading={isSyncing} disabled={!webhookUrl} leftIcon={<Sheet className="h-4 w-4" />}>
              Sync {registrations.length} students now
            </Button>
          </div>
        </form>
      </Panel>

      <Panel title="Data">
        <div className="space-y-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold text-slate-800 dark:text-slate-100">Export students</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">Download everyone as a CSV file for Excel or Google Sheets.</p>
            </div>
            <Button variant="secondary" leftIcon={<Download className="h-4 w-4" />} onClick={handleExportCSV}>Download CSV</Button>
          </div>
          <div className="flex flex-col gap-2 rounded-xl border border-red-200 p-4 dark:border-red-500/30 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="flex items-center gap-2 font-semibold text-red-700 dark:text-red-300">
                <AlertTriangle className="h-4 w-4" aria-hidden /> Delete all student records
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400">Removes every student profile. Payments in Paystack aren't affected. This can't be undone.</p>
            </div>
            <Button variant="danger" onClick={() => setDangerOpen(true)}>Delete all…</Button>
          </div>
        </div>
      </Panel>

      <Dialog
        open={dangerOpen}
        onClose={() => {
          setDangerOpen(false);
          setTyped("");
        }}
        title="Delete all student records?"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDangerOpen(false)}>Cancel</Button>
            <Button
              variant="danger"
              disabled={typed !== "DELETE ALL"}
              loading={clearing}
              onClick={async () => {
                setClearing(true);
                try {
                  await clearAllRegistrationsConfirmed();
                  notify("success", "All student records deleted.");
                  setDangerOpen(false);
                  setTyped("");
                } catch (e: any) {
                  notify("error", e?.message || "Couldn't delete the records.");
                } finally {
                  setClearing(false);
                }
              }}
            >
              Delete {registrations.length} records
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Download a CSV first if you might need them. To confirm, type <span className="font-bold">DELETE ALL</span> below.
        </p>
        <label htmlFor="confirm-delete" className="sr-only">Type DELETE ALL</label>
        <input id="confirm-delete" value={typed} onChange={(e) => setTyped(e.target.value)} className={`${inputClass} mt-3`} autoComplete="off" data-autofocus />
      </Dialog>
    </AdminPage>
  );
};

export default SettingsPage;
