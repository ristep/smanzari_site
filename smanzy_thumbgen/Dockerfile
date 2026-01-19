# Build Stage
FROM golang:1.23-alpine AS builder

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache git

# Copy module files first (caching)
COPY go.mod go.sum ./
RUN go mod download

# Copy source
COPY . .

# Build the binary (statically linked)
RUN CGO_ENABLED=0 GOOS=linux go build -o thumbgen .

# Final Stage
FROM alpine:latest

WORKDIR /app

# Install FFmpeg (Required for video processing)
RUN apk add --no-cache ffmpeg

# Copy binary from builder
COPY --from=builder /app/thumbgen .

# Create the uploads directory structure inside container
# (The volume mount will override this, but good practice for local testing)
RUN mkdir -p /app/uploads/320x200 /app/uploads/800x600

# Command to run
CMD ["./thumbgen"]