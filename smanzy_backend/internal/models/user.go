package models

import "time"

// User represents a user in the system
type User struct {
	ID            uint       `json:"id"`
	Email         string     `json:"email"`
	Password      string     `json:"-"`
	Name          string     `json:"name"`
	Tel           string     `json:"tel"`
	Age           int        `json:"age"`
	Address       string     `json:"address"`
	City          string     `json:"city"`
	Country       string     `json:"country"`
	Gender        string     `json:"gender"`
	EmailVerified bool       `json:"email_verified"`
	Roles         []Role     `json:"roles"`
	CreatedAt     int64      `json:"created_at"`
	UpdatedAt     int64      `json:"updated_at"`
	DeletedAt     *time.Time `json:"deleted_at,omitempty"`
}

// Role represents a role in the system (e.g. "admin", "user")
type Role struct {
	ID        uint   `json:"id"`
	Name      string `json:"name"`
	Users     []User `json:"users,omitempty"`
	CreatedAt int64  `json:"created_at"`
	UpdatedAt int64  `json:"updated_at"`
}

// HasRole checks if the user has a specific role
// This is a helper method we can call on any User instance.
func (u *User) HasRole(roleName string) bool {
	for _, role := range u.Roles {
		if role.Name == roleName {
			return true
		}
	}
	return false
}
