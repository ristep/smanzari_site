package handlers

import (
	"database/sql"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/ristep/smanzy_backend/internal/db"
	"github.com/ristep/smanzy_backend/internal/models"
)

// MediaHandler handles media-related HTTP requests
type MediaHandler struct {
	conn             *sql.DB
	queries          *db.Queries
	uploadDir        string
	mediaBaseURL     string
	thumbnailBaseURL string
}

// NewMediaHandler creates a new media handler
func NewMediaHandler(conn *sql.DB, queries *db.Queries) *MediaHandler {
	// Allow configuring upload directory via environment variable.
	// In containers, prefer an absolute path like /app/uploads.
	uploadDir := os.Getenv("UPLOAD_DIR")
	mediaBaseURL := os.Getenv("MEDIA_BASE_URL")

	if uploadDir == "" {
		uploadDir = "./uploads"
	}

	if mediaBaseURL == "" {
		mediaBaseURL = "/api/media/files/"
	}

	thumbnailBaseURL := os.Getenv("THUMBNAIL_BASE_URL")
	if thumbnailBaseURL == "" {
		thumbnailBaseURL = "/api/thumbnail/"
	}

	// Ensure upload directory exists (fail loudly if it cannot be created)
	if err := os.MkdirAll(uploadDir, 0755); err != nil {
		fmt.Printf("ERROR: failed to create upload directory %q: %v\n", uploadDir, err)
	}

	fmt.Printf("Media uploads directory: %s\n", uploadDir)
	fmt.Printf("Media base URL: %s\n", mediaBaseURL)

	return &MediaHandler{
		conn:             conn,
		queries:          queries,
		uploadDir:        uploadDir,
		mediaBaseURL:     mediaBaseURL,
		thumbnailBaseURL: thumbnailBaseURL,
	}
}

// GenThumbnailURL generates thumbnail URL
func (mh *MediaHandler) GenThumbnailURL(storedName string, size string) string {
	baseName := strings.TrimSuffix(storedName, filepath.Ext(storedName))
	return mh.thumbnailBaseURL + size + "/" + baseName + ".jpg"
}

// GenMediaURL generates media URL
func (mh *MediaHandler) GenMediaURL(storedName string) string {
	return mh.mediaBaseURL + storedName
}

// UploadHandler handles file uploads
func (mh *MediaHandler) UploadHandler(c *gin.Context) {
	// Get current user
	authUser, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, ErrorResponse{Error: "Unauthorized"})
		return
	}
	user := authUser.(*models.User)

	// Get file from request
	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "No file uploaded"})
		return
	}

	// Generate unique stored name
	ext := filepath.Ext(file.Filename)
	uniqueName := fmt.Sprintf("%d_%d%s", user.ID, time.Now().UnixNano(), ext)
	dst := filepath.Join(mh.uploadDir, uniqueName)

	// Save file
	if err := c.SaveUploadedFile(file, dst); err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to save file"})
		return
	}

	// Create media record
	mediaRow, err := mh.queries.CreateMedia(c.Request.Context(), db.CreateMediaParams{
		Filename:   file.Filename,
		StoredName: uniqueName,
		Type:       sql.NullString{String: "file", Valid: true},
		MimeType:   sql.NullString{String: file.Header.Get("Content-Type"), Valid: true},
		Size:       file.Size,
		UserID:     int64(user.ID),
	})

	if err != nil {
		// Clean up file if DB save fails
		_ = os.Remove(dst)
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to save media record"})
		return
	}

	// Map to model
	apiMedia := models.Media{
		ID:           uint(mediaRow.ID),
		Filename:     mediaRow.Filename,
		StoredName:   mediaRow.StoredName,
		URL:          mh.GenMediaURL(mediaRow.StoredName),
		Thumb160x100: mh.GenThumbnailURL(mediaRow.StoredName, "160x100"),
		Thumb320x200: mh.GenThumbnailURL(mediaRow.StoredName, "320x200"),
		Thumb640x400: mh.GenThumbnailURL(mediaRow.StoredName, "640x400"),
		Type:         mediaRow.Type,
		MimeType:     mediaRow.MimeType,
		Size:         mediaRow.Size,
		UserID:       uint(mediaRow.UserID),
		CreatedAt:    mediaRow.CreatedAt,
		UpdatedAt:    mediaRow.UpdatedAt,
	}

	c.JSON(http.StatusCreated, SuccessResponse{Data: apiMedia})
}

