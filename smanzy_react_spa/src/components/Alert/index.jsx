import React from 'react';
import { X, AlertCircle, CheckCircle, AlertTriangle, Info } from 'lucide-react';
import styles from './index.module.scss';
import clsx from 'clsx';

export default function Alert({
    children,
    variant = 'info',
    className = '',
    onClose,
    dismissible = false,
    ...props
}) {
    const icons = {
        success: <CheckCircle className={styles.icon} />,
        error: <AlertCircle className={styles.icon} />,
        warning: <AlertTriangle className={styles.icon} />,
        info: <Info className={styles.icon} />
    };

    const combinedClasses = clsx(
        styles.alert,
        styles[variant],
        className
    );

    return (
        <div className={combinedClasses} {...props}>
            <div className={styles.content}>
                <div className={styles.iconContainer}>
                    {icons[variant]}
                </div>
                <div className={styles.message}>
                    {children}
                </div>
            </div>
            {dismissible && onClose && (
                <button
                    type="button"
                    className={styles.closeButton}
                    onClick={onClose}
                    aria-label="Close alert"
                >
                    <X className={styles.closeIcon} />
                </button>
            )}
        </div>
    );
}