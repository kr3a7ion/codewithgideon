/**
 * Form pieces for the join flow (Figma "08 Student · Join"): stepper, text
 * field, choice chips, course options, weeks picker, order summary and the
 * course summary that stays visible on every step.
 */
import React, { useId } from "react";
import { AlertCircle, Calendar, Check, ChevronRight, Minus, Plus, ShieldCheck } from "lucide-react";
import { cn } from "../../ui";
import { Card, naira, plural, Spinner } from "../shared/ui";
import type { JoinCourse } from "./useJoinCourses";

// ---------------------------------------------------------------------------
// Stepper
// ---------------------------------------------------------------------------

export const JOIN_STEPS = ["Account", "Your details", "Payment"] as const;

export const Stepper: React.FC<{ step: 1 | 2 | 3; className?: string }> = ({ step, className }) => (
  <div className={className}>
    {/* Phones: compact bar */}
    <div className="sm:hidden">
      <div className="flex items-center justify-between text-[13px] font-bold leading-[18px]">
        <span className="text-slate-500 dark:text-slate-400">Step {step} of 3</span>
        <span className="text-blue-900 dark:text-white">{JOIN_STEPS[step - 1]}</span>
      </div>
      <div className="mt-2 flex gap-1.5" aria-hidden>
        {[1, 2, 3].map((n) => (
          <span
            key={n}
            className={cn(
              "h-1 flex-1 rounded-full",
              n < step ? "bg-teal-600 dark:bg-teal-400" : n === step ? "bg-blue-900 dark:bg-white" : "bg-line dark:bg-line-dark",
            )}
          />
        ))}
      </div>
    </div>
    {/* Larger screens: labelled steps */}
    <ol className="hidden items-center gap-3 sm:flex" aria-label="Progress">
      {JOIN_STEPS.map((label, i) => {
        const n = i + 1;
        const done = n < step;
        const now = n === step;
        return (
          <React.Fragment key={label}>
            <li className="flex shrink-0 items-center gap-2" aria-current={now ? "step" : undefined}>
              <span
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full text-[13px] font-bold",
                  done && "bg-teal-600 text-white dark:bg-teal-400 dark:text-blue-950",
                  now && "bg-blue-900 text-white dark:bg-white dark:text-blue-900",
                  !done && !now && "border-[1.5px] border-line-strong bg-white text-slate-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-400",
                )}
              >
                {done ? <Check className="h-4 w-4" aria-hidden /> : n}
              </span>
              <span
                className={cn(
                  "text-sm leading-5",
                  now ? "font-bold text-blue-900 dark:text-white" : done ? "font-semibold text-blue-900 dark:text-white" : "font-semibold text-slate-500 dark:text-slate-400",
                )}
              >
                <span className="sr-only">{done ? "Done: " : now ? "Current step: " : "Next: "}</span>
                {label}
              </span>
            </li>
            {i < 2 ? (
              <li aria-hidden className={cn("h-0.5 min-w-6 flex-1 rounded-full", done ? "bg-teal-600 dark:bg-teal-400" : "bg-line dark:bg-line-dark")} />
            ) : null}
          </React.Fragment>
        );
      })}
    </ol>
  </div>
);

// ---------------------------------------------------------------------------
// Headings
// ---------------------------------------------------------------------------

export const JoinTitle: React.FC<{ title: string; children?: React.ReactNode; className?: string; center?: boolean }> = ({
  title,
  children,
  className,
  center,
}) => (
  <div className={cn("space-y-2 sm:space-y-2.5", center && "text-center", className)}>
    <h1 className="font-display text-[30px] font-bold leading-9 tracking-[-0.02em] text-blue-900 dark:text-white sm:text-[40px] sm:leading-[46px]">
      {title}
    </h1>
    {children ? <p className="text-base leading-[26px] text-slate-600 dark:text-slate-300 sm:text-lg sm:leading-7">{children}</p> : null}
  </div>
);

