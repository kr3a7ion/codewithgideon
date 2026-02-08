
import React, { useState } from 'react';
import { View } from '../App';

interface StudentLoginProps {
  onNavigate: (view: View) => void;
  onLogin: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
}

const StudentLogin: React.FC<StudentLoginProps> = ({ onNavigate, onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    
    const result = await onLogin(email, password);
    if (!result.success) {
      setError(result.error || 'Login failed. Please check your credentials.');
    }
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-gray-50 dark:bg-slate-950 px-6">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 p-10 rounded-[2.5rem] shadow-2xl border border-gray-100 dark:border-slate-800">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-blue-900 dark:text-white">Student Portal</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">Log in to track your path and payments.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Registered Email</label>
            <input 
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-5 py-4 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-blue-900 dark:text-white font-medium"
              placeholder="you@example.com"
            />
          </div>

          <div className="relative">
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Password</label>
            <div className="relative">
              <input 
                required
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-5 py-4 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-blue-900 dark:text-white font-medium pr-12"
                placeholder="••••••••"
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-900 dark:hover:text-teal-400 transition-colors"
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.882 9.882L5.122 5.122M17.657 17.657L21 21" /></svg>
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl">
               <p className="text-red-600 dark:text-red-400 text-xs font-bold text-center">{error}</p>
            </div>
          )}

          <button 
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-900 dark:bg-teal-600 hover:bg-blue-800 dark:hover:bg-teal-500 text-white font-black py-5 rounded-2xl shadow-xl transition-all disabled:opacity-50"
          >
            {isSubmitting ? 'Verifying...' : 'Access My Dashboard'}
          </button>
        </form>

        <div className="mt-8 text-center">
           <p className="text-xs text-slate-400 mb-4">Don't have an account yet?</p>
           <button 
            onClick={() => onNavigate('curriculums')}
            className="text-teal-600 dark:text-teal-400 text-sm font-bold hover:underline"
          >
            Choose a Path & Enroll
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudentLogin;
