package handlers

import (
	"database/sql"
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"

	"github.com/ristep/smanzy_backend/internal/auth"
	"github.com/ristep/smanzy_backend/internal/db"
	"github.com/ristep/smanzy_backend/internal/models"
)

// AuthHandler handles authentication-related HTTP requests
type AuthHandler struct {
	conn       *sql.DB
	queries    *db.Queries
	jwtService *auth.JWTService
}

// NewAuthHandler creates a new auth handler
func NewAuthHandler(conn *sql.DB, queries *db.Queries, jwtService *auth.JWTService) *AuthHandler {
	return &AuthHandler{
		conn:       conn,
		queries:    queries,
		jwtService: jwtService,
	}
}

// RegisterRequest represents the JSON payload for registration
type RegisterRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=8"`
	Name     string `json:"name" binding:"required,min=2"`
	Tel      string `json:"tel"`
	Age      int    `json:"age"`
	Gender   string `json:"gender"`
	Address  string `json:"address"`
	City     string `json:"city"`
	Country  string `json:"country"`
}

// LoginRequest represents the JSON payload for login
type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

// RefreshRequest represents the JSON payload for refresh token
type RefreshRequest struct {
	RefreshToken string `json:"refresh_token" binding:"required"`
}

// SuccessResponse represents a successful API response
type SuccessResponse struct {
	Data interface{} `json:"data"`
}

// ErrorResponse represents an error API response
type ErrorResponse struct {
	Error string `json:"error"`
}

// RegisterHandler handles user registration
func (ah *AuthHandler) RegisterHandler(c *gin.Context) {
	var req RegisterRequest

	// Validate JSON input
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid input"})
		return
	}

	// Check if user already exists
	_, err := ah.queries.GetUserByEmail(c.Request.Context(), req.Email)
	if err == nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "User already exists"})
		return
	} else if err != sql.ErrNoRows {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Database error"})
		return
	}

	// Hash the password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to process password"})
		return
	}

	// Get or create the default "user" role
	userRole, err := ah.queries.GetRoleByName(c.Request.Context(), "user")
	if err != nil {
		if err == sql.ErrNoRows {
			userRole, err = ah.queries.CreateRole(c.Request.Context(), "user")
			if err != nil {
				c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Database error creating role"})
				return
			}
		} else {
			c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Database error fetching role"})
			return
		}
	}

	// Create the new user
	newUserRow, err := ah.queries.CreateUser(c.Request.Context(), db.CreateUserParams{
		Email:    req.Email,
		Password: string(hashedPassword),
		Name:     req.Name,
		Tel:      sql.NullString{String: req.Tel, Valid: req.Tel != ""},
		Age:      sql.NullInt32{Int32: int32(req.Age), Valid: req.Age != 0},
		Gender:   sql.NullString{String: req.Gender, Valid: req.Gender != ""},
		Address:  sql.NullString{String: req.Address, Valid: req.Address != ""},
		City:     sql.NullString{String: req.City, Valid: req.City != ""},
		Country:  sql.NullString{String: req.Country, Valid: req.Country != ""},
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to create user"})
		return
	}

	// Assign the role
	err = ah.queries.AssignRole(c.Request.Context(), db.AssignRoleParams{
		UserID: newUserRow.ID,
		RoleID: userRole.ID,
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to assign role"})
		return
	}

	// Fetch roles for the user
	roles, err := ah.queries.GetUserRoles(c.Request.Context(), newUserRow.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to retrieve roles"})
		return
	}

	// Map back to models.User (DTO)
	apiUser := models.User{
		ID:            uint(newUserRow.ID),
		Email:         newUserRow.Email,
		Name:          newUserRow.Name,
		Tel:           newUserRow.Tel,
		Age:           int(newUserRow.Age),
		Gender:        newUserRow.Gender,
		Address:       newUserRow.Address,
		City:          newUserRow.City,
		Country:       newUserRow.Country,
		EmailVerified: newUserRow.EmailVerified,
		CreatedAt:     newUserRow.CreatedAt,
		UpdatedAt:     newUserRow.UpdatedAt,
	}
	for _, r := range roles {
		apiUser.Roles = append(apiUser.Roles, models.Role{
			ID:   uint(r.ID),
			Name: r.Name,
		})
	}

	// Generate tokens
	tokenPair, err := ah.jwtService.GenerateTokenPair(&apiUser)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to generate tokens"})
		return
	}

	c.JSON(http.StatusCreated, SuccessResponse{Data: map[string]interface{}{
		"user":          apiUser,
		"access_token":  tokenPair.AccessToken,
		"refresh_token": tokenPair.RefreshToken,
	}})
}

