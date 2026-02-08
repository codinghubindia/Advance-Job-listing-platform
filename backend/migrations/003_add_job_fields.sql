-- =====================================================
-- Add missing columns to jobs table
-- =====================================================

-- Add location column
ALTER TABLE jobs
ADD COLUMN IF NOT EXISTS location TEXT;

-- Add salary_range column  
ALTER TABLE jobs
ADD COLUMN IF NOT EXISTS salary_range TEXT;

-- Add employment_type column
ALTER TABLE jobs
ADD COLUMN IF NOT EXISTS employment_type TEXT;

-- Add closing_date column
ALTER TABLE jobs
ADD COLUMN IF NOT EXISTS closing_date TIMESTAMP;

-- Add company_name column for denormalization
ALTER TABLE jobs
ADD COLUMN IF NOT EXISTS company_name TEXT;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_jobs_location ON jobs(location);
CREATE INDEX IF NOT EXISTS idx_jobs_employment_type ON jobs(employment_type);
CREATE INDEX IF NOT EXISTS idx_jobs_closing_date ON jobs(closing_date);

-- Add comment
COMMENT ON TABLE jobs IS 'Job postings with complete details including location, salary, and employment type';

