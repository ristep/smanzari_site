import styles from './index.module.scss';
import { Edit, Trash2 } from 'lucide-react';
import Button from '@/components/Button';

export default function AlbumCard({ album, onManage, onDelete, isDeleting }) {
    const coverImage = album.media_files?.[0];

    const getThumbnailUrl = (path) => {
        if (!path) return '';
        const baseUrl = import.meta.env.VITE_API_BASE_URL.replace('/api', '');
        return baseUrl + path;
    };

    return (
        <div className={styles.albumCard}>
            <div
                className={styles.albumCover}
                onClick={onManage}
            >
                {coverImage && coverImage.mime_type.startsWith('image/') ? (
                    <img
                        src={getThumbnailUrl(coverImage.url)}
                        alt={album.title}
                    />
                ) : (
                    <div className={styles.placeholderCover}>
                        <Edit size={48} />
                    </div>
                )}
                <div className={styles.mediaCountBadge}>
                    {album.media_files?.length || 0}
                </div>
                {album.user_name && (
                    <div className={styles.userNameOverlay}>
                        {album.user_name}
                    </div>
                )}
            </div>

            <div className={styles.albumInfo}>
                <h3
                    className={styles.albumTitle}
                    onClick={onManage}
                >
                    {album.title}
                </h3>
                {album.description && (
                    <p className={styles.albumDescription}>
                        {album.description}
                    </p>
                )}
            </div>

            <div className={styles.albumActions}>
                <Button
                    onClick={onManage}
                    variant="primary"
                    className={styles.manageBtn}
                >
                    <Edit size={16} />
                    Manage
                </Button>
                <Button
                    onClick={(e) => {
                        e.stopPropagation();
                        if (confirm('Are you sure you want to delete this album?')) {
                            onDelete(album.id);
                        }
                    }}
                    disabled={isDeleting}
                    variant="danger"
                >
                    <Trash2 size={16} />
                </Button>
            </div>
        </div>
    );
}
