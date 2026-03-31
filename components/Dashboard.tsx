import React from 'react';
import { User, UserRole, Transmission, SystemStats, AuditEntry, Announcement } from '../types';
import EmployeeDashboard from '../src/dashboards/EmployeeDashboard.tsx';
import SupervisorDashboard from '../src/dashboards/SupervisorDashboard.tsx';
import AdminDashboard from '../src/dashboards/AdminDashboard.tsx';

interface DashboardProps {
  user: User;
  pendingTransmissions: Transmission[];
  transmissionHistory: Transmission[];
  validatedStats: Record<string, SystemStats>;
  auditLogs: AuditEntry[];
  announcements: Announcement[];
  onTransmit: (t: Transmission) => void;
  onValidate: (id: string, overrides?: SystemStats, status?: 'validated' | 'rejected') => void;
  onPostAnnouncement: (message: string) => void;
  onDeleteAnnouncement: (id: string) => void;
  onAddAuditEntry: (action: string, details: string, type?: 'INFO' | 'OK' | 'WARN', userName?: string) => void;
  onDeleteUser: (userId: string, userName: string) => void;
  registry: any[];
  adminUsers: Record<string, string[]>;
  onUpdateRegistry: (newRegistry: any[]) => void;
  onUpdateAdminUsers: (newAdminUsers: Record<string, string[]>) => void;
}

const Dashboard: React.FC<DashboardProps> = (props) => {
  const { user, auditLogs, onAddAuditEntry, onDeleteUser } = props;

  switch (user.role) {
    case UserRole.EMPLOYEE:
      return (
        <EmployeeDashboard 
          user={props.user}
          pendingTransmissions={props.pendingTransmissions}
          transmissionHistory={props.transmissionHistory}
          announcements={props.announcements}
          onTransmit={props.onTransmit}
          validatedStats={props.validatedStats[user.id]}
        />
      );
    case UserRole.SUPERVISOR:
    case UserRole.DEPARTMENT_HEAD:
      return <SupervisorDashboard {...props} />;
    case UserRole.ADMIN:
      return (
        <AdminDashboard 
          user={user} 
          auditLogs={auditLogs} 
          registry={props.registry}
          adminUsers={props.adminUsers}
          onAddAuditEntry={onAddAuditEntry} 
          onDeleteUser={onDeleteUser}
          onUpdateRegistry={props.onUpdateRegistry}
          onUpdateAdminUsers={props.onUpdateAdminUsers}
        />
      );
    default:
      return (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Access Violation</h1>
            <p className="text-slate-400 font-medium uppercase text-[10px] tracking-widest">Unauthorized role profile detected.</p>
          </div>
        </div>
      );
  }
};

export default Dashboard;