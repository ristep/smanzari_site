package models

import "time"

// MediaAlbum represents a collection/album of media files
type Album struct {
	ID          uint   `json:"id"`
	Title       string `json:"title"`
	Description string `json:"description"`

	UserID   uint   `json:"user_id"`
	UserName string `json:"user_name"`

	IsPublic bool `json:"is_public"`
	IsShared bool `json:"is_shared"`

	MediaFiles []Media `json:"media_files"`

	CreatedAt int64      `json:"created_at"`
	UpdatedAt int64      `json:"updated_at"`
	DeletedAt *time.Time `json:"-"`
}
