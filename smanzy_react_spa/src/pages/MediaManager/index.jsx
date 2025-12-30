import { useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Edit, Download, Trash2 } from 'lucide-react';

import api from '@/services/api';
import Button from '@/components/Button';
import IconButton from '@/components/IconButton';
import Panel from '@/components/Panel';
import { formatDateTime } from '@/utils/dateFormat';
import { formatFileSize } from '@/utils/fileUtils';
import styles from './index.module.scss';
import clsx from 'clsx';
import { FileIcon } from '@/components';

export default function MediaManager() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const queryClient = useQueryClient();
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const fileInputRef = useRef(null);

    const page = parseInt(searchParams.get('page')) || 1;
    const limit = 5; // Number of items per page

    // Fetch media list
    const { isPending, error, data } = useQuery({
        queryKey: ['media', page],
        queryFn: () => api.get(`/media?limit=${limit}&offset=${(page - 1) * limit}`).then((res) => {
            return res.data;
        }),
        keepPreviousData: true,
        retry: false,
    });

    const handlePageChange = (newPage) => {
        setSearchParams({ page: newPage });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Fetch current user for permissions
    const { data: userData } = useQuery({
        queryKey: ['profile'],
        queryFn: () => api.get('/profile').then((res) => res.data),
        retry: false,
    });
    const currentUser = userData?.data;

    const canView = (media) => {
        return true;
    };

    const canManage = (media) => {
        if (!currentUser) return false;
        const isAdmin = currentUser.roles?.some(r => r.name === 'admin');
        const isOwner = media.user_id === currentUser.id;
        return isAdmin || isOwner;
    };

    // Upload mutation
    const uploadMutation = useMutation({
        mutationFn: async (file) => {
            const formData = new FormData();
            formData.append('file', file);

            return api.post('/media', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    setUploadProgress(percentCompleted);
                },
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['media'] });
            setSelectedFile(null);
            setUploadProgress(0);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        },
        onError: (err) => {
            alert('Failed to upload file: ' + (err.response?.data?.error || err.message));
            setUploadProgress(0);
        }
    });


    // Delete mutation
    const deleteMutation = useMutation({
        mutationFn: (id) => {
            return api.delete(`/media/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['media'] });
        },
        onError: (err) => {
            alert('Failed to delete media: ' + (err.response?.data?.error || err.message));
        }
    });

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
        }
    };

    const handleUpload = () => {
        if (selectedFile) {
            uploadMutation.mutate(selectedFile);
        }
    };

    const handleEdit = (media) => {
        navigate(`/media/edit/${media.id}`);
    };

    const handleDelete = (media) => {
        if (window.confirm(`Are you sure you want to delete "${media.filename}"?`)) {
            deleteMutation.mutate(media.id);
        }
    };

    const handleDownload = (media) => {
        window.open(import.meta.env.VITE_API_BASE_URL.replace('/api', '') + media.url, '_blank');
    };

    if (isPending) {
        return (
            <div className={styles.loadingSpinner}>
                <div className="text-center">
                    <div className={styles.spinner}></div>
                    <p className={styles.textSecondary}>Loading media...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.errorContainer}>
                <div className={styles.errorBox}>
                    <p className={styles.errorTitle}>Error loading media</p>
                    <p className={styles.errorMessage}>{error.message}</p>
                </div>
            </div>
        );
    }

    const responseData = data?.data;
    const mediaList = responseData?.files || [];
    const totalItems = responseData?.total || 0;
    const totalPages = Math.ceil(totalItems / limit);

    const getPageNumbers = () => {
        const pageNumbers = [];
        const maxPagesToShow = 5;

        if (totalPages <= maxPagesToShow) {
            for (let i = 1; i <= totalPages; i++) {
                pageNumbers.push(i);
            }
        } else {
            let startPage = Math.max(1, page - 2);
            let endPage = Math.min(totalPages, page + 2);

            if (page <= 3) {
                endPage = Math.min(totalPages, 5);
            }
            if (page >= totalPages - 2) {
                startPage = Math.max(1, totalPages - 4);
            }

            if (startPage > 1) {
                pageNumbers.push(1);
                if (startPage > 2) pageNumbers.push('...');
            }

            for (let i = startPage; i <= endPage; i++) {
                pageNumbers.push(i);
            }

            if (endPage < totalPages) {
                if (endPage < totalPages - 1) pageNumbers.push('...');
                pageNumbers.push(totalPages);
            }
        }
        return pageNumbers;
    };

    return (
        <div className={styles.container}>
            {/* Header */}
            <div className={styles.header}>
                <h1 className={styles.title}>Media Manager</h1>
                <p className={styles.subtitle}>Upload, manage, and organize your media files</p>
            </div>
            {/* Upload Section */}
            <Panel className="mb-4">
                <h2 className={styles.sectionTitle}>Upload New File</h2>
                <div className={styles.uploadSection}>
                    <div className={styles.fileInputWrapper}>
                        <input
                            ref={fileInputRef}
                            type="file"
                            onChange={handleFileSelect}
                            className={styles.fileInput}
                        />
                    </div>
                    <Button
                        onClick={handleUpload}
                        disabled={!selectedFile || uploadMutation.isPending}
                        className="whitespace-nowrap"
                    >
                        {uploadMutation.isPending ? 'Uploading...' : 'Upload File'}
                    </Button>
                </div>
                {uploadProgress > 0 && uploadProgress < 100 && (
                    <div className={styles.progressWrapper}>
                        <div className={styles.progressInfo}>
                            <span>Upload Progress</span>
                            <span>{uploadProgress}%</span>
                        </div>
                        <div className={styles.progressBarTrack}>
                            <div
                                className={styles.progressBarFill}
                                style={{ width: `${uploadProgress}%` }}
                            ></div>
                        </div>
                    </div>
                )}
            </Panel>

            {/* Media List */}
            <Panel>
                <div className={styles.tableHeader}>
                    <div>
                        <h2 className={styles.sectionTitle}>Your Media Files</h2>
                        <p className={styles.tableInfo}>
                            Showing {mediaList.length} of {totalItems} files
                        </p>
                    </div>
                    {totalPages > 1 && (
                        <div className={styles.textSecondary}>
                            Page {page} of {totalPages}
                        </div>
                    )}
                </div>

                {mediaList.length === 0 ? (
                    <div className={styles.emptyState}>
                        <div className={styles.emptyIcon}>📁</div>
                        <p className={styles.emptyText}>No media files found</p>
                        <p className={styles.emptySubtext}>Upload a file or check other pages</p>
                    </div>
                ) : (
                    <div className={styles.tableWrapper}>
                        <table className={styles.table}>
                            <thead className={styles.thead}>
                                <tr>
                                    <th className={styles.th}>File Name</th>
                                    <th className={styles.th}>Type</th>
                                    <th className={styles.th}>Size</th>
                                    <th className={styles.th}>Uploaded</th>
                                    <th className={clsx(styles.th, styles.right)}>Actions</th>
                                </tr>
                            </thead>
                            <tbody className={styles.tbody}>
                                {mediaList.map((media) => (
                                    <tr key={media.id} className={styles.tr}>
                                        <td className={styles.td}>
                                            <div className={styles.fileName}>{media.filename}</div>
                                            <div className={styles.fileId}>ID: {media.id}</div>
                                        </td>
                                        <td className={styles.td}>
                                            <span className={styles.typeBadge}>
                                                <FileIcon mimeType={media.mime_type} />
                                            </span>
                                        </td>
                                        <td className={clsx(styles.td, styles.textSecondary)}>
                                            {formatFileSize(media.size)}
                                        </td>
                                        <td className={clsx(styles.td, styles.textSecondary)}>
                                            {formatDateTime(media.created_at)}
                                        </td>
                                        <td className={clsx(styles.td, styles.right)}>
                                            <div className="flex justify-end gap-2">
                                                <IconButton
                                                    onClick={() => handleDownload(media)}
                                                    disabled={!canView(media)}
                                                    title="Download"
                                                >
                                                    <Download />
                                                </IconButton>
                                                <IconButton
                                                    onClick={() => handleEdit(media)}
                                                    disabled={!canManage(media)}
                                                    title="Edit"
                                                >
                                                    <Edit />
                                                </IconButton>
                                                <IconButton
                                                    onClick={() => handleDelete(media)}
                                                    disabled={!canManage(media)}
                                                    title="Delete"
                                                >
                                                    <Trash2 />
                                                </IconButton>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {mediaList.length > 0 && totalPages > 1 && (
                    <div className={styles.pagination}>
                        <div className={styles.paginationInfo}>
                            Page <span>{page}</span> of <span>{totalPages}</span>
                        </div>
                        <div className={styles.paginationControls}>
                            <Button
                                onClick={() => handlePageChange(page - 1)}
                                disabled={page === 1}
                                variant="secondary"
                                size="sm"
                            >
                                Previous
                            </Button>

                            <div className={styles.pageNumbers}>
                                {getPageNumbers().map((pageNum, index) => (
                                    pageNum === '...' ? (
                                        <span key={`dots-${index}`} className={styles.dots}>...</span>
                                    ) : (
                                        <Button
                                            key={pageNum}
                                            onClick={() => handlePageChange(pageNum)}
                                            variant={page === pageNum ? 'primary' : 'secondary'}
                                            size="sm"
                                        >
                                            {pageNum}
                                        </Button>
                                    )
                                ))}
                            </div>

                            <Button
                                onClick={() => handlePageChange(page + 1)}
                                disabled={page >= totalPages}
                                variant="secondary"
                                size="sm"
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                )}
            </Panel>
        </div>
    );
}