export const FormCard: React.FC<{ children: React.ReactNode; className?: string; title?: string; description?: string; titleId?: string }> = ({
  children,
  className,
  title,
  description,
  titleId,
}) => (
  <Card as="section" aria-labelledby={title ? titleId : undefined} className={cn("p-5 sm:p-8", className)}>
    {title ? (
      <div className="mb-4 space-y-1 sm:mb-5">
        <h2 id={titleId} className="font-display text-lg font-semibold leading-6 text-blue-900 dark:text-white sm:text-[22px] sm:leading-7">
          {title}
        </h2>
        {description ? <p className="text-sm font-medium leading-[22px] text-slate-500 dark:text-slate-400">{description}</p> : null}
      </div>
    ) : null}
    {children}
  </Card>
);

// ---------------------------------------------------------------------------
// Text field
// ---------------------------------------------------------------------------

export const inputCls = (invalid?: boolean) =>
  cn(
    "h-[50px] w-full rounded-xl border-[1.5px] bg-white px-4 text-base text-blue-900 placeholder:text-slate-400 transition-shadow",
    "focus:border-blue-900 focus:outline-none focus:ring-4 focus:ring-blue-900/10 disabled:opacity-60",
    "dark:bg-slate-900 dark:text-white dark:focus:border-slate-300 dark:focus:ring-white/10",
    invalid ? "border-red-600 dark:border-red-400" : "border-line-strong dark:border-slate-600",
  );

export const TextField: React.FC<
  {
    label: string;
    helper?: React.ReactNode;
    error?: string;
    trailing?: React.ReactNode;
    labelAside?: React.ReactNode;
  } & React.InputHTMLAttributes<HTMLInputElement>
> = ({ label, helper, error, trailing, labelAside, id, className, ...input }) => {
  const auto = useId();
  const fieldId = id || auto;
  const helpId = `${fieldId}-help`;
  return (
    <div className={className}>
      <div className="mb-2 flex items-center justify-between gap-3">
        <label htmlFor={fieldId} className="text-sm font-bold text-blue-900 dark:text-white">
          {label}
        </label>
        {labelAside}
      </div>
      <div className="relative">
        <input
          id={fieldId}
          aria-invalid={!!error || undefined}
          aria-describedby={error || helper ? helpId : undefined}
          className={cn(inputCls(!!error), trailing ? "pr-12" : "")}
          {...input}
        />
        {trailing ? <div className="absolute inset-y-0 right-1.5 flex items-center">{trailing}</div> : null}
      </div>
      {error ? (
        <p id={helpId} className="mt-1.5 flex items-start gap-1.5 text-sm font-semibold text-red-700 dark:text-red-300">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          {error}
        </p>
      ) : helper ? (
        <p id={helpId} className="mt-1.5 text-sm font-medium text-slate-500 dark:text-slate-400">
          {helper}
        </p>
      ) : null}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Choice chips (single choice)
// ---------------------------------------------------------------------------

export const ChoiceChips: React.FC<{
  label: string;
  options: Array<{ value: string; label: string }>;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}> = ({ label, options, value, onChange, error }) => {
  const id = useId();
  return (
    <fieldset aria-describedby={error ? `${id}-err` : undefined}>
      <legend className="mb-2.5 text-sm font-bold text-blue-900 dark:text-white">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => {
          const on = o.value === value;
          return (
            <label
              key={o.value}
              className={cn(
                "cursor-pointer rounded-xl px-4 py-3 text-[15px] leading-5 transition-colors has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-blue-900/15",
                on
                  ? "border-2 border-teal-600 bg-teal-50 font-bold text-teal-700 dark:border-teal-400 dark:bg-teal-950 dark:text-teal-200"
                  : "border-[1.5px] border-line-strong bg-white font-semibold text-blue-900 hover:border-blue-900 dark:border-slate-600 dark:bg-slate-900 dark:text-white",
              )}
            >
              <input type="radio" name={id} value={o.value} checked={on} onChange={() => onChange(o.value)} className="sr-only" />
              {o.label}
            </label>
          );
        })}
      </div>
      {error ? (
        <p id={`${id}-err`} className="mt-1.5 flex items-start gap-1.5 text-sm font-semibold text-red-700 dark:text-red-300">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          {error}
        </p>
      ) : null}
    </fieldset>
  );
};

// ---------------------------------------------------------------------------
// Course options
// ---------------------------------------------------------------------------

