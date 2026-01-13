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
                    group: 'menu'
                },
                {
                    path: 'videos',
                    component: 'Videos',
                    title: 'Videos',
                    group: 'menu'
                },
                {
                    path: 'about',
                    component: 'About',
                    title: 'About',
                    group: 'menu'
                },
                {
                    path: 'login',
                    component: 'Login',
                    title: 'Login',
                },
                {
                    path: 'register',
                    component: 'Register',
                    title: 'Register',
                },
                {
                    path: 'profile',
                    component: 'Profile',
                    title: 'Profile',
                    roles: ['user'],
                },
                {
                    path: 'media',
                    component: 'MediaManager',
                    title: 'Media List',
                    group: 'menu',
                    roles: ['user'],
                },
                {
                    path: 'media/edit/:id',
                    component: 'UpdateMedia',
                    title: 'Update Media',
                    roles: ['user'],
                },
                {
                    path: 'mediacards',
                    component: 'MediaManagerCards',
                    title: 'Media Cards',
                    group: 'menu',
                    roles: ['user'],
                },
                {
                    path: 'albums',
                    component: 'AlbumList',
                    title: 'Albums',
                    group: 'menu',
                    roles: ['user'],
                },
                {
                    path: 'albums/:id',
                    component: 'AlbumDetail',
                    title: 'Album Detail',
                    roles: ['user'],
                },
                {
                    path: 'users',
                    component: 'UserManagement',
                    title: 'Users',
                    group: 'menu',
                    roles: ['admin'],
                },
                {
                    path: 'settings',
                    component: 'Settings',
                    title: 'Settings',
                    group: 'menu',
                    roles: ['admin'],
                },
                {
                    path: '*',
                    component: 'NotFound',
                    title: 'Not Found',
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