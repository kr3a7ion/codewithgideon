import React, { useEffect, useMemo, useState } from "react";
import { View } from "../App";
import { registrationStore } from "../services/registrationStore";

interface RegistrationProps {
  onNavigate: (view: View) => void;
  selectedPath: string;
  onComplete: (data: any) => void;
}

type ActiveCohort = { id: string; label: string };

const Registration: React.FC<RegistrationProps> = ({
  onNavigate,
  selectedPath,
  onComplete,
}) => {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    phone: "",
    path: selectedPath || "Flutter & Mobile App Development",
    ageRange: "18-24",
    gender: "Male",
    weeksToCommit: "4",
  });

  const [cohort, setCohort] = useState<ActiveCohort | null>(null);
  const [cohortLoading, setCohortLoading] = useState(true);

  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");


  

  useEffect(() => {
    let mounted = true;

    const loadCohort = async () => {
      setCohortLoading(true);
      try {
        const active = await registrationStore.getActiveCohort();
        if (mounted) setCohort(active);
      } catch {
        if (mounted) setCohort({ id: "CWG-DEFAULT", label: "Current Cohort" });
      } finally {
        if (mounted) setCohortLoading(false);
      }
    };

    loadCohort();
    return () => {
      mounted = false;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const weeklyRate = 10000;
      const weeks = Math.max(1, parseInt(formData.weeksToCommit || "1", 10) || 1);

      // ✅ NEVER store password in Firestore
      const { password, ...rest } = formData;

      const data = {
        ...rest,
        weeksToCommit: weeks,
        totalPrice: weeks * weeklyRate,
        cohortId: cohort?.id,
        cohortLabel: cohort?.label,
      };

      const uid = await registrationStore.createAccount(data as any, password);

      onComplete({
        ...data,
        uid,
      });
    } catch (err: any) {
      setError(err?.message || "Registration failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const weeklyRate = 10000;

  const currentTotal = useMemo(() => {
    const weeks = Math.max(1, parseInt(formData.weeksToCommit || "1", 10) || 1);
    return weeks * weeklyRate;
  }, [formData.weeksToCommit]);

  return (
    <div className="py-24 bg-gray-50 dark:bg-slate-950 min-h-screen transition-colors">
      <div className="max-w-2xl mx-auto px-6">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-black text-blue-900 dark:text-white mb-4">
            Create Your Account
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Join the cohort and start your professional journey.
          </p>

          <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-full border border-blue-100 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 backdrop-blur">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Cohort
            </span>
            <span className="text-xs font-bold text-blue-900 dark:text-teal-400">
              {cohortLoading ? "Loading..." : cohort?.label || "Current Cohort"}
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-8 md:p-12 rounded-[2.5rem] shadow-2xl border border-gray-100 dark:border-slate-800">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-bold border border-red-100">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                Full Name
              </label>
              <input
                required
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                type="text"
                placeholder="John Doe"
                className="w-full px-5 py-4 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl text-blue-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none transition-all"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                  Email Address
                </label>
                <input
                  required
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  type="email"
                  placeholder="john@example.com"
                  className="w-full px-5 py-4 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl text-blue-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    required
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="w-full px-5 py-4 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl text-blue-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none transition-all pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-900 dark:hover:text-teal-400 transition-colors"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                  Phone Number
                </label>
                <input
                  required
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  type="tel"
                  placeholder="080 1234 5678"
                  className="w-full px-5 py-4 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl text-blue-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                  Select Path
                </label>
                <select
                  name="path"
                  value={formData.path}
                  onChange={handleChange}
                  className="w-full px-5 py-4 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl text-blue-900 dark:text-white font-bold outline-none"
                >
                  <option value="Flutter & Mobile App Development">
                    Flutter & Mobile App Dev
                  </option>
                  <option value="Web Development & WordPress">Web & WordPress</option>
                  <option value="AI-Assisted Development">AI-Assisted Dev</option>
                </select>
              </div>
            </div>

            <div className="p-6 bg-blue-50 dark:bg-blue-900/20 rounded-3xl border border-blue-100 dark:border-blue-800/50">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-grow">
                  <label className="block text-xs font-black text-blue-900 dark:text-teal-400 uppercase tracking-widest mb-2">
                    Initial Commitment
                  </label>
                  <select
                    name="weeksToCommit"
                    value={formData.weeksToCommit}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-blue-200 dark:border-slate-700 rounded-xl text-blue-900 dark:text-white font-black outline-none"
                  >
                    <option value="1">1 Week (₦10,000)</option>
                    <option value="2">2 Week (₦20,000)</option>
                    <option value="3">3 Week (₦30,000)</option>
                    <option value="4">4 Weeks (₦40,000)</option>
                    <option value="8">8 Weeks (₦80,000)</option>
                    <option value="12">Full Program - 12 Weeks (₦120,000)</option>
                  </select>
                </div>

                <div className="text-right flex-shrink-0">
                  <p className="text-[10px] font-black text-blue-900/50 dark:text-teal-400/50 uppercase tracking-widest">
                    Total to Pay
                  </p>
                  <p className="text-2xl font-black text-blue-900 dark:text-white">
                    ₦{currentTotal.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <button
              disabled={isSubmitting}
              type="submit"
              className="w-full bg-blue-900 dark:bg-teal-600 hover:bg-blue-800 dark:hover:bg-teal-500 text-white font-black py-5 rounded-2xl shadow-xl transition-all disabled:opacity-50 transform active:scale-95"
            >
              {isSubmitting ? "Processing Registration..." : "Secure Your Seat"}
            </button>

            <p className="text-center text-[10px] text-slate-400 dark:text-slate-500 px-6">
              By clicking "Secure Your Seat", you agree to our Terms of Service.
            </p>

            <button
              type="button"
              onClick={() => onNavigate("home")}
              className="w-full text-xs font-black uppercase tracking-widest text-slate-400 hover:text-blue-900 dark:hover:text-teal-400 transition"
            >
              Back to Home
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Registration;