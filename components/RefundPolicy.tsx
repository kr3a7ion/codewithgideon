import React from 'react';
import { useSiteConfig } from '../hooks/useSiteConfig';

const RefundPolicy: React.FC = () => {
  const { config } = useSiteConfig();

  return (
    <div className="py-24 max-w-4xl mx-auto px-6 prose dark:prose-invert prose-slate prose-blue prose-lg bg-white dark:bg-slate-900 transition-colors">
      <div className="text-center not-prose mb-16">
        <h1 className="text-4xl md:text-5xl font-bold text-blue-900 dark:text-white mb-4">Refund Policy</h1>
        <p className="text-xl text-slate-600 dark:text-slate-400">Fairness and transparency in our billing.</p>
      </div>

      <div className="bg-white dark:bg-slate-800 p-8 md:p-12 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-sm space-y-8">
        <section>
          <h2 className="text-2xl font-bold text-blue-900 dark:text-white mb-4">General Policy</h2>
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
            We believe in providing high-quality education. Our refund policy is designed to be fair to both our students and our mentors who prepare extensively for each live cohort.
          </p>
        </section>

        <section>
          <h3 className="text-xl font-bold text-blue-900 dark:text-teal-400 mb-3">Eligibility for Refunds</h3>
          <p className="text-slate-600 dark:text-slate-300 mb-4">Refunds may be considered if:</p>
          <ul className="list-disc pl-5 text-slate-600 dark:text-slate-400 space-y-2">
            <li>You request a refund before the first live class session of a paid week</li>
            <li>There is a verified technical issue that prevents you from accessing the service</li>
          </ul>
        </section>

        <section>
          <h3 className="text-xl font-bold text-red-600 dark:text-red-400 mb-3">Non-Refundable Situations</h3>
          <p className="text-slate-600 dark:text-slate-300 mb-4">Refunds are not provided if:</p>
          <ul className="list-disc pl-5 text-slate-600 dark:text-slate-400 space-y-2">
            <li>You have attended one or more live classes in the current billing week</li>
            <li>You have accessed the weekly curriculum or recorded archives</li>
            <li>You fail to attend scheduled sessions without prior notice</li>
          </ul>
        </section>

        <section className="bg-blue-50 dark:bg-blue-900/20 p-8 rounded-2xl border border-blue-100 dark:border-blue-800/50">
          <h3 className="text-xl font-bold text-blue-900 dark:text-blue-300 mb-4">How to Request a Refund</h3>
          <p className="text-slate-600 dark:text-slate-400 mb-4">Send a formal request to: <span className="break-all font-bold text-blue-900 dark:text-teal-400">{config.contactEmail}</span></p>
          <p className="font-bold text-blue-900 dark:text-blue-300 mb-2 text-sm uppercase tracking-wide">Please include:</p>
          <ul className="list-none space-y-2 text-sm font-medium text-slate-600 dark:text-slate-400">
            <li className="flex items-center"><span className="w-1.5 h-1.5 bg-blue-400 rounded-full mr-2"></span> Your registered email address</li>
            <li className="flex items-center"><span className="w-1.5 h-1.5 bg-blue-400 rounded-full mr-2"></span> Course path and current billing week</li>
            <li className="flex items-center"><span className="w-1.5 h-1.5 bg-blue-400 rounded-full mr-2"></span> Detailed reason for your request</li>
          </ul>
          <p className="mt-6 text-xs text-slate-500 dark:text-slate-500 italic">
            Approved refunds will be processed within 5–10 business days, depending on your local payment provider's processing time.
          </p>
        </section>
      </div>
    </div>
  );
};

export default RefundPolicy;
