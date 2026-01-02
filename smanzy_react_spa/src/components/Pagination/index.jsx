import React from "react";
import Button from "@/components/Button";
import styles from "./index.module.scss";

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  maxWidth,
}) {
  if (totalPages <= 1) return null;

  const paginationStyle = maxWidth
    ? { maxWidth, marginLeft: "auto", marginRight: "auto" }
    : {};

  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxPagesToShow = 5;

    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      let startPage = Math.max(1, currentPage - 2);
      let endPage = Math.min(totalPages, currentPage + 2);

      if (currentPage <= 3) {
        endPage = Math.min(totalPages, 5);
      }
      if (currentPage >= totalPages - 2) {
        startPage = Math.max(1, totalPages - 4);
      }

      if (startPage > 1) {
        pageNumbers.push(1);
        if (startPage > 2) pageNumbers.push("...");
      }

      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
      }

      if (endPage < totalPages) {
        if (endPage < totalPages - 1) pageNumbers.push("...");
        pageNumbers.push(totalPages);
      }
    }
    return pageNumbers;
  };

  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  return (
    <div className={styles.pagination} style={paginationStyle}>
      <div className={styles.paginationInfo}>
        Page <span>{currentPage}</span> of <span>{totalPages}</span>
      </div>
      <div className={styles.paginationControls}>
        <Button
          onClick={handlePrevious}
          disabled={currentPage === 1}
          variant="secondary"
          size="sm"
        >
          Previous
        </Button>

        <div className={styles.pageNumbers}>
          {getPageNumbers().map((pageNum, index) =>
            pageNum === "..." ? (
              <span key={`dots-${index}`} className={styles.dots}>
                ...
              </span>
            ) : (
              <Button
                key={pageNum}
                onClick={() => onPageChange(pageNum)}
                variant={currentPage === pageNum ? "primary" : "secondary"}
                size="sm"
              >
                {pageNum}
              </Button>
            ),
          )}
        </div>

        <Button
          onClick={handleNext}
          disabled={currentPage >= totalPages}
          variant="secondary"
          size="sm"
        >
          Next
        </Button>
      </div>
    </div>
  );
}
