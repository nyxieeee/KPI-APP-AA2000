import React, { useState, useCallback, useEffect } from 'react';
import { User, UserRole, Transmission, SystemStats, AuditEntry, SystemNotification, Announcement } from './types';
import LoginCard from './components/LoginCard';
import Dashboard from './components/Dashboard';
import Navbar from './components/Navbar';

const INITIAL_REGISTRY = [
  { name: 'paulotecemp', password: '123', department: 'Technical', role: UserRole.EMPLOYEE, isActive: true },
  { name: 'paulotecsup', password: '123', department: 'Technical', role: UserRole.SUPERVISOR, isActive: true },
  { name: 'paulosalesemp', password: '123', department: 'Sales', role: UserRole.EMPLOYEE, isActive: true },
  { name: 'paulosalessup', password: '123', department: 'Sales', role: UserRole.SUPERVISOR, isActive: true },
  { name: 'paulomaremp', password: '123', department: 'Marketing', role: UserRole.EMPLOYEE, isActive: true },
  { name: 'paulomarsup', password: '123', department: 'Marketing', role: UserRole.SUPERVISOR, isActive: true },
  { name: 'pauloaccemp', password: '123', department: 'Accounting', role: UserRole.EMPLOYEE, isActive: true },
  { name: 'pauloaccsup', password: '123', department: 'Accounting', role: UserRole.SUPERVISOR, isActive: true },
  { name: 'Paulo Almorfe', password: '123', department: 'Admin', role: UserRole.ADMIN, isActive: true }
];

