import React from "react";
import { Compass } from "lucide-react";
import { usePageMeta } from "../app/usePageMeta";
import { ButtonLink } from "../ui";

const NotFound: React.FC = () => {
  usePageMeta({ title: "Page not found", noindex: true });
  return (
    <section className="px-6 py-24">
      <div className="mx-auto max-w-xl text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-3xl bg-teal-50 text-teal-600 dark:bg-teal-500/10 dark:text-teal-300">
          <Compass className="h-8 w-8" aria-hidden />
        </div>
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-orange-600 dark:text-orange-300">
          404
        </p>
        <h1 className="mt-3 text-4xl font-bold text-blue-900 dark:text-white">
          This page doesn't exist
        </h1>
        <p className="mt-4 text-base leading-7 text-slate-600 dark:text-slate-300">
          The link may be old or mistyped. Try one of these instead.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <ButtonLink to="/" size="lg">
            Go home
          </ButtonLink>
          <ButtonLink to="/courses" size="lg" variant="secondary">
            Browse courses
          </ButtonLink>
        </div>
      </div>
    </section>
  );
};

export default NotFound;
