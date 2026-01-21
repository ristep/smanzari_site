package mappers

import (
	"github.com/ristep/smanzy_backend/internal/db"
	"github.com/ristep/smanzy_backend/internal/models"
)

// UserRowToModel converts a database user row to a User model.
// Since sqlc generates distinct struct types for each query (even if fields are identical),
// this function uses a type switch to handle all known user-related database row types.
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
		// ListUsersRow includes soft delete information which needs to be mapped optionally
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
		// Return empty user if type not recognized to avoid panics
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
