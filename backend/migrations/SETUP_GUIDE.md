# Database Setup Guide

## Quick Start (New Installation)

For new installations, use the consolidated setup file instead of running migrations individually.

### Single-File Setup (Recommended)

1. **Open Supabase Dashboard**
   - Navigate to your project
   - Go to SQL Editor

2. **Run the Complete Setup**
   ```sql
   -- Copy and paste the contents of complete_setup.sql
   ```
   - Open `complete_setup.sql`
   - Copy all contents
   - Paste into Supabase SQL Editor
   - Click "Run"

3. **Create Admin User**
   - Go to Authentication → Users
   - Click "Add user"
   - Create user with admin email
   - Copy the user's UUID

4. **Add Admin to Database**
   - Go back to SQL Editor
   - Run:
   ```sql
   INSERT INTO users_profiles (id, email, role, full_name, status)
   VALUES (
     'paste-admin-uuid-here',
     'admin@yourcompany.com',
     'admin',
     'Admin Name',
     'active'
   );
   ```

5. **Done!** Your database is ready to use.

## What's Included

The `complete_setup.sql` file includes everything from the original migrations:

### From 001_complete_schema.sql:
- ✅ All 7 core tables (companies, users_profiles, hr_requests, jobs, resumes, ats_scores, audit_logs)
- ✅ Indexes for performance optimization
- ✅ Row Level Security (RLS) policies
- ✅ Automated timestamp triggers
- ✅ Comprehensive documentation

### From 002_fix_users_profiles_rls.sql:
- ✅ INSERT policy for users_profiles (allows user registration)

### From 003_add_job_fields.sql:
- ✅ Additional job fields (location, salary_range, employment_type, closing_date, company_name)
- ✅ Indexes for new fields

## Tables Created

1. **companies** - Multi-tenant company management
2. **users_profiles** - Extended user info (linked to Supabase Auth)
3. **hr_requests** - HR role approval workflow
4. **jobs** - Job postings with full details
5. **resumes** - Candidate applications
6. **ats_scores** - AI-powered scoring results
7. **audit_logs** - Security and compliance tracking

## Row Level Security (RLS)

The setup enables RLS on all sensitive tables:
- Users can only see their own profiles
- Candidates can only see their own applications and scores
- Job listings are publicly readable (active jobs only)
- Backend uses service_role key to bypass RLS for HR/Admin operations

## Verification

After running the setup, verify the installation:

```sql
-- Check all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('companies', 'users_profiles', 'hr_requests', 'jobs', 'resumes', 'ats_scores', 'audit_logs');

-- Should return 7 rows
```

## Legacy Migration Files

The individual migration files are kept for reference:
- `001_complete_schema.sql` - Original base schema
- `002_fix_users_profiles_rls.sql` - RLS fix
- `003_add_job_fields.sql` - Job fields addition

**Note:** Don't run these individually if you've already run `complete_setup.sql`

## Troubleshooting

### Issue: "relation already exists"
- This means the table already exists
- Either drop tables and re-run, or ignore the errors (IF NOT EXISTS handles this)

### Issue: RLS preventing operations
- Ensure you're using the service_role key in backend
- Check that policies are created correctly

### Issue: Admin can't perform operations
- Verify admin user was added to users_profiles table
- Check that user UUID matches between auth.users and users_profiles

## Need Help?

Refer to:
- Main project README: `backend/README.md`
- Admin setup guide: `backend/ADMIN_SETUP.md`
- Supabase documentation: https://supabase.com/docs
