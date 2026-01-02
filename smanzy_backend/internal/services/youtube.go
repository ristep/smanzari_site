package services

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"

	"github.com/ristep/smanzy_backend/internal/models"
)

// YouTubeService handles YouTube API interactions
type YouTubeService struct {
	APIKey    string
	ChannelID string
}

// NewYouTubeService creates a new YouTube service
func NewYouTubeService(apiKey, channelID string) *YouTubeService {
	return &YouTubeService{
		APIKey:    apiKey,
		ChannelID: channelID,
	}
}

// YouTubeSearchResponse represents the response from YouTube search API
type YouTubeSearchResponse struct {
	Items []struct {
		ID struct {
			VideoID string `json:"videoId"`
		} `json:"id"`
		Snippet struct {
			PublishedAt string `json:"publishedAt"`
			Title       string `json:"title"`
			Description string `json:"description"`
			Thumbnails  struct {
				High struct {
					URL string `json:"url"`
				} `json:"high"`
			} `json:"thumbnails"`
		} `json:"snippet"`
	} `json:"items"`
	NextPageToken string `json:"nextPageToken"`
}

// YouTubeVideosResponse represents the response from YouTube videos API
type YouTubeVideosResponse struct {
	Items []struct {
		ID      string `json:"id"`
		Snippet struct {
			PublishedAt string `json:"publishedAt"`
			Title       string `json:"title"`
			Description string `json:"description"`
			Thumbnails  struct {
				High struct {
					URL string `json:"url"`
				} `json:"high"`
			} `json:"thumbnails"`
		} `json:"snippet"`
		Statistics struct {
			ViewCount string `json:"viewCount"`
			LikeCount string `json:"likeCount"`
		} `json:"statistics"`
	} `json:"items"`
}

// makeRequest performs an HTTP GET request with necessary headers
func (s *YouTubeService) makeRequest(url string) (*http.Response, error) {
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, err
	}

	// Set Referer to satisfy API key restrictions
	// Assuming the API key expects the frontend origin
	req.Header.Set("Referer", "http://localhost:5173")
	req.Header.Set("Accept", "application/json")

	client := &http.Client{Timeout: 10 * time.Second}
	return client.Do(req)
}

// FetchChannelVideos fetches all videos from a YouTube channel
func (s *YouTubeService) FetchChannelVideos(maxResults int) ([]models.Video, error) {
	// First, get video IDs from channel
	searchURL := fmt.Sprintf(
		"https://www.googleapis.com/youtube/v3/search?key=%s&channelId=%s&part=snippet&order=date&maxResults=%d&type=video",
		s.APIKey, s.ChannelID, maxResults,
	)

	resp, err := s.makeRequest(searchURL)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch channel videos: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("YouTube API error (status %d): %s", resp.StatusCode, string(body))
	}

	var searchResp YouTubeSearchResponse
	if err := json.NewDecoder(resp.Body).Decode(&searchResp); err != nil {
		return nil, fmt.Errorf("failed to decode search response: %w", err)
	}

	// Extract video IDs
	videoIDs := make([]string, 0, len(searchResp.Items))
	for _, item := range searchResp.Items {
		if item.ID.VideoID != "" {
			videoIDs = append(videoIDs, item.ID.VideoID)
		}
	}

	if len(videoIDs) == 0 {
		return []models.Video{}, nil
	}

	// Fetch detailed statistics for these videos
	return s.FetchVideoDetails(videoIDs)
}

// FetchVideoDetails fetches detailed information for specific video IDs
func (s *YouTubeService) FetchVideoDetails(videoIDs []string) ([]models.Video, error) {
	if len(videoIDs) == 0 {
		return []models.Video{}, nil
	}

	// Join video IDs with commas
	ids := ""
	for i, id := range videoIDs {
		if i > 0 {
			ids += ","
		}
		ids += id
	}

	videosURL := fmt.Sprintf(
		"https://www.googleapis.com/youtube/v3/videos?key=%s&id=%s&part=snippet,statistics",
		s.APIKey, ids,
	)

	resp, err := s.makeRequest(videosURL)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch video details: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("YouTube API error (status %d): %s", resp.StatusCode, string(body))
	}

	var videosResp YouTubeVideosResponse
	if err := json.NewDecoder(resp.Body).Decode(&videosResp); err != nil {
		return nil, fmt.Errorf("failed to decode videos response: %w", err)
	}

	// Convert to our Video model
	videos := make([]models.Video, 0, len(videosResp.Items))
	for _, item := range videosResp.Items {
		publishedAt, _ := time.Parse(time.RFC3339, item.Snippet.PublishedAt)

		// Parse view and like counts
		var views, likes int64
		fmt.Sscanf(item.Statistics.ViewCount, "%d", &views)
		fmt.Sscanf(item.Statistics.LikeCount, "%d", &likes)

		video := models.Video{
			VideoID:      item.ID,
			Title:        item.Snippet.Title,
			Description:  item.Snippet.Description,
			PublishedAt:  publishedAt,
			Views:        views,
			Likes:        likes,
			ThumbnailURL: item.Snippet.Thumbnails.High.URL,
		}
		videos = append(videos, video)
	}

	return videos, nil
}
