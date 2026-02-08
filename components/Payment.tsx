import React, { useState, useEffect } from 'react';
import { View } from '../App';
import { registrationStore } from '../services/registrationStore';

interface UserData {
  uid: string;
  email: string;
  path: string;
  weeksToCommit: number | string; // top-up weeks
  originalWeeks?: number; // optional, for top-up increment
  isTopUp?: boolean; // optional flag
}

interface PaymentProps {
  onNavigate: (view: View) => void;
  selectedPath: string;
  userData: UserData;
  onPaymentSuccess?: (newTotalWeeks: number) => void;
}

const Payment: React.FC<PaymentProps> = ({ onNavigate, selectedPath, userData, onPaymentSuccess }) => {
  const [paymentState, setPaymentState] = useState<'idle' | 'processing' | 'success' | 'failed'>('idle');
  const [reference, setReference] = useState('');

  const topUpWeeks = typeof userData.weeksToCommit === 'string' ? parseInt(userData.weeksToCommit) : userData.weeksToCommit;
  const originalWeeks = userData.originalWeeks ?? 0; // default 0 if not provided
  const weeklyRate = 10000;
  const totalPrice = topUpWeeks * weeklyRate;
  const newTotalWeeks = userData.isTopUp ? originalWeeks + topUpWeeks : topUpWeeks;

  useEffect(() => {
    // Unique pseudo-reference
    setReference(`CWG_${Date.now().toString(36).toUpperCase()}_${Math.floor(Math.random() * 1000)}`);
  }, []);

  const handlePayment = async () => {
    if (!userData?.uid || !userData?.email) {
      alert('Invalid user session. Please go back to registration.');
      return;
    }

    setPaymentState('processing');

    try {
      setTimeout(async () => {
        const isSuccessful = Math.random() > 0.1; // simulate 90% success

        if (isSuccessful) {
          // Record top-up or initial payment
          await registrationStore.recordTopUp({
            uid: userData.uid,
            weeksToCommit: topUpWeeks,
            totalWeeks: newTotalWeeks,
            totalPrice,
            reference,
            timestamp: new Date()
          });

          setPaymentState('success');
          if (onPaymentSuccess) onPaymentSuccess(newTotalWeeks);
        } else {
          setPaymentState('failed');
        }
      }, 3000);
    } catch (error) {
      console.error('Payment error:', error);
      setPaymentState('failed');
    }
  };

  // SUCCESS SCREEN
  if (paymentState === 'success') {
    return (
      <div className="py-24 bg-white dark:bg-slate-900 min-h-screen flex items-center justify-center">
        <div className="max-w-md w-full px-6 text-center">
          <div className="w-24 h-24 bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-4xl font-black text-blue-900 dark:text-white mb-4">Payment Verified</h1>
          <p className="text-slate-500 dark:text-slate-400 mb-2">
            Reference: <span className="font-mono text-xs">{reference}</span>
          </p>
          <p className="text-slate-600 dark:text-slate-400 mb-10 leading-relaxed">
            Your access has been extended by <span className="font-bold text-teal-600">{topUpWeeks} week{topUpWeeks > 1 ? 's' : ''}</span>.
            Total access: <span className="font-bold text-blue-900 dark:text-teal-400">{newTotalWeeks} week{newTotalWeeks > 1 ? 's' : ''}</span>.
          </p>
          <button 
            onClick={() => onNavigate('student-dashboard')}
            className="w-full bg-blue-900 dark:bg-teal-600 text-white font-black py-5 rounded-2xl shadow-xl transition-all"
          >
            Go to My Dashboard
          </button>
        </div>
      </div>
    );
  }

  // FAILED SCREEN
  if (paymentState === 'failed') {
    return (
      <div className="py-24 bg-white dark:bg-slate-900 min-h-screen flex items-center justify-center">
        <div className="max-w-md w-full px-6 text-center">
          <div className="w-24 h-24 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto mb-8">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-4xl font-black text-blue-900 dark:text-white mb-4">Payment Failed</h1>
          <p className="text-slate-600 dark:text-slate-400 mb-10 leading-relaxed">
            The transaction was declined by your bank or the payment gateway. No charge was made.
          </p>
          <div className="space-y-4">
            <button 
              onClick={() => setPaymentState('idle')}
              className="w-full bg-blue-900 dark:bg-teal-600 text-white font-black py-5 rounded-2xl shadow-xl transition-all"
            >
              Try Again
            </button>
            <button 
              onClick={() => onNavigate('home')}
              className="w-full py-4 text-slate-400 font-bold hover:text-blue-900"
            >
              Cancel Payment
            </button>
          </div>
        </div>
      </div>
    );
  }

  // IDLE (FORM) SCREEN
  return (
    <div className="py-24 bg-gray-50 dark:bg-slate-950 min-h-screen transition-colors">
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-black text-blue-900 dark:text-white mb-4">Secure Checkout</h1>
          <p className="text-slate-500">Processed by Paystack</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Payment Summary */}
          <div>
            <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] shadow-xl border border-gray-100 dark:border-slate-800">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-gray-50 dark:border-slate-800 pb-4 mb-6">
                Payment Summary
              </h3>
              <div className="space-y-6">
                <div className="flex justify-between items-start">
                  <div className="max-w-[70%]">
                    <p className="font-bold text-blue-900 dark:text-white leading-tight mb-1">{userData?.path || selectedPath}</p>
                    <p className="text-[10px] text-slate-400 uppercase tracking-tight">Access Rate: ₦{weeklyRate.toLocaleString()} / week</p>
                  </div>
                  <span className="font-bold text-blue-900 dark:text-teal-400">₦{weeklyRate.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center py-4 px-4 bg-gray-50 dark:bg-slate-800/50 rounded-xl">
                  <span className="text-sm font-bold text-slate-600 dark:text-slate-300">Duration</span>
                  <span className="text-sm font-black text-blue-900 dark:text-white">{topUpWeeks} Week{topUpWeeks > 1 ? 's' : ''}</span>
                </div>
                <div className="flex justify-between items-center pt-6 border-t-2 border-dashed border-gray-100 dark:border-slate-800">
                  <span className="text-lg font-black text-blue-900 dark:text-white">Total Charge</span>
                  <span className="text-2xl font-black text-teal-600">₦{totalPrice.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Action */}
          <div>
            <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] shadow-xl border border-gray-100 dark:border-slate-800 flex flex-col items-center text-center">
              <div className="mb-8 p-4 bg-teal-50 dark:bg-teal-900/10 rounded-2xl w-full">
                <p className="text-[10px] font-black text-teal-600 uppercase tracking-widest mb-1">Authenticated Email</p>
                <p className="font-bold text-blue-900 dark:text-white">{userData?.email || 'Student Session'}</p>
              </div>

              <div className="w-full space-y-4 mb-8">
                <div className="flex items-center justify-center gap-2 text-slate-400 text-xs mb-4">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                  256-bit Secure Encryption
                </div>
                <img src="https://static.paystack.com/assets/img/logo/brand/paystack-logo.png" className="h-8 mx-auto opacity-50 grayscale hover:grayscale-0 transition-all" alt="Paystack" />
              </div>

              <button 
                disabled={paymentState === 'processing'}
                onClick={handlePayment}
                className="w-full bg-blue-900 dark:bg-teal-600 hover:bg-blue-800 dark:hover:bg-teal-500 text-white font-black py-5 rounded-2xl shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-3 text-lg"
              >
                {paymentState === 'processing' ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Opening Secure Gateway...
                  </>
                ) : `Pay ₦${totalPrice.toLocaleString()}`}
              </button>
              
              <p className="mt-6 text-[10px] text-slate-400 leading-relaxed">
                You will be redirected to Paystack to complete your payment securely via Card, USSD, or Bank Transfer.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Payment;