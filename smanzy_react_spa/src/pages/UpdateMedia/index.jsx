import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import Button from '@/components/Button';
import styles from './index.module.scss';
import clsx from 'clsx';

export default function UpdateMedia() {
    const { id } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const fileInputRef = useRef(null);
    const [filename, setFilename] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);

    // Fetch media details
    const { data: media, isPending, error } = useQuery({
        queryKey: ['media', id],
        queryFn: () => api.get(`/media/${id}/details`).then((res) => res.data.data),
        retry: false,
    });


    // Handle file selection
    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            // Create preview if it's an image
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onloadend = () => {
                    setPreviewUrl(reader.result);
                };
                reader.readAsDataURL(file);
            } else {
                setPreviewUrl(null);
            }
        }
    };

    // Update mutation
    const updateMutation = useMutation({
        mutationFn: async () => {
            const formData = new FormData();
            if (filename !== null && filename !== media.filename) {
                formData.append('filename', filename);
            }
            if (selectedFile) {
                formData.append('file', selectedFile);
            }

            return api.put(`/media/${id}`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['media'] });
            queryClient.invalidateQueries({ queryKey: ['media', id] });
            navigate(-1);
        },
        onError: (err) => {
            alert('Failed to update media: ' + (err.response?.data?.error || err.message));
        }
    });

    if (isPending) return (
        <div className={styles.loadingContainer}>
            <div className="text-center">
                <div className={styles.spinner}></div>
                <p className={styles.helpText}>Loading media details...</p>
            </div>
        </div>
    );

    if (error) return (
        <div className={styles.errorContainer}>
            <div className={styles.errorBox}>
                <p className={styles.errorTitle}>Error loading media</p>
                <p className={styles.errorMessage}>{error.message}</p>
                <Button className="mt-4" onClick={() => navigate(-1)}>Back to Media</Button>
            </div>
        </div>
    );

    const currentFileUrl = import.meta.env.VITE_API_BASE_URL.replace('/api', '') + media.url;
    const isImage = media.mime_type?.startsWith('image/');

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Update Media</h1>
                <Button variant="secondary" size="sm" onClick={() => navigate(-1)}>
                    &larr; Back to List
                </Button>
            </div>

            <div className={styles.card}>
                <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitle}>Current File Details</h2>
                </div>

                {/* Current File Preview */}
                <div className={styles.detailsSection}>
                    <div className={styles.detailsGrid}>
                        <div className={styles.previewWrapper}>
                            {isImage ? (
                                <img src={currentFileUrl} alt={media.filename} className={styles.previewImage} />
                            ) : (
                                <div className={styles.previewIcon}>
                                    {media.mime_type?.includes('pdf') ? '📕' : media.mime_type?.includes('video') ? '🎥' : '📄'}
                                </div>
                            )}
                        </div>
                        <div className={styles.detailsList}>
                            <div className={styles.fullWidth}>
                                <dt className={styles.detailLabel}>Filename</dt>
                                <dd className={clsx(styles.detailValue, styles.detailValueEmphasis)}>{media.filename}</dd>
                            </div>
                            <div>
                                <dt className={styles.detailLabel}>Size</dt>
                                <dd className={styles.detailValue}>{(media.size / 1024).toFixed(2)} KB</dd>
                            </div>
                            <div>
                                <dt className={styles.detailLabel}>Type</dt>
                                <dd className={styles.detailValue}>{media.mime_type}</dd>
                            </div>
                            <div className={styles.fullWidth}>
                                <a href={currentFileUrl} target="_blank" rel="noopener noreferrer" className={styles.externalLink}>
                                    View/Download Original File
                                </a>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Edit Form */}
                <div className={styles.formSection}>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>
                            Filename / Description
                        </label>
                        <p className={styles.helpText}>Update the display name of the file.</p>
                        <input
                            type="text"
                            value={filename ?? media?.filename ?? ''}
                            onChange={(e) => setFilename(e.target.value)}
                            placeholder="Enter filename"
                            className={styles.input}
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>
                            Replace File (Optional)
                        </label>
                        <p className={styles.helpText}>Upload a new file to replace the existing content.</p>
                        <div className={styles.uploadArea}>
                            <div className="flex flex-col items-center">
                                {previewUrl ? (
                                    <div className="mb-4 text-center">
                                        <img src={previewUrl} alt="Preview" className={styles.previewImage} />
                                        <p className={styles.helpText}>New file preview</p>
                                    </div>
                                ) : (
                                    <svg className={styles.uploadIcon} stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                )}
                                <div className={styles.uploadControls}>
                                    <label htmlFor="file-upload" className={styles.uploadButtonLabel}>
                                        <span>Upload a file</span>
                                        <input id="file-upload" name="file-upload" type="file" className="sr-only" ref={fileInputRef} onChange={handleFileSelect} />
                                    </label>
                                    <p className="pl-1">or drag and drop</p>
                                </div>
                                <p className={styles.helpText}>
                                    {selectedFile ? `Selected: ${selectedFile.name}` : "Any file type up to 10MB"}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className={styles.footer}>
                    <Button variant="secondary" onClick={() => navigate(-1)}>
                        Cancel
                    </Button>
                    <Button
                        onClick={() => updateMutation.mutate()}
                        disabled={updateMutation.isPending || (filename === null && !selectedFile)}
                    >
                        {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                    </Button>
                </div>
            </div>
        </div>
    );
}
