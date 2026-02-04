import React from 'react';

const Contact: React.FC = () => {
  return (
    <div className="py-24 max-w-4xl mx-auto px-6 bg-white dark:bg-slate-900 transition-colors">
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-bold text-blue-900 dark:text-white mb-4">Contact Us</h1>
        <p className="text-xl text-slate-600 dark:text-slate-400">We’d love to hear from you.</p>
      </div>

      <div className="bg-gray-50 dark:bg-slate-800 p-8 md:p-12 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div>
            <h2 className="text-2xl font-bold text-blue-900 dark:text-white mb-6">Get in Touch</h2>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-8">
              If you have questions about weekly billing, enrollment, or the CodeWithGideon app, feel free to reach out. We typically respond within 24 hours.
            </p>
            
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 text-blue-900 dark:text-blue-400 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Email</p>
                  <a href="mailto:support@codewithgideon.com" className="text-blue-900 dark:text-white font-bold hover:text-teal-600 dark:hover:text-teal-400 transition-colors">support@codewithgideon.com</a>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073z"/></svg>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Social</p>
                  <div className="space-y-1">
                    <p className="text-blue-900 dark:text-white font-bold">Instagram: @c0dewithgideon</p>
                    <p className="text-blue-900 dark:text-white font-bold">TikTok: @codewithgideon</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700">
            <h3 className="text-xl font-bold text-blue-900 dark:text-white mb-6">Quick Query</h3>
            <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
              <div>
                <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-2">Name</label>
                <input type="text" className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-900 dark:text-white" placeholder="Your Name" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-2">Email</label>
                <input type="email" className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-900 dark:text-white" placeholder="Your Email" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-2">Message</label>
                <textarea rows={4} className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-900 dark:text-white" placeholder="How can we help?"></textarea>
              </div>
              <button className="w-full bg-blue-900 dark:bg-teal-600 text-white font-bold py-4 rounded-lg hover:bg-blue-800 dark:hover:bg-teal-500 transition-colors shadow-md">Send Message</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;