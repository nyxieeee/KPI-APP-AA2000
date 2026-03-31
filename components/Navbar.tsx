import React, { useState, useRef, useEffect, useMemo } from 'react';
import { User, UserRole, SystemNotification, SystemStats } from '../types';
import { LogOut, Bell, Settings, X, Clock, Info, CheckCircle2, AlertCircle, MessageSquare, Activity, ShieldCheck, KeyRound, Lock, ShieldAlert, Save, Eye, EyeOff } from 'lucide-react';
import Logo from './Logo';

interface NavbarProps {
  user: User;
  onLogout: () => void;
  notifications: SystemNotification[];
  onDeleteNotification: (id: string) => void;
  validatedStats?: SystemStats;
  registry: any[];
  onUpdateRegistry: (newRegistry: any[]) => void;
}

const Navbar: React.FC<NavbarProps> = ({ user, onLogout, notifications, onDeleteNotification, validatedStats, registry, onUpdateRegistry }) => {
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  // Password Change State
  const [pwdForm, setPwdForm] = useState({ current: '', new: '', confirm: '' });
  const [pwdFeedback, setPwdFeedback] = useState<{ type: 'ERROR' | 'SUCCESS', msg: string } | null>(null);
  const [isUpdatingPwd, setIsUpdatingPwd] = useState(false);

  // Visibility States for Password Fields
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Filter notifications to only show those intended for the current user
  const userNotifications = useMemo(() => {
    return notifications.filter(n => n.targetUserId === user.id);
  }, [notifications, user.id]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'SUCCESS': return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />;
      case 'ALERT': return <AlertCircle className="w-3.5 h-3.5 text-amber-500" />;
      default: return <Info className="w-3.5 h-3.5 text-blue-500" />;
    }
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    setPwdFeedback(null);
    setIsUpdatingPwd(true);

    setTimeout(() => {
      const userIndex = registry.findIndex((u: any) => u.name.toLowerCase() === user.name.toLowerCase());

      if (userIndex === -1) {
        setPwdFeedback({ type: 'ERROR', msg: 'Account not found.' });
        setIsUpdatingPwd(false);
        return;
      }

      if (registry[userIndex].password !== pwdForm.current) {
        setPwdFeedback({ type: 'ERROR', msg: 'Current password is incorrect.' });
        setIsUpdatingPwd(false);
        return;
      }

      if (pwdForm.new !== pwdForm.confirm) {
        setPwdFeedback({ type: 'ERROR', msg: 'Passwords do not match.' });
        setIsUpdatingPwd(false);
        return;
      }

      if (pwdForm.new.length < 3) {
        setPwdFeedback({ type: 'ERROR', msg: 'Password is too short.' });
        setIsUpdatingPwd(false);
        return;
      }

      const updatedRegistry = [...registry];
      updatedRegistry[userIndex] = { ...updatedRegistry[userIndex], password: pwdForm.new };
      onUpdateRegistry(updatedRegistry);
      
      setPwdFeedback({ type: 'SUCCESS', msg: 'Password updated successfully.' });
      setIsUpdatingPwd(false);
      setPwdForm({ current: '', new: '', confirm: '' });
      setTimeout(() => setIsSettingsOpen(false), 2000);
    }, 1000);
  };

  return (
    <>
      {/* Change Password Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-[5000] flex items-center justify-center p-4 md:p-6 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[3rem] w-full max-w-md p-10 md:p-12 shadow-2xl relative animate-in zoom-in-95 duration-500 overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/5 rounded-full blur-[60px] -mr-24 -mt-24"></div>
            <button 
              onClick={() => { setIsSettingsOpen(false); setPwdFeedback(null); }} 
              className="absolute top-8 right-8 p-3 text-slate-300 hover:text-slate-900 hover:bg-slate-50 rounded-2xl transition-all z-10"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="space-y-8 relative">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-900 rounded-[1rem] flex items-center justify-center shadow-lg">
                  <KeyRound className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Change Password</h2>
                  <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Update your password</p>
                </div>
              </div>

              {pwdFeedback && (
                <div className={`p-4 rounded-2xl flex items-center gap-3 animate-in slide-in-from-top-2 ${pwdFeedback.type === 'SUCCESS' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                  {pwdFeedback.type === 'SUCCESS' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <ShieldAlert className="w-4 h-4 shrink-0" />}
                  <p className="text-[10px] font-black uppercase tracking-widest leading-none">{pwdFeedback.msg}</p>
                </div>
              )}

              <form onSubmit={handlePasswordChange} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Current Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      type={showCurrent ? "text" : "password"} 
                      required 
                      className="w-full pl-12 pr-12 py-3.5 bg-slate-100 text-slate-900 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 outline-none font-bold text-sm transition-all placeholder:text-slate-400" 
                      placeholder="••••••••" 
                      value={pwdForm.current} 
                      onChange={e => setPwdForm({...pwdForm, current: e.target.value})} 
                    />
                    <button 
                      type="button"
                      onClick={() => setShowCurrent(!showCurrent)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-blue-600 transition-colors"
                    >
                      {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-slate-100">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">New Password</label>
                  <div className="relative">
                    <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      type={showNew ? "text" : "password"} 
                      required 
                      className="w-full pl-12 pr-12 py-3.5 bg-slate-100 text-slate-900 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 outline-none font-bold text-sm transition-all placeholder:text-slate-400" 
                      placeholder="••••••••" 
                      value={pwdForm.new} 
                      onChange={e => setPwdForm({...pwdForm, new: e.target.value})} 
                    />
                    <button 
                      type="button"
                      onClick={() => setShowNew(!showNew)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-blue-600 transition-colors"
                    >
                      {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Confirm New Password</label>
                  <div className="relative">
                    <CheckCircle2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      type={showConfirm ? "text" : "password"} 
                      required 
                      className="w-full pl-12 pr-12 py-3.5 bg-slate-100 text-slate-900 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 outline-none font-bold text-sm transition-all placeholder:text-slate-400" 
                      placeholder="••••••••" 
                      value={pwdForm.confirm} 
                      onChange={e => setPwdForm({...pwdForm, confirm: e.target.value})} 
                    />
                    <button 
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-blue-600 transition-colors"
                    >
                      {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={isUpdatingPwd}
                  className={`w-full py-4 rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] shadow-xl transition-all flex items-center justify-center gap-3 ${isUpdatingPwd ? 'bg-slate-100 text-slate-400' : 'bg-slate-900 text-white hover:bg-slate-800'}`}
                >
                  {isUpdatingPwd ? <Activity className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Password
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      <nav className="bg-white border-b border-slate-100 sticky top-0 z-[1000] h-20 flex items-center shadow-sm">
        <div className="max-w-[1800px] mx-auto w-full px-4 md:px-12 flex items-center justify-between">
          <div className="flex items-center gap-12">
            <Logo size="sm" showText={true} />
          </div>

          <div className="flex items-center gap-4">
            <div className="relative" ref={notifRef}>
              <button 
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className={`p-3 rounded-2xl transition-all relative ${isNotifOpen ? 'bg-blue-50 text-blue-600' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-900'}`}
              >
                <Bell className="w-5 h-5" />
                {userNotifications.length > 0 && (
                  <span className="absolute top-2.5 right-2.5 w-4 h-4 bg-blue-600 border-2 border-white rounded-full text-[8px] text-white flex items-center justify-center font-black animate-in zoom-in">
                    {userNotifications.length}
                  </span>
                )}
              </button>

              {isNotifOpen && (
                <div className="absolute right-0 mt-4 w-80 bg-white rounded-[2rem] shadow-2xl border border-slate-100 py-6 z-[2000] animate-in slide-in-from-top-4 fade-in duration-300">
                  <div className="px-6 pb-4 border-b border-slate-50 flex items-center justify-between">
                    <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Notifications</h4>
                    <span className="text-[8px] font-black text-blue-600 px-2 py-0.5 bg-blue-50 rounded uppercase">Live</span>
                  </div>
                  <div className="max-h-96 overflow-y-auto custom-scrollbar">
                    {userNotifications.length === 0 ? (
                      <div className="py-12 text-center text-slate-300 flex flex-col items-center gap-3">
                        <Info className="w-8 h-8 opacity-20" />
                        <p className="text-[9px] font-black uppercase tracking-widest">No notifications</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-50">
                        {userNotifications.map(n => (
                          <div key={n.id} className="p-5 hover:bg-slate-50 transition-colors group relative">
                            <button onClick={() => onDeleteNotification(n.id)} className="absolute top-4 right-4 p-1 opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-all"><X className="w-3.5 h-3.5" /></button>
                            <div className="flex gap-4">
                              <div className="shrink-0 mt-1">{getNotifIcon(n.type)}</div>
                              <div className="space-y-1">
                                <p className="text-xs font-bold text-slate-700 leading-relaxed pr-4">{n.message}</p>
                                <div className="flex items-center gap-2">
                                  <Clock className="w-2.5 h-2.5 text-slate-300" />
                                  <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest">{new Date(n.timestamp).toLocaleTimeString()}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="p-3 text-slate-400 hover:bg-slate-50 hover:text-slate-900 rounded-2xl transition-all"
            >
              <Settings className="w-5 h-5" />
            </button>

            <div className="h-8 w-px bg-slate-100 mx-2"></div>

            <div className="flex items-center gap-4">
               <div className="hidden md:block text-right">
                  <p className="text-xs font-black text-slate-900 leading-none">{user.name}</p>
                  <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest mt-1">{user.role}</p>
               </div>
               <button 
                 onClick={onLogout}
                 className="flex items-center gap-3 px-5 py-2.5 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10 active:scale-95 group"
               >
                 Log Out
                 <LogOut className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
               </button>
            </div>
          </div>
        </div>
      </nav>
    </>
  );
};

export default Navbar;
