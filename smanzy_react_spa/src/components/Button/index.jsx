import React from 'react';
import styles from './index.module.scss';
import clsx from 'clsx';

export default function Button({
    children,
    variant = 'primary',
    size = 'md',
    className = '',
    disabled = false,
    type = 'button',
    onClick,
    ...props
}) {
    const combinedClasses = clsx(
        styles.button,
        styles[variant],
        styles[size],
        className
    );

    return (
        <button
            type={type}
            className={combinedClasses}
            disabled={disabled}
            onClick={onClick}
            {...props}
        >
            {children}
        </button>
    );
}
