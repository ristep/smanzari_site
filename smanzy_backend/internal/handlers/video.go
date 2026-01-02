package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"github.com/ristep/smanzy_backend/internal/models"
	"github.com/ristep/smanzy_backend/internal/services"
)

// VideoHandler handles video-related requests
type VideoHandler struct {
	DB             *gorm.DB
	YouTubeService *services.YouTubeService
}

// NewVideoHandler creates a new video handler
func NewVideoHandler(db *gorm.DB, youtubeService *services.YouTubeService) *VideoHandler {
	return &VideoHandler{
		DB:             db,
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

	var videos []models.Video
	var total int64

	// Get total count
	if err := h.DB.Model(&models.Video{}).Count(&total).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to count videos"})
		return
	}

	// Get paginated videos, ordered by published date (newest first)
	if err := h.DB.Order("published_at DESC").Limit(limit).Offset(offset).Find(&videos).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch videos"})
		return
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
	id := c.Param("id")

	var video models.Video
	if err := h.DB.First(&video, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Video not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch video"})
		return
	}

	c.JSON(http.StatusOK, video)
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

	// Update or create videos in database
	var created, updated int
	for _, video := range videos {
		var existing models.Video
		result := h.DB.Where("video_id = ?", video.VideoID).First(&existing)

		if result.Error == gorm.ErrRecordNotFound {
			// Create new video
			if err := h.DB.Create(&video).Error; err != nil {
				continue // Skip this video if creation fails
			}
			created++
		} else if result.Error == nil {
			// Update existing video
			existing.Title = video.Title
			existing.Description = video.Description
			existing.Views = video.Views
			existing.Likes = video.Likes
			existing.ThumbnailURL = video.ThumbnailURL

			if err := h.DB.Save(&existing).Error; err != nil {
				continue // Skip this video if update fails
			}
			updated++
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"message":     "Videos synced successfully",
		"fetched":     len(videos),
		"created":     created,
		"updated":     updated,
		"total_in_db": created + updated,
	})
}