// LoginHandler handles user login
func (ah *AuthHandler) LoginHandler(c *gin.Context) {
	var req LoginRequest

	// Validate JSON input
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid input"})
		return
	}

	// Find user by email
	userRow, err := ah.queries.GetUserByEmail(c.Request.Context(), req.Email)
	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusUnauthorized, ErrorResponse{Error: "Invalid email or password"})
			return
		}
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Database error"})
		return
	}

	// Compare passwords
	if err := bcrypt.CompareHashAndPassword([]byte(userRow.Password), []byte(req.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, ErrorResponse{Error: "Invalid email or password"})
		return
	}

	// Fetch roles
	roles, err := ah.queries.GetUserRoles(c.Request.Context(), userRow.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to fetch roles"})
		return
	}

	// Map to models.User (DTO)
	apiUser := models.User{
		ID:            uint(userRow.ID),
		Email:         userRow.Email,
		Name:          userRow.Name,
		Tel:           userRow.Tel,
		Age:           int(userRow.Age),
		Gender:        userRow.Gender,
		Address:       userRow.Address,
		City:          userRow.City,
		Country:       userRow.Country,
		EmailVerified: userRow.EmailVerified,
		CreatedAt:     userRow.CreatedAt,
		UpdatedAt:     userRow.UpdatedAt,
	}
	for _, r := range roles {
		apiUser.Roles = append(apiUser.Roles, models.Role{
			ID:   uint(r.ID),
			Name: r.Name,
		})
	}

	// Generate tokens
	tokenPair, err := ah.jwtService.GenerateTokenPair(&apiUser)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to generate tokens"})
		return
	}

	c.JSON(http.StatusOK, SuccessResponse{Data: map[string]interface{}{
		"user":          apiUser,
		"access_token":  tokenPair.AccessToken,
		"refresh_token": tokenPair.RefreshToken,
	}})
}

// RefreshHandler handles token refresh
func (ah *AuthHandler) RefreshHandler(c *gin.Context) {
	var req RefreshRequest

	// Validate JSON input
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid input"})
		return
	}

	// Validate the refresh token
	claims, err := ah.jwtService.ValidateRefreshToken(req.RefreshToken)
	if err != nil {
		c.JSON(http.StatusUnauthorized, ErrorResponse{Error: "Invalid refresh token"})
		return
	}

	// Fetch the user from the database
	userRow, err := ah.queries.GetUserByID(c.Request.Context(), int32(claims.UserID))
	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusUnauthorized, ErrorResponse{Error: "User not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Database error"})
		return
	}

	// Fetch roles
	roles, err := ah.queries.GetUserRoles(c.Request.Context(), userRow.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to fetch roles"})
		return
	}

	// Map to models.User (DTO)
	apiUser := models.User{
		ID:            uint(userRow.ID),
		Email:         userRow.Email,
		Name:          userRow.Name,
		Tel:           userRow.Tel,
		Age:           int(userRow.Age),
		Gender:        userRow.Gender,
		Address:       userRow.Address,
		City:          userRow.City,
		Country:       userRow.Country,
		EmailVerified: userRow.EmailVerified,
		CreatedAt:     userRow.CreatedAt,
		UpdatedAt:     userRow.UpdatedAt,
	}
	for _, r := range roles {
		apiUser.Roles = append(apiUser.Roles, models.Role{
			ID:   uint(r.ID),
			Name: r.Name,
		})
	}

	// Generate a new token pair
	tokenPair, err := ah.jwtService.GenerateTokenPair(&apiUser)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to generate tokens"})
		return
	}

	c.JSON(http.StatusOK, SuccessResponse{Data: map[string]interface{}{
		"access_token":  tokenPair.AccessToken,
		"refresh_token": tokenPair.RefreshToken,
	}})
}

