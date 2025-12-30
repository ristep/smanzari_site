import { Outlet } from 'react-router-dom';
import { Navbar, Footer } from '@/components';

import styles from './MainLayout.module.scss';

export default function MainLayout() {
    return (
        <div className={styles.layout}>
            <Navbar />
            <main className={styles.main}>
                <Outlet />
            </main>
            <Footer />
        </div>
    );
}
