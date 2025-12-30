import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Edit, X, Save, File, ArrowLeft } from 'lucide-react';
import api from '@/services/api';
import Button from '@/components/Button';
import Panel from '@/components/Panel';
import { formatDate } from '@/utils/dateFormat';
import styles from './index.module.scss';
import clsx from 'clsx';

export default function AlbumDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const [activeTab, setActiveTab] = useState('media'); // 'details' or 'media'
    const [isEditing, setIsEditing] = useState(false);
    const [editFormData, setEditFormData] = useState({ title: '', description: '' });
    const [showAddMediaForm, setShowAddMediaForm] = useState(false);
    const [mediaSearch, setMediaSearch] = useState('');

    // Fetch album details
    const { isPending: albumPending, error: albumError, data: album } = useQuery({
        queryKey: ['albums', id],
        queryFn: () => api.get(`/albums/${id}`).then((res) => res.data),
        retry: false,
    });

    // Fetch all media for adding to album
    const { data: mediaData } = useQuery({
        queryKey: ['media', 'all'],
        queryFn: () => api.get('/media?limit=1000').then((res) => res.data),
        retry: false,
    });

    const allMedia = mediaData?.data?.files || [];
    const filteredMedia = allMedia.filter(m =>
        m.filename.toLowerCase().includes(mediaSearch.toLowerCase())
    );

    useEffect(() => {
        if (album) {
            setEditFormData({
                title: album.title,
                description: album.description || ''
            });
        }
    }, [album]);

    // Update album mutation
    const updateAlbumMutation = useMutation({
        mutationFn: (data) => api.put(`/albums/${id}`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['albums', id] });
            queryClient.invalidateQueries({ queryKey: ['albums'] });
            setIsEditing(false);
        },
        onError: (err) => {
            alert('Failed to update album: ' + (err.response?.data?.error || err.message));
        },
    });

    // Add media to album mutation
    const addMediaMutation = useMutation({
        mutationFn: (mediaId) => api.post(`/albums/${id}/media`, { media_id: mediaId }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['albums', id] });
            queryClient.invalidateQueries({ queryKey: ['albums'] });
            setShowAddMediaForm(false);
            setMediaSearch('');
        },
        onError: (err) => {
            alert('Failed to add media: ' + (err.response?.data?.error || err.message));
        },
    });

    // Remove media from album mutation
    const removeMediaMutation = useMutation({
        mutationFn: (mediaId) => api.delete(`/albums/${id}/media`, {
            data: { media_id: mediaId }
        }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['albums', id] });
            queryClient.invalidateQueries({ queryKey: ['albums'] });
        },
        onError: (err) => {
            alert('Failed to remove media: ' + (err.response?.data?.error || err.message));
        },
    });

    const getThumbnailUrl = (path) => {
        if (!path) return '';
        const baseUrl = import.meta.env.VITE_API_BASE_URL.replace('/api', '');
        return baseUrl + path;
    };

    const isMediaInAlbum = (mediaId) => {
        return album?.media_files?.some(m => m.id === mediaId);
    };

    const handleEditFormChange = (e) => {
        const { name, value } = e.target;
        setEditFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSaveAlbum = (e) => {
        e.preventDefault();
        if (!editFormData.title.trim()) {
            alert('Album title is required');
            return;
        }
        updateAlbumMutation.mutate(editFormData);
    };

    const handleCancelEdit = () => {
        setEditFormData({ title: album.title, description: album.description || '' });
        setIsEditing(false);
    };

    if (albumPending) return <div className={styles.container}><p>Loading album...</p></div>;
    if (albumError) return (
        <div className={styles.container}>
            <p>Error loading album</p>
            <Button onClick={() => navigate('/albums')}>Back to Albums</Button>
        </div>
    );

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Button variant="secondary" onClick={() => navigate('/albums')} style={{ padding: '0.5rem' }}>
                        <ArrowLeft size={20} />
                    </Button>
                    <h1>{album.title}</h1>
                </div>
            </div>

            <Panel>
                <div className={styles.pageContent}>
                    <div className={styles.tabHeader}>
                        <Button
                            variant={activeTab === 'media' ? 'primary' : 'secondary'}
                            onClick={() => setActiveTab('media')}
                        >
                            Media Content
                        </Button>
                        <Button
                            variant={activeTab === 'details' ? 'primary' : 'secondary'}
                            onClick={() => setActiveTab('details')}
                        >
                            Album Settings
                        </Button>
                    </div>

                    {activeTab === 'details' ? (
                        <div className={styles.section}>
                            <div className={styles.sectionHeader}>
                                <h3>Settings</h3>
                                {!isEditing && (
                                    <Button onClick={() => setIsEditing(true)} variant="primary">
                                        <Edit size={16} />
                                        Edit Details
                                    </Button>
                                )}
                            </div>

                            {isEditing ? (
                                <form onSubmit={handleSaveAlbum} className={styles.editForm}>
                                    <div className={styles.formGroup}>
                                        <label>Album Title</label>
                                        <input
                                            type="text"
                                            name="title"
                                            value={editFormData.title}
                                            onChange={handleEditFormChange}
                                            required
                                        />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label>Description</label>
                                        <textarea
                                            name="description"
                                            value={editFormData.description}
                                            onChange={handleEditFormChange}
                                            rows="4"
                                        />
                                    </div>
                                    <div className={styles.formActions}>
                                        <Button type="submit" disabled={updateAlbumMutation.isPending}>
                                            <Save size={18} />
                                            {updateAlbumMutation.isPending ? 'Saving...' : 'Save Changes'}
                                        </Button>
                                        <Button type="button" onClick={handleCancelEdit} variant="secondary">
                                            Cancel
                                        </Button>
                                    </div>
                                </form>
                            ) : (
                                <div className={styles.albumDetailsView}>
                                    <p><strong>Title:</strong> {album.title}</p>
                                    <p><strong>Description:</strong> {album.description || <span style={{ fontStyle: 'italic', opacity: 0.6 }}>No description</span>}</p>
                                    <p><strong>Media Count:</strong> {album.media_files?.length || 0} items</p>
                                    <p><strong>Created:</strong> {formatDate(album.created_at)}</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className={styles.section}>
                            <div className={styles.sectionHeader}>
                                <h3>Media in Album</h3>
                                <Button
                                    onClick={() => setShowAddMediaForm(!showAddMediaForm)}
                                    variant={showAddMediaForm ? 'secondary' : 'primary'}
                                >
                                    {showAddMediaForm ? 'Close Library' : <><Plus size={16} /> Add Media</>}
                                </Button>
                            </div>

                            {showAddMediaForm && (
                                <div className={styles.addMediaForm}>
                                    <input
                                        type="text"
                                        placeholder="Search your library..."
                                        value={mediaSearch}
                                        onChange={(e) => setMediaSearch(e.target.value)}
                                        className={styles.searchInput}
                                        autoFocus
                                    />
                                    <div className={styles.mediaLibraryList}>
                                        {filteredMedia.length === 0 ? (
                                            <p className={styles.emptyMessage}>No media found</p>
                                        ) : (
                                            filteredMedia.map(media => {
                                                const alreadyIn = isMediaInAlbum(media.id);
                                                return (
                                                    <div key={media.id} className={clsx(styles.libraryItem, alreadyIn && styles.disabled)}>
                                                        <div className={styles.itemThumb}>
                                                            {media.mime_type.startsWith('image/') ? (
                                                                <img src={getThumbnailUrl(media.url)} alt="" />
                                                            ) : (
                                                                <div className={styles.fileIcon}><File size={20} /></div>
                                                            )}
                                                        </div>
                                                        <div className={styles.itemInfo}>
                                                            <span className={styles.itemName}>{media.filename}</span>
                                                            <span className={styles.itemMeta}>{media.mime_type}</span>
                                                        </div>
                                                        <Button
                                                            onClick={() => addMediaMutation.mutate(media.id)}
                                                            disabled={addMediaMutation.isPending || alreadyIn}
                                                            variant={alreadyIn ? 'secondary' : 'primary'}
                                                            size="sm"
                                                        >
                                                            {alreadyIn ? 'Added' : 'Add'}
                                                        </Button>
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                </div>
                            )}

                            {album.media_files && album.media_files.length > 0 ? (
                                <div className={styles.enhancedMediaGrid}>
                                    {album.media_files.map(media => (
                                        <div key={media.id} className={styles.mediaThumbnailCard}>
                                            <div className={styles.cardPreview}>
                                                {media.mime_type.startsWith('image/') ? (
                                                    <img src={getThumbnailUrl(media.url)} alt={media.filename} />
                                                ) : (
                                                    <div className={styles.fileIcon}><File size={32} /></div>
                                                )}
                                                <button
                                                    className={styles.removeBtn}
                                                    onClick={() => removeMediaMutation.mutate(media.id)}
                                                    disabled={removeMediaMutation.isPending}
                                                    title="Remove from album"
                                                >
                                                    <X size={16} />
                                                </button>
                                            </div>
                                            <div className={styles.cardLabel} title={media.filename}>
                                                {media.filename}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className={styles.emptyMessage}>
                                    <p>This album is empty. Add media from your library!</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </Panel>
        </div>
    );
}
