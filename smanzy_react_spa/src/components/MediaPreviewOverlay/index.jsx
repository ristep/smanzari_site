import React from 'react';
import { X } from 'lucide-react';
import { isImageFile, getThumbnailUrl } from '@/utils/fileUtils';
import styles from './index.module.scss';
import IconButton from '@/components/IconButton';

const MediaPreviewOverlay = ({ media, onClose }) => {
    if (!media) return null;

    const thumbUrl = getThumbnailUrl(media);
    const isImage = isImageFile(media.mime_type);

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.overlayContent} onClick={(e) => e.stopPropagation()}>
                <button
                    className={styles.closeButton}
                    onClick={onClose}
                    title="Close"
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
};

export default MediaPreviewOverlay;
