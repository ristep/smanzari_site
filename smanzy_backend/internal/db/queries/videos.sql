-- name: CreateVideo :one
INSERT INTO videos (
    video_id, title, description, published_at, views, likes, thumbnail_url,
    created_at, updated_at
) VALUES (
    $1, $2, $3, $4, $5, $6, $7,
    (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,
    (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT
)
ON CONFLICT (video_id) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    views = EXCLUDED.views,
    likes = EXCLUDED.likes,
    thumbnail_url = EXCLUDED.thumbnail_url,
    updated_at = (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT
RETURNING id, video_id, title, description, published_at, views, likes, thumbnail_url, created_at, updated_at, deleted_at;

-- name: GetVideoByID :one
SELECT * FROM videos
WHERE id = $1 AND deleted_at IS NULL
LIMIT 1;

-- name: ListVideos :many
SELECT * FROM videos
WHERE deleted_at IS NULL
ORDER BY published_at DESC
LIMIT $1 OFFSET $2;

-- name: SoftDeleteVideo :exec
UPDATE videos
SET deleted_at = NOW()
WHERE id = $1;
