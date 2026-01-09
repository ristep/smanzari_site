-- name: GetMediaByID :one
SELECT
    id, filename, stored_name, url,
    COALESCE(type, '') as type,
    COALESCE(mime_type, '') as mime_type,
    size, user_id,
    COALESCE(created_at, 0)::BIGINT as created_at,
    COALESCE(updated_at, 0)::BIGINT as updated_at,
    deleted_at
FROM media
WHERE id = $1 AND deleted_at IS NULL
LIMIT 1;

-- name: ListPublicMedia :many
SELECT
    m.id, m.filename, m.stored_name, m.url,
    COALESCE(m.type, '') as type,
    COALESCE(m.mime_type, '') as mime_type,
    m.size, m.user_id,
    COALESCE(m.created_at, 0)::BIGINT as created_at,
    COALESCE(m.updated_at, 0)::BIGINT as updated_at,
    m.deleted_at,
    u.name as user_name,
    u.tel as user_tel,
    u.email as user_email
FROM media m
JOIN users u ON m.user_id = u.id
WHERE m.deleted_at IS NULL
ORDER BY m.created_at DESC
LIMIT $1 OFFSET $2;

-- name: CountPublicMedia :one
SELECT COUNT(*) FROM media
WHERE deleted_at IS NULL;

-- name: ListUserMedia :many
SELECT
    id, filename, stored_name, url,
    COALESCE(type, '') as type,
    COALESCE(mime_type, '') as mime_type,
    size, user_id,
    COALESCE(created_at, 0)::BIGINT as created_at,
    COALESCE(updated_at, 0)::BIGINT as updated_at,
    deleted_at
FROM media
WHERE user_id = $1 AND deleted_at IS NULL
ORDER BY created_at DESC;

-- name: CreateMedia :one
INSERT INTO media (
    filename, stored_name, url, type, mime_type, size, user_id,
    created_at, updated_at
) VALUES (
    $1, $2, $3, $4, $5, $6, $7,
    (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,
    (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT
)
RETURNING
    id, filename, stored_name, url,
    COALESCE(type, '') as type,
    COALESCE(mime_type, '') as mime_type,
    size, user_id,
    COALESCE(created_at, 0)::BIGINT as created_at,
    COALESCE(updated_at, 0)::BIGINT as updated_at,
    deleted_at;

-- name: UpdateMedia :one
UPDATE media
SET
    filename = $2,
    type = $3,
    mime_type = $4,
    size = $5,
    updated_at = (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT
WHERE id = $1
RETURNING
    id, filename, stored_name, url,
    COALESCE(type, '') as type,
    COALESCE(mime_type, '') as mime_type,
    size, user_id,
    COALESCE(created_at, 0)::BIGINT as created_at,
    COALESCE(updated_at, 0)::BIGINT as updated_at,
    deleted_at;

-- name: SoftDeleteMedia :exec
UPDATE media
SET deleted_at = NOW()
WHERE id = $1;

-- name: PermanentlyDeleteMedia :exec
DELETE FROM media
WHERE id = $1;
