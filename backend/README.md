# ATS Score Engine

An AI-powered Applicant Tracking System (ATS) scoring engine built with Node.js, Express, PostgreSQL (Supabase), and integrated with resume parsing and LLM-based scoring. Features comprehensive authentication, role-based access control (RBAC), and multi-company support.

## Features

- 📄 Resume upload and parsing via external API
- 🤖 AI-powered ATS scoring using LLM
- ☁️ Cloud storage with Cloudinary
- 📊 PostgreSQL database via Supabase
- 📧 Automated email notifications for high-scoring candidates
- 🔄 RESTful API architecture
- 🔐 Supabase Auth integration with JWT
- 👥 Role-based access control (RBAC)
- ✅ HR approval workflow
- 🏢 Multi-company support

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** PostgreSQL (Supabase)
- **Authentication:** Supabase Auth with JWT
- **Storage:** Cloudinary
- **Resume Parser:** APILayer Resume Parser API
- **AI Scoring:** LLM API (Gemini-compatible)
- **Email:** Nodemailer
- **File Upload:** Multer
- **Security:** bcryptjs, jsonwebtoken

## Prerequisites

- Node.js 16+ installed
- Supabase account and project
- Cloudinary account
- Resume Parser API key
- LLM API key (Gemini or compatible)
- SMTP credentials for email

## Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd ats-score-engine
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and fill in your actual credentials:
   - **Supabase**: URL and service role key from your Supabase project settings
   - **Cloudinary**: Cloud name, API key, and API secret for resume storage
   - **Resume Parser**: APILayer API key (get from https://apilayer.com/marketplace/resume_parser-api)
   - **Gemini AI**: API key from Google AI Studio (https://aistudio.google.com/app/apikey)
     - The system uses the `gemini-2.0-flash-exp` model for ATS scoring
   - **SMTP**: Email credentials for automated notifications (Gmail recommended)

4. **Set up database tables:**
   
   **Step 1:** Run the main schema migration:
   
   Run `migrations/001_complete_schema.sql` in your Supabase SQL editor. This file creates:
   
   **Tables:**
   - `companies` - Company information for multi-tenant support
   - `users_profiles` - User authentication profiles (linked to Supabase Auth)
   - `hr_requests` - HR approval workflow
   - `jobs` - Job postings created by HR users
   - `resumes` - Candidate applications (with unique constraint per job)
   - `ats_scores` - ATS scoring results from LLM
   - `audit_logs` - Security audit trail

   **Additional Setup:**
   - Row Level Security (RLS) policies for data isolation
   - Optimized indexes for performance
   - Triggers for automatic timestamp updates
   - Foreign key constraints with cascading deletes
   - Check constraints for data validation
   
   Simply copy the entire contents of `migrations/001_complete_schema.sql` and paste it into the Supabase SQL Editor, then click "Run".

   **Step 2:** Run additional migrations (if needed):
   
   Run `migrations/003_add_job_fields.sql` to add extended job fields:
   - Company name, location, salary range
   - Employment type, closing date
   - Enhanced job posting information
   
   Copy the contents and run it in the Supabase SQL Editor after the main schema is created.

5. **Create an admin user:**
   
   After running the migration, create your first admin user:
   
   **Step 1:** Go to Supabase Dashboard → Authentication → Users → Add User
   - Create a user with email and password
   - Copy the User UID
   
   **Step 2:** Run this SQL in Supabase SQL Editor:
   ```sql
   INSERT INTO users_profiles (id, email, role, full_name, status)
   VALUES (
     'YOUR-COPIED-USER-UID',
     'admin@yourcompany.com',
     'admin',
     'System Administrator',
     'active'
   );
   ```
   
   This admin can now approve HR requests and manage the system.

## Usage

### Development Mode

```bash
npm run dev
```

The server will start on `http://localhost:3000` with auto-reload enabled.

### Production Mode

```bash
npm start
```

## Authentication & Authorization

### User Roles

The system implements a 4-tier role-based access control system:

| Role | Description | Permissions |
|------|-------------|-------------|
| **candidate** | Job applicants | Can register and view own profile |
| **hr_pending** | HR users awaiting approval | Limited access until admin approves |
| **hr_approved** | Approved HR users | Can create jobs, upload resumes, view scores |
| **admin** | System administrators | Full access, can approve HR requests, manage users |

### Authentication Flow

#### 1. Registration

**Endpoint:** `POST /api/auth/register`

**For Candidates:**
```json
{
  "email": "candidate@example.com",
  "password": "securePassword123",
  "role": "candidate",
  "fullName": "John Doe",
  "phone": "+1234567890"
}
```

**For HR Users:**
```json
{
  "email": "hr@company.com",
  "password": "securePassword123",
  "role": "hr",
  "companyName": "Tech Corp Inc.",
  "fullName": "Jane Smith",
  "phone": "+1234567890"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "user": {
      "id": "uuid",
      "email": "hr@company.com",
      "role": "hr_pending",
      "fullName": "Jane Smith",
      "status": "active"
    },
    "session": {
      "access_token": "eyJhbGc...",
      "refresh_token": "...",
      "expires_at": 1234567890
    },
    "hrRequest": {
      "id": 1,
      "companyName": "Tech Corp Inc.",
      "status": "pending",
      "message": "HR request pending admin approval"
    }
  }
}
```

**HR Registration Flow:**
1. HR user registers with `role: "hr"`
2. System creates user with `hr_pending` role
3. System automatically creates an HR request for admin approval
4. HR user receives JWT token but has limited access
5. Admin reviews and approves/rejects the request
6. Upon approval, user role changes to `hr_approved` and company is created

#### 2. Login

**Endpoint:** `POST /api/auth/login`

```json
{
  "email": "hr@company.com",
  "password": "securePassword123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "hr@company.com",
      "role": "hr_approved",
      "fullName": "Jane Smith",
      "companyId": 5,
      "status": "active"
    },
    "session": {
      "access_token": "eyJhbGc...",
      "refresh_token": "...",
      "expires_at": 1234567890
    }
  }
}
```

#### 3. Using JWT Tokens

All protected endpoints require the JWT token in the Authorization header:

```bash
curl -H "Authorization: Bearer eyJhbGc..." \
  http://localhost:3000/api/auth/me
```

**Token Expiration:**
- Access tokens expire after 1 hour
- Refresh tokens expire after 7 days
- Use Supabase Auth refresh endpoint to get new tokens

### HR Approval Workflow

```
┌─────────────┐
│  HR Signup  │
└──────┬──────┘
       │
       ▼
┌──────────────────┐
│ role: hr_pending │
│ HR Request: #123 │
└──────┬───────────┘
       │
       ▼
┌────────────────┐
│ Admin Review   │
└───┬────────┬───┘
    │        │
Approve   Reject
    │        │
    ▼        ▼
┌─────────────────┐  ┌──────────────┐
│ hr_approved     │  │ Rejected     │
│ Company Created │  │ Can Re-apply │
│ Can Post Jobs   │  │              │
└─────────────────┘  └──────────────┘
```

**Admin Approval Actions:**

1. **View Pending Requests:** `GET /api/admin/hr-requests`
2. **Approve Request:** `POST /api/admin/hr-requests/:id/approve`
   ```json
   {
     "companyName": "Tech Corp Inc.",
     "notes": "Verified company details",
     "createCompany": true
   }
   ```
3. **Reject Request:** `POST /api/admin/hr-requests/:id/reject`
   ```json
   {
     "reason": "Company verification failed",
     "notes": "Please provide valid business registration"
   }
   ```

### Protected Endpoints

| Endpoint | Roles Required | Description |
|----------|---------------|-------------|
| **Job Management (HR/Admin)** |
| `POST /api/ats/jobs` | hr_approved, admin | Create job posting |
| `PUT /api/ats/jobs/:jobId` | hr_approved, admin | Update job posting |
| `DELETE /api/ats/jobs/:jobId` | admin | Delete job posting |
| **Public Job Endpoints** |
| `GET /api/ats/jobs` | None (public) | Browse all active jobs |
| `GET /api/ats/jobs/:jobId` | None (public) | View job details |
| **Candidate Application** |
| `POST /api/ats/jobs/:jobId/apply` | candidate | Apply for job with resume |
| `GET /api/ats/my-applications` | candidate | View own applications |
| `GET /api/ats/applications/:id` | candidate, hr_approved, admin | View application details |
| **HR Review Applications** |
| `GET /api/ats/jobs/:jobId/applications` | hr_approved, admin | View job applications |
| `GET /api/ats/jobs/:jobId/top-candidates` | hr_approved, admin | Get top candidates |
| `DELETE /api/ats/applications/:id` | admin | Delete application |
| **Account Management** |
| `GET /api/auth/me` | All authenticated | Get own profile |
| `PUT /api/auth/profile` | All authenticated | Update own profile |
| `POST /api/auth/logout` | All authenticated | Logout |
| **Admin Operations** |
| `GET /api/admin/*` | admin | All admin operations |

### Account Management

**View Profile:**
```bash
GET /api/auth/me
Authorization: Bearer <token>
```

**Update Profile:**
```bash
PUT /api/auth/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "fullName": "Jane Smith Updated",
  "phone": "+1987654321"
}
```

**Password Reset:**
```bash
POST /api/auth/forgot-password
Content-Type: application/json

{
  "email": "hr@company.com"
}
```

### Admin Operations

**Dashboard Statistics:**
```bash
GET /api/admin/dashboard
Authorization: Bearer <admin_token>
```

**User Management:**
```bash
# List all users
GET /api/admin/users?role=hr_approved&status=active

# Update user role
PUT /api/admin/users/:userId/role
{ "role": "admin" }

# Suspend user
POST /api/admin/users/:userId/suspend
{ "reason": "Policy violation" }

# Reactivate user
POST /api/admin/users/:userId/reactivate
```

## API Endpoints

### Job Management (HR/Admin)

#### POST `/api/ats/jobs`

Create a new job posting. **Requires hr_approved or admin role.**

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request:**
```json
{
  "jobId": "BACKEND-2026-001",
  "title": "Senior Backend Engineer",
  "description": "We are looking for an experienced backend developer...",
  "requirements": "Node.js, Express.js, PostgreSQL, AWS...",
  "hrEmail": "hr@company.com",
  "hrName": "Jane Smith",
  "status": "active"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Job created successfully",
  "data": {
    "id": 1,
    "job_id": "BACKEND-2026-001",
    "company_id": 5,
    "title": "Senior Backend Engineer",
    "status": "active",
    "created_at": "2026-02-07T12:00:00.000Z"
  }
}
```

---

#### GET `/api/ats/jobs`

Browse all active job postings. **Public endpoint - no authentication required.**

**Query Parameters:**
- `status` (optional): Filter by status (`active`, `closed`, `draft`)
- `companyId` (optional): Filter by company

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "job_id": "BACKEND-2026-001",
      "title": "Senior Backend Engineer",
      "description": "We are looking for...",
      "company_name": "Tech Corp Inc.",
      "status": "active",
      "created_at": "2026-02-07T12:00:00.000Z"
    }
  ]
}
```

---

### Candidate Application

#### POST `/api/ats/jobs/:jobId/apply`

Apply for a job with resume upload. System automatically parses, scores, and sends email notifications. **Requires candidate role.**

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: multipart/form-data
```

