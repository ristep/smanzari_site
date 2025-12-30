import styles from './index.module.scss';

export default function About() {
    return (
        <div className={styles.container}>
            <h1 className={styles.title}>About Smanzy</h1>
            <div className={styles.content}>
                <p>
                    Smanzy is a demonstration of modern web architecture, combining the performance
                    of a Go backend with the interactivity of a React frontend.
                </p>
                <p>
                    <strong>Tech Stack:</strong>
                </p>
                <ul className={styles.list}>
                    <li>Backend: Go (Golang), Gin, GORM, PostgreSQL</li>
                    <li>Frontend: React, Vite, SCSS Modules, TanStack Query</li>
                    <li>Authentication: JWT (JSON Web Tokens)</li>
                </ul>
            </div>
        </div>
    );
}
