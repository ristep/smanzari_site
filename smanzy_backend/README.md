# Smanzy API with JWT Authentication

A production-ready REST API in Go featuring secure user management, role-based access control (RBAC), JWT authentication, media file management, and YouTube video integration.

## Tech Stack

- **Web Framework**: [Gin](https://github.com/gin-gonic/gin) - High-performance HTTP web framework
- **JWT Library**: [golang-jwt/jwt/v5](https://github.com/golang-jwt/jwt) - JWT authentication
- **Database**: PostgreSQL with [pgx/v5](https://github.com/jackc/pgx) driver
- **Query Builder**: [SQLC](https://sqlc.dev/) - Type-safe SQL code generation
- **Password Hashing**: [golang.org/x/crypto/bcrypt](https://pkg.go.dev/golang.org/x/crypto/bcrypt) - Secure password storage
- **Rate Limiting**: [ulule/limiter](https://github.com/ulule/limiter) - API rate limiting middleware
- **Environment**: [godotenv](https://github.com/joho/godotenv) - Environment variable management
- **YouTube Integration**: Custom YouTube API service for video synchronization

## Project Structure

```text
smanzy_backend/
├── cmd/
│   └── api/
│       └── main.go                 # Application entry point
├── internal/
│   ├── models/
│   │   ├── user.go                 # User and Role data models
│   │   ├── media.go                # Media data model
│   │   ├── album.go                # Album data model with many-to-many media relationship
│   │   └── video.go                # YouTube video data model
│   ├── handlers/
│   │   ├── auth.go                 # HTTP handlers for auth and user management
│   │   ├── media.go                # HTTP handlers for media management
│   │   ├── album.go                # HTTP handlers for album management
│   │   ├── video.go                # HTTP handlers for video management
│   │   └── version.go              # API version handler
│   ├── services/
│   │   ├── album.go                # Business logic for album operations
│   │   └── youtube.go              # YouTube API integration service
│   ├── middleware/
│   │   ├── auth.go                 # JWT and RBAC middleware
│   │   └── cors.go                 # CORS configuration
│   ├── mappers/
│   │   └── mappers.go              # Data mapping utilities
│   ├── db/
│   │   ├── schema/                 # Database schema definitions
│   │   │   └── schema.sql          # SQL schema file
│   │   ├── queries/                # SQL query definitions
│   │   │   ├── users.sql
│   │   │   ├── media.sql
│   │   │   ├── albums.sql
│   │   │   └── videos.sql
│   │   ├── migrations/             # Database migration files
│   │   ├── connection.go           # Database connection management
│   │   ├── db.go                   # Database utilities
│   │   ├── models.go               # SQLC-generated models
│   │   └── *.sql.go                # SQLC-generated query code
│   └── auth/
│       └── jwt.go                  # JWT token generation and validation
├── uploads/                        # Local storage for media files
├── docker/                         # Docker configuration
│   └── pgadmin/                    # pgAdmin configuration
├── go.mod                           # Go module dependencies
├── go.sum                           # Go module checksums
├── sqlc.yaml                        # SQLC configuration
├── Makefile                         # Common development tasks
├── Dockerfile                       # Docker container configuration
├── docker-compose.yml               # Docker Compose setup
├── .env.example                     # Example environment variables
└── README.md                        # This file
```

## Setup Instructions

### Prerequisites

- Go 1.24 or higher
- PostgreSQL 12 or higher
- Git
- SQLC (for query generation - optional for development)
- Docker & Docker Compose (optional, for pgAdmin)

### 1. Initialize the Project

```bash
cd smanzy_backend
```

### 2. Download Dependencies

```bash
go mod download
```

### 3. Configure Environment Variables

Copy the example environment file and configure it:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Database Configuration
DB_DSN=postgres://postgres:postgres@localhost:5432/smanzy_postgres?sslmode=disable

# JWT Configuration (use a strong random key)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Server Configuration
SERVER_PORT=8080

# Environment
ENV=development

# YouTube API Configuration (optional)
YOUTUBE_API_KEY=your-youtube-api-key
YOUTUBE_CHANNEL_ID=your-youtube-channel-id

# pgAdmin Configuration (optional)
PGADMIN_DEFAULT_EMAIL=ristep@example.com
PGADMIN_DEFAULT_PASSWORD=PgAdminPass!2025
```

**Generate a secure JWT secret:**

```bash
openssl rand -base64 32
```

### 4. Initialize Database Schema

The project uses SQLC for type-safe SQL queries. Initialize the database with the provided schema:

```bash
# Create database
createdb smanzy_postgres

# Apply schema (run the SQL file directly)
psql $DB_DSN < internal/db/schema/schema.sql
```

Or use PostgreSQL client:

```sql
CREATE DATABASE smanzy_postgres;
```

### 5. Generate SQLC Code (Development Only)

If you plan to modify SQL queries:

```bash
# Install SQLC
go install github.com/kyleconroy/sqlc/cmd/sqlc@latest

# Generate Go code from SQL
sqlc generate
```

### 6. Run the Application

```bash
go run cmd/api/main.go
# OR use Makefile
make run

# Run with database migration flag
go run cmd/api/main.go -migrate
```

The server will start on `http://localhost:8080`

### Optional: pgAdmin

You can run pgAdmin as a Docker container (this repository's `docker-compose.yml` includes a `pgadmin` service):

1. Start the containers:

```bash
docker-compose up -d
```

2. Visit pgAdmin at `http://localhost:5050` with the credentials specified in `docker-compose.yml`.

## API Endpoints

### Health Check

```http
GET /health
Response: {"status": "ok"}
```

### API Version

```http
GET /api/version
Response: {"version": "1.0.0", "build_time": "..."}
```

### Public Endpoints

#### Register a New User

```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword123",
  "name": "John Doe",
  "tel": "+123456789",
  "age": 25,
  "gender": "male",
  "address": "123 Main St",
  "city": "Metropolis",
  "country": "USA"
}
```

#### Login

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

#### Public Media Listing

```http
GET /api/media?limit=100&offset=0
```

#### Public Video Listing

```http
GET /api/videos?limit=100&offset=0
```

#### Get Video Details

```http
GET /api/videos/:id
```

#### Serving Files (Development)

```http
GET /api/media/files/:name
```

### Protected Endpoints (Requires JWT)

#### Get User Profile

```http
GET /api/profile
```

#### Upload Media

```http
POST /api/media
Content-Type: multipart/form-data
Body: file (binary)
```

#### Update Media Metadata

```http
PUT /api/media/:id
Content-Type: application/json
{
  "filename": "new_name.jpg"
}
```

#### Delete Media

```http
DELETE /api/media/:id
```

### Album Management Endpoints (Requires JWT)

#### Create a New Album

```http
POST /api/albums
Content-Type: application/json

{
  "title": "My Vacation",
  "description": "Summer 2025 photos"
}
```

#### Get All User Albums

```http
GET /api/albums
```

#### Get Specific Album with Media

```http
GET /api/albums/:id
```

#### Update Album Details

```http
PUT /api/albums/:id
Content-Type: application/json

{
  "title": "Updated Title",
  "description": "Updated description"
}
```

#### Add Media to Album

```http
POST /api/albums/:id/media
Content-Type: application/json

{
  "media_id": 5
}
```

#### Remove Media from Album

```http
DELETE /api/albums/:id/media
Content-Type: application/json

{
  "media_id": 5
}
```

#### Delete Album (Soft Delete)

```http
DELETE /api/albums/:id
```

### Video Management Endpoints (Requires JWT)

#### Sync Videos from YouTube

```http
POST /api/videos/sync
```

This endpoint fetches the latest videos from the configured YouTube channel and stores them in the database.

### Admin-Only Endpoints

- `GET /api/users` - List all users
- `GET /api/users/deleted` - List all users including deleted ones
- `GET /api/users/:id` - Get specific user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user
- `POST /api/users/:id/restore` - Restore deleted user
- `PUT /api/users/:id/password` - Reset user password
- `POST /api/users/:id/roles` - Assign role
- `DELETE /api/users/:id/roles` - Remove role
- `GET /api/albums/all` - Get all albums from all users

## Development

Use the included `Makefile` for common tasks:

- `make run`: Run the API
- `make dev`: Run with hot-reloading (requires `air`)
- `make build`: Build the binary
- `make test`: Run tests
- `make fmt`: Format code

### SQLC Workflow

1. Write SQL queries in `internal/db/queries/`
2. Define schema in `internal/db/schema/schema.sql`
3. Run `sqlc generate` to create type-safe Go code
4. Use generated code in handlers and services

### Database Migrations

The project uses manual SQL migrations located in `internal/db/migrations/`. To create new migrations:

1. Create `up` and `down` migration files
2. Apply migrations manually or through your deployment process

### Rate Limiting

The API includes rate limiting middleware (15 requests per minute by default) to prevent abuse. This is applied to authentication endpoints and can be configured in the main.go file.

### Docker Support

```bash
# Start PostgreSQL and pgAdmin
docker-compose up -d

# Access pgAdmin at http://localhost:5050
```

### YouTube Integration

To enable YouTube video synchronization:

1. Get a YouTube Data API v3 key from Google Cloud Console
2. Set `YOUTUBE_API_KEY` and `YOUTUBE_CHANNEL_ID` in your `.env`
3. Use the `/api/videos/sync` endpoint to fetch videos

## License

MIT License
