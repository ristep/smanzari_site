import React, { useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { isImageFile, getThumbnailUrl } from "@/utils/fileUtils";
import styles from "./index.module.scss";

const MediaPreviewOverlay = ({ media, onClose }) => {
  // Handle keyboard events (Escape to close)
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    },
    [onClose],
  );

  // Add keyboard event listener on mount
  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    // Prevent body scroll when overlay is open
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [handleKeyDown]);

  if (!media) return null;

  const thumbUrl = getThumbnailUrl(media);
  const isImage = isImageFile(media.mime_type);

  const overlayContent = (
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={styles.overlayContent}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className={styles.closeButton}
          onClick={onClose}
          title="Close (Esc)"
          aria-label="Close preview"
        >
          <X size={24} />
        </button>
        {isImage ? (
          <img
            src={thumbUrl}
            alt={media.filename}
            className={styles.largeImage}
          />
        ) : (
          <video
            src={thumbUrl}
            className={styles.largeVideo}
            controls
            autoPlay
          />
        )}

        <div className={styles.imageInfo}>
          <p className={styles.imageName}>{media.filename}</p>
        </div>
      </div>
    </div>
  );

  // Use portal to render overlay at document body level
  return createPortal(overlayContent, document.body);
};

export default MediaPreviewOverlay;
