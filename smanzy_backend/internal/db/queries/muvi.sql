
-- name: ListMuvi :many
SELECT * FROM muvi;

-- name: GetMuviByID :one
SELECT * FROM muvi WHERE id = $1;

-- name: UpdateMuvi :exec
UPDATE muvi SET name = $2, description = $3 WHERE id = $1;

-- name: DeleteMuvi :exec
DELETE FROM muvi WHERE id = $1;

-- name: CountMuvi :one
SELECT COUNT(*) FROM muvi;

