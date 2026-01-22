# Smanzy React SPA

A modern Single Page Application (SPA) built with React, Vite, and Sass (SCSS). This serves as the frontend for the Smanzy application and interacts with the Go backend. Yarn is the recommended package manager for development (npm also works).

## 🚀 Tech Stack

- **[Vite](https://vitejs.dev/)**: Next Generation Frontend Tooling
- **[React](https://react.dev/)**: The library for web and native user interfaces
- **[React Router](https://reactrouter.com/)**: Client-side routing
- **[TanStack Query](https://tanstack.com/query/latest)**: Powerful asynchronous state management
- **Sass (SCSS)**: Styles written in SCSS and compiled at build time (uses the `sass` package)
- **[Axios](https://axios-http.com/)**: Promise based HTTP client

## 🛠️ Prerequisites

- Node.js (v18 or higher recommended)
- Yarn (recommended) — this project uses Yarn for installs and builds; npm also works

## 📦 Installation

1. Navigate to the project directory:

    ```bash
    cd smanzy_react_spa
    ```

2. Install dependencies:
 
    ```bash
    yarn install
    ```

## 🏃‍♂️ Development

To start the development server with Hot Module Replacement (HMR):
 
```bash
yarn dev
```

The application will be available at `http://localhost:5173`.

## 🏗️ Build

To build the application for production:

```bash
yarn build
```

This will generate a `dist` directory with optimized assets ready for deployment.

To preview the production build locally:
 
```bash
yarn preview
```

Useful scripts:

```bash
# Lint JavaScript/JSX
yarn lint

# Check SCSS files for style issues
yarn check:scss
```

## 📂 Project Structure

```text
src/
├── assets/         # Static assets (images, icons)
├── components/     # Reusable UI components
├── context/        # React context providers
├── layout/         # Layout wrapper components
├── pages/          # Page components (Home, Media Manager, etc.)
├── routes/         # Routing configuration
├── services/       # API services (Axios instance and interceptors)
├── styles/         # Global and component SCSS files
├── utils/          # Utilities and helpers
├── App.jsx         # Root component and provider setup
├── main.jsx        # Application entry point
└── version.js      # Frontend version info
```

## 🔑 Environment Variables

Create a `.env` file in the root directory (or copy `.env.example`) to configure the application.
 
```ini
# Base URL for the backend API (include /api if your backend exposes the API at that prefix)
VITE_API_BASE_URL=http://localhost:8080/api
```

## 🔌 API Integration

The application uses a centralized API client in `src/services/api.js`. It automatically handles:
 
- Base URL configuration via environment variables (`VITE_API_BASE_URL`).
- Attaching the JWT `Authorization` header to requests if a token exists in `localStorage` (key: `token`).
- A refresh-token flow: on 401 the client attempts `POST /auth/refresh` using `refresh_token` from `localStorage`; if refresh succeeds tokens are updated, otherwise auth is cleared and the user is redirected to `/login`.
