// User types
export type UserRole = 'candidate' | 'hr_pending' | 'hr_approved' | 'admin';
export type UserStatus = 'active' | 'suspended' | 'deleted';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  fullName?: string;
  phone?: string;
  companyName?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Auth types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  role: 'candidate' | 'hr';
  fullName?: string;
  phone?: string;
  companyName?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

// Job types
export type JobStatus = 'open' | 'closed' | 'paused' | 'active';

export interface Job {
  id: string; // database internal ID
  job_id: string; // unique job identifier (JOB-xxx)
  hrId: string;
  companyName?: string;
  company_name?: string; // snake_case from backend
  title: string;
  description: string;
  requirements?: string;
  location?: string;
  salaryRange?: string;
  salary_range?: string; // snake_case from backend
  employmentType?: string;
  employment_type?: string; // snake_case from backend
  status: JobStatus;
  postedDate?: string;
  closingDate?: string;
  closing_date?: string; // snake_case from backend
  createdAt?: string;
  created_at?: string; // snake_case from backend
  updatedAt?: string;
  created_by?: string; // user ID who created the job
}

export interface CreateJobDto {
  title: string;
  description: string;
  requirements: string;
  location?: string;
  salaryRange?: string;
  employmentType?: string;
  closingDate?: string;
}

// Application/Score types
export interface ATSScore {
  id: number;
  resume_id: number;
  job_id: string;
  match_score: number;
  shortlist_probability: number;
  salary_range: {
    min: number;
    max: number;
  };
  missing_skills: string[];
  strong_skills: string[];
  recommendation: string;
  key_highlights: string[];
  areas_of_concern: string[];
  email_sent: boolean;
  created_at: string;
  resumes?: {
    id: number;
    job_id: string;
    cloudinary_url: string;
    parsed_data: any;
    uploaded_at: string;
    candidate_user_id: string;
  };
  job?: Job;
}

// HR Request types
export type HRRequestStatus = 'pending' | 'approved' | 'rejected';

export interface HRRequest {
  id: string;
  userId: string;
  userEmail: string;
  companyName: string;
  status: HRRequestStatus;
  requestedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  adminNotes?: string;
  rejectionReason?: string;
}

// Admin types
export interface HRRequestStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

export interface UserStats {
  total: number;
  candidates: number;
  hrPending: number;
  hrApproved: number;
  admins: number;
  active: number;
  suspended: number;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
