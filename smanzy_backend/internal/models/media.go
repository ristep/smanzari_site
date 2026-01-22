package models

import "time"

// Media represents a media file uploaded to the system
type Media struct {
	ID         uint   `json:"id"`
	Filename   string `json:"filename"`    // Original name of the file
	StoredName string `json:"stored_name"` // Unique name on disk (to prevent overwrites)
	URL        string `json:"url"`         // Public URL to access the file

	Thumb160x100 string `json:"thumb_160x100"`
	Thumb320x200 string `json:"thumb_320x200"`
	Thumb640x400 string `json:"thumb_640x400"`
	Thumb800x600 string `json:"thumb_800x600"`

	Type     string `json:"type"`      // General category (e.g., "image", "video")
	MimeType string `json:"mime_type"` // Specific MIME type (e.g., "image/jpeg", "application/pdf")
	Size     int64  `json:"size"`      // File size in bytes

	UserID    uint   `json:"user_id"`
	UserName  string `json:"user_name"`
	UserTel   string `json:"user_tel"`
	UserEmail string `json:"user_email"` // Add this field

	CreatedAt int64      `json:"created_at"`
	UpdatedAt int64      `json:"updated_at"`
	DeletedAt *time.Time `json:"-"`
}

// end of Media struct
