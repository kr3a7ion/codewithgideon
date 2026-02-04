import React from 'react';

const PrivacyPolicy: React.FC = () => {
  return (
    <div className="py-24 max-w-4xl mx-auto px-6 prose dark:prose-invert prose-slate prose-blue prose-lg bg-white dark:bg-slate-900 transition-colors">
      <div className="text-center not-prose mb-16">
        <h1 className="text-4xl md:text-5xl font-bold text-blue-900 dark:text-white mb-4">Privacy Policy</h1>
        <p className="text-xl text-slate-600 dark:text-slate-400">Your privacy matters to us.</p>
      </div>

      <div className="bg-white dark:bg-slate-800 p-8 md:p-12 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-sm space-y-8">
        <section>
          <h2 className="text-2xl font-bold text-blue-900 dark:text-white mb-4">Introduction</h2>
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
            CodeWithGideon is committed to protecting your personal information and using it responsibly. This policy explains what information we collect, how we use it, and your rights.
          </p>
        </section>

        <section>
          <h3 className="text-xl font-bold text-blue-900 dark:text-teal-400 mb-3">Information We Collect</h3>
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed mb-4">We may collect:</p>
          <ul className="list-disc pl-5 text-slate-600 dark:text-slate-400 space-y-2">
            <li>Name and email address during registration</li>
            <li>Payment-related information (processed securely by third-party providers)</li>
            <li>App usage data to improve learning experience</li>
          </ul>
        </section>

        <section>
          <h3 className="text-xl font-bold text-blue-900 dark:text-teal-400 mb-3">How We Use Your Information</h3>
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed mb-4">We use your information to:</p>
          <ul className="list-disc pl-5 text-slate-600 dark:text-slate-400 space-y-2">
            <li>Create and manage your account</li>
            <li>Process weekly billing and enroll you in classes</li>
            <li>Communicate important updates</li>
            <li>Improve our app and services</li>
          </ul>
        </section>

        <section>
          <h3 className="text-xl font-bold text-blue-900 dark:text-teal-400 mb-3">Data Protection</h3>
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed mb-4">We prioritize security:</p>
          <ul className="list-disc pl-5 text-slate-600 dark:text-slate-400 space-y-2">
            <li>We do not sell your personal data</li>
            <li>Payments are handled by trusted third-party payment processors</li>
            <li>We take reasonable steps to secure your information</li>
          </ul>
        </section>

        <section className="pt-8 border-t border-gray-100 dark:border-slate-700">
          <p className="text-sm text-slate-400 dark:text-slate-500 italic">
            This policy may be updated occasionally. Continued use of our services means you accept the updated policy. Last updated: February 2024.
          </p>
        </section>
      </div>
    </div>
  );
};

export default PrivacyPolicy;