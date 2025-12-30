# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

Smanzy React SPA is the frontend for a full-stack media management application. It's a modern Single Page Application built with React, Vite, and Tailwind CSS that communicates with a Go backend REST API.

**Monorepo Context**: This is part of a larger project. The Go backend lives in `../smanzy_backend/`.

## Common Commands

### Development
```bash
npm run dev
# Starts Vite dev server at http://localhost:5173 with HMR
```

### Build
```bash
npm run build
# Creates production build in dist/ directory

npm run preview
# Preview production build locally
```

### Linting
```bash
npm run lint
# Run ESLint to check code quality
```

### Testing
**Note**: No test framework is currently configured. If adding tests, research the codebase first to determine the appropriate setup.

## Architecture

### API Communication

**Authentication Flow**:
- JWT tokens are stored in `localStorage` with key `'token'`
- The centralized API client (`src/services/api.js`) automatically attaches tokens via request interceptor
- Token format: `Authorization: Bearer <token>`
- 401 responses are intercepted but currently only log warnings (not full logout flow)

**Backend Integration**:
- Base URL configured via `VITE_API_BASE_URL` environment variable
- Default: `http://localhost:8080/api`
- API client uses Axios with request/response interceptors

### State Management

**TanStack Query (React Query)**:
- Configured with 5-minute stale time and 1 retry
- QueryClient instance created in `App.jsx`
- Used for all server state (fetching, mutations, caching)
- Common pattern: `useMutation` for writes, `useQuery` for reads, `useQueryClient` for cache invalidation

**Local State**:
- Component-level state uses `useState` hook
- No global client state management library (Redux, Zustand, etc.)

### Routing Architecture

- Uses React Router v7 with `createBrowserRouter`
- All routes defined in `src/routes/index.jsx`
- Layout wrapper: `MainLayout` (includes Navbar, Footer, Outlet)
- No route protection implemented - profile routes should be protected but currently aren't

**Route Structure**:
```
/ (MainLayout wrapper)
├── / (Home)
├── /about (About)
├── /login (Login)
├── /register (Register)
├── /profile (Profile - should be protected)
├── /media (MediaManager - should be protected)
├── /media/edit/:id (UpdateMedia - should be protected)
└── * (NotFound - 404)
```

### Component Organization

**Reusable Components** (`src/components/`):
- `Button.jsx`: Shared button with variants (including 'login' variant)
- `Navbar.jsx`: Main navigation (includes media links for authenticated users)
- `Footer.jsx`: Site footer

**Layout** (`src/layout/`):
- `MainLayout.jsx`: Wraps all routes with Navbar + main content area + Footer

**Pages** (`src/pages/`):
- Page-level components mapped to routes
- Handle their own data fetching with TanStack Query
- `MediaManager.jsx`: Full CRUD for media files with pagination

### Styling System

- **Tailwind CSS v4**: Utility-first CSS framework
- **Design pattern**: Dark theme with slate colors (slate-950, slate-900, slate-800)
- **Common patterns**:
  - Glass morphism: `bg-slate-900/60 backdrop-blur-xl`
  - Ambient effects: Blurred colored orbs for visual interest
  - Focus states: `focus:ring-2 focus:ring-blue-500/50`
- **Icons**: lucide-react library
- **Utilities**: `clsx` and `tailwind-merge` for conditional classes

## Environment Configuration

Required environment variables (use `.env.example` as template):

```ini
VITE_API_BASE_URL=http://localhost:8080/api
```

**Important**: All Vite environment variables must be prefixed with `VITE_` to be exposed to the client.

## Backend API Endpoints

The frontend expects these endpoints from the Go backend:

**Auth**:
- `POST /api/auth/login` → `{ data: { access_token, user } }`
- `POST /api/auth/register`

**Media**:
- `GET /api/media?limit=20&offset=0` → List media files (paginated)
- `POST /api/media` → Upload file (multipart/form-data)
- `GET /api/media/:id` → Get file details
- `PUT /api/media/:id` → Update file metadata
- `DELETE /api/media/:id` → Delete file

**Profile**:
- `GET /api/profile` (or similar - check actual implementation)

## Development Workflow

1. **Ensure backend is running** at `http://localhost:8080` before starting frontend development
2. **Check `.env` file** exists with correct `VITE_API_BASE_URL`
3. Run `npm run dev` for development with HMR
4. Run `npm run lint` before committing to catch issues

## Code Patterns

### Making API Calls

Always use the centralized `api` client from `src/services/api.js`:

```javascript
import api from '../services/api';

// With TanStack Query mutation
const mutation = useMutation({
    mutationFn: (data) => api.post('/auth/login', data),
    onSuccess: (response) => {
        const token = response.data?.data?.access_token;
        localStorage.setItem('token', token);
    },
});
```

### File Uploads

For multipart/form-data (file uploads), override the Content-Type header:

```javascript
const formData = new FormData();
formData.append('file', file);

api.post('/media', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
});
```

### Authentication State

Currently, authentication state is inferred by presence of token in localStorage. There's no global auth context or user state management.

To check if user is logged in:
```javascript
const token = localStorage.getItem('token');
const isAuthenticated = !!token;
```

## Known Limitations

1. **No route protection**: Profile and media routes should require authentication but don't have guards
2. **No global auth context**: User state and authentication status aren't globally managed
3. **Incomplete logout flow**: 401 interceptor logs warning but doesn't trigger logout/redirect
4. **No test suite**: Testing infrastructure needs to be set up
5. **Manual token management**: Consider implementing automatic token refresh for better UX
