import { useState, useEffect, useRef } from 'react';
import styles from './index.module.scss';

/**
 * LazyImage component with skeleton loading and error handling
 * Provides smooth loading experience with fade-in animation
 */
export default function LazyImage({
    src,
    alt = '',
    className = '',
    skeletonClassName = '',
    onLoad,
    onError,
    ...props
}) {
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);
    const [retryCount, setRetryCount] = useState(0);
    const imgRef = useRef(null);

    const { maxRetries = 3, retryDelay = 2000 } = props;

    useEffect(() => {
        setIsLoading(true);
        setHasError(false);
        setRetryCount(0);
    }, [src]);

    const handleLoad = (e) => {
        setIsLoading(false);
        if (onLoad) onLoad(e);
    };

    const handleError = (e) => {
        if (retryCount < maxRetries) {
            setTimeout(() => {
                setRetryCount(prev => prev + 1);
            }, retryDelay);
        } else {
            setIsLoading(false);
            setHasError(true);
            if (onError) onError(e);
        }
    };

    return (
        <div className={styles.lazyImageWrapper}>
            {isLoading && !hasError && (
                <div className={`${styles.skeleton} ${skeletonClassName}`} />
            )}
            {hasError ? (
                <div className={styles.errorPlaceholder}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <polyline points="21 15 16 10 5 21" />
                    </svg>
                </div>
            ) : (
                <img
                    key={`${src}-${retryCount}`}
                    ref={imgRef}
                    src={src}
                    alt={alt}
                    className={`${className} ${styles.lazyImage} ${!isLoading ? styles.loaded : ''}`}
                    onLoad={handleLoad}
                    onError={handleError}
                    loading="lazy"
                    decoding="async"
                    {...props}
                />
            )}
        </div>
    );
}
