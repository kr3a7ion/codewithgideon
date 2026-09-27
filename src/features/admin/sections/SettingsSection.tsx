/* Extracted from AdminDashboard.tsx; state comes from useAdmin(). */
import React from "react";
import { Copy } from "lucide-react";
import {
  surfaceCardClass,
  sectionTitleClass,
  sectionCopyClass,
  subtleActionClass,
  primaryActionClass,
} from "../lib";
import { BusyButton } from "../components";
import { useAdmin } from "../AdminWorkspaceContext";

const SettingsSection: React.FC = () => {
  const {
    siteConfigForm,
    siteConfigLoading,
    siteConfigError,
    siteConfigSaved,
    activeAdminSection,
    busy,
    fetchSiteConfig,
    updateSiteConfigField,
    updateSupportTopics,
    handleSaveSiteConfig,
    settingsLabelClass,
    settingsInputClass,
  } = useAdmin();
  return (
    <>
      {activeAdminSection === "settings" && (
        <form
          onSubmit={handleSaveSiteConfig}
          className={`mb-8 p-8 ${surfaceCardClass}`}
        >
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className={sectionTitleClass}>Site Settings</h2>
              <p className={sectionCopyClass}>
                Manage homepage CTA, contact links, social links, APK link,
                and support copy from one Firestore config document.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={fetchSiteConfig}
                className={subtleActionClass}
              >
                Reload
              </button>
              <BusyButton
                type="submit"
                busy={siteConfigLoading}
                busyText="Saving..."
                className={primaryActionClass}
              >
                Save Settings
              </BusyButton>
            </div>
          </div>

          {siteConfigError && (
            <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-800 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-100">
              {siteConfigError}
            </div>
          )}

          {siteConfigSaved && (
            <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-semibold text-emerald-800 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-100">
              {siteConfigSaved}
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50/70 p-5 dark:border-slate-800 dark:bg-slate-950/50">
              <h3 className="mb-4 text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white">
                Contact Copy
              </h3>

              <div className="space-y-4">
                <label className="block">
                  <span className={settingsLabelClass}>Heading</span>
                  <input
                    value={siteConfigForm.contactHeading}
                    onChange={(event) =>
                      updateSiteConfigField(
                        "contactHeading",
                        event.target.value,
                      )
                    }
                    className={settingsInputClass}
                  />
                </label>

                <label className="block">
                  <span className={settingsLabelClass}>Subheading</span>
                  <input
                    value={siteConfigForm.contactSubheading}
                    onChange={(event) =>
                      updateSiteConfigField(
                        "contactSubheading",
                        event.target.value,
                      )
                    }
                    className={settingsInputClass}
                  />
                </label>

                <label className="block">
                  <span className={settingsLabelClass}>Intro Title</span>
                  <input
                    value={siteConfigForm.contactIntroTitle}
                    onChange={(event) =>
                      updateSiteConfigField(
                        "contactIntroTitle",
                        event.target.value,
                      )
                    }
                    className={settingsInputClass}
                  />
                </label>

                <label className="block">
                  <span className={settingsLabelClass}>Intro Text</span>
                  <textarea
                    value={siteConfigForm.contactIntroText}
                    onChange={(event) =>
                      updateSiteConfigField(
                        "contactIntroText",
                        event.target.value,
                      )
                    }
                    rows={5}
                    className={settingsInputClass}
                  />
                </label>

                <label className="block">
                  <span className={settingsLabelClass}>Support Topics</span>
                  <input
                    value={siteConfigForm.supportTopics.join(", ")}
                    onChange={(event) =>
                      updateSupportTopics(event.target.value)
                    }
                    placeholder="Enrollment, Billing, App Access"
                    className={settingsInputClass}
                  />
                </label>
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50/70 p-5 dark:border-slate-800 dark:bg-slate-950/50">
              <h3 className="mb-4 text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white">
                Contact Links
              </h3>

              <div className="space-y-4">
                <label className="block">
                  <span className={settingsLabelClass}>Email</span>
                  <input
                    type="email"
                    value={siteConfigForm.contactEmail}
                    onChange={(event) =>
                      updateSiteConfigField(
                        "contactEmail",
                        event.target.value,
                      )
                    }
                    className={settingsInputClass}
                  />
                </label>

                <label className="block">
                  <span className={settingsLabelClass}>Response Time</span>
                  <input
                    value={siteConfigForm.responseTime}
                    onChange={(event) =>
                      updateSiteConfigField(
                        "responseTime",
                        event.target.value,
                      )
                    }
                    className={settingsInputClass}
                  />
                </label>

                <label className="block">
                  <span className={settingsLabelClass}>WhatsApp URL</span>
                  <input
                    value={siteConfigForm.whatsappUrl}
                    onChange={(event) =>
                      updateSiteConfigField(
                        "whatsappUrl",
                        event.target.value,
                      )
                    }
                    className={settingsInputClass}
                  />
                </label>

                <label className="block">
                  <span className={settingsLabelClass}>Instagram URL</span>
                  <input
                    value={siteConfigForm.instagramUrl}
                    onChange={(event) =>
                      updateSiteConfigField(
                        "instagramUrl",
                        event.target.value,
                      )
                    }
                    className={settingsInputClass}
                  />
                </label>

                <label className="block">
                  <span className={settingsLabelClass}>
                    Instagram Handle
                  </span>
                  <input
                    value={siteConfigForm.instagramHandle}
                    onChange={(event) =>
                      updateSiteConfigField(
                        "instagramHandle",
                        event.target.value,
                      )
                    }
                    className={settingsInputClass}
                  />
                </label>
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50/70 p-5 dark:border-slate-800 dark:bg-slate-950/50">
              <h3 className="mb-4 text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white">
                Homepage & App
              </h3>

              <div className="space-y-4">
                <label className="block">
                  <span className={settingsLabelClass}>TikTok URL</span>
                  <input
                    value={siteConfigForm.tiktokUrl}
                    onChange={(event) =>
                      updateSiteConfigField("tiktokUrl", event.target.value)
                    }
                    className={settingsInputClass}
                  />
                </label>

                <label className="block">
                  <span className={settingsLabelClass}>TikTok Handle</span>
                  <input
                    value={siteConfigForm.tiktokHandle}
                    onChange={(event) =>
                      updateSiteConfigField(
                        "tiktokHandle",
                        event.target.value,
                      )
                    }
                    className={settingsInputClass}
                  />
                </label>

                <label className="block">
                  <span className={settingsLabelClass}>
                    Homepage CTA Label
                  </span>
                  <input
                    value={siteConfigForm.homepageCtaLabel}
                    onChange={(event) =>
                      updateSiteConfigField(
                        "homepageCtaLabel",
                        event.target.value,
                      )
                    }
                    className={settingsInputClass}
                  />
                </label>

                <label className="block">
                  <span className={settingsLabelClass}>
                    Homepage CTA URL
                  </span>
                  <input
                    value={siteConfigForm.homepageCtaHref}
                    onChange={(event) =>
                      updateSiteConfigField(
                        "homepageCtaHref",
                        event.target.value,
                      )
                    }
                    placeholder="/contact or https://..."
                    className={settingsInputClass}
                  />
                </label>

                <label className="block">
                  <span className={settingsLabelClass}>APK URL</span>
                  <input
                    value={siteConfigForm.apkDownloadUrl}
                    onChange={(event) =>
                      updateSiteConfigField(
                        "apkDownloadUrl",
                        event.target.value,
                      )
                    }
                    placeholder="https://..."
                    className={settingsInputClass}
                  />
                </label>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className={settingsLabelClass}>APK Label</span>
                    <input
                      value={siteConfigForm.apkDownloadLabel}
                      onChange={(event) =>
                        updateSiteConfigField(
                          "apkDownloadLabel",
                          event.target.value,
                        )
                      }
                      className={settingsInputClass}
                    />
                  </label>

                  <label className="block">
                    <span className={settingsLabelClass}>APK Subtext</span>
                    <input
                      value={siteConfigForm.apkDownloadSubLabel}
                      onChange={(event) =>
                        updateSiteConfigField(
                          "apkDownloadSubLabel",
                          event.target.value,
                        )
                      }
                      className={settingsInputClass}
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>
        </form>
      )}
    </>
  );
};

export default SettingsSection;