// ProfileHandler returns the current user's profile
func (ah *AuthHandler) ProfileHandler(c *gin.Context) {
	// Get user from context (set by middleware)
	user, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, ErrorResponse{Error: "Unauthorized"})
		return
	}

	userObj, ok := user.(*models.User)
	if !ok {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Invalid user data"})
		return
	}

	c.JSON(http.StatusOK, SuccessResponse{Data: userObj})
}

// UpdateProfileHandler updates the current user's profile
func (ah *AuthHandler) UpdateProfileHandler(c *gin.Context) {
	var req UpdateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid input"})
		return
	}

	// Get user from context
	user, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, ErrorResponse{Error: "Unauthorized"})
		return
	}

	userObj := user.(*models.User)

	// Update fields using sqlc
	updatedRow, err := ah.queries.UpdateUser(c.Request.Context(), db.UpdateUserParams{
		ID: int32(userObj.ID),
		Name: func() string {
			if req.Name != "" {
				return req.Name
			} else {
				return userObj.Name
			}
		}(),
		Tel: sql.NullString{String: func() string {
			if req.Tel != "" {
				return req.Tel
			} else {
				return userObj.Tel
			}
		}(), Valid: true},
		Age: sql.NullInt32{Int32: int32(func() int {
			if req.Age != 0 {
				return req.Age
			} else {
				return userObj.Age
			}
		}()), Valid: true},
		Address: sql.NullString{String: func() string {
			if req.Address != "" {
				return req.Address
			} else {
				return userObj.Address
			}
		}(), Valid: true},
		City: sql.NullString{String: func() string {
			if req.City != "" {
				return req.City
			} else {
				return userObj.City
			}
		}(), Valid: true},
		Country: sql.NullString{String: func() string {
			if req.Country != "" {
				return req.Country
			} else {
				return userObj.Country
			}
		}(), Valid: true},
		Gender: sql.NullString{String: func() string {
			if req.Gender != "" {
				return req.Gender
			} else {
				return userObj.Gender
			}
		}(), Valid: true},
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to update profile"})
		return
	}

	// Map back to userObj
	userObj.Name = updatedRow.Name
	userObj.Tel = updatedRow.Tel
	userObj.Age = int(updatedRow.Age)
	userObj.Address = updatedRow.Address
	userObj.City = updatedRow.City
	userObj.Country = updatedRow.Country
	userObj.Gender = updatedRow.Gender
	userObj.UpdatedAt = updatedRow.UpdatedAt

	c.JSON(http.StatusOK, SuccessResponse{Data: userObj})
}

// DeleteProfileHandler deletes the current user's profile
func (ah *AuthHandler) DeleteProfileHandler(c *gin.Context) {
	// Get user from context
	user, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, ErrorResponse{Error: "Unauthorized"})
		return
	}

	userObj := user.(*models.User)

	// In Pure SQL, we handle the soft delete
	err := ah.queries.SoftDeleteUser(c.Request.Context(), int32(userObj.ID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to delete profile"})
		return
	}

	c.JSON(http.StatusOK, SuccessResponse{Data: map[string]string{"message": "Profile deleted successfully"}})
}

// UserHandler represents handlers for user management
type UserHandler struct {
	conn    *sql.DB
	queries *db.Queries
}

// NewUserHandler creates a new user handler
func NewUserHandler(conn *sql.DB, queries *db.Queries) *UserHandler {
	return &UserHandler{
		conn:    conn,
		queries: queries,
	}
}

