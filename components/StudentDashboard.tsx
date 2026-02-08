import React, { useState } from 'react';
import { View } from '../App';
import { RegistrationEntry } from '../services/registrationStore';

interface StudentDashboardProps {
  profile: RegistrationEntry | null;
  onNavigate: (view: View, extraData?: any) => void; // updated to pass extraData
  onLogout: () => void;
}

const StudentDashboard: React.FC<StudentDashboardProps> = ({ profile, onNavigate, onLogout }) => {
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [topUpWeeks, setTopUpWeeks] = useState('4');

  if (!profile) return null;

  const weeklyRate = 10000;
  const totalProgramWeeks = profile.path.includes('Flutter')
    ? 12
    : profile.path.includes('Web')
    ? 8
    : 4;
  const progressPercent = Math.min((profile.weeksToCommit / totalProgramWeeks) * 100, 100);

  const handleTopUp = () => {
    // Navigate to Payment with top-up data
    onNavigate('payment', {
      selectedPath: profile.path,
      userData: {
        uid: profile.uid,
        email: profile.email,
        path: profile.path,
        weeksToCommit: topUpWeeks, // the new top-up weeks
        originalWeeks: profile.weeksToCommit, // current weeks
        isTopUp: true
      }
    });
    setIsTopUpOpen(false);
  };

  return (
    <div className="py-12 bg-gray-50 dark:bg-slate-950 min-h-screen transition-colors">
      <div className="max-w-5xl mx-auto px-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-center justify-between mb-12 gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-3xl bg-teal-500 text-white flex items-center justify-center font-black text-2xl shadow-lg border-4 border-white dark:border-slate-800">
              {profile.fullName.charAt(0)}
            </div>
            <div>
              <h1 className="text-2xl font-black text-blue-900 dark:text-white">Welcome, {profile.fullName.split(' ')[0]}!</h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm">{profile.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onLogout}
              className="px-6 py-2.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-red-50 hover:text-red-600 transition-all"
            >
              Logout
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Card: Course Progress */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white dark:bg-slate-900 p-10 rounded-[2.5rem] shadow-xl border border-gray-100 dark:border-slate-800 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8">
                <span
                  className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                    profile.status === 'Complete'
                      ? 'bg-teal-50 text-teal-600'
                      : 'bg-orange-50 text-orange-600'
                  }`}
                >
                  {profile.status === 'Complete' ? 'Subscription Active' : 'Payment Pending'}
                </span>
              </div>

              <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Current Enrollment</p>
              <h2 className="text-3xl font-black text-blue-900 dark:text-white mb-8">{profile.path}</h2>

              <div className="space-y-6">
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Weekly Access Paid</p>
                    <p className="text-2xl font-black text-blue-900 dark:text-teal-400">
                      {profile.weeksToCommit} / {totalProgramWeeks} Weeks
                    </p>
                  </div>
                  <p className="text-sm font-bold text-blue-900 dark:text-white">{Math.round(progressPercent)}%</p>
                </div>
                <div className="h-4 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-teal-500 rounded-full transition-all duration-1000"
                    style={{ width: `${progressPercent}%` }}
                  ></div>
                </div>
              </div>

              <div className="mt-12 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                  <h4 className="font-bold text-blue-900 dark:text-white">Ready for more?</h4>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Add more weeks to your subscription to stay in the live cohort.
                  </p>
                </div>
                <button
                  onClick={() => setIsTopUpOpen(true)}
                  className="px-8 py-4 bg-blue-900 dark:bg-teal-600 text-white font-black rounded-2xl shadow-xl hover:scale-105 transition-transform whitespace-nowrap"
                >
                  Pay for More Weeks
                </button>
              </div>
            </div>

            {/* Quick Links
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {['Live Classes', 'Recordings', 'Resources'].map((item) => (
                <div
                  key={item}
                  className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-md group hover:border-teal-400 transition-colors cursor-pointer text-center"
                >
                  <div className="w-10 h-10 bg-gray-50 dark:bg-slate-800 rounded-xl flex items-center justify-center mx-auto mb-4 text-blue-900 dark:text-teal-400 group-hover:bg-blue-900 dark:group-hover:bg-teal-600 group-hover:text-white transition-all">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                      />
                    </svg>
                  </div>
                  <span className="text-xs font-black uppercase tracking-widest text-blue-900 dark:text-white">{item}</span>
                </div>
              ))}
            </div> */}
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-xl border border-gray-100 dark:border-slate-800">
              <h3 className="text-sm font-black text-blue-900 dark:text-white mb-6 uppercase tracking-widest">Your Plan</h3>
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Joined</span>
                  <span className="font-bold text-blue-900 dark:text-slate-200">{new Date(profile.timestamp).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Phone</span>
                  <span className="font-bold text-blue-900 dark:text-slate-200">{profile.phone}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Cohort ID</span>
                  <span className="font-bold text-blue-900 dark:text-slate-200">#GDE-2024-MAR</span>
                </div>
              </div>
            </div>

            
          </div>
        </div>

        {/* Top-Up Modal */}
        {isTopUpOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 max-w-md w-full p-8 rounded-[2.5rem] shadow-2xl border border-gray-100 dark:border-slate-800">
              <h3 className="text-xl font-black text-blue-900 dark:text-white mb-4">Extend Your Access</h3>
              <p className="text-sm text-slate-500 mb-8">Select how many weeks you want to pay for today.</p>

              <div className="space-y-4 mb-8">
                <select
                  value={topUpWeeks}
                  onChange={(e) => setTopUpWeeks(e.target.value)}
                  className="w-full px-5 py-4 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl text-blue-900 dark:text-white font-bold outline-none"
                >
                  <option value="1">1 Week (₦10,000)</option>
                  <option value="2">2 Week (₦20,000)</option>
                  <option value="3">3 Weeks (₦30,000)</option>
                  <option value="4">4 Weeks (₦40,000)</option>
                </select>
                <div className="flex justify-between items-center px-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Due</span>
                  <span className="text-2xl font-black text-teal-600">
                    ₦{(parseInt(topUpWeeks) * weeklyRate).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setIsTopUpOpen(false)}
                  className="flex-1 py-4 bg-gray-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold rounded-2xl"
                >
                  Cancel
                </button>
                <button
                  onClick={handleTopUp}
                  className="flex-1 py-4 bg-blue-900 dark:bg-teal-600 text-white font-bold rounded-2xl shadow-lg"
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;