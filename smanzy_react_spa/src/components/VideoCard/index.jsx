import React from 'react';
import styles from './index.module.scss';

export default function VideoCard({ video }) {
    const videoUrl = `https://www.youtube.com/watch?v=${video.id}`;
    const thumbUrl = `https://i.ytimg.com/vi/${video.id}/maxresdefault.jpg`;

    const handleView = () => {
        window.open(videoUrl, '_blank', 'noopener,noreferrer');
    };

    return (
        <div className={styles.card} onClick={handleView}>
            <div className={styles.thumbnailContainer}>
                <img
                    src={thumbUrl}
                    alt={video.title}
                    className={styles.thumbnail}
                    onError={(e) => {
                        // Fallback to hqdefault if maxresdefault is not available
                        if (e.target.src !== `https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`) {
                            e.target.src = `https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`;
                        }
                    }}
                />
            </div>
            <div className={styles.info}>
                <h3 className={styles.title} title={video.title}>
                    {video.title}
                </h3>
                <div className={styles.meta}>
                    <span className={styles.views}>{video.views}</span>
                </div>
            </div>
        </div>
    );
}
