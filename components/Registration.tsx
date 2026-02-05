import React, { useState } from 'react';
import { View } from '../App';

interface RegistrationProps {
  onNavigate: (view: View) => void;
  selectedPath: string;
  onComplete: (data: any) => void;
}

const Registration: React.FC<RegistrationProps> = ({ onNavigate, selectedPath, onComplete }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    path: selectedPath || 'Flutter & Mobile App Development',
    ageRange: '',
    gender: '',
    weeksToCommit: '4'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onComplete(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="py-24 bg-gray-50 dark:bg-slate-950 min-h-screen transition-colors">
      <div className="max-w-2xl mx-auto px-6">
        <div className="text-center mb-12">
          <div className="inline-flex items-center space-x-2 text-teal-600 dark:text-teal-400 font-bold text-sm uppercase tracking-widest mb-4">
            <span>Step 1 of 2</span>
            <div className="w-12 h-1 bg-teal-600 rounded-full"></div>
            <div className="w-12 h-1 bg-gray-200 dark:bg-slate-800 rounded-full"></div>
          </div>
          <h1 className="text-4xl font-black text-blue-900 dark:text-white mb-4">Secure Your Seat</h1>
          <p className="text-slate-600 dark:text-slate-400">Join the next cohort of high-performance developers.</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-8 md:p-12 rounded-[2.5rem] shadow-2xl border border-gray-100 dark:border-slate-800">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Full Name</label>
              <input 
                required
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                type="text" 
                className="w-full px-5 py-4 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all text-blue-900 dark:text-white font-medium"
                placeholder="Gideon Okanlawon"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Email Address</label>
                <input 
                  required
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  type="email" 
                  className="w-full px-5 py-4 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all text-blue-900 dark:text-white font-medium"
                  placeholder="name@example.com"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Phone Number</label>
                <input 
                  required
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  type="tel" 
                  className="w-full px-5 py-4 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all text-blue-900 dark:text-white font-medium"
                  placeholder="+234..."
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Age Range</label>
                <select 
                  required
                  name="ageRange"
                  value={formData.ageRange}
                  onChange={handleChange}
                  className="w-full px-5 py-4 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all text-blue-900 dark:text-white font-bold appearance-none cursor-pointer"
                >
                  <option value="">Select Age</option>
                  <option value="13-17">13 - 17</option>
                  <option value="18-24">18 - 24</option>
                  <option value="25-34">25 - 34</option>
                  <option value="35-44">35 - 44</option>
                  <option value="45+">45+</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Gender</label>
                <select 
                  required
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full px-5 py-4 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all text-blue-900 dark:text-white font-bold appearance-none cursor-pointer"
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Number of Weeks to Commit</label>
              <input 
                required
                name="weeksToCommit"
                value={formData.weeksToCommit}
                onChange={handleChange}
                type="number"
                min="1"
                max="52"
                className="w-full px-5 py-4 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all text-blue-900 dark:text-white font-medium"
                placeholder="e.g. 12"
              />
              <p className="mt-2 text-[10px] text-slate-400">Enter how many weeks you plan to actively participate in this path.</p>
            </div>

            <div>
              <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Selected Learning Path</label>
              <select 
                name="path"
                value={formData.path}
                onChange={handleChange}
                className="w-full px-5 py-4 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all text-blue-900 dark:text-white font-bold appearance-none cursor-pointer"
              >
                <option value="Flutter & Mobile App Development">Flutter & Mobile App Development (12 Weeks)</option>
                <option value="Web Development & WordPress">Web Development & WordPress (6 Weeks)</option>
                <option value="AI-Assisted Development">AI-Assisted Development (4–6 Weeks)</option>
              </select>
            </div>

            <div className="pt-4">
              <button 
                type="submit"
                className="w-full bg-teal-600 hover:bg-teal-500 text-white font-black py-5 rounded-2xl shadow-xl transition-all transform active:scale-95 text-lg"
              >
                Continue to Payment
              </button>
            </div>
            
            <p className="text-center text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest px-4">
              By continuing, you agree to our Terms of Service and Privacy Policy. 
              Classes happen 3× per week inside our mobile app.
            </p>
          </form>
        </div>
        
        <button 
          onClick={() => onNavigate('home')}
          className="w-full mt-8 text-slate-400 hover:text-blue-900 dark:hover:text-teal-400 transition-colors font-bold text-sm"
        >
          Cancel and return home
        </button>
      </div>
    </div>
  );
};

export default Registration;