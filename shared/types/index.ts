// User Roles
export type UserRole = 'SUPER_ADMIN' | 'MARKETING_MANAGER' | 'TEAM_LEADER' | 'FIELD_AGENT';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  avatarUrl?: string;
  teamId?: string;
  teamName?: string;
  createdAt: string;
}

// Lead Statuses
export type LeadStatus =
  | 'New'
  | 'Assigned'
  | 'Contacted'
  | 'Interested'
  | 'Meeting Scheduled'
  | 'Converted'
  | 'Registered'
  | 'Onboarded'
  | 'Lost';

export interface Lead {
  id: string;
  leadCode: string;
  customerName: string;
  mobileNumber: string;
  email?: string;
  address?: string;
  city: string;
  state: string;
  leadSource: string;
  interestedService: string;
  assignedAgentId?: string;
  assignedAgentName?: string;
  teamId?: string;
  teamName?: string;
  status: LeadStatus;
  remarks?: string;
  createdAt: string;
  updatedAt: string;
}

// Agent
export interface Agent {
  id: string;
  agentCode: string;
  name: string;
  email: string;
  phone: string;
  photoUrl?: string;
  teamId?: string;
  teamName?: string;
  joiningDate: string;
  status: 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE';
  targetLeadsMonthly?: number;
  completedVisitsCount?: number;
  conversionCount?: number;
}

// Team
export interface Team {
  id: string;
  teamName: string;
  teamLeaderId: string;
  teamLeaderName: string;
  agentCount: number;
  leadCount: number;
  conversionCount: number;
  createdAt: string;
}

// Attendance
export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'HALF_DAY' | 'ON_LEAVE';

export interface AttendanceRecord {
  id: string;
  agentId: string;
  agentName: string;
  agentCode: string;
  date: string;
  checkInTime?: string;
  checkOutTime?: string;
  workingHours?: number;
  status: AttendanceStatus;
  checkInLocation?: {
    lat: number;
    lng: number;
    address?: string;
  };
  checkOutLocation?: {
    lat: number;
    lng: number;
    address?: string;
  };
}

// Visit
export interface VisitRecord {
  id: string;
  agentId: string;
  agentName: string;
  customerName: string;
  leadId: string;
  leadCode: string;
  visitDate: string;
  visitTime: string;
  location: {
    lat: number;
    lng: number;
    address?: string;
  };
  remarks: string;
  visitStatus: 'COMPLETED' | 'CANCELLED' | 'RESCHEDULED';
  photoUrls?: string[];
}

// Follow-up / Task
export type TaskType = 'Call' | 'Meeting' | 'Customer Visit' | 'Demo' | 'Documentation' | 'Other';
export type TaskStatus = 'PENDING' | 'COMPLETED' | 'OVERDUE' | 'CANCELLED';

export interface FollowupTask {
  id: string;
  leadId: string;
  leadCode: string;
  customerName: string;
  customerPhone: string;
  assignedAgentId: string;
  assignedAgentName: string;
  dueDate: string;
  dueTime: string;
  taskType: TaskType;
  status: TaskStatus;
  remarks?: string;
  createdAt: string;
}

// API Pagination & Response Generic
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  meta?: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

