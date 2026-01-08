-- name: GetMediaByID :one
SELECT * FROM media
WHERE id = $1 AND deleted_at IS NULL
LIMIT 1;

-- name: ListPublicMedia :many
SELECT m.*, u.name as user_name
FROM media m
JOIN users u ON m.user_id = u.id
WHERE m.deleted_at IS NULL
ORDER BY m.created_at DESC;

-- name: ListUserMedia :many
SELECT * FROM media
WHERE user_id = $1 AND deleted_at IS NULL
ORDER BY created_at DESC;

-- name: CreateMedia :one
INSERT INTO media (
    filename, stored_name, url, type, mime_type, size, user_id
) VALUES (
    $1, $2, $3, $4, $5, $6, $7
)
RETURNING *;

-- name: UpdateMedia :one
UPDATE media
SET 
    filename = $2,
    type = $3,
    mime_type = $4,
    size = $5,
    updated_at = (EXTRACT(EPOCH FROM NOW()) * 1000)
WHERE id = $1
RETURNING *;

-- name: SoftDeleteMedia :exec
UPDATE media
SET deleted_at = NOW()
WHERE id = $1;
