package mappers

import (
	"database/sql"

	"github.com/ristep/smanzy_backend/internal/db"
	"github.com/ristep/smanzy_backend/internal/models"
)

// UserRowToModel converts a database user row to a User model
func UserRowToModel(row interface{}) models.User {
	// Handle different row types from sqlc
	switch r := row.(type) {
	case db.GetUserByIDRow:
		return models.User{
			ID:            uint(r.ID),
			Email:         r.Email,
			Name:          r.Name,
			Tel:           r.Tel,
			Age:           int(r.Age),
			Gender:        r.Gender,
			Address:       r.Address,
			City:          r.City,
			Country:       r.Country,
			EmailVerified: r.EmailVerified,
			CreatedAt:     r.CreatedAt,
			UpdatedAt:     r.UpdatedAt,
		}
	case db.GetUserByEmailRow:
		return models.User{
			ID:            uint(r.ID),
			Email:         r.Email,
			Name:          r.Name,
			Tel:           r.Tel,
			Age:           int(r.Age),
			Gender:        r.Gender,
			Address:       r.Address,
			City:          r.City,
			Country:       r.Country,
			EmailVerified: r.EmailVerified,
			CreatedAt:     r.CreatedAt,
			UpdatedAt:     r.UpdatedAt,
		}
	case db.ListUsersRow:
		user := models.User{
			ID:            uint(r.ID),
			Email:         r.Email,
			Name:          r.Name,
			Tel:           r.Tel,
			Age:           int(r.Age),
			Gender:        r.Gender,
			Address:       r.Address,
			City:          r.City,
			Country:       r.Country,
			EmailVerified: r.EmailVerified,
			CreatedAt:     r.CreatedAt,
			UpdatedAt:     r.UpdatedAt,
		}
		if r.DeletedAt.Valid {
			user.DeletedAt = &r.DeletedAt.Time
		}
		return user
	case db.CreateUserRow:
		return models.User{
			ID:            uint(r.ID),
			Email:         r.Email,
			Name:          r.Name,
			Tel:           r.Tel,
			Age:           int(r.Age),
			Gender:        r.Gender,
			Address:       r.Address,
			City:          r.City,
			Country:       r.Country,
			EmailVerified: r.EmailVerified,
			CreatedAt:     r.CreatedAt,
			UpdatedAt:     r.UpdatedAt,
		}
	case db.UpdateUserRow:
		return models.User{
			ID:            uint(r.ID),
			Email:         r.Email,
			Name:          r.Name,
			Tel:           r.Tel,
			Age:           int(r.Age),
			Gender:        r.Gender,
			Address:       r.Address,
			City:          r.City,
			Country:       r.Country,
			EmailVerified: r.EmailVerified,
			CreatedAt:     r.CreatedAt,
			UpdatedAt:     r.UpdatedAt,
		}
	default:
		// Return empty user if type not recognized
		return models.User{}
	}
}

// ListUsersRowsToModels converts multiple user rows to User models
func ListUsersRowsToModels(rows []db.ListUsersRow) []models.User {
	users := make([]models.User, len(rows))
	for i, row := range rows {
		users[i] = UserRowToModel(row)
	}
	return users
}

// MediaRowToModel converts a database media row to a Media model
func MediaRowToModel(row interface{}) models.Media {
	switch r := row.(type) {
	case db.GetMediaByIDRow:
		return models.Media{
			ID:         uint(r.ID),
			Filename:   r.Filename,
			StoredName: r.StoredName,
			URL:        r.Url,
			Type:       r.Type,
			MimeType:   r.MimeType,
			Size:       r.Size,
			UserID:     uint(r.UserID),
			CreatedAt:  r.CreatedAt,
			UpdatedAt:  r.UpdatedAt,
		}
	case db.ListPublicMediaRow:
		return models.Media{
			ID:         uint(r.ID),
			Filename:   r.Filename,
			StoredName: r.StoredName,
			URL:        r.Url,
			Type:       r.Type,
			MimeType:   r.MimeType,
			Size:       r.Size,
			UserID:     uint(r.UserID),
			UserName:   r.UserName,
			UserTel:    r.UserTel.String,
			UserEmail:  r.UserEmail, // Add this field
			CreatedAt:  r.CreatedAt,
			UpdatedAt:  r.UpdatedAt,
		}
	case db.ListUserMediaRow:
		return models.Media{
			ID:         uint(r.ID),
			Filename:   r.Filename,
			StoredName: r.StoredName,
			URL:        r.Url,
			Type:       r.Type,
			MimeType:   r.MimeType,
			Size:       r.Size,
			UserID:     uint(r.UserID),
			CreatedAt:  r.CreatedAt,
			UpdatedAt:  r.UpdatedAt,
		}
	case db.CreateMediaRow:
		return models.Media{
			ID:         uint(r.ID),
			Filename:   r.Filename,
			StoredName: r.StoredName,
			URL:        r.Url,
			Type:       r.Type,
			MimeType:   r.MimeType,
			Size:       r.Size,
			UserID:     uint(r.UserID),
			CreatedAt:  r.CreatedAt,
			UpdatedAt:  r.UpdatedAt,
		}
	case db.UpdateMediaRow:
		return models.Media{
			ID:         uint(r.ID),
			Filename:   r.Filename,
			StoredName: r.StoredName,
			URL:        r.Url,
			Type:       r.Type,
			MimeType:   r.MimeType,
			Size:       r.Size,
			UserID:     uint(r.UserID),
			CreatedAt:  r.CreatedAt,
			UpdatedAt:  r.UpdatedAt,
		}
	case db.Medium:
		return models.Media{
			ID:         uint(r.ID),
			Filename:   r.Filename,
			StoredName: r.StoredName,
			URL:        r.Url,
			Type:       r.Type.String,
			MimeType:   r.MimeType.String,
			Size:       r.Size,
			UserID:     uint(r.UserID),
			CreatedAt:  r.CreatedAt,
			UpdatedAt:  r.UpdatedAt,
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

// NullStringToString safely converts sql.NullString to string
func NullStringToString(ns sql.NullString) string {
	if ns.Valid {
		return ns.String
	}
	return ""
}

// NullInt64ToInt safely converts sql.NullInt64 to int
func NullInt64ToInt(ni sql.NullInt64) int {
	if ni.Valid {
		return int(ni.Int64)
	}
	return 0
}

// NullBoolToBool safely converts sql.NullBool to bool
func NullBoolToBool(nb sql.NullBool) bool {
	if nb.Valid {
		return nb.Bool
	}
	return false
}
