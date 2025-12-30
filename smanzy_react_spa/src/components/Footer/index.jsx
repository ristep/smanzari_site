import styles from './index.module.scss';

export default function Footer() {
    return (
        <footer className={styles.footer}>
            <p>&copy; {new Date().getFullYear()} SmAnZaRy</p>
            <p>
                <a
                    href="https://www.youtube.com/@smanzary"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    https://www.youtube.com/@smanzary
                </a>
            </p>
        </footer>
    );
}
