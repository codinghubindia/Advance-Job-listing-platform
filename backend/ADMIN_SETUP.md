# Admin User Setup Guide

This guide will help you create the admin user needed for testing and system management.

## Prerequisites

- ✅ Supabase project created
- ✅ Database schema migrated (`migrations/001_complete_schema.sql` executed)
- ✅ `.env` file configured with credentials

## Step-by-Step Admin Creation

### Step 1: Create Admin User in Supabase Auth

1. **Go to Supabase Dashboard**
   - Open your browser and go to https://supabase.com
   - Navigate to your project: `gyxvbkhxwdlpublloifc`

2. **Create Auth User**
   - Click on **Authentication** (left sidebar)
   - Click on **Users** tab
   - Click **Add User** button (top right)
   - Fill in the form:
     - **Email:** `admin@atsengine.com`
     - **Password:** `Admin@123456`
     - **Auto Confirm User:** ✅ Check this box (important!)
   - Click **Create User**

3. **Copy the User UID**
   - After creation, you'll see the new user in the list
   - Click on the user to view details
   - **Copy the User UID** (it looks like: `a1b2c3d4-e5f6-7890-abcd-ef1234567890`)
   - Keep this UID handy for the next step

### Step 2: Insert Admin Profile in Database

1. **Open SQL Editor**
   - In Supabase Dashboard, click **SQL Editor** (left sidebar)
   - Click **New query**

2. **Run This SQL** (replace `YOUR-USER-UID` with the copied UID):

```sql
-- Insert admin user profile
INSERT INTO users_profiles (id, email, role, full_name, status)
VALUES (
  'YOUR-USER-UID-HERE',  -- Replace with the UID you copied
  'admin@atsengine.com',
  'admin',
  'System Administrator',
  'active'
) ON CONFLICT (id) DO UPDATE SET
  role = 'admin',
  status = 'active';
```

3. **Click "Run"** to execute the query

4. **Verify Success**
   - You should see: `Success. No rows returned`
   - This means the admin profile was created!

### Step 3: Verify Admin User

1. **Run Verification Query** in SQL Editor:

```sql
-- Verify admin user exists
SELECT 
  id,
  email,
  role,
  full_name,
  status,
  created_at
FROM users_profiles
WHERE email = 'admin@atsengine.com';
```

2. **Expected Output:**
   ```
   id: [your-uid]
   email: admin@atsengine.com
   role: admin
   full_name: System Administrator
   status: active
   created_at: [timestamp]
   ```

### Step 4: Test Admin Login

1. **Using cURL:**
   ```bash
   curl -X POST http://localhost:3000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@atsengine.com","password":"Admin@123456"}'
   ```

2. **Expected Response:**
   ```json
   {
     "success": true,
     "data": {
       "user": {
         "id": "...",
         "email": "admin@atsengine.com",
         "role": "admin"
       },
       "session": {
         "access_token": "eyJ..."
       }
     }
   }
   ```

## Quick Reference

### Admin Credentials (from .env)

```
Email: admin@atsengine.com
Password: Admin@123456
```

### Admin Capabilities

The admin user can:
- ✅ View all HR requests (`GET /api/admin/hr-requests`)
- ✅ Approve HR requests (`PUT /api/admin/hr-requests/:id/approve`)
- ✅ Reject HR requests (`PUT /api/admin/hr-requests/:id/reject`)
- ✅ View all users (`GET /api/admin/users`)
- ✅ Manage user roles (`PUT /api/admin/users/:id/role`)
- ✅ Suspend/reactivate users (`PUT /api/admin/users/:id/suspend`)
- ✅ View dashboard statistics (`GET /api/admin/dashboard`)
- ✅ Delete jobs and applications
- ✅ Access all API endpoints

## Troubleshooting

### ❌ Error: "Email Already Exists" in Supabase Auth

**Solution:** 
- User already exists, just get the UID from the existing user
- Or delete the old user and create a new one

### ❌ Error: "Foreign key violation" in SQL

**Solution:**
- Make sure you created the Auth user FIRST (Step 1)
- The UID in SQL must match the Auth user UID exactly

### ❌ Error: "Login failed" or "Invalid credentials"

**Solution:**
1. Check Auth user was created with **Auto Confirm** checked
2. Verify email/password in `.env` matches Supabase Auth
3. Try resetting password in Supabase Auth Dashboard

### ❌ Error: "Insufficient permissions"

**Solution:**
- Check `users_profiles` table has `role = 'admin'` (not 'candidate' or 'hr_approved')
- Re-run the INSERT query with `ON CONFLICT` to update the role

## Next Steps

After admin setup:
1. ✅ Admin user is ready
2. 🧪 Run tests: `npm test`
3. 🚀 Start using the API

---

**Need Help?** Check [README.md](README.md) for API documentation.
