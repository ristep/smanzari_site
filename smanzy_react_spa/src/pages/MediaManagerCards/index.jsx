import { useState, useRef, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/services/api";
import Panel from "@/components/Panel";
import MediaCard from "@/components/MediaCard";
import UploadPanel from "@/components/UploadPanel";
import Pagination from "@/components/Pagination";
import styles from "./index.module.scss";
import { getThumbnailUrl } from "@/utils/fileUtils";

const CARD_BASE_WIDTH = 200; // Base card width in pixels
const GAP_SIZE = 16; // Gap size in pixels (matches $spacing-4)
const ROWS_TO_SHOW = 2; // Number of rows to show
const MAX_LIMIT = 8; // Maximum items per page
const RESIZE_DEBOUNCE_MS = 50;

export default function MediaManagerCards() {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [limit, setLimit] = useState(MAX_LIMIT); // Default limit
  const uploadPanelRef = useRef(null);
  const containerRef = useRef(null);
  const resizeTimerRef = useRef(null);

  // Calculate columns based on container width
  const calculateColumns = useCallback(() => {
    const el = containerRef.current;
    const containerWidth =
      (el && el.getBoundingClientRect().width) || window.innerWidth || 0;
    if (containerWidth === 0) return 1;

    const cardWithGap = CARD_BASE_WIDTH + GAP_SIZE;
    return Math.max(1, Math.floor(containerWidth / cardWithGap));
  }, []);

  // Calculate and set an optimal limit (clamped to MAX_LIMIT)
  const calculateOptimalLimit = useCallback(() => {
    const columns = calculateColumns();
    const newLimit = Math.min(MAX_LIMIT, Math.max(1, columns * ROWS_TO_SHOW));
    setLimit((prev) => (prev === newLimit ? prev : newLimit));
  }, [calculateColumns]);

  // Use ResizeObserver (with debounce) and window resize fallback to update limit
  useEffect(() => {
    const update = () => {
      if (resizeTimerRef.current) clearTimeout(resizeTimerRef.current);
      resizeTimerRef.current = setTimeout(() => {
        calculateOptimalLimit();
        resizeTimerRef.current = null;
      }, RESIZE_DEBOUNCE_MS);
    };

    // Initial calculation
    update();

    let ro;
    if (typeof ResizeObserver !== "undefined" && containerRef.current) {
      ro = new ResizeObserver(update);
      ro.observe(containerRef.current);
    }

    window.addEventListener("resize", update);
    return () => {
      if (ro) ro.disconnect();
      window.removeEventListener("resize", update);
      if (resizeTimerRef.current) clearTimeout(resizeTimerRef.current);
    };
  }, [calculateOptimalLimit]);

  const page = parseInt(searchParams.get("page")) || 1;

  // Fetch media list (include limit in the query key so we refetch when it changes)
  const { isPending, error, data } = useQuery({
    queryKey: ["media", page, limit],
    queryFn: () =>
      api
        .get(`/media?limit=${limit}&offset=${(page - 1) * limit}`)
        .then((res) => res.data),
    keepPreviousData: true,
    retry: false,
  });

  // Ensure the page is within the valid range when new data arrives
  useEffect(() => {
    if (!data) return;
    const totalItems = data?.data?.total || 0;
    const pages = Math.ceil(totalItems / (limit || 1));

    if (pages === 0 && page !== 1) {
      setSearchParams({ page: 1 });
    } else if (pages > 0 && page > pages) {
      setSearchParams({ page: pages });
    }
  }, [data, limit, page, setSearchParams]);

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
    onSuccess: async (res) => {
      // Backend returns the created media in res.data.data
      // We're no longer waiting for thumbnail generation here — refresh immediately.
      const mediaObj = res?.data?.data || res?.data;
      setIsProcessing(true);
      queryClient.invalidateQueries({ queryKey: ["media"] });
      setSelectedFile(null);
      setUploadProgress(0);
      if (uploadPanelRef.current) {
        uploadPanelRef.current.reset();
      }
      setIsProcessing(false);
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
  const totalPages = Math.ceil(totalItems / (limit || 1));

  return (
    // attach the containerRef to the outer container so we can measure a stable element
    <div className={styles.container} ref={containerRef}>
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
        isProcessing={isProcessing}
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
          <div className={styles.gridContainer}>
            {mediaList.map((media) => (
              <MediaCard
                key={media.id}
                media={media}
                onDelete={(m) => deleteMutation.mutate(m.id)}
                canManage={canManage(media)}
                canView={canView(media)}
              />
            ))}
          </div>
        )}

        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      </Panel>
    </div>
  );
}
