import { useRef, useEffect, useState } from 'react';
import { Grid } from 'react-window';
import MediaCard from '@/components/MediaCard';
import styles from './index.module.scss';

/**
 * VirtualMediaGrid - Virtualized grid for rendering large media collections
 * Only renders visible items for optimal performance with 100+ items
 */
export default function VirtualMediaGrid({
    mediaItems = [],
    onDelete,
    canManage = false,
    canView = true,
    threshold = 100 // Use virtual scrolling when items exceed this threshold
}) {
    const containerRef = useRef(null);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

    // Configuration
    const CARD_WIDTH = 270; // 250px card + 20px gap
    const CARD_HEIGHT = 380; // Approximate card height
    const GAP = 20;
    const MIN_COLUMNS = 1;

    // Calculate grid dimensions
    useEffect(() => {
        const updateDimensions = () => {
            if (containerRef.current) {
                const width = containerRef.current.offsetWidth;
                const height = window.innerHeight - 300; // Account for header/footer
                setDimensions({ width, height });
            }
        };

        updateDimensions();
        window.addEventListener('resize', updateDimensions);
        return () => window.removeEventListener('resize', updateDimensions);
    }, []);

    // Calculate number of columns based on container width
    const columnCount = Math.max(
        MIN_COLUMNS,
        Math.floor((dimensions.width + GAP) / CARD_WIDTH)
    );

    const rowCount = Math.ceil(mediaItems.length / columnCount);

    // If below threshold, render normally without virtualization
    if (mediaItems.length < threshold) {
        return (
            <div className={styles.normalGrid}>
                {mediaItems.map(media => (
                    <MediaCard
                        key={media.id}
                        media={media}
                        onDelete={onDelete}
                        canManage={canManage}
                        canView={canView}
                    />
                ))}
            </div>
        );
    }

    // Cell renderer for virtual grid
    const Cell = ({ columnIndex, rowIndex, style }) => {
        const index = rowIndex * columnCount + columnIndex;

        // Don't render if index exceeds media items
        if (index >= mediaItems.length) {
            return null;
        }

        const media = mediaItems[index];

        return (
            <div style={style}>
                <div className={styles.cellContent}>
                    <MediaCard
                        key={media.id}
                        media={media}
                        onDelete={onDelete}
                        canManage={canManage}
                        canView={canView}
                    />
                </div>
            </div>
        );
    };

    return (
        <div ref={containerRef} className={styles.virtualGridContainer}>
            {dimensions.width > 0 && (
                <>
                    <div className={styles.itemCount}>
                        Showing {mediaItems.length} items (virtual scrolling enabled)
                    </div>
                    <Grid
                        className={styles.virtualGrid}
                        columnCount={columnCount}
                        columnWidth={CARD_WIDTH}
                        height={dimensions.height}
                        rowCount={rowCount}
                        rowHeight={CARD_HEIGHT}
                        width={dimensions.width}
                        overscanRowCount={2} // Render 2 extra rows for smooth scrolling
                    >
                        {Cell}
                    </Grid>
                </>
            )}
        </div>
    );
}
