
import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { LogIn, Shield, User as UserIcon, Lock, ChevronDown, Activity, Cpu, CheckCircle2, AlertCircle } from 'lucide-react';
import Logo from './Logo';

interface LoginCardProps {
  onLogin: (user: User) => void;
  onAddAuditEntry: (action: string, details: string, type?: 'INFO' | 'OK' | 'WARN', userName?: string) => void;
  registry: any[];
}

// Added missing DEPARTMENT_HEAD role to satisfy Record<UserRole, ...>
const ROLE_FINANCIALS: Record<UserRole, { base: number; target: number }> = {
  [UserRole.EMPLOYEE]: { base: 62000, target: 12000 },
  [UserRole.SUPERVISOR]: { base: 88000, target: 18000 },
  [UserRole.DEPARTMENT_HEAD]: { base: 95000, target: 22000 },
  [UserRole.ADMIN]: { base: 105000, target: 25000 },
};

const SORTED_ROLES = [
  UserRole.ADMIN,
  UserRole.SUPERVISOR,
  UserRole.EMPLOYEE,
];

const LoginCard: React.FC<LoginCardProps> = ({ onLogin, onAddAuditEntry, registry }) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>(UserRole.ADMIN);
  const [name, setName] = useState('');
  const [passkey, setPasskey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'SUCCESS' | 'ERROR'; message: string } | null>(null);

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
      let foundDept = 'Admin';
      let finalName = name.trim();

      const matchedIdentities = registry.filter((u: any) => u.name.toLowerCase() === name.trim().toLowerCase());
      
      if (matchedIdentities.length > 0) {
        const foundUser = matchedIdentities.find((u: any) => u.role === selectedRole);

        if (!foundUser) {
          onAddAuditEntry('AUTH_FAILURE', `Role mismatch for ${name.trim()}. Requested: ${selectedRole}`, 'WARN');
          setFeedback({ 
            type: 'ERROR', 
            message: `ACCESS DENIED: LEVEL ${selectedRole.toUpperCase()} NOT AUTHORIZED` 
          });
          setIsLoading(false);
          return;
        }

        if (foundUser.isActive === false) {
          onAddAuditEntry('AUTH_FAILURE', `Inactive account attempt by: ${name.trim()}`, 'WARN');
          setFeedback({ type: 'ERROR', message: 'ACCESS DENIED: ACCOUNT INACTIVE' });
          setIsLoading(false);
          return;
        }

        if (passkey !== foundUser.password) {
          onAddAuditEntry('AUTH_FAILURE', `Invalid passkey for user node: ${name.trim()}`, 'WARN');
          setFeedback({ type: 'ERROR', message: 'ACCESS DENIED: INVALID PASSKEY' });
          setIsLoading(false);
          return;
        }

        foundDept = foundUser.department;
        finalName = foundUser.name; 
        setFeedback({ type: 'SUCCESS', message: `CONNECTING: DEPT ${foundUser.department.toUpperCase()}` });
      } 
      else {
        onAddAuditEntry('AUTH_FAILURE', `Unrecognized identity login attempt: ${name.trim()}`, 'WARN');
        setFeedback({ type: 'ERROR', message: 'ACCESS DENIED: UNRECOGNIZED IDENTITY' });
        setIsLoading(false);
        return;
      }

      const financial = ROLE_FINANCIALS[selectedRole];
      const stableId = btoa(finalName || selectedRole).substring(0, 12);
      
      setTimeout(() => {
        onLogin({
          id: stableId,
          name: finalName || `User_${selectedRole}`,
          email: `${(finalName || selectedRole).replace(/\s/g, '')}@aa2000.com`,
          role: selectedRole,
          baseSalary: financial.base,
          incentiveTarget: financial.target,
          department: foundDept
        });
      }, 800);
    }, 1200);
  };

  return (
    <div className="w-full max-w-md animate-in fade-in zoom-in duration-700 relative">
      <div className="bg-white rounded-[3rem] p-8 md:p-12 shadow-2xl border border-slate-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
        
        <div className="relative z-10 flex flex-col items-center">
          <Logo size="md" className="mb-6" />
          
          <div className="text-center mb-10 w-full">
            <div className="flex items-center justify-center gap-2 mb-1">
              <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">
                KPI <span className="text-blue-600">PORTAL</span>
              </h2>
            </div>
            <div className="flex items-center justify-center gap-3">
              <div className="h-px bg-slate-100 flex-grow"></div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] whitespace-nowrap">
                SECURE INFRASTRUCTURE ACCESS
              </p>
              <div className="h-px bg-slate-100 flex-grow"></div>
            </div>
          </div>

          <div className="w-full relative">
            {feedback && (
              <div className="absolute bottom-full mb-4 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-bottom-2 fade-in duration-300 w-max">
                <div className={`px-5 py-2.5 rounded-2xl shadow-2xl border flex items-center gap-3 backdrop-blur-md ${
                  feedback.type === 'SUCCESS' ? 'bg-emerald-50/90 border-emerald-200 text-emerald-700' : 'bg-red-50/90 border-red-200 text-red-700'
                }`}>
                  {feedback.type === 'SUCCESS' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-red-600" />}
                  <span className="text-[9px] font-black uppercase tracking-[0.15em] whitespace-nowrap">{feedback.message}</span>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="w-full space-y-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Personnel Identity</label>
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
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Clearance Level</label>
                <div className="relative">
                  <Shield className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                  <select 
                    className="w-full pl-12 pr-10 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm text-slate-900 cursor-pointer appearance-none outline-none focus:ring-4 focus:ring-blue-500/5 transition-all"
                    value={selectedRole} onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                  >
                    {SORTED_ROLES.map((role) => <option key={role} value={role}>{role}</option>)}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Secure Passkey</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                  <input 
                    type="password" required placeholder="••••••••"
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm text-slate-900 focus:ring-4 focus:ring-blue-500/5 outline-none transition-all"
                    value={passkey} onChange={(e) => setPasskey(e.target.value)}
                  />
                </div>
              </div>

              <button 
                type="submit" disabled={isLoading}
                className="w-full mt-2 font-black py-4 rounded-2xl shadow-xl bg-slate-900 text-white flex items-center justify-center gap-3 uppercase text-[11px] tracking-[0.2em] hover:bg-slate-800 disabled:bg-slate-700 transition-all active:scale-95"
              >
                {isLoading ? <Activity className="w-5 h-5 animate-spin" /> : <>Initiate Connection <LogIn className="w-4 h-4" /></>}
              </button>
            </form>
          </div>
        </div>
      </div>
      
      <div className="mt-8 flex flex-col items-center gap-4">
        <div className="flex items-center gap-2">
           <Cpu className="w-3.5 h-3.5 text-slate-300" />
           <p className="text-slate-400 text-[9px] font-bold uppercase tracking-[0.3em]">AA2000 Strategic Security Node</p>
        </div>
      </div>
    </div>
  );
};

export default LoginCard;