**Request:**
- `resume` (file): Resume file (PDF, DOC, DOCX)

**Response:**
```json
{
  "success": true,
  "message": "Application submitted successfully",
  "data": {
    "applicationId": 1,
    "resumeId": 1,
    "jobId": "BACKEND-2026-001",
    "jobTitle": "Senior Backend Engineer",
    "matchScore": 85,
    "shortlistProbability": 0.78,
    "salaryRange": {
      "min": 80000,
      "max": 120000
    },
    "missingSkills": ["Docker", "Kubernetes"],
    "strongSkills": ["JavaScript", "Node.js", "React"],
    "recommendation": "Strong candidate with excellent backend experience...",
    "emailSent": true,
    "resumeUrl": "https://res.cloudinary.com/...",
    "appliedAt": "2026-02-07T12:30:00.000Z"
  }
}
```

**Automatic Processing:**
1. Resume uploaded to Cloudinary
2. Resume parsed via Parser API
3. LLM scores candidate against job requirements
4. Email sent to HR (if match score ≥ 80)
5. Confirmation email sent to candidate

---

#### GET `/api/ats/my-applications`

View all applications submitted by the logged-in candidate. **Requires candidate role.**

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "job_id": "BACKEND-2026-001",
      "job_title": "Senior Backend Engineer",
      "company_name": "Tech Corp Inc.",
      "match_score": 85,
      "applied_at": "2026-02-07T12:30:00.000Z"
    }
  ]
}
```

---

### HR Review Applications

#### GET `/api/ats/jobs/:jobId/applications`

View all candidate applications for a specific job. **Requires hr_approved or admin role.**

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Query Parameters:**
- `minScore` (optional): Filter by minimum match score
- `emailSent` (optional): Filter by email notification status

**Response:**
```json
{
  "success": true,
  "data": {
    "jobId": "BACKEND-2026-001",
    "count": 5,
    "applications": [
      {
        "id": 1,
        "resume_id": 1,
        "match_score": 85,
        "shortlist_probability": 0.78,
        "applied_at": "2026-02-07T12:30:00.000Z",
        "resume_url": "https://res.cloudinary.com/..."
      }
    ]
  }
}
```

**Example:**
```bash
curl -X GET "http://localhost:3000/api/ats/jobs/BACKEND-2026-001/applications?minScore=80" \
  -H "Authorization: Bearer eyJhbGc..."
