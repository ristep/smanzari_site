# Smanzy - Full-Stack Media Management Platform

A modern full-stack web application for managing and sharing media files, built with Go and React.

---

## 🚀 Project Overview

Smanzy is a comprehensive media management platform that allows users to upload, organize, and share photos and videos through albums. The application features user authentication, role-based access control, and a responsive modern UI.

### Tech Stack

| Component | Technology |
|-----------|-----------|
| **Backend** | Go 1.24, Gin Framework, GORM |
| **Frontend** | React 19, Vite, React Router |
| **Database** | PostgreSQL 16 |
| **Deployment** | Docker, Docker Compose, Nginx |
| **CI/CD** | GitHub Actions |
| **Server** | Debian 12 |

---

## 📁 Project Structure

```
smanzari_site/
├── .github/workflows/       # GitHub Actions CI/CD
│   ├── deploy.yml          # Deployment workflow
│   └── rollback.yml        # Rollback workflow
├── smanzy_backend/         # Go API backend
│   ├── cmd/api/            # Main application entry
│   ├── internal/           # Internal packages
│   │   ├── auth/          # JWT authentication
│   │   ├── handlers/      # HTTP handlers
│   │   ├── middleware/    # Middleware
│   │   └── models/        # Database models
│   ├── Dockerfile         # Backend container
│   └── go.mod             # Go dependencies
├── smanzy_react_spa/       # React frontend
│   ├── src/               # Source code
│   │   ├── components/   # Reusable components
│   │   ├── pages/        # Page components
│   │   ├── services/     # API services
│   │   └── styles/       # Global styles
│   ├── Dockerfile        # Frontend container
│   └── package.json      # Node dependencies
├── nginx_conf/            # Nginx configurations
│   └── smanzary.vozigo.com.conf
├── scripts/               # Deployment scripts
│   ├── deploy.sh         # Main deployment
│   ├── rollback.sh       # Rollback script
│   └── health-check.sh   # Health verification
├── docker-compose.prod.yml # Production orchestration
└── README.md             # This file
```

---

## ✨ Features

### User Management
- ✅ User registration and authentication
- ✅ JWT-based authorization
- ✅ Role-based access control (user, admin)
- ✅ User profiles

### Media Management
- ✅ Upload photos and videos
- ✅ View, edit, and delete media
- ✅ Public and private media
- ✅ Media metadata management

### Album Management
- ✅ Create and manage albums
- ✅ Add/remove media from albums
- ✅ Album sharing

### UI/UX
- ✅ Responsive design
- ✅ Dark/Light theme toggle
- ✅ Modern card-based layout
- ✅ Media preview overlays

---

## 🚀 Quick Start

### Prerequisites

- Docker & Docker Compose
- Git
- (Optional) Node.js & Go for local development

### Production Deployment

1. **Clone the repository:**
```bash
git clone <repository-url> /srv/smanzy
cd /srv/smanzy
```

2. **Create `.env` file:**
```bash
cp .env.example .env
nano .env  # Add your secrets
```

3. **Deploy:**
```bash
chmod +x scripts/*.sh
./scripts/deploy.sh
```

4. **Access the application:**
- **Frontend:** https://smanzary.vozigo.com
- **API:** https://smanzary.vozigo.com/api
- **pgAdmin:** SSH tunnel to localhost:5050

### Local Development

#### Backend
```bash
cd smanzy_backend
cp .env.example .env
go mod download
go run cmd/api/main.go -migrate
```

#### Frontend
```bash
cd smanzy_react_spa
yarn install
yarn dev
```

---

## 📚 Documentation

- [**Deployment Guide**](./smanzy_agentic_deployment_docs/DEPLOYMENT.md) - Complete production deployment instructions
- [**CI/CD Setup**](./smanzy_agentic_deployment_docs/CI_CD_SETUP.md) - GitHub Actions configuration
- [**Backend README**](./smanzy_backend/README.md) - Backend API documentation
- [**Frontend README**](./smanzy_react_spa/README.md) - Frontend documentation

---

## 🔧 Architecture

```
Internet
   ↓
Nginx (TLS, Reverse Proxy)
   ↓
├── Frontend Container (React + Nginx)
│   └── Port: 3000 → 80
│
└── Backend Container (Go API)
    └── Port: 8080
        ↓
    PostgreSQL Container
        └── Port: 5432
```

---

## 🚢 Deployment

### Automatic Deployment (CI/CD)

Push to `main` branch triggers automatic deployment via GitHub Actions.

### Manual Deployment

```bash
./scripts/deploy.sh
```

### Rollback

```bash
./scripts/rollback.sh backup-YYYYMMDD-HHMMSS
```

### Health Check

```bash
./scripts/health-check.sh
```

---

## 🔒 Security

- ✅ HTTPS with Let's Encrypt TLS certificates
- ✅ JWT-based authentication
- ✅ Password hashing with bcrypt
- ✅ Role-based access control
- ✅ Security headers (X-Frame-Options, X-Content-Type-Options, etc.)
- ✅ Environment variable secrets
- ✅ Non-root Docker containers

---

## 🛠️ Environment Variables

Required environment variables in `.env`:

```bash
# Database
POSTGRES_USER=smanzy_user
POSTGRES_PASSWORD=<strong-password>
POSTGRES_DB=smanzy_db

# Backend
JWT_SECRET=<strong-secret-min-32-chars>
SERVER_PORT=8080
```

---

## 📊 Database Schema

| Table | Description |
|-------|-------------|
| `users` | User accounts |
| `roles` | User roles (user, admin) |
| `user_roles` | User-role associations |
| `media` | Uploaded media files |
| `album` | Media albums |
| `album_media` | Album-media associations |

---

## 🧪 Testing

### Backend Tests
```bash
cd smanzy_backend
go test ./...
```

### Frontend Tests
```bash
cd smanzy_react_spa
yarn test
```

---

## 📝 API Endpoints

### Public Endpoints
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/media` - List public media

### Protected Endpoints
- `GET /api/profile` - Get user profile
- `POST /api/media` - Upload media
- `GET /api/albums` - List user albums
- `POST /api/albums` - Create album

### Admin Endpoints
- `GET /api/users` - List all users
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user
- `GET /api/albums/all` - List all albums from all users

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

---

## 📄 License

This project is private and proprietary.

---

## 👥 Team

- **Backend Development** - Go API, Database, Authentication
- **Frontend Development** - React SPA, UI/UX
- **DevOps** - Docker, CI/CD, Server Management

---

## 📞 Support

For issues or questions, please contact the development team.

---

**Live Site:** https://smanzary.vozigo.com