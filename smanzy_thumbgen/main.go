package main

import (
	"bytes"
	"flag"
	"fmt"
	"image"
	"image/jpeg"
	"log"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"time"

	"github.com/disintegration/imaging"
	"github.com/fsnotify/fsnotify"
)

// Config
var targetSizes = []struct {
	dirName string
	width   int
	height  int
}{
	{"320x200", 320, 200},
	{"800x600", 800, 600},
}

const (
	uploadDir    = "./uploads"
	TriggerRegen = ".trigger_regenerate"
	TriggerGC    = ".trigger_gc"
)

var forceRegen bool

func main() {
	flag.BoolVar(&forceRegen, "regenerate", false, "Scans folder and regenerates all thumbnails, then exits.")
	flag.Parse()

	setupDirectories()

	// 1. Run Garbage Collector (Clean up orphans on restart)
	fmt.Println(">>> Running Garbage Collector...")
	runGarbageCollector()

	if forceRegen {
		fmt.Println(">>> Mode: REGENERATE (Processing all existing files)")
		performRegeneration()
		fmt.Println(">>> Regeneration complete.")
	}

	fmt.Println(">>> Mode: WATCHER (Waiting for changes in ./uploads)")
	startWatcher()
}

// -------------------------
// Core Logic
// -------------------------

func processFile(path string) {
	// Debounce: Wait for file write/lock to release
	time.Sleep(500 * time.Millisecond)

	fileName := filepath.Base(path)
	if strings.HasPrefix(fileName, ".") {
		return
	}

	if isImage(fileName) {
		fmt.Printf("[Create/Update] Image: %s\n", fileName)
		processImage(path, fileName)
	} else if isVideo(fileName) {
		fmt.Printf("[Create/Update] Video: %s\n", fileName)
		processVideo(path, fileName)
	} else if isHeic(fileName) {
		fmt.Printf("[Create/Update] HEIC: %s\n", fileName)
		processHEIC(path, fileName)
	}
}

func deleteThumbnailsFor(originalName string) {
	fmt.Printf("[Delete] Cleaning thumbs for: %s\n", originalName)

	baseName := strings.TrimSuffix(originalName, filepath.Ext(originalName))
	thumbName := baseName + ".jpg"

	for _, size := range targetSizes {
		thumbPath := filepath.Join(uploadDir, size.dirName, thumbName)

		if _, err := os.Stat(thumbPath); err == nil {
			if err := os.Remove(thumbPath); err != nil {
				log.Printf("   Error deleting thumb %s: %v", thumbPath, err)
			} else {
				fmt.Printf("   -> Deleted %s\n", thumbPath)
			}
		}
	}
}

// -------------------------
// Processing Functions
// -------------------------

func processImage(path, originalName string) {
	img, err := imaging.Open(path)
	if err != nil {
		log.Printf("   Error opening image: %v", err)
		return
	}
	saveThumbnails(img, originalName)
}

func processVideo(path, originalName string) {
	// Extract frame at 00:00:01
	cmd := exec.Command("ffmpeg", "-ss", "00:00:01", "-i", path, "-vframes", "1", "-f", "mjpeg", "pipe:1")
	runFFmpegPipe(cmd, path, originalName)
}

func processHEIC(path, originalName string) {
	// HEIC is processed exactly like video, but we don't seek (-ss).
	// We just take the first frame (which is the main image).
	cmd := exec.Command("ffmpeg", "-i", path, "-vframes", "1", "-f", "mjpeg", "pipe:1")
	runFFmpegPipe(cmd, path, originalName)
}

// Common helper to run FFmpeg and pipe output to image decoder
func runFFmpegPipe(cmd *exec.Cmd, path, originalName string) {
	var stdout bytes.Buffer
	var stderr bytes.Buffer
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr

	if err := cmd.Run(); err != nil {
		// If video failed at 1s, try fallback to 0s
		if isVideo(originalName) {
			fallbackCmd := exec.Command("ffmpeg", "-i", path, "-vframes", "1", "-f", "mjpeg", "pipe:1")
			fallbackCmd.Stdout = &stdout
			fallbackCmd.Stderr = &stderr
			if err := fallbackCmd.Run(); err != nil {
				log.Printf("   FFmpeg error processing %s: %v\n   Stderr: %s", path, err, stderr.String())
				return
			}
		} else {
			log.Printf("   FFmpeg error processing %s: %v\n   Stderr: %s", path, err, stderr.String())
			return
		}
	}

	img, _, err := image.Decode(&stdout)
	if err != nil {
		log.Printf("   Error decoding media buffer for %s: %v", path, err)
		return
	}
	saveThumbnails(img, originalName)
}

