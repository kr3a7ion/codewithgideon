import React, { useEffect, useId, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { httpsCallable } from "firebase/functions";
import { ArrowRight, ArrowUpRight, CalendarDays, CheckCircle2 } from "lucide-react";
import { functions } from "../../services/firebase";
import { useSiteConfig } from "../../hooks/useSiteConfig";
import { usePageMeta } from "../app/usePageMeta";
import {
  BOOKING_URL,
  HIRE_BUDGETS,
  HIRE_FAQ,
  HIRE_NEEDS,
  HIRE_TERMS,
  PACKAGES,
  PROCESS,
  WHATSAPP_MESSAGES,
  WORK,
  type HireNeed,
  whatsappLink,
} from "../marketing/content";
import { getUtm, track, trackCta, trackWhatsApp } from "../marketing/analytics";
import {
  CheckItem,
  DemoLink,
  Eyebrow,
  FaqList,
  PackageCard,
  Section,
  SectionHeader,
  StepCard,
  Tag,
  WhatsAppIcon,
  container,
  mbtn,
} from "../marketing/ui";

const inputClass =
  "h-[50px] w-full rounded-xl border-[1.5px] border-[#8592A8] bg-white px-4 text-base text-blue-900 placeholder:text-slate-500 focus:border-blue-900 focus:outline-none focus:ring-4 focus:ring-blue-900/10 aria-[invalid=true]:border-red-600 dark:border-slate-600 dark:bg-slate-900 dark:text-white dark:focus:border-slate-300";

const isNeed = (v: string | null): v is HireNeed => v === "landing" || v === "booking" || v === "other";

/** Same rules as the server: Nigerian 0XXXXXXXXXX / +234… or any 10–15 digit international number. */
export const normalizeWhatsApp = (raw: string): string | null => {
  let d = String(raw || "").replace(/\D/g, "");
  if (d.startsWith("00")) d = d.slice(2);
  if (d.length === 11 && d.startsWith("0")) d = `234${d.slice(1)}`;
  else if (d.length === 10 && /^[789]/.test(d)) d = `234${d}`;
  return d.length >= 10 && d.length <= 15 ? d : null;
};

type Errors = Partial<Record<"name" | "business" | "whatsapp" | "need" | "budget", string>>;

const EnquiryForm: React.FC = () => {
  const [params] = useSearchParams();
  const initialNeed = params.get("need");
  const [name, setName] = useState("");
  const [business, setBusiness] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [need, setNeed] = useState<HireNeed | "">(isNeed(initialNeed) ? initialNeed : "");
  const [budget, setBudget] = useState("");
  const [details, setDetails] = useState("");
  const [website, setWebsite] = useState(""); // honeypot
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "failed">("idle");
  const [serverError, setServerError] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const id = useId();

  useEffect(() => {
    const n = params.get("need");
    if (isNeed(n)) setNeed(n);
  }, [params]);

  const needLabel = HIRE_NEEDS.find((n) => n.value === need)?.label || "";
  const budgetLabel = HIRE_BUDGETS.find((b) => b.value === budget)?.label || "";
  const fallbackText = [
    WHATSAPP_MESSAGES.hire,
    name && `Name: ${name}`,
    business && `Business: ${business}`,
    needLabel && `I need: ${needLabel}`,
    budgetLabel && `Budget: ${budgetLabel}`,
    details && `More: ${details}`,
  ]
    .filter(Boolean)
    .join("\n");

  const validate = (): Errors => {
    const e: Errors = {};
    if (name.trim().length < 2) e.name = "Enter your name.";
    if (business.trim().length < 2) e.business = "Enter your business name.";
    if (!normalizeWhatsApp(whatsapp)) e.whatsapp = "Enter a WhatsApp number, like 0803 000 0000.";
    if (!need) e.need = "Choose what you need.";
    if (!budget) e.budget = "Choose a budget range.";
    return e;
  };

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) {
      const first = Object.keys(e)[0];
      formRef.current?.querySelector<HTMLElement>(`[data-field="${first}"]`)?.focus();
      return;
    }
    setStatus("sending");
    setServerError("");
    try {
      const send = httpsCallable<Record<string, unknown>, { success: boolean }>(functions, "sendHireEnquiry");
      await send({ name, businessName: business, whatsapp, need, budget, details, website, utm: getUtm(), page: window.location.pathname });
      setStatus("sent");
      track("generate_lead", { lead_type: "website", need, budget });
    } catch (err: unknown) {
      const code = String((err as { code?: string })?.code || "");
      setServerError(
        code.includes("resource-exhausted")
          ? "You've sent a few enquiries already. Please send this one on WhatsApp instead."
          : code.includes("invalid-argument")
            ? String((err as { message?: string })?.message || "Please check the form.")
            : "The form couldn't be sent just now. Send the same details on WhatsApp and I'll reply there.",
      );
      setStatus("failed");
    }
    window.setTimeout(() => resultRef.current?.focus(), 50);
  };

  if (status === "sent") {
    return (
      <div ref={resultRef} tabIndex={-1} role="status" className="flex flex-col items-start gap-4 rounded-3xl border border-line bg-white p-6 shadow-lift outline-none dark:border-line-dark dark:bg-slate-900 sm:p-8">
        <CheckCircle2 className="h-10 w-10 text-teal-600 dark:text-teal-300" aria-hidden />
        <h3 className="font-display text-[22px] font-semibold leading-7 text-blue-900 dark:text-white">Thanks, {name.trim().split(/\s+/)[0]}. Your enquiry is in.</h3>
        <p className="text-base leading-[26px] text-slate-600 dark:text-slate-300">
          I&rsquo;ll reply on WhatsApp with a plan and a fixed price. Want a faster answer? Send it on WhatsApp too.
        </p>
        <a href={whatsappLink(fallbackText)} target="_blank" rel="noopener noreferrer" onClick={() => trackWhatsApp("hire")} className={mbtn({ kind: "hire" })}>
          <WhatsAppIcon className="h-5 w-5" /> Send on WhatsApp too
        </a>
      </div>
    );
  }

  const err = (k: keyof Errors) =>
    errors[k] ? (
      <p id={`${id}-${k}-err`} className="mt-1.5 text-sm font-semibold text-red-600 dark:text-red-400">
        {errors[k]}
      </p>
    ) : null;
  const described = (k: keyof Errors) => (errors[k] ? `${id}-${k}-err` : undefined);

  return (
    <form ref={formRef} onSubmit={submit} noValidate className="relative flex flex-col gap-[18px] rounded-3xl border border-line bg-white p-5 shadow-lift dark:border-line-dark dark:bg-slate-900 sm:p-8" aria-label="Website enquiry">
      <div className="grid gap-[18px] sm:grid-cols-2 sm:gap-4">
        <div>
          <label htmlFor={`${id}-name`} className="mb-2 block text-sm font-bold text-blue-900 dark:text-white">
            Your name
          </label>
          <input id={`${id}-name`} data-field="name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" className={inputClass} aria-invalid={!!errors.name} aria-describedby={described("name")} />
          {err("name")}
        </div>
        <div>
          <label htmlFor={`${id}-business`} className="mb-2 block text-sm font-bold text-blue-900 dark:text-white">
            Business name
          </label>
          <input
            id={`${id}-business`}
            data-field="business"
            value={business}
            onChange={(e) => setBusiness(e.target.value)}
            autoComplete="organization"
            placeholder="e.g. Glow Beauty Lounge"
            className={inputClass}
            aria-invalid={!!errors.business}
            aria-describedby={described("business")}
          />
          {err("business")}
        </div>
      </div>
      <div>
        <label htmlFor={`${id}-wa`} className="mb-2 block text-sm font-bold text-blue-900 dark:text-white">
          WhatsApp number
        </label>
        <input
          id={`${id}-wa`}
          data-field="whatsapp"
          value={whatsapp}
          onChange={(e) => setWhatsapp(e.target.value)}
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="0803 000 0000"
          className={inputClass}
          aria-invalid={!!errors.whatsapp}
          aria-describedby={described("whatsapp")}
        />
        {err("whatsapp")}
      </div>
      <fieldset aria-describedby={described("need")}>
        <legend className="mb-2 block text-sm font-bold text-blue-900 dark:text-white">What do you need?</legend>
        <div className="grid gap-2.5 sm:grid-cols-3">
          {HIRE_NEEDS.map((o, i) => (
            <label
              key={o.value}
              className={`flex cursor-pointer items-center gap-2.5 rounded-xl border-[1.5px] px-3.5 py-3 text-sm font-semibold text-blue-900 transition-colors has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-blue-900/15 dark:text-white ${
                need === o.value ? "border-orange-500 bg-orange-50 dark:bg-orange-950/40" : "border-[#8592A8] bg-white hover:border-blue-900 dark:border-slate-500 dark:bg-slate-900"
              }`}
            >
              <input
                type="radio"
                name={`${id}-need`}
                value={o.value}
                checked={need === o.value}
                onChange={() => setNeed(o.value)}
                data-field={i === 0 ? "need" : undefined}
                className="h-4 w-4 accent-orange-600"
              />
              {o.label}
            </label>
          ))}
        </div>
        {err("need")}
      </fieldset>
      <div>
        <label htmlFor={`${id}-budget`} className="mb-2 block text-sm font-bold text-blue-900 dark:text-white">
          Budget
        </label>
        <select
          id={`${id}-budget`}
          data-field="budget"
          value={budget}
          onChange={(e) => setBudget(e.target.value)}
          className={`${inputClass} appearance-none pr-10`}
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='18' height='18' fill='none' stroke='%2361708A' stroke-width='2' viewBox='0 0 24 24'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
            backgroundPosition: "right 14px center",
            backgroundRepeat: "no-repeat",
          }}
          aria-invalid={!!errors.budget}
          aria-describedby={described("budget")}
        >
          <option value="">Choose a range</option>
          {HIRE_BUDGETS.map((b) => (
            <option key={b.value} value={b.value}>
              {b.label}
            </option>
          ))}
        </select>
        {err("budget")}
      </div>
      <div>
        <label htmlFor={`${id}-details`} className="mb-2 block text-sm font-bold text-blue-900 dark:text-white">
          Anything else? <span className="font-medium text-slate-500">(optional)</span>
        </label>
        <textarea
          id={`${id}-details`}
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          rows={3}
          maxLength={1000}
          placeholder="What you sell, how customers book today, a site you like…"
          className={`${inputClass} h-auto py-3`}
        />
      </div>
      {/* Honeypot: hidden from people, tempting for bots. */}
      <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label>
          Website
          <input tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
        </label>
      </div>

      {status === "failed" ? (
        <div ref={resultRef} tabIndex={-1} role="alert" className="rounded-xl border border-orange-300 bg-orange-50 p-4 text-sm font-medium text-orange-900 outline-none dark:border-orange-500/40 dark:bg-orange-950/40 dark:text-orange-100">
          <p>{serverError}</p>
          <a href={whatsappLink(fallbackText)} target="_blank" rel="noopener noreferrer" onClick={() => trackWhatsApp("hire")} className={mbtn({ kind: "hire", size: "sm", className: "mt-3" })}>
            <WhatsAppIcon className="h-[18px] w-[18px]" /> Send on WhatsApp
          </a>
        </div>
      ) : null}

      <button type="submit" disabled={status === "sending"} className={mbtn({ kind: "hire", size: "lg", full: true })}>
        {status === "sending" ? (
          <>
            <span aria-hidden className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" /> Sending…
          </>
        ) : (
          <>
            Send enquiry <ArrowRight className="h-5 w-5" aria-hidden />
          </>
        )}
      </button>
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Your number is only used to reply to this enquiry.</p>
    </form>
  );
};

