package handlers

import (
	"fmt"
	"time"

	"github.com/gin-gonic/gin"
)

// Version constants
const (
	VersionMajor = 1
	VersionMinor = 0
	VersionPatch = 0
)

// Build information (can be set via ldflags during build)
var (
	BuildTime = time.Now().Format(time.RFC3339)
	GitCommit = ""
)

// VersionInfo represents the API version information
type VersionInfo struct {
	Version   string `json:"version"`
	BuildTime string `json:"build_time"`
	GitCommit string `json:"git_commit,omitempty"`
}

// VersionHandler handles version-related requests
type VersionHandler struct{}

// NewVersionHandler creates a new version handler
func NewVersionHandler() *VersionHandler {
	return &VersionHandler{}
}

// GetVersionHandler returns the current API version information
// @Summary Get API version
// @Description Returns the current version, build time, and git commit of the API
// @Tags system
// @Produce json
// @Success 200 {object} VersionInfo
// @Router /api/version [get]
func (h *VersionHandler) GetVersionHandler(c *gin.Context) {
	version := VersionInfo{
		Version:   formatVersion(VersionMajor, VersionMinor, VersionPatch),
		BuildTime: BuildTime,
		GitCommit: GitCommit,
	}

	c.JSON(200, version)
}

// formatVersion formats the version number as a string
func formatVersion(major, minor, patch int) string {
	return fmt.Sprintf("%d.%d.%d", major, minor, patch)
}
