-- name: CreateAlbum :one
INSERT INTO album (
    title, description, user_id, is_public, is_shared
) VALUES (
    $1, $2, $3, $4, $5
)
RETURNING *;

-- name: GetAlbumByID :one
SELECT * FROM album
WHERE id = $1 AND deleted_at IS NULL
LIMIT 1;

-- name: ListUserAlbums :many
SELECT a.*, u.name as user_name
FROM album a
JOIN users u ON a.user_id = u.id
WHERE a.user_id = $1 AND a.deleted_at IS NULL
ORDER BY a.created_at DESC;

-- name: ListAllAlbums :many
SELECT a.*, u.name as user_name
FROM album a
JOIN users u ON a.user_id = u.id
WHERE a.deleted_at IS NULL
ORDER BY a.created_at DESC;

-- name: UpdateAlbum :one
UPDATE album
SET 
    title = $2,
    description = $3,
    is_public = $4,
    is_shared = $5,
    updated_at = (EXTRACT(EPOCH FROM NOW()) * 1000)
WHERE id = $1
RETURNING *;

-- name: SoftDeleteAlbum :exec
UPDATE album
SET deleted_at = NOW()
WHERE id = $1;

-- name: GetAlbumMedia :many
SELECT m.* FROM media m
JOIN album_media am ON am.media_id = m.id
WHERE am.album_id = $1 AND m.deleted_at IS NULL;

-- name: AddMediaToAlbum :exec
INSERT INTO album_media (album_id, media_id)
VALUES ($1, $2)
ON CONFLICT DO NOTHING;

-- name: RemoveMediaFromAlbum :exec
DELETE FROM album_media
WHERE album_id = $1 AND media_id = $2;
