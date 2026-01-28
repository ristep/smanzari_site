import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Upload, X } from "lucide-react";

import api from "@/services/api";
import Button from "@/components/Button";
import Panel from "@/components/Panel";
import { formatFileSize } from "@/utils/fileUtils";
import styles from "./index.module.scss";
import clsx from "clsx";

export default function MediaUpload() {
  const queryClient = useQueryClient();
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState({});
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  // Fetch current user for permissions
  const { data: userData } = useQuery({
    queryKey: ["profile"],
    queryFn: () => api.get("/profile").then((res) => res.data),
    retry: false,
  });
  const currentUser = userData?.data;

  // Upload mutation for a single file
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
          setUploadProgress((prev) => ({
            ...prev,
            [file.name]: percentCompleted,
          }));
        },
      });
    },
    onSuccess: (res, file) => {
      setUploadedFiles((prev) => [
        ...prev,
        { name: file.name, success: true, status: "Uploaded" },
      ]);
    },
    onError: (err, file) => {
      setUploadedFiles((prev) => [
        ...prev,
        {
          name: file.name,
          success: false,
          status: err.response?.data?.error || err.message,
        },
      ]);
    },
  });

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles((prev) => [...prev, ...files]);
  };

  const handleRemoveFile = (fileName) => {
    setSelectedFiles((prev) =>
      prev.filter((f) => f.name !== fileName)
    );
  };

  const handleUploadAll = async () => {
    if (selectedFiles.length === 0) {
      alert("Please select files to upload");
      return;
    }

    setIsUploading(true);
    setUploadedFiles([]);
    setUploadProgress({});

    try {
      // Upload files sequentially to avoid overwhelming the server
      for (const file of selectedFiles) {
        await uploadMutation.mutateAsync(file);
      }
    } finally {
      setIsUploading(false);
      // Refresh media list after all uploads complete
      queryClient.invalidateQueries({ queryKey: ["media"] });
      // Clear selected files after successful uploads
      if (uploadedFiles.every((f) => f.success)) {
        setSelectedFiles([]);
      }
    }
  };

  const handleClearSelected = () => {
    setSelectedFiles([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClearResults = () => {
    setUploadedFiles([]);
  };

  const successCount = uploadedFiles.filter((f) => f.success).length;
  const failureCount = uploadedFiles.filter((f) => !f.success).length;

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.title}>Upload Media</h1>
        <p className={styles.subtitle}>
          Upload multiple files at once
        </p>
      </div>

      {/* Upload Section */}
      <Panel>
        <div className={styles.uploadSection}>
          <div className={styles.uploadBox}>
            <Upload size={48} className={styles.uploadIcon} />
            <p className={styles.uploadText}>
              Drag and drop files here or click to select
            </p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileSelect}
              style={{ display: "none" }}
              className={styles.fileInput}
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="primary"
            >
              Select Files
            </Button>
          </div>

          {/* Selected Files List */}
          {selectedFiles.length > 0 && (
            <div className={styles.filesList}>
              <h3 className={styles.filesHeader}>
                Selected Files ({selectedFiles.length})
              </h3>
              <div className={styles.filesContainer}>
                {selectedFiles.map((file) => (
                  <div key={file.name} className={styles.fileItem}>
                    <div className={styles.fileInfo}>
                      <span className={styles.fileName}>{file.name}</span>
                      <span className={styles.fileSize}>
                        {formatFileSize(file.size)}
                      </span>
                    </div>
                    <button
                      onClick={() => handleRemoveFile(file.name)}
                      className={styles.removeButton}
                      disabled={isUploading}
                      title="Remove"
                    >
                      <X size={18} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className={styles.actionButtons}>
                <Button
                  onClick={handleUploadAll}
                  variant="primary"
                  disabled={isUploading}
                >
                  {isUploading ? "Uploading..." : "Upload All"}
                </Button>
                <Button
                  onClick={handleClearSelected}
                  variant="secondary"
                  disabled={isUploading}
                >
                  Clear
                </Button>
              </div>
            </div>
          )}
        </div>
      </Panel>

      {/* Upload Results */}
      {uploadedFiles.length > 0 && (
        <Panel>
          <div className={styles.resultsSection}>
            <div className={styles.resultsHeader}>
              <h3 className={styles.resultsTitle}>Upload Results</h3>
              <div className={styles.resultsSummary}>
                {successCount > 0 && (
                  <span className={clsx(styles.summary, styles.success)}>
                    ✓ {successCount} uploaded
                  </span>
                )}
                {failureCount > 0 && (
                  <span className={clsx(styles.summary, styles.failure)}>
                    ✗ {failureCount} failed
                  </span>
                )}
              </div>
            </div>

            <div className={styles.resultsList}>
              {uploadedFiles.map((result) => (
                <div
                  key={result.name}
                  className={clsx(
                    styles.resultItem,
                    result.success ? styles.success : styles.failure
                  )}
                >
                  <span className={styles.resultName}>{result.name}</span>
                  <span className={styles.resultStatus}>{result.status}</span>
                </div>
              ))}
            </div>

            <Button
              onClick={handleClearResults}
              variant="secondary"
            >
              Clear Results
            </Button>
          </div>
        </Panel>
      )}

      {/* Progress Indicator */}
      {isUploading && Object.keys(uploadProgress).length > 0 && (
        <Panel>
          <div className={styles.progressSection}>
            <h3 className={styles.progressTitle}>Upload Progress</h3>
            <div className={styles.progressList}>
              {Object.entries(uploadProgress).map(([fileName, percent]) => (
                <div key={fileName} className={styles.progressItem}>
                  <span className={styles.progressName}>{fileName}</span>
                  <div className={styles.progressBar}>
                    <div
                      className={styles.progressFill}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <span className={styles.progressPercent}>{percent}%</span>
                </div>
              ))}
            </div>
          </div>
        </Panel>
      )}
    </div>
  );
}
