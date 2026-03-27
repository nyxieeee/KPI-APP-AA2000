export enum UserRole {
  EMPLOYEE = 'Employee',
  SUPERVISOR = 'Supervisor',
  DEPARTMENT_HEAD = 'Department Head',
  ADMIN = 'Admin'
}

export interface SystemStats {
  responseTime: string;
  accuracy: string;
  uptime: string;
  supervisorComment?: string;
  ratings?: {
    performance: number;
    proficiency: number;
    professionalism: number;
    finalScore: number;
    incentivePct: number;
    // Extended ratings for specific departments like Marketing
    marketingMetrics?: {
      leadGen: number;
      execution: number;
      salesEnable: number;
      revenue: number;
      responsibilities: number;
      attendance: number;
    };
    salesMetrics?: {
      revenueScore: number;
      accountsScore: number;
      activitiesScore: number;
      quotationScore: number;
      attendanceScore: number;
      additionalRespScore: number;
    };
    accountingMetrics?: {
      auditScore: number;
      taxScore: number;
      apArScore: number;
      budgetScore: number;
      attendanceScore: number;
      additionalRespScore: number;
    };
  };
}

export interface Transmission extends SystemStats {
  id: string;
  userId: string;
  userName: string;
  timestamp: string;
  jobId: string;
  clientSite: string;
  jobType: string;
  systemStatus: string;
  projectReport?: string;
  attachments?: { name: string, type: string, size: string, data?: string }[];
  status?: 'validated' | 'rejected';
  startTime?: string;
  endTime?: string;
  pmChecklist?: Record<string, any>;
  revenueValue?: number;
  accountsClosedValue?: number;
  // Multi-category data for Sales department
  allSalesData?: Record<string, {
    checklist: Record<string, boolean>;
    revenue: number;
    accountsClosed: number;
    status: string;
    // Sales Activity specific metrics
    activities?: {
      quotations: number;
      meetings: number;
      calls: number;
    };
    attendance?: {
      days: number;
      late: number;
      violations: number;
    };
    quotationMgmt?: {
      onTime: number;
      errorFree: number;
      followedUp: number;
      total: number;
    };
  }>;
}

export interface AuditEntry {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  details: string;
  type: 'INFO' | 'OK' | 'WARN';
}

export interface SystemNotification {
  id: string;
  targetUserId: string;
  message: string;
  timestamp: string;
  type: 'INFO' | 'SUCCESS' | 'ALERT';
}

export interface Announcement {
  id: string;
  department: string;
  senderName: string;
  message: string;
  timestamp: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  baseSalary: number;
  incentiveTarget: number;
  department?: string;
}

export interface AppState {
  user: User | null;
  isAuthenticated: boolean;
}