const INITIAL_ADMIN_USERS: Record<string, string[]> = {
  'Technical': ['paulotecemp', 'paulotecsup'],
  'Sales': ['paulosalesemp', 'paulosalessup'],
  'Marketing': ['paulomaremp', 'paulomarsup'],
  'Admin': ['Paulo Almorfe'],
  'Accounting': ['pauloaccemp', 'pauloaccsup']
};

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  const [pendingTransmissions, setPendingTransmissions] = useState<Transmission[]>([]);
  const [transmissionHistory, setTransmissionHistory] = useState<Transmission[]>([]);
  const [validatedStats, setValidatedStats] = useState<Record<string, SystemStats>>({});
  const [auditLogs, setAuditLogs] = useState<AuditEntry[]>([]);
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  const [registry, setRegistry] = useState<any[]>(INITIAL_REGISTRY);
  const [adminUsers, setAdminUsers] = useState<Record<string, string[]>>(INITIAL_ADMIN_USERS);

  const addNotification = useCallback((message: string, targetUserId: string, type: 'INFO' | 'SUCCESS' | 'ALERT' = 'INFO') => {
    const newNotif: SystemNotification = {
      id: Math.random().toString(36).substr(2, 9).toUpperCase(),
      targetUserId, message, timestamp: new Date().toISOString(), type
    };
    setNotifications(prev => [newNotif, ...prev].slice(0, 100));
  }, []);

  const deleteNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const addAuditEntry = useCallback((action: string, details: string, type: 'INFO' | 'OK' | 'WARN' = 'INFO', userName?: string) => {
    const entry: AuditEntry = {
      id: Math.random().toString(36).substr(2, 8).toUpperCase(),
      timestamp: new Date().toISOString(),
      user: userName || user?.name || 'SYSTEM',
      action, details, type
    };
    setAuditLogs(prev => [entry, ...prev].slice(0, 500));
  }, [user]);

  const handleLogin = useCallback((loggedInUser: User) => {
    setUser(loggedInUser);
    setIsAuthenticated(true);
    addNotification(`Welcome, ${loggedInUser.name}.`, loggedInUser.id, 'SUCCESS');
    addAuditEntry('SESSION_INIT', `Role: ${loggedInUser.role}`, 'OK', loggedInUser.name);
  }, [addNotification, addAuditEntry]);

  const handleLogout = useCallback(() => {
    addAuditEntry('SESSION_TERM', 'Disconnected', 'INFO');
    setUser(null);
    setIsAuthenticated(false);
  }, [addAuditEntry]);

  const handleTransmit = useCallback((transmission: Transmission) => {
    if (!user) return;
    setPendingTransmissions(prev => [...prev, transmission]);
    addNotification(`TX ${transmission.id} submitted.`, user.id, 'INFO');
    addAuditEntry('DATA_TRANSMIT', `${transmission.id} queued`, 'INFO', transmission.userName);
  }, [user, addAuditEntry, addNotification]);

  const handleValidate = useCallback((transmissionId: string, overrides?: SystemStats, status: 'validated' | 'rejected' = 'validated') => {
    const transmission = pendingTransmissions.find(t => t.id === transmissionId);
    if (transmission && user) {
      const statsToUse = overrides || { responseTime: transmission.responseTime, accuracy: transmission.accuracy, uptime: transmission.uptime };
      const finalTransmission: Transmission = { ...transmission, ...statsToUse, status };
      setTransmissionHistory(prev => [finalTransmission, ...prev].slice(0, 500));
      if (status === 'validated') {
        setValidatedStats(prev => ({ ...prev, [transmission.userId]: statsToUse }));
        addAuditEntry('VERIFY_SUCCESS', `Validated ${transmissionId}`, 'OK');
      } else {
        addAuditEntry('VERIFY_REJECT', `Rejected ${transmissionId}`, 'WARN');
      }
      setPendingTransmissions(prev => prev.filter(t => t.id !== transmissionId));
    }
  }, [pendingTransmissions, user, addAuditEntry]);

  const handlePostAnnouncement = useCallback((message: string) => {
    if (!user || !user.department) return;
    const newAnnouncement: Announcement = {
      id: Math.random().toString(36).substr(2, 9).toUpperCase(),
      department: user.department, senderName: user.name, message, timestamp: new Date().toISOString()
    };
    setAnnouncements(prev => [newAnnouncement, ...prev].slice(0, 50));
    addAuditEntry('DEPT_BROADCAST', `Post to ${user.department}`, 'OK');
  }, [user, addAuditEntry]);

  const handleDeleteAnnouncement = useCallback((id: string) => {
    setAnnouncements(prev => prev.filter(a => a.id !== id));
    addAuditEntry('DEPT_BROADCAST_RM', `Broadcast removed`, 'INFO');
  }, [addAuditEntry]);

  const handleDeleteUser = useCallback((userId: string, userName: string) => {
    setRegistry(prev => prev.filter(u => u.name !== userName));
    setAdminUsers(prev => {
      const updated: Record<string, string[]> = {};
      Object.keys(prev).forEach(dept => { 
        updated[dept] = prev[dept].filter((u: string) => u !== userName); 
      });
      return updated;
    });
    addAuditEntry('ADMIN_DECOMMISSION', `Removed ${userName}`, 'WARN');
  }, [addAuditEntry]);

  const handleUpdateRegistry = useCallback((newRegistry: any[]) => {
    setRegistry(newRegistry);
  }, []);

  const handleUpdateAdminUsers = useCallback((newAdminUsers: Record<string, string[]>) => {
    setAdminUsers(newAdminUsers);
  }, []);

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <LoginCard onLogin={handleLogin} onAddAuditEntry={addAuditEntry} registry={registry} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar 
        user={user} onLogout={handleLogout} notifications={notifications} 
        onDeleteNotification={deleteNotification} validatedStats={validatedStats[user.id]}
        registry={registry} onUpdateRegistry={handleUpdateRegistry}
      />
      <main className="max-w-[1800px] mx-auto px-4 md:px-12 py-8">
        <Dashboard 
          user={user} pendingTransmissions={pendingTransmissions} transmissionHistory={transmissionHistory}
          validatedStats={validatedStats} auditLogs={auditLogs} announcements={announcements}
          registry={registry} adminUsers={adminUsers}
          onTransmit={handleTransmit} onValidate={handleValidate} onPostAnnouncement={handlePostAnnouncement}
          onDeleteAnnouncement={handleDeleteAnnouncement} onAddAuditEntry={addAuditEntry} onDeleteUser={handleDeleteUser}
          onUpdateRegistry={handleUpdateRegistry} onUpdateAdminUsers={handleUpdateAdminUsers}
        />
      </main>
    </div>
  );
};

export default App;