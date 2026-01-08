-- name: GetUserByEmail :one
SELECT 
    id, email, password, name, 
    COALESCE(tel, '') as tel, 
    COALESCE(age, 0) as age, 
    COALESCE(address, '') as address, 
    COALESCE(city, '') as city, 
    COALESCE(country, '') as country, 
    COALESCE(gender, '') as gender, 
    COALESCE(email_verified, false) as email_verified,
    created_at, updated_at, deleted_at
FROM users
WHERE email = $1 AND deleted_at IS NULL
LIMIT 1;

-- name: GetUserByEmailWithDeleted :one
SELECT 
    id, email, password, name, 
    COALESCE(tel, '') as tel, 
    COALESCE(age, 0) as age, 
    COALESCE(address, '') as address, 
    COALESCE(city, '') as city, 
    COALESCE(country, '') as country, 
    COALESCE(gender, '') as gender, 
    COALESCE(email_verified, false) as email_verified,
    created_at, updated_at, deleted_at
FROM users
WHERE email = $1
LIMIT 1;

-- name: GetUserByID :one
SELECT 
    id, email, password, name, 
    COALESCE(tel, '') as tel, 
    COALESCE(age, 0) as age, 
    COALESCE(address, '') as address, 
    COALESCE(city, '') as city, 
    COALESCE(country, '') as country, 
    COALESCE(gender, '') as gender, 
    COALESCE(email_verified, false) as email_verified,
    created_at, updated_at, deleted_at
FROM users
WHERE id = $1 AND deleted_at IS NULL
LIMIT 1;

-- name: ListUsers :many
SELECT 
    id, email, password, name, 
    COALESCE(tel, '') as tel, 
    COALESCE(age, 0) as age, 
    COALESCE(address, '') as address, 
    COALESCE(city, '') as city, 
    COALESCE(country, '') as country, 
    COALESCE(gender, '') as gender, 
    COALESCE(email_verified, false) as email_verified,
    created_at, updated_at, deleted_at
FROM users
WHERE deleted_at IS NULL
ORDER BY id;

-- name: CreateUser :one
INSERT INTO users (
    email, password, name, tel, age, address, city, country, gender
) VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8, $9
)
RETURNING 
    id, email, password, name, 
    COALESCE(tel, '') as tel, 
    COALESCE(age, 0) as age, 
    COALESCE(address, '') as address, 
    COALESCE(city, '') as city, 
    COALESCE(country, '') as country, 
    COALESCE(gender, '') as gender, 
    COALESCE(email_verified, false) as email_verified,
    created_at, updated_at, deleted_at;

-- name: UpdateUser :one
UPDATE users
SET 
    name = $2,
    tel = $3,
    age = $4,
    address = $5,
    city = $6,
    country = $7,
    gender = $8,
    updated_at = (EXTRACT(EPOCH FROM NOW()) * 1000)
WHERE id = $1
RETURNING 
    id, email, password, name, 
    COALESCE(tel, '') as tel, 
    COALESCE(age, 0) as age, 
    COALESCE(address, '') as address, 
    COALESCE(city, '') as city, 
    COALESCE(country, '') as country, 
    COALESCE(gender, '') as gender, 
    COALESCE(email_verified, false) as email_verified,
    created_at, updated_at, deleted_at;

-- name: SoftDeleteUser :exec
UPDATE users
SET deleted_at = NOW()
WHERE id = $1;

-- name: RestoreUser :exec
UPDATE users
SET deleted_at = NULL
WHERE id = $1;

-- name: GetUserRoles :many
SELECT r.* FROM roles r
JOIN user_roles ur ON ur.role_id = r.id
WHERE ur.user_id = $1;

-- name: AssignRole :exec
INSERT INTO user_roles (user_id, role_id)
VALUES ($1, $2)
ON CONFLICT DO NOTHING;

-- name: RemoveRole :exec
DELETE FROM user_roles
WHERE user_id = $1 AND role_id = $2;

-- name: GetRoleByName :one
SELECT * FROM roles
WHERE name = $1
LIMIT 1;

-- name: CreateRole :one
INSERT INTO roles (name)
VALUES ($1)
ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
RETURNING *;
