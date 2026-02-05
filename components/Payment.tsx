
import React, { useState } from 'react';
import { View } from '../App';

interface PaymentProps {
  onNavigate: (view: View) => void;
  selectedPath: string;
  userData: any;
  onPaymentSuccess?: () => void;
}

const Payment: React.FC<PaymentProps> = ({ onNavigate, selectedPath, userData, onPaymentSuccess }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Default to 1 if something went wrong with the form data
  const weeksToCommit = parseInt(userData?.weeksToCommit || '1');
  const weeklyRate = 10000;
  const totalPrice = weeksToCommit * weeklyRate;

  const handlePayment = () => {
    setIsProcessing(true);
    // Simulate payment API call
    setTimeout(() => {
      setIsProcessing(false);
      setIsSuccess(true);
      if (onPaymentSuccess) onPaymentSuccess();
    }, 2500);
  };

  if (isSuccess) {
    return (
      <div className="py-24 bg-white dark:bg-slate-900 min-h-screen transition-colors flex items-center justify-center">
        <div className="max-w-md w-full px-6 text-center">
          <div className="w-24 h-24 bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
          </div>
          <h1 className="text-4xl font-black text-blue-900 dark:text-white mb-4">Payment Successful!</h1>
          <p className="text-slate-600 dark:text-slate-400 mb-10 leading-relaxed">
            Welcome to the cohort, <span className="font-bold text-blue-900 dark:text-teal-400">{userData?.fullName}</span>. 
            Check your email for instructions on how to access the mobile app and join your first live class.
          </p>
          <button 
            onClick={() => onNavigate('home')}
            className="w-full bg-blue-900 dark:bg-teal-600 text-white font-black py-5 rounded-2xl shadow-xl transition-all"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="py-24 bg-gray-50 dark:bg-slate-950 min-h-screen transition-colors">
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-12">
          <div className="inline-flex items-center space-x-2 text-teal-600 dark:text-teal-400 font-bold text-sm uppercase tracking-widest mb-4">
            <span className="opacity-40">Step 1</span>
            <div className="w-12 h-1 bg-teal-600 rounded-full"></div>
            <span>Step 2</span>
            <div className="w-12 h-1 bg-teal-600 rounded-full"></div>
          </div>
          <h1 className="text-4xl font-black text-blue-900 dark:text-white mb-4">Complete Enrollment</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="order-2 lg:order-1">
             <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] shadow-xl border border-gray-100 dark:border-slate-800">
                <h3 className="text-xl font-bold text-blue-900 dark:text-white mb-6 uppercase text-xs tracking-widest border-b border-gray-50 dark:border-slate-800 pb-4">Order Breakdown</h3>
                <div className="space-y-6">
                  <div className="flex justify-between items-start">
                    <div className="max-w-[70%]">
                      <p className="font-bold text-blue-900 dark:text-white leading-tight mb-1">{userData?.path || selectedPath}</p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-tight">Access Rate: ₦{weeklyRate.toLocaleString()} / week</p>
                    </div>
                    <span className="font-bold text-blue-900 dark:text-teal-400">₦{weeklyRate.toLocaleString()}</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-4 px-4 bg-gray-50 dark:bg-slate-800/50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-900 text-white rounded-lg flex items-center justify-center font-bold text-xs">
                        {weeksToCommit}
                      </div>
                      <span className="text-sm font-bold text-slate-600 dark:text-slate-300">Intended Weeks</span>
                    </div>
                    <span className="text-xs font-medium text-slate-400 italic">Pre-payment for selected duration</span>
                  </div>

                  <div className="flex justify-between items-center pt-6 border-t border-gray-50 dark:border-slate-800">
                    <span className="text-sm font-bold text-slate-500">Subtotal ({weeksToCommit} Weeks)</span>
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-200">₦{totalPrice.toLocaleString()}.00</span>
                  </div>
                  <div className="flex justify-between items-center pt-6 border-t-2 border-dashed border-gray-100 dark:border-slate-800">
                    <span className="text-lg font-black text-blue-900 dark:text-white">Total Due Now</span>
                    <span className="text-2xl font-black text-teal-600">₦{totalPrice.toLocaleString()}</span>
                  </div>
                </div>
             </div>
          </div>

          <div className="order-1 lg:order-2">
            <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] shadow-xl border border-gray-100 dark:border-slate-800 h-full flex flex-col">
              <h3 className="text-xl font-bold text-blue-900 dark:text-white mb-6 uppercase text-xs tracking-widest">Select Payment Method</h3>
              
              <div className="space-y-4 mb-10 flex-grow">
                 <div className="p-5 bg-teal-50 dark:bg-teal-900/10 border-2 border-teal-500 rounded-2xl flex items-center justify-between cursor-pointer">
                    <div className="flex items-center">
                      <div className="w-6 h-6 bg-teal-500 rounded-full flex items-center justify-center mr-4">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      </div>
                      <span className="font-bold text-blue-900 dark:text-white">Secure Card / Paystack</span>
                    </div>
                 </div>
              </div>

              <button 
                disabled={isProcessing}
                onClick={handlePayment}
                className="w-full bg-blue-900 dark:bg-teal-600 hover:bg-blue-800 dark:hover:bg-teal-500 text-white font-black py-5 rounded-2xl shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 text-lg"
              >
                {isProcessing ? 'Authorizing...' : `Pay ₦${totalPrice.toLocaleString()}`}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Payment;
