package mappers

import (
	"github.com/ristep/smanzy_backend/internal/db"
	"github.com/ristep/smanzy_backend/internal/models"
)

// AlbumRowToModel converts a database album row to an Album model
func AlbumRowToModel(row interface{}) models.Album {
	switch r := row.(type) {
	case db.Album:
		return models.Album{
			ID:          uint(r.ID),
			Title:       r.Title,
			Description: r.Description.String,
			UserID:      uint(r.UserID),
			IsPublic:    r.IsPublic.Bool,
			IsShared:    r.IsShared.Bool,
			CreatedAt:   r.CreatedAt,
			UpdatedAt:   r.UpdatedAt,
		}
	case db.ListUserAlbumsRow:
		return models.Album{
			ID:          uint(r.ID),
			Title:       r.Title,
			Description: r.Description.String,
			UserID:      uint(r.UserID),
			UserName:    r.UserName,
			IsPublic:    r.IsPublic.Bool,
			IsShared:    r.IsShared.Bool,
			CreatedAt:   r.CreatedAt,
			UpdatedAt:   r.UpdatedAt,
		}
	case db.ListAllAlbumsRow:
		return models.Album{
			ID:          uint(r.ID),
			Title:       r.Title,
			Description: r.Description.String,
			UserID:      uint(r.UserID),
			UserName:    r.UserName,
			IsPublic:    r.IsPublic.Bool,
			IsShared:    r.IsShared.Bool,
			CreatedAt:   r.CreatedAt,
			UpdatedAt:   r.UpdatedAt,
		}
	default:
		return models.Album{}
	}
}

// ListUserAlbumsRowsToModels converts multiple album rows to Album models
func ListUserAlbumsRowsToModels(rows []db.ListUserAlbumsRow) []models.Album {
	albums := make([]models.Album, len(rows))
	for i, row := range rows {
		albums[i] = AlbumRowToModel(row)
	}
	return albums
}

// ListAllAlbumsRowsToModels converts multiple album rows to Album models
func ListAllAlbumsRowsToModels(rows []db.ListAllAlbumsRow) []models.Album {
	albums := make([]models.Album, len(rows))
	for i, row := range rows {
		albums[i] = AlbumRowToModel(row)
	}
	return albums
}
