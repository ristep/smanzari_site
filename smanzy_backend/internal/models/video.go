package models

import (
	"time"
)

// Video represents a YouTube video stored in the system
type Video struct {
	ID           uint      `json:"id"`
	VideoID      string    `json:"video_id"`      // YouTube video ID (e.g., "DfK5fjVDFJ8")
	Title        string    `json:"title"`         // Video title
	Description  string    `json:"description"`   // Full video description
	PublishedAt  time.Time `json:"published_at"`  // When the video was published on YouTube
	Views        int64     `json:"views"`         // View count
	Likes        int64     `json:"likes"`         // Like count
	ThumbnailURL string    `json:"thumbnail_url"` // URL to video thumbnail image

	CreatedAt int64      `json:"created_at"` // When this record was created
	UpdatedAt int64      `json:"updated_at"` // When this record was last updated
	DeletedAt *time.Time `json:"-"`          // Soft delete support
}
