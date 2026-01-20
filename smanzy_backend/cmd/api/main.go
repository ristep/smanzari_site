package main

import (
	"flag"
	"fmt"
	"log"
	"net/http"
	"os"

	// Gin is a web framework for Go (handling HTTP requests/responses)
	"github.com/gin-gonic/gin"
	// godotenv loads environment variables from a .env file
	"github.com/joho/godotenv"
	// Internal packages from our own project
	"time"

	"github.com/ristep/smanzy_backend/internal/auth"
	"github.com/ristep/smanzy_backend/internal/db"
	"github.com/ristep/smanzy_backend/internal/handlers"
	"github.com/ristep/smanzy_backend/internal/middleware"
	"github.com/ristep/smanzy_backend/internal/services"
	"github.com/ulule/limiter/v3"
	mgin "github.com/ulule/limiter/v3/drivers/middleware/gin"
	"github.com/ulule/limiter/v3/drivers/store/memory"
)

// main is the entry point of the application
func main() {
	// Parse CLI flags
	migrate := flag.Bool("migrate", false, "Run database migrations")
	flag.Parse()

	// 1. Load environment variables from .env file (if it exists)
	// This allows us to configure the app without changing code (e.g. secret keys, db passwords)
	if err := godotenv.Load(); err != nil {
		log.Println("Warning: .env file not found, using environment variables")
	}

	// 2. Configuration Setup
	// We read configuration (Database URL, Secrets, Port) from the environment
	dbDSN := os.Getenv("DB_DSN") // Data Source Name (connection string)
	if dbDSN == "" {
		log.Fatal("DB_DSN environment variable is required")
	}

	jwtSecret := os.Getenv("JWT_SECRET") // Secret key for signing JWT tokens
	if jwtSecret == "" {
		log.Fatal("JWT_SECRET environment variable is required")
	}

	serverPort := os.Getenv("SERVER_PORT") // Port to run the server on
	if serverPort == "" {
		serverPort = "8080" // Default to 8080 if not specified
	}

	// YouTube API configuration
	youtubeAPIKey := os.Getenv("YOUTUBE_API_KEY")
	youtubeChannelID := os.Getenv("YOUTUBE_CHANNEL_ID")
	if youtubeAPIKey == "" {
		log.Println("Warning: YOUTUBE_API_KEY not set, YouTube sync will not work")
	}
	if youtubeChannelID == "" {
		log.Println("Warning: YOUTUBE_CHANNEL_ID not set, YouTube sync will not work")
	}

	// 3. Database Connection
	// Connect to PostgreSQL using standard library
	conn, err := db.Connect(dbDSN)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer conn.Close()

	// Initialize sqlc queries
	queries := db.New(conn)

	// 4. Database Migration (Optional: call manual migration tool here)
	if *migrate {
		log.Println("Manual migration requested. Please use internal/db/schema/schema.sql to initialize your database.")
	}

	log.Println("Database connection established")

	// 5. Seeding Data
	// Ensure that basic roles exist in the database
	_, _ = conn.Exec("INSERT INTO roles (name) VALUES ('user') ON CONFLICT (name) DO NOTHING")
	_, _ = conn.Exec("INSERT INTO roles (name) VALUES ('admin') ON CONFLICT (name) DO NOTHING")

	// 6. Service Initialization
	// Initialize our services and handlers, injecting dependencies (like the DB connection)
	jwtService := auth.NewJWTService(jwtSecret)
	youtubeService := services.NewYouTubeService(youtubeAPIKey, youtubeChannelID)

	authHandler := handlers.NewAuthHandler(conn, queries, jwtService)
	userHandler := handlers.NewUserHandler(conn, queries)
	mediaHandler := handlers.NewMediaHandler(conn, queries)
	albumHandler := handlers.NewAlbumHandler(conn, queries)
	videoHandler := handlers.NewVideoHandler(conn, queries, youtubeService)

	// 7. Router Setup
	// Create a new Gin router with default middleware (logger and recovery)
	router := gin.Default()

	// Custom handler for rate limit errors
	router.Use(func(c *gin.Context) {
		c.Next()
		if c.Writer.Status() == http.StatusTooManyRequests {
			c.JSON(http.StatusTooManyRequests, gin.H{"error": "Rate limit exceeded. Try again later."})
		}
	})

	// Apply CORS middleware (Cross-Origin Resource Sharing) to allow frontend to talk to backend
	router.Use(middleware.CORSMiddleware())

	// Health check endpoint - useful for monitoring if the app is up
	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	// Initialize rate limiter (e.g., 5 requests per minute per IP)
	rate := limiter.Rate{
		Period: time.Minute,
		Limit:  15, // Adjust this value as needed
	}
	store := memory.NewStore() // Use in-memory for dev; switch to Redis for production
	limiterInstance := limiter.New(store, rate)
	rateLimitMiddleware := mgin.NewMiddleware(limiterInstance)

	// 8. Define Routes
	// Group routes under /api
	api := router.Group("/api")
	{
		// == PUBLIC ROUTES ==
		// These endpoints can be accessed without logging in

		// Version endpoint - returns API version information
		versionHandler := handlers.NewVersionHandler()
		api.GET("/version", versionHandler.GetVersionHandler)

		auth := api.Group("/auth")
		auth.Use(rateLimitMiddleware) // Apply rate limiting here
		{
			auth.POST("/register", authHandler.RegisterHandler)
			auth.POST("/login", authHandler.LoginHandler)
			auth.POST("/refresh", authHandler.RefreshHandler)
		}

		// Public media listing
		api.GET("/media", mediaHandler.ListPublicMediasHandler)

		// Public video endpoints
		api.GET("/videos", videoHandler.ListVideosHandler)
		api.GET("/videos/:id", videoHandler.GetVideoHandler)

		// Serve uploaded files directly (for development)
		// :name is a path parameter that captures the filename
		api.GET("/media/files/:name", mediaHandler.ServeFileHandler)

		// Serve thumbnail files
		// :size is the thumbnail size (e.g., 320x200, 800x600)
		// :name is the filename
		api.GET("/media/thumbnails/:size/:name", mediaHandler.ServeThumbnailHandler)
	}

	// == PROTECTED ROUTES ==
	// Requires a valid JWT token in the Authorization header
	protectedAPI := router.Group("/api")
	// Apply the AuthMiddleware to check for the token
	protectedAPI.Use(middleware.AuthMiddleware(jwtService, queries))
	{
		// Authenticated User routes
		profile := protectedAPI.Group("/profile")
		{
			profile.GET("", authHandler.ProfileHandler)       // Get current user profile
			profile.PUT("", authHandler.UpdateProfileHandler) // Update current user profile
		}

		// Admin-only routes
		// Apply RoleMiddleware to check if the user has "admin" role
		users := protectedAPI.Group("/users")
		users.Use(middleware.RoleMiddleware("admin"))
		{
			users.GET("", userHandler.GetAllUsersHandler)
			users.GET("/deleted", userHandler.GetAllUsersWithDeletedHandler)
			users.GET("/:id", userHandler.GetUserByIDHandler)
			users.PUT("/:id", userHandler.UpdateUserHandler)
			users.DELETE("/:id", userHandler.DeleteUserHandler)
			users.POST("/:id/restore", userHandler.RestoreUserHandler)

			// Password management
			users.PUT("/:id/password", userHandler.ResetUserPasswordHandler)

			// Role management
			users.POST("/:id/roles", userHandler.AssignRoleHandler)
			users.DELETE("/:id/roles", userHandler.RemoveRoleHandler)
		}

		// Media routes (authenticated)
		media := protectedAPI.Group("/media")
		{
			media.POST("", mediaHandler.UploadHandler)                     // Upload a new file
			media.GET("/:id", mediaHandler.GetMediaHandler)                // Get file content
			media.GET("/:id/details", mediaHandler.GetMediaDetailsHandler) // Get file metadata
			media.PUT("/:id", mediaHandler.UpdateMediaHandler)             // Edit file (Owner or Admin)
			media.DELETE("/:id", mediaHandler.DeleteMediaHandler)          // Delete file (Owner or Admin)
		}

		// Album routes (authenticated)
		albums := protectedAPI.Group("/albums")
		{
			albums.POST("", albumHandler.CreateAlbumHandler)       // Create a new album
			albums.GET("", albumHandler.GetUserAlbumsHandler)      // Get all albums for current user
			albums.GET("/:id", albumHandler.GetAlbumHandler)       // Get album by ID
			albums.PUT("/:id", albumHandler.UpdateAlbumHandler)    // Update album details
			albums.DELETE("/:id", albumHandler.DeleteAlbumHandler) // Delete album (soft delete)

			// Album media management
			albums.POST("/:id/media", albumHandler.AddMediaToAlbumHandler)        // Add media to album
			albums.DELETE("/:id/media", albumHandler.RemoveMediaFromAlbumHandler) // Remove media from album
		}

		// Admin-only album routes
		adminAlbums := protectedAPI.Group("/albums")
		adminAlbums.Use(middleware.RoleMiddleware("admin"))
		{
			adminAlbums.GET("/all", albumHandler.GetAllAlbumsHandler) // Get all albums from all users (admin only)
		}

		// Video routes (authenticated)
		videos := protectedAPI.Group("/videos")
		{
			videos.POST("/sync", videoHandler.SyncVideosHandler) // Sync videos from YouTube
		}

	}

	// 9. Start Server
	addr := fmt.Sprintf(":%s", serverPort)
	log.Printf("Starting server on %s", addr)
	if err := router.Run(addr); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
