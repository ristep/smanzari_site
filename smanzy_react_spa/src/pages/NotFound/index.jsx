import { Link } from 'react-router-dom';

import styles from './index.module.scss';

export default function NotFound() {
    return (
        <div className={styles.container}>
            <h1 className={styles.errorCode}>404</h1>
            <p className={styles.message}>Page not found.</p>
            <Link
                to="/"
                className={styles.link}
            >
                Go back home
            </Link>
        </div>
    );
}
