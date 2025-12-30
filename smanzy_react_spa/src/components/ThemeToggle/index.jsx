import React from 'react';
import { Sun, Moon, Coffee } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import clsx from 'clsx';

import styles from './index.module.scss';

const ThemeToggle = () => {
    const { theme, toggleTheme } = useTheme();

    const getNextTheme = () => {
        if (theme === 'light') return 'dark';
        if (theme === 'dark') return 'coffee';
        return 'light';
    };

    return (
        <button
            onClick={toggleTheme}
            className={styles.toggle}
            aria-label={`Switch to ${getNextTheme()} mode`}
            title={`Switch to ${getNextTheme()} mode`}
        >
            <div className={styles.iconWrapper}>
                <Sun
                    className={clsx(styles.icon, theme === 'light' ? styles.visible : styles.hidden)}
                    size={20}
                />
                <Moon
                    className={clsx(styles.icon, theme === 'dark' ? styles.visible : styles.hidden)}
                    size={20}
                />
                <Coffee
                    className={clsx(styles.icon, theme === 'coffee' ? styles.visible : styles.hidden)}
                    size={20}
                />
            </div>
        </button>
    );
};

export default ThemeToggle;
