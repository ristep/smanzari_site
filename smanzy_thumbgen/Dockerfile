# ... (Build stage remains the same) ...
FROM golang:1.23-alpine AS builder
WORKDIR /app
RUN apk add --no-cache git
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o thumbgen .

# Final Stage
FROM alpine:latest
WORKDIR /app

# CHANGED: Ensure ffmpeg has libs needed for complex formats
RUN apk add --no-cache ffmpeg

COPY --from=builder /app/thumbgen .
RUN mkdir -p /app/uploads/320x200 /app/uploads/800x600

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD sh -c 'test -d /app/uploads && touch /app/uploads/.healthcheck && rm /app/uploads/.healthcheck || exit 1'

CMD ["./thumbgen"]
