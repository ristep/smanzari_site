import React, { useState } from 'react';
import { Edit, Download, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { IconButton, FileIcon, MediaPreviewOverlay } from '@/components';
import { formatFileSize, getThumbnailUrl, isImageFile, isVideoFile } from '@/utils/fileUtils';
import styles from './index.module.scss';
import clsx from 'clsx';

export default function MediaCard({
    media,
    canManage = false,
    canView = true,
}) {
    const [showPreview, setShowPreview] = useState(false);

    const isPreviewable = isImageFile(media.mime_type) || isVideoFile(media.mime_type);
    const thumbUrl = getThumbnailUrl(media);

    const navigate = useNavigate();
    const handleEdit = () => {
        navigate(`/media/edit/${media.id}`);
    };

    const handleDelete = (media) => {
        if (
            window.confirm(`Are you sure you want to delete "${media.filename}"?`)
        ) {
            deleteMutation.mutate(media.id);
        }
    };

    const handleDownload = (media) => {
        window.open(
            import.meta.env.VITE_API_BASE_URL.replace("/api", "") + media.url,
            "_blank",
        );
    };


    return (
        <>
            <div className={styles.card}>
                <div className={styles.cardThumbnail}>
                    <div
                        className={clsx(styles.largeThumbWrapper, isPreviewable && styles.clickable)}
                        onClick={() => isPreviewable && setShowPreview(true)}
                    >
                        {isPreviewable ? (
                            isImageFile(media.mime_type) ? (
                                <img
                                    src={thumbUrl}
                                    alt={media.filename}
                                    className={styles.largeThumb}
                                />
                            ) : (
                                <video
                                    src={thumbUrl}
                                    className={styles.largeThumb}
                                />
                            )
                        ) : (
                            <div className={styles.largeThumbPlaceholder}>
                                <FileIcon mimeType={media.mime_type} size={48} />
                            </div>
                        )}
                        {isPreviewable && (
                            <div className={styles.largeThumbOverlay}>
                                <FileIcon mimeType={media.mime_type} size={20} />
                            </div>
                        )}
                    </div>
                </div>

                <div className={styles.cardContent}>
                    <div className={styles.cardHeader}>
                        <h3 className={styles.cardTitle} title={media.filename}>
                            {media.filename}
                        </h3>
                        <span className={styles.cardBadge}>
                            <FileIcon mimeType={media.mime_type} size={16} />
                        </span>
                    </div>

                    <div className={styles.cardMeta}>
                        <div className={styles.metaItem}>
                            <div className={styles.userName}>{media.user_name}</div>
                            <div className={styles.metaValue}>{formatFileSize(media.size)}</div>
                        </div>
                    </div>

                    <div className={styles.cardActions}>
                        <IconButton
                            onClick={() => handleDownload(media)}
                            disabled={!canView}
                            title="Download"
                        >
                            <Download size={18} />
                        </IconButton>
                        <IconButton
                            onClick={() => handleEdit(media)}
                            disabled={!canManage}
                            title="Edit"
                        >
                            <Edit size={18} />
                        </IconButton>
                        <IconButton
                            onClick={() => handleDelete(media)}
                            disabled={!canManage}
                            title="Delete"
                        >
                            <Trash2 size={18} />
                        </IconButton>
                    </div>
                </div>
            </div>

            {showPreview && isPreviewable && (
                <MediaPreviewOverlay
                    media={media}
                    onClose={() => setShowPreview(false)}
                />
            )}
        </>
    );
}
