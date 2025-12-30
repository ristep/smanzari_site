import { createContext, useContext } from 'react';

const ThemeContext = createContext({
    theme: 'dark',
    toggleTheme: () => { },
    setTheme: () => { },
});

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};

export default ThemeContext;
