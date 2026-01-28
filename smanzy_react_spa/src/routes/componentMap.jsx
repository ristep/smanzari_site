import MainLayout from '@/layout/MainLayout';
import {
    Home, About, Login, Register, Profile, MediaManager,
    MediaUpload, UpdateMedia, NotFound, MediaCards, AlbumList,
    AlbumDetail, Videos, UserManagement, Settings
} from '@/pages';

export const ComponentMap = {
    // Layouts
    MainLayout: <MainLayout />,

    // Pages
    Home: <Home />,
    Videos: <Videos />,
    About: <About />,
    Login: <Login />,
    Register: <Register />,
    Profile: <Profile />,
    MediaManager: <MediaManager />,
    MediaUpload: <MediaUpload />,
    UpdateMedia: <UpdateMedia />,
    MediaCards: <MediaCards />,
    AlbumList: <AlbumList />,
    AlbumDetail: <AlbumDetail />,
    UserManagement: <UserManagement />,
    Settings: <Settings />,

    // System
    NotFound: <NotFound />
};