import { useState, useEffect } from 'react';
import ThemeContext from '@/context/ThemeContext';

const ThemeProvider = ({ children }) => {
    const [theme, setTheme] = useState(() => {
        // Check localStorage first
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme && ['light', 'dark', 'coffee'].includes(savedTheme)) {
            return savedTheme;
        }

        // Check system preference
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }

        // Default to dark theme
        return 'dark';
    });

    useEffect(() => {
        // Apply theme to document root
        document.documentElement.setAttribute('data-theme', theme);

        // Save to localStorage
        localStorage.setItem('theme', theme);
    }, [theme]);

    // Listen for system theme changes
    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

        const handleChange = (e) => {
            // Only auto-switch if user hasn't manually set a preference
            const savedTheme = localStorage.getItem('theme');
            if (!savedTheme) {
                setTheme(e.matches ? 'dark' : 'light');
            }
        };

        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, []);

    const toggleTheme = () => {
        // Cycle through: light -> dark -> coffee -> light
        setTheme(prevTheme => {
            if (prevTheme === 'light') return 'dark';
            if (prevTheme === 'dark') return 'coffee';
            return 'light';
        });
    };

    const value = {
        theme,
        toggleTheme,
        setTheme,
    };

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
};

export default ThemeProvider;