// GetMediaHandler downloads/streams the file
func (mh *MediaHandler) GetMediaHandler(c *gin.Context) {
	mediaIDStr := c.Param("id")
	mediaID, err := strconv.ParseInt(mediaIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid ID"})
		return
	}

	mediaRow, err := mh.queries.GetMediaByID(c.Request.Context(), int64(mediaID))
	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, ErrorResponse{Error: "Media not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Database error"})
		return
	}

	filePath := filepath.Join(mh.uploadDir, mediaRow.StoredName)
	c.File(filePath)
}

// GetMediaDetailsHandler returns media metadata
func (mh *MediaHandler) GetMediaDetailsHandler(c *gin.Context) {
	mediaIDStr := c.Param("id")
	mediaID, err := strconv.ParseInt(mediaIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid ID"})
		return
	}

	mediaRow, err := mh.queries.GetMediaByID(c.Request.Context(), int64(mediaID))
	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, ErrorResponse{Error: "Media not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Database error"})
		return
	}

	// Fetch username
	// userRow, _ := mh.queries.GetUserByID(c.Request.Context(), mediaRow.UserID)

	apiMedia := models.Media{
		ID:           uint(mediaRow.ID),
		Filename:     mediaRow.Filename,
		StoredName:   mediaRow.StoredName,
		URL:          mh.GenMediaURL(mediaRow.StoredName),
		Thumb160x100: mh.GenThumbnailURL(mediaRow.StoredName, "160x100"),
		Thumb320x200: mh.GenThumbnailURL(mediaRow.StoredName, "320x200"),
		Thumb640x400: mh.GenThumbnailURL(mediaRow.StoredName, "640x400"),
		Thumb800x600: mh.GenThumbnailURL(mediaRow.StoredName, "800x600"),
		Type:         mediaRow.Type,
		MimeType:     mediaRow.MimeType,
		Size:         mediaRow.Size,
		UserID:       uint(mediaRow.UserID),
		CreatedAt:    mediaRow.CreatedAt,
		UpdatedAt:    mediaRow.UpdatedAt,
	}

	c.JSON(http.StatusOK, SuccessResponse{Data: apiMedia})
}

// ServeFileHandler serves files directly from the uploads directory for
// development. Production should serve these via nginx or another static
// file server for performance.
func (mh *MediaHandler) ServeFileHandler(c *gin.Context) {
	name := c.Param("name")

	// Prevent path traversal: the provided name must be the base name
	if filepath.Base(name) != name {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid filename"})
		return
	}

	filePath := filepath.Join(mh.uploadDir, name)
	if _, err := os.Stat(filePath); os.IsNotExist(err) {
		c.JSON(http.StatusNotFound, ErrorResponse{Error: "File not found"})
		return
	} else if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Filesystem error"})
		return
	}

	c.File(filePath)
}

// ServeThumbnailHandler serves thumbnail files from subdirectories
func (mh *MediaHandler) ServeThumbnailHandler(c *gin.Context) {
	size := c.Param("size")
	name := c.Param("name")

	// Validate size parameter to prevent path traversal
	if size == "" || name == "" {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid parameters"})
		return
	}

	// Only allow known thumbnail sizes
	allowedSizes := map[string]bool{
		"160x100": true,
		"320x200": true,
		"640x400": true,
		"800x600": true,
	}
	if !allowedSizes[size] {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid thumbnail size"})
		return
	}

	// Validate filename is just a basename
	if filepath.Base(name) != name {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid filename"})
		return
	}

	// Construct the full path to the thumbnail file
	thumbnailPath := filepath.Join(mh.uploadDir, size, name)

	if _, err := os.Stat(thumbnailPath); os.IsNotExist(err) {
		c.JSON(http.StatusNotFound, ErrorResponse{Error: "Thumbnail not found"})
		return
	} else if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Filesystem error"})
		return
	}

	c.File(thumbnailPath)
}