export const CourseOptions: React.FC<{
  options: JoinCourse[];
  value: string;
  onChange: (id: string) => void;
  label: string;
}> = ({ options, value, onChange, label }) => {
  const name = useId();
  return (
    <fieldset>
      <legend className="sr-only">{label}</legend>
      <div className="space-y-2.5 sm:space-y-3">
        {options.map((o) => {
          const on = o.id === value;
          const meta = [plural(o.weeks, "week"), o.cadence, o.level].filter(Boolean).join(" · ");
          return (
            <label
              key={o.id}
              className={cn(
                "flex cursor-pointer items-center gap-3.5 rounded-2xl px-4 py-4 transition-colors has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-blue-900/15 sm:px-[18px]",
                on
                  ? "border-2 border-teal-600 bg-teal-50 dark:border-teal-400 dark:bg-teal-950/60"
                  : "border border-line bg-white hover:border-line-strong dark:border-line-dark dark:bg-slate-900",
              )}
            >
              <input type="radio" name={name} value={o.id} checked={on} onChange={() => onChange(o.id)} className="sr-only" />
              <span
                aria-hidden
                className={cn(
                  "h-5 w-5 shrink-0 rounded-full bg-white dark:bg-slate-900",
                  on ? "border-[6px] border-teal-600 dark:border-teal-400" : "border-[1.5px] border-line-strong dark:border-slate-500",
                )}
              />
              <span className="min-w-0 flex-1">
                <span className="block text-base font-bold leading-[22px] text-blue-900 dark:text-white">{o.title}</span>
                <span className="mt-0.5 block text-sm font-medium leading-[22px] text-slate-500 dark:text-slate-400">
                  {meta}
                  <span className="sm:hidden"> · {naira(o.rate)} a week</span>
                </span>
              </span>
              <span className="hidden shrink-0 text-right sm:block">
                <span className="font-display text-[17px] font-semibold text-blue-900 dark:text-white">{naira(o.rate)}</span>
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400"> / week</span>
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
};

// ---------------------------------------------------------------------------
// Weeks picker
// ---------------------------------------------------------------------------

export const WeeksPicker: React.FC<{
  value: number;
  max: number;
  onChange: (weeks: number) => void;
  /** First week number these weeks start from (top-ups start after the paid ones). */
  startWeek?: number;
  totalWeeks?: number;
  quickPicks?: number[];
}> = ({ value, max, onChange, startWeek = 1, totalWeeks, quickPicks }) => {
  const set = (n: number) => onChange(Math.max(1, Math.min(max, n)));
  const end = startWeek + value - 1;
  const total = totalWeeks || max;
  const picks = (quickPicks || [1, 4, max]).filter((n, i, arr) => n >= 1 && n <= max && arr.indexOf(n) === i);
  const btn =
    "flex h-14 w-14 shrink-0 items-center justify-center rounded-[14px] border-[1.5px] border-line-strong bg-white text-blue-900 transition-colors hover:border-blue-900 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-600 dark:bg-slate-900 dark:text-white";
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <button type="button" className={btn} onClick={() => set(value - 1)} disabled={value <= 1} aria-label="One week fewer">
          <Minus className="h-[22px] w-[22px]" aria-hidden />
        </button>
        <div className="flex h-14 min-w-0 flex-1 flex-col items-center justify-center rounded-[14px] bg-paper dark:bg-paper-dark" aria-live="polite">
          <span className="font-display text-xl font-bold leading-[26px] text-blue-900 dark:text-white">{plural(value, "week")}</span>
          <span className="text-xs font-semibold leading-4 text-slate-500 dark:text-slate-400">
            {value === 1 ? `Week ${startWeek}` : `Weeks ${startWeek} to ${end}`} of {total}
          </span>
        </div>
        <button type="button" className={btn} onClick={() => set(value + 1)} disabled={value >= max} aria-label="One more week">
          <Plus className="h-[22px] w-[22px]" aria-hidden />
        </button>
      </div>
      {picks.length > 1 ? (
        <div className="flex flex-wrap gap-2" role="group" aria-label="Quick picks">
          {picks.map((n) => {
            const on = n === value;
            const label = n === max ? (startWeek > 1 ? `All ${n} remaining` : `Full course · ${plural(n, "week")}`) : plural(n, "week");
            return (
              <button
                key={n}
                type="button"
                aria-pressed={on}
                onClick={() => set(n)}
                className={cn(
                  "rounded-xl px-4 py-2 text-[15px] leading-5 transition-colors",
                  on
                    ? "border-2 border-teal-600 bg-teal-50 font-bold text-teal-700 dark:border-teal-400 dark:bg-teal-950 dark:text-teal-200"
                    : "border-[1.5px] border-line-strong bg-white font-semibold text-blue-900 hover:border-blue-900 dark:border-slate-600 dark:bg-slate-900 dark:text-white",
                )}
              >
                {label}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Order summary
// ---------------------------------------------------------------------------

export const OrderSummary: React.FC<{
  courseTitle: string;
  cohortLine?: string;
  weeks: number;
  rate: number;
  loading?: boolean;
  className?: string;
  eyebrow?: string;
}> = ({ courseTitle, cohortLine, weeks, rate, loading, className, eyebrow = "Your order" }) => {
  const titleId = useId();
  return (
  <Card as="section" aria-labelledby={titleId} className={cn("p-5 sm:p-6", className)}>
    <p className="text-xs font-extrabold uppercase tracking-[0.1em] text-slate-500 dark:text-slate-400">{eyebrow}</p>
    <h2 id={titleId} className="mt-3 font-display text-lg font-semibold leading-6 text-blue-900 dark:text-white">
      {courseTitle || (loading ? "Loading…" : "Choose a course")}
    </h2>
    {cohortLine ? <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">{cohortLine}</p> : null}
    <dl className="mt-4 space-y-3 border-t border-line pt-4 text-sm dark:border-line-dark">
      <div className="flex items-center justify-between gap-3">
        <dt className="font-medium text-slate-600 dark:text-slate-300">
          {plural(weeks, "week")} × {naira(rate)}
        </dt>
        <dd className="font-semibold text-blue-900 dark:text-white">{naira(weeks * rate)}</dd>
      </div>
      <div className="flex items-center justify-between gap-3">
        <dt className="font-medium text-slate-600 dark:text-slate-300">Paystack fee</dt>
        <dd className="font-medium text-slate-500 dark:text-slate-400">Shown at checkout</dd>
      </div>
    </dl>
    <div className="mt-4 flex items-center justify-between gap-3 border-t border-line pt-4 dark:border-line-dark">
      <span className="text-[15px] font-bold text-blue-900 dark:text-white">Due today</span>
      <span className="font-display text-2xl font-bold text-blue-900 dark:text-white">{naira(weeks * rate)}</span>
    </div>
    <p className="mt-4 flex items-start gap-2 text-sm font-medium text-slate-600 dark:text-slate-300">
      <ShieldCheck className="mt-0.5 h-[18px] w-[18px] shrink-0 text-teal-700 dark:text-teal-300" aria-hidden />
      Card, bank transfer or USSD, secured by Paystack.
    </p>
  </Card>
  );
};

// ---------------------------------------------------------------------------
// Course summary (aside on desktop, compact chip on phones)
// ---------------------------------------------------------------------------

const coverStyle = (url: string): React.CSSProperties =>
  url
    ? { backgroundImage: `linear-gradient(rgba(13,68,73,.35), rgba(13,68,73,.35)), url(${url})`, backgroundSize: "cover", backgroundPosition: "center" }
    : { backgroundImage: "linear-gradient(135deg, #0D4449 0%, #12808A 55%, #3FBCBE 100%)" };

export const CourseSummary: React.FC<{
  course: JoinCourse | null;
  loading?: boolean;
  nextCohort?: string | null;
  onChange?: () => void;
  changeLabel?: string;
}> = ({ course, loading, nextCohort, onChange, changeLabel = "Change course" }) => (
  <Card as="aside" aria-label="The course you're joining" className="overflow-hidden rounded-3xl">
    <div className="relative h-[150px]" style={coverStyle(course?.imageUrl || "")}>
      {course?.level ? (
        <span className="absolute left-5 top-5 rounded-full bg-white px-2.5 py-1 text-xs font-bold text-blue-900">{course.level}</span>
      ) : null}
    </div>
    <div className="space-y-3 px-6 pb-6 pt-5">
      <p className="text-xs font-extrabold uppercase tracking-[0.1em] text-teal-700 dark:text-teal-300">You're joining</p>
      {loading && !course ? (
        <div className="space-y-2">
          <div className="h-7 w-3/4 animate-pulse rounded bg-paper dark:bg-slate-800" />
          <div className="h-5 w-1/2 animate-pulse rounded bg-paper dark:bg-slate-800" />
        </div>
      ) : course ? (
        <>
          <h2 className="font-display text-[22px] font-semibold leading-7 text-blue-900 dark:text-white">{course.title}</h2>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            <span className="font-display text-lg font-semibold text-blue-900 dark:text-white">{naira(course.rate)}</span> / week ·{" "}
            {[plural(course.weeks, "week"), course.cadence].filter(Boolean).join(" · ")}
          </p>
          {nextCohort ? (
            <p className="inline-flex items-center gap-2 rounded-[10px] bg-teal-50 px-3 py-2 text-[13px] font-bold text-teal-700 dark:bg-teal-950 dark:text-teal-200">
              <Calendar className="h-4 w-4" aria-hidden /> Next cohort starts {nextCohort}
            </p>
          ) : null}
          <ul className="space-y-2 pt-1">
            {["Live classes with Gideon", "A recording of every class", "Mentor chat in the app", "Pay week by week, add weeks any time"].map((t) => (
              <li key={t} className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300">
                <Check className="h-4 w-4 shrink-0 text-teal-700 dark:text-teal-300" aria-hidden />
                {t}
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className="text-sm font-medium text-slate-600 dark:text-slate-300">You'll choose your course on the next step.</p>
      )}
      {onChange && course ? (
        <button type="button" onClick={onChange} className="inline-flex items-center gap-1.5 pt-1 text-sm font-bold text-blue-900 hover:underline dark:text-white">
          {changeLabel} <ChevronRight className="h-4 w-4" aria-hidden />
        </button>
      ) : null}
    </div>
  </Card>
);

export const CourseChip: React.FC<{ course: JoinCourse | null; loading?: boolean; onChange?: () => void }> = ({ course, loading, onChange }) => {
  if (!course && !loading) return null;
  return (
    <Card className="flex items-center gap-3 rounded-2xl p-3">
      <span aria-hidden className="h-11 w-11 shrink-0 rounded-[10px]" style={coverStyle(course?.imageUrl || "")} />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-extrabold uppercase tracking-[0.1em] text-teal-700 dark:text-teal-300">You're joining</p>
        {course ? (
          <>
            <p className="text-sm font-bold leading-5 text-blue-900 dark:text-white">{course.title}</p>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {naira(course.rate)} / week · {plural(course.weeks, "week")}
            </p>
          </>
        ) : (
          <div className="mt-1 h-4 w-40 animate-pulse rounded bg-paper dark:bg-slate-800" />
        )}
      </div>
      {onChange && course ? (
        <button type="button" onClick={onChange} className="shrink-0 px-1 text-[13px] font-bold text-teal-700 hover:underline dark:text-teal-300">
          Change
        </button>
      ) : null}
    </Card>
  );
};

// ---------------------------------------------------------------------------
// Google button and divider
// ---------------------------------------------------------------------------

export const GoogleButton: React.FC<{ onClick: () => void; loading?: boolean; disabled?: boolean; label?: string }> = ({
  onClick,
  loading,
  disabled,
  label = "Continue with Google",
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled || loading}
    className="flex h-[50px] w-full items-center justify-center gap-2.5 rounded-xl border-[1.5px] border-line-strong bg-white text-[15px] font-bold text-blue-900 transition-colors hover:border-blue-900 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
  >
    {loading ? (
      <Spinner />
    ) : (
      <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden>
        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
      </svg>
    )}
    {label}
  </button>
);

export const OrDivider: React.FC<{ label?: string }> = ({ label = "or use your email" }) => (
  <div className="flex items-center gap-3" aria-hidden>
    <span className="h-px flex-1 bg-line dark:bg-line-dark" />
    <span className="text-[13px] font-semibold text-slate-500 dark:text-slate-400">{label}</span>
    <span className="h-px flex-1 bg-line dark:bg-line-dark" />
  </div>
);
