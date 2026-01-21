package mappers

import (
	"github.com/ristep/smanzy_backend/internal/db"
	"github.com/ristep/smanzy_backend/internal/models"
)

// MediaRowToModel converts a database media row to a Media model.
// It uses helper functions to generate the full URLs for files and thumbnails.
func MediaRowToModel(row any) models.Media {
	switch r := row.(type) {
	case db.GetMediaByIDRow:
		return models.Media{
			ID:           uint(r.ID),
			Filename:     r.Filename,
			StoredName:   r.StoredName,
			URL:          GetMediaURL(r.StoredName),
			ThumbnailURL: GetThumbnailURL(r.StoredName),
			Type:         r.Type,
			MimeType:     r.MimeType,
			Size:         r.Size,
			UserID:       uint(r.UserID),
			CreatedAt:    r.CreatedAt,
			UpdatedAt:    r.UpdatedAt,
		}
	case db.ListPublicMediaRow:
		return models.Media{
			ID:           uint(r.ID),
			Filename:     r.Filename,
			StoredName:   r.StoredName,
			URL:          GetMediaURL(r.StoredName),
			ThumbnailURL: GetThumbnailURL(r.StoredName),
			Type:         r.Type,
			MimeType:     r.MimeType,
			Size:         r.Size,
			UserID:       uint(r.UserID),
			UserName:     r.UserName,
			UserTel:      r.UserTel.String,
			UserEmail:    r.UserEmail,
			CreatedAt:    r.CreatedAt,
			UpdatedAt:    r.UpdatedAt,
		}
	case db.ListUserMediaRow:
		return models.Media{
			ID:           uint(r.ID),
			Filename:     r.Filename,
			StoredName:   r.StoredName,
			URL:          GetMediaURL(r.StoredName),
			ThumbnailURL: GetThumbnailURL(r.StoredName),
			Type:         r.Type,
			MimeType:     r.MimeType,
			Size:         r.Size,
			UserID:       uint(r.UserID),
			CreatedAt:    r.CreatedAt,
			UpdatedAt:    r.UpdatedAt,
		}
	case db.CreateMediaRow:
		return models.Media{
			ID:           uint(r.ID),
			Filename:     r.Filename,
			StoredName:   r.StoredName,
			URL:          GetMediaURL(r.StoredName),
			ThumbnailURL: GetThumbnailURL(r.StoredName),
			Type:         r.Type,
			MimeType:     r.MimeType,
			Size:         r.Size,
			UserID:       uint(r.UserID),
			CreatedAt:    r.CreatedAt,
			UpdatedAt:    r.UpdatedAt,
		}
	case db.UpdateMediaRow:
		return models.Media{
			ID:           uint(r.ID),
			Filename:     r.Filename,
			StoredName:   r.StoredName,
			URL:          GetMediaURL(r.StoredName),
			ThumbnailURL: GetThumbnailURL(r.StoredName),
			Type:         r.Type,
			MimeType:     r.MimeType,
			Size:         r.Size,
			UserID:       uint(r.UserID),
			CreatedAt:    r.CreatedAt,
			UpdatedAt:    r.UpdatedAt,
		}
	case db.Medium:
		return models.Media{
			ID:           uint(r.ID),
			Filename:     r.Filename,
			StoredName:   r.StoredName,
			URL:          GetMediaURL(r.StoredName),
			ThumbnailURL: GetThumbnailURL(r.StoredName),
			Type:         r.Type.String,
			MimeType:     r.MimeType.String,
			Size:         r.Size,
			UserID:       uint(r.UserID),
			CreatedAt:    r.CreatedAt,
			UpdatedAt:    r.UpdatedAt,
		}
	default:
		return models.Media{}
	}
}

// ListPublicMediaRowsToModels converts multiple media rows to Media models
func ListPublicMediaRowsToModels(rows []db.ListPublicMediaRow) []models.Media {
	medias := make([]models.Media, len(rows))
	for i, row := range rows {
		medias[i] = MediaRowToModel(row)
	}
	return medias
}
