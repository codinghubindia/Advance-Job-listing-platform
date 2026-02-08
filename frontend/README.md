# ATS Score Engine - Frontend

React + TypeScript frontend for the ATS Score Engine application.

## Features

- **Authentication**: Login, Registration with role-based access
- **Candidate Portal**: Browse jobs, apply with resume, view ATS scores
- **HR Portal**: Post jobs, manage applications, review candidate scores
- **Admin Portal**: Approve HR requests, manage users and roles

## Tech Stack

- React 18
- TypeScript
- Vite
- React Router v6
- Axios
- Tailwind CSS
- Lucide React (icons)
- React Hot Toast

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- Backend API running on http://localhost:5000

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create environment file:
```bash
cp .env.example .env
```

3. Update `.env` with your API URL if different:
```env
VITE_API_BASE_URL=http://localhost:5000
```

### Development

Run the development server:
```bash
npm run dev
```

The app will be available at http://localhost:3000

### Build for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

### Preview Production Build

```bash
npm run preview
```

## Project Structure

```
src/
├── components/          # Reusable components
│   ├── Layout.tsx
│   ├── ProtectedRoute.tsx
│   ├── PublicRoute.tsx
│   ├── StatsCard.tsx
│   ├── ScoreBadge.tsx
│   └── ...
├── context/            # React context providers
│   └── AuthContext.tsx
├── pages/              # Page components
│   ├── auth/          # Authentication pages
│   ├── candidate/     # Candidate portal pages
│   ├── hr/            # HR portal pages
│   └── admin/         # Admin portal pages
├── services/           # API service layer
│   ├── api.ts
│   ├── auth.service.ts
│   ├── job.service.ts
│   └── admin.service.ts
├── types/              # TypeScript type definitions
│   └── index.ts
├── App.tsx             # Main app component with routing
├── main.tsx            # Application entry point
└── index.css           # Global styles

```

## User Roles

- **Candidate**: Browse jobs, apply with resume, view application scores
- **HR (Pending)**: Awaiting admin approval
- **HR (Approved)**: Post jobs, view applications, review ATS scores
- **Admin**: Approve HR requests, manage all users

## Available Routes

### Public
- `/login` - Login page
- `/register` - Registration page

### Candidate
- `/jobs` - Browse all jobs
- `/jobs/:id` - View job details and apply
- `/my-applications` - View application history and scores

### HR
- `/hr` - HR dashboard
- `/hr/jobs` - Manage job postings
- `/hr/jobs/new` - Create new job
- `/hr/jobs/:id/applications` - View job applications

### Admin
- `/admin` - Admin dashboard
- `/admin/hr-requests` - Review HR registration requests
- `/admin/users` - Manage users and roles

## API Integration

The frontend communicates with the backend API via Axios. The API client is configured in `src/services/api.ts` with:

- Automatic JWT token injection
- Request/response interceptors
- Error handling
- Automatic redirect on 401 Unauthorized

## Environment Variables

- `VITE_API_BASE_URL`: Backend API base URL (default: http://localhost:5000)

## License

MIT