// GetAllUsersHandler returns all users (admin only)
func (uh *UserHandler) GetAllUsersHandler(c *gin.Context) {
	userRows, err := uh.queries.ListUsers(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Database error"})
		return
	}

	var users []models.User
	for _, row := range userRows {
		// Fetch roles for each user
		roles, _ := uh.queries.GetUserRoles(c.Request.Context(), row.ID)

		apiUser := models.User{
			ID:            uint(row.ID),
			Email:         row.Email,
			Name:          row.Name,
			Tel:           row.Tel,
			Age:           int(row.Age),
			Gender:        row.Gender,
			Address:       row.Address,
			City:          row.City,
			Country:       row.Country,
			EmailVerified: row.EmailVerified,
			CreatedAt:     row.CreatedAt,
			UpdatedAt:     row.UpdatedAt,
		}
		for _, r := range roles {
			apiUser.Roles = append(apiUser.Roles, models.Role{
				ID:   uint(r.ID),
				Name: r.Name,
			})
		}
		if row.DeletedAt.Valid {
			apiUser.DeletedAt = &row.DeletedAt.Time
		}
		users = append(users, apiUser)
	}

	c.JSON(http.StatusOK, SuccessResponse{Data: users})
}

// GetAllUsersWithDeletedHandler returns all users including soft-deleted ones (admin only)
func (uh *UserHandler) GetAllUsersWithDeletedHandler(c *gin.Context) {
	// We need a specific query for this or just use the one we have and check logic.
	// Actually, GetUserByEmailWithDeleted exists but ListUsersWithDeleted doesn't.
	// I'll use a direct query for now or add it to users.sql.
	rows, err := uh.conn.QueryContext(c.Request.Context(), "SELECT id, email, password, name, COALESCE(tel, '') as tel, COALESCE(age, 0) as age, COALESCE(address, '') as address, COALESCE(city, '') as city, COALESCE(country, '') as country, COALESCE(gender, '') as gender, COALESCE(email_verified, false) as email_verified, created_at, updated_at, deleted_at FROM users ORDER BY id")
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Database error"})
		return
	}
	defer rows.Close()

	var users []models.User
	for rows.Next() {
		var row db.GetUserByEmailWithDeletedRow
		if err := rows.Scan(&row.ID, &row.Email, &row.Password, &row.Name, &row.Tel, &row.Age, &row.Address, &row.City, &row.Country, &row.Gender, &row.EmailVerified, &row.CreatedAt, &row.UpdatedAt, &row.DeletedAt); err != nil {
			continue
		}

		roles, _ := uh.queries.GetUserRoles(c.Request.Context(), row.ID)
		apiUser := models.User{
			ID:            uint(row.ID),
			Email:         row.Email,
			Name:          row.Name,
			Tel:           row.Tel,
			Age:           int(row.Age),
			Gender:        row.Gender,
			Address:       row.Address,
			City:          row.City,
			Country:       row.Country,
			EmailVerified: row.EmailVerified,
			CreatedAt:     row.CreatedAt,
			UpdatedAt:     row.UpdatedAt,
		}
		for _, r := range roles {
			apiUser.Roles = append(apiUser.Roles, models.Role{
				ID:   uint(r.ID),
				Name: r.Name,
			})
		}
		if row.DeletedAt.Valid {
			apiUser.DeletedAt = &row.DeletedAt.Time
		}
		users = append(users, apiUser)
	}

	c.JSON(http.StatusOK, SuccessResponse{Data: users})
}

// RestoreUserHandler restores a soft-deleted user (admin only)
func (uh *UserHandler) RestoreUserHandler(c *gin.Context) {
	userIDStr := c.Param("id")
	userID, err := strconv.ParseInt(userIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid user ID"})
		return
	}

	err = uh.queries.RestoreUser(c.Request.Context(), int32(userID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Database error"})
		return
	}

	c.JSON(http.StatusOK, SuccessResponse{Data: map[string]string{"message": "User restored successfully"}})
}

// GetUserByIDHandler returns a specific user by ID (admin only)
func (uh *UserHandler) GetUserByIDHandler(c *gin.Context) {
	userIDStr := c.Param("id")
	userID, err := strconv.ParseInt(userIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid user ID"})
		return
	}

	userRow, err := uh.queries.GetUserByID(c.Request.Context(), int32(userID))
	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, ErrorResponse{Error: "User not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Database error"})
		return
	}

	roles, _ := uh.queries.GetUserRoles(c.Request.Context(), userRow.ID)
	apiUser := models.User{
		ID:            uint(userRow.ID),
		Email:         userRow.Email,
		Name:          userRow.Name,
		Tel:           userRow.Tel,
		Age:           int(userRow.Age),
		Gender:        userRow.Gender,
		Address:       userRow.Address,
		City:          userRow.City,
		Country:       userRow.Country,
		EmailVerified: userRow.EmailVerified,
		CreatedAt:     userRow.CreatedAt,
		UpdatedAt:     userRow.UpdatedAt,
	}
	for _, r := range roles {
		apiUser.Roles = append(apiUser.Roles, models.Role{
			ID:   uint(r.ID),
			Name: r.Name,
		})
	}

	c.JSON(http.StatusOK, SuccessResponse{Data: apiUser})
}

