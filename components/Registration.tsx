
import React, { useState } from 'react';
import { View } from '../App';
import { registrationStore } from '../services/registrationStore';

interface RegistrationProps {
  onNavigate: (view: View) => void;
  selectedPath: string;
  onComplete: (data: any) => void;
}

const Registration: React.FC<RegistrationProps> = ({ onNavigate, selectedPath, onComplete }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    phone: '',
    path: selectedPath || 'Flutter & Mobile App Development',
    ageRange: '18-24',
    gender: 'Male',
    weeksToCommit: '4' // Default to 4 weeks
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const weeklyRate = 10000;
      const weeks = parseInt(formData.weeksToCommit);
      const data = {
        ...formData,
        weeksToCommit: weeks,
        totalPrice: weeks * weeklyRate
      };
      
      // Create Firebase Auth + Firestore Doc
      const uid = await registrationStore.createAccount(data, formData.password);
      onComplete({ ...data, uid: uid }); 
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const weeklyRate = 10000;
  const currentTotal = parseInt(formData.weeksToCommit) * weeklyRate;

  return (
    <div className="py-24 bg-gray-50 dark:bg-slate-950 min-h-screen transition-colors">
      <div className="max-w-2xl mx-auto px-6">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-black text-blue-900 dark:text-white mb-4">Create Your Account</h1>
          <p className="text-slate-600 dark:text-slate-400">Join the cohort and start your professional journey.</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-8 md:p-12 rounded-[2.5rem] shadow-2xl border border-gray-100 dark:border-slate-800">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-bold border border-red-100">{error}</div>}
            
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Full Name</label>
              <input required name="fullName" value={formData.fullName} onChange={handleChange} type="text" placeholder="John Doe" className="w-full px-5 py-4 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl text-blue-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none transition-all" />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Email Address</label>
                <input required name="email" value={formData.email} onChange={handleChange} type="email" placeholder="john@example.com" className="w-full px-5 py-4 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl text-blue-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none transition-all" />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Password</label>
                <input required name="password" value={formData.password} onChange={handleChange} type="password" placeholder="••••••••" className="w-full px-5 py-4 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl text-blue-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none transition-all" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Phone Number</label>
                <input required name="phone" value={formData.phone} onChange={handleChange} type="tel" placeholder="080 1234 5678" className="w-full px-5 py-4 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl text-blue-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none transition-all" />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Select Path</label>
                <select name="path" value={formData.path} onChange={handleChange} className="w-full px-5 py-4 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl text-blue-900 dark:text-white font-bold outline-none">
                  <option value="Flutter & Mobile App Development">Flutter & Mobile App Dev</option>
                  <option value="Web Development & WordPress">Web & WordPress</option>
                  <option value="AI-Assisted Development">AI-Assisted Dev</option>
                </select>
              </div>
            </div>

            <div className="p-6 bg-blue-50 dark:bg-blue-900/20 rounded-3xl border border-blue-100 dark:border-blue-800/50">
               <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-grow">
                    <label className="block text-xs font-black text-blue-900 dark:text-teal-400 uppercase tracking-widest mb-2">Initial Commitment</label>
                    <select name="weeksToCommit" value={formData.weeksToCommit} onChange={handleChange} className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-blue-200 dark:border-slate-700 rounded-xl text-blue-900 dark:text-white font-black outline-none">
                      <option value="1">1 Week (₦10,000)</option>
                      <option value="2">2 Week (₦20,000)</option>
                      <option value="3">3 Week (₦30,000)</option>
                      <option value="4">4 Weeks (₦40,000)</option>
                      <option value="8">8 Weeks (₦80,000)</option>
                      <option value="12">Full Program - 12 Weeks (₦120,000)</option>
                    </select>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-[10px] font-black text-blue-900/50 dark:text-teal-400/50 uppercase tracking-widest">Total to Pay</p>
                    <p className="text-2xl font-black text-blue-900 dark:text-white">₦{currentTotal.toLocaleString()}</p>
                  </div>
               </div>
            </div>

            <button disabled={isSubmitting} type="submit" className="w-full bg-blue-900 dark:bg-teal-600 hover:bg-blue-800 dark:hover:bg-teal-500 text-white font-black py-5 rounded-2xl shadow-xl transition-all disabled:opacity-50 transform active:scale-95">
              {isSubmitting ? 'Processing Registration...' : 'Secure Your Seat'}
            </button>
            
            <p className="text-center text-[10px] text-slate-400 dark:text-slate-500 px-6">
              By clicking "Secure Your Seat", you agree to our Terms of Service and understand that your data will be synced across our web and mobile platforms.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Registration;
