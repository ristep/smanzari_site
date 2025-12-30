# Smanzy React SPA

A modern Single Page Application (SPA) built with React, Vite, and Tailwind CSS. This serves as the frontend for the Smanzy application, interacting with the Go backend.

## 🚀 Tech Stack

- **[Vite](https://vitejs.dev/)**: Next Generation Frontend Tooling
- **[React](https://react.dev/)**: The library for web and native user interfaces
- **[React Router](https://reactrouter.com/)**: Client-side routing
- **[TanStack Query](https://tanstack.com/query/latest)**: Powerful asynchronous state management
- **[Tailwind CSS](https://tailwindcss.com/)**: Utility-first CSS framework
- **[Axios](https://axios-http.com/)**: Promise based HTTP client

## 🛠️ Prerequisites

- Node.js (v18 or higher recommended)
- npm (comes with Node.js)

## 📦 Installation

1. Navigate to the project directory:

    ```bash
    cd smanzy_react_spa
    ```

2. Install dependencies:

    ```bash
    npm install
    ```

## 🏃‍♂️ Development

To start the development server with Hot Module Replacement (HMR):

```bash
npm run dev
```

The application will be available at `http://localhost:5173`.

## 🏗️ Build

To build the application for production:

```bash
npm run build
```

This will generate a `dist` directory with optimized assets ready for deployment.

To preview the production build locally:

```bash
npm run preview
```

## 📂 Project Structure

```text
src/
├── components/     # Reusable UI components (Navbar, Footer, etc.)
├── hooks/          # Custom React hooks
├── layout/         # Layout wrapper components
├── pages/          # Page components (Home, Login, Profile, etc.)
├── routes/         # Routing configuration
├── services/       # API services (Axios instance)
├── App.jsx         # Root component and provider setup
└── main.jsx        # Application entry point
```

## 🔑 Environment Variables

Create a `.env` file in the root directory to configure the application.

```ini
# Base URL for the backend API
VITE_API_BASE_URL=http://localhost:8080/api
```

## 🔌 API Integration

The application uses a centralized API client in `src/services/api.js`. It automatically handles:

- Base URL configuration via environment variables.
- Attaching the JWT `Authorization` header to requests if a token exists in `localStorage`.
- Basic error interception (e.g. 401 Unauthorized handling).
