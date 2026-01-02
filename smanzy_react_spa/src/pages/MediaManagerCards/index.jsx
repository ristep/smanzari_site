import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/services/api";
import Panel from "@/components/Panel";
import MediaCard from "@/components/MediaCard";
import UploadPanel from "@/components/UploadPanel";
import Pagination from "@/components/Pagination";
import styles from "./index.module.scss";

const CARD_BASE_WIDTH = 200; // Base card width in pixels
const GAP_SIZE = 16; // Gap size in pixels (matches $spacing-4)
const ROWS_TO_SHOW = 3; // Show up to 3 rows
const MIN_LIMIT = 6; // Minimum items per page

export default function MediaManagerCards() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [limit, setLimit] = useState(12); // Default limit
  const uploadPanelRef = useRef(null);
  const containerRef = useRef(null);

  // Calculate columns based on viewport width
  const calculateColumns = useCallback(() => {
    if (!containerRef.current) return 4;

    const containerWidth = containerRef.current.offsetWidth;
    if (containerWidth === 0) return 4; // Fallback if not yet rendered

    const cardWithGap = CARD_BASE_WIDTH + GAP_SIZE;
    const columns = Math.max(1, Math.floor(containerWidth / cardWithGap));
    return columns;
  }, []);

  // Calculate optimal limit based on viewport
  const calculateOptimalLimit = useCallback(() => {
    const columns = calculateColumns();
    const newLimit = Math.max(MIN_LIMIT, columns * ROWS_TO_SHOW);
    setLimit(newLimit);
  }, [calculateColumns]);

  // Handle window resize and initial mount
  useEffect(() => {
    // Calculate after a small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      calculateOptimalLimit();
    }, 100);

    const handleResize = () => {
      calculateOptimalLimit();
    };

    window.addEventListener("resize", handleResize);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", handleResize);
    };
  }, [calculateOptimalLimit]);

  const page = parseInt(searchParams.get("page")) || 1;

  // Fetch media list
  const { isPending, error, data } = useQuery({
    queryKey: ["media", page],
    queryFn: () =>
      api
        .get(`/media?limit=${limit}&offset=${(page - 1) * limit}`)
        .then((res) => {
          return res.data;
        }),
    keepPreviousData: true,
    retry: false,
  });

  const handlePageChange = (newPage) => {
    setSearchParams({ page: newPage });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Fetch current user for permissions
  const { data: userData } = useQuery({
    queryKey: ["profile"],
    queryFn: () => api.get("/profile").then((res) => res.data),
    retry: false,
  });
  const currentUser = userData?.data;

  const canView = () => {
    return true;
  };

  const canManage = (media) => {
    if (!currentUser) return false;
    const isAdmin = currentUser.roles?.some((r) => r.name === "admin");
    const isOwner = media.user_id === currentUser.id;
    return isAdmin || isOwner;
  };

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (file) => {
      const formData = new FormData();
      formData.append("file", file);

      return api.post("/media", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total,
          );
          setUploadProgress(percentCompleted);
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["media"] });
      setSelectedFile(null);
      setUploadProgress(0);
      if (uploadPanelRef.current) {
        uploadPanelRef.current.reset();
      }
    },
    onError: (err) => {
      alert(
        "Failed to upload file: " + (err.response?.data?.error || err.message),
      );
      setUploadProgress(0);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => {
      return api.delete(`/media/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["media"] });
    },
    onError: (err) => {
      alert(
        "Failed to delete media: " + (err.response?.data?.error || err.message),
      );
    },
  });

  const handleFileSelect = (file) => {
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

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.title}>Media Manager with thumbnails</h1>
        <p className={styles.subtitle}>
          Upload, manage, and organize your media files
        </p>
      </div>
      {/* Upload Section */}
      <UploadPanel
        ref={uploadPanelRef}
        title="Upload New File"
        onFileSelect={handleFileSelect}
        onUpload={handleUpload}
        selectedFile={selectedFile}
        isUploading={uploadMutation.isPending}
        uploadProgress={uploadProgress}
      />

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
            <p className={styles.emptySubtext}>
              Upload a file or check other pages
            </p>
          </div>
        ) : (
          <div ref={containerRef} className={styles.gridContainer}>
            {mediaList.map((media) => (
              <MediaCard
                key={media.id}
                media={media}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onDownload={handleDownload}
                canManage={canManage(media)}
                canView={canView(media)}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {mediaList.length > 0 && (
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        )}
      </Panel>
    </div>
  );
}