// ListPublicMediasHandler returns a paginated list of medias for public consumption
func (mh *MediaHandler) ListPublicMediasHandler(c *gin.Context) {
	limitStr := c.DefaultQuery("limit", "10")
	offsetStr := c.DefaultQuery("offset", "0")

	limit, err := strconv.Atoi(limitStr)
	if err != nil {
		limit = 10
	}
	offset, err := strconv.Atoi(offsetStr)
	if err != nil {
		offset = 0
	}

	mediaRows, err := mh.queries.ListPublicMedia(c.Request.Context(), db.ListPublicMediaParams{
		Limit:  int32(limit),
		Offset: int32(offset),
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Database error fetching media"})
		return
	}

	total, _ := mh.queries.CountPublicMedia(c.Request.Context())

	var medias []models.Media
	for _, row := range mediaRows {
		medias = append(medias, models.Media{
			ID:           uint(row.ID),
			Filename:     row.Filename,
			StoredName:   row.StoredName,
			URL:          mh.GenMediaURL(row.StoredName),
			Thumb160x100: mh.GenThumbnailURL(row.StoredName, "160x100"),
			Thumb320x200: mh.GenThumbnailURL(row.StoredName, "320x200"),
			Thumb640x400: mh.GenThumbnailURL(row.StoredName, "640x400"),

			Type:      row.Type,
			MimeType:  row.MimeType,
			Size:      row.Size,
			UserID:    uint(row.UserID),
			UserName:  row.UserName,
			UserTel:   row.UserTel.String,
			UserEmail: row.UserEmail,
			CreatedAt: row.CreatedAt,
			UpdatedAt: row.UpdatedAt,
		})
	}

	c.JSON(http.StatusOK, SuccessResponse{Data: map[string]interface{}{
		"files":  medias,
		"total":  total,
		"limit":  limit,
		"offset": offset,
	}})
}

// ListAlbumMediaHandler returns all media files for a specific album
func (mh *MediaHandler) ListAlbumMediaHandler(c *gin.Context) {
	albumIDStr := c.Param("album_id")
	albumID, err := strconv.ParseInt(albumIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid album ID"})
		return
	}

	mediaRows, err := mh.queries.GetAlbumMedia(c.Request.Context(), albumID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Database error fetching album media"})
		return
	}

	var medias []models.Media
	for _, row := range mediaRows {
		medias = append(medias, models.Media{
			ID:           uint(row.ID),
			Filename:     row.Filename,
			StoredName:   row.StoredName,
			URL:          mh.GenMediaURL(row.StoredName),
			Thumb160x100: mh.GenThumbnailURL(row.StoredName, "160x100"),
			Thumb320x200: mh.GenThumbnailURL(row.StoredName, "320x200"),
			Thumb640x400: mh.GenThumbnailURL(row.StoredName, "640x400"),
			Type:         row.Type.String,
			MimeType:     row.MimeType.String,
			Size:         row.Size,
			UserID:       uint(row.UserID),
			CreatedAt:    row.CreatedAt,
			UpdatedAt:    row.UpdatedAt,
		})
	}

	if medias == nil {
		medias = []models.Media{}
	}

	c.JSON(http.StatusOK, SuccessResponse{Data: medias})
}

func GenMediaURL(s string) {
	panic("unimplemented")
}

// UpdateMediaRequest represents payload for updating media
type UpdateMediaRequest struct {
	Filename string `json:"filename"`
}

// UpdateMediaHandler updates media metadata and optionally replaces the file
func (mh *MediaHandler) UpdateMediaHandler(c *gin.Context) {
	mediaIDStr := c.Param("id")
	mediaID, err := strconv.ParseInt(mediaIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid ID"})
		return
	}

	// Get current user
	authUser, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, ErrorResponse{Error: "Unauthorized"})
		return
	}
	user := authUser.(*models.User)

	mediaRow, err := mh.queries.GetMediaByID(c.Request.Context(), int64(mediaID))
	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, ErrorResponse{Error: "Media not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Database error"})
		return
	}

	// Access Control: Owner or Admin
	if uint64(mediaRow.UserID) != uint64(user.ID) && !user.HasRole("admin") {
		c.JSON(http.StatusForbidden, ErrorResponse{Error: "Forbidden"})
		return
	}

	// Check if content type is JSON
	contentType := c.GetHeader("Content-Type")
	newFilename := mediaRow.Filename

	if contentType == "application/json" {
		var req UpdateMediaRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid input"})
			return
		}
		if req.Filename != "" {
			newFilename = req.Filename
		}
	} else {
		// Handle multipart/form-data
		if f := c.PostForm("filename"); f != "" {
			newFilename = f
		}

		// Check for file replacement
		file, err := c.FormFile("file")
		if err == nil {
			// 1. Delete old file from disk
			oldPath := filepath.Join(mh.uploadDir, mediaRow.StoredName)
			_ = os.Remove(oldPath)

			// 2. Save new file
			ext := filepath.Ext(file.Filename)
			uniqueName := fmt.Sprintf("%d_%d%s", user.ID, time.Now().UnixNano(), ext)
			dst := filepath.Join(mh.uploadDir, uniqueName)

			if err := c.SaveUploadedFile(file, dst); err != nil {
				c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to save new file"})
				return
			}

			// Update row values
			// Note: We need a specialized query for this or use conn.Exec
			_, _ = mh.conn.ExecContext(c.Request.Context(), "UPDATE media SET stored_name = $2, mime_type = $3, size = $4 WHERE id = $1",
				mediaRow.ID, uniqueName, file.Header.Get("Content-Type"), file.Size)
		}
	}

	// Update record
	updatedRow, err := mh.queries.UpdateMedia(c.Request.Context(), db.UpdateMediaParams{
		ID:       mediaRow.ID,
		Filename: newFilename,
		Type:     sql.NullString{String: mediaRow.Type, Valid: true},
		MimeType: sql.NullString{String: mediaRow.MimeType, Valid: true},
		Size:     mediaRow.Size,
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to update media"})
		return
	}

	c.JSON(http.StatusOK, SuccessResponse{Data: updatedRow})
}

// DeleteMediaHandler deletes media file and record
func (mh *MediaHandler) DeleteMediaHandler(c *gin.Context) {
	mediaIDStr := c.Param("id")
	mediaID, err := strconv.ParseInt(mediaIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid ID"})
		return
	}

	// Get current user
	authUser, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, ErrorResponse{Error: "Unauthorized"})
		return
	}
	user := authUser.(*models.User)

	mediaRow, err := mh.queries.GetMediaByID(c.Request.Context(), int64(mediaID))
	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, ErrorResponse{Error: "Media not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Database error"})
		return
	}

	// Access Control: Owner or Admin
	if uint64(mediaRow.UserID) != uint64(user.ID) && !user.HasRole("admin") {
		c.JSON(http.StatusForbidden, ErrorResponse{Error: "Forbidden"})
		return
	}

	// Delete file from disk
	filePath := filepath.Join(mh.uploadDir, mediaRow.StoredName)
	_ = os.Remove(filePath)

	// Delete from DB (Hard delete since we also removed the file)
	err = mh.queries.PermanentlyDeleteMedia(c.Request.Context(), int64(mediaID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to delete media record: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, SuccessResponse{Data: map[string]string{"message": "Media deleted successfully"}})
}