```

---

### Authentication Endpoints

See the [Authentication & Authorization](#authentication--authorization) section above for detailed documentation of all auth endpoints:
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user profile
- `PUT /api/auth/profile` - Update profile
- `POST /api/auth/forgot-password` - Password reset
- `POST /api/auth/logout` - Logout

### Admin Endpoints

See the [Admin Operations](#admin-operations) section above for detailed documentation of all admin endpoints.

## Project Structure

```
ats-score-engine/
├── src/
│   ├── app.js                      # Express app configuration
│   ├── server.js                   # Server entry point
│   ├── config/
│   │   ├── supabase.js            # Supabase client setup
│   │   ├── cloudinary.js          # Cloudinary configuration
│   │   └── mailer.js              # Nodemailer configuration
│   ├── routes/
│   │   ├── auth.routes.js         # Authentication routes
│   │   ├── admin.routes.js        # Admin routes
│   │   └── ats.routes.js          # ATS API routes
│   ├── controllers/
│   │   ├── auth.controller.js     # Auth business logic
│   │   ├── admin.controller.js    # Admin operations
│   │   └── ats.controller.js      # ATS business logic
│   ├── services/
│   │   ├── auth.service.js            # Authentication service
│   │   ├── admin.service.js           # Admin service
│   │   ├── resumeParser.service.js    # Resume parsing service
│   │   ├── atsScoring.service.js      # ATS scoring service
│   │   └── email.service.js           # Email notification service
│   ├── middleware/
│   │   ├── auth.middleware.js     # JWT authentication
│   │   └── role.middleware.js     # Role-based access control
│   ├── models/
│   │   ├── user.model.js          # User profile operations
│   │   ├── hrRequest.model.js     # HR request operations
│   │   ├── ats.model.js           # ATS database operations
│   │   └── jobs.model.js          # Jobs database operations
│   └── utils/
│       ├── logger.js              # Winston logger
│       └── queueStub.js           # Queue placeholder
├── migrations/
│   └── 001_auth_and_rbac.sql      # Database schema migration
├── .env.example                    # Environment variables template
├── .gitignore
├── nodemon.json                    # Nodemon configuration
├── package.json
├── Test.md                         # Postman testing guide
└── README.md
```

## How It Works

### Basic ATS Flow

1. **Job Posting:** HR users create job postings with descriptions and requirements
2. **Job Discovery:** Candidates browse available jobs (public access)
3. **Application:** Candidate uploads resume when applying for a specific job
4. **Cloud Storage:** Resume is uploaded to Cloudinary
5. **Parsing:** External API parses resume into structured JSON
6. **Storage:** Parsed data and application stored in Supabase
7. **Automatic Scoring:** LLM analyzes resume against the job description
8. **Notification:** If match score >= 80, job's HR receives email notification
9. **Candidate Confirmation:** Candidate receives application confirmation email
10. **HR Review:** HR views and reviews all applications with scores

### Authentication Flow

1. **User Registration:**
   - Candidate registers → `candidate` role
   - HR registers → `hr_pending` role + HR request created
   - Admin manually created with `admin` role

2. **HR Approval:**
   - Admin reviews pending HR requests
   - Approves → role changes to `hr_approved`, company created
   - Rejects → user notified, can re-apply

3. **Authorization:**
   - JWT middleware validates tokens on protected routes
   - Role middleware checks user permissions
   - Row Level Security (RLS) enforces database-level access control

### User Workflows

#### Candidate Workflow
1. Register with candidate role
2. Browse available jobs
3. Apply by uploading resume
4. Receive confirmation email
5. View application status and scores

#### HR Workflow
1. Register with HR role (pending approval)
2. Admin approves request
3. Create job postings
4. Receive email notifications for high-scoring candidates
5. Review applications and top candidates
6. Contact shortlisted candidates

#### Admin Workflow
1. Approve/reject HR requests
2. Manage users and permissions
3. Create/manage jobs (can act as HR)
4. Delete applications if needed
5. Monitor system via dashboard

## Multi-Company Architecture

The system supports **multiple companies and HR contacts**:

- Each job has its own `hrEmail` and optional `hrName`
- Email notifications are sent to the HR who posted that specific job
- Jobs are tracked in the `jobs` table with HR contact information
- The system automatically creates/updates job records on each submission
- Optional `companies` table for organizing jobs by company

**Benefits:**
- ✅ Multiple companies can use the same system
- ✅ Different HR contacts for different departments
- ✅ Each job has independent HR routing
- ✅ No cross-company data mixing

## Error Handling

All endpoints use centralized error handling with appropriate HTTP status codes:
- `400` - Bad request (missing fields, invalid data)
- `500` - Server errors (API failures, database errors)

## Logging

Logs are written to console and can be extended to file storage. Log levels:
- `info` - General application flow
- `warn` - Warnings and non-critical issues
- `error` - Errors and exceptions

## Environment Variables

See `.env.example` for all required environment variables.

## Security Notes

- Never commit `.env` file to version control
- Use service keys with appropriate permissions
- Validate and sanitize all user inputs
- Use HTTPS in production
- Rotate API keys regularly
- **JWT tokens are stored client-side** - use secure storage (httpOnly cookies in production)
- **Password requirements:** Minimum 6 characters (configurable in auth.service.js)
- **Row Level Security (RLS)** enforces database-level access control
- **Audit logging** tracks all sensitive operations
- **Suspended accounts** cannot access any protected endpoints
- **Token expiration:** Access tokens expire after 1 hour

## Future Enhancements

- [ ] Background job processing with Bull/Redis
- [ ] Rate limiting and request throttling
- [ ] Resume versioning and history
- [ ] Batch processing for multiple resumes
- [ ] Advanced analytics dashboard
- [ ] WebSocket notifications
- [ ] PDF report generation
- [ ] Multi-language support

## License

ISC

## Support

For issues and questions, please open an issue in the repository.