func saveThumbnails(img image.Image, originalName string) {
	baseName := strings.TrimSuffix(originalName, filepath.Ext(originalName))
	outputName := baseName + ".jpg"

	for _, size := range targetSizes {
		resizedImg := imaging.Fit(img, size.width, size.height, imaging.Lanczos)
		outputPath := filepath.Join(uploadDir, size.dirName, outputName)

		out, err := os.Create(outputPath)
		if err != nil {
			log.Printf("   Error creating output file: %v", err)
			continue
		}

		if err := jpeg.Encode(out, resizedImg, &jpeg.Options{Quality: 80}); err != nil {
			log.Printf("   Error encoding jpeg: %v", err)
		}
		out.Close()
	}
}

// -------------------------
// Watcher
// -------------------------

func startWatcher() {
	watcher, err := fsnotify.NewWatcher()
	if err != nil {
		log.Fatal(err)
	}
	defer watcher.Close()

	done := make(chan bool)

	go func() {
		for {
			select {
			case event, ok := <-watcher.Events:
				if !ok {
					return
				}

				baseName := filepath.Base(event.Name)
				// --- SPECIAL TRIGGERS ---
				if baseName == TriggerGC {
					if event.Op&fsnotify.Create == fsnotify.Create {
						fmt.Println("\n>>> TRIGGER RECEIVED: Garbage Collection")
						// Give the OS a moment to release the lock on the trigger file
						time.Sleep(100 * time.Millisecond)
						runGarbageCollector()
						os.Remove(event.Name) // Delete trigger file
					}
					continue
				}

				if baseName == TriggerRegen {
					if event.Op&fsnotify.Create == fsnotify.Create {
						fmt.Println("\n>>> TRIGGER RECEIVED: Regeneration")
						time.Sleep(100 * time.Millisecond)
						performRegeneration()
						os.Remove(event.Name) // Delete trigger file
					}
					continue
				}
				// ------------------------
				if strings.Contains(event.Name, "320x200") || strings.Contains(event.Name, "800x600") {
					continue
				}

				if event.Op&fsnotify.Create == fsnotify.Create || event.Op&fsnotify.Write == fsnotify.Write {
					processFile(event.Name)
				}

				if event.Op&fsnotify.Remove == fsnotify.Remove || event.Op&fsnotify.Rename == fsnotify.Rename {
					deleteThumbnailsFor(filepath.Base(event.Name))
				}

			case err, ok := <-watcher.Errors:
				if !ok {
					return
				}
				log.Println("Watcher error:", err)
			}
		}
	}()

	if err := watcher.Add(uploadDir); err != nil {
		log.Fatal(err)
	}
	<-done
}

// -------------------------
// Garbage Collector & Utils
// -------------------------

func runGarbageCollector() {
	validBasenames := make(map[string]bool)

	files, err := os.ReadDir(uploadDir)
	if err != nil {
		log.Printf("GC Error reading uploads: %v", err)
		return
	}

	for _, f := range files {
		if f.IsDir() || strings.HasPrefix(f.Name(), ".") {
			continue
		}
		if isImage(f.Name()) || isVideo(f.Name()) || isHeic(f.Name()) {
			base := strings.TrimSuffix(f.Name(), filepath.Ext(f.Name()))
			validBasenames[base] = true
		}
	}

	for _, size := range targetSizes {
		thumbDir := filepath.Join(uploadDir, size.dirName)
		thumbs, err := os.ReadDir(thumbDir)
		if err != nil {
			continue
		}

		for _, t := range thumbs {
			if t.IsDir() {
				continue
			}
			thumbBase := strings.TrimSuffix(t.Name(), filepath.Ext(t.Name()))
			if !validBasenames[thumbBase] {
				fullPath := filepath.Join(thumbDir, t.Name())
				fmt.Printf("[GC] Deleting orphan: %s\n", fullPath)
				os.Remove(fullPath)
			}
		}
	}
}

func performRegeneration() {
	entries, err := os.ReadDir(uploadDir)
	if err != nil {
		log.Fatalf("Failed to read dir: %v", err)
	}
	for _, entry := range entries {
		if !entry.IsDir() {
			processFile(filepath.Join(uploadDir, entry.Name()))
		}
	}
}

func setupDirectories() {
	for _, size := range targetSizes {
		_ = os.MkdirAll(filepath.Join(uploadDir, size.dirName), 0755)
	}
}

func isImage(filename string) bool {
	ext := strings.ToLower(filepath.Ext(filename))
	return ext == ".jpg" || ext == ".jpeg" || ext == ".png" || ext == ".gif" || ext == ".bmp"
}

func isVideo(filename string) bool {
	ext := strings.ToLower(filepath.Ext(filename))
	return ext == ".mp4" || ext == ".mov" || ext == ".avi" || ext == ".mkv" || ext == ".webm"
}

func isHeic(filename string) bool {
	ext := strings.ToLower(filepath.Ext(filename))
	return ext == ".heic" || ext == ".heif"
}
