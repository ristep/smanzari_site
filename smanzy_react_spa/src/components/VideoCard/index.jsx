import React, { useState } from "react";
import styles from "./index.module.scss";

const formatDate = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-UK", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export default function VideoCard({ video }) {
  const [showDescription, setShowDescription] = useState(false);
  const videoUrl = `https://www.youtube.com/watch?v=${video.video_id}`;

  const handleView = () => {
    window.open(videoUrl, "_blank", "noopener,noreferrer");
  };

  const handleDescriptionClick = (e) => {
    e.stopPropagation();
    setShowDescription(true);
  };

  const handleCloseDescription = (e) => {
    e.stopPropagation();
    setShowDescription(false);
  };

  return (
    <>
      <div className={styles.card} onClick={handleView}>
        <div className={styles.thumbnailContainer}>
          <img
            src={video.thumbnail_url}
            alt={video.title}
            className={styles.thumbnail}
          />
        </div>
        <div className={styles.info}>
          <div className={styles.titleContainer}>
            <h3 className={styles.title} title={video.title}>
              {video.title}
            </h3>
            {video.description && (
              <button
                className={styles.descriptionBtn}
                onClick={handleDescriptionClick}
                title="View description"
              >
                i
              </button>
            )}
          </div>
          <div className={styles.meta}>
            <span className={styles.date}>
              {video.published_at ? formatDate(video.published_at) : ""}
            </span>
            <span className={styles.views}>{video.views}</span>
          </div>
        </div>
      </div>

      {showDescription && (
        <div className={styles.overlay} onClick={handleCloseDescription}>
          <div className={styles.popup} onClick={(e) => e.stopPropagation()}>
            <div className={styles.popupHeader}>
              <h2 className={styles.popupTitle}>{video.title}</h2>
              <button
                className={styles.closeBtn}
                onClick={handleCloseDescription}
              >
                ×
              </button>
            </div>
            <div className={styles.popupContent}>
              <p className={styles.description}>{video.description}</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
