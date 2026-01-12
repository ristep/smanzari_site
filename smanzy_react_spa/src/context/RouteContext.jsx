import React, { createContext, useState, useEffect } from 'react';

export const RouteContext = createContext();

export const RouteProvider = ({ children }) => {
    // Initial state: You might want to start with public routes only
    const [routes, setRoutes] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // SIMULATION: In a real app, this is where you fetch from an API
        // or check localStorage for a role to decide which JSON to load.
        const loadRoutes = async () => {
            setIsLoading(true);

            // Simulating API delay
            await new Promise(r => setTimeout(r, 500));

            // The data structure you would get from your DB/API
            const appRoutes = [
                {
                    index: true,
                    component: 'Home',
                    title: 'Home',
                    protected: false,
                    group: 'menu'
                },
                {
                    path: 'videos',
                    component: 'Videos',
                    title: 'Videos',
                    protected: false,
                    group: 'menu'
                },
                {
                    path: 'about',
                    component: 'About',
                    title: 'About',
                    protected: false,
                    group: 'menu'
                },
                {
                    path: 'login',
                    component: 'Login',
                    title: 'Login',
                    protected: false,
                },
                {
                    path: 'register',
                    component: 'Register',
                    title: 'Register',
                    protected: false
                },
                {
                    path: 'profile',
                    component: 'Profile',
                    title: 'Profile',
                    protected: true,
                    group: "admin"
                },
                {
                    path: 'media',
                    component: 'MediaManager',
                    title: 'Media List',
                    protected: true,
                    group: "menu"
                },
                {
                    path: 'media/edit/:id',
                    component: 'UpdateMedia',
                    title: 'Update Media',
                    protected: true,
                },
                {
                    path: 'mediacards',
                    component: 'MediaManagerCards',
                    title: 'Media Cards',
                    protected: true,
                    group: "menu"
                },
                {
                    path: 'albums',
                    component: 'AlbumList',
                    title: 'Albums',
                    protected: true,
                    group: "menu"
                },
                {
                    path: 'albums/:id',
                    component: 'AlbumDetail',
                    title: 'Album Detail',
                    protected: true,
                },
                {
                    path: 'users',
                    component: 'UserManagement',
                    title: 'Users',
                    protected: true,
                    group: "admin"
                },
                {
                    path: 'settings',
                    component: 'Settings',
                    title: 'Settings',
                    protected: true,
                    group: "admin"
                },
                {
                    path: '*',
                    component: 'NotFound',
                    title: 'Not Found',
                    protected: false,
                },
            ];

            setRoutes(appRoutes);
            setIsLoading(false);
        };

        loadRoutes();
    }, []);

    return (
        <RouteContext.Provider value={{ routes, isLoading, setRoutes }}>
            {children}
        </RouteContext.Provider>
    );
};