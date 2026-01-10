package handlers

import (
	"database/sql"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"

	"github.com/ristep/smanzy_backend/internal/db"
	"github.com/ristep/smanzy_backend/internal/models"
	"github.com/ristep/smanzy_backend/internal/services"
)

// VideoHandler handles video-related requests
type VideoHandler struct {
	conn           *sql.DB
	queries        *db.Queries
	YouTubeService *services.YouTubeService
}

// NewVideoHandler creates a new video handler
func NewVideoHandler(conn *sql.DB, queries *db.Queries, youtubeService *services.YouTubeService) *VideoHandler {
	return &VideoHandler{
		conn:           conn,
		queries:        queries,
		YouTubeService: youtubeService,
	}
}

// ListVideosHandler returns all videos from the database
// @Summary List all videos
// @Description Get all YouTube videos stored in the database
// @Tags videos
// @Produce json
// @Param page query int false "Page number" default(1)
// @Param limit query int false "Items per page" default(20)
// @Success 200 {array} models.Video
// @Router /api/videos [get]
func (h *VideoHandler) ListVideosHandler(c *gin.Context) {
	// Parse pagination parameters
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))

	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}

	offset := (page - 1) * limit

	// Get total count
	var total int64
	err := h.conn.QueryRowContext(c.Request.Context(), "SELECT COUNT(*) FROM videos").Scan(&total)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to count videos"})
		return
	}

	// Get paginated videos
	videoRows, err := h.queries.ListVideos(c.Request.Context(), db.ListVideosParams{
		Limit:  int32(limit),
		Offset: int32(offset),
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch videos"})
		return
	}

	var videos []models.Video
	for _, row := range videoRows {
		videos = append(videos, models.Video{
			ID:           uint(row.ID),
			VideoID:      row.VideoID,
			Title:        row.Title,
			Description:  row.Description.String,
			PublishedAt:  row.PublishedAt.Time,
			Views:        row.Views.Int64,
			Likes:        row.Likes.Int64,
			ThumbnailURL: row.ThumbnailUrl.String,
			CreatedAt:    row.CreatedAt,
			UpdatedAt:    row.UpdatedAt,
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"videos": videos,
		"total":  total,
		"page":   page,
		"limit":  limit,
	})
}

// GetVideoHandler returns a single video by ID
// @Summary Get video by ID
// @Description Get a specific video by its database ID
// @Tags videos
// @Produce json
// @Param id path int true "Video ID"
// @Success 200 {object} models.Video
// @Router /api/videos/{id} [get]
func (h *VideoHandler) GetVideoHandler(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	row, err := h.queries.GetVideoByID(c.Request.Context(), int64(id))
	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{"error": "Video not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch video"})
		return
	}

	apiVideo := models.Video{
		ID:           uint(row.ID),
		VideoID:      row.VideoID,
		Title:        row.Title,
		Description:  row.Description.String,
		PublishedAt:  row.PublishedAt.Time,
		Views:        row.Views.Int64,
		Likes:        row.Likes.Int64,
		ThumbnailURL: row.ThumbnailUrl.String,
		CreatedAt:    row.CreatedAt,
		UpdatedAt:    row.UpdatedAt,
	}

	c.JSON(http.StatusOK, apiVideo)
}

// SyncVideosHandler fetches videos from YouTube and updates the database
// @Summary Sync videos from YouTube
// @Description Fetch latest videos from YouTube channel and update database
// @Tags videos
// @Produce json
// @Param max_results query int false "Maximum number of videos to fetch" default(50)
// @Success 200 {object} map[string]interface{}
// @Router /api/videos/sync [post]
func (h *VideoHandler) SyncVideosHandler(c *gin.Context) {
	// Parse max results parameter
	maxResults, _ := strconv.Atoi(c.DefaultQuery("max_results", "50"))
	if maxResults < 1 || maxResults > 50 {
		maxResults = 50
	}

	// Fetch videos from YouTube
	videos, err := h.YouTubeService.FetchChannelVideos(maxResults)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to fetch videos from YouTube",
			"details": err.Error(),
		})
		return
	}
	var videosCount int32 = int32(len(videos))

	// Update or create videos in database
	var errors []error
	for _, v := range videos {
		_, _ = h.queries.CreateVideo(c.Request.Context(), db.CreateVideoParams{
			VideoID:      v.VideoID,
			Title:        v.Title,
			Description:  sql.NullString{String: v.Description, Valid: true},
			PublishedAt:  sql.NullTime{Time: v.PublishedAt, Valid: true},
			Views:        sql.NullInt64{Int64: v.Views, Valid: true},
			Likes:        sql.NullInt64{Int64: v.Likes, Valid: true},
			ThumbnailUrl: sql.NullString{String: v.ThumbnailURL, Valid: true},
		})
		if err != nil {
			errors = append(errors, err)
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Videos synced successfully",
		"fetched": len(videos),
		"sobrani": videosCount,
		"errors":  errors,
	})
}
