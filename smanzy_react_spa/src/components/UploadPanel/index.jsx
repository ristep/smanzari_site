import React, { useRef, forwardRef, useImperativeHandle } from "react";
import Panel from "@/components/Panel";
import Button from "@/components/Button";
import styles from "./index.module.scss";

const UploadPanel = forwardRef(
  (
    {
      title = "Upload New File",
      onFileSelect,
      onUpload,
      selectedFile,
      isUploading = false,
      uploadProgress = 0,
      buttonText = "Upload File",
      uploadingText = "Uploading...",
      accept,
      className,
    },
    ref,
  ) => {
    const fileInputRef = useRef(null);

    // Expose reset method to parent via ref
    useImperativeHandle(ref, () => ({
      reset: () => {
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      },
    }));

    const handleFileChange = (e) => {
      const file = e.target.files[0];
      if (file && onFileSelect) {
        onFileSelect(file);
      }
    };

    const handleUploadClick = () => {
      if (onUpload) {
        onUpload();
      }
    };

    const showProgress = uploadProgress > 0 && uploadProgress < 100;

    return (
      <Panel className={`${styles.uploadPanel} ${className || ""}`}>
        <h2 className={styles.sectionTitle}>{title}</h2>
        <div className={styles.uploadSection}>
          <div className={styles.fileInputWrapper}>
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileChange}
              className={styles.fileInput}
              accept={accept}
            />
          </div>
          <Button
            onClick={handleUploadClick}
            disabled={!selectedFile || isUploading}
            className={styles.uploadButton}
          >
            {isUploading ? uploadingText : buttonText}
          </Button>
        </div>
        {showProgress && (
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
    );
  },
);

UploadPanel.displayName = "UploadPanel";

export default UploadPanel;