// UpdateUserRequest represents the JSON payload for user updates
type UpdateUserRequest struct {
	Name    string `json:"name" binding:"omitempty,min=2"`
	Tel     string `json:"tel"`
	Age     int    `json:"age"`
	Address string `json:"address"`
	City    string `json:"city"`
	Country string `json:"country"`
	Gender  string `json:"gender"`
}

// UpdateUserHandler updates a user (user can update self, admin can update anyone)
func (uh *UserHandler) UpdateUserHandler(c *gin.Context) {
	userIDStr := c.Param("id")
	userID, err := strconv.ParseInt(userIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid user ID"})
		return
	}

	var req UpdateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid input"})
		return
	}

	// Get current user from context
	currentUser, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, ErrorResponse{Error: "Unauthorized"})
		return
	}

	currentUserObj := currentUser.(*models.User)

	// Check if user is trying to update someone else (must be admin)
	if uint32(userID) != uint32(currentUserObj.ID) {
		if !currentUserObj.HasRole("admin") {
			c.JSON(http.StatusForbidden, ErrorResponse{Error: "Forbidden"})
			return
		}
	}

	// Fetch current user data to merge
	userRow, err := uh.queries.GetUserByID(c.Request.Context(), int32(userID))
	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, ErrorResponse{Error: "User not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Database error"})
		return
	}

	// Update fields
	updatedRow, err := uh.queries.UpdateUser(c.Request.Context(), db.UpdateUserParams{
		ID: int32(userID),
		Name: func() string {
			if req.Name != "" {
				return req.Name
			} else {
				return userRow.Name
			}
		}(),
		Tel: sql.NullString{String: func() string {
			if req.Tel != "" {
				return req.Tel
			} else {
				return userRow.Tel
			}
		}(), Valid: true},
		Age: sql.NullInt32{Int32: int32(func() int {
			if req.Age != 0 {
				return req.Age
			} else {
				return int(userRow.Age)
			}
		}()), Valid: true},
		Address: sql.NullString{String: func() string {
			if req.Address != "" {
				return req.Address
			} else {
				return userRow.Address
			}
		}(), Valid: true},
		City: sql.NullString{String: func() string {
			if req.City != "" {
				return req.City
			} else {
				return userRow.City
			}
		}(), Valid: true},
		Country: sql.NullString{String: func() string {
			if req.Country != "" {
				return req.Country
			} else {
				return userRow.Country
			}
		}(), Valid: true},
		Gender: sql.NullString{String: func() string {
			if req.Gender != "" {
				return req.Gender
			} else {
				return userRow.Gender
			}
		}(), Valid: true},
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to update user"})
		return
	}

	// Reload with roles
	roles, _ := uh.queries.GetUserRoles(c.Request.Context(), int32(userID))
	apiUser := models.User{
		ID:            uint(updatedRow.ID),
		Email:         updatedRow.Email,
		Name:          updatedRow.Name,
		Tel:           updatedRow.Tel,
		Age:           int(updatedRow.Age),
		Gender:        updatedRow.Gender,
		Address:       updatedRow.Address,
		City:          updatedRow.City,
		Country:       updatedRow.Country,
		EmailVerified: updatedRow.EmailVerified,
		CreatedAt:     updatedRow.CreatedAt,
		UpdatedAt:     updatedRow.UpdatedAt,
	}
	for _, r := range roles {
		apiUser.Roles = append(apiUser.Roles, models.Role{
			ID:   uint(r.ID),
			Name: r.Name,
		})
	}

	c.JSON(http.StatusOK, SuccessResponse{Data: apiUser})
}

