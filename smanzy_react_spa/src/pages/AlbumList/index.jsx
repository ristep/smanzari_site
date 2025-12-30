import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Edit } from 'lucide-react';
import api from '@/services/api';
import Button from '@/components/Button';
import Panel from '@/components/Panel';
import styles from './index.module.scss';

export default function AlbumList() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [formData, setFormData] = useState({ title: '', description: '' });

    // Fetch user albums
    const { isPending: albumsPending, error: albumsError, data: albumsData } = useQuery({
        queryKey: ['albums'],
        queryFn: () => api.get('/albums').then((res) => res.data),
        retry: false,
    });

    const albums = albumsData || [];

    // Create album mutation
    const createAlbumMutation = useMutation({
        mutationFn: (newAlbum) => api.post('/albums', newAlbum),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['albums'] });
            setFormData({ title: '', description: '' });
            setShowCreateForm(false);
        },
        onError: (err) => {
            alert('Failed to create album: ' + (err.response?.data?.error || err.message));
        },
    });

    // Delete album mutation
    const deleteAlbumMutation = useMutation({
        mutationFn: (albumId) => api.delete(`/albums/${albumId}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['albums'] });
        },
        onError: (err) => {
            alert('Failed to delete album: ' + (err.response?.data?.error || err.message));
        },
    });

    const handleCreateAlbum = (e) => {
        e.preventDefault();
        if (!formData.title.trim()) {
            alert('Album title is required');
            return;
        }
        createAlbumMutation.mutate(formData);
    };

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    if (albumsPending) return <div className={styles.container}><p>Loading albums...</p></div>;
    if (albumsError) return <div className={styles.container}><p>Error loading albums</p></div>;

    return (
        <div className={styles.container}>
            <Panel title="Album List">
                <div className={styles.header}>
                    <h1>My Albums</h1>
                    <Button
                        onClick={() => setShowCreateForm(!showCreateForm)}
                        className={styles.createBtn}
                    >
                        <Plus size={20} />
                        {showCreateForm ? 'Cancel' : 'New Album'}
                    </Button>
                </div>

                {showCreateForm && (
                    <form onSubmit={handleCreateAlbum} className={styles.createForm}>
                        <div className={styles.formGroup}>
                            <label>Album Title</label>
                            <input
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleFormChange}
                                placeholder="Enter album title"
                                required
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Description</label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleFormChange}
                                placeholder="Enter album description (optional)"
                                rows="3"
                            />
                        </div>
                        <div className={styles.formActions}>
                            <Button type="submit" disabled={createAlbumMutation.isPending}>
                                {createAlbumMutation.isPending ? 'Creating...' : 'Create Album'}
                            </Button>
                        </div>
                    </form>
                )}


                {albums.length === 0 ? (
                    <p className={styles.emptyMessage}>No albums yet. Create one to get started!</p>
                ) : (
                    <div className={styles.albumsGrid}>
                        {albums.map(album => {
                            const coverImage = album.media_files?.[0];
                            const getThumbnailUrl = (path) => {
                                if (!path) return '';
                                const baseUrl = import.meta.env.VITE_API_BASE_URL.replace('/api', '');
                                return baseUrl + path;
                            };

                            return (
                                <div key={album.id} className={styles.albumCard}>
                                    <div
                                        className={styles.albumCover}
                                        onClick={() => navigate(`/albums/${album.id}`)}
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
                                    </div>

                                    <div className={styles.albumInfo}>
                                        <h3
                                            className={styles.albumTitle}
                                            onClick={() => navigate(`/albums/${album.id}`)}
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
                                            onClick={() => navigate(`/albums/${album.id}`)}
                                            variant="primary"
                                            className={styles.manageBtn}
                                        >
                                            <Edit size={16} />
                                            Manage
                                        </Button>
                                        <Button
                                            onClick={() => {
                                                if (confirm('Are you sure you want to delete this album?')) {
                                                    deleteAlbumMutation.mutate(album.id);
                                                }
                                            }}
                                            disabled={deleteAlbumMutation.isPending}
                                            variant="danger"
                                        >
                                            <Trash2 size={16} />
                                        </Button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </Panel>
        </div>
    );
}
