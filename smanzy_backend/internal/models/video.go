package models

import (
	"time"

	"gorm.io/gorm"
)

// Video represents a YouTube video stored in the system
// It tracks video metadata fetched from YouTube API
type Video struct {
	ID           uint      `gorm:"primaryKey" json:"id"`
	VideoID      string    `gorm:"uniqueIndex;not null" json:"video_id"` // YouTube video ID (e.g., "DfK5fjVDFJ8")
	Title        string    `gorm:"not null" json:"title"`                // Video title
	Description  string    `gorm:"type:text" json:"description"`         // Full video description
	PublishedAt  time.Time `json:"published_at"`                         // When the video was published on YouTube
	Views        int64     `json:"views"`                                // View count
	Likes        int64     `json:"likes"`                                // Like count
	ThumbnailURL string    `json:"thumbnail_url"`                        // URL to video thumbnail image

	CreatedAt int64          `gorm:"autoCreateTime:milli" json:"created_at"` // When this record was created
	UpdatedAt int64          `gorm:"autoUpdateTime:milli" json:"updated_at"` // When this record was last updated
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`                         // Soft delete support
}

// TableName specifies the table name for Video
func (Video) TableName() string {
	return "videos"
}