// DeleteUserHandler deletes a user (admin only)
func (uh *UserHandler) DeleteUserHandler(c *gin.Context) {
	userIDStr := c.Param("id")
	userID, err := strconv.ParseInt(userIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid user ID"})
		return
	}

	err = uh.queries.SoftDeleteUser(c.Request.Context(), int32(userID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to delete user"})
		return
	}

	c.JSON(http.StatusOK, SuccessResponse{Data: map[string]string{"message": "User deleted successfully"}})
}

// AssignRoleRequest represents the JSON payload for assigning roles
type AssignRoleRequest struct {
	RoleName string `json:"role_name" binding:"required"`
}

// AssignRoleHandler assigns a role to a user (admin only)
func (uh *UserHandler) AssignRoleHandler(c *gin.Context) {
	userIDStr := c.Param("id")
	userID, err := strconv.ParseInt(userIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid user ID"})
		return
	}

	var req AssignRoleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid input"})
		return
	}

	// Normalize role name
	roleName := strings.ToLower(strings.TrimSpace(req.RoleName))

	// Find or create the role
	role, err := uh.queries.GetRoleByName(c.Request.Context(), roleName)
	if err != nil {
		if err == sql.ErrNoRows {
			role, err = uh.queries.CreateRole(c.Request.Context(), roleName)
			if err != nil {
				c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Database error creating role"})
				return
			}
		} else {
			c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Database error"})
			return
		}
	}

	// Assign the role
	err = uh.queries.AssignRole(c.Request.Context(), db.AssignRoleParams{
		UserID: int32(userID),
		RoleID: role.ID,
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to assign role"})
		return
	}

	// Return user with roles (reusing GetUserByID logic)
	uh.GetUserByIDHandler(c)
}

// RemoveRoleRequest represents the JSON payload for removing roles
type RemoveRoleRequest struct {
	RoleName string `json:"role_name" binding:"required"`
}

// RemoveRoleHandler removes a role from a user (admin only)
func (uh *UserHandler) RemoveRoleHandler(c *gin.Context) {
	userIDStr := c.Param("id")
	userID, err := strconv.ParseInt(userIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid user ID"})
		return
	}

	var req RemoveRoleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid input"})
		return
	}

	roleName := strings.ToLower(strings.TrimSpace(req.RoleName))

	role, err := uh.queries.GetRoleByName(c.Request.Context(), roleName)
	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Role does not exist"})
			return
		}
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Database error"})
		return
	}

	// Remove the role
	err = uh.queries.RemoveRole(c.Request.Context(), db.RemoveRoleParams{
		UserID: int32(userID),
		RoleID: role.ID,
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to remove role"})
		return
	}

	// Return user with roles
	uh.GetUserByIDHandler(c)
}

// ResetPasswordRequest represents the JSON payload for password reset
type ResetPasswordRequest struct {
	NewPassword string `json:"new_password" binding:"required,min=8"`
}

// ResetUserPasswordHandler resets a user's password (admin only)
func (uh *UserHandler) ResetUserPasswordHandler(c *gin.Context) {
	userIDStr := c.Param("id")
	userID, err := strconv.ParseInt(userIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid user ID"})
		return
	}

	var req ResetPasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid input"})
		return
	}

	// Hash the new password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to process password"})
		return
	}

	// In Pure SQL, we update the password directly
	// Note: We don't have a specific UpdatePassword query, we can use UpdateUser or add a new one.
	// For now, I'll just use a direct EXEC if I don't want to create a new sqlc query.
	// But wait, it's better to add one to users.sql.
	_, err = uh.conn.ExecContext(c.Request.Context(), "UPDATE users SET password = $2 WHERE id = $1", int32(userID), string(hashedPassword))

	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to reset password"})
		return
	}

	c.JSON(http.StatusOK, SuccessResponse{Data: map[string]string{"message": "Password reset successfully"}})
}
