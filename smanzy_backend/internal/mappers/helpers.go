package mappers

import (
	"database/sql"
	"path/filepath"
	"strings"
)

// GetMediaURL constructs the public URL for a media file.
func GetMediaURL(storedName string) string {
	return "/api/media/files/" + storedName
}

// GetThumbnailURL constructs the public URL for a media thumbnail.
// It assumes the thumbnail format is JPEG.
// second is optional
func GetThumbnailURL(storedName string, size string) string {
	ext := filepath.Ext(storedName)
	nameWithoutExt := strings.TrimSuffix(storedName, ext)
	if size == "" {
		size = "320x200"
	}
	return "/api/media/" + size + "/" + nameWithoutExt + ".jpg"
}

// NullStringToString safely converts sql.NullString to string.
// Returns empty string if invalid.
func NullStringToString(ns sql.NullString) string {
	if ns.Valid {
		return ns.String
	}
	return ""
}

// NullInt64ToInt safely converts sql.NullInt64 to int.
// Returns 0 if invalid.
func NullInt64ToInt(ni sql.NullInt64) int {
	if ni.Valid {
		return int(ni.Int64)
	}
	return 0
}

// NullBoolToBool safely converts sql.NullBool to bool.
// Returns false if invalid.
func NullBoolToBool(nb sql.NullBool) bool {
	if nb.Valid {
		return nb.Bool
	}
	return false
}
