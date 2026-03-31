import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { LogIn, User as UserIcon, Lock, Activity, CheckCircle2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import Logo from './Logo';

interface LoginCardProps {
  onLogin: (user: User) => void;
  onAddAuditEntry: (action: string, details: string, type?: 'INFO' | 'OK' | 'WARN', userName?: string) => void;
  registry: any[];
}

const ROLE_FINANCIALS: Record<UserRole, { base: number; target: number }> = {
  [UserRole.EMPLOYEE]: { base: 62000, target: 12000 },
  [UserRole.SUPERVISOR]: { base: 88000, target: 18000 },
  [UserRole.ADMIN]: { base: 105000, target: 25000 },
};

const SORTED_ROLES = [
  UserRole.ADMIN,
  UserRole.SUPERVISOR,
  UserRole.EMPLOYEE,
];

const LoginCard: React.FC<LoginCardProps> = ({ onLogin, onAddAuditEntry, registry }) => {
  const [name, setName] = useState('');
  const [passkey, setPasskey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'SUCCESS' | 'ERROR'; message: string } | null>(null);
  const [showPasskey, setShowPasskey] = useState(false);

  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setFeedback(null);

    setTimeout(() => {
      const trimmedName = name.trim();
      const matchedByName = registry.filter((u: any) => u.name.toLowerCase() === trimmedName.toLowerCase());

      if (matchedByName.length === 0) {
        onAddAuditEntry('AUTH_FAILURE', `Unrecognized identity login attempt: ${trimmedName}`, 'WARN');
        setFeedback({ type: 'ERROR', message: 'We could not find that name in the directory. Check spelling or contact your admin.' });
        setIsLoading(false);
        return;
      }

      // Find the user whose password matches (auto-detect role)
      const foundUser = matchedByName.find((u: any) => u.password === passkey);

      if (!foundUser) {
        onAddAuditEntry('AUTH_FAILURE', `Invalid passkey for user: ${trimmedName}`, 'WARN');
        setFeedback({ type: 'ERROR', message: 'Incorrect password. Try again or reset with your admin.' });
        setIsLoading(false);
        return;
      }

      if (foundUser.isActive === false) {
        onAddAuditEntry('AUTH_FAILURE', `Inactive account attempt by: ${trimmedName}`, 'WARN');
        setFeedback({ type: 'ERROR', message: 'This account is inactive. Contact your administrator.' });
        setIsLoading(false);
        return;
      }

      const detectedRole: UserRole = foundUser.role as UserRole;
      const finalName = foundUser.name;
      const foundDept = foundUser.department;

      setFeedback({ type: 'SUCCESS', message: `Signed in as ${detectedRole}. Opening your dashboard…` });

      const financial = ROLE_FINANCIALS[detectedRole] ?? ROLE_FINANCIALS[UserRole.EMPLOYEE];
      const stableId = btoa(finalName || detectedRole).substring(0, 12);

      setTimeout(() => {
        onLogin({
          id: stableId,
          name: finalName || `User_${detectedRole}`,
          email: `${(finalName || detectedRole).replace(/\s/g, '')}@aa2000.com`,
          role: detectedRole,
          baseSalary: financial.base,
          incentiveTarget: financial.target,
          department: foundDept
        });
      }, 800);
    }, 1200);
  };

  return (
    <div className="w-full max-w-md min-w-[20rem] animate-in fade-in zoom-in duration-700 relative">
      <div className="bg-white rounded-[3rem] p-8 md:p-12 shadow-2xl border border-slate-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
        <div className="relative z-10 flex flex-col items-center">
          <Logo size="md" className="mb-6" />
          <div className="text-center mb-10 w-full">
            <div className="flex items-center justify-center gap-2 mb-1">
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">
                Sign in to <span className="text-blue-600">KPI workspace</span>
              </h2>
            </div>
            <p className="text-sm text-slate-500 font-medium leading-snug max-w-xs mx-auto">
              Sign in with the name and role your administrator set up for you.
            </p>
          </div>
          <div className="w-full relative">
            <form onSubmit={handleSubmit} className="w-full space-y-5">
              {feedback && (
                <div className="w-full flex justify-center" role="status" aria-live="polite">
                  <div
                    className={`px-5 py-2.5 rounded-2xl shadow-2xl border flex items-center gap-3 backdrop-blur-md fade-in duration-300 ${
                      feedback.type === 'SUCCESS' ? 'bg-emerald-50/90 border-emerald-200 text-emerald-700' : 'bg-red-50/90 border-red-200 text-red-700'
                    }`}
                  >
                    {feedback.type === 'SUCCESS' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-600" />
                    )}
                    <span className="text-[9px] font-black tracking-[0.15em] whitespace-normal break-words text-center leading-tight">
                      {feedback.message}
                    </span>
                  </div>
                </div>
              )}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 tracking-widest ml-1">Full name</label>
                <div className="relative">
                  <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                  <input
                    type="text" required placeholder="Full Name"
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm text-slate-900 focus:ring-4 focus:ring-blue-500/5 outline-none transition-all"
                    value={name} onChange={(e) => setName(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 tracking-widest ml-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                  <input
                    type={showPasskey ? 'text' : 'password'} required placeholder="••••••••"
                    className="w-full pl-12 pr-11 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm text-slate-900 focus:ring-4 focus:ring-blue-500/5 outline-none transition-all"
                    value={passkey} onChange={(e) => setPasskey(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasskey((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors focus:outline-none focus:ring-0"
                    aria-label={showPasskey ? 'Hide password' : 'Show password'}
                  >
                    {showPasskey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <button
                type="submit" disabled={isLoading}
                className="w-full min-h-[3.25rem] mt-2 font-black py-4 rounded-2xl shadow-xl bg-slate-900 text-white flex items-center justify-center gap-3 text-[11px] tracking-[0.2em] hover:bg-slate-800 disabled:bg-slate-700 transition-all active:scale-95"
              >
                <span className="inline-flex items-center justify-center gap-3 min-w-[12rem]">
                  {isLoading ? (
                    <>
                      <Activity className="w-5 h-5 animate-spin shrink-0" aria-hidden />
                      Signing in…
                    </>
                  ) : (
                    <>Sign in <LogIn className="w-4 h-4 shrink-0" /></>
                  )}
                </span>
              </button>
            </form>
          </div>
        </div>
      </div>
      <p className="mt-8 text-center text-slate-400 text-xs font-medium">AA2000 KPI workspace • Internal use</p>
    </div>
  );
};

export default LoginCard;
