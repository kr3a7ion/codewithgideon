
import React, { useState, useEffect } from 'react';
import { View } from '../App';
import { registrationStore, RegistrationEntry } from '../services/registrationStore';

interface AdminDashboardProps {
  onNavigate: (view: View) => void;
  onLogout: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate, onLogout }) => {
  const [registrations, setRegistrations] = useState<RegistrationEntry[]>([]);
  const [filter, setFilter] = useState<'All' | 'Pending' | 'Complete'>('All');
  const [isSyncing, setIsSyncing] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState(() => localStorage.getItem('gs_webhook_url') || '');

  // Fix: Added async fetcher to handle Promise from registrationStore.getAll()
  const fetchRegistrations = async () => {
    const data = await registrationStore.getAll();
    setRegistrations(data);
  };

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const handleSaveWebhook = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('gs_webhook_url', webhookUrl);
    setShowConfig(false);
  };

  const handleSyncToSheets = async () => {
    if (!webhookUrl) {
      alert('Please configure the Google Sheet Webhook URL first.');
      setShowConfig(true);
      return;
    }

    if (registrations.length === 0) return alert('No data to sync.');

    setIsSyncing(true);
    try {
      // Logic: Sending data to a Google Apps Script Web App (POST request)
      const response = await fetch(webhookUrl, {
        method: 'POST',
        mode: 'no-cors', // Common for GAS web apps unless CORS is perfectly handled
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'sync_registrations',
          data: registrations,
          timestamp: new Date().toISOString()
        })
      });

      alert('Sync signal sent to Google Sheets! Note: If you used "no-cors", verification is handled by the script success.');
    } catch (error) {
      console.error('Sync Error:', error);
      alert('Failed to connect to Google Sheets Webhook.');
    } finally {
      setIsSyncing(false);
    }
  };

  // Fix: updated to use async/await and refresh data after status update
  const handleToggleStatus = async (uid: string, current: string) => {
    const next = current === 'Pending' ? 'Complete' : 'Pending';
    await registrationStore.updateStatus(uid, next as 'Pending' | 'Complete');
    await fetchRegistrations();
  };

  // Fix: updated to use async/await and refresh data after deletion
  const handleDelete = async (uid: string) => {
    if (confirm('Are you sure you want to delete this registration?')) {
      await registrationStore.delete(uid);
      await fetchRegistrations();
    }
  };

  // Fix: updated to use async/await and call registrationStore.clearAll()
  const handleClearAll = async () => {
    if (confirm('DANGER: This will permanently delete ALL registration records. Are you absolutely sure?')) {
      await registrationStore.clearAll();
      setRegistrations([]);
    }
  };

  const handleExportCSV = () => {
    if (registrations.length === 0) return alert('No data to export.');
    
    const headers = ['Name', 'Email', 'Phone', 'Path', 'Age', 'Gender', 'Weeks', 'Total Price', 'Status', 'Date'];
    const rows = registrations.map(reg => [
      `"${reg.fullName}"`,
      reg.email,
      reg.phone,
      `"${reg.path}"`,
      reg.ageRange,
      reg.gender,
      reg.weeksToCommit,
      reg.totalPrice,
      reg.status,
      new Date(reg.timestamp).toLocaleDateString()
    ]);

    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `CodeWithGideon_Registrations_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredData = registrations.filter(r => filter === 'All' || r.status === filter);

  return (
    <div className="py-12 bg-gray-50 dark:bg-slate-950 min-h-screen transition-colors">
      <div className="max-w-7xl mx-auto px-6">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="text-3xl font-black text-blue-900 dark:text-white">Admin Control Center</h1>
            <p className="text-slate-500 dark:text-slate-400">Manage cohorts, payments, and external integrations</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button 
              onClick={handleSyncToSheets}
              disabled={isSyncing}
              className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
                isSyncing ? 'bg-gray-200 text-gray-500' : 'bg-green-600 text-white hover:bg-green-700 shadow-md'
              }`}
            >
              {isSyncing ? (
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2a2 2 0 012-2h2a2 2 0 012 2v2m-6-9a2 2 0 114 0 2 2 0 01-4 0zM9 21h6a2 2 0 002-2v-1a2 2 0 00-2-2H9a2 2 0 00-2 2v1a2 2 0 002 2z" /></svg>
              )}
              Sync to Sheets
            </button>
            <button 
              onClick={() => setShowConfig(true)}
              className="p-2.5 bg-white dark:bg-slate-900 text-slate-400 hover:text-blue-900 dark:hover:text-teal-400 rounded-xl border border-gray-100 dark:border-slate-800 transition-colors"
              title="Configure Sheet Binding"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            </button>
            <div className="h-8 w-px bg-gray-200 dark:bg-slate-800 hidden md:block"></div>
            <button 
              onClick={onLogout}
              className="px-6 py-2.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:opacity-90 rounded-xl text-xs font-black uppercase tracking-widest transition-colors"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Integration Config Modal */}
        {showConfig && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 max-w-lg w-full p-8 rounded-[2.5rem] shadow-2xl border border-gray-100 dark:border-slate-800 relative">
               <button onClick={() => setShowConfig(false)} className="absolute top-6 right-6 text-slate-400 hover:text-blue-900">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
               </button>
               <h3 className="text-xl font-black text-blue-900 dark:text-white mb-4">Sheet Binding Setup</h3>
               <p className="text-sm text-slate-500 mb-6">Connect your registrations directly to a Google Sheet.</p>
               
               <form onSubmit={handleSaveWebhook} className="space-y-4">
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Google Apps Script URL</label>
                    <input 
                      required
                      type="url"
                      value={webhookUrl}
                      onChange={(e) => setWebhookUrl(e.target.value)}
                      placeholder="https://script.google.com/macros/s/.../exec"
                      className="w-full px-5 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl text-sm"
                    />
                  </div>
                  <button type="submit" className="w-full py-4 bg-blue-900 text-white font-bold rounded-xl shadow-lg">Save Configuration</button>
               </form>

               <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-[11px] text-blue-800 dark:text-blue-300 leading-relaxed">
                  <p className="font-bold mb-2 uppercase tracking-wide">Setup Steps:</p>
                  <ol className="list-decimal pl-4 space-y-1">
                    <li>Create a Google Sheet.</li>
                    <li>Go to Extensions → Apps Script.</li>
                    <li>Paste a "doPost" function that appends JSON to the sheet.</li>
                    <li>Deploy as "Web App" (Execute as Me, Access: Anyone).</li>
                    <li>Copy the Web App URL and paste it here.</li>
                  </ol>
               </div>
            </div>
          </div>
        )}

        {/* Table Controls */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
           <div className="bg-white dark:bg-slate-900 p-1 rounded-xl border border-gray-100 dark:border-slate-800 flex shadow-sm">
              {['All', 'Pending', 'Complete'].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f as any)}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                    filter === f 
                    ? 'bg-blue-900 dark:bg-teal-600 text-white shadow-md' 
                    : 'text-slate-400 hover:text-blue-900 dark:hover:text-slate-200'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={handleExportCSV}
                className="px-4 py-2.5 text-blue-700 dark:text-blue-400 text-xs font-black uppercase tracking-widest hover:underline"
              >
                Download CSV
              </button>
              <button 
                onClick={handleClearAll}
                className="px-4 py-2.5 text-red-600 text-xs font-black uppercase tracking-widest hover:underline"
              >
                Clear Database
              </button>
            </div>
        </div>

        {/* Main Data Table */}
        <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-xl border border-gray-100 dark:border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 dark:bg-slate-800/50 border-b border-gray-100 dark:border-slate-800">
                <tr>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Student Info</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Path & Duration</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Price</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Payment Status</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-8 py-20 text-center text-slate-400 font-medium italic">No registration records found for this filter.</td>
                  </tr>
                ) : (
                  filteredData.sort((a,b) => b.timestamp - a.timestamp).map((reg) => (
                    <tr key={reg.uid} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-900 text-white flex items-center justify-center font-black text-xs">
                            {reg.fullName.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-blue-900 dark:text-white leading-tight">{reg.fullName}</p>
                            <p className="text-xs text-slate-400 font-medium mt-1">{reg.email}</p>
                            <p className="text-[10px] text-slate-400">{reg.phone} · {reg.gender}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-300 block">{reg.path}</span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{reg.weeksToCommit} Weeks</span>
                      </td>
                      <td className="px-8 py-6">
                        <p className="text-sm font-black text-blue-900 dark:text-teal-500">₦{reg.totalPrice.toLocaleString()}</p>
                      </td>
                      <td className="px-8 py-6">
                        <button 
                          onClick={() => handleToggleStatus(reg.uid, reg.status)}
                          className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border transition-colors ${
                            reg.status === 'Complete' 
                            ? 'bg-teal-50 border-teal-200 text-teal-600 dark:bg-teal-900/30 dark:border-teal-800 dark:text-teal-400' 
                            : 'bg-orange-50 border-orange-200 text-orange-600 dark:bg-orange-900/30 dark:border-orange-800 dark:text-orange-400'
                          }`}
                        >
                          {reg.status}
                        </button>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                          <button 
                            onClick={() => handleDelete(reg.uid)}
                            className="p-2 text-slate-300 hover:text-red-600 transition-colors"
                            title="Delete Registration"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Help/Setup Section for Admins */}
        <div className="mt-16 p-8 bg-blue-900 dark:bg-slate-900 rounded-[2rem] text-white shadow-2xl flex flex-col md:flex-row items-center gap-12">
           <div className="md:w-1/2">
             <h3 className="text-2xl font-black mb-4">Infrastructure Status</h3>
             <ul className="space-y-4">
                <li className="flex items-center gap-3">
                   <div className="w-3 h-3 bg-teal-400 rounded-full"></div>
                   <span className="text-sm font-medium">Firebase Auth: <span className="text-teal-400">ONLINE</span></span>
                </li>
                <li className="flex items-center gap-3">
                   <div className={`w-3 h-3 rounded-full ${webhookUrl ? 'bg-teal-400' : 'bg-orange-400'}`}></div>
                   <span className="text-sm font-medium">Sheets Binding: {webhookUrl ? <span className="text-teal-400">CONNECTED</span> : <span className="text-orange-400">NOT CONFIGURED</span>}</span>
                </li>
             </ul>
           </div>
           <div className="md:w-1/2 p-6 bg-white/5 dark:bg-white/10 rounded-2xl border border-white/10">
              <p className="text-xs text-blue-100/70 mb-2 uppercase tracking-widest font-bold">Admin Notice</p>
              <p className="text-xs leading-relaxed opacity-80">
                To create new admin users, use the Firebase Console. Passwords must be at least 6 characters. Synchronization to Google Sheets is manual—remember to sync at the end of each day.
              </p>
           </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
