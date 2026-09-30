import React from "react";
import { CalendarCheck, Code2, PenTool } from "lucide-react";
import { usePageMeta } from "../app/usePageMeta";
import { WORK } from "../marketing/content";
import { Eyebrow, HireCtaCard, Section, Tag, TwoDoorBand, WorkCard, container } from "../marketing/ui";

/** /work: the portfolio index. Proof for both doors. */
const WorkPage: React.FC = () => {
  usePageMeta({
    title: "Work",
    description:
      "Sample booking websites built end to end by Gideon: Ìtura Suites (shortlet) and Adire Hair Studio (salon). Try the live demos and read how each one works.",
    image: WORK[0].images.og,
  });

  return (
    <>
      <section className="bg-paper dark:bg-paper-dark" aria-labelledby="work-page-title">
        <div className={`${container} pb-9 pt-10 sm:pb-16 sm:pt-20`}>
          <Eyebrow>Work</Eyebrow>
          <h1
            id="work-page-title"
            className="mt-4 max-w-[760px] font-display text-[40px] font-bold leading-[44px] tracking-[-0.02em] text-blue-900 dark:text-white sm:text-[56px] sm:leading-[60px] lg:text-[64px] lg:leading-[68px] lg:tracking-[-0.025em]"
          >
            Work you can click through.
          </h1>
          <p className="mt-5 max-w-[640px] text-base leading-[26px] text-slate-600 dark:text-slate-300 sm:text-lg sm:leading-7">
            Sample projects built end to end by Gideon. Each one has a live demo you can try and a case study on how it works.
          </p>
          <p className="mt-6 flex max-w-[660px] flex-col items-start gap-2.5 rounded-2xl border border-line bg-white px-4 py-3 text-sm font-medium leading-[22px] text-slate-600 dark:border-line-dark dark:bg-slate-900 dark:text-slate-300 sm:flex-row sm:items-center">
            <Tag tone="sample">Sample project</Tag>
            Ìtura and Adire are demo businesses. Real client work goes here when clients agree to share it.
          </p>
        </div>
      </section>

      <Section tone="page" className="!pt-9 sm:!pt-16 lg:!pt-[72px]">
        <h2 className="sr-only">Projects</h2>
        <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
          {WORK.map((w) => (
            <WorkCard key={w.slug} work={w} location="work" />
          ))}
          <HireCtaCard location="work" />
        </div>

        <ul className="mt-10 grid gap-3 sm:gap-6 md:grid-cols-3">
          {[
            { icon: PenTool, title: "Designed in Figma first", body: "You see and comment on the design before any code is written." },
            { icon: Code2, title: "React, TypeScript, Tailwind", body: "Modern, fast on phones and easy to hand over." },
            { icon: CalendarCheck, title: "Built to take bookings", body: "Live availability, deposits and a WhatsApp confirmation." },
          ].map(({ icon: Icon, title, body }) => (
            <li key={title} className="flex gap-3.5 rounded-2xl bg-paper p-5 dark:bg-paper-dark">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white dark:bg-slate-900">
                <Icon className="h-5 w-5 text-blue-900 dark:text-white" aria-hidden />
              </span>
              <span>
                <span className="block font-display text-lg font-semibold text-blue-900 dark:text-white">{title}</span>
                <span className="mt-0.5 block text-sm font-medium leading-[22px] text-slate-600 dark:text-slate-300">{body}</span>
              </span>
            </li>
          ))}
        </ul>
      </Section>

      <Section tone="paper" className="!py-10 sm:!py-16 lg:!py-20">
        <TwoDoorBand location="band" />
      </Section>
    </>
  );
};

export default WorkPage;
