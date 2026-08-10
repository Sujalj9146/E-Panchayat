import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Lock, 
  User, 
  ShieldCheck, 
  Globe,
  ArrowRight,
  UserCheck
} from 'lucide-react';

interface LoginProps {
  onLoginSuccess: (role: 'officer' | 'citizen', username: string) => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const { i18n } = useTranslation();
  const [role, setRole] = useState<'officer' | 'citizen'>('officer');
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin');
  const [citizenId, setCitizenId] = useState('cit_101');
  const [error, setError] = useState('');

  const toggleLanguage = () => {
    const nextLang = i18n.language === 'en' ? 'mr' : 'en';
    i18n.changeLanguage(nextLang);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (role === 'officer') {
      // Mock Officer validation
      if (username === 'admin' && password === 'admin') {
        onLoginSuccess('officer', 'Panchayat Officer');
      } else {
        setError(i18n.language === 'en' ? 'Invalid officer credentials. Use admin/admin.' : 'चुकीचे क्रेडेंशियल्स. admin/admin वापरा.');
      }
    } else {
      // Mock Citizen login (accepts any citizen id or guest)
      if (citizenId.trim()) {
        onLoginSuccess('citizen', citizenId);
      } else {
        setError(i18n.language === 'en' ? 'Please enter a valid Citizen ID.' : 'कृपया वैध नागरिक आयडी प्रविष्ट करा.');
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-slate-50 relative selection:bg-govsaffron selection:text-white">
      {/* Top Tricolor Strip */}
      <div className="w-full gov-tricolor-strip absolute top-0 left-0 z-20" />

      {/* Header */}
      <header className="bg-white border-b border-slate-200 py-3.5 shadow-sm z-10">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-12 bg-slate-50 border border-slate-200 rounded flex items-center justify-center p-1 shadow-sm">
              <span className="text-lg">🦁</span>
            </div>
            <div className="flex flex-col text-left select-none">
              <span className="text-[9px] font-bold text-slate-400 uppercase">Ministry of Rural Development • Government of India</span>
              <span className="font-extrabold text-govnavy text-sm sm:text-base tracking-tight">NATIONAL SINGLE SIGN-ON SERVICE</span>
            </div>
          </div>
          
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors text-xs font-bold shadow-sm"
          >
            <Globe size={14} className="text-govnavy" />
            <span>{i18n.language === 'en' ? 'मराठी' : 'English'}</span>
          </button>
        </div>
      </header>

      {/* Center login box container */}
      <main className="flex-1 flex items-center justify-center py-12 px-6 z-10">
        <div className="w-full max-w-md bg-white rounded-xl border border-slate-200 p-6 sm:p-8 shadow-md border-t-4 border-govsaffron space-y-6">
          
          {/* Form heading */}
          <div className="text-center space-y-1.5">
            <h1 className="text-lg sm:text-xl font-black text-govblue-900 tracking-tight uppercase m-0">Khed Shivapur Gram Panchayat</h1>
            <p className="text-xs text-slate-500 font-medium">Secure Login Gate for Representatives & Village Citizens</p>
          </div>

          {/* Role selector tabs */}
          <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              type="button"
              onClick={() => {
                setRole('officer');
                setError('');
              }}
              className={`py-2 rounded-md text-xs font-bold transition-all ${
                role === 'officer' 
                  ? 'bg-white text-govnavy shadow-sm border border-slate-200' 
                  : 'text-slate-555 hover:text-slate-900'
              }`}
            >
              Panchayat Officer 👤
            </button>
            <button
              type="button"
              onClick={() => {
                setRole('citizen');
                setError('');
              }}
              className={`py-2 rounded-md text-xs font-bold transition-all ${
                role === 'citizen' 
                  ? 'bg-white text-govnavy shadow-sm border border-slate-200' 
                  : 'text-slate-555 hover:text-slate-900'
              }`}
            >
              Village Citizen 👥
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 rounded bg-rose-50 border border-rose-200 text-xs text-rose-600 font-bold">
              {error}
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4 text-xs font-bold text-slate-500 text-left">
            {role === 'officer' ? (
              <>
                <div className="space-y-1.5">
                  <label className="block">Username / वापरकर्ता नाव</label>
                  <div className="relative">
                    <User size={14} className="absolute left-3 top-3 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Username (e.g. admin)"
                      className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded text-slate-800"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block">Password / संकेतशब्द</label>
                  <div className="relative">
                    <Lock size={14} className="absolute left-3 top-3 text-slate-400" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Password (e.g. admin)"
                      className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded text-slate-800"
                    />
                  </div>
                </div>
              </>
            ) : (
              <div className="space-y-1.5">
                <label className="block">Enter Citizen ID / नागरिक ओळखपत्र</label>
                <div className="relative">
                  <UserCheck size={14} className="absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={citizenId}
                    onChange={(e) => setCitizenId(e.target.value)}
                    placeholder="Enter Citizen ID (e.g. cit_101)"
                    className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded text-slate-800"
                  />
                </div>
                <span className="text-[10px] text-slate-400 font-medium italic block mt-1">
                  Default mock values: cit_101 to cit_110
                </span>
              </div>
            )}

            {/* Login button */}
            <button
              type="submit"
              className="w-full py-2.5 bg-govnavy hover:bg-govblue-700 text-white rounded font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all shadow-md mt-4"
            >
              <span>Verify and Sign In</span>
              <ArrowRight size={14} />
            </button>
          </form>

          {/* Security Banner */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-center gap-2 text-[10px] text-slate-400 font-medium">
            <ShieldCheck size={14} className="text-govgreen" />
            <span>NIC Secure Login (SSO Single Sign-On Mapped)</span>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-[10px] text-slate-500 z-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <span>National Informatics Centre (NIC) SSO Mode. All access is audited.</span>
          <span>Security Guidelines • Helpdesk Support</span>
        </div>
      </footer>
    </div>
  );
};
