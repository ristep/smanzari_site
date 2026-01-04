import { createContext, useContext } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';

const VersionContext = createContext({
    versionInfo: null,
    isLoading: true,
    error: null,
});

export const VersionProvider = ({ children }) => {
    const { data, isLoading, error } = useQuery({
        queryKey: ['version'],
        queryFn: () => api.get('/version').then((res) => res.data),
        staleTime: Infinity, // Version info shouldn't change during a session
        retry: 2,
    });

    return (
        <VersionContext.Provider value={{ versionInfo: data, isLoading, error }}>
            {children}
        </VersionContext.Provider>
    );
};

export const useVersion = () => {
    const context = useContext(VersionContext);
    if (!context) {
        throw new Error('useVersion must be used within a VersionProvider');
    }
    return context;
};

export default VersionContext;
