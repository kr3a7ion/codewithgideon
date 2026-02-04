import React from 'react';

const TermsOfService: React.FC = () => {
  return (
    <div className="py-24 max-w-4xl mx-auto px-6 prose dark:prose-invert prose-slate prose-blue prose-lg bg-white dark:bg-slate-900 transition-colors">
      <div className="text-center not-prose mb-16">
        <h1 className="text-4xl md:text-5xl font-bold text-blue-900 dark:text-white mb-4">Terms of Service</h1>
        <p className="text-xl text-slate-600 dark:text-slate-400">Our agreement for using the platform.</p>
      </div>

      <div className="bg-white dark:bg-slate-800 p-8 md:p-12 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-sm space-y-8">
        <section>
          <h2 className="text-2xl font-bold text-blue-900 dark:text-white mb-4">Agreement</h2>
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
            By using CodeWithGideon (website or app), you agree to the following terms. Please read them carefully.
          </p>
        </section>

        <section>
          <h3 className="text-xl font-bold text-blue-900 dark:text-teal-400 mb-3">1. Use of the Platform</h3>
          <ul className="list-disc pl-5 text-slate-600 dark:text-slate-400 space-y-2">
            <li>CodeWithGideon provides live and recorded coding education</li>
            <li>You must provide accurate information when registering</li>
            <li>Accounts are for personal use only and cannot be shared</li>
          </ul>
        </section>

        <section>
          <h3 className="text-xl font-bold text-blue-900 dark:text-teal-400 mb-3">2. Classes & Content</h3>
          <ul className="list-disc pl-5 text-slate-600 dark:text-slate-400 space-y-2">
            <li>Live classes are scheduled and may change when necessary</li>
            <li>Class recordings are provided for enrolled students only</li>
            <li>Sharing or redistributing proprietary content is strictly prohibited</li>
          </ul>
        </section>

        <section>
          <h3 className="text-xl font-bold text-blue-900 dark:text-teal-400 mb-3">3. Payments</h3>
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
            All payments must be completed before class access. We operate on a weekly "pay-as-you-go" basis. Prices and schedules are clearly stated before payment.
          </p>
        </section>

        <section>
          <h3 className="text-xl font-bold text-blue-900 dark:text-teal-400 mb-3">4. User Conduct</h3>
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed mb-4">You agree not to:</p>
          <ul className="list-disc pl-5 text-slate-600 dark:text-slate-400 space-y-2">
            <li>Disrupt live classes or recorded sessions</li>
            <li>Harass instructors or fellow students in community spaces</li>
            <li>Misuse the platform for unauthorized commercial purposes</li>
          </ul>
          <p className="mt-4 text-orange-600 dark:text-orange-400 font-semibold">Violation may result in immediate account suspension without refund.</p>
        </section>

        <section className="pt-8 border-t border-gray-100 dark:border-slate-700">
          <p className="text-sm text-slate-400 dark:text-slate-500">
            We may update features, pricing, or terms to improve the service. Major changes will be communicated via the app or registered email.
          </p>
        </section>
      </div>
    </div>
  );
};

export default TermsOfService;