/** /hire — packages, process and the enquiry form (brief §5). */
const HirePage: React.FC = () => {
  const { config } = useSiteConfig();
  usePageMeta({
    title: "Hire Gideon: websites that take bookings",
    description:
      "WhatsApp-first landing pages from ₦90,000 and booking websites for ₦180,000, designed in Figma first. The domain and hosting stay in your name.",
    image: WORK[1].images.og,
  });
  const [, adire] = WORK;

  return (
    <>
      {/* Hero */}
      <section className="bg-paper dark:bg-paper-dark" aria-labelledby="hire-title">
        <div className={`${container} grid items-center gap-8 pb-14 pt-9 sm:pt-14 lg:grid-cols-[minmax(0,620px)_minmax(0,1fr)] lg:gap-14 lg:pb-24 lg:pt-[72px]`}>
          <div className="flex flex-col gap-5 lg:gap-6">
            <Eyebrow tone="hire">Hire</Eyebrow>
            <h1
              id="hire-title"
              className="font-display text-[40px] font-bold leading-[44px] tracking-[-0.02em] text-blue-900 dark:text-white sm:text-[56px] sm:leading-[60px] lg:text-[64px] lg:leading-[68px] lg:tracking-[-0.025em]"
            >
              Websites that take bookings for your business.
            </h1>
            <p className="text-base leading-[26px] text-slate-600 dark:text-slate-300 sm:text-lg sm:leading-7">
              I design it in Figma first so you see it before I build it. Fixed prices, and the domain and hosting stay in your name.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <a
                href={whatsappLink(WHATSAPP_MESSAGES.hire)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackWhatsApp("hire")}
                className={mbtn({ kind: "hire", size: "lg" })}
              >
                <WhatsAppIcon className="h-5 w-5" /> Chat on WhatsApp
              </a>
              <a href="#enquire" onClick={() => trackCta("enquiry_form", "hire")} className={mbtn({ kind: "secondary", size: "lg" })}>
                Send an enquiry
              </a>
            </div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Reply time: {config.responseTime.toLowerCase()}.</p>
          </div>
          <Link to={`/work/${adire.slug}`} className="block overflow-hidden rounded-[18px] shadow-lift sm:rounded-[20px]" aria-label={`${adire.name} case study`}>
            <img
              src={adire.images.cover}
              srcSet={`${adire.images.cover960} 960w, ${adire.images.cover} 1600w`}
              sizes="(min-width: 1024px) 524px, calc(100vw - 40px)"
              alt={adire.images.alt}
              width={1600}
              height={1000}
              className="aspect-[16/10] w-full object-cover"
            />
          </Link>
        </div>
      </section>

      {/* Packages */}
      <Section id="packages" tone="page" labelledBy="pk-title">
        <SectionHeader
          id="pk-title"
          eyebrow="Packages"
          tone="hire"
          title="Pick a starting point."
          description="Every package is a fixed price. If you need something else, ask and you'll get a quote."
        />
        <div className="mt-10 grid items-start gap-4 sm:gap-6 lg:grid-cols-3">
          {PACKAGES.map((p) => (
            <PackageCard key={p.id} pkg={p} location="hire" />
          ))}
        </div>
        <ul className="mt-6 flex flex-col gap-2.5 rounded-2xl bg-paper px-5 py-4 text-sm font-medium text-blue-900 dark:bg-paper-dark dark:text-white sm:flex-row sm:flex-wrap sm:gap-x-7">
          {HIRE_TERMS.map((t) => (
            <CheckItem key={t} tone="hire">
              {t}
            </CheckItem>
          ))}
        </ul>
      </Section>

      {/* Process */}
      <Section tone="paper" labelledBy="process-title">
        <SectionHeader
          id="process-title"
          eyebrow="How it works"
          tone="hire"
          title="Chat, design, build, launch."
          description="Four steps, and you see the design before a line of code is written."
        />
        <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PROCESS.map((s, i) => (
            <StepCard key={s.title} n={i + 1} title={s.title} body={s.body} />
          ))}
        </ol>
      </Section>

      {/* Proof */}
      <Section tone="page" labelledBy="proof-title">
        <SectionHeader
          id="proof-title"
          eyebrow="Work"
          title="See it working."
          description="Both demos are live. Book a room or a hairstyle and see exactly what your customers would see."
          action={
            <Link to="/work" className="inline-flex items-center gap-1.5 text-[15px] font-bold text-blue-900 hover:underline dark:text-white">
              See all work <ArrowRight className="h-[18px] w-[18px]" aria-hidden />
            </Link>
          }
        />
        <div className="mt-10 grid gap-4 sm:gap-6 lg:grid-cols-2">
          {WORK.map((w) => (
            <article key={w.slug} className="flex flex-col gap-4 rounded-[20px] border border-line bg-white p-4 dark:border-line-dark dark:bg-slate-900 sm:flex-row sm:items-center sm:gap-5 sm:pr-5">
              <img src={w.images.card} alt="" width={800} height={500} loading="lazy" className="aspect-[16/10] w-full shrink-0 rounded-xl object-cover sm:w-60" />
              <div className="space-y-2">
                <Tag tone="sample">Sample project</Tag>
                <h3 className="font-display text-[22px] font-semibold leading-7 text-blue-900 dark:text-white">{w.name}</h3>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-300">{w.type}</p>
                <div className="flex gap-5 pt-1 text-sm font-bold text-blue-900 dark:text-white">
                  <DemoLink work={w} location="hire" className="inline-flex items-center gap-1.5 hover:underline" />
                  <Link to={`/work/${w.slug}`} className="inline-flex items-center gap-1.5 hover:underline">
                    Case study <ArrowRight className="h-4 w-4" aria-hidden />
                    <span className="sr-only">: {w.name}</span>
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </Section>

      {/* Enquire */}
      <Section id="enquire" tone="paper" labelledBy="enquire-title">
        <div className="grid items-start gap-8 lg:grid-cols-[460px_minmax(0,1fr)] lg:gap-[72px]">
          <div className="space-y-5">
            <Eyebrow tone="hire">Enquire</Eyebrow>
            <h2 id="enquire-title" className="font-display text-[30px] font-bold leading-9 tracking-[-0.02em] text-blue-900 dark:text-white sm:text-[40px] sm:leading-[46px]">
              Tell me about your business.
            </h2>
            <p className="text-base leading-[26px] text-slate-600 dark:text-slate-300 sm:text-lg sm:leading-7">
              Fill in the form or message me on WhatsApp. Either way you&rsquo;ll get a reply with a plan and a fixed price.
            </p>
            <a
              href={whatsappLink(WHATSAPP_MESSAGES.hire)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackWhatsApp("hire")}
              className={mbtn({ kind: "hire", size: "lg", className: "w-full sm:w-auto" })}
            >
              <WhatsAppIcon className="h-5 w-5" /> Chat on WhatsApp
            </a>
            {BOOKING_URL ? (
              <p>
                <a
                  href={BOOKING_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackCta("book_call", "hire")}
                  className="inline-flex items-center gap-2 text-[15px] font-bold text-blue-900 hover:underline dark:text-white"
                >
                  <CalendarDays className="h-[18px] w-[18px]" aria-hidden /> Or book a free 15-minute call <ArrowUpRight className="h-4 w-4" aria-hidden />
                </a>
              </p>
            ) : null}
          </div>
          <EnquiryForm />
        </div>
      </Section>

      {/* FAQ */}
      <Section tone="page" labelledBy="hire-faq-title">
        <SectionHeader id="hire-faq-title" eyebrow="FAQ" title="Before you ask." description="Short answers to what business owners ask first." />
        <div className="mt-10 grid items-start gap-3 lg:grid-cols-2 lg:gap-6">
          <FaqList items={HIRE_FAQ.slice(0, 3)} />
          <FaqList items={HIRE_FAQ.slice(3)} defaultOpen={-1} />
        </div>
      </Section>
    </>
  );
};

export default HirePage;
