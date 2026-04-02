import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { User, SystemStats, UserRole, SystemNotification } from '../types';
import { Menu, Settings, X, KeyRound, Lock, ShieldAlert, Save, Eye, EyeOff, CheckCircle2, Bell } from 'lucide-react';
import Logo from './Logo';
import { useLockBodyScroll } from '../hooks/useLockBodyScroll';
import { useMobileSidenav } from '../contexts/MobileSidenavContext';
import { useRoleSidenavRail } from '../contexts/RoleSidenavRailContext';

interface NavbarProps {
  user: User;
  onClearLocalCache: () => void;
  validatedStats?: SystemStats;
  registry: any[];
  onUpdateRegistry: (newRegistry: any[]) => void;
  notifications?: SystemNotification[];
  onDeleteNotification?: (id: string) => void;
}

const Navbar: React.FC<NavbarProps> = ({ user, onClearLocalCache, registry, onUpdateRegistry, notifications = [], onDeleteNotification }) => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isBellOpen, setIsBellOpen] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);
  const mobileNav = useMobileSidenav();
  const { setRailOpen } = useRoleSidenavRail();

  const unreadCount = notifications.length;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) setIsBellOpen(false);
    };
    if (isBellOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isBellOpen]);

  const [pwdForm, setPwdForm] = useState({ current: '', new: '', confirm: '' });
  const [pwdFeedback, setPwdFeedback] = useState<{ type: 'ERROR' | 'SUCCESS', msg: string } | null>(null);
  const [isUpdatingPwd, setIsUpdatingPwd] = useState(false);

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useLockBodyScroll(isSettingsOpen);

  useEffect(() => {
    if (isSettingsOpen) {
      mobileNav.close();
      setRailOpen(false);
      document.body.classList.add('settings-open');
    } else {
      document.body.classList.remove('settings-open');
    }
    return () => {
      document.body.classList.remove('settings-open');
    };
  }, [isSettingsOpen, mobileNav, setRailOpen]);

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    setPwdFeedback(null);
    setIsUpdatingPwd(true);

    setTimeout(() => {
      const userIndex = registry.findIndex((u: any) => u.name.toLowerCase() === user.name.toLowerCase());

      if (userIndex === -1) {
        setPwdFeedback({ type: 'ERROR', msg: 'We could not find your account. Try signing out and in again.' });
        setIsUpdatingPwd(false);
        return;
      }

      if (registry[userIndex].password !== pwdForm.current) {
        setPwdFeedback({ type: 'ERROR', msg: 'Current password is incorrect.' });
        setIsUpdatingPwd(false);
        return;
      }

      if (pwdForm.new !== pwdForm.confirm) {
        setPwdFeedback({ type: 'ERROR', msg: 'New password and confirmation do not match.' });
        setIsUpdatingPwd(false);
        return;
      }

      if (pwdForm.new.length < 3) {
        setPwdFeedback({ type: 'ERROR', msg: 'Choose a new password with at least 3 characters.' });
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
      {isSettingsOpen && (
        <div className="fixed inset-0 z-[5000] flex items-center justify-center p-4 md:p-6 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 md:p-8 shadow-lg relative animate-in zoom-in-95 duration-500 overflow-hidden">
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
                  <h2 className="text-xl font-black text-slate-900 tracking-tight">Account settings</h2>
                  <p className="text-sm text-slate-500 font-medium">Change the password you use to sign in</p>
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
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Current password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type={showCurrent ? "text" : "password"}
                      required
                      className="w-full pl-10 pr-10 py-2.5 bg-slate-50 text-slate-900 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none text-sm transition-all placeholder:text-slate-400"
                      placeholder="••••••••"
                      value={pwdForm.current}
                      onChange={e => setPwdForm({...pwdForm, current: e.target.value})}
                    />
                    <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-blue-600 transition-colors">
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
                      className="w-full pl-10 pr-10 py-2.5 bg-slate-50 text-slate-900 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none text-sm transition-all placeholder:text-slate-400"
                      placeholder="••••••••"
                      value={pwdForm.new}
                      onChange={e => setPwdForm({...pwdForm, new: e.target.value})}
                    />
                    <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-blue-600 transition-colors">
                      {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Confirm new password</label>
                  <div className="relative">
                    <CheckCircle2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type={showConfirm ? "text" : "password"}
                      required
                      className="w-full pl-10 pr-10 py-2.5 bg-slate-50 text-slate-900 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none text-sm transition-all placeholder:text-slate-400"
                      placeholder="••••••••"
                      value={pwdForm.confirm}
                      onChange={e => setPwdForm({...pwdForm, confirm: e.target.value})}
                    />
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-blue-600 transition-colors">
                      {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isUpdatingPwd}
                  className={`w-full py-2.5 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-3 ${isUpdatingPwd ? 'bg-slate-100 text-slate-400' : 'bg-slate-900 text-white hover:bg-slate-800'}`}
                >
                  {isUpdatingPwd ? <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                  Save password
                </button>
              </form>

              {user.role === UserRole.ADMIN && (
                <div className="pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      const ok = window.confirm(
                        'Clear local cache?\n\nThis will reset cached transmissions and grading weights back to defaults. Preinstalled accounts and seeded audits will be kept.'
                      );
                      if (!ok) return;
                      onClearLocalCache();
                      setPwdFeedback({ type: 'SUCCESS', msg: 'Local cache cleared.' });
                      setTimeout(() => setIsSettingsOpen(false), 900);
                    }}
                    className="w-full py-2.5 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-3 bg-red-50 text-red-700 hover:bg-red-100 border border-red-100"
                    title="Clears cached transmissions and grading weights"
                  >
                    Clear Local Cache
                  </button>
                  <p className="mt-2 text-[10px] font-bold text-slate-500 leading-relaxed">
                    Keeps built-in accounts and seeded audits. Use for testing fresh state.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <nav className={`bg-white border-b border-slate-100 lg:sticky lg:top-0 z-[1000] h-20 flex items-center shadow-sm transition-opacity duration-150 ${isSettingsOpen ? 'opacity-0 pointer-events-none select-none' : ''}`}>
        <div className="max-w-[1800px] mx-auto w-full px-4 md:px-12 flex items-center justify-between">
          <div className="flex items-center gap-3 sm:gap-6 md:gap-10">
            <button
              type="button"
              onClick={mobileNav.toggle}
              className="lg:hidden p-2.5 rounded-2xl text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
              aria-label="Open navigation menu"
              title="Menu"
            >
              <Menu className="w-5 h-5" aria-hidden />
            </button>
            <Link to="/dashboard" className="focus:outline-none focus:ring-2 focus:ring-blue-500/20 rounded-xl" aria-label="Go to dashboard">
              <Logo size="sm" showText={true} />
            </Link>
          </div>
          <div className="flex items-center gap-4">
            {/* Notification Bell */}
            <div className="relative" ref={bellRef}>
              <button
                onClick={() => setIsBellOpen(o => !o)}
                className="relative p-3 text-slate-400 hover:bg-slate-50 hover:text-slate-900 rounded-2xl transition-all"
                aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
                )}
              </button>
              {isBellOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-slate-100 rounded-xl shadow-lg z-[2000] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                  <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Notifications</h3>
                    {unreadCount > 0 && (
                      <button
                        onClick={() => { notifications.forEach(n => onDeleteNotification?.(n.id)); }}
                        className="text-[10px] font-black text-blue-600 hover:text-blue-800 uppercase tracking-widest"
                      >
                        Clear all
                      </button>
                    )}
                  </div>
                  <div className="max-h-72 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="px-5 py-8 text-center">
                        <Bell className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                        <p className="text-xs font-bold text-slate-400">No new notifications</p>
                      </div>
                    ) : (
                      notifications.map(n => (
                        <div key={n.id} className="px-5 py-3.5 border-b border-slate-50 flex items-start gap-3 hover:bg-slate-50 transition-colors">
                          <div className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${n.type === 'SUCCESS' ? 'bg-emerald-400' : n.type === 'ALERT' ? 'bg-red-400' : 'bg-blue-400'}`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-slate-700 leading-snug">{n.message}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">{new Date(n.timestamp).toLocaleTimeString()}</p>
                          </div>
                          <button
                            onClick={() => onDeleteNotification?.(n.id)}
                            className="shrink-0 p-1 text-slate-300 hover:text-slate-600 rounded-lg transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            <button onClick={() => setIsSettingsOpen(true)} className="p-3 text-slate-400 hover:bg-slate-50 hover:text-slate-900 rounded-2xl transition-all">
              <Settings className="w-5 h-5" />
            </button>
            <div className="h-8 w-px bg-slate-100 mx-2"></div>
            <div className="hidden md:block text-right">
              <p className="text-xs font-black text-slate-900 leading-none">{user.name}</p>
              <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest mt-1">{user.role}</p>
            </div>
          </div>
        </div>
      </nav>
    </>
  );
};

export default Navbar;
