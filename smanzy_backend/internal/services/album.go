package services

import (
	"context"
	"database/sql"
	"errors"

	"github.com/ristep/smanzy_backend/internal/db"
	"github.com/ristep/smanzy_backend/internal/models"
)

// AlbumService handles business logic for album operations
type AlbumService struct {
	conn    *sql.DB
	queries *db.Queries
}

// NewAlbumService creates a new album service
func NewAlbumService(conn *sql.DB, queries *db.Queries) *AlbumService {
	return &AlbumService{
		conn:    conn,
		queries: queries,
	}
}

// CreateAlbum creates a new album for a user
func (as *AlbumService) CreateAlbum(userID uint, title, description, userName string) (*models.Album, error) {
	if title == "" {
		return nil, errors.New("album title is required")
	}

	albumRow, err := as.queries.CreateAlbum(context.Background(), db.CreateAlbumParams{
		Title:       title,
		Description: sql.NullString{String: description, Valid: true},
		UserID:      int64(userID),
	})

	if err != nil {
		return nil, err
	}

	return &models.Album{
		ID:          uint(albumRow.ID),
		Title:       albumRow.Title,
		Description: albumRow.Description.String,
		UserID:      uint(albumRow.UserID),
		UserName:    userName,
		CreatedAt:   albumRow.CreatedAt,
		UpdatedAt:   albumRow.UpdatedAt,
	}, nil
}

// GetAlbumByID retrieves an album by its ID
func (as *AlbumService) GetAlbumByID(albumID uint) (*models.Album, error) {
	albumRow, err := as.queries.GetAlbumByID(context.Background(), int64(albumID))
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, errors.New("album not found")
		}
		return nil, err
	}

	// Fetch username
	userRow, _ := as.queries.GetUserByID(context.Background(), albumRow.UserID)

	// Fetch media files
	mediaRows, _ := as.queries.GetAlbumMedia(context.Background(), albumRow.ID)

	album := &models.Album{
		ID:          uint(albumRow.ID),
		Title:       albumRow.Title,
		Description: albumRow.Description.String,
		UserID:      uint(albumRow.UserID),
		UserName:    userRow.Name,
		IsPublic:    albumRow.IsPublic.Bool,
		IsShared:    albumRow.IsShared.Bool,
		CreatedAt:   albumRow.CreatedAt,
		UpdatedAt:   albumRow.UpdatedAt,
	}

	for _, m := range mediaRows {
		album.MediaFiles = append(album.MediaFiles, models.Media{
			ID:         uint(m.ID),
			Filename:   m.Filename,
			StoredName: m.StoredName,
			URL:        m.Url,
			Type:       m.Type.String,
			MimeType:   m.MimeType.String,
			Size:       m.Size,
			UserID:     uint(m.UserID),
			CreatedAt:  m.CreatedAt,
			UpdatedAt:  m.UpdatedAt,
		})
	}

	return album, nil
}

// GetUserAlbums retrieves all albums for a user
func (as *AlbumService) GetUserAlbums(userID uint) ([]models.Album, error) {
	albumRows, err := as.queries.ListUserAlbums(context.Background(), int64(userID))
	if err != nil {
		return nil, err
	}

	var albums []models.Album
	for _, row := range albumRows {
		albums = append(albums, models.Album{
			ID:          uint(row.ID),
			Title:       row.Title,
			Description: row.Description.String,
			UserID:      uint(row.UserID),
			UserName:    row.UserName,
			IsPublic:    row.IsPublic.Bool,
			IsShared:    row.IsShared.Bool,
			CreatedAt:   row.CreatedAt,
			UpdatedAt:   row.UpdatedAt,
		})
	}
	return albums, nil
}

// GetAllAlbums retrieves all albums from all users
func (as *AlbumService) GetAllAlbums() ([]models.Album, error) {
	albumRows, err := as.queries.ListAllAlbums(context.Background())
	if err != nil {
		return nil, err
	}

	var albums []models.Album
	for _, row := range albumRows {
		albums = append(albums, models.Album{
			ID:          uint(row.ID),
			Title:       row.Title,
			Description: row.Description.String,
			UserID:      uint(row.UserID),
			UserName:    row.UserName,
			IsPublic:    row.IsPublic.Bool,
			IsShared:    row.IsShared.Bool,
			CreatedAt:   row.CreatedAt,
			UpdatedAt:   row.UpdatedAt,
		})
	}
	return albums, nil
}

// UpdateAlbum updates an album's title and description
func (as *AlbumService) UpdateAlbum(albumID uint, title, description string) (*models.Album, error) {
	albumRaw, err := as.queries.GetAlbumByID(context.Background(), int64(albumID))
	if err != nil {
		return nil, err
	}

	updatedRow, err := as.queries.UpdateAlbum(context.Background(), db.UpdateAlbumParams{
		ID: int64(albumID),
		Title: func() string {
			if title != "" {
				return title
			} else {
				return albumRaw.Title
			}
		}(),
		Description: sql.NullString{String: description, Valid: true},
		IsPublic:    albumRaw.IsPublic,
		IsShared:    albumRaw.IsShared,
	})

	if err != nil {
		return nil, err
	}

	return &models.Album{
		ID:          uint(updatedRow.ID),
		Title:       updatedRow.Title,
		Description: updatedRow.Description.String,
		UserID:      uint(updatedRow.UserID),
		CreatedAt:   updatedRow.CreatedAt,
		UpdatedAt:   updatedRow.UpdatedAt,
	}, nil
}

// AddMediaToAlbum adds a media file to an album
func (as *AlbumService) AddMediaToAlbum(albumID, mediaID uint) error {
	return as.queries.AddMediaToAlbum(context.Background(), db.AddMediaToAlbumParams{
		AlbumID: int64(albumID),
		MediaID: int64(mediaID),
	})
}

// RemoveMediaFromAlbum removes a media file from an album
func (as *AlbumService) RemoveMediaFromAlbum(albumID, mediaID uint) error {
	return as.queries.RemoveMediaFromAlbum(context.Background(), db.RemoveMediaFromAlbumParams{
		AlbumID: int64(albumID),
		MediaID: int64(mediaID),
	})
}

// DeleteAlbum performs a soft delete on an album
func (as *AlbumService) DeleteAlbum(albumID uint) error {
	return as.queries.SoftDeleteAlbum(context.Background(), int64(albumID))
}

// PermanentlyDeleteAlbum permanently deletes an album from the database
func (as *AlbumService) PermanentlyDeleteAlbum(albumID uint) error {
	_, err := as.conn.ExecContext(context.Background(), "DELETE FROM album WHERE id = $1", int64(albumID))
	return err
}
