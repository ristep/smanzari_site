import { createBrowserRouter } from 'react-router-dom';
import MainLayout from '@/layout/MainLayout';

import { Home, About, Login, Register, Profile, MediaManager, UpdateMedia, NotFound, MediaManagerCards, AlbumList, AlbumDetail, Videos, UserManagement, SiteAdmin } from '@/pages';

const NavElements = [
    {
        path: '',
        element: <Home />,
        title: 'Home',
    },
    {
        path: 'videos',
        element: <Videos />,
        title: 'Videos',
    },
    {
        path: 'about',
        element: <About />,
        title: 'About',
    },
    {
        path: 'login',
        element: <Login />,
        title: 'Login',
    },
    {
        path: 'register',
        element: <Register />,
        title: 'Register',
    },
    {
        path: 'profile',
        element: <Profile />,
        title: 'Profile',
    },
    {
        path: 'media',
        element: <MediaManager />,
        title: 'Media',
    },
    {
        path: 'media/edit/:id',
        element: <UpdateMedia />,
        title: 'Update Media',
    },
    {
        path: 'mediacards',
        element: <MediaManagerCards />,
        title: 'Media Cards',
    },
    {
        path: 'albums',
        element: <AlbumList />,
        title: 'Albums',
    },
    {
        path: 'albums/:id',
        element: <AlbumDetail />,
        title: 'Album Detail',
    },
    {
        path: 'users',
        element: <UserManagement />,
        title: 'Users',
    },
    {
        path: 'siteadmin',
        element: <SiteAdmin />,
        title: 'Site Admin',
    },
    {
        path: '*',
        element: <NotFound />,
        title: 'Not Found',
    },
];

const router = createBrowserRouter([
    {
        path: '/',
        element: <MainLayout />,
        errorElement: <NotFound />, // Shows 404 for route errors too
        children: [
            {
                path: '',
                element: <Home />,
                title: 'Home',
            },
            {
                path: 'videos',
                element: <Videos />,
                title: 'Videos',
            },
            {
                path: 'about',
                element: <About />,
                title: 'About',
            },
            {
                path: 'login',
                element: <Login />,
                title: 'Login',
            },
            {
                path: 'register',
                element: <Register />,
                title: 'Register',
            },
            {
                path: 'profile',
                element: <Profile />,
                title: 'Profile',
            },
            {
                path: 'media',
                element: <MediaManager />,
                title: 'Media',
            },
            {
                path: 'media/edit/:id',
                element: <UpdateMedia />,
                title: 'Update Media',
            },
            {
                path: 'mediacards',
                element: <MediaManagerCards />,
                title: 'Media Cards',
            },
            {
                path: 'albums',
                element: <AlbumList />,
                title: 'Albums',
            },
            {
                path: 'albums/:id',
                element: <AlbumDetail />,
                title: 'Album Detail',
            },
            {
                path: 'users',
                element: <UserManagement />,
                title: 'Users',
            },
            {
                path: 'siteadmin',
                element: <SiteAdmin />,
                title: 'Site Admin',
            },
            {
                path: '*',
                element: <NotFound />,
                title: 'Not Found',
            },
        ],
    },
]);

export default router;
