-- =====================================================
-- ATS SCORE ENGINE - COMPLETE DATABASE SETUP
-- =====================================================
-- Description: Single consolidated setup file including authentication,
--              RBAC, jobs, resumes, and ATS scoring
-- Version: 2.0 (Consolidated)
-- Date: 2026-02-08
-- =====================================================

-- =====================================================
-- 1. COMPANIES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS companies (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  status TEXT DEFAULT 'active' CHECK (status IN ('pending', 'active', 'suspended')),
  created_by UUID,  -- Will reference users_profiles.id
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for companies
CREATE INDEX IF NOT EXISTS idx_companies_name ON companies(name);
CREATE INDEX IF NOT EXISTS idx_companies_status ON companies(status);
CREATE INDEX IF NOT EXISTS idx_companies_created_at ON companies(created_at DESC);

-- =====================================================
-- 2. USER PROFILES TABLE
-- =====================================================
-- Stores additional user information linked to Supabase auth.users
CREATE TABLE IF NOT EXISTS users_profiles (
  id UUID PRIMARY KEY,  -- Must match auth.users.id from Supabase Auth
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('candidate', 'hr_pending', 'hr_approved', 'admin')),
  full_name TEXT,
  phone TEXT,
  company_id BIGINT REFERENCES companies(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'deleted')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for users_profiles
CREATE INDEX IF NOT EXISTS idx_users_profiles_email ON users_profiles(email);
CREATE INDEX IF NOT EXISTS idx_users_profiles_role ON users_profiles(role);
CREATE INDEX IF NOT EXISTS idx_users_profiles_status ON users_profiles(status);
CREATE INDEX IF NOT EXISTS idx_users_profiles_company_id ON users_profiles(company_id);

-- Add foreign key to companies.created_by
ALTER TABLE companies ADD CONSTRAINT fk_companies_created_by 
  FOREIGN KEY (created_by) REFERENCES users_profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_companies_created_by ON companies(created_by);

-- =====================================================
-- 3. HR REQUESTS TABLE
-- =====================================================
-- Tracks HR role approval requests
CREATE TABLE IF NOT EXISTS hr_requests (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users_profiles(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  company_domain TEXT,
  job_title TEXT,
  phone TEXT,
  message TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES users_profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP,
  rejection_reason TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for hr_requests
CREATE INDEX IF NOT EXISTS idx_hr_requests_user_id ON hr_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_hr_requests_status ON hr_requests(status);
CREATE INDEX IF NOT EXISTS idx_hr_requests_reviewed_by ON hr_requests(reviewed_by);
CREATE INDEX IF NOT EXISTS idx_hr_requests_created_at ON hr_requests(created_at DESC);

-- =====================================================
-- 4. JOBS TABLE
-- =====================================================
-- Job postings created by HR users
CREATE TABLE IF NOT EXISTS jobs (
  id BIGSERIAL PRIMARY KEY,
  job_id VARCHAR(255) UNIQUE NOT NULL,
  company_id BIGINT REFERENCES companies(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  requirements TEXT,
  hr_email VARCHAR(255) NOT NULL,
  hr_name VARCHAR(255),
  location TEXT,
  salary_range TEXT,
  employment_type TEXT,
  closing_date TIMESTAMP,
  company_name TEXT,
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'closed', 'draft')),
  created_by UUID REFERENCES users_profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for jobs
CREATE INDEX IF NOT EXISTS idx_jobs_job_id ON jobs(job_id);
CREATE INDEX IF NOT EXISTS idx_jobs_company_id ON jobs(company_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_created_by ON jobs(created_by);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_location ON jobs(location);
CREATE INDEX IF NOT EXISTS idx_jobs_employment_type ON jobs(employment_type);
CREATE INDEX IF NOT EXISTS idx_jobs_closing_date ON jobs(closing_date);

-- =====================================================
-- 5. RESUMES TABLE
-- =====================================================
-- Candidate resumes/applications
CREATE TABLE IF NOT EXISTS resumes (
  id BIGSERIAL PRIMARY KEY,
  job_id VARCHAR(255) NOT NULL,
  candidate_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cloudinary_url TEXT NOT NULL,
  parsed_data JSONB,
  uploaded_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for resumes
CREATE INDEX IF NOT EXISTS idx_resumes_job_id ON resumes(job_id);
CREATE INDEX IF NOT EXISTS idx_resumes_candidate_user_id ON resumes(candidate_user_id);
CREATE INDEX IF NOT EXISTS idx_resumes_uploaded_at ON resumes(uploaded_at DESC);

-- Unique constraint to prevent duplicate applications
CREATE UNIQUE INDEX IF NOT EXISTS idx_resumes_unique_application 
ON resumes(candidate_user_id, job_id);

-- =====================================================
-- 6. ATS SCORES TABLE
-- =====================================================
-- ATS scoring results for resumes
CREATE TABLE IF NOT EXISTS ats_scores (
  id BIGSERIAL PRIMARY KEY,
  resume_id BIGINT NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
  job_id VARCHAR(255) NOT NULL,
  match_score INTEGER CHECK (match_score >= 0 AND match_score <= 100),
  shortlist_probability DECIMAL(5,2) CHECK (shortlist_probability >= 0 AND shortlist_probability <= 1),
  salary_range JSONB,
  missing_skills JSONB,
  strong_skills JSONB,
  recommendation TEXT,
  key_highlights JSONB,
  areas_of_concern JSONB,
  email_sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for ats_scores
CREATE INDEX IF NOT EXISTS idx_ats_scores_resume_id ON ats_scores(resume_id);
CREATE INDEX IF NOT EXISTS idx_ats_scores_job_id ON ats_scores(job_id);
CREATE INDEX IF NOT EXISTS idx_ats_scores_match_score ON ats_scores(match_score DESC);
CREATE INDEX IF NOT EXISTS idx_ats_scores_email_sent ON ats_scores(email_sent);
CREATE INDEX IF NOT EXISTS idx_ats_scores_created_at ON ats_scores(created_at DESC);

-- =====================================================
-- 7. AUDIT LOG TABLE
-- =====================================================
-- Tracks important system actions for security and compliance
CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES users_profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  details JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for audit_logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_type ON audit_logs(resource_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- =====================================================
-- 8. FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to tables with updated_at columns
DROP TRIGGER IF EXISTS update_users_profiles_updated_at ON users_profiles;
CREATE TRIGGER update_users_profiles_updated_at
  BEFORE UPDATE ON users_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_companies_updated_at ON companies;
CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON companies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_hr_requests_updated_at ON hr_requests;
CREATE TRIGGER update_hr_requests_updated_at
  BEFORE UPDATE ON hr_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_jobs_updated_at ON jobs;
CREATE TRIGGER update_jobs_updated_at
  BEFORE UPDATE ON jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 9. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on sensitive tables
ALTER TABLE users_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ats_scores ENABLE ROW LEVEL SECURITY;

-- ========== Users Profiles Policies ==========

-- Users can read their own profile
DROP POLICY IF EXISTS users_profiles_select_own ON users_profiles;
CREATE POLICY users_profiles_select_own ON users_profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile (backend handles role changes)
DROP POLICY IF EXISTS users_profiles_update_own ON users_profiles;
CREATE POLICY users_profiles_update_own ON users_profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Users can create their own profile during registration
DROP POLICY IF EXISTS users_profiles_insert_own ON users_profiles;
CREATE POLICY users_profiles_insert_own ON users_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ========== HR Requests Policies ==========

-- HR requests: users can view their own requests
DROP POLICY IF EXISTS hr_requests_select_own ON hr_requests;
CREATE POLICY hr_requests_select_own ON hr_requests
  FOR SELECT
  USING (auth.uid() = user_id);

-- HR requests: users can create their own requests
DROP POLICY IF EXISTS hr_requests_insert_own ON hr_requests;
CREATE POLICY hr_requests_insert_own ON hr_requests
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ========== Jobs Policies ==========

-- Jobs: Public read for candidates to browse
DROP POLICY IF EXISTS jobs_select_public ON jobs;
CREATE POLICY jobs_select_public ON jobs
  FOR SELECT
  USING (status = 'active');

-- ========== Resumes Policies ==========

-- Resumes: Candidates can view their own applications
DROP POLICY IF EXISTS resumes_select_own ON resumes;
CREATE POLICY resumes_select_own ON resumes
  FOR SELECT
  USING (auth.uid() = candidate_user_id);

-- Resumes: Candidates can insert their own applications
DROP POLICY IF EXISTS resumes_insert_own ON resumes;
CREATE POLICY resumes_insert_own ON resumes
  FOR INSERT
  WITH CHECK (auth.uid() = candidate_user_id);

-- ========== ATS Scores Policies ==========

-- ATS Scores: Candidates can view their own scores
DROP POLICY IF EXISTS ats_scores_select_own ON ats_scores;
CREATE POLICY ats_scores_select_own ON ats_scores
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM resumes 
      WHERE resumes.id = ats_scores.resume_id 
      AND resumes.candidate_user_id = auth.uid()
    )
  );

-- Note: Backend uses service_role key which bypasses RLS for HR/Admin operations

-- =====================================================
-- 10. TABLE COMMENTS (Documentation)
-- =====================================================

COMMENT ON TABLE companies IS 'Company information for multi-tenant support';
COMMENT ON TABLE users_profiles IS 'Extended user profiles linked to Supabase auth.users';
COMMENT ON TABLE hr_requests IS 'HR role approval workflow - tracks pending/approved/rejected requests';
COMMENT ON TABLE jobs IS 'Job postings with complete details including location, salary, and employment type';
COMMENT ON TABLE resumes IS 'Candidate resumes/applications for jobs';
COMMENT ON TABLE ats_scores IS 'ATS scoring results from LLM analysis';
COMMENT ON TABLE audit_logs IS 'Audit trail for important system actions';

COMMENT ON COLUMN users_profiles.role IS 'User role: candidate (apply for jobs), hr_pending (awaiting approval), hr_approved (can post jobs), admin (full access)';
COMMENT ON COLUMN users_profiles.status IS 'Account status: active (normal), suspended (blocked), deleted (soft delete)';
COMMENT ON COLUMN hr_requests.status IS 'Request status: pending (awaiting review), approved (user promoted), rejected (declined)';
COMMENT ON COLUMN jobs.status IS 'Job status: active (accepting applications), closed (no longer hiring), draft (not published)';
COMMENT ON COLUMN resumes.candidate_user_id IS 'The candidate (user) who submitted this application';
COMMENT ON COLUMN ats_scores.match_score IS 'ATS match score (0-100) comparing resume to job description';
COMMENT ON COLUMN ats_scores.email_sent IS 'Whether HR was notified via email (for high-scoring candidates)';

COMMENT ON POLICY users_profiles_insert_own ON users_profiles IS 'Allows users to create their own profile during authentication';

-- =====================================================
-- 11. SEED DATA (Optional - for testing)
-- =====================================================

-- Example: Insert default admin user
-- NOTE: You must first create this user in Supabase Auth Dashboard
-- Then uncomment and update the UUID below

-- INSERT INTO users_profiles (id, email, role, full_name, status)
-- VALUES (
--   'YOUR-ADMIN-UUID-FROM-SUPABASE-AUTH',
--   'admin@atsengine.com',
--   'admin',
--   'System Administrator',
--   'active'
-- ) ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 12. VERIFICATION QUERY
-- =====================================================

-- Verify all tables were created successfully
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count,
  (SELECT COUNT(*) FROM pg_indexes WHERE tablename = t.table_name) as index_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
  AND table_name IN ('companies', 'users_profiles', 'hr_requests', 'jobs', 'resumes', 'ats_scores', 'audit_logs')
ORDER BY 
  CASE table_name
    WHEN 'companies' THEN 1
    WHEN 'users_profiles' THEN 2
    WHEN 'hr_requests' THEN 3
    WHEN 'jobs' THEN 4
    WHEN 'resumes' THEN 5
    WHEN 'ats_scores' THEN 6
    WHEN 'audit_logs' THEN 7
  END;

-- =====================================================
-- SETUP COMPLETE ✓
-- =====================================================
-- This consolidated setup file includes:
-- ✓ Complete database schema (7 tables)
-- ✓ All indexes for optimal performance
-- ✓ Row Level Security policies for data protection
-- ✓ Automated timestamp triggers
-- ✓ INSERT policy for user registration
-- ✓ Additional job fields (location, salary, employment type, etc.)
-- ✓ Audit logging system
-- ✓ Comprehensive documentation
--
-- Next steps:
-- 1. Run this SQL file in your Supabase SQL Editor
-- 2. Create admin user in Supabase Auth Dashboard
-- 3. Update the seed data section with admin UUID
-- 4. Configure environment variables (.env)
-- 5. Run: npm install
-- 6. Start: npm run dev
-- =====================================================
