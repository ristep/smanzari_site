import { useEffect } from 'react';
import { X } from 'lucide-react';
import styles from './index.module.scss';
import clsx from 'clsx';

export default function Modal({ isOpen, onClose, title, children, size = 'medium' }) {
    // Handle ESC key press
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            // Prevent body scroll when modal is open
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div
                className={clsx(styles.modal, styles[size])}
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="modal-title"
            >
                <div className={styles.header}>
                    <h2 id="modal-title" className={styles.title}>{title}</h2>
                    <button
                        className={styles.closeButton}
                        onClick={onClose}
                        aria-label="Close modal"
                    >
                        <X size={24} />
                    </button>
                </div>
                <div className={styles.content}>
                    {children}
                </div>
            </div>
        </div>
    );
}
