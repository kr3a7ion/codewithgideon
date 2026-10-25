/* /contact — WhatsApp first, then a message form for anything else. */
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2, Clock3, GraduationCap, Instagram, Loader2, Mail, PenTool, Send, Smartphone } from "lucide-react";
import { functions } from "../services/firebase";
import { httpsCallable } from "firebase/functions";
import { useSiteConfig } from "../hooks/useSiteConfig";
import { useContactLinks } from "../src/marketing/useContactLinks";
import { trackWhatsApp } from "../src/marketing/analytics";
import { Eyebrow, Section, WhatsAppIcon, container, mbtn } from "../src/marketing/ui";
import { cn } from "../src/ui";

const inputCls =
  "h-[50px] w-full rounded-xl border-[1.5px] border-line-strong bg-white px-4 text-base text-blue-900 placeholder:text-slate-400 transition-shadow focus:border-blue-900 focus:outline-none focus:ring-4 focus:ring-blue-900/10 aria-[invalid=true]:border-red-600 dark:border-slate-600 dark:bg-slate-900 dark:text-white dark:focus:border-slate-300";

const Contact: React.FC = () => {
  const { config } = useSiteConfig();
  const { whatsapp, email, responseTime } = useContactLinks();
  const [formData, setFormData] = useState({ name: "", email: "", message: "" });
  const [fieldErrors, setFieldErrors] = useState<{ name?: string; email?: string; message?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState("");

  const validate = () => {
    const nextErrors: {
      name?: string;
      email?: string;
      message?: string;
    } = {};

    const cleanName = formData.name.trim();
    const cleanEmail = formData.email.trim();
    const cleanMessage = formData.message.trim();

    if (!cleanName) {
      nextErrors.name = "Please enter your name.";
    } else if (cleanName.length < 2) {
      nextErrors.name = "Name must be at least 2 characters.";
    }

    if (!cleanEmail) {
      nextErrors.email = "Please enter your email.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      nextErrors.email = "Please enter a valid email address.";
    }

    if (!cleanMessage) {
      nextErrors.message = "Please enter your message.";
    } else if (cleanMessage.length < 10) {
      nextErrors.message = "Message must be at least 10 characters.";
    }

    return nextErrors;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setFieldErrors((prev) => ({
      ...prev,
      [name]: undefined,
    }));

    setSubmitError("");
    setSubmitSuccess("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");
    setSubmitSuccess("");

    const errors = validate();
    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) return;

    setIsSubmitting(true);

    try {
      const sendContactMessage = httpsCallable<
        { name: string; email: string; message: string },
        { success: boolean; message: string }
      >(functions, "sendContactMessage");

      const result = await sendContactMessage({
        name: formData.name.trim(),
        email: formData.email.trim(),
        message: formData.message.trim(),
      });

      if (!result.data?.success) {
        throw new Error("Message was not accepted.");
      }

      setSubmitSuccess(result.data.message || "Message sent successfully.");
      setFormData({
        name: "",
        email: "",
        message: "",
      });
      setFieldErrors({});
    } catch (err: any) {
      const code = String(err?.code || "");
      const msg = String(err?.message || "");

      if (code.includes("invalid-argument")) {
        setSubmitError(msg || "Please check your input and try again.");
      } else if (code.includes("internal")) {
        setSubmitError("Server error. Please try again shortly.");
      } else {
        setSubmitError(msg || "Could not send your message. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const socials = [
    config.instagramUrl && config.instagramHandle ? { href: config.instagramUrl, label: `Instagram ${config.instagramHandle}`, icon: Instagram } : null,
    config.tiktokUrl && config.tiktokHandle ? { href: config.tiktokUrl, label: `TikTok ${config.tiktokHandle}`, icon: Smartphone } : null,
  ].filter(Boolean) as { href: string; label: string; icon: React.ComponentType<{ className?: string }> }[];

  const field = (name: "name" | "email" | "message") => ({
    id: `contact-${name}`,
    name,
    value: formData[name],
    onChange: handleChange,
    "aria-invalid": !!fieldErrors[name],
    "aria-describedby": fieldErrors[name] ? `contact-${name}-error` : undefined,
  });
  const err = (name: "name" | "email" | "message") =>
    fieldErrors[name] ? (
      <p id={`contact-${name}-error`} className="mt-1.5 text-sm font-semibold text-red-600 dark:text-red-400">
        {fieldErrors[name]}
      </p>
    ) : null;

  return (
    <>
      <section className="bg-paper dark:bg-paper-dark" aria-labelledby="contact-title">
        <div className={`${container} pb-10 pt-10 sm:pb-14 sm:pt-16`}>
          <Eyebrow>Contact</Eyebrow>
          <h1
            id="contact-title"
            className="mt-4 max-w-[760px] font-display text-[40px] font-bold leading-[44px] tracking-[-0.02em] text-blue-900 dark:text-white sm:text-[56px] sm:leading-[60px]"
          >
            Get in touch.
          </h1>
          <p className="mt-4 max-w-[620px] text-base leading-[26px] text-slate-600 dark:text-slate-300 sm:text-lg sm:leading-7">
            Questions about a course, a payment or a project? WhatsApp is the fastest way to reach Gideon.
          </p>
        </div>
      </section>

      <Section tone="page" className="!pt-10 sm:!pt-14">
        <div className="grid items-start gap-8 lg:grid-cols-[400px_minmax(0,1fr)] lg:gap-14">
          <div className="space-y-4">
            <a
              href={whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackWhatsApp("contact")}
              className="group flex items-center gap-4 rounded-[20px] bg-teal-600 p-5 text-white shadow-card transition hover:bg-teal-700"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15">
                <WhatsAppIcon className="h-6 w-6" />
              </span>
              <span className="flex-1">
                <span className="block font-display text-lg font-semibold">Chat on WhatsApp</span>
                <span className="block text-sm text-teal-50">The quickest reply</span>
              </span>
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" aria-hidden />
            </a>
            <a
              href={`mailto:${email}`}
              className="flex items-center gap-4 rounded-[20px] border border-line bg-white p-5 transition hover:border-blue-900 dark:border-line-dark dark:bg-slate-900 dark:hover:border-slate-500"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-paper dark:bg-slate-800">
                <Mail className="h-5 w-5 text-blue-900 dark:text-white" aria-hidden />
              </span>
              <span className="min-w-0">
                <span className="block font-display text-base font-semibold text-blue-900 dark:text-white">Email</span>
                <span className="block truncate text-sm text-slate-600 dark:text-slate-300">{email}</span>
              </span>
            </a>
            <p className="flex items-center gap-2 px-1 text-sm font-medium text-slate-600 dark:text-slate-300">
              <Clock3 className="h-4 w-4 text-slate-400" aria-hidden /> Reply time: {String(responseTime || "within a day").toLowerCase()}.
            </p>
            {socials.length ? (
              <ul className="flex flex-wrap gap-2 px-1">
                {socials.map(({ href, label, icon: Icon }) => (
                  <li key={href}>
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3 py-1.5 text-xs font-bold text-blue-900 hover:border-blue-900 dark:border-line-dark dark:bg-slate-900 dark:text-white"
                    >
                      <Icon className="h-3.5 w-3.5" aria-hidden /> {label}
                    </a>
                  </li>
                ))}
              </ul>
            ) : null}
            <div className="grid gap-3 pt-2 sm:grid-cols-2 lg:grid-cols-1">
              <Link to="/courses" className="flex items-center gap-3 rounded-2xl bg-teal-50 p-4 text-sm font-semibold text-blue-900 hover:bg-teal-100 dark:bg-teal-950/60 dark:text-white">
                <GraduationCap className="h-5 w-5 text-teal-700 dark:text-teal-300" aria-hidden /> Want to learn? See the courses
              </Link>
              <Link to="/hire#enquire" className="flex items-center gap-3 rounded-2xl bg-orange-50 p-4 text-sm font-semibold text-blue-900 hover:bg-orange-100 dark:bg-orange-950/40 dark:text-white">
                <PenTool className="h-5 w-5 text-orange-700 dark:text-orange-300" aria-hidden /> Need a website or app? Start a project
              </Link>
            </div>
          </div>

          <div className="rounded-3xl border border-line bg-white p-5 shadow-lift dark:border-line-dark dark:bg-slate-900 sm:p-8">
            {submitSuccess ? (
              <div role="status" className="flex flex-col items-start gap-4 py-6">
                <CheckCircle2 className="h-10 w-10 text-teal-600" aria-hidden />
                <h2 className="font-display text-2xl font-semibold text-blue-900 dark:text-white">Message sent</h2>
                <p className="text-base text-slate-600 dark:text-slate-300">{submitSuccess} Gideon will reply by email.</p>
                <button type="button" onClick={() => setSubmitSuccess("")} className={mbtn({ kind: "secondary" })}>
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate className="space-y-[18px]" aria-label="Send a message">
                <h2 className="font-display text-[22px] font-semibold text-blue-900 dark:text-white">Send a message</h2>
                <div className="grid gap-[18px] sm:grid-cols-2">
                  <div>
                    <label htmlFor="contact-name" className="mb-2 block text-sm font-bold text-blue-900 dark:text-white">Your name</label>
                    <input {...field("name")} autoComplete="name" className={inputCls} />
                    {err("name")}
                  </div>
                  <div>
                    <label htmlFor="contact-email" className="mb-2 block text-sm font-bold text-blue-900 dark:text-white">Email</label>
                    <input {...field("email")} type="email" autoComplete="email" inputMode="email" className={inputCls} />
                    {err("email")}
                  </div>
                </div>
                <div>
                  <label htmlFor="contact-message" className="mb-2 block text-sm font-bold text-blue-900 dark:text-white">Message</label>
                  <textarea {...field("message")} rows={6} placeholder="How can Gideon help?" className={cn(inputCls, "h-auto py-3")} />
                  {err("message")}
                </div>
                {submitError ? (
                  <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 dark:bg-red-500/10 dark:text-red-300">
                    {submitError}
                  </p>
                ) : null}
                <button type="submit" disabled={isSubmitting} className={mbtn({ kind: "primary", size: "lg", full: true })}>
                  {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> : <Send className="h-5 w-5" aria-hidden />}
                  {isSubmitting ? "Sending…" : "Send message"}
                </button>
                <p className="text-xs text-slate-500 dark:text-slate-400">Your email is only used to reply to you.</p>
              </form>
            )}
          </div>
        </div>
      </Section>
    </>
  );
};

export default Contact